#!/usr/bin/env python3
"""ND Attire image pipeline.

    source-images/{products,brand}/*.jpg
      -> clean overlays (OCR text + Instagram icon corner, inpaint or crop fallback)
      -> Real-ESRGAN x4plus upscale (CPU, ncnn)
      -> light sharpen, contrast/vibrance lift, subtle warm grade
      -> subject-aware 4:5 crop
      -> scripts/output/processed/<group>/<slug>.png  (+ manifest.json)
    then `node scripts/export-images.mjs` writes AVIF/WebP into public/images
    and blur placeholders into src/data/image-meta.json, and a review sheet.

If `source-images/originals/<slug>.*` exists, it is used instead and the
cleaning + upscaling steps are skipped (client originals are always preferred).

Usage:
    python scripts/process-images.py            # everything
    python scripts/process-images.py hp-sky     # only these slugs

Environment notes: the brief asked for EasyOCR + LaMa (IOPaint). Their model
weights download from GitHub/HuggingFace, which may be blocked. This script uses
models that ship inside PyPI wheels instead:
  * text detection: RapidOCR (PP-OCRv4 ONNX, bundled)
  * inpainting:     OpenCV xphoto Frequency Selective Reconstruction
  * upscaling:      Real-ESRGAN x4plus weights from `realesrgan-ncnn-py`, run
                    on CPU through pyncnn (see esrgan_cpu.py)
If IOPaint can run (`iopaint` on PATH and its LaMa weights cached), it is used
for inpainting automatically.
"""
from __future__ import annotations

import json
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

import cv2
import numpy as np

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "source-images"
OUT = ROOT / "scripts" / "output"
PROCESSED = OUT / "processed"
sys.path.insert(0, str(Path(__file__).resolve().parent))

ASPECT = 4 / 5  # width / height
DILATE_PX = 6

# Per-image decisions made after reviewing scripts/output/review.html.
#   trim:  [top, right, bottom, left] fraction of the source to discard first
#          (strips of a neighbouring Instagram tile, banners, etc.)
#   mode:  "inpaint" | "crop" — force a cleaning strategy
#   focus: [x, y] 0..1 preferred crop centre when saliency gets it wrong
#   keep_corner: don't mask the top-right icon corner (no icon there)
#   extra_mask: [[x0, y0, x1, y1], ...] fractions to clean that OCR missed
OVERRIDES: dict[str, dict] = {}
OVERRIDES_FILE = Path(__file__).resolve().parent / "image-overrides.json"
if OVERRIDES_FILE.exists():
    OVERRIDES = json.loads(OVERRIDES_FILE.read_text())


# --------------------------------------------------------------------------- #
# detection
# --------------------------------------------------------------------------- #
_ocr = None


def detect_text_mask(bgr: np.ndarray) -> tuple[np.ndarray, list[str]]:
    global _ocr
    if _ocr is None:
        from rapidocr_onnxruntime import RapidOCR

        _ocr = RapidOCR(det_box_thresh=0.3, det_unclip_ratio=1.8)
    h, w = bgr.shape[:2]
    mask = np.zeros((h, w), np.uint8)
    words: list[str] = []
    # small sources: detect on a 2x copy, which finds far more of the text
    scale = 2 if max(h, w) < 900 else 1
    big = cv2.resize(bgr, None, fx=scale, fy=scale, interpolation=cv2.INTER_CUBIC)
    res, _ = _ocr(big)
    for box, text, _score in res or []:
        pts = (np.array(box, np.float32) / scale).astype(np.int32)
        cv2.fillPoly(mask, [pts], 255)
        words.append(text)
    return mask, words


def corner_mask(h: int, w: int) -> np.ndarray:
    """Top-right corner where Instagram play / pin / carousel icons sit."""
    m = np.zeros((h, w), np.uint8)
    cw = int(round(w * 0.18))
    ch = int(round(h * 0.14))
    m[:ch, w - cw:] = 255
    return m


def texture_score(gray: np.ndarray, mask: np.ndarray) -> float:
    """How busy the fabric around the mask is (high = inpainting will smear)."""
    if mask.max() == 0:
        return 0.0
    ring = cv2.dilate(mask, np.ones((15, 15), np.uint8)) & ~mask
    lap = cv2.Laplacian(gray, cv2.CV_32F)
    return float(np.abs(lap)[ring > 0].mean())


# --------------------------------------------------------------------------- #
# cleaning
# --------------------------------------------------------------------------- #
def inpaint(bgr: np.ndarray, mask: np.ndarray) -> tuple[np.ndarray, str]:
    if shutil.which("iopaint"):
        try:
            with tempfile.TemporaryDirectory() as td:
                ip, mp, op = Path(td, "i.png"), Path(td, "m.png"), Path(td, "out")
                cv2.imwrite(str(ip), bgr)
                cv2.imwrite(str(mp), mask)
                subprocess.run(
                    ["iopaint", "run", "--model=lama", "--device=cpu",
                     f"--image={ip}", f"--mask={mp}", f"--output={op}"],
                    check=True, capture_output=True, timeout=600,
                )
                out = cv2.imread(str(op / "i.png"))
                if out is not None:
                    return out, "lama"
        except Exception:  # noqa: BLE001 — fall through to OpenCV
            pass
    # FSR misbehaves where the mask touches the border (it bleeds a green seam),
    # so inpaint a reflect-padded copy and crop back
    P = 24
    src = cv2.copyMakeBorder(bgr, P, P, P, P, cv2.BORDER_REFLECT_101)
    m = cv2.copyMakeBorder(mask, P, P, P, P, cv2.BORDER_REFLECT_101)
    dst = np.zeros_like(src)
    # FSR wants the mask inverted: 0 = missing pixels
    cv2.xphoto.inpaint(src, 255 - m, dst, cv2.xphoto.INPAINT_FSR_BEST)
    return dst[P:-P, P:-P], "fsr"


def best_clean_window(mask: np.ndarray, min_frac: float) -> tuple[int, int, int, int] | None:
    """Largest 4:5 window that contains no masked pixel, if big enough."""
    h, w = mask.shape
    full_h = min(h, int(w / ASPECT))
    integral = cv2.integral((mask > 0).astype(np.uint8))

    def clear(x, y, ww, hh):
        s = integral[y + hh, x + ww] - integral[y, x + ww] - integral[y + hh, x] + integral[y, x]
        return s == 0

    for hh in range(full_h, int(full_h * min_frac ** 0.5) - 1, -4):
        ww = int(round(hh * ASPECT))
        if ww > w:
            continue
        best = None
        for y in range(0, h - hh + 1, 2):
            for x in range(0, w - ww + 1, 2):
                if clear(x, y, ww, hh):
                    # prefer windows nearest the image centre
                    d = abs(x + ww / 2 - w / 2) + abs(y + hh / 2 - h / 2)
                    if best is None or d < best[0]:
                        best = (d, (x, y, ww, hh))
        if best:
            return best[1]
    return None


# --------------------------------------------------------------------------- #
# grading + crop
# --------------------------------------------------------------------------- #
def grade(bgr: np.ndarray) -> np.ndarray:
    img = bgr.astype(np.float32) / 255.0
    # light unsharp mask
    blur = cv2.GaussianBlur(img, (0, 0), 1.4)
    img = np.clip(img + 0.35 * (img - blur), 0, 1)
    # gentle contrast (S-curve around mid grey)
    img = np.clip(0.5 + (img - 0.5) * 1.05, 0, 1)
    # vibrance: lift saturation of muted pixels only, cap so fabric stays true
    hsv = cv2.cvtColor((img * 255).astype(np.uint8), cv2.COLOR_BGR2HSV).astype(np.float32)
    s = hsv[..., 1] / 255.0
    s = s + 0.08 * (1 - s) * s
    hsv[..., 1] = np.clip(s * 255, 0, 255)
    img = cv2.cvtColor(hsv.astype(np.uint8), cv2.COLOR_HSV2BGR).astype(np.float32) / 255.0
    # subtle warm grade (shared across the catalogue for consistency)
    img[..., 2] *= 1.012
    img[..., 0] *= 0.988
    return (np.clip(img, 0, 1) * 255).round().astype(np.uint8)


def crop_4x5(bgr: np.ndarray, focus: list[float] | None) -> np.ndarray:
    h, w = bgr.shape[:2]
    if w / h > ASPECT:  # too wide: crop width
        cw, ch = int(round(h * ASPECT)), h
    else:
        cw, ch = w, int(round(w / ASPECT))
    if focus:
        cx, cy = focus[0] * w, focus[1] * h
    else:
        sal = cv2.saliency.StaticSaliencySpectralResidual_create()
        small = cv2.resize(bgr, (128, int(128 * h / w)))
        ok, smap = sal.computeSaliency(small)
        smap = cv2.resize(smap.astype(np.float32), (w, h))
        smap = cv2.GaussianBlur(smap, (0, 0), w / 20)
        tot = smap.sum() or 1
        ys, xs = np.mgrid[0:h, 0:w]
        cx, cy = (smap * xs).sum() / tot, (smap * ys).sum() / tot
        # bias slightly upward: faces and folded fabric tops matter most
        cy = cy * 0.85 + h * 0.5 * 0.15 - h * 0.03
    x = int(np.clip(cx - cw / 2, 0, w - cw))
    y = int(np.clip(cy - ch / 2, 0, h - ch))
    return bgr[y:y + ch, x:x + cw]


# --------------------------------------------------------------------------- #
def process(group: str, path: Path) -> dict:
    slug = path.stem
    ov = OVERRIDES.get(slug, {})
    info: dict = {"slug": slug, "group": group, "source": str(path.relative_to(ROOT)), "flags": []}

    originals = sorted((SRC / "originals").glob(f"{slug}.*"))
    if originals:
        bgr = cv2.imread(str(originals[0]))
        info.update(source=str(originals[0].relative_to(ROOT)), mode="original")
        out = grade(bgr)
    else:
        bgr = cv2.imread(str(path))
        h, w = bgr.shape[:2]
        # default: drop a hairline on the right, where the neighbouring Instagram tile bleeds in
        t, r, b, l = ov.get("trim", [0, 0.015, 0, 0])
        bgr = bgr[int(h * t): h - int(h * b), int(w * l): w - int(w * r)]
        h, w = bgr.shape[:2]
        info["source_size"] = [w, h]

        tmask, words = detect_text_mask(bgr)
        info["text"] = words
        mask = tmask.copy()
        if not ov.get("keep_corner"):
            mask |= corner_mask(h, w)
        for x0, y0, x1, y1 in ov.get("extra_mask", []):  # text OCR misses (emoji etc.)
            mask[int(y0 * h):int(y1 * h), int(x0 * w):int(x1 * w)] = 255
        mask = cv2.dilate(mask, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (2 * DILATE_PX + 1,) * 2))
        info["mask_pct"] = round(100 * float((mask > 0).mean()), 1)
        gray = cv2.cvtColor(bgr, cv2.COLOR_BGR2GRAY)
        info["texture"] = round(texture_score(gray, mask), 1)

        mode = ov.get("mode")
        if mode is None:
            # Busy fabric under a big mask smears; prefer a clean crop if one exists.
            risky = info["mask_pct"] > 14 or (info["texture"] > 14 and info["mask_pct"] > 6)
            mode = "crop" if risky else "inpaint"
        win = None
        if mode == "crop":
            win = best_clean_window(mask, ov.get("min_crop", 0.45))
            if win is None:
                info["flags"].append("crop fallback found no clean window; inpainted instead")
                mode = "inpaint"
        if mode == "crop":
            x, y, ww, hh = win
            bgr = bgr[y:y + hh, x:x + ww]
            mask = mask[y:y + hh, x:x + ww]
            info["flags"].append(f"crop fallback: kept {round(100 * ww * hh / (w * h))}% of frame")
        if mask.max() > 0:
            bgr, engine = inpaint(bgr, mask)
            info["inpaint"] = engine
            if mode == "inpaint" and info["texture"] > 14 and info["mask_pct"] > 6:
                info["flags"].append("inpainted over patterned fabric; check for smears")
        info["mode"] = mode
        cv2.imwrite(str(OUT / "masks" / f"{slug}.png"), mask)

        import esrgan_cpu

        rgb = cv2.cvtColor(bgr, cv2.COLOR_BGR2RGB)
        up = cv2.cvtColor(esrgan_cpu.upscale(rgb), cv2.COLOR_RGB2BGR)
        out = grade(up)

    out = crop_4x5(out, ov.get("focus"))
    info["output_size"] = [int(out.shape[1]), int(out.shape[0])]
    if max(out.shape[:2]) < 1600:
        info["flags"].append(f"below 1600px after 4x ({out.shape[0]}px tall); resized up on export")
    dest = PROCESSED / group / f"{slug}.png"
    dest.parent.mkdir(parents=True, exist_ok=True)
    cv2.imwrite(str(dest), out)
    return info


def main() -> None:
    only = set(sys.argv[1:])
    (OUT / "masks").mkdir(parents=True, exist_ok=True)
    manifest_path = OUT / "manifest.json"
    manifest = json.loads(manifest_path.read_text()) if manifest_path.exists() else {}
    jobs = [("products", p) for p in sorted((SRC / "products").glob("*.jpg"))]
    jobs += [("brand", p) for p in sorted((SRC / "brand").glob("*.jpg"))]
    for group, p in jobs:
        if only and p.stem not in only:
            continue
        print(f"→ {group}/{p.stem}", flush=True)
        info = process(group, p)
        manifest[p.stem] = info
        for f in info["flags"]:
            print(f"    ! {f}")
        manifest_path.write_text(json.dumps(manifest, indent=2, ensure_ascii=False))
    subprocess.run(["node", str(ROOT / "scripts" / "export-images.mjs")], check=True, cwd=ROOT)


if __name__ == "__main__":
    main()

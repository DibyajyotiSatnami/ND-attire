"""Real-ESRGAN x4plus on CPU via ncnn (no Vulkan / no GPU needed).

The weights ship inside the `realesrgan-ncnn-py` wheel on PyPI, so this works in
environments where GitHub release downloads are blocked.
"""
import os
import numpy as np
import importlib.util
import ncnn

# Locate the package without importing it (its own GPU wrapper needs libomp/Vulkan).
MODEL_DIR = os.path.join(
    os.path.dirname(importlib.util.find_spec("realesrgan_ncnn_py").origin), "models"
)
MODEL = "realesrgan-x4plus"
SCALE = 4
TILE = 128
PAD = 10

_net = None


def _load():
    global _net
    if _net is None:
        net = ncnn.Net()
        net.opt.use_vulkan_compute = False
        net.opt.num_threads = os.cpu_count() or 4
        net.load_param(os.path.join(MODEL_DIR, f"{MODEL}.param"))
        net.load_model(os.path.join(MODEL_DIR, f"{MODEL}.bin"))
        _net = net
    return _net


def _run(tile_rgb: np.ndarray) -> np.ndarray:
    net = _load()
    x = np.ascontiguousarray(tile_rgb.transpose(2, 0, 1).astype(np.float32) / 255.0)
    ex = net.create_extractor()
    ex.input("data", ncnn.Mat(x))
    _, out = ex.extract("output")
    y = np.array(out).transpose(1, 2, 0)
    return np.clip(y * 255.0, 0, 255).round().astype(np.uint8)


def upscale(rgb: np.ndarray) -> np.ndarray:
    """Upscale an HxWx3 uint8 RGB array 4x with overlapping tiles."""
    h, w, _ = rgb.shape
    out = np.zeros((h * SCALE, w * SCALE, 3), np.uint8)
    for y0 in range(0, h, TILE):
        for x0 in range(0, w, TILE):
            y1, x1 = min(y0 + TILE, h), min(x0 + TILE, w)
            py0, px0 = max(y0 - PAD, 0), max(x0 - PAD, 0)
            py1, px1 = min(y1 + PAD, h), min(x1 + PAD, w)
            res = _run(rgb[py0:py1, px0:px1])
            oy, ox = (y0 - py0) * SCALE, (x0 - px0) * SCALE
            out[y0 * SCALE:y1 * SCALE, x0 * SCALE:x1 * SCALE] = res[oy:oy + (y1 - y0) * SCALE, ox:ox + (x1 - x0) * SCALE]
    return out

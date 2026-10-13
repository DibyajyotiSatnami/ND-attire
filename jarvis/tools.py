"""Everything Jarvis can do on the PC.

Each tool is a plain function plus a JSON schema. Tools marked `risky` (or whose
`risky` check returns True for the given input) are held until you say "yes" —
see Brain._run_tool in brain.py.

To add a new ability: write a function, then add a Tool(...) entry to TOOLS.
"""

import base64
import io
import json
import os
import platform
import shutil
import subprocess
import webbrowser
from dataclasses import dataclass
from datetime import datetime
from pathlib import Path
from typing import Any, Callable

import config

IS_WINDOWS = platform.system() == "Windows"

# pyautogui / pyperclip / psutil need a desktop session; import lazily so the
# rest of Jarvis still works (and can be tested) without them.


def _gui():
    import pyautogui

    pyautogui.FAILSAFE = True  # slam the mouse into a screen corner to abort
    return pyautogui


@dataclass
class Tool:
    name: str
    description: str
    schema: dict
    func: Callable[..., Any]
    risky: bool | Callable[[dict], bool] = False

    def is_risky(self, args: dict) -> bool:
        return self.risky(args) if callable(self.risky) else self.risky

    def definition(self) -> dict:
        return {
            "name": self.name,
            "description": self.description,
            "input_schema": {
                "type": "object",
                "properties": self.schema,
                "required": [k for k, v in self.schema.items() if not v.get("optional")],
            },
        }


# ---------------------------------------------------------------- apps & web

# Friendly names -> what to launch. Add your own (e.g. "tally": r"C:\Tally\tally.exe").
APP_ALIASES = {
    "chrome": "chrome",
    "edge": "msedge",
    "notepad": "notepad",
    "calculator": "calc",
    "paint": "mspaint",
    "explorer": "explorer",
    "file explorer": "explorer",
    "cmd": "cmd",
    "terminal": "wt",
    "powershell": "powershell",
    "word": "winword",
    "excel": "excel",
    "powerpoint": "powerpnt",
    "vs code": "code",
    "vscode": "code",
    "spotify": "spotify:",
    "whatsapp": "whatsapp:",
    "settings": "ms-settings:",
    "camera": "microsoft.windows.camera:",
    "task manager": "taskmgr",
}


def open_app(name: str) -> str:
    target = APP_ALIASES.get(name.lower().strip(), name)
    if IS_WINDOWS:
        # `start` resolves App Paths, protocol handlers (spotify:) and file paths.
        subprocess.Popen(f'start "" "{target}"', shell=True)
    else:
        subprocess.Popen(["xdg-open" if not target.startswith("/") else target, target])
    return f"Launched {name}."


def open_url(url: str) -> str:
    if not url.startswith(("http://", "https://")):
        url = "https://" + url
    webbrowser.open(url)
    return f"Opened {url}."


def youtube_play(query: str) -> str:
    from urllib.parse import quote_plus

    webbrowser.open(f"https://www.youtube.com/results?search_query={quote_plus(query)}")
    return "Opened YouTube search results. Use screenshot + click to pick a video if asked to play one."


# ---------------------------------------------------------------- files

def _path(p: str) -> Path:
    return Path(os.path.expandvars(os.path.expanduser(p))).resolve()


def list_folder(path: str) -> str:
    folder = _path(path)
    if not folder.is_dir():
        return f"Not a folder: {folder}"
    rows = []
    for entry in sorted(folder.iterdir(), key=lambda e: (not e.is_dir(), e.name.lower()))[:200]:
        kind = "DIR " if entry.is_dir() else f"{entry.stat().st_size:>10,}"
        rows.append(f"{kind}  {entry.name}")
    return f"{folder}\n" + "\n".join(rows) if rows else f"{folder} is empty."


def read_file(path: str) -> str:
    f = _path(path)
    text = f.read_text(encoding="utf-8", errors="replace")
    return text[:30000] + ("\n...[truncated]" if len(text) > 30000 else "")


def write_file(path: str, content: str) -> str:
    f = _path(path)
    f.parent.mkdir(parents=True, exist_ok=True)
    f.write_text(content, encoding="utf-8")
    return f"Wrote {len(content)} characters to {f}."


def _overwrites(args: dict) -> bool:
    return _path(args.get("path", "")).exists()


def move_path(source: str, destination: str) -> str:
    shutil.move(str(_path(source)), str(_path(destination)))
    return f"Moved {source} -> {destination}."


def delete_path(path: str) -> str:
    target = _path(path)
    if IS_WINDOWS:
        # Send to Recycle Bin so mistakes can be undone.
        from send2trash import send2trash

        send2trash(str(target))
        return f"Moved {target} to the Recycle Bin."
    if target.is_dir():
        shutil.rmtree(target)
    else:
        target.unlink()
    return f"Deleted {target}."


def open_file(path: str) -> str:
    target = _path(path)
    if IS_WINDOWS:
        os.startfile(target)  # type: ignore[attr-defined]
    else:
        subprocess.Popen(["xdg-open", str(target)])
    return f"Opened {target}."


def find_files(name_contains: str, folder: str = "~") -> str:
    root = _path(folder)
    needle = name_contains.lower()
    hits = []
    for dirpath, dirnames, filenames in os.walk(root):
        dirnames[:] = [d for d in dirnames if not d.startswith((".", "$")) and d not in ("node_modules", "AppData")]
        for n in filenames + dirnames:
            if needle in n.lower():
                hits.append(os.path.join(dirpath, n))
                if len(hits) >= 50:
                    return "\n".join(hits) + "\n...(first 50 matches)"
    return "\n".join(hits) or "No matches."


# ---------------------------------------------------------------- shell

def run_command(command: str, timeout_seconds: int = 60) -> str:
    shell = ["powershell", "-NoProfile", "-Command", command] if IS_WINDOWS else ["bash", "-lc", command]
    try:
        out = subprocess.run(shell, capture_output=True, text=True, timeout=timeout_seconds)
    except subprocess.TimeoutExpired:
        return f"Timed out after {timeout_seconds}s."
    result = (out.stdout + ("\n[stderr]\n" + out.stderr if out.stderr.strip() else "")).strip()
    return f"exit code {out.returncode}\n{result[:15000]}"


# ---------------------------------------------------------------- keyboard, mouse, screen

_last_scale = 1.0  # screenshot pixels -> real screen pixels


def screenshot() -> list[dict]:
    global _last_scale
    from PIL import Image  # noqa: F401  (pyautogui returns a PIL image)

    img = _gui().screenshot()
    max_w = 1366
    _last_scale = img.width / max_w if img.width > max_w else 1.0
    if _last_scale != 1.0:
        img = img.resize((max_w, round(img.height / _last_scale)))
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return [
        {"type": "text", "text": f"Screenshot is {img.width}x{img.height}. Use these coordinates for click."},
        {"type": "image", "source": {"type": "base64", "media_type": "image/png", "data": base64.b64encode(buf.getvalue()).decode()}},
    ]


def click(x: int, y: int, button: str = "left", double: bool = False) -> str:
    g = _gui()
    rx, ry = round(x * _last_scale), round(y * _last_scale)
    g.click(rx, ry, clicks=2 if double else 1, button=button)
    return f"Clicked {button} at ({x}, {y})."


def type_text(text: str) -> str:
    import pyperclip

    # Paste via clipboard: handles Hindi/Odia/emoji, which pyautogui.write can't.
    old = pyperclip.paste()
    pyperclip.copy(text)
    _gui().hotkey("ctrl", "v")
    pyperclip.copy(old)
    return f"Typed {len(text)} characters."


def press_keys(keys: str) -> str:
    """keys like 'enter', 'ctrl+s', 'alt+tab', 'win+d'."""
    parts = [k.strip().lower() for k in keys.split("+")]
    _gui().hotkey(*parts)
    return f"Pressed {keys}."


def media_control(action: str) -> str:
    keymap = {
        "play_pause": "playpause", "next": "nexttrack", "previous": "prevtrack",
        "volume_up": "volumeup", "volume_down": "volumedown", "mute": "volumemute",
    }
    presses = 5 if action in ("volume_up", "volume_down") else 1
    _gui().press(keymap[action], presses=presses)
    return f"Done: {action}."


# ---------------------------------------------------------------- system

def system_info() -> str:
    import psutil

    info = {
        "time": datetime.now().strftime("%A %d %B %Y, %I:%M %p"),
        "cpu_percent": psutil.cpu_percent(interval=0.5),
        "ram_percent": psutil.virtual_memory().percent,
        "disk_free_gb": round(psutil.disk_usage(os.path.expanduser("~")).free / 1e9, 1),
    }
    battery = psutil.sensors_battery()
    if battery:
        info["battery_percent"] = battery.percent
        info["charging"] = battery.power_plugged
    return json.dumps(info)


def power(action: str) -> str:
    if not IS_WINDOWS:
        return "Power actions are only wired up for Windows."
    commands = {
        "lock": "rundll32.exe user32.dll,LockWorkStation",
        "sleep": "rundll32.exe powrprof.dll,SetSuspendState 0,1,0",
        "shutdown": "shutdown /s /t 10",
        "restart": "shutdown /r /t 10",
        "cancel_shutdown": "shutdown /a",
    }
    subprocess.Popen(commands[action], shell=True)
    return f"{action} started." + (" (10 seconds — say 'cancel shutdown' to stop it)" if action in ("shutdown", "restart") else "")


def clipboard(action: str, text: str = "") -> str:
    import pyperclip

    if action == "read":
        return pyperclip.paste()[:10000] or "(clipboard is empty)"
    pyperclip.copy(text)
    return "Copied to clipboard."


def notify(title: str, message: str) -> str:
    """Windows toast notification."""
    from plyer import notification

    notification.notify(title=title, message=message, app_name="Jarvis", timeout=8)
    return "Notification shown."


# ---------------------------------------------------------------- memory

def load_memory() -> list[str]:
    try:
        return json.loads(config.MEMORY_FILE.read_text(encoding="utf-8"))
    except (FileNotFoundError, json.JSONDecodeError):
        return []


def remember(fact: str) -> str:
    facts = load_memory()
    facts.append(fact)
    config.MEMORY_FILE.write_text(json.dumps(facts, indent=2, ensure_ascii=False), encoding="utf-8")
    return "Saved to long-term memory."


def forget(fact_contains: str) -> str:
    facts = load_memory()
    kept = [f for f in facts if fact_contains.lower() not in f.lower()]
    config.MEMORY_FILE.write_text(json.dumps(kept, indent=2, ensure_ascii=False), encoding="utf-8")
    return f"Forgot {len(facts) - len(kept)} item(s)."


# ---------------------------------------------------------------- registry

def _s(desc: str, type_: str = "string", optional: bool = False, **extra) -> dict:
    d = {"type": type_, "description": desc, **extra}
    if optional:
        d["optional"] = True
    return d


TOOLS: list[Tool] = [
    Tool("open_app", "Open an application by name (chrome, notepad, word, excel, spotify, whatsapp, settings, vs code...) or a full .exe path.",
         {"name": _s("App name or path")}, open_app),
    Tool("open_url", "Open a website in the default browser.", {"url": _s("URL or domain")}, open_url),
    Tool("youtube_play", "Search YouTube for a song/video in the browser.", {"query": _s("What to search for")}, youtube_play),
    Tool("list_folder", "List files in a folder. Use ~ for the user's home, e.g. ~/Desktop, ~/Downloads, ~/Documents.",
         {"path": _s("Folder path")}, list_folder),
    Tool("find_files", "Search for files/folders whose name contains some text.",
         {"name_contains": _s("Part of the name"), "folder": _s("Where to search (default ~)", optional=True)}, find_files),
    Tool("read_file", "Read a text file.", {"path": _s("File path")}, read_file),
    Tool("open_file", "Open a file with its default app (PDF, photo, video, document...).", {"path": _s("File path")}, open_file),
    Tool("write_file", "Create or overwrite a text file. Overwriting an existing file needs confirmation.",
         {"path": _s("File path"), "content": _s("Full file contents")}, write_file, risky=_overwrites),
    Tool("move_path", "Move or rename a file/folder.", {"source": _s("From"), "destination": _s("To")}, move_path, risky=True),
    Tool("delete_path", "Delete a file/folder (to the Recycle Bin on Windows).", {"path": _s("Path")}, delete_path, risky=True),
    Tool("run_command", "Run a PowerShell command on the PC and get its output. Use for anything no other tool covers (installing apps, wifi, processes, settings).",
         {"command": _s("PowerShell command"), "timeout_seconds": _s("Default 60", "integer", optional=True)}, run_command, risky=True),
    Tool("screenshot", "Take a screenshot to see what is on the screen right now.", {}, screenshot),
    Tool("click", "Click at a position on the screen, in the coordinates of the latest screenshot.",
         {"x": _s("X", "integer"), "y": _s("Y", "integer"),
          "button": _s("left or right", optional=True, enum=["left", "right"]),
          "double": _s("Double-click", "boolean", optional=True)}, click),
    Tool("type_text", "Type text into whatever window is focused.", {"text": _s("Text to type")}, type_text),
    Tool("press_keys", "Press a key or shortcut, e.g. 'enter', 'ctrl+s', 'alt+tab', 'win+d', 'alt+f4'.", {"keys": _s("Keys joined with +")}, press_keys),
    Tool("media_control", "Control music/video playback and volume.",
         {"action": _s("Action", enum=["play_pause", "next", "previous", "volume_up", "volume_down", "mute"])}, media_control),
    Tool("system_info", "Get time, battery, CPU, RAM and disk space.", {}, system_info),
    Tool("power", "Lock, sleep, shut down or restart the PC.",
         {"action": _s("Action", enum=["lock", "sleep", "shutdown", "restart", "cancel_shutdown"])}, power,
         risky=lambda a: a.get("action") in ("shutdown", "restart", "sleep")),
    Tool("clipboard", "Read or set the clipboard.", {"action": _s("read or write", enum=["read", "write"]), "text": _s("Text to copy (for write)", optional=True)}, clipboard),
    Tool("notify", "Show a Windows notification.", {"title": _s("Title"), "message": _s("Message")}, notify),
    Tool("remember", "Save a fact about the user to long-term memory (preferences, names, paths, routines).", {"fact": _s("The fact")}, remember),
    Tool("forget", "Remove facts from long-term memory.", {"fact_contains": _s("Text the fact contains")}, forget),
]

TOOLS_BY_NAME = {t.name: t for t in TOOLS}


def api_tool_definitions() -> list[dict]:
    defs = []
    for t in TOOLS:
        d = t.definition()
        d["input_schema"]["properties"] = {
            k: {kk: vv for kk, vv in v.items() if kk != "optional"} for k, v in t.schema.items()
        }
        defs.append(d)  # "optional" is our own marker; the API must not see it
    # Anthropic-hosted web search: news, weather, prices, facts.
    defs.append({"type": "web_search_20260209", "name": "web_search", "max_uses": 5})
    return defs

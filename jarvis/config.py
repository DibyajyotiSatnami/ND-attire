"""Settings, read from jarvis/.env (copy .env.example to .env and fill it in)."""

import os
from pathlib import Path

from dotenv import load_dotenv

HERE = Path(__file__).resolve().parent
load_dotenv(HERE / ".env")

MODEL = os.getenv("JARVIS_MODEL", "claude-opus-5-5")
# low = fastest replies (good for voice); medium/high = more careful on multi-step jobs.
EFFORT = os.getenv("JARVIS_EFFORT", "low")
USER_NAME = os.getenv("JARVIS_USER_NAME", "sir")
CITY = os.getenv("JARVIS_CITY", "")

# Phone remote (web page + iOS Shortcut)
SERVER_HOST = os.getenv("JARVIS_HOST", "0.0.0.0")
SERVER_PORT = int(os.getenv("JARVIS_PORT", "8765"))
TOKEN = os.getenv("JARVIS_TOKEN", "")

# Voice
WAKE_WORD = os.getenv("JARVIS_WAKE_WORD", "jarvis").lower()
VOICE_ENABLED = os.getenv("JARVIS_VOICE", "1") == "1"

MEMORY_FILE = HERE / "memory.json"
LOG_FILE = HERE / "jarvis.log"

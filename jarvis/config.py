"""Settings, read from jarvis/.env (copy .env.example to .env and fill it in)."""

import os
from pathlib import Path

from dotenv import load_dotenv

HERE = Path(__file__).resolve().parent
load_dotenv(HERE / ".env")

# Which brain: "ollama" (free, runs on this PC) or "claude" (Anthropic API key, smarter).
BRAIN = os.getenv("JARVIS_BRAIN", "ollama").lower()

# Ollama
OLLAMA_URL = os.getenv("OLLAMA_URL", "http://localhost:11434").rstrip("/")
OLLAMA_MODEL = os.getenv("JARVIS_OLLAMA_MODEL", "qwen2.5:7b")
# Optional model that can see images, used to read the screen (e.g. gemma3:4b). Empty = off.
VISION_MODEL = os.getenv("JARVIS_VISION_MODEL", "")
OLLAMA_CONTEXT = int(os.getenv("JARVIS_OLLAMA_CONTEXT", "8192"))

# Claude
CLAUDE_MODEL = os.getenv("JARVIS_CLAUDE_MODEL", "claude-opus-5-5")
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

"""Jarvis's brain: an AI model + tools, with a confirmation gate on risky actions.

Two brains, picked by JARVIS_BRAIN in .env:
  - ollama (default): a free AI model running on your own PC via Ollama.
  - claude: Claude through the Anthropic API (needs an API key, smarter).

How confirmation works (same for voice, the phone page and Siri):
  1. The model calls a risky tool (delete, shell command, shutdown...).
  2. The gate does NOT run it; it records the exact call as "pending" and tells
     the model to ask you.
  3. If your very next message is a yes ("yes", "haan", "do it", "confirm"),
     the pending calls are approved and the model re-issues them. Anything else
     cancels them. The model can't approve on its own — only your reply can.
"""

import json
import logging
import re
import threading
import time
from datetime import datetime

import config
from tools import TOOLS_BY_NAME, load_memory, tool_definitions

log = logging.getLogger("jarvis")

YES = {
    "yes", "y", "yeah", "yep", "yup", "sure", "ok", "okay", "confirm", "confirmed", "do it",
    "go ahead", "proceed", "yes do it", "yes please", "haan", "ha", "han", "haa", "kar do", "karo",
}

IDLE_RESET_SECONDS = 20 * 60  # start a fresh conversation after 20 minutes of silence

NEEDS_CONFIRMATION = ("NOT RUN — this action needs the user's confirmation. Tell them in one sentence exactly "
                      "what you will do and ask them to say yes. Do not call it again until they do.")


def _is_yes(text: str) -> bool:
    t = re.sub(r"[^\w\s]", "", text.lower()).strip()
    t = re.sub(rf"^{config.WAKE_WORD}\s*", "", t)
    return t in YES


def _call_key(name: str, args: dict) -> str:
    return name + json.dumps(args, sort_keys=True)


def make_brain() -> "Brain":
    return ClaudeBrain() if config.BRAIN == "claude" else OllamaBrain()


class Brain:
    """Shared parts: conversation, locking, the confirmation gate. Subclasses talk to a model."""

    MAX_STEPS = 25  # tool rounds per request

    def __init__(self):
        self.lock = threading.Lock()  # voice and phone share one conversation
        self._reset()

    def _system_prompt(self) -> str:
        memory_text = "\n".join(f"- {m}" for m in load_memory()) or "(nothing yet)"
        return f"""You are JARVIS, a personal AI assistant running on {config.USER_NAME}'s Windows PC, \
with full control of it through your tools. {config.USER_NAME} talks to you by voice on the PC, or from their iPhone \
(web page or Siri). They may speak English, Hindi, Odia or a mix — reply in the language they used.
{f"They live in {config.CITY}." if config.CITY else ""}

How to behave:
- Your replies are usually spoken aloud: keep them short (1-2 sentences), natural, no markdown, no lists unless asked. \
Address them as "{config.USER_NAME}" occasionally, with a calm, witty, loyal JARVIS style.
- Just do things. Don't ask for permission for ordinary actions — use tools straight away and chain several if needed. \
Ask a question only if the request is truly ambiguous.
- To operate apps with no dedicated tool: open the app, take a screenshot, then click/type/press keys, and take another \
screenshot to check the result. For anything else on the PC, PowerShell via run_command usually works.
- Use web_search for news, weather, prices, scores and anything current.
- When a tool says it needs confirmation: describe exactly what you're about to do in one sentence and ask them to say \
"yes". After they say yes, call the same tool again with exactly the same input. Never claim something is done unless \
the tool result says so.
- If they tell you a lasting preference or personal fact, save it with the remember tool.

What you remember about {config.USER_NAME}:
{memory_text}"""

    def _reset(self):
        # Built once per conversation and never edited mid-conversation.
        self.system = self._system_prompt()
        self.messages: list = []
        self.pending: dict[str, str] = {}
        self.approved: set[str] = set()
        self.last_active = time.time()

    def ask(self, text: str, source: str = "pc") -> str:
        with self.lock:
            turn_start = len(self.messages)
            try:
                return self._ask(text, source)
            except Exception as e:
                # Drop the unfinished turn so the conversation stays valid for the next one.
                del self.messages[turn_start:]
                log.exception("request failed")
                return self._error_reply(e)

    def _ask(self, text: str, source: str) -> str:
        if text.strip().lower() in ("new conversation", "reset", "forget this conversation"):
            self._reset()
            return "Fresh start. What can I do for you?"

        if time.time() - self.last_active > IDLE_RESET_SECONDS:
            self._reset()
        self.last_active = time.time()

        if self.pending:
            if _is_yes(text):
                self.approved = set(self.pending)
            self.pending = {}

        now = datetime.now().strftime("%a %d %b %Y %I:%M %p")
        try:
            return self._loop(f"[{now} | via {source}] {text}")
        finally:
            self.approved = set()

    def run_tool(self, name: str, args: dict) -> tuple[object, bool]:
        """Run one tool call through the confirmation gate. Returns (output, is_error)."""
        tool = TOOLS_BY_NAME.get(name)
        if tool is None:
            return f"Unknown tool {name}", True

        key = _call_key(name, args)
        if tool.is_risky(args) and key not in self.approved:
            self.pending[key] = name
            log.info("needs confirmation: %s %s", name, args)
            return NEEDS_CONFIRMATION, False
        self.approved.discard(key)

        log.info("tool %s %s", name, args)
        try:
            return tool.func(**args), False
        except Exception as e:  # report failures to the model so it can try another way
            log.exception("tool %s failed", name)
            return f"Error: {type(e).__name__}: {e}", True

    def check(self) -> str | None:
        """Return a setup problem to show at startup, or None if ready."""
        return None

    def _loop(self, user_text: str) -> str:
        raise NotImplementedError

    def _error_reply(self, e: Exception) -> str:
        return "Something unexpected went wrong. Check jarvis.log for details."


# --------------------------------------------------------------------------- Ollama (free, local)

class OllamaBrain(Brain):
    MAX_STEPS = 10
    MAX_HISTORY = 30  # local models have small memories; keep the recent part of the chat

    def __init__(self):
        import requests

        self.http = requests.Session()
        self.tools = tool_definitions("ollama")
        super().__init__()

    def check(self) -> str | None:
        try:
            tags = self.http.get(f"{config.OLLAMA_URL}/api/tags", timeout=5).json()
        except Exception:
            return "Ollama isn't running. Install it from https://ollama.com and open the Ollama app."
        names = {m["name"] for m in tags.get("models", [])}
        for model in filter(None, [config.OLLAMA_MODEL, config.VISION_MODEL]):
            if model not in names and f"{model}:latest" not in names:
                return f"The model '{model}' isn't downloaded. Run:  ollama pull {model}"
        return None

    def _chat(self, model: str, messages: list, tools: list | None = None) -> dict:
        body = {
            "model": model,
            "messages": messages,
            "stream": False,
            "keep_alive": "30m",  # stay loaded in memory so replies are quick
            "options": {"num_ctx": config.OLLAMA_CONTEXT, "temperature": 0.3},
        }
        if tools:
            body["tools"] = tools
        r = self.http.post(f"{config.OLLAMA_URL}/api/chat", json=body, timeout=600)
        if r.status_code != 200:
            raise RuntimeError(f"Ollama error {r.status_code}: {r.text[:300]}")
        return r.json()["message"]

    def _trim(self):
        if len(self.messages) > self.MAX_HISTORY:
            cut = self.messages[-self.MAX_HISTORY:]
            while cut and cut[0]["role"] != "user":  # never start mid tool-call
                cut.pop(0)
            self.messages[:] = cut

    def _loop(self, user_text: str) -> str:
        self._trim()
        self.messages.append({"role": "user", "content": user_text})
        for _ in range(self.MAX_STEPS):
            msg = self._chat(config.OLLAMA_MODEL, [{"role": "system", "content": self.system}] + self.messages, self.tools)
            msg = {k: v for k, v in msg.items() if k in ("role", "content", "tool_calls")}
            self.messages.append(msg)
            calls = msg.get("tool_calls") or []
            if not calls:
                return _clean(msg.get("content", "")) or "Done."
            for call in calls:
                fn = call.get("function", {})
                name, args = fn.get("name", ""), fn.get("arguments") or {}
                if isinstance(args, str):
                    try:
                        args = json.loads(args)
                    except json.JSONDecodeError:
                        args = {}
                output, _ = self.run_tool(name, args)
                if isinstance(output, list):  # a screenshot: turn it into words for the text model
                    output = self._describe_screenshot(output)
                self.messages.append({"role": "tool", "tool_name": name, "content": str(output)[:8000]})
        return "That took too many steps, so I stopped. Tell me how you'd like to continue."

    def _describe_screenshot(self, blocks: list) -> str:
        if not config.VISION_MODEL:
            return ("Screen reading is off (no JARVIS_VISION_MODEL set). Use keyboard shortcuts, run_command or "
                    "dedicated tools instead.")
        size_note = next(b["text"] for b in blocks if b["type"] == "text")
        image = next(b["source"]["data"] for b in blocks if b["type"] == "image")
        msg = self._chat(config.VISION_MODEL, [{
            "role": "user",
            "content": "Describe this computer screenshot for someone who can't see it: which app/window is open, "
                       "the main text, and the buttons/links/fields with their approximate (x, y) pixel position. "
                       f"{size_note}",
            "images": [image],
        }])
        return "Screen description: " + msg.get("content", "")

    def _error_reply(self, e: Exception) -> str:
        import requests

        if isinstance(e, requests.ConnectionError):
            return "I can't reach Ollama. Please open the Ollama app on the PC."
        if isinstance(e, requests.Timeout):
            return "My brain took too long to answer. Try a smaller model or a simpler request."
        if "not found" in str(e):
            return f"The model isn't downloaded yet. Run: ollama pull {config.OLLAMA_MODEL}"
        return super()._error_reply(e)


def _clean(text: str) -> str:
    """Drop <think>...</think> sections that some local models print."""
    return re.sub(r"<think>.*?</think>", "", text, flags=re.S).strip()


# --------------------------------------------------------------------------- Claude (API key)

class ClaudeBrain(Brain):
    def __init__(self):
        import anthropic

        self.anthropic = anthropic
        self.client = anthropic.Anthropic()
        self.tools = tool_definitions("claude")
        super().__init__()

    def _loop(self, user_text: str) -> str:
        # Never edit or trim earlier messages: start over instead when the chat gets long.
        if len(self.messages) > 80:
            self._reset()
        self.messages.append({"role": "user", "content": user_text})
        for _ in range(self.MAX_STEPS):
            response = self.client.beta.messages.create(
                model=config.CLAUDE_MODEL,
                max_tokens=16000,
                system=self.system,
                tools=self.tools,
                messages=self.messages,
                output_config={"effort": config.EFFORT},
                # If a safety check declines a request, retry on another model instead of failing.
                betas=["server-side-fallback-2026-07-01"],
                fallbacks="default",
            )
            # Append the full content (incl. thinking blocks) — never edit history.
            self.messages.append({"role": "assistant", "content": response.content})

            if response.stop_reason == "refusal":
                return "Sorry, I can't help with that one."
            if response.stop_reason == "pause_turn":
                continue  # server-side web search still working; resume
            if response.stop_reason != "tool_use":
                reply = " ".join(b.text for b in response.content if b.type == "text").strip()
                return reply or "Done."

            results = []
            for block in response.content:
                if block.type == "tool_use":
                    output, is_error = self.run_tool(block.name, dict(block.input or {}))
                    result = {"type": "tool_result", "tool_use_id": block.id,
                              "content": output if isinstance(output, list) else str(output)}
                    if is_error:
                        result["is_error"] = True
                    results.append(result)
            self.messages.append({"role": "user", "content": results})
        return "That took too many steps, so I stopped. Tell me how you'd like to continue."

    def _error_reply(self, e: Exception) -> str:
        a = self.anthropic
        if isinstance(e, a.AuthenticationError):
            return "My API key isn't working. Please check ANTHROPIC_API_KEY in the .env file."
        if isinstance(e, a.RateLimitError):
            return "I'm being rate limited right now. Give me a moment and try again."
        if isinstance(e, a.APIConnectionError):
            return "I can't reach my brain. Is the internet connected?"
        if isinstance(e, a.APIStatusError):
            return f"Something went wrong on my side (error {e.status_code}). Please try again."
        return super()._error_reply(e)

"""Jarvis's brain: Claude + tools, with a confirmation gate on risky actions.

How confirmation works (same for voice, the phone page and Siri):
  1. Claude calls a risky tool (delete, shell command, shutdown...).
  2. The gate does NOT run it; it records the exact call as "pending" and tells
     Claude to ask you.
  3. If your very next message is a yes ("yes", "haan", "do it", "confirm"),
     the pending calls are approved and Claude re-issues them. Anything else
     cancels them. Claude can't approve on its own — only your reply can.
"""

import json
import logging
import re
import threading
import time
from datetime import datetime

import anthropic

import config
from tools import TOOLS_BY_NAME, api_tool_definitions, load_memory

log = logging.getLogger("jarvis")

YES = {
    "yes", "y", "yeah", "yep", "yup", "sure", "ok", "okay", "confirm", "confirmed", "do it",
    "go ahead", "proceed", "yes do it", "yes please", "haan", "ha", "han", "haa", "kar do", "karo",
}

MAX_HISTORY_MESSAGES = 80   # start a fresh conversation past this
IDLE_RESET_SECONDS = 20 * 60  # ...or after 20 minutes of silence
MAX_STEPS = 25              # tool rounds per request


def _is_yes(text: str) -> bool:
    t = re.sub(r"[^\w\s]", "", text.lower()).strip()
    t = re.sub(rf"^{config.WAKE_WORD}\s*", "", t)
    return t in YES


def _call_key(name: str, args: dict) -> str:
    return name + json.dumps(args, sort_keys=True)


class Brain:
    def __init__(self):
        self.client = anthropic.Anthropic()
        self.tools = api_tool_definitions()
        self.lock = threading.Lock()  # voice and phone share one conversation
        self._reset()

    # The system prompt is built once per conversation and never edited
    # mid-conversation (editing it would invalidate earlier thinking blocks).
    def _reset(self):
        memory = load_memory()
        memory_text = "\n".join(f"- {m}" for m in memory) or "(nothing yet)"
        self.system = f"""You are JARVIS, a personal AI assistant running on {config.USER_NAME}'s Windows PC, \
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

    @staticmethod
    def _error_reply(e: Exception) -> str:
        if isinstance(e, anthropic.AuthenticationError):
            return "My API key isn't working. Please check ANTHROPIC_API_KEY in the .env file."
        if isinstance(e, anthropic.RateLimitError):
            return "I'm being rate limited right now. Give me a moment and try again."
        if isinstance(e, anthropic.APIConnectionError):
            return "I can't reach my brain. Is the internet connected?"
        if isinstance(e, anthropic.APIStatusError):
            return f"Something went wrong on my side (error {e.status_code}). Please try again."
        return "Something unexpected went wrong. Check jarvis.log for details."

    def _ask(self, text: str, source: str) -> str:
        if text.strip().lower() in ("new conversation", "reset", "forget this conversation"):
            self._reset()
            return "Fresh start. What can I do for you?"

        if (time.time() - self.last_active > IDLE_RESET_SECONDS) or len(self.messages) > MAX_HISTORY_MESSAGES:
            self._reset()
        self.last_active = time.time()

        if self.pending:
            if _is_yes(text):
                self.approved = set(self.pending)
            self.pending = {}

        now = datetime.now().strftime("%a %d %b %Y %I:%M %p")
        self.messages.append({"role": "user", "content": f"[{now} | via {source}] {text}"})

        for _ in range(MAX_STEPS):
            response = self.client.beta.messages.create(
                model=config.MODEL,
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
                break

            results = []
            for block in response.content:
                if block.type == "tool_use":
                    results.append(self._run_tool(block))
            self.messages.append({"role": "user", "content": results})
        else:
            return "That took too many steps, so I stopped. Tell me how you'd like to continue."

        self.approved = set()
        reply = " ".join(b.text for b in response.content if b.type == "text").strip()
        return reply or "Done."

    def _run_tool(self, block) -> dict:
        tool = TOOLS_BY_NAME.get(block.name)
        args = dict(block.input or {})
        result: dict = {"type": "tool_result", "tool_use_id": block.id}
        if tool is None:
            return {**result, "content": f"Unknown tool {block.name}", "is_error": True}

        key = _call_key(block.name, args)
        if tool.is_risky(args) and key not in self.approved:
            self.pending[key] = block.name
            log.info("needs confirmation: %s %s", block.name, args)
            return {**result, "content": "NOT RUN — this action needs the user's confirmation. Tell them in one "
                    "sentence exactly what you will do and ask them to say yes. Do not call it again until they do."}
        self.approved.discard(key)

        log.info("tool %s %s", block.name, args)
        try:
            output = tool.func(**args)
        except Exception as e:  # report failures to Claude so it can try another way
            log.exception("tool %s failed", block.name)
            return {**result, "content": f"Error: {type(e).__name__}: {e}", "is_error": True}
        return {**result, "content": output if isinstance(output, list) else str(output)}

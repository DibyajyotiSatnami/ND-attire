"""Phone remote: a small web server on the PC.

- Open http://<PC-IP>:8765/?token=<JARVIS_TOKEN> in Safari on your iPhone
  (Share -> Add to Home Screen to make it an app icon).
- Or let an iOS Shortcut POST to /api/command, so "Hey Siri, Jarvis" works.
"""

import hmac

from fastapi import FastAPI, Header, HTTPException, Query
from fastapi.responses import HTMLResponse
from pydantic import BaseModel

import config


class Command(BaseModel):
    text: str
    speak_on_pc: bool = False


def _check(token: str | None):
    if not config.TOKEN or not token or not hmac.compare_digest(token, config.TOKEN):
        raise HTTPException(status_code=401, detail="Wrong or missing token")


def build_app(brain, mouth=None) -> FastAPI:
    app = FastAPI(title="Jarvis", docs_url=None, redoc_url=None)

    @app.post("/api/command")
    def command(cmd: Command, x_jarvis_token: str | None = Header(default=None), token: str | None = Query(default=None)):
        _check(x_jarvis_token or token)
        reply = brain.ask(cmd.text, source="iPhone")
        if cmd.speak_on_pc and mouth:
            mouth.say(reply, wait=False)
        return {"reply": reply}

    @app.get("/", response_class=HTMLResponse)
    def page(token: str | None = Query(default=None)):
        _check(token)
        return PAGE

    return app


PAGE = """<!doctype html>
<html lang="en"><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<meta name="apple-mobile-web-app-title" content="Jarvis">
<title>Jarvis</title>
<style>
  :root { --bg:#05080d; --panel:#0c1420; --line:#13324a; --accent:#29c5ff; --text:#d8ecf7; --muted:#6b8799; }
  * { box-sizing:border-box; }
  body { margin:0; background:var(--bg); color:var(--text); font:16px -apple-system,system-ui,sans-serif;
         height:100dvh; display:flex; flex-direction:column; }
  header { padding:calc(env(safe-area-inset-top) + 14px) 16px 10px; display:flex; align-items:center; gap:12px; }
  .core { width:34px; height:34px; border-radius:50%; border:2px solid var(--accent);
          box-shadow:0 0 14px var(--accent), inset 0 0 10px var(--accent); }
  .busy .core { animation:pulse 1s infinite; }
  @keyframes pulse { 50% { box-shadow:0 0 28px var(--accent), inset 0 0 18px var(--accent); } }
  h1 { font-size:18px; letter-spacing:.3em; margin:0; font-weight:600; }
  #log { flex:1; overflow-y:auto; padding:8px 16px; display:flex; flex-direction:column; gap:10px; }
  .msg { max-width:85%; padding:10px 13px; border-radius:14px; line-height:1.4; white-space:pre-wrap; word-wrap:break-word; }
  .you { align-self:flex-end; background:#123a55; }
  .jarvis { align-self:flex-start; background:var(--panel); border:1px solid var(--line); }
  .hint { color:var(--muted); font-size:14px; text-align:center; margin-top:30px; }
  .quick { display:flex; gap:8px; overflow-x:auto; padding:0 16px 8px; }
  .quick button { flex:none; background:var(--panel); color:var(--text); border:1px solid var(--line);
                  border-radius:16px; padding:6px 12px; font-size:14px; }
  form { display:flex; gap:8px; padding:8px 16px calc(env(safe-area-inset-bottom) + 12px); }
  input { flex:1; min-width:0; background:var(--panel); color:var(--text); border:1px solid var(--line);
          border-radius:22px; padding:12px 16px; font-size:16px; }
  form button { background:var(--accent); color:#00141f; border:0; border-radius:22px; padding:0 18px; font-weight:600; }
</style></head>
<body>
<header><div class="core"></div><h1>JARVIS</h1></header>
<div id="log"><div class="hint">Type, or tap the 🎤 on your keyboard to speak.</div></div>
<div class="quick">
  <button>Battery status</button><button>Lock my PC</button><button>Pause music</button>
  <button>What's on my screen?</button><button>Yes</button><button>No</button>
</div>
<form id="f"><input id="t" placeholder="Tell Jarvis…" autocomplete="off" enterkeyhint="send"><button>Send</button></form>
<script>
const token = new URLSearchParams(location.search).get("token");
const log = document.getElementById("log"), input = document.getElementById("t");
function add(text, who) {
  const hint = log.querySelector(".hint"); if (hint) hint.remove();
  const d = document.createElement("div"); d.className = "msg " + who; d.textContent = text;
  log.appendChild(d); log.scrollTop = log.scrollHeight;
}
async function send(text) {
  if (!text.trim()) return;
  add(text, "you"); document.body.classList.add("busy");
  try {
    const r = await fetch("/api/command", { method:"POST",
      headers:{ "Content-Type":"application/json", "X-Jarvis-Token":token }, body:JSON.stringify({ text }) });
    const data = await r.json();
    add(r.ok ? data.reply : ("Error: " + (data.detail || r.status)), "jarvis");
    if (r.ok && "speechSynthesis" in window) speechSynthesis.speak(new SpeechSynthesisUtterance(data.reply));
  } catch (e) { add("Can't reach your PC. Is Jarvis running and are you on the same network?", "jarvis"); }
  document.body.classList.remove("busy");
}
document.getElementById("f").onsubmit = e => { e.preventDefault(); send(input.value); input.value = ""; };
document.querySelectorAll(".quick button").forEach(b => b.onclick = () => send(b.textContent));
</script>
</body></html>
"""

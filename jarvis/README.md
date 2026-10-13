# JARVIS — your personal AI assistant

Jarvis runs on your **Windows PC** and can control it: open apps and websites, find/open/move/delete files,
type, click, take screenshots and "see" the screen, control music and volume, lock/shut down, run PowerShell,
search the web, and remember things about you. Its brain is Claude.

You can talk to it three ways:

| Where | How |
|---|---|
| PC, voice | Say **"Jarvis, open Chrome"** (or "Jarvis" → "Yes?" → your command) |
| PC, keyboard | Type in the Jarvis window |
| iPhone | A Jarvis web app on your home screen, **or "Hey Siri, Jarvis"** |

**Safety:** normal actions run instantly. Risky ones — deleting or moving files, overwriting a file, running
PowerShell commands, shutdown/restart/sleep — make Jarvis tell you exactly what it's about to do and wait for
you to say **"yes"** (or "haan"). Anything else cancels. Jarvis can't approve itself; only your reply can.
Deleted files go to the Recycle Bin.

---

## 1. Set up the PC (one time, ~10 minutes)

1. Install **Python 3.12** from <https://www.python.org/downloads/>. On the first installer screen,
   tick **"Add python.exe to PATH"**.
2. Get an **Anthropic API key**: <https://console.anthropic.com> → API Keys → Create key. Add some credit under Billing.
3. Download this `jarvis` folder to your PC (e.g. `C:\Jarvis`).
4. Double-click **`setup.bat`**. It installs everything and creates a `.env` file.
   - If `pyaudio` fails to install, run `pip install pipwin` then `pipwin install pyaudio` in the same window.
5. Open **`.env`** in Notepad and fill in:
   - `ANTHROPIC_API_KEY=` your key
   - `JARVIS_TOKEN=` a long random password (e.g. `nd-jarvis-7Hq2pLx9Vr4m`). Your phone uses it.
   - `JARVIS_USER_NAME=` what Jarvis should call you, and `JARVIS_CITY=`
6. Double-click **`start.bat`**. When Windows Firewall asks, allow access on **Private networks**.

You'll see something like:

```
 JARVIS is running.
 Voice: say "Jarvis, open Chrome"
 iPhone (same Wi-Fi): http://192.168.1.23:8765/?token=nd-jarvis-7Hq2pLx9Vr4m
```

**Start with Windows automatically:** press `Win+R`, type `shell:startup`, Enter, and put a shortcut to
`start.bat` in that folder.

## 2. Set up the iPhone

### Option A — Jarvis app on your home screen
1. Phone on the **same Wi-Fi** as the PC.
2. Open the `http://…:8765/?token=…` link from the Jarvis window in **Safari**.
3. Tap **Share → Add to Home Screen**. Now Jarvis is an app icon.
4. Type, or tap the 🎤 on the iPhone keyboard to speak. Replies are read aloud.

### Option B — "Hey Siri, Jarvis"
In the **Shortcuts** app, tap **+** and add these actions in order:
1. **Dictate Text** (Language: English (India) or your choice; Stop Listening: After Pause)
2. **Get Contents of URL**
   - URL: `http://192.168.1.23:8765/api/command` (your PC's address from the Jarvis window)
   - Method: **POST**
   - Headers: `X-Jarvis-Token` = your `JARVIS_TOKEN`
   - Request Body: **JSON**, key `text` (Text) = *Dictated Text*
3. **Get Dictionary Value** — Key `reply` from *Contents of URL*
4. **Speak Text** — *Dictionary Value*

Name the shortcut **Jarvis**. Now say **"Hey Siri, Jarvis"**, then your command.
For confirmations ("Shall I delete…?"), just run it again and say "yes".

### Using Jarvis away from home Wi-Fi
Install **Tailscale** (free) on both the PC and the iPhone and sign in with the same account. Then use the PC's
Tailscale address (`100.x.x.x`) instead of `192.168.x.x` in the link and the Shortcut. Don't port-forward Jarvis
to the open internet.

> Tip: give the PC a fixed IP in your router settings so the address doesn't change.

---

## Things to try

- "Jarvis, open YouTube and play Arijit Singh"
- "Jarvis, what's my battery?"  ·  "Jarvis, volume up"  ·  "Jarvis, pause the music"
- "Jarvis, find my resume PDF and open it"
- "Jarvis, move all the screenshots on my Desktop into a new folder called Screenshots"
- "Jarvis, what's on my screen?"  ·  "Jarvis, reply 'on my way' in the open WhatsApp chat"
- "Jarvis, what's the weather today?"  ·  "Jarvis, latest cricket score"
- "Jarvis, remember that my shop's GST number is …"
- "Jarvis, lock the PC"  ·  "Jarvis, shut down in 10 minutes" (asks first)
- "new conversation" — start fresh; "go to sleep" — stop responding until you say "Jarvis" again

## Settings (`.env`)

| Setting | Meaning |
|---|---|
| `JARVIS_EFFORT` | `low` (default, fastest — best for voice), `medium` or `high` for more careful multi-step work |
| `JARVIS_VOICE` | `0` turns off the PC microphone/speaker (phone + typing still work) |
| `JARVIS_WAKE_WORD` | Change "jarvis" to another name |
| `JARVIS_PORT` | Port for the phone remote (default 8765) |

Long-term memory lives in `memory.json`; the activity log in `jarvis.log`.

## Adding new abilities

Every ability is a small Python function in `tools.py`. Write the function, then add a `Tool(...)` line to the
`TOOLS` list (set `risky=True` if it should ask first). Add app nicknames to `APP_ALIASES`.

## What it can't do

- **Control the iPhone itself** (open iPhone apps, send iMessages from the phone): Apple doesn't let other
  programs do that. The iPhone is the remote control; the PC does the work.
- Work without internet: the brain and speech recognition are online.

## Costs

Each command is a few Claude API calls. Commands with screenshots cost more than plain ones. Check usage at
<https://console.anthropic.com>, and set a monthly spend limit there.

## Files

| File | What it does |
|---|---|
| `main.py` | Starts everything (voice, phone server, keyboard) |
| `brain.py` | Talks to Claude, runs tools, enforces the "say yes first" rule |
| `tools.py` | All the PC abilities |
| `voice.py` | Wake word, speech-to-text, text-to-speech |
| `server.py` | The iPhone web app and the Siri Shortcut endpoint |

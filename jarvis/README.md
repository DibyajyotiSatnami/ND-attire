# JARVIS — your personal AI assistant

Jarvis runs on your **Windows PC** and can control it: open apps and websites, find/open/move/delete files,
type, click, take screenshots and "see" the screen, control music and volume, lock/shut down, run PowerShell,
search the web, and remember things about you.

**It's free.** Its brain is an AI model that runs on your own PC through **Ollama**: no API key, no account,
no monthly bill. (If you ever want a smarter brain, you can switch to Claude with an API key; see the end.)

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

## 1. Set up the PC (one time, ~20 minutes)

**PC needed:** Windows 10/11 with **8 GB RAM or more** (16 GB is better). A graphics card (NVIDIA) makes replies
much faster, but isn't required.

1. Install **Python 3.12** from <https://www.python.org/downloads/>. On the first installer screen,
   tick **"Add python.exe to PATH"**.
2. Install **Ollama** from <https://ollama.com/download> (Windows). After installing, it runs in the background;
   you'll see a llama icon near the clock.
3. Download this `jarvis` folder to your PC (e.g. `C:\Jarvis`).
4. Double-click **`setup.bat`**. It installs everything, creates a `.env` file, and downloads the AI brain
   (`qwen2.5:7b`, about 4.7 GB, so this part takes a while).
   - If `pyaudio` fails to install, run `pip install pipwin` then `pipwin install pyaudio` in the same window.
5. Open **`.env`** in Notepad and fill in:
   - `JARVIS_TOKEN=` a long random password (e.g. `nd-jarvis-7Hq2pLx9Vr4m`). Your phone uses it.
   - `JARVIS_USER_NAME=` what Jarvis should call you, and `JARVIS_CITY=`
6. Double-click **`start.bat`**. When Windows Firewall asks, allow access on **Private networks**.

You'll see something like:

```
 JARVIS is running. Brain: Ollama (qwen2.5:7b)
 Voice: say "Jarvis, open Chrome"
 iPhone (same Wi-Fi): http://192.168.1.23:8765/?token=nd-jarvis-7Hq2pLx9Vr4m
```

The first command after starting takes longer (the model loads into memory); after that it's quicker.

### Pick the right brain size for your PC

| Your PC | Set in `.env` | Then run once |
|---|---|---|
| 8 GB RAM, no graphics card | `JARVIS_OLLAMA_MODEL=qwen2.5:3b` | `ollama pull qwen2.5:3b` |
| 16 GB RAM (default) | `JARVIS_OLLAMA_MODEL=qwen2.5:7b` | (already done by setup) |
| NVIDIA card with 12 GB+ | `JARVIS_OLLAMA_MODEL=qwen2.5:14b` | `ollama pull qwen2.5:14b` |

Bigger = smarter but slower. Run the `ollama pull` commands in Command Prompt.

### Let Jarvis see your screen (optional)
Run `ollama pull gemma3:4b` and set `JARVIS_VISION_MODEL=gemma3:4b` in `.env`. Jarvis can then answer
"what's on my screen?" and try to click things. This uses more memory and is slower; without it, Jarvis
works with keyboard shortcuts and commands instead.

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

## Troubleshooting

- **"Ollama isn't running"**: open Ollama from the Start menu (the llama icon should appear near the clock).
- **"The model isn't downloaded"**: run the `ollama pull ...` command it shows, in Command Prompt.
- **Very slow replies**: use a smaller model (`qwen2.5:3b`) and close heavy apps.
- **Jarvis doesn't hear you**: check the microphone in Windows Settings → Sound, or type commands instead.
- **iPhone can't connect**: same Wi-Fi? Jarvis running? Allowed through the firewall?
- Anything else: look at `jarvis.log` in the folder, or send the error to whoever set this up.

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
| `JARVIS_BRAIN` | `ollama` (free, default) or `claude` (API key) |
| `JARVIS_OLLAMA_MODEL` | Which local model to use (see the size table above) |
| `JARVIS_VISION_MODEL` | Optional screen-reading model, e.g. `gemma3:4b` |
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
- Be as smart as the big online AIs. Free local models are good at simple commands ("open Chrome",
  "volume up", "find my resume") but can stumble on long multi-step jobs. If a command fails, say it more
  simply or break it into steps.
- Hear you without internet: the brain runs offline, but voice recognition and web search use the internet.

## Switching to Claude later (smarter, costs money)

1. Get an API key at <https://console.anthropic.com> and add a little credit.
2. In the Jarvis folder, run `.venv\Scripts\activate` then `pip install anthropic`.
3. In `.env`, set `JARVIS_BRAIN=claude` and `ANTHROPIC_API_KEY=your-key`.

Each command then costs a few cents (more with screenshots). Set a monthly spend limit in the console.

## Files

| File | What it does |
|---|---|
| `main.py` | Starts everything (voice, phone server, keyboard) |
| `brain.py` | Talks to the AI (Ollama or Claude), runs tools, enforces the "say yes first" rule |
| `tools.py` | All the PC abilities |
| `voice.py` | Wake word, speech-to-text, text-to-speech |
| `server.py` | The iPhone web app and the Siri Shortcut endpoint |

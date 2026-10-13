"""Start Jarvis: voice on the PC + the phone remote server + a typing console.

    python main.py            # everything
    python main.py --no-voice # phone + typing only (no microphone needed)
"""

import logging
import socket
import sys
import threading

import config


def lan_ip() -> str:
    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    try:
        s.connect(("8.8.8.8", 80))
        return s.getsockname()[0]
    except OSError:
        return "127.0.0.1"
    finally:
        s.close()


def main():
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s %(levelname)s %(message)s",
        handlers=[logging.FileHandler(config.LOG_FILE, encoding="utf-8")],
    )
    if not config.TOKEN or len(config.TOKEN) < 12:
        sys.exit("Set JARVIS_TOKEN in jarvis/.env to a long random password first (see README).")

    from brain import Brain
    from server import build_app

    brain = Brain()
    voice_on = config.VOICE_ENABLED and "--no-voice" not in sys.argv

    mouth = None
    if voice_on:
        from voice import Mouth, run_voice

        mouth = Mouth()
        threading.Thread(target=run_voice, args=(brain, mouth), daemon=True).start()

    import uvicorn

    app = build_app(brain, mouth)
    threading.Thread(
        target=uvicorn.run, args=(app,),
        kwargs={"host": config.SERVER_HOST, "port": config.SERVER_PORT, "log_level": "warning"},
        daemon=True,
    ).start()

    print("=" * 60)
    print(" JARVIS is running.")
    if voice_on:
        print(f' Voice: say "{config.WAKE_WORD.title()}, open Chrome"')
    print(f" iPhone (same Wi-Fi): http://{lan_ip()}:{config.SERVER_PORT}/?token={config.TOKEN}")
    print(" Or type a command below. Ctrl+C to quit.")
    print("=" * 60)

    try:
        while True:
            text = input("YOU> ").strip()
            if text:
                reply = brain.ask(text, source="pc keyboard")
                if mouth:
                    mouth.say(reply)
                else:
                    print(f"JARVIS: {reply}")
    except (KeyboardInterrupt, EOFError):
        print("\nGoodbye.")


if __name__ == "__main__":
    main()

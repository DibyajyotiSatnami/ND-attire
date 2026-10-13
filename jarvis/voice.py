"""Voice on the PC: say "Jarvis, <command>" (or "Jarvis" ... wait for "Yes?" ... command).

Speech-to-text uses Google's free recognizer (needs internet); text-to-speech
uses the Windows built-in voice, so it works offline.
"""

import logging
import queue
import threading

import config

log = logging.getLogger("jarvis")


class Mouth:
    """Speaks on a single background thread (pyttsx3 isn't thread-safe)."""

    def __init__(self):
        self.q: queue.Queue[str] = queue.Queue()
        self.done = threading.Event()
        self.done.set()
        threading.Thread(target=self._loop, daemon=True).start()

    def _loop(self):
        import pyttsx3

        engine = pyttsx3.init()
        engine.setProperty("rate", 185)
        for v in engine.getProperty("voices"):
            # Prefer a male English voice (e.g. "Microsoft David") for the JARVIS feel.
            if "david" in v.name.lower() or "male" in v.name.lower():
                engine.setProperty("voice", v.id)
                break
        while True:
            text = self.q.get()
            engine.say(text)
            engine.runAndWait()
            if self.q.empty():
                self.done.set()

    def say(self, text: str, wait: bool = True):
        print(f"JARVIS: {text}")
        self.done.clear()
        self.q.put(text)
        if wait:
            self.done.wait()


def run_voice(brain, mouth: Mouth):
    import speech_recognition as sr

    r = sr.Recognizer()
    r.pause_threshold = 0.8
    r.dynamic_energy_threshold = True
    mic = sr.Microphone()
    with mic as source:
        r.adjust_for_ambient_noise(source, duration=1)

    def hear(timeout=None, phrase_limit=12) -> str:
        with mic as source:
            try:
                audio = r.listen(source, timeout=timeout, phrase_time_limit=phrase_limit)
            except sr.WaitTimeoutError:
                return ""
        try:
            # en-IN understands Indian English and a fair amount of Hinglish.
            return r.recognize_google(audio, language="en-IN")
        except sr.UnknownValueError:
            return ""
        except sr.RequestError as e:
            log.warning("speech recognition unavailable: %s", e)
            return ""

    mouth.say(f"Jarvis online. At your service, {config.USER_NAME}.")
    follow_up = False  # after Jarvis asks a question, listen without needing the wake word
    while True:
        heard = hear(timeout=6 if follow_up else None)
        if not heard:
            follow_up = False
            continue
        print(f"YOU: {heard}")
        lower = heard.lower()

        if follow_up:
            command = heard
        elif config.WAKE_WORD in lower:
            command = heard[lower.index(config.WAKE_WORD) + len(config.WAKE_WORD):].strip(" ,.!?")
            if not command:
                mouth.say("Yes?")
                command = hear(timeout=6)
                if not command:
                    continue
                print(f"YOU: {command}")
        else:
            continue  # not talking to Jarvis

        if command.lower().strip(" .") in ("stop listening", "go to sleep", "sleep mode"):
            mouth.say("Going quiet. Say my name when you need me.")
            follow_up = False
            continue

        reply = brain.ask(command, source="pc voice")
        mouth.say(reply)
        follow_up = reply.rstrip().endswith("?")

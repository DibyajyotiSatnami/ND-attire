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


class Ear:
    """Records one spoken phrase from the microphone.

    Uses `sounddevice` (works on every Python version without a compiler) instead
    of PyAudio: waits for sound louder than the room's background noise, records
    until you pause, and returns it in the format SpeechRecognition expects.
    """

    RATE = 16000
    BLOCK = 1600          # 0.1 second chunks
    PAUSE_SECONDS = 0.8   # this much quiet ends the phrase

    def __init__(self):
        import numpy as np
        import sounddevice as sd

        self.np, self.sd = np, sd
        self.stream = sd.InputStream(samplerate=self.RATE, channels=1, dtype="int16", blocksize=self.BLOCK)
        self.stream.start()
        # Measure background noise for one second; speech must be clearly louder.
        noise = [self._level(self._read()) for _ in range(10)]
        self.threshold = max(300.0, float(np.mean(noise)) * 2.5)

    def _read(self):
        data, _ = self.stream.read(self.BLOCK)
        return data[:, 0]

    def _level(self, chunk) -> float:
        return float(self.np.sqrt(self.np.mean(chunk.astype(self.np.float64) ** 2)))

    def _drain(self):
        while self.stream.read_available >= self.BLOCK:
            self._read()

    def listen(self, timeout=None, phrase_limit=12):
        import speech_recognition as sr

        np = self.np
        self._drain()  # skip sound recorded while Jarvis was talking or thinking
        waited = 0.0
        before: list = []  # keep a little audio from just before speech starts
        while True:  # wait for speech
            chunk = self._read()
            level = self._level(chunk)
            if level > self.threshold:
                break
            # slowly follow changes in background noise (fan, TV...)
            self.threshold = max(300.0, 0.95 * self.threshold + 0.05 * level * 2.5)
            before = (before + [chunk])[-3:]
            waited += 0.1
            if timeout is not None and waited >= timeout:
                return None

        chunks, quiet, length = before + [chunk], 0.0, 0.0
        while length < phrase_limit and quiet < self.PAUSE_SECONDS:  # record until a pause
            chunk = self._read()
            chunks.append(chunk)
            length += 0.1
            quiet = quiet + 0.1 if self._level(chunk) < self.threshold else 0.0

        return sr.AudioData(np.concatenate(chunks).tobytes(), self.RATE, 2)


def run_voice(brain, mouth: Mouth):
    import speech_recognition as sr

    r = sr.Recognizer()
    ear = Ear()

    def hear(timeout=None, phrase_limit=12) -> str:
        audio = ear.listen(timeout=timeout, phrase_limit=phrase_limit)
        if audio is None:
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

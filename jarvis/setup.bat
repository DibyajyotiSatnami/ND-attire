@echo off
REM One-time setup on Windows.
REM Needs: Python 3.10+ from python.org (tick "Add to PATH") and Ollama from ollama.com
cd /d "%~dp0"
python -m venv .venv
call .venv\Scripts\activate.bat
python -m pip install --upgrade pip
pip install -r requirements.txt
if not exist .env copy .env.example .env
echo.
where ollama >nul 2>nul
if errorlevel 1 (
  echo Ollama is not installed yet. Install it from https://ollama.com then run:  ollama pull qwen2.5:7b
) else (
  echo Downloading the AI brain - about 4.7 GB, this can take a while...
  ollama pull qwen2.5:7b
)
echo.
echo Setup done. Notepad will now open your .env file:
echo set JARVIS_TOKEN and your name, save it, then run start.bat
pause
start notepad "%~dp0.env"

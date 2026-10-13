@echo off
REM One-time setup on Windows. Needs Python 3.10+ from python.org (tick "Add to PATH").
cd /d "%~dp0"
python -m venv .venv
call .venv\Scripts\activate.bat
python -m pip install --upgrade pip
pip install -r requirements.txt
if not exist .env copy .env.example .env
echo.
echo Setup done. Now open jarvis\.env in Notepad, add your API key and a JARVIS_TOKEN, then run start.bat
pause

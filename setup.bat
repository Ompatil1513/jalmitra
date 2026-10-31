@echo off
echo === JalMitra setup ===
cd /d "%~dp0backend"
if not exist venv python -m venv venv
call venv\Scripts\activate
pip install -r requirements.txt
if not exist .env copy .env.example .env
cd /d "%~dp0frontend"
call npm install
echo.
echo Setup finished. Now run start-backend.bat and start-frontend.bat in two windows.
pause

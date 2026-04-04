@echo off
cd /d "%~dp0"
echo Starting gym-community on http://localhost:5173
npm run dev -- --host 0.0.0.0 --port 5173
pause

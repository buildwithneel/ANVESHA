@echo off
title RailGuard AI - One-Click Launcher
echo ========================================================
echo         RailGuard AI - Starting Full Stack System
echo ========================================================
echo.
echo 1. Starting FastAPI Backend (http://127.0.0.1:8000)...
start "RailGuard Backend" cmd /k "cd /d %~dp0backend && python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000"

timeout /t 3 /nobreak >nul

echo 2. Starting React Frontend (http://localhost:5173)...
start "RailGuard Frontend" cmd /k "cd /d %~dp0 && npm.cmd run dev"

timeout /t 2 /nobreak >nul

echo 3. Starting AI/ML Computer Vision Pipeline...
start "RailGuard AI Engine" cmd /k "cd /d %~dp0ai_ml && python main.py --source videos/sample_cctv.mp4 --camera-id CAM-07"

echo.
echo ========================================================
echo RailGuard AI is running!
echo - Frontend UI   : http://localhost:5173
echo - Backend API   : http://127.0.0.1:8000
echo - Swagger Docs  : http://127.0.0.1:8000/docs
echo - AI/ML Engine  : Live processing videos/sample_cctv.mp4
echo ========================================================
echo.
pause

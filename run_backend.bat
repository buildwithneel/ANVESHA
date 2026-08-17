@echo off
title RailGuard AI - Backend Server
echo ========================================================
echo         RailGuard AI - FastAPI Backend Server
echo ========================================================
echo.
echo Starting FastAPI server at http://127.0.0.1:8000 ...
echo Swagger UI docs available at: http://127.0.0.1:8000/docs
echo.
cd /d "%~dp0backend"
python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
pause

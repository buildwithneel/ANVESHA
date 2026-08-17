@echo off
title RailGuard AI - Database Seeder
echo ========================================================
echo         RailGuard AI - Reset & Seed Database
echo ========================================================
echo.
echo Seeding Vadodara Railway Station demo data...
cd /d "%~dp0backend"
python -m app.database.seed
echo.
echo Database setup complete!
pause

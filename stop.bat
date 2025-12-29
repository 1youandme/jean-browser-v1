@echo off
REM 🛑 JeanTrail OS - Stop All Services Script for Windows
REM Author: Jean AI Assistant
REM Version: 1.0

echo 🛑 Stopping JeanTrail OS Services...

REM Stop Docker services
echo Stopping AI Services (Docker)...
docker-compose -f docker-compose.ai.yml down --remove-orphans 2>nul

REM Stop Node.js processes
echo Stopping Frontend Server...
taskkill /f /im node.exe 2>nul

REM Stop Tauri processes
echo Stopping Tauri...
taskkill /f /im "cargo.exe" 2>nul

REM Clean up any remaining processes
echo Cleaning up remaining processes...
taskkill /f /im "npm.exe" 2>nul

echo ✅ All JeanTrail OS services stopped successfully!
echo Goodbye! 👋
pause
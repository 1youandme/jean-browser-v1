@echo off
REM 🚀 JeanTrail OS - One-Click Startup Script for Windows
REM Author: Jean AI Assistant
REM Version: 1.0

setlocal enabledelayedexpansion

REM JeanTrail OS Logo
echo.
echo ╔══════════════════════════════════════════════════════════════╗
echo ║                                                              ║
echo ║    🚀 JEANTRAIL OS - AI-Powered Browser                    ║
echo ║    Future of Web Browsing with AI Assistant                ║
echo ║                                                              ║
echo ╚══════════════════════════════════════════════════════════════╝
echo.

REM Function to check if command exists
where >nul 2>nul %1
if %ERRORLEVEL% EQU 0 (
    echo [SUCCESS] Found %1
) else (
    echo [ERROR] %1 is not installed or not in PATH
    echo Please install %1 and try again
    pause
    exit /b 1
)

echo [STEP] Checking system requirements...

REM Check Docker
echo [INFO] Checking Docker...
call :CheckCommand docker "Docker Desktop" "https://www.docker.com/products/docker-desktop"

REM Check Docker Compose
echo [INFO] Checking Docker Compose...
call :CheckCommand docker-compose "Docker Compose" "https://docs.docker.com/compose/install/"

REM Check Node.js
echo [INFO] Checking Node.js...
call :CheckCommand node "Node.js" "https://nodejs.org/"

REM Check npm
echo [INFO] Checking npm...
call :CheckCommand npm "npm" "https://nodejs.org/"

echo [SUCCESS] All requirements found!

REM Setup environment
echo.
echo [STEP] Setting up environment...

REM Create directories
if not exist "logs" mkdir logs
if not exist "outputs" mkdir outputs
if not exist "models" mkdir models
if not exist "temp" mkdir temp
if not exist "database" mkdir database

REM Create .env file if not exists
if not exist ".env" (
    if exist ".env.example" (
        copy .env.example .env >nul
        echo [SUCCESS] Created .env file from .env.example
    ) else (
        echo [WARNING] Creating basic .env file...
        (
            echo # JeanTrail OS Environment Variables
            echo NODE_ENV=development
            echo PORT=1420
            echo TAURI_DEV_PORT=1420
            echo.
            echo # Database Configuration
            echo DATABASE_URL=postgresql://jeantrail:password@localhost:5432/jeantrail
            echo REDIS_URL=redis://localhost:6379
            echo.
            echo # AI Services Configuration
            echo QWEN_API_URL=http://localhost:8001
            echo SDXL_API_URL=http://localhost:8002
            echo WHISPER_API_URL=http://localhost:8003
            echo COQUI_TTS_API_URL=http://localhost:8004
            echo.
            echo # Jean AI Configuration
            echo JEAN_API_KEY=your-jean-api-key
            echo JEAN_MODEL=qwen-3-72b
            echo JEAN_TEMPERATURE=0.7
            echo JEAN_MAX_TOKENS=2048
            echo.
            echo # Security
            echo JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
            echo CORS_ORIGIN=http://localhost:1420
            echo.
            echo # Logging
            echo LOG_LEVEL=info
            echo LOG_FILE=logs/jeantrail.log
        ) > .env
        echo [SUCCESS] Created basic .env file
    )
) else (
    echo [SUCCESS] .env file already exists
)

REM Start AI Services
echo.
echo [STEP] Starting AI Services with Docker...

REM Stop existing containers
echo [INFO] Stopping existing containers...
docker-compose -f docker-compose.ai.yml down --remove-orphans 2>nul

REM Build and start services
echo [INFO] Building Docker images...
docker-compose -f docker-compose.ai.yml build --no-cache

echo [INFO] Starting AI services...
docker-compose -f docker-compose.ai.yml up -d

REM Wait for services to start
echo [INFO] Waiting for services to start...
timeout /t 30 /nobreak >nul

REM Check service health
echo [INFO] Checking service health...
docker-compose -f docker-compose.ai.yml ps

REM Install dependencies
echo.
echo [STEP] Installing Node.js dependencies...

if not exist "node_modules" (
    echo [INFO] Installing dependencies for the first time...
    npm install
) else (
    echo [INFO] Checking for dependency updates...
    npm ci --silent 2>nul || npm install
)

echo [SUCCESS] Dependencies installed!

REM Start frontend
echo.
echo [STEP] Starting JeanTrail Frontend...

REM Kill existing processes
taskkill /f /im node.exe 2>nul

REM Start development server
echo [INFO] Starting Vite development server...
start /B cmd /c "npm run dev > logs\frontend.log 2>&1"

REM Wait for frontend to start
timeout /t 10 /nobreak >nul

REM Check if frontend is running
powershell -Command "try { Invoke-WebRequest -Uri 'http://localhost:1420' -TimeoutSec 5 | Out-Null; exit 0 } catch { exit 1 }"
if %ERRORLEVEL% EQU 0 (
    echo [SUCCESS] Frontend is running on http://localhost:1420
) else (
    echo [ERROR] Frontend failed to start. Check logs\frontend.log
    pause
    exit /b 1
)

REM Display success message
echo.
echo ╔══════════════════════════════════════════════════════════════╗
echo ║                     🎉 SUCCESS! 🎉                        ║
echo ║                                                              ║
echo ║  JeanTrail OS is now running and ready to use!              ║
echo ║                                                              ║
echo ╚══════════════════════════════════════════════════════════════╝
echo.

echo 📱 Access URLs:
echo    Frontend: http://localhost:1420
echo    Public URL: https://1420-e5de072f-dd5b-4414-84a6-2970706134ec.sandbox-service.public.prod.myninja.ai
echo.
echo 🤖 AI Services:
echo    Qwen-3 API: http://localhost:8001
echo    SDXL API: http://localhost:8002
echo    Whisper API: http://localhost:8003
echo    Coqui TTS API: http://localhost:8004
echo.
echo 🗄️  Databases:
echo    PostgreSQL: localhost:5432
echo    Redis: localhost:6379
echo.
echo 📊 Monitoring:
echo    Logs: .\logs\
echo    Docker Status: docker-compose -f docker-compose.ai.yml ps
echo.
echo 🛑 Stop Services:
echo    Stop All: stop.bat
echo    Stop AI Only: docker-compose -f docker-compose.ai.yml down
echo.
echo Jean AI Assistant is ready to help! 🚀
echo.
echo Press any key to exit (services will continue running)...
pause >nul
exit /b 0

REM Subroutine to check command
:CheckCommand
where >nul 2>nul %1
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] %2 is not installed or not in PATH
    echo Please install %2 from: %3
    pause
    exit /b 1
) else (
    echo [SUCCESS] Found %2
)
exit /b 0
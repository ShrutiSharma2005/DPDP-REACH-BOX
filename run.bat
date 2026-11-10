@echo off
echo ======================================================================
echo Starting DPDPFlow Outreach Agent (RegulationFlow Technologies)
echo ======================================================================

REM Check backend venv
if not exist "backend\venv" (
    echo [1/3] Creating Python virtual environment...
    cd backend
    python -m venv venv
    call venv\Scripts\activate.bat
    pip install -r requirements.txt
    cd ..
)

REM Check frontend node_modules
if not exist "frontend\node_modules" (
    echo [2/3] Installing frontend dependencies...
    cd frontend
    call npm install
    cd ..
)

REM Check .env
if not exist ".env" (
    copy .env.example .env
)

echo [3/3] Starting Backend (Port 8000) and Frontend (Port 5173)...
start "DPDP Agent Backend" cmd /k "cd backend && call venv\Scripts\activate.bat && uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload"
start "DPDP Agent Frontend" cmd /k "cd frontend && npm run dev"

echo Backend URL:  http://localhost:8000
echo Frontend URL: http://localhost:5173
echo.

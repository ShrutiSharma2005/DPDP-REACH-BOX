#!/usr/bin/env bash
set -e

echo "======================================================================"
echo "Starting DPDPFlow Outreach Agent (RegulationFlow Technologies)"
echo "======================================================================"

# Backend setup
if [ ! -d "backend/venv" ]; then
    echo "[1/3] Creating backend virtualenv..."
    cd backend
    python3 -m venv venv
    ./venv/bin/pip install -r requirements.txt
    cd ..
fi

# Frontend setup
if [ ! -d "frontend/node_modules" ]; then
    echo "[2/3] Installing frontend dependencies..."
    cd frontend
    npm install
    cd ..
fi

# Copy .env if not exists
if [ ! -f ".env" ]; then
    cp .env.example .env
fi

echo "[3/3] Launching backend (8000) and frontend (5173)..."
cd backend && ./venv/bin/uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload &
BACKEND_PID=$!

cd frontend && npm run dev &
FRONTEND_PID=$!

trap "kill $BACKEND_PID $FRONTEND_PID" EXIT
wait

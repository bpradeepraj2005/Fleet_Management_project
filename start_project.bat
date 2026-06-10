@echo off
echo Starting Fleet Management Project...

echo [1/2] Starting Backend Server...
start cmd /k "cd backend && venv\Scripts\activate && uvicorn main:app --host 127.0.0.1 --port 8001 --reload"

echo [2/2] Starting Frontend Server...
start cmd /k "cd frontend && npm run dev"

echo Both servers are starting up!
echo Frontend will be available at: http://localhost:5173
echo Backend API is running on: http://localhost:8001

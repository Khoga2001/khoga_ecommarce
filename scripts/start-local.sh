#!/usr/bin/env bash
# Start Khoga locally — run each service in its own terminal, or use this script.
set -e
ROOT="$(cd "$(dirname "$0")/.." && pwd)"

echo "=== Khoga Local Start ==="
echo "Root: $ROOT"
echo ""

# Check MongoDB
if ! nc -z localhost 27017 2>/dev/null; then
  echo "⚠️  MongoDB does not appear to be running on port 27017."
  echo "   Start it first: brew services start mongodb-community"
  echo ""
fi

# Backend
if [ ! -f "$ROOT/backend/.env" ]; then
  echo "Creating backend/.env from .env.example..."
  cp "$ROOT/backend/.env.example" "$ROOT/backend/.env"
fi

echo "Starting backend on http://localhost:8001 ..."
cd "$ROOT/backend"
source venv/bin/activate
python -m uvicorn server:app --host 0.0.0.0 --port 8001 &
BACKEND_PID=$!

echo "Starting frontend on http://localhost:3000 ..."
cd "$ROOT/frontend"
BROWSER=none npm start &
FRONTEND_PID=$!

cleanup() {
  echo ""
  echo "Stopping servers..."
  kill $BACKEND_PID $FRONTEND_PID 2>/dev/null || true
}
trap cleanup EXIT INT TERM

echo ""
echo "✓ Backend:  http://localhost:8001/api/"
echo "✓ Frontend: http://localhost:3000"
echo ""
echo "Share with friends (optional, new terminal):"
echo "  cloudflared tunnel --url http://127.0.0.1:3000"
echo ""
echo "Press Ctrl+C to stop both servers."

wait

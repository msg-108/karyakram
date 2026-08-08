#!/usr/bin/env bash
# Karyakram Celery startup script
# Starts one worker that handles:
#   - "celery"  (default queue) → booking expiry, event archiving, etc.
#   - "email"   (email queue)   → dispatch_email_task, rate-limited to 2/min
#
# Run this from the backend/ directory:
#   bash start_celery.sh
#
# Or in the background:
#   nohup bash start_celery.sh > logs/celery.log 2>&1 &

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

VENV_PYTHON=".venv/bin/python"
VENV_CELERY=".venv/bin/celery"

if [ ! -f "$VENV_CELERY" ]; then
  echo "ERROR: Celery not found at $VENV_CELERY"
  echo "Run: cd backend && .venv/bin/pip install celery"
  exit 1
fi

echo "Starting Karyakram Celery worker..."
echo "  Queues:      celery, email"
echo "  Concurrency: 1 (serialises email rate-limiting)"
echo "  Log level:   INFO"
echo ""

exec "$VENV_CELERY" -A config worker \
  --beat \
  --queues=celery,email \
  --concurrency=1 \
  --loglevel=INFO \
  --logfile=logs/celery.log \
  --pidfile=logs/celery.pid

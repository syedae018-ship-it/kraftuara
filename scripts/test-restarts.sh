#!/bin/bash

# Configuration
PORT=4999
MAX_CYCLES=10
CYCLE=1

echo "=========================================="
echo "    10x CONSECUTIVE RESTART TEST SUITE     "
echo "=========================================="

while [ $CYCLE -le $MAX_CYCLES ]
do
  echo ""
  echo "------------------------------------------"
  echo "STARTING CYCLE $CYCLE / $MAX_CYCLES"
  echo "------------------------------------------"

  # 1. Run Production Build
  echo "Step 1: Running npm run build..."
  npm run build
  if [ $? -ne 0 ]; then
    echo "✗ ERROR: Build failed in Cycle $CYCLE!"
    exit 1
  fi

  # 2. Kill any stale processes on the port and Start Dev Server in Background
  echo "Step 2: Freeing port $PORT and starting dev server..."
  npx kill-port $PORT
  PORT=$PORT npm run dev &
  DEV_PID=$!

  # 3. Wait for Dev Server to become responsive
  echo "Step 3: Waiting for server to boot..."
  sleep 8

  # 4. Run Startup Route Verification
  echo "Step 4: Running automated startup checklist..."
  PORT=$PORT node scripts/verify-startup.js
  TEST_RESULT=$?

  # 5. Kill Dev Server
  echo "Step 5: Stopping dev server (PID: $DEV_PID) and freeing port $PORT..."
  kill $DEV_PID
  wait $DEV_PID 2>/dev/null
  npx kill-port $PORT

  if [ $TEST_RESULT -ne 0 ]; then
    echo "✗ ERROR: Route verification failed in Cycle $CYCLE!"
    exit 1
  fi

  echo "✓ Cycle $CYCLE Completed Successfully!"
  CYCLE=$((CYCLE+1))
done

echo ""
echo "=========================================="
echo "✓ SUCCESS: Passed 10 consecutive restart cycles!"
echo "=========================================="
exit 0

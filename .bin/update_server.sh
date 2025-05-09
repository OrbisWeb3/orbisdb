#!/bin/bash

# Navigate to the root of the project
cd "$(dirname "$0")"/..

echo "Updating server..."

# Check if the virtual environment is activated
if [ -n "$VIRTUAL_ENV" ]; then
    echo "Deactivating virtual environment..."
    deactivate
fi

# Stop any running Gunicorn instances
echo "Stopping any running Gunicorn processes..."
pkill -f gunicorn &> /dev/null
if [ $? -eq 0 ]; then
    echo "Gunicorn processes stopped."
else
    echo "No running Gunicorn processes found."
fi

# Activate the virtual environment
echo "Activating virtual environment..."
source ./.venv/bin/activate &> /dev/null
if [ $? -ne 0 ]; then
    echo "Failed to activate virtual environment. Please ensure it is correctly set up."
    exit 1
fi

# Read port from environment variable, default to 8000 if not set
PORT=${PORT:-8000}
echo "Starting Gunicorn server on port $PORT with gevent workers..."
nohup gunicorn --worker-class gevent --workers 3 --bind 0.0.0.0:$PORT 'app.run_app:app' > .tmp/gunicorn_output.log 2>&1 &

echo "Gunicorn server started on port $PORT."

# Deactivate the virtual environment
deactivate

echo "Server update complete."
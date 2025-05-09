#!/bin/bash

# Function to check and kill existing Gunicorn processes
function kill_gunicorn() {
    if pgrep -f gunicorn > /dev/null; then
        echo "Killing existing Gunicorn processes..."
        pkill -f gunicorn
        sleep 2  # Wait for the processes to terminate
    fi
}

# Source the virtual environment
source ./.venv/bin/activate

# Kill existing Gunicorn processes if any
kill_gunicorn

# Start Gunicorn with your configuration
nohup gunicorn 'app.run_app:app' --bind 0.0.0.0:8000 --daemon &
GUNICORN_PID=$!

echo "Captured Gunicorn PID: $GUNICORN_PID"

if [ -z "$GUNICORN_PID" ]; then
    echo "Failed to capture the PID of Gunicorn server."
    cat ./.tmp/gunicorn_output.log  # Print the log file contents in case of failure
    deactivate
    exit 1
fi

# Check if the process is running
if ps -p "$GUNICORN_PID" > /dev/null; then
    echo "Gunicorn server PID: $GUNICORN_PID"
else
    echo "Failed to start Gunicorn server."
    cat ./.tmp/gunicorn_output.log  # Print the log file contents in case of failure
    deactivate
    exit 1
fi

# Deactivate the virtual environment when done
deactivate
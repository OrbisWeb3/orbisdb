#!/bin/bash

# Navigate to the root of the project
cd "$(dirname "$0")"/..

# Ensure the .tmp directory exists for logs
mkdir -p .tmp

# Load environment variables
if [ -f .env ]; then
    echo "Loading environment variables from .env..."
    source .env
else
    echo ".env file not found. Please provide one to configure the environment."
    exit 1
fi

# Print all environment variables for debugging
echo "Environment variables:"
printenv

# Verify required tools are installed
command -v pip >/dev/null 2>&1 || { echo >&2 "pip is not installed. Aborting."; exit 1; }
command -v npm >/dev/null 2>&1 || { echo >&2 "npm is not installed. Aborting."; exit 1; }
command -v gunicorn >/dev/null 2>&1 || { echo >&2 "gunicorn is not installed. Installing..."; pip install gunicorn; }

# Install dependencies
echo "Installing missing dependencies..."
pip install -r ./requirements.txt &> ./.tmp/install_output.log || { echo "Python dependency installation failed. Check ./.tmp/install_output.log for details."; exit 1; }
npm install &> ./.tmp/npm_install_output.log || { echo "Node.js dependency installation failed. Check ./.tmp/npm_install_output.log for details."; exit 1; }


# Start Node.js server in the background
echo "Starting Node.js server..."
npx tsc -w &> ./.tmp/tsc_output.log &


node app/static/templates/server/server.js &> ./.tmp/node_output.log &
NODE_JS_PID=$!

# Wait for the Node.js server to start
sleep 2

# Check if the Node.js process is running
if ps -p $NODE_JS_PID > /dev/null; then
    echo "Node.js server is running (PID: $NODE_JS_PID)"
else
    echo "Failed to start Node.js server."
    cat ./.tmp/node_output.log  # Display the log contents for debugging
    exit 1
fi

# Tail Node.js logs in the background (optional)
tail -f ./.tmp/node_output.log &

# Activate the Python virtual environment
if [ ! -d ".venv" ]; then
    echo "Virtual environment not found. Creating one..."
    python3 -m venv .venv || { echo "Failed to create virtual environment. Aborting."; exit 1; }
fi

echo "Activating virtual environment..."
source ./.venv/bin/activate || { echo "Failed to activate virtual environment. Aborting."; exit 1; }

# Verify Flask installation
echo "Checking Flask installation..."
pip list | grep Flask >/dev/null || { echo "Flask is not installed. Please install it using 'pip install flask'."; deactivate; exit 1; }

# Start Gunicorn server
PORT=${FLASK_PORT:-4000}
echo "Starting Gunicorn server on port $PORT..."
gunicorn --worker-class gevent --workers 3 --bind 0.0.0.0:$PORT 'app.run_app:app' > ./.tmp/gunicorn_output.log 2>&1 &
GUNICORN_PID=$!

# Check if Gunicorn is running
if ps -p $GUNICORN_PID > /dev/null; then
    echo "Gunicorn server is running (PID: $GUNICORN_PID). Logs available in .tmp/gunicorn_output.log"
else
    echo "Failed to start Gunicorn server."
    cat ./.tmp/gunicorn_output.log  # Display the log contents for debugging
    deactivate
    exit 1
fi

# Tail Gunicorn logs (optional)
tail -f ./.tmp/gunicorn_output.log &

# Shutdown hook to clean up processes
trap 'echo "Stopping servers..."; kill $NODE_JS_PID; kill $GUNICORN_PID; deactivate; exit 0' SIGINT SIGTERM
wait

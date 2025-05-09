#!/bin/bash

# Navigate to the root of the project
cd "$(dirname "$0")"/..

# Print all environment variables
echo "Environment variables:"
printenv

# Ensure all required packages are installed
echo "Installing missing dependencies..."
pip install -r ./requirements.txt &> ./.tmp/install_output.log
npm install &> ./.tmp/npm_install_output.log

# Start the Node.js server in the background and store its PID
echo "Starting Node.js server..."
npx tsc -w &> ./.tmp/node_output.log &
node app/static/templates/server/server.js
NODE_JS_PID=$!

# Wait for 2 seconds to ensure the Node.js server has started
sleep 2

# Check if the Node.js process is running
if ps -p $NODE_JS_PID > /dev/null; then
    echo "Node.js server PID: $NODE_JS_PID"
else
    echo "Failed to start Node.js server."
    cat ./.tmp/node_output.log  # Print the log file contents in case of failure
    exit 1
fi

# Tail the Node.js output for real-time logs (optional, but useful)
echo "Node.js server is running. Checking logs..."
tail -f ./.tmp/node_output.log &

# Activate your virtual environment (if not already activated)
source ./.venv/bin/activate

# Check if the virtual environment is correctly set up
echo "Checking virtual environment..."
python3 --version  # Verify Python version
pip list | grep Flask  # Verify Flask installation
npm --version  # Verify Node.js installation
if [ $? -ne 0 ]; then
    echo "Flask or Node.js are not installed. Please install dependencies using 'pip install -r requirements.txt' and 'npm install'"
    deactivate
    exit 1
fi

# Read port from environment variable, default to 8000 if not set
PORT=${FLASK_PORT:-4000}
echo "Starting Gunicorn server on port $PORT with gevent workers..."
nohup gunicorn --worker-class gevent --workers 3 --bind 0.0.0.0:$PORT 'app.run_app:app' > .tmp/gunicorn_output.log 2>&1 &

echo "Gunicorn server started on port $PORT."

# Deactivate the virtual environment
deactivate

# Tail the Gunicorn output for real-time logs (optional, but useful)
echo "Gunicorn server is running. Checking logs..."
tail -f ./.tmp/gunicorn_output.log &
#!/bin/bash


# Activate your virtual environment (if not already activated)
source ./.venv/bin/activate

# Check if the virtual environment is correctly set up
echo "Checking virtual environment..."
python3 --version  # Verify Python version
pip list | grep Flask  # Verify Flask installation
npm --version  # Verify Node.js installation
if [ $? -ne 0 ]; then
    echo "Flask or Node.js are not installed. Please install dependencies using 'pip install -r requirements.txt' and 'npm install'"
#    stop the node server
    deactivate
    exit 1
fi

# Ensure all required packages are installed
echo "Installing missing dependencies..."
pip install -r ./requirements.txt &> ./.tmp/install_output.log

# Start the Node.js server
echo "Starting Node.js server..."
npm cache clean --force &> ./.tmp/node_output.log &
npm install &> ./.tmp/node_output.log &
node ./app/index.js &> ./.tmp/node_output.log &
npm run watch-css &> ./.tmp/node_output.log &
NODE_JS_PID=$!


# Set the FLASK_APP environment variable to point to your app.py file and specify the port
export FLASK_APP=./app/run_app.py
export FLASK_RUN_PORT=${FLASK_RUN_PORT}  # Specify the desired port here

# Start the Flask application in the background and store its PID
echo "Starting Flask server on port $FLASK_RUN_PORT..."
flask run &> ./.tmp/flask_output.log &
FLASK_PID=$!

# Wait for 2 seconds to ensure the Flask server has started
sleep 2

# Check if the Flask process is running
if ps -p $FLASK_PID > /dev/null; then
    echo "Flask server PID: $FLASK_PID"
else
    echo "Failed to start Flask server."
    cat ./.tmp/flask_output.log  # Print the log file contents in case of failure
    deactivate
    exit 1
fi

# Tail the Flask output for real-time logs (optional, but useful)
echo "Flask server is running. Checking logs..."
tail -f ./.tmp/flask_output.log &

# Run any additional Python scripts (e.g., Voice_v2.py) and capture their output
echo "Running additional services..."
python3.11 ./app/run_app.py &> ./.tmp/voice_output.log &

# Optionally, wait for a few more seconds before exiting
sleep 5

# Kill the Flask process if it's still running after `Voice_v2.py` finishes
if [ -n "$FLASK_PID" ]; then
    echo "Waiting for Flask server to finish..."
    sleep 10  # Give some time for cleanup
    kill $FLASK_PID || true  # Kill the process, ignore errors if it's already gone
    echo "Killed Flask server with PID: $FLASK_PID"
fi

# Check if the Node.js server is running
if [ -n "$NODE_JS_PID" ]; then
    if ps -p $NODE_JS_PID > /dev/null; then
        echo "Node.js server PID: $NODE_JS_PID"
    else
        echo "Failed to start Node.js server."
        cat ./.tmp/node_output.log  # Print the log file contents in case of failure
    fi
else
    echo "$NODE_JS_PID is not set. Node.js server was not started or PID capture failed."
fi

# Wait for a few more seconds before exiting
# sleep 100

echo "All services started successfully."

# Deactivate the virtual environment and exit
deactivate
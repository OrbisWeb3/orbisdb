#!/bin/bash


# Print all environment variables
# echo "Environment variables:"
# printenv
# Ensure all required packages are installed
echo "Installing missing dependencies..."
pip install -r ./requirements.txt &> ./.tmp/install_output.log
npm install &> ./.tmp/npm_install_output.log

# Start the Node.js server
echo "Starting Node.js server..."
npm cache clean --force &> ./.tmp/node_output.log &
rm -rf app/static  &> ./.tmp/node_output.log &
npx tsc -w &> ./.tmp/node_output.log &
# npx ts-node app/templates/server/server.ts &> ./.tmp/node_output.log &

# Start the Node.js server in the background and store its PID
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
echo "Starting Node.js server..."
npm cache clean --force &> ./.tmp/node_output.log &
rm -rf app/static  &> ./.tmp/node_output.log &
npx tsc -w &> ./.tmp/node_output.log &
# npx ts-node app/templates/server/server.ts &> ./.tmp/node_output.log &

# Start the Node.js server in the background and store its PID
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

# Node APP
node ./app/static/templates/server/server.js &> ./.tmp/node_output.log &
npm run build-css &> ./.tmp/node_output.log &
npx nodemon ./app/static/templates/sever/server.js &> ./.tmp/node_output.log &

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

# Set the FLASK_APP environment variable to point to your app.py file and specify the port
export FLASK_APP=./app/run_app.py
export FLASK_RUN_PORT=${FLASK_RUN_PORT:-4000}  # Specify the desired port here (default is 4000)

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
python3.11 ./app/tools/Voice_v2.py &> ./.tmp/voice_output.log &

# Function to shut down Node.js server using clear_ports.sh
shutdown_nodejs() {
    echo "Shutting down servers..."

    # Read the .env file and extract ports based on environment variable names ending with 'PORT'
    while IFS='=' read -r key value; do
        if [[ "$key" == *PORT ]]; then
            .bin/clear_ports.sh "$value"
        fi
    done < .env
}

# Function to review all environment ports in use
review_ports() {
    echo "Reviewing all environment ports in use..."
    while IFS='=' read -r key value; do
        if [[ "$key" == *PORT ]]; then
            echo "Port in use: $key=$value"
        fi
    done < .env
}

# Optionally, wait for a few more seconds before exiting
sleep 60

# Kill the Flask process if it's still running after `Voice_v2.py` finishes
if [ -n "$FLASK_PID" ]; then
    echo "Waiting for Flask server to finish..."
    sleep 10  # Give some time for cleanup
    kill $FLASK_PID || true  # Kill the process, ignore errors if it's already gone
    echo "Killed Flask server with PID: $FLASK_PID"
fi

# Call the shutdown_nodejs function to terminate Node.js server
shutdown_nodejs

# Review all environment ports in use
review_ports

echo "All services have been shut down."
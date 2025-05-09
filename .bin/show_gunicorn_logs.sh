#!/bin/bash

# Navigate to the root of the project
cd "$(dirname "$0")"/..

# Ensure all required packages are installed
echo "Checking if required packages are installed..."

# Install dependencies
pip install -r ./requirements.txt &> /dev/null
if [ $? -ne 0 ]; then
    echo "One or more dependencies are missing. Please install them using 'pip install -r requirements.txt'"
    pip install --upgrade pip
    pip install -r requirements.txt
    exit 1
fi

# Check if the virtual environment is activated
source config.env
if [ ! -d ".venv" ]; then
    echo "Virtual environment not found. Creating it using 'python3 -m venv .venv'..."
    python3 -m venv .venv
fi

echo "Activating virtual environment..."
source ./.venv/bin/activate &> /dev/null
if [ $? -ne 0 ]; then
    echo "Failed to activate virtual environment. Please ensure it is correctly set up."
    exit 1
fi

# Check if gunicorn is installed
pip show gunicorn &> /dev/null
if [ $? -ne 0 ]; then
    echo "gunicorn is not installed. Installing it..."
    pip install gunicorn
fi

# Function to start Gunicorn with logs in the terminal
start_gunicorn_with_logs() {
    echo "Starting Gunicorn server with gevent workers..."
    gunicorn --worker-class gevent --workers 3 --bind 0.0.0.0:8000 'app.run_app:app' > .tmp/gunicorn_output.log 2>&1 &
    echo "Gunicorn server started."
}

# Function to show Gunicorn logs in the terminal
show_gunicorn_logs() {
    echo "Showing Gunicorn logs..."
    tail -f .tmp/gunicorn_output.log
}

# Main logic
if [ "$#" -eq 0 ]; then
    start_gunicorn_with_logs
elif [ "$1" == "logs" ]; then
    show_gunicorn_logs
else
    echo "Usage: $0 [logs]"
    exit 1
fi

# Deactivate the virtual environment
deactivate

# --worker-class gevent: This tells Gunicorn to use the gevent worker class, 
# which is more suitable for high-concurrency applications and
# can handle many requests using fewer resources.

# --workers 3: Specifies the number of worker processes. You can adjust this based on your server's CPU cores
# and available memory.
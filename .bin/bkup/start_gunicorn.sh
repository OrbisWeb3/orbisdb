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

# Read port from environment variable, default to 8000 if not set
PORT=${FLASK_PORT:-8000}
echo "Starting Gunicorn server on port $PORT with gevent workers..."
nohup gunicorn --worker-class gevent --workers 3 --bind 0.0.0.0:$PORT 'app.run_app:app' > .tmp/gunicorn_output.log 2>&1 &

echo "Gunicorn server started on port $PORT."

# Deactivate the virtual environment
deactivate

# --worker-class gevent: This tells Gunicorn to use the gevent worker class, 
# which is more suitable for high-concurrency applications and
# can handle many requests using fewer resources.

# --workers 3: Specifies the number of worker processes. You can adjust this based on your server's CPU cores
# and available memory.
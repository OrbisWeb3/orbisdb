#!/bin/bash

# Navigate to the root of the project
cd "$(dirname "$0")"/..

# Function to create and activate virtual environment
create_and_activate_venv() {
    echo "Creating and activating virtual environment..."
    
    # Remove existing venv directory if exists
    if [ -d ".venv" ]; then
        rm -rf .venv
    fi

    # Create a new virtual environment
    python3.11 -m venv .venv

    # Activate the virtual environment
    source ./.venv/bin/activate

    echo "Virtual environment activated."
}

# Function to install dependencies
install_dependencies() {
    echo "Installing dependencies..."
    
    # Install all required packages
    pip install -r requirements.txt
    
    if [ $? -ne 0 ]; then
        echo "One or more dependencies failed to install. Please check the requirements.txt file."
        exit 1
    fi

    echo "Dependencies installed successfully."
}

# Function to start Gunicorn with logs in the terminal
start_gunicorn_with_logs() {
    echo "Starting Gunicorn server with gevent workers and logging..."
    
    # Create .tmp directory if it doesn't exist
    mkdir -p .tmp
    
    # Start Gunicorn with logs
    gunicorn --worker-class gevent --workers 3 --bind 0.0.0.0:8000 'app.run_app:app' > .tmp/gunicorn_output.log 2>&1 &
    
    echo "Gunicorn server started with gevent workers."
}

# Function to show Gunicorn logs in the terminal
show_gunicorn_logs() {
    tail -f .tmp/gunicorn_output.log
}

# Main logic based on arguments
case "$1" in
    setup)
        create_and_activate_venv
        install_dependencies
        ;;
    start)
        source ./.venv/bin/activate
        start_gunicorn_with_logs
        ;;
    logs)
        show_gunicorn_logs
        ;;
    *)
        echo "Usage: $0 [setup|start|logs]"
        exit 1
esac
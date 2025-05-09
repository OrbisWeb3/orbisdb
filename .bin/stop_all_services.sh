#!/bin/bash

#!/bin/bash

# Function to clear a single port
clear_port() {
    local PORT=$1

    # Ensure the PORT variable is expanded correctly
    if [[ -z "$PORT" ]]; then
        echo "No valid port provided."
        return 1
    fi

    echo "Checking for process on port $PORT..."

    # Find the process ID using lsof
    PID=$(lsof -i :$PORT -t)

    if [ -z "$PID" ]; then
      echo "No process found running on port $PORT."
    else
      echo "Killing process $PID running on port $PORT..."
      kill $PID
      if [ $? -eq 0 ]; then
        echo "Process $PID has been successfully terminated."
      else
        echo "Failed to terminate process $PID."
      fi
    fi
}

# Read the .env file and extract ports
while IFS='=' read -r key value; do
    # Check if the line is a valid environment variable
    if [[ "$key" == PORT* || "$key" == *_PORT ]]; then
        clear_port "$value"
    fi
done < .env

# Optionally, you can also clear specific ports mentioned in .env.example
while IFS='=' read -r key value; do
    # Check if the line is a valid environment variable
    if [[ "$key" == PORT* || "$key" == *_PORT ]]; then
        clear_port "$value"
    fi
done < .env.example

# Function to stop Flask servers based on process name or port
stop_flask_servers() {
    # List all Python processes that are running Flask apps
    PIDS=$(pgrep -f "flask run")

    if [ -z "$PIDS" ]; then
        echo "No Flask servers found."
        return
    fi

    for PID in $PIDS; do
        echo "Stopping Flask server with PID: $PID"
        kill $PID
    done

    echo "All Flask servers have been stopped."
}

# Function to stop Gunicorn processes
stop_gunicorn_servers() {
    # List all Python processes that are running Gunicorn
    PIDS=$(pgrep -f "gunicorn")

    if [ -z "$PIDS" ]; then
        echo "No Gunicorn servers found."
        return
    fi

    for PID in $PIDS; do
        echo "Stopping Gunicorn server with PID: $PID"
        kill $PID
    done

    echo "All Gunicorn servers have been stopped."
}

# Stop both Flask and Gunicorn servers
stop_flask_servers
stop_gunicorn_servers
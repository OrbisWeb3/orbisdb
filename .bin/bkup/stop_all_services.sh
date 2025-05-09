#!/bin/bash

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
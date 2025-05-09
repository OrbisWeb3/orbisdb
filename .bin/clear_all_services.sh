#!/bin/bash

# Determine the environment (e.g., from an env var)
ENVIRONMENT=${ENVIRONMENT:-development}

# Source the appropriate .env file based on the environment
if [ "$ENVIRONMENT" == "development" ]; then
  if [ -f .env ]; then
    source .env
  else
    echo ".env file not found. Exiting."
    exit 1
  fi
else
  if [ -f .env.development ]; then
    source .env.development
  else
    echo ".env.development file not found. Exiting."
    exit 1
  fi
fi

# Function to clear a single port
clear_port() {
    local PORT=$1

    # Validate that the PORT is a number
    if [[ ! "$PORT" =~ ^[0-9]+$ ]]; then
        echo "Invalid port value: $PORT. Skipping..."
        return
    fi

    # Find the process ID using lsof
    PID=$(lsof -i :$PORT -t)

    if [ -z "$PID" ]; then
        echo "No process found running on port $PORT."
    else
        echo "Killing process $PID running on port $PORT..."
        kill -9 $PID
        if [ $? -eq 0 ]; then
            echo "Process $PID on port $PORT has been successfully terminated."
        else
            echo "Failed to terminate process $PID on port $PORT."
        fi
    fi
}

# Extract ports from the .env file dynamically
echo "Scanning .env file for port variables..."
PORT_KEYS=(NODE_FRONTEND_PORT BACK_END_NODE_PORT BACK_END_NODE_PORT1 NODE_API_PORT GRAPHQL_PORT DB_PORT NODE_PORT FLASK_PORT FLASK_RUN_PORT)

for KEY in "${PORT_KEYS[@]}"; do
    PORT=$(grep -E "^${KEY}=" .env | cut -d '=' -f 2 | tr -d '"')
    if [ -n "$PORT" ]; then
        clear_port "$PORT"
    fi
done

echo "All specified ports have been checked and cleared."

#!/bin/bash

# Determine the environment (e.g., from an env var)
ENVIRONMENT=${ENVIRONMENT:-development}

# Source the appropriate .env file based on the environment
if [ "$ENVIRONMENT" == "development" ]; then
  source .env
else
  source .env.development
fi

# Function to check if a string is a valid numeric port
is_numeric_port() {
    [[ $1 =~ ^[0-9]+$ ]]
}

# Function to clear a single port
clear_port() {
    local PORT=$1

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

# Read the .env file and extract ports with debugging output
while IFS='=' read -r key value; do
    # Check if the line is a valid environment variable
    if [[ "$key" == PORT* || "$key" == *_PORT ]]; then
        echo "Found port variable: $key=$value"
        # Check if the value is a numeric port
        if is_numeric_port "$value"; then
            clear_port "$value"
        else
            echo "Skipping non-numeric port value: $key=$value"
        fi
    fi
done < .env

# Optionally, you can also clear specific ports mentioned in .env.example
while IFS='=' read -r key value; do
    # Check if the line is a valid environment variable
    if [[ "$key" == PORT* || "$key" == *_PORT ]]; then
        echo "Found port variable: $key=$value"
        # Check if the value is a numeric port
        if is_numeric_port "$value"; then
            clear_port "$value"
        else
            echo "Skipping non-numeric port value: $key=$value"
        fi
    fi
done < .env.example
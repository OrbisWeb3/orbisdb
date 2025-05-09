#!/bin/bash

# Find the directory containing package.json
PACKAGE_DIR=$(dirname $(find . -name "package.json" | head -n 1))

# Change to that directory
cd "$PACKAGE_DIR"

# Create an empty output file
> output.txt

# Loop through all files in the directory and subdirectories
for file in "./**"; do
    # Check if the current item is a file
    if [ -f "$file" ]; then
    echo "Content of $file:" >> output.txt
    cat "$file" >> output.txt
    fi
done

# Output completion message
echo "File map complete. Map saved to output.txt"

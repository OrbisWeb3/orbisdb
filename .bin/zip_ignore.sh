#!/bin/bash

# Directory to zip
SOURCE_DIR="./"

# Output ZIP file
ZIP_FILE="librit_appFolder.zip"

# Temporary list for unique untracked files
UNTRACKED_FILES=$(mktemp)
# Get the absolute path of SOURCE_DIR
ABS_SOURCE_DIR=$(realpath "$SOURCE_DIR")

# Debug: Print source directory and temporary file paths
echo "Source Directory: $ABS_SOURCE_DIR"
echo "Untracked Files List: $UNTRACKED_FILES"

# Function to check if a file/directory matches a gitignore pattern recursively
is_ignored() {
    local path="$1"
    for pattern in $(grep -v '^#' .gitignore | grep -v '^$'); do
        # Convert pattern to regex and escape special characters
        regex=$(echo "$pattern" | sed 's/[][\\^$.|?*+]/\\&/g')
        if [[ "$path" =~ ^$regex ]]; then
            echo "Matched ignored file: $ABS_SOURCE_DIR/$path"
            return 0
        fi
    done
    return 1
}

# Get untracked and ignored files using git status --porcelain=v2
while IFS= read -r line; do
    # Parse the git status line
    status="${line:0:2}"
    path="${line:3}"

    if [[ "$status" == "?? " ]]; then
        echo "$path" >> "$UNTRACKED_FILES"
    fi
done <<< "$(git -C "$SOURCE_DIR" status --porcelain=v2)"

# Sort the untracked files list to ensure uniqueness
sort -u "$UNTRACKED_FILES" -o "$UNTRACKED_FILES"

# Initialize array for ignored files
IGNORED_FILES=()

# Filter out ignored files from the untracked list and ensure uniqueness
while IFS= read -r file; do
    # Debug: Print current file being processed
    echo "Processing file: $file"

    if is_ignored "$file"; then
        IGNORED_FILES+=("$ABS_SOURCE_DIR/$file")
        echo "Added to ignored files list: @$ABS_SOURCE_DIR/$file"
    else
        echo "$file" >> "$UNTRACKED_FILES"
        echo "Added to untracked files list: $file"
    fi
done < "$UNTRACKED_FILES"

# Create the ZIP archive excluding ignored files and untracked files
if [ ${#IGNORED_FILES[@]} -eq 0 ]; then
    # If no ignored files, simply zip everything
    echo "No ignored files found. Creating a full ZIP archive."
    zip -r "$ZIP_FILE" "$SOURCE_DIR"
else
    # Exclude ignored files from the ZIP archive
    zip -r "$ZIP_FILE" "$SOURCE_DIR" "${IGNORED_FILES[@]/#/--exclude=}"
fi

# Debug: Print contents of untracked files list and ignored files list
echo "Untracked Files List Contents:"
cat "$UNTRACKED_FILES"
echo "Ignored Files List Contents:"
for file in "${IGNORED_FILES[@]}"; do
    echo "$file"
done
# Check if zip command was successful
if [ $? -eq 0 ]; then
    echo "Zip archive created successfully."
else
    echo "Error creating zip archive."
fi

# Clean up temporary files
rm "$UNTRACKED_FILES"

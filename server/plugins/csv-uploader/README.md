The CSV Uploader plugin allows users to easily import large amounts of data into OrbisDB using a CSV file. This plugin exposes an upload route that users can use to push the CSV they want to import.

## Features

- **Easy Data Import**: Simplify the process of importing large datasets into OrbisDB.
- **Upload Route**: Provides a straightforward upload route for users to submit their CSV files.
- **Data Validation**: Ensures that CSV columns are structured to match the fields of the model being used.

## Installation

To install the CSV Uploader plugin, follow these steps:

1. Add the plugin to your OrbisDB instance.
2. Configure the plugin according to your requirements using either an existing context or by creating a new one.

## Usage

### Upload Route

The plugin exposes an `upload` route which users can use to push the CSV file they want to import.

### CSV Structure

Ensure that your CSV file's columns match the fields of the model you are using in OrbisDB.

- **Field Matching**: The column names in the CSV must precisely match the field names of your model.
- **Array and Object Fields**: For columns of type array or object, use default values like `[]` or `{}` to respect the format.

The Dune Analytics Plugin allows users to create tables from their OrbisDB instance on Dune Analytics to perform deeper analytics and push Ceramic data to Dune Analytics. This plugin syncs your data regularly based on the cron settings you configure.

## Features

- **Sync OrbisDB Data to Dune Analytics**: Push your Ceramic data to Dune Analytics for advanced querying and visualization.
- **Regular Data Sync**: Configure cron settings to sync your data at regular intervals.
- **Easy Configuration**: Set up the plugin with minimal configuration using your Dune developer API key, namespace, and OrbisDB table.

## Installation

To install the Dune Analytics Plugin, follow these steps:

1. Add the plugin to your OrbisDB instance.
2. Configure the plugin settings through the user interface.

## Configuration

### Settings

The plugin requires the following settings, which can be configured through the user interface:

- **Dune Developer API Key**: Your developer API key from Dune Analytics.
- **Namespace**: The namespace in Dune Analytics where you want to create the table.
- **OrbisDB Table**: The OrbisDB table you want to push to Dune Analytics.
- **Cron Settings**: The cron expression to schedule regular data syncs.

### Example Settings

Here is an example of how the settings might look:

- **Dune Developer API Key**: `your-dune-api-key`
- **Namespace**: `your-dune-namespace`
- **OrbisDB Table**: `your-orbisdb-modelid`
- **Cron Settings**: `0 * * * *` (sync data every hour)

## Usage

### Initialization

The plugin initializes by connecting to Dune Analytics using the provided developer API key and sets up a cron job to sync the specified OrbisDB table at regular intervals.

Each sync costs Dune Analytics credits.

### Syncing Data

The plugin syncs data from your OrbisDB instance to Dune Analytics based on the cron settings:

1. **API Key**: Authenticate with Dune Analytics using your developer API key.
2. **Namespace**: Specify the namespace where the table will be created.
3. **OrbisDB Table**: Define the OrbisDB table to push data from.
4. **Cron Settings**: Set the interval for regular data syncs.

By following these steps and using the Dune Analytics Plugin, you can seamlessly integrate your OrbisDB data with Dune Analytics for advanced analytics and visualization.

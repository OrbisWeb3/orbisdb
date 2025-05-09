The ChatGPT Plugin is designed to interact with OpenAI's Chat GPT API to enhance existing streams or create new ones in OrbisDB. This plugin exposes routes for chat interaction and supports actions such as updating streams, adding metadata, and generating new streams. This plugin is still a work in progress, feel free to look into [the repository]("https://github.com/OrbisWeb3/orbisdb/tree/master/server/plugins/chat-gpt") and suggest updates.

## Features

- **Query OpenAI's Chat GPT API**: Integrate with OpenAI to enhance data streams.
- **Dynamic Actions**: Support for actions like updating streams, adding metadata, and generating new streams.
- **Customizable Intervals**: Configure intervals for periodic data fetching when generating new streams.

## Installation

To install the ChatGPT Plugin, follow these steps:

1. Add the plugin to your OrbisDB instance.
2. Configure the plugin settings as per your requirements.

## Configuration

### Settings

The plugin settings file includes the following variables:

- **Organization ID**: The organization ID for OpenAI.
- **Secret Key**: The secret key for OpenAI.
- **Action**: The action the plugin should perform (`add_metadata`, `update`, or `generate`).
- **Interval**: Interval in seconds to perform the OpenAI call (only for the `generate` action).
- **Model**: The model used by the streams created by the plugin.
- **Prompt**: The question to ask the AI, with support for using stream variables.
- **Result is a JSON Object**: Whether the OpenAI response should be returned as a JSON Object.
- **Field**: The field that will be updated in the content object (only for the `update` action).
- **Query**: Optional dynamic query to pass additional data to the prompt.

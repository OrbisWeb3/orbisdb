The API Data Source Plugin is used to generate streams in OrbisDB based on data fetched from external API sources. This plugin allows users to specify an API endpoint, map the API response to a Ceramic model, and set an interval for periodic data fetching.

## Features

- **Fetch Data from External APIs**: Connect to any API to retrieve data.
- **Data Mapping**: Map API response data to your Ceramic schema.
- **Periodic Fetching**: Set intervals for regular data fetching.

## Installation

To install the API Data Source Plugin, follow these steps:

1. Add the plugin to your OrbisDB instance.
2. Configure the plugin settings through the user interface.

## Configuration

### Settings

The plugin settings can be configured through the user interface with the following variables:

- **URL Endpoint**: The API endpoint to call to retrieve the results.
- **Model**: The Ceramic model used to store the data retrieved from the API.
- **Keys Mapping**: Map the output from your data source to your Ceramic schema.
- **Interval**: The interval in seconds to perform the API call.

### Example Settings

Here is an example of how the settings might look:

- **URL Endpoint**: `https://api.example.com/data`
- **Model**: <MODEL_ID>
- **Keys Mapping**: See below for an example.
- **Interval**: `3600` (fetch data every hour)

### Mapping Keys

The **Keys Mapping** setting allows you to map the structure of the API response to the Ceramic schema fields. The mapping should be specified as a JSON object.

#### Example

For an API returning this API Response:

```json
{
  "data": {
    "asset": "Bitcoin",
    "price": 45000,
    "currency": "USD",
    "source": "example.com",
    "candle": "1h",
    "timestamp": 1625235600
  }
}
```

You can use the following mapping:

```json
[
  {
    "keys": [
      { "key": "asset", "value": "bitcoin" },
      { "key": "price", "path": ["bitcoin", "usd"], "type": "numeric" }
    ]
  }
]
```

**In this example:**

- `asset` The `asset` field in your model will always be set to `bitcoin`.
- `price` field in your model is mapped to the `bitcoin[usd]` field and converted to a numeric type.

The ENS Plugin allows users to convert an ENS domain to an address or an address to an ENS domain in OrbisDB. It integrates with the Ethereum blockchain using an RPC URL and provides metadata conversion for specified fields in streams.

## Features

- **ENS to Address**: Convert ENS domains to Ethereum addresses.
- **Address to ENS**: Convert Ethereum addresses to ENS domains.
- **Conditional Application**: Apply conversion only to a specific models if needed.

## Installation

To install the ENS Plugin, follow these steps:

1. Add the plugin to your OrbisDB instance.
2. Configure the plugin settings through the user interface.

## Configuration

### Settings

The plugin settings can be configured through the user interface with the following variables:

- **RPC URL**: The RPC URL to use to communicate with the blockchain.
- **Action**: The action the plugin should perform (`Name to Address` or `Address to Name`).
- **Field**: The field to use for the conversion. Stream fields are under the `content` object, and generic fields are parent fields (like `controller`).
- **Apply only on a specific model?**: Specify whether to use the plugin only on a specific model (`yes` or `no`).
- **Model ID**: The model ID on which this plugin should be used (required if applying only on a specific model).

### Example Settings

Here is an example of how the settings might look:

- **RPC URL**: `https://mainnet.infura.io/v3/YOUR_INFURA_PROJECT_ID`
- **Action**: `Name to Address`
- **Field**: `content.ensName`
- **Apply only on a specific model?**: `Yes`
- **Model ID**: `<MODEL_ID>`

## Usage

### Initialization

The plugin initializes and sets up hooks for metadata conversion. It connects to the Ethereum blockchain using the provided RPC URL and performs conversions based on the specified action and field.

### Adding Metadata

The `add_metadata` method is triggered to convert the specified field:

- **Name to Address**: Converts an ENS name to an Ethereum address.
- **Address to Name**: Converts an Ethereum address to an ENS name.

### Example Use Case

1. **RPC URL**: `https://mainnet.infura.io/v3/YOUR_INFURA_PROJECT_ID`
2. **Action**: `Address to Name`
3. **Field**: `controller`
4. **Apply only on a specific model?**: `No`

By following these steps and using the ENS Plugin, you can seamlessly convert ENS domains and Ethereum addresses in your OrbisDB instance, ensuring accurate and up-to-date metadata.

## Contributing

To contribute to the [ENS Plugin]("https://github.com/OrbisWeb3/orbisdb/tree/master/server/plugins/ens"):

1. Fork the [repository]("https://github.com/OrbisWeb3/orbisdb/tree/master/server/plugins/ens").
2. Create a new branch for your feature or bugfix.
3. Submit a pull request with a detailed description of your changes.

## License

This project is licensed under the MIT License.

## Support

If you encounter any issues or have any questions, please open an issue in the repository or contact our support team.

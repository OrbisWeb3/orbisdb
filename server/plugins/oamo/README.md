# Oamo Plugin

## About Oamo Plugin

The **Oamo Plugin** is a comprehensive tool designed to enhance your application's profile and credential management capabilities. By leveraging Oamo's robust data models, this plugin provides functionalities such as validating model instances to ensure data integrity and enriching your data streams with meaningful metadata. Whether you're managing user profiles, credentials, or their intricate relationships, the Oamo Plugin offers a seamless and secure solution to maintain and enhance your application's data ecosystem.

## Key Features and Benefits

1. **Comprehensive Data Validation**: Ensure the integrity and consistency of your data by validating various Oamo models, including `OamoChildrenProfile`, `OamoCredential`, `OamoCredentialRelation`, `OamoProfile`, and `OamoPublicProfile`.

2. **Metadata Enrichment**: Automatically add valuable metadata to your data streams, such as timestamps, checksums, hashes, and related document statuses, enhancing the richness and utility of your data.

3. **Flexible Hook System**: Utilize a versatile hook system that allows you to trigger specific actions (`validate`, `add_metadata`) based on your application's needs, ensuring seamless integration and customization.

4. **Decentralized Identifier (DID) Integration**: Leverage Oamo's decentralized identifiers to manage and validate user profiles and credentials securely, maintaining user privacy and data ownership.

5. **Environment Configuration**: Easily switch between different Oamo environments (production, staging, development) to align with your deployment stages and testing requirements.

6. **Context-Aware Configuration**: Configure the plugin settings per context, allowing for tailored validation rules and metadata addition based on different application contexts or modules.

7. **Extensible Architecture**: Built with extensibility in mind, the Oamo Plugin can be easily expanded to include additional actions, models, or integrations as your application evolves.

## Using the Plugin

The Oamo Plugin for OrbisDB integrates effortlessly into your application, providing robust profile and credential management functionalities. Follow the steps below to install, configure, and utilize the plugin effectively.

### Installation

1. **Download the Plugin**: Clone or download the Oamo Plugin repository into your project's plugins directory.

   ```bash
   git clone https://github.com/oamo/oamo-plugin.git
   ```

2. **Install Dependencies**: Navigate to the plugin directory and install any necessary dependencies.

   ```bash
   cd oamo-plugin
   npm install
   ```

3. **Integrate with OrbisDB**: Ensure that the plugin is recognized by your OrbisDB instance by following your platform's plugin integration guidelines.

### Configuration

Upon installation, you'll need to configure the plugin by setting up the `settings.json` file. Below is a guide to configuring each setting:

#### Settings

1. **API Key**

   - **Description**: Your API key for authenticating with Oamo services.
   - **ID**: `api_key`
   - **Type**: `string`
   - **Usage**: This key is essential for authenticating API requests to Oamo services. Obtain your API key from the Oamo developer portal.

2. **Action**

   - **Description**: Select the action the plugin should perform.
   - **ID**: `action`
   - **Type**: `select`
   - **Options**:
     - **Validate**: Validates model instances to ensure data integrity.
     - **Add Metadata**: Enriches model instances with additional metadata.
   - **Usage**: Choose the appropriate action based on your current requirements. You can assign different actions to different contexts.

3. **Field**

   - **Description**: Specify the field to use for the selected action. Fields under the `content` object pertain to the model's properties, while generic fields like `controller` are top-level.
   - **ID**: `field`
   - **Type**: `string`
   - **Usage**: Define which field from your data stream should be utilized for validation or metadata addition. This ensures that the plugin processes the correct data point.

4. **Minimum Score**

   - **Description**: The minimum score required for validation actions.
   - **ID**: `min_score`
   - **Type**: `integer`
   - **Conditions**: Only applicable if the `action` is set to `validate`.
   - **Usage**: Set a threshold to ensure that only data meeting or exceeding this score is considered valid. This helps in maintaining high data quality standards.

5. **Oamo Environment**

   - **Description**: Select the Oamo environment to connect to.
   - **ID**: `environment`
   - **Type**: `select`
   - **Options**:
     - **Production**: Connect to the live Oamo environment.
     - **Staging**: Connect to the staging environment for testing purposes.
     - **Development**: Connect to the development environment for active development.
   - **Usage**: Choose the appropriate environment based on your deployment stage to ensure that the plugin interacts with the correct Oamo instance.

6. **Default Status**

   - **Description**: Set the default document status for new entries.
   - **ID**: `default_status`
   - **Type**: `select`
   - **Options**:
     - **ACTIVE**: The document is active and in use.
     - **INACTIVE**: The document is inactive but retained for records.
     - **DELETED**: The document is marked for deletion.
   - **Usage**: Define the default status to maintain consistent data states across your application.

### Assigning the Plugin to a Context

After configuring the `settings.json`, assign the Oamo Plugin to the desired context within your OrbisDB instance:

1. **Navigate to Context Settings**: Access the context where you want to apply the plugin.

2. **Assign the Plugin**: Select the Oamo Plugin from the list of available plugins.

3. **Configure Per-Context Settings**: Provide context-specific configurations such as API Key, Action, Field, and Minimum Score as required.

4. **Save and Apply**: Save the settings to activate the plugin within the selected context.

### Operational Flow

1. **Data Ingestion**: When data streams into your application, the Oamo Plugin processes each stream based on the assigned action (`validate` or `add_metadata`).

2. **Validation**: If the action is set to `validate`, the plugin checks the specified fields against the required criteria (e.g., minimum score). Streams that pass validation are approved, while those that fail are rejected.

3. **Metadata Addition**: If the action is set to `add_metadata`, the plugin enriches the data streams with additional metadata such as timestamps, checksums, hashes, and related document statuses.

4. **Context-Specific Behavior**: The plugin operates based on the context-specific configurations, allowing different behaviors in different parts of your application.

### Example Usage Scenario

**Validating a User Profile**

1. **Assign Plugin**: Assign the Oamo Plugin to the `UserProfiles` context with the action set to `validate`.

2. **Configure Settings**:
   - **API Key**: Provide your Oamo API Key.
   - **Field**: Set to `profileScore`.
   - **Minimum Score**: Set to `50`.

3. **Data Processing**: When a new user profile is created, the plugin validates the `profileScore` field. Only profiles with a score of 50 or higher are approved and allowed to interact within the application.

**Adding Metadata to Credentials**

1. **Assign Plugin**: Assign the Oamo Plugin to the `UserCredentials` context with the action set to `add_metadata`.

2. **Configure Settings**:
   - **API Key**: Provide your Oamo API Key.
   - **Field**: Set to `credentialData`.

3. **Data Enrichment**: When a new credential is added, the plugin enriches it with metadata such as a checksum of the credential data and the current timestamp, ensuring data integrity and traceability.

## API Route

The Oamo Plugin does not expose any additional API routes beyond its integration within your OrbisDB instance. All interactions are managed through the plugin's hooks and configurations. However, you can extend the plugin to include custom API endpoints if your application requires them.

## Contributing

We welcome contributions to the Oamo Plugin! If you have suggestions, bug reports, or want to contribute new features, please follow these steps:

1. **Fork the Repository**: Click the "Fork" button at the top of the repository page.

2. **Create a Branch**: Create a new branch for your feature or bug fix.

   ```bash
   git checkout -b feature/your-feature-name
   ```

3. **Commit Your Changes**: Make your changes and commit them with clear messages.

   ```bash
   git commit -m "Add feature: your feature description"
   ```

4. **Push to Your Fork**:

   ```bash
   git push origin feature/your-feature-name
   ```

5. **Open a Pull Request**: Navigate to the original repository and open a pull request detailing your changes.

## Support

If you encounter any issues or have questions about the Oamo Plugin, please open an issue in the [GitHub repository](https://github.com/your-repo/oamo-plugin/issues) or contact our support team at [hello@oamo.io](mailto:hello@oamo.com).

## License

The Oamo Plugin is released under the [MIT License](https://opensource.org/licenses/MIT). See `LICENSE` for more information.

## Acknowledgements

- Built with inspiration from the [Gitcoin Passport Plugin](https://github.com/gitcoin/passport-plugin).
- Thanks to the Oamo development team for providing comprehensive data models and support.

---

**Note**: Replace placeholders like `https://github.com/your-repo/oamo-plugin` and `support@oamo.com` with your actual repository link and support email address.
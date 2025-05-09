# Orbirsbd Middleware
The Orbisdb connects you to the Graphql system that mnages your Web3 data.


### Base Command Explanation

1. Set up Ceramic DB
```bash

cd server
./wheel
```

This command executes the `wheel` script located in the current directory. `wheel` appears to be a tool or utility for setting up and managing a Ceramic-based application.

### Configuration Prompt

The script prompts the user to confirm the initial configuration settings. Here's a breakdown of what happens:

1. **Project Name**: The user is asked if they want to keep or change the project name. The default project name is "ceramic-app".
2. **Project Directory**: The user is asked if the project directory already exists and, if not, if they want to create it.
3. **Network**: The user is asked if they want to use the `InMemory` network for testing purposes.
4. **Ceramic Included**: The script checks if Ceramic should be included in the setup.
5. **ComposeDB Included**: The script checks if ComposeDB should be included.
6. **ComposeDB Sample Application Included**: The script checks if a sample ComposeDB application should be included.
7. **DID Generated Secret Key Path**: The user is asked to provide the path where the DID secret key will be saved.
8. **Confirmation**: The user confirms whether they want to keep or change the configuration.

### Database Verification

The script then verifies the connection to the SQLite database using the provided connection string:

```bash
Verifying database connection using connection string sqlite:///Users/jeldonmusic/Documents/matrixblend_com/Datbase/orbisdb/server/ceramic-app/ceramic-indexing/ceramic.db
```

This ensures that the database is accessible and properly configured.

### Writing Configuration Files

The script writes configuration files to the project directory:

```bash
Saving config to /Users/jeldonmusic/Documents/matrixblend_com/Datbase/orbisdb/server/ceramic-app/ceramic.json
Saving daemon file to /Users/jeldonmusic/Documents/matrixblend_com/Datbase/orbisdb/server/ceramic-app/daemon_config.json
```

These files contain the necessary configuration settings for the Ceramic and ComposeDB setup.

### Installing Dependencies

The script installs dependencies using npm:

```bash
+ Installing dependencies for @ceramicnetwork/cli
When you would like to run ceramic please run 
./ceramic daemon --config /Users/jeldonmusic/Documents/matrixblend_com/Datbase/orbisdb/server/ceramic-app/daemon_config.json
from the directory /Users/jeldonmusic/Documents/matrixblend_com/Datbase/orbisdb/server/ceramic-app. For more information on the Ceramic http api see https://developers.ceramic.network/build/http/api/
```

This command installs the necessary dependencies for the `@ceramicnetwork/cli` package.

### Summary of the Process

- **User Interaction**: The user is prompted to confirm or change various configuration settings.
- **Database Verification**: The script checks the SQLite database connection.
- **Configuration Writing**: Configuration files are written to the project directory.
- **Dependency Installation**: Dependencies are installed using npm.
- **Ceramic Setup**: The script sets up a Ceramic network and initializes the ComposeDB application.

This process ensures that the Ceramic setup is correctly configured for your Ceramic-based application.
## Prerequisites

Ensure you have the following installed:

- Docker version 20.10 or later
- Docker Compose version 1.29 or later
- Node.js version 18.0.0 or later

## Environment Variables

Set the following environment variables in a `.env` file or export them in your shell:

- `POSTGRES_USER`: Database username (default: `user`)
- `POSTGRES_PASSWORD`: Database password (default: `password`)

## Build and Run Instructions

1. Clone the repository and navigate to the project directory.

   ```bash
   git clone https://github.com/your-repo/project.git
   cd project
   ```

2. Build and start the services using Docker Compose:

   ```bash
   cd docker/core/
   docker build -f ../../docker/core/Dockerfile ../..
   ```

3. Access the application at `http://localhost:7008`.

## Ceramatic (MacOS)

```bash
brew install ceramicnetwork/tap/ceramic-one
ceramic-one daemon --network in-memory

```

## Exposed Ports

- `app`: 7008
- `db`: Not exposed externally

## Notes

- Ensure the `Dockerfile` and `docker-compose.yml` are correctly configured for your environment.
- For additional configuration, refer to the [documentation](#documentation-community).

## Starting the Server

To start the server, navigate to the project directory and run the following command:

```bash
cd docker/core/
docker-compose up -d
```

This will start the necessary services in detached mode.

### Expected Output

When you start the server, you should see output similar to this:

```bash
[INFO] Starting ceramic-one daemon...
[INFO] Ceramic Node started: /Users/jeldonmusic/Documents/matrixblend_com/Datbase/orbisdb/ceramic/node-12700
[INFO] Listening for incoming connections on port 3001...
```

You can access the application at `http://localhost:7008` in your web browser.

### Connecting to Ceramic

Once the server is running, you can connect to Ceramic using the following command:

```bash
cd docker/core/
docker-compose exec -it ceramic-one /bin/bash
```

This will start a shell session inside the Ceramic node container. You can then interact with Ceramic using the provided commands.

### Additional Information about Connecting the Ceramic

To connect the Ceramic network, follow these steps:

1. **Install `ceramic-cli`**:
   Install the `ceramic-cli` tool by following the [installation instructions](https://github.com/ceramicnetwork/cli).

2. **Get a Ceramic ID**:
   Use the `ceramic-cli` to generate a new Ceramic ID. For example:

   ```bash
   ceramic id
   ```

3. **Initialize OrbisDB**:
   Initialize OrbisDB by providing the Ceramic ID and any other necessary configuration.

   ```bash
   pnpm run init --ceramic-id <ceramic-id>
   ```

4. **Start the Application**:
   Once OrbisDB is initialized, start your application as described in the previous steps.

By following these steps, you should be able to start the server and connect to Ceramic successfully.

### Running the Project with Docker

This project is a web application that provides users with a platform to create and manage digital identities. It utilizes the Ceramic protocol to enable decentralized identity management, allowing users to have full control over their data.

## Prerequisites

Ensure you have the following installed:

- Docker version 20.10 or later
- Docker Compose version 1.29 or later
- Node.js version 18.0.0 or later

## Environment Variables

Set the following environment variables in a `.env` file or export them in your shell:

- `POSTGRES_USER`: Database username (default: `user`)
- `POSTGRES_PASSWORD`: Database password (default: `password`)

## Build and Run Instructions

1. Clone the repository and navigate to the project directory.

   ```bash
   git clone https://github.com/your-repo/project.git
   cd project
   ```

2. Build and start the services using Docker Compose:

   ```bash
   cd docker/core/
   docker build -f ../../docker/core/Dockerfile ../..
   ```

3. Access the application at `http://localhost:7008`.

## Ceramatic (MacOS)

```bash
brew install ceramicnetwork/tap/ceramic-one
ceramic-one daemon --network in-memory

```

## Exposed Ports

- `app`: 7008
- `db`: Not exposed externally

## Notes

- Ensure the `Dockerfile` and `docker-compose.yml` are correctly configured for your environment.
- For additional configuration, refer to the [documentation](#documentation-community).

## Starting the Server

To start the server, navigate to the project directory and run the following command:

```bash
cd docker/core/
docker-compose up -d
```

This will start the necessary services in detached mode.

### Expected Output

When you start the server, you should see output similar to this:

```bash
[INFO] Starting ceramic-one daemon...
[INFO] Ceramic Node started: /Users/jeldonmusic/Documents/matrixblend_com/Datbase/orbisdb/ceramic/node-12700
[INFO] Listening for incoming connections on port 3001...
```

You can access the application at `http://localhost:7008` in your web browser.

### Connecting to Ceramic

Once the server is running, you can connect to Ceramic using the following command:

```bash
cd docker/core/
docker-compose exec -it ceramic-one /bin/bash
```

This will start a shell session inside the Ceramic node container. You can then interact with Ceramic using the provided commands.

### Additional Information about Connecting the Ceramic

To connect the Ceramic network, follow these steps:

1. **Install `ceramic-cli`**:
   Install the `ceramic-cli` tool by following the [installation instructions](https://github.com/ceramicnetwork/cli).

2. **Get a Ceramic ID**:
   Use the `ceramic-cli` to generate a new Ceramic ID. For example:

   ```bash
   ceramic id
   ```

3. **Initialize OrbisDB**:
   Initialize OrbisDB by providing the Ceramic ID and any other necessary configuration.

   ```bash
   pnpm run init --ceramic-id <ceramic-id>
   ```

4. **Start the Application**:
   Once OrbisDB is initialized, start your application as described in the previous steps.

By following these steps, you should be able to start the server and connect to Ceramic successfully.

### Running the Project with Docker

This project is a web application that provides users with a platform to create and manage digital identities. It utilizes the Ceramic protocol to enable decentralized identity management, allowing users to have full control over their data.

## Prerequisites

Ensure you have the following installed:

- Docker version 20.10 or later
- Docker Compose version 1.29 or later
- Node.js version 18.0.0 or later

## Environment Variables

Set the following environment variables in a `.env` file or export them in your shell:

- `POSTGRES_USER`: Database username (default: `user`)
- `POSTGRES_PASSWORD`: Database password (default: `password`)

## Build and Run Instructions

1. Clone the repository and navigate to the project directory.

   ```bash
   git clone https://github.com/your-repo/project.git
   cd project
   ```

2. Build and start the services using Docker Compose:

   ```bash
   cd docker/core/
   docker build -f ../../docker/core/Dockerfile ../..
   ```

3. Access the application at `http://localhost:7008`.

## Ceramatic (MacOS)

```bash
brew install ceramicnetwork/tap/ceramic-one
ceramic-one daemon --network in-memory

```

## Exposed Ports

- `app`: 7008
- `db`: Not exposed externally

## Notes

- Ensure the `Dockerfile` and `docker-compose.yml` are correctly configured for your environment.
- For additional configuration, refer to the [documentation](#documentation-community).

## Starting the Server

To start the server, navigate to the project directory and run the following command:

```bash
cd docker/core/
docker-compose up -d
```

This will start the necessary services in detached mode.

### Expected Output

When you start the server, you should see output similar to this:

```bash
[INFO] Starting ceramic-one daemon...
[INFO] Ceramic Node started: /Users/jeldonmusic/Documents/matrixblend_com/Datbase/orbisdb/ceramic/node-12700
[INFO] Listening for incoming connections on port 3001...
```

You can access the application at `http://localhost:7008` in your web browser.

### Connecting to Ceramic

Once the server is running, you can connect to Ceramic using the following command:

```bash
cd docker/core/
docker-compose exec -it ceramic-one /bin/bash
```

This will start a shell session inside the Ceramic node container. You can then interact with Ceramic using the provided commands.

### Additional Information about Connecting the Ceramic

To connect the Ceramic network, follow these steps:

1. **Install `ceramic-cli`**:
   Install the `ceramic-cli` tool by following the [installation instructions](https://github.com/ceramicnetwork/cli).

2. **Get a Ceramic ID**:
   Use the `ceramic-cli` to generate a new Ceramic ID. For example:

   ```bash
   ceramic id
   ```

3. **Initialize OrbisDB**:
   Initialize OrbisDB by providing the Ceramic ID and any other necessary configuration.

   ```bash
   pnpm run init --ceramic-id <ceramic-id>
   ```

4. **Start the Application**:
   Once OrbisDB is initialized, start your application as described in the previous steps.

By following these steps, you should be able to start the server and connect to Ceramic successfully.
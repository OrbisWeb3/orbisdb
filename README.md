# OrbisDB
Driven by developer feedback and a new role as core developers in the Ceramic ecosystem, [Orbis](https://useorbis.com) is expanding its focus beyond social to offer a simple and efficient gateway for storing and managing open data on Ceramic.

> [!WARNING]  
> OrbisDB is a work-in-progress and is being developed in parallel with the OrbisDB SDK. It should be used only for test purposes for now.

OrbisDB is providing a developer-friendly interface to explore data with the ease of SQL and a plugin store to save development time on crypto-specific features; from data migration and gating mechanisms to automated blockchain interactions.

Orbis is based on the upcoming Firehose API developed by Ceramic which means that **your Ceramic node must be running at least** on `v4.1.0`. 

    npm i -g @ceramicnetwork/cli@4.1.0

> [!WARNING]  
> The Ceramic Firehose API is still in beta so we recommend using it only on testing nodes for now.

## Component Overview
OrbisDB is divided in two main components - **core** and **plugins**.

This allows us to focus on stability and performance of core functions, while expanding functionality via the plugin system.

- **Core:**
    - dedicated to read/write operation of the indexing service
    - listens to stream changes of specific models being used by developers and indexes the content in a Postgres database.
- **Plugins:**
    - optional and designed to perform operations beyond the core’s scope.
    - Divided **into 4 categories** (additional types may be exposed):
        - **`Create new streams`** : Automatically create new streams based on external data sources (ie. blockchain event, a local CSV file or an API data source).
        - **`Add meta data`**: Modifies or enhances the stream content before indexing (ie. classify the content using AI, fetch the ENS name of the stream’s controller)
        - **`Generate action post stream`**: Performs actions after the content has been indexed (ie. email notifications, trigger a blockchain transaction).
        - **`Gate a stream`:** Checks the stream details and decides whether it should be indexed or not (for moderation or token gating, ie. Gitcoin Passport)
    - we will initially launch with built-in plugins “made by Orbis”, but our goal is to enable 3rd party developers to build their own plugins.

## Usage
To get started with OrbisDB we recommend to download this repository locally and run it a simple NodeJS program.

    npm install


    npm run dev

## Architecture Overview

OrbisDB is built on top of Ceramic protocol and PostgreSQL (both of which are a requirement in order to run OrbisDB).

### Ceramic

Ceramic is used for stream discovery, modeling, network communications and writes.
We moved away from Tile Documents (used by Orbis Social) and are using Model Instance Documents used by ComposeDB, offering interoperability.

For model definition, we use standard Ceramic models, employing a JSON schema (unlike ComposeDB’s GraphQL approach). 

### PostgreSQL

We chose PostgreSQL as our indexing database due to its extensability, maturity and open-source values.
Postgres is used to index and query data from Ceramic, offering scalable performance and the benefits of traditional scaling methods.

### OrbisDB

OrbisDB is the MIT-licensed brains of the operation.
An OrbisDB node is responsible for Ceramic <> Postgres interactions, as well as exposing a REST API and a NextJS-powered UI to manage the node and data stored on it.

### OrbisDB SDK (@useorbis/db-sdk)

[OrbisDB SDK](https://github.com/OrbisWeb3/db-sdk) exposes a familiar user authentication interface, combined with an ORM-like approach to managing data.
It features a custom-built query builder and an abstraction for Ceramic interactions.

## Data lifecycle
All data is always stored on Ceramic and only then does it get indexed and stored in OrbisDB.

This ensures data ownership, integrity and composability with minimal performance sacrifices.
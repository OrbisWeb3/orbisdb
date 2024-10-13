# OrbisDB
<img src="https://github.com/user-attachments/assets/cd407120-c733-4b0b-b9e7-aa622677bb05" height="80%" width="80%" >

OrbisDB is a fully open-source relational database designed for onchain builders. Stored data inherits verifiable, permissionless and mutable properties of [Ceramic](https://www.ceramic.network), while providing a highly scalable way of querying data via SQL, GraphQL and a built-in Dashboard.

- [x]  Hosted Postgres Database. [Docs](https://www.notion.so/Managed-Studio-be33efc2124e4f3583ab10a1639c45b1?pvs=21)
- [x]  Authentication. [Docs](https://www.notion.so/Accounts-DIDs-b936223c995f432682bc4c648e52a892?pvs=21)
- [x]  Crypto Plugins. [Docs](https://www.notion.so/Building-a-plugin-9255e4f7ca044f91831548a9179d6bcd?pvs=21)
- [x]  Database functions
    - [x]  Insert. [Docs](https://www.notion.so/Writing-data-INSERT-8d1fae8016d94393ad439feeb3c9f7ff?pvs=21)
    - [x]  Select. [Docs](https://www.notion.so/869d600cf7d04ae58d0b1c4821b1d35e?pvs=21)
- [x]  Dashboard. [Docs](https://www.notion.so/Data-f0f4cdef9f5e4fffb8c298e4b5176b72?pvs=21)
- [X]  OrbisDB SDK [Github](https://github.com/OrbisWeb3/db-sdk)

> [!IMPORTANT]  
> 🚨 Hosted service provided by Orbis, register for closed beta access to [OrbisDB Studio](https://app.formo.so/hJ5VGyugmGigyVFyqdHJa)

> [!NOTE]  
> ⚡️  Quickly start with a [Forum Template](https://github.com/mzkrasner/deforum-lite)

<img src="https://github.com/user-attachments/assets/63c50d1b-1c14-4555-b701-63eb9404823f" height="80%" width="80%" >

## Documentation & Community
- Full [Documentation](https://www.notion.so/OrbisDB-Docs-e77a592361b74e66a45404ca1cbc517b?pvs=21)
- [YouTube](https://www.youtube.com/@orbisdb) channel with step-by-step videos
- [Discord](https://discord.gg/jmnzGYfhHt) to ask all your technical questions 
- [Twitter](https://x.com/useOrbis) to get latest updates on OrbisDB
  

## How it works
OrbisDB is a relational database built on top of [Ceramic Network](https://www.ceramic.network), a verifiable and decentralized event store. Data inherits transparency, user ownership and permissionless capabilities while ensuring high throughput and low costs. OrbisDB leverages PostgreSQL for querying, offering a robust and scalable indexing solution. Finally, the OrbisDB software orchestrates data storage, management, and access, providing a robust and scalable database solution.

## Plugins
OrbisDB Plugins allow users to customize and enrich the behavior of their instance.
- `generate` to **Create streams**: Automatically create new streams based on external data sources (ie. blockchain event, a local CSV file or an API data source).
- `add_metadata` to **Add metadata**: Modifies or enhances the stream content before indexing (ie. classify the content using AI, fetch the ENS name of the stream’s controller)
- `validate` to **Validate / Gate:** Checks the stream details and decides whether it should be indexed or not (for moderation, token gating or sybil resistance)
- `post_process` to **Perform an action**: Performs actions **after** a stream has been indexed (ie. send an email or a push notification, trigger a blockchain transaction...).

You can find multiple examples of plugins in the `server/plugins` directory.

<img src="https://github.com/user-attachments/assets/d939cb03-15ce-4687-a87c-08166ffbb82a" height="80%" width="80%" >

## Setting up
As is the case with other web services, OrbisDB can be hosted locally, in the cloud or via a managed hosting provider. This is true for each separate component, as they don’t have to be hosted on a single server.

### 🌟 Recommended - Managed + Studio

> [!IMPORTANT]  
> 🚨 Register here to get early access of [OrbisDB Studio](https://app.formo.so/hJ5VGyugmGigyVFyqdHJa), a hosted service provided by Orbis.

Orbis offers a free [shared OrbisDB instance](https://www.notion.so/Overview-fbc65a9a0356485a993b0cab190779f3?pvs=21) managed by Orbis. This means you don’t have to worry about any of the backend requirements - just set up your environment via our UI and get started with decentralized data.

With a shared instance, each developer gets their own isolated database and environment - however, the underlying hardware is shared. Once your application starts scaling you should consider a dedicated instance. 

You also have other partners who can enable managed services for you like hirenodes.io

### Local

If you want to run OrbisDB Locally, you are able to easily do it by following this guide [here](https://www.notion.so/Local-d3e9dd97e97b4c00a530b6ada20a8536?pvs=21) and our latest YouTube video [here](https://www.youtube.com/watch?v=8embizFvI-U). 

This means all OrbisDB nodes will be hosted locally, including PostgreSQL, Ceramic and OrbisDB Node itself.

### Self-hosted

Self-hosting OrbisDB allows for full control over each component. 

Each component can be isolated on a separate server or hosted on a single instance.

Check out our self-hosting guide [here](https://www.notion.so/Self-hosted-603eb88f811f4bd596c2af38d187ac81?pvs=21).

### Hybrid

Because each OrbisDB component can be hosted separately, this allows for a hybrid hosting environment. You can choose to run the OrbisDB node yourself, but delegate database and Ceramic hosting to a managed provider. 

Configure your setup to your needs to strike your own balance of control and convenience.

For more details, you can visit the [full documentation](https://www.notion.so/Architecture-4b4ca402cb1a44e58b9a2884bdc02f04?pvs=21).

## Running this repository
To get started with OrbisDB locally, we recommend downloading this repository locally and running it as a simple NodeJS program.

Full guide [here](https://www.notion.so/Local-d3e9dd97e97b4c00a530b6ada20a8536?pvs=21). 

```
npm install

npm run dev

```

Your OrbisDB instance will then be running on port `7008`, allowing you to access it through your browser by navigating to `http://localhost:7008/`. If this is your first time using it, you will be prompted to enter the details of your Ceramic node as well as your database credentials, which are necessary for indexing.

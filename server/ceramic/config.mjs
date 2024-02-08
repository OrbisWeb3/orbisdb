import { cliColors } from "../utils/cliColors.mjs"
import { OrbisDB } from "@useorbis/db-sdk";
import { OrbisKeyDidAuth } from "@useorbis/db-sdk/auth";

export default class Ceramic {
    constructor(node, instance, seed) {
        try {
            let nodeUrl = cleanNodeUrl(node);
            this.node = nodeUrl;

            // Initialize OrbisDB
            this.orbisdb = new OrbisDB({
                ceramic: {
                    gateway: nodeUrl,
                },
                nodes: [
                {
                    gateway: instance,
                    key: "<YOUR_API_KEY>",
                },
                ],
            });

            this.client = this.orbisdb.ceramic.client;
            console.log(cliColors.text.cyan, "📍 Initialized Ceramic client via dbsdk with node:", cliColors.reset, this.node);

            // Connect to Ceramic using seed
            this.connect(seed);
        } catch(e) {
            console.log(cliColors.text.red, "Error connecting to Ceramic client:", cliColors.reset, e) ; 
        }
    }

    /** Will connect to the Ceramic seed defined globally */
    async connect(seed) {
        let _seed = new Uint8Array(seed);
        const auth = await OrbisKeyDidAuth.fromSeed(_seed);

        try {
            const result = await this.orbisdb.connectUser({ auth });
            this.session = result.session;
            console.log(cliColors.text.cyan, "📍 Connected to Ceramic via dbsdk with did:", cliColors.reset, result.user.did);
        } catch(e) {
            console.log(cliColors.text.red, "Error connecting to OrbisDB:", cliColors.reset, e);
        }
    }
}

// TODO: Make sure Ceramic node's URL is valid
function cleanNodeUrl(url) {
    return url;
}
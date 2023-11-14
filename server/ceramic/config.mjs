import { CeramicClient } from '@ceramicnetwork/http-client'

/** Connect to Ceramic */
export const ceramic_testnet = new CeramicClient("https://ceramic-cerscan-testnet.hirenodes.io/");
export const ceramic_mainnet = new CeramicClient("https://node2.orbis.club/");

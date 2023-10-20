import { ceramic_mainnet, ceramic_testnet } from '../ceramic/config.js';

/** Helpful to delay a function for a few seconds */
export const sleep = (milliseconds) => {
  return new Promise(resolve => setTimeout(resolve, milliseconds))
}

/** Return the ceramic object based on the network name */
export function getCeramicFromNetwork(network) {
  switch (network) {
    case "testnet-clay":
      return ceramic_testnet;
    case "mainnet":
      return ceramic_mainnet;
  }
}

/** Return the pubsub topic name based on the network name */
export function getTopicFromNetwork(network) {
  switch (network) {
    case "testnet-clay":
      return '/ceramic/testnet-clay';
    case "mainnet":
      return '/ceramic/mainnet';
  }
}

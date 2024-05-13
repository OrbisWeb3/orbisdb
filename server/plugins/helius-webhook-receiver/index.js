import * as bs58 from "bs58";
import { BorshCoder } from "@project-serum/anchor";
import { extractTokenTransfers, solPrograms } from "./utils.js";
import { driftRawTx } from "./interfaces/drift.js";
import { jupiterRawTx } from "./interfaces/jupiter.js";
import { orcaRawTx } from "./interfaces/orca.js";
import logger from "../../logger/index.js";
export default class HeliusWebhookReceiver {
  /**
   * This will initialize all of the hooks used by this plugin.
   * A plugin can register multiple hooks, each hook being linked to a function that will be executed when the hook is triggered
   */
  async init() {
    return {
      HOOKS: {
        generate: () => this.interpretWebhookTransaction(jupiterRawTx, true), // For test purposes
      },
      ROUTES: {
        POST: {
          receive: (req, res) => this.receiveWebhook(req, res),
        },
      },
    };
  }

  /** Will interpret the data received from the webhook to convert it to readable data */
  async interpretWebhookTransaction(transactions, debug = false) {
    let streams = [];
    let transaction = transactions[0];

    if (debug) {
      logger.debug("Enter interpretWebhookTransaction with:", transactions);
    }

    // Retrieve transaction signer
    let signer = transaction.transaction?.message.accountKeys
      ? transaction.transaction.message.accountKeys[0]
      : "";
    if (debug) {
      logger.debug("signer:", signer);
    }

    // Retrieve token transfers for this transactions
    let token_transfers = extractTokenTransfers(transaction);
    logger.debug("token_transfers:", token_transfers);

    // Loop each instruction to retrieve and interpret the corresponding data
    for (const [
      index,
      instruction,
    ] of transaction.transaction.message.instructions.entries()) {
      let stream;

      if (instruction.data) {
        // Retrieve program used (for test purposes we will use drift idl)
        let programUsed =
          transaction.transaction.message.accountKeys[
            instruction.programIdIndex
          ];
        let program = solPrograms[programUsed];

        if (debug) {
          logger.debug("programUsed:", programUsed);
          logger.debug("program:", program);
        }

        // Only interpret transaction if it's linked to one of the supported protocol
        if (program && program.interface?.idl) {
          // Use the right IDL for the identified program
          const coder = new BorshCoder(program.interface.idl);

          // Decode instruction data
          let data = bs58.default.decode(instruction.data);
          const dataBuffer = Buffer.from(
            data.buffer,
            data.byteOffset,
            data.byteLength
          );

          // Decode instruction using the idl
          if (dataBuffer) {
            try {
              const ix = coder.instruction.decode(dataBuffer, "base58");
              if (debug) {
                logger.debug("ix:", ix);
              }
              if (ix && ix.data) {
                let cleanedIx;
                logger.debug("ix.data:", ix.data);

                // If program has a custom cleaning function we use it otherwise we default to the original ix
                if (program.interface.clean) {
                  cleanedIx = program.interface.clean(ix.data);
                } else {
                  cleanedIx = ix;
                }

                // Build stream object
                stream = {
                  program: program.name,
                  program_slug: program.slug,
                  program_id: programUsed,
                  method: ix.name,
                  stringified_data: JSON.stringify(cleanedIx),
                  signer: signer,
                  signature: transaction.transaction.signatures[0],
                };
                logger.debug("Trying to insert:", stream);

                // Push stream to Ceramic
                //let streamPushed = await global.indexingService.ceramic.orbisdb.insert("kjzl6hvfrbw6c8r024bfgihyx15jf4yj56ebb1n7tl7yflycyeoaw0ug9ay4vpl").value(stream).context(this.context).run();
                streams.push(stream);
              }
            } catch (e) {
              logger.error(
                "ix Error decoding data:" + instruction.data + ":",
                e
              );
            }
          }
        } else {
          //console.log("This program is not yet supported by our plugin:", programUsed);
        }
      } else {
        logger.debug("There wasn't any instruction data to decode.");
      }
    }

    return streams;
  }

  /** Will retrieve the credentials for a Solana address and mint all of those */
  async receiveWebhook(req, res) {
    if (!req.body) {
      return res.badRequest("No request body found.");
    }

    // Try to interpret the transaction
    await this.interpretWebhookTransaction(req.body);
    return {
      result: "Received webhook",
    };
  }
}

import logger from "../logger/index.js";
import { getOrbisDBSettings } from "../utils/helpers.js";
import { DIDSession } from "did-session";

export const didAuthMiddleware = async (req, res) => {
  const authHeader = req.headers["authorization"];

  if (!authHeader) {
    return res.unauthorized(
      "You must be connected in order to access this endpoint."
    );
  }

  const token = authHeader.split(" ")[1]; // Split 'Bearer <token>'
  if (!token || token === "null") {
    return res.unauthorized(
      "You must be connected in order to access this endpoint."
    );
  }

  try {
    const resAdminSession = await DIDSession.fromSession(token, null);
    const didId = resAdminSession.did.parent;
    req.did = didId;
    return;
  } catch (e) {
    return res.unauthorized(
      `Invalid token format or an internal error. ${e.message}`
    );
  }
};

export const adminDidAuthMiddleware = async (req, res) => {
  const globalSettings = getOrbisDBSettings();
  const authHeader = req.headers["authorization"];

  if (!authHeader) {
    return res.unauthorized(
      "You must be connected in order to access this endpoint."
    );
  }

  const token = authHeader.split(" ")[1]; // Split 'Bearer <token>'
  if (!token || token === "null") {
    return res.unauthorized(
      "You must be connected in order to access this endpoint."
    );
  }

  try {
    let _isAdmin;
    let _isAdminsEmpty;
    let resAdminSession = await DIDSession.fromSession(token, null);
    let didId = resAdminSession.did.parent;

    /** Perform different verification logic for shared instances and non-shared ones */
    if (globalSettings.is_shared) {
      // The auth middleware should not be applied for shared instances because users can only modify the slot of the authentication they are using
      _isAdminsEmpty = false;
      _isAdmin = true;
    } else {
      _isAdmin = globalSettings?.configuration?.admins?.includes(didId);
      _isAdminsEmpty =
        !globalSettings?.configuration?.admins ||
        globalSettings.configuration.admins.length === 0;
    }

    if (didId && (_isAdmin || _isAdminsEmpty)) {
      req.adminDid = didId;
      // Initial node setup is done by the "owner" (assumption)
      req.isNodeOwner = (globalSettings.configuration?.admins || []).includes(
        didId
      );
      return;
    } else {
      logger.error("This account isn't an admin: " + didId);
      return res.unauthorized("This account isn't an admin.");
    }
  } catch (e) {
    logger.error("Error checking session JWT:", e);
    return res.unauthorized(`Error checking session JWT with ${token}`);
  }
};

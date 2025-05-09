import React, { useState, useEffect, useContext } from "react";
import { useRouter } from "next/router";

/** Import OrbisDB libraries */
import { OrbisDB } from "@useorbis/db-sdk";
import { OrbisKeyDidAuth } from "@useorbis/db-sdk/auth";
import { DIDSession } from "did-session";
import { parseDidSeed } from "../utils/index.js";

export const GlobalContext = React.createContext();

export const GlobalProvider = ({ children }) => {
  const router = useRouter();
  const [isConfigured, setIsConfigured] = useState(null);
  const [isShared, setIsShared] = useState(null);
  const [settings, setSettings] = useState();
  const [settingsLoading, setSettingsLoading] = useState();
  const [adminLoading, setAdminLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isGlobalAdmin, setIsGlobalAdmin] = useState(false);
  const [globalSettings, setGlobalSettings] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [sessionJwt, setSessionJwt] = useState();
  const [user, setUser] = useState();
  const [adminSession, setAdminSession] = useState();
  const [orbisdb, setOrbisdb] = useState();
  const [baseUrl, setBaseUrl] = useState();

  useEffect(() => {
    setSettingsLoading(true);
    getIsConfigured();
    loadSettings();
    getBaseUrl();

    function getBaseUrl() {
      // Get the protocol (http or https)
      const protocol = window.location.protocol;

      // Get the hostname (domain or IP)
      const hostname = window.location.hostname;

      // Get the port if specified
      const port = window.location.port;

      // Construct the base URL
      const _baseUrl = `${protocol}//${hostname}${port ? `:${port}` : ""}`;
      setBaseUrl(_baseUrl);
    }
  }, []);

  /** If user isn't connected after check we redirect to the auth page */
  useEffect(() => {
    if (!adminLoading && !isAdmin && router.asPath != "/auth") {
      console.log("Redirecting to auth page");
      router.push("/auth");
    }
  }, [adminLoading, isAdmin, router]);

  /** Load settings and check for admin account right after */
  useEffect(() => {
    init();
  }, [adminSession]);

  /** Will connect to Ceramic using the seed in the config */
  useEffect(() => {
    if (settings?.configuration?.ceramic?.seed) {
      connectSeed();
    }

    /** Will connect the front-end to the seed saved in configuration */
    async function connectSeed() {
      try {
        const seed = settings.configuration.ceramic.seed;
        let _orbisdb = new OrbisDB({
          ceramic: {
            gateway: settings.configuration.ceramic.node,
          },
          nodes: [
            {
              gateway: "http://localhost:3000",
            },
          ],
        });

        const auth = await OrbisKeyDidAuth.fromSeed(parseDidSeed(seed));

        try {
          const result = await _orbisdb.connectUser({ auth });
          setOrbisdb(_orbisdb);
          setUser(result.user);
          console.log("Connected to OrbisDB SDK with did:", result.user.did);
        } catch (e) {
          console.log(
            cliColors.text.red,
            "Error connecting to OrbisDB:",
            cliColors.reset,
            e
          );
        }
      } catch (e) {
        console.log("Error initiaiting OrbisDB object:", e);
      }
    }
  }, [settings]);

  /** Load settings from file */
  async function init() {
    try {
      let {
        admins,
        globalAdmins,
        globalSettings: _globalSettings,
      } = await getAdmin(adminSession);
      setGlobalSettings(_globalSettings);
      if (admins) {
        checkAdmin(admins, globalAdmins);
      } else {
        setAdminLoading(false);
      }
    } catch (e) {
      setAdminLoading(false);
      console.log(
        "Error retrieving local settings, loading default one instead."
      );
    }
  }

  /** Check if there is an existing user connected */
  async function checkAdmin(admins, globalAdmins) {
    // Retrieve admin session from local storage
    let adminSessionJwt = localStorage.getItem("orbisdb-admin-session");
    // Convert session string to the parent DID using Ceramic library
    if (adminSessionJwt) {
      setIsConnected(true);
      try {
        let resAdminSession = await DIDSession.fromSession(
          adminSessionJwt,
          null
        );
        let didId = resAdminSession.did.parent;
        setAdminSession(didId);

        // If user connected is included in the admins array in configuration we give admin access and save the session token to be used in API calls
        let _isAdmin = admins?.includes(didId);
        let _isGlobalAdmin = globalAdmins?.includes(didId);
        if (didId && _isAdmin) {
          console.log("User is admin.");
          setIsAdmin(true);
          setSessionJwt(adminSessionJwt);
          loadSettings(adminSessionJwt);
        } else {
          console.log("User is NOT an admin: ", didId);
        }

        if (didId && _isGlobalAdmin) {
          console.log("User is a global admin.");
          setIsGlobalAdmin(true);
        }
      } catch (e) {
        console.log("Error checking admin account:", e);
      }
    } else {
      setIsConnected(false);
    }
    setAdminLoading(false);
  }

  async function getAdmin(adminSession) {
    console.log("getAdmin:", adminSession);
    let result = await fetch(`/api/settings/admins/${adminSession}`);
    let resultJson = await result.json();
    console.log("In getAdmin:", resultJson);
    return {
      admins: resultJson?.admins,
      globalAdmins: resultJson?.globalAdmins,
      globalSettings: resultJson?.globalSettings,
    };
  }

  async function loadSettings(_jwt) {
    let adminSession = _jwt
      ? _jwt
      : localStorage.getItem("orbisdb-admin-session");
    let result = await fetch("/api/settings", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${adminSession}`,
      },
    });

    let resultJson = await result.json();
    console.log("In load settings:", resultJson);
    if (result.status == 200) {
      setSettings(resultJson?.settings);
    } else {
      setSettings({});
    }
    setSettingsLoading(false);

    return resultJson;
  }

  /** Will check if node has been configured or not */
  async function getIsConfigured() {
    let result = await fetch("/api/setup/status");
    let resultJson = await result.json();
    console.log("In isConfigured:", resultJson);
    if (resultJson) {
      setIsConfigured(resultJson.is_configured ? true : false);
      setIsShared(resultJson.is_shared ? true : false);
    } else {
      setIsConfigured(false);
      setIsShared(false);
    }
  }

  return (
    <GlobalContext.Provider
      value={{
        settings,
        setSettings,
        settingsLoading,
        loadSettings,
        globalSettings,
        isGlobalAdmin,
        isAdmin,
        setIsAdmin,
        user,
        setUser,
        orbisdb,
        setOrbisdb,
        sessionJwt,
        setSessionJwt,
        adminLoading,
        setAdminLoading,
        isConnected,
        setIsConnected,
        init,
        getAdmin,
        isConfigured,
        setIsConfigured,
        isShared,
        adminSession,
        baseUrl,
      }}
    >
      {children}
    </GlobalContext.Provider>
  );
};

export const useGlobal = () => useContext(GlobalContext);

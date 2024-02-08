import React, { useState, useEffect, useContext } from "react";
import { useRouter } from 'next/router';

/** Import OrbisDB libraries */
import { OrbisDB } from "@useorbis/db-sdk";
import { OrbisKeyDidAuth } from "@useorbis/db-sdk/auth";
import { DIDSession } from 'did-session'

export const GlobalContext = React.createContext();

export const GlobalProvider = ({ children }) => {
    const router = useRouter();
    const [settings, setSettings] = useState();
    const [adminLoading, setAdminLoading] = useState(true);
    const [isAdmin, setIsAdmin] = useState(false);
    const [sessionJwt, setSessionJwt] = useState();
    const [user, setUser] = useState();
    const [orbisdb, setOrbisdb] = useState();

    /** If user isn't connected after check we redirect to the auth page */
    useEffect(() => {
        if(!adminLoading && !isAdmin && router.pathname != '/auth') {
            console.log("Redirecting to /auth");
            router.push('/auth');
        }
    }, [adminLoading, isAdmin, router])

    /** Load settings and check for admin account right after */
    useEffect(() => {
        init();   

        /** Load settings from file */
        async function init() {
            try {
                console.log("Before await:", settings);
                let _settings = await loadSettings();
                console.log("After await:", _settings);
                checkAdmin(_settings); 
            } catch(e) {
                setSettings({});
                setAdminLoading(false);
                console.log("Error retrieving local settings, loading default one instead.");
            }
        }

        /** Check if there is an existing user connected */
        async function checkAdmin(_settings) {
            // Retrieve admin session from local storage
            let adminSession = localStorage.getItem("orbisdb-admin-session");

            // Convert session string to the parent DID using Ceramic library
            if(adminSession) {
                try {
                    let resAdminSession = await DIDSession.fromSession(adminSession, null);
                    let didId = resAdminSession.did.parent;

                    // If user connected is included in the admins array in configuration we give admin access and save the session token to be used in API calls
                    let _isAdmin = _settings?.configuration?.admins?.includes(didId.toLowerCase());
                    if(didId && _isAdmin) {
                        setIsAdmin(true);
                        setSessionJwt(adminSession);
                    } else {
                        console.log("User is NOT an admin: ", didId);
                    }
                } catch(e) {
                    console.log("Error checking admin account:", e);
                }
            }
            setAdminLoading(false);
        }
    }, [])
    
    useEffect(() => {
        if(settings?.configuration?.ceramic?.seed) {
            connectSeed();
        }

        /** Will connect the front-end to the seed saved in configuration */
        async function connectSeed() {
        try {
            let seed = settings.configuration.ceramic.seed
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
    
            let _seed = new Uint8Array(JSON.parse(seed));
            const auth = await OrbisKeyDidAuth.fromSeed(_seed);
    
            try {
                const result = await _orbisdb.connectUser({ auth });
                setOrbisdb(_orbisdb);
                setUser(result.user);
                console.log("Connected to OrbisDB SDK with did:", result.user.did);
            } catch(e) {
                console.log(cliColors.text.red, "Error connecting to OrbisDB:", cliColors.reset, e);
            }
        } catch(e) {
            console.log("Error initiaiting OrbisDB object:", e);
        }
        
        }
    }, [settings]);

    async function loadSettings() {
        let result = await fetch("/api/settings/get");
        let resultJson = await result.json();
        setSettings(resultJson);
        return resultJson;
    }
  
    return <GlobalContext.Provider value={{ settings, setSettings, loadSettings, isAdmin, setIsAdmin, user, setUser, orbisdb, setOrbisdb, sessionJwt, setSessionJwt, adminLoading, setAdminLoading }}>{children}</GlobalContext.Provider>;
  };
  
  export const useGlobal = () => useContext(GlobalContext);
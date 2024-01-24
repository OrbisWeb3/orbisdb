import React, { useState, useEffect, useContext } from "react";
import Header from "../components/Header";
import ConfigurationSettings from "../components/Settings";

/** Import OrbisDB libraries */
import { OrbisDB } from "@orbisclub/dbsdk";
import { OrbisKeyDidAuth } from "@orbisclub/dbsdk/auth";

/** Import Context */
import { GlobalContext } from "../contexts/Global";
import '../styles/globals.css'


let defaultSettings = {
  models: [{
    name: "SocialPost"
  }]
}

export default function App({ Component, pageProps }) {
  const [settings, setSettings] = useState();
  const [user, setUser] = useState();
  const [orbisdb, setOrbisdb] = useState();

  useEffect(() => {
    loadSettings();    

    /** Load settings from file */
    async function loadSettings() {
      try {
        let result = await fetch("/api/settings/get");
        result = await result.json();
        console.log("settings:", result);
        setSettings(result);
      } catch(e) {
        console.log("Error retrieving local settings, loading default one instead.");
        setSettings(defaultSettings);
      }
    }
  }, [])
  
  useEffect(() => {
    if(settings?.configuration?.ceramic?.seed) {
      connect();
    }

    async function connect() {
      let seed = settings.configuration.ceramic.seed
      console.log("seed:", seed);
      let _orbisdb = new OrbisDB({
        ceramic: {
            gateway: settings.configuration.ceramic.node,
        },
        nodes: [
          {
              gateway: "http://localhost:7008",
              key: "<YOUR_API_KEY>",
          },
        ],
      });

      let _seed = new Uint8Array(JSON.parse(seed));
      console.log("_seed:", _seed);
      const auth = await OrbisKeyDidAuth.fromSeed(_seed);

      try {
          const result = await _orbisdb.connectUser({ auth });
          setOrbisdb(_orbisdb);
          setUser(result.user);
          console.log("Connected to OrbisDB SDK with did:", result.user.did);
      } catch(e) {
          console.log(cliColors.text.red, "Error connecting to OrbisDB:", cliColors.reset, e);
      }
    }
  }, [settings])

  return(
    <GlobalContext.Provider value={{ settings, setSettings, orbisdb, user, setUser }}>
      <div className="h-full w-full flex flex-col">
        {settings ?
          <>
            {user ?
              <>
                {settings.configuration ?
                  <>
                    <Header showItems={true} />
                    <Component {...pageProps} />
                  </>
                :
                  <>
                    <Header showItems={false} />
                    <ConfigurationSetup />
                  </>
                }
              </>
            :
              <div className="flex justify-center w-full mt-12">
                <div className="flex flex-col w-2/3 items-center">
                  <p className="text-slate-900 text-base mb-2">You need to be connected to access your Orbis DB instance.</p>
                </div>
              </div>
            }

          </>
        :
          <p className="text-base w-full text-center pt-12">Loading settings...</p>
        }

      </div>
    </GlobalContext.Provider>
  )
}

function ConfigurationSetup() {
  return(
    <div className="flex justify-center">
      <div className="w-1/3 flex flex-col mt-12 bg-white border border-slate-200 p-6 rounded-md">
        <p className="font-medium text-center">Welcome to OrbisDB</p>
        <p className="text-base text-slate-600 mb-4 text-center">To get started, let's configure your OrbisDB instance.</p>
      
        <ConfigurationSettings />
      </div>
    </div>
  )
}
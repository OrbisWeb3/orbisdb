import React, { useState, useEffect } from "react";
/** Import Orbis SDK */
import { Orbis } from "@orbisclub/orbis-sdk";

import Header from "../components/Header";
import Button from "../components/Button";

/** Import Context */
import { GlobalContext } from "../contexts/Global";
import '../styles/globals.css'

/** Initialize the Orbis class object */
const orbis = new Orbis({useLit: false});


let defaultSettings = {
  models: [{
    name: "SocialPost"
  }]
}

export default function App({ Component, pageProps }) {
  const [settings, setSettings] = useState();
  const [user, setUser] = useState();

  useEffect(() => {
    loadSettings();
    checkUserIsConnected();

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

    /** Check if the user has an existing Ceramic session. */
    async function checkUserIsConnected() {
      let res = await orbis.isConnected();
      console.log("res:", res);

      /** If SDK returns user details we save it in state */
      if(res && res.status == 200) {
        setUser(res.details);
      }
    }
  }, [])

  async function connect() {
    let res = await orbis.connect_v2({chain: "ethereum", lit: false});
    console.log("res:", res);

    /** If SDK returns user details we save it in state */
    if(res && res.status == 200) {
      setUser(res.details);
    }
  }

  return(
    <GlobalContext.Provider value={{ settings, setSettings, orbis, user, setUser }}>
      <div className="h-full w-full">
        <Header />
        {settings ?
          <>
            {user ?
              <Component {...pageProps} />
            :
              <div className="flex justify-center w-full mt-12">
                <div className="flex flex-col w-2/3 items-center">
                  <p className="text-slate-900 text-base mb-2">You need to be connected to access your Orbis DB instance.</p>
                  <Button title="Connect" onClick={() => connect()} />
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

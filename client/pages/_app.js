import React, { useState, useEffect } from "react";
/** Import Orbis SDK */
import { Orbis } from "@orbisclub/orbis-sdk";

import Header from "../components/Header";

/** Import Context */
import { GlobalContext } from "../contexts/Global";
import '../styles/globals.css'

/** Initialize the Orbis class object */
const orbis = new Orbis();


let defaultSettings = {
  models: [{
    name: "SocialPost"
  }]
}

export default function App({ Component, pageProps }) {
  const [settings, setSettings] = useState();

  useEffect(() => {
    loadSettings();
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

  return(
    <GlobalContext.Provider value={{ settings, setSettings, orbis }}>
      <div className="h-full w-full">
        <Header />
        {settings ?
          <Component {...pageProps} />
        :
          <p className="text-base w-full text-center pt-12">Loading settings...</p>
        }

      </div>
    </GlobalContext.Provider>
  )
}

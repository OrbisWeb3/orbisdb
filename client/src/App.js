import React, { useState, useEffect, useContext } from "react";
import Header from "./components/Header";
import Body from "./components/Body";

/** Import Context */
import { GlobalContext } from "./contexts/Global";

let defaultSettings = {
  models: [{
    name: "SocialPost"
  }]
}

function App() {
  const [settings, setSettings] = useState();

  useEffect(() => {
    loadSettings();
    async function loadSettings() {
      try {
        let result = await fetch("/api/settings");
        result = await result.json();
        console.log("settings:", result);
        setSettings(result);
      } catch(e) {
        console.log("Error retrieving local settings, loading default one instead.");
        setSettings(defaultSettings);
      }
    }
  }, [])

  return (
    <GlobalContext.Provider value={{ settings }}>
      <div className="bg-slate-50 h-full w-full">
        <Header />
        <Body />
      </div>
    </GlobalContext.Provider>
  );
}

export default App;

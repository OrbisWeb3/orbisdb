import React, { useEffect } from "react";
import Header from "../components/Header";
import Alert from "../components/Alert";
import ConfigurationSettings from "../components/ConfigurationSettings";

/** Import Context */
import { GlobalProvider, useGlobal } from "../contexts/Global";
import '../styles/globals.css'
import Auth from "./auth";

export default function App({ Component, pageProps }) {
  return(
    <GlobalProvider>
      <AppContent Component={Component} pageProps={pageProps} />
    </GlobalProvider>
  )
}

function AppContent({Component, pageProps}) {
  const { settings, settingsLoading, adminLoading, isAdmin, isConnected } = useGlobal();

  useEffect(() => {
    console.log("settings:", settings);
  }, [settings])

  useEffect(() => {
    console.log("adminLoading:", adminLoading);
  }, [adminLoading])

  /** If admin details are loading */
  if(adminLoading || settingsLoading) {
    return(
      <div className="h-full w-full flex flex-col">
        <p className="text-base w-full text-center pt-12">Loading settings...</p>
      </div>
    )
  }

  else if(!isConnected) {
    return(
      <div className="h-full w-full flex flex-col">
        <Auth />
      </div>
    )
  }

  else if(!isConnected && !isAdmin) {
    return(
      <div className="h-full w-full flex flex-col">
        <Alert title={"You are connected but not the admin, please login with a different account."} />
        <Auth />
      </div>
    )
  }

  /** User is connected but not admin */
  else if(!adminLoading && !isAdmin && settings.configuration) {
    console.log("settings in <Auth />:", settings);
    console.log("adminLoading in <Auth />:", adminLoading);
    console.log("isAdmin in <Auth />:", isAdmin);
    return(
      <div className="h-full w-full flex flex-col">
        <Auth />
      </div>
    )
  }

  /** User has finalized configuration, render app */
  else if(settings?.configuration?.admins) {
    console.log("settings?.configuration?.admins:", settings?.configuration?.admins);
    return(
      <div className="h-full w-full flex flex-col">
        <Header showItems={true} />
        <Component {...pageProps} />
      </div>
    )
  } else {
    return(
      <div className="h-full w-full flex flex-col">
        <Header showItems={false} />
        <ConfigurationSetup />
      </div>
    )
  }
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
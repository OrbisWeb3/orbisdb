import React from "react";
import Header from "../components/Header";
import ConfigurationSettings from "../components/ConfigurationSettings";

/** Import Context */
import { GlobalProvider, useGlobal } from "../contexts/Global";
import '../styles/globals.css'

export default function App({ Component, pageProps }) {
  return(
    <GlobalProvider>
      <AppContent Component={Component} pageProps={pageProps} />
    </GlobalProvider>
  )
}

function AppContent({Component, pageProps}) {
  const { settings, adminLoading } = useGlobal();
  return(
    <div className="h-full w-full flex flex-col">
      {(settings && !adminLoading) ?
        <>
          {!settings.configuration ?
            <>
              <Header showItems={false} />
              <ConfigurationSetup />
            </>
          :
            <>
              <Header showItems={true} />
              <Component {...pageProps} />
            </>
          }
        </>
      :
        <p className="text-base w-full text-center pt-12">Loading settings...</p>
      }
    </div>
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
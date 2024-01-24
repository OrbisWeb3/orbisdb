import React, { useState, useEffect, useContext } from "react";
import { STATUS, sleep } from "../utils";
import StepsProgress from "./StepsProgress";
import { GlobalContext } from "../contexts/Global";
import Button from "./Button";

export default function ConfigurationSettings() {
    return(
        <ConfigurationSetup />
    )
}

export function ConfigurationSetup() {
  const { settings, setSettings } = useContext(GlobalContext);
  const [status, setStatus] = useState(STATUS.ACTIVE);
  const [ceramicNode, setCeramicNode] = useState(settings?.configuration?.ceramic?.node);
  const [ceramicSeed, setCeramicSeed] = useState(settings?.configuration?.ceramic?.seed);
  const [dbUser, setDbUser] = useState(settings?.configuration?.db?.user);
  const [dbDatabase, setDbDatabase] = useState(settings?.configuration?.db?.database);
  const [dbPassword, setDbPassword] = useState(settings?.configuration?.db?.password);
  const [dbHost, setDbHost] = useState(settings?.configuration?.db?.host);
  const [dbPort, setDbPort] = useState(settings?.configuration?.db?.port);
  const [step, setStep] = useState(1);

  async function saveSettings() {
    console.log("Enter save settings.");
    setStatus(STATUS.LOADING);
    try {
      let response = await fetch('/api/settings/update-configuration', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          configuration: {
            ceramic: {
              node: ceramicNode,
              seed: ceramicSeed
            },
            db: {
              user: dbUser,
              database: dbDatabase,
              password: dbPassword,
              host: dbHost,
              port: parseInt(dbPort)
            }
          }
        })
      });

      response = await response.json();
      console.log("Configuration saved:", response);

      if(response.status == 200) {
        setStatus(STATUS.SUCCESS);
        setSettings(response.updatedSettings);
      } else {
        console.log("Error updating configuration.");
      }
    } catch(e) {
      setStatus(STATUS.ERROR);
      await sleep(1500);
      setStatus(STATUS.ACTIVE);
      console.log("Error updating configuration: ", e);
    }
  }

  function generateSeed() {
    const buffer = new Uint8Array(32);
    const seed = crypto.getRandomValues(buffer);
    const array = Array.from(seed); // Convert Uint8Array to array
    const _seed = JSON.parse(JSON.stringify(array)); // Convert array to JSON object
    let seedStr = "[" + _seed.toString() + "]";
    setCeramicSeed(seedStr);
  }

  return(
    <>
        {/** Stepper to show progress */}
        <StepsProgress steps={["Ceramic Settings", "Database"]} currentStep={step} />
        
        {/** Step 1: Ceramic node */}
        {step == 1 &&
          <>
            <div className="mt-2">
              <label className="text-base font-medium mb-2">Ceramic node URL:</label>
              <input type="text" placeholder="Enter your Ceramic node URL" className="bg-white w-full px-2 py-1 rounded-md border border-slate-300 text-base text-slate-900 mb-1.5" onChange={(e) => setCeramicNode(e.target.value)} value={ceramicNode} />
            </div>

            <div className="mt-3">
              <label className="text-base font-medium mb-2">Ceramic Seed:</label>
              <p className="text-sm mb-2 text-slate-500">This seed will be used to create streams from the OrbisDB UI as well as by plugins creating streams. You can also <span className="hover:underline text-blue-600 cursor-pointer" onClick={() => generateSeed()}>generate a new one</span>. Make sure to back it up somewhere.</p>
              <textarea type="text" placeholder="Your Ceramic admin seed" className="bg-white w-full px-2 py-1 rounded-md border border-slate-300 text-base text-slate-900 mb-1.5" onChange={(e) => setCeramicSeed(e.target.value)} value={ceramicSeed} />
            </div>
            
            {/** CTA to save updated context */}
            <div className="flex w-full justify-center mt-2">
              <Button title="Next" onClick={() => setStep(2)} />
            </div>
          </>
        }

        {/** Step 2: Database configuration */}
        {step == 2 &&
          <>
            <div className="mt-2">
              <label className="text-base font-medium text-center">Database configuration:</label>
              <p className="text-sm text-slate-500 mb-2">This database will be used to index the data stored on your Ceramic node in order to query and analyze it easily.</p>
              <input type="text" placeholder="User" className="bg-white w-full px-2 py-1 rounded-md border border-slate-300 text-base text-slate-900 mb-1.5" onChange={(e) => setDbUser(e.target.value)} value={dbUser} />
              <input type="text" placeholder="Database" className="bg-white w-full px-2 py-1 rounded-md border border-slate-300 text-base text-slate-900 mb-1.5" onChange={(e) => setDbDatabase(e.target.value)} value={dbDatabase} />
              <input type="text" placeholder="Password" className="bg-white w-full px-2 py-1 rounded-md border border-slate-300 text-base text-slate-900 mb-1.5" onChange={(e) => setDbPassword(e.target.value)} value={dbPassword} />
              <input type="text" placeholder="Host" className="bg-white w-full px-2 py-1 rounded-md border border-slate-300 text-base text-slate-900 mb-1.5" onChange={(e) => setDbHost(e.target.value)} value={dbHost} />
              <input type="text" placeholder="Port" className="bg-white w-full px-2 py-1 rounded-md border border-slate-300 text-base text-slate-900 mb-1.5" onChange={(e) => setDbPort(e.target.value)} value={dbPort} />
            </div>
            
            {/** CTA to save updated context */}
            <div className="flex w-full justify-center mt-2">
              <Button title={settings.configuration ? "Save" : "Get started"} status={status} onClick={() => saveSettings()} />
            </div>
          </>
        }
    </>
  )
}
import React, { useState, useEffect, useContext } from "react";
import { STATUS, sleep } from "../utils";
import StepsProgress from "./StepsProgress";
import { useGlobal } from "../contexts/Global";
import Button from "./Button";
import { CheckIcon, SocialIcon } from "./Icons";
import { OrbisDB } from "@useorbis/db-sdk";
import { OrbisEVMAuth } from "@useorbis/db-sdk/auth";
import ConfigurationPreset from "./ConfigurationPreset";

export default function ConfigurationSettings({ showPresets }) {
  return <ConfigurationSetup showPresets={showPresets} />;
}

export function ConfigurationSetup({ showPresets }) {
  const {
    settings,
    globalSettings,
    setSettings,
    sessionJwt,
    setSessionJwt,
    setIsAdmin,
    setIsConfigured,
    adminSession,
    setIsConnected,
  } = useGlobal();
  const [status, setStatus] = useState(STATUS.ACTIVE);
  const [statusConnect, setStatusConnect] = useState(STATUS.ACTIVE);
  const [hasLocalNode, setHasLocalNode] = useState(false);
  const [ceramicNode, setCeramicNode] = useState(
    settings?.configuration?.ceramic?.node
  );
  const [ceramicSeed, setCeramicSeed] = useState(
    settings?.configuration?.ceramic?.seed
  );
  const [dbUser, setDbUser] = useState(settings?.configuration?.db?.user);
  const [dbDatabase, setDbDatabase] = useState(
    settings?.configuration?.db?.database
  );
  const [dbPassword, setDbPassword] = useState(
    settings?.configuration?.db?.password
  );
  const [dbHost, setDbHost] = useState(settings?.configuration?.db?.host);
  const [dbPort, setDbPort] = useState(settings?.configuration?.db?.port);
  const [adminAccount, setAdminAccount] = useState(
    settings?.configuration?.admins?.[0] || null
  );
  const [step, setStep] = useState(1);
  const [presets, setPresets] = useState([]);

  useEffect(() => {
    // Check if a local node exists only if there isn't already one saved in settings
    if (!settings?.configuration?.ceramic?.node) {
      hasLocalNode();
    }

    async function hasLocalNode() {
      let isValid = await checkLocalCeramicNode();
      if (isValid) {
        setCeramicNode("http://localhost:7007/");
        setHasLocalNode(true);
      }
    }
  }, []);

  async function checkLocalCeramicNode() {
    let isValid;
    try {
      const response = await fetch("/api/ceramic/local/status");
      const res = await response.json();
      console.log("checkLocalCeramicNode res:", res);

      if (response.status == 200) {
        isValid = true;
      } else {
        isValid = false;
      }
    } catch (e) {
      console.log("Couldn't connect to Ceramic node.");
      isValid = false;
    }

    return isValid;
  }

  // Check if the last character of the node URL is a "/", add it if it's not
  function cleanCeramicNode(node) {
    if (node.charAt(node.length - 1) !== "/") {
      node += "/"; // Add a "/" to the end of the URL
    }
    return node;
  }

  async function goStep2() {
    if (
      !ceramicNode ||
      ceramicNode == "" ||
      !ceramicSeed ||
      ceramicSeed == ""
    ) {
      alert("The node URL and Ceramic seed are required.");
      return;
    }
    setStatus(STATUS.ACTIVE);
    setStep(2);
  }

  async function goStep3() {
    if (
      !dbDatabase ||
      dbDatabase == "" ||
      !dbUser ||
      dbUser == "" ||
      !dbPassword ||
      dbPassword == ""
    ) {
      alert("The database credentials are required.");
      return;
    }
    setStatus(STATUS.ACTIVE);
    if (showPresets) {
      setStep(3);
    } else {
      setStep(4);
    }
  }

  async function goStep4() {
    setStatus(STATUS.ACTIVE);
    setStep(4);
  }

  async function saveSettings() {
    console.log("Enter saveSettings()");
    if (!adminAccount || adminAccount == "") {
      alert("Having at least one admin is required.");
      return;
    }
    setStatus(STATUS.LOADING);
    try {
      const rawResponse = await fetch("/api/settings", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${sessionJwt}`,
        },
        body: JSON.stringify({
          slot: adminSession,
          configuration: {
            admins: [adminAccount.toLowerCase()],
            ceramic: {
              node: cleanCeramicNode(ceramicNode),
              seed: ceramicSeed,
            },
            db: {
              user: dbUser,
              database: dbDatabase,
              password: dbPassword,
              host: dbHost,
              port: parseInt(dbPort),
            },
          },
          presets: presets,
        }),
      });

      const response = await rawResponse.json();
      console.log("Configuration saved:", response);

      if (response.result) {
        console.log(
          "Success updating configutation with:",
          response.updatedSettings
        );
        setStatus(STATUS.SUCCESS);
        setSettings(response.updatedSettings);
        setIsConfigured(true);
        setIsConnected(true);
      } else {
        alert("Error updating configuration.");
        console.log("response:", response);
        setStatus(STATUS.ERROR);
        await sleep(1500);
        setStatus(STATUS.ACTIVE);
      }
    } catch (e) {
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

  async function connectMM() {
    setStatusConnect(STATUS.LOADING);
    let adminOrbisDB = new OrbisDB({
      ceramic: {
        gateway: settings?.configuration?.ceramic?.node,
      },
      nodes: [
        {
          gateway: "http://localhost:7008",
          key: "<YOUR_API_KEY>",
        },
      ],
    });
    const auth = new OrbisEVMAuth(window.ethereum);

    try {
      const result = await adminOrbisDB.connectUser({
        auth,
        saveSession: false,
      });
      localStorage.setItem(
        "orbisdb-admin-session",
        result.auth.serializedSession
      );
      if (result?.user) {
        setAdminAccount(result.user.did);
        setIsAdmin(true);
        setSessionJwt(result.auth.serializedSession);
      }
      setStatusConnect(STATUS.SUCCESS);
    } catch (e) {
      console.log("Error while connecting:", e);
      setStatusConnect(STATUS.ACTIVE);
    }
  }

  return (
    <>
      {/** Stepper to show progress */}
      {showPresets ? (
        <StepsProgress
          steps={["Ceramic Settings", "Database", "Presets", "Admins"]}
          currentStep={step}
        />
      ) : (
        <StepsProgress
          steps={["Ceramic Settings", "Database", "Admins"]}
          currentStep={step}
        />
      )}

      {/** Step 1: Ceramic node */}
      {step == 1 && (
        <>
          <div className="mt-2">
            <label className="text-base font-medium mb-2">
              Ceramic node URL:
            </label>
            <input
              type="text"
              placeholder="Enter your Ceramic node URL"
              className="bg-white w-full px-2 py-1 rounded-md border border-slate-300 text-base text-slate-900 mb-1.5"
              onChange={(e) => setCeramicNode(e.target.value)}
              value={ceramicNode}
            />
            {hasLocalNode && (
              <p className="text-green-600 text-xs items-center space-x-1 flex flex-row">
                <CheckIcon />{" "}
                <span>We found a local Ceramic node on this server.</span>
              </p>
            )}
          </div>

          <div className="mt-3">
            <label className="text-base font-medium mb-2">Ceramic Seed:</label>
            <p className="text-sm mb-2 text-slate-500">
              This seed will be used to create streams from the OrbisDB UI as
              well as by plugins creating streams. You can also{" "}
              <span
                className="hover:underline text-blue-600 cursor-pointer"
                onClick={() => generateSeed()}
              >
                generate a new one
              </span>
              . Make sure to back it up somewhere.
            </p>
            <textarea
              type="text"
              placeholder="Your Ceramic admin seed"
              className="bg-white w-full px-2 py-1 rounded-md border border-slate-300 text-base text-slate-900 mb-1.5"
              onChange={(e) => setCeramicSeed(e.target.value)}
              value={ceramicSeed}
            />
          </div>

          {/** CTA to save updated context */}
          <div className="flex w-full justify-center mt-2">
            <Button title="Next" onClick={() => goStep2()} />
          </div>
        </>
      )}

      {/** Step 2: Database configuration */}
      {step == 2 && (
        <>
          <div className="mt-2">
            <label className="text-base font-medium text-center">
              Database configuration:
            </label>
            <p className="text-sm text-slate-500 mb-2">
              This database will be used to index the data stored on your
              Ceramic node in order to query and analyze it easily.
            </p>
            <input
              type="text"
              placeholder="User"
              className="bg-white w-full px-2 py-1 rounded-md border border-slate-300 text-base text-slate-900 mb-1.5"
              onChange={(e) => setDbUser(e.target.value)}
              value={dbUser}
            />
            <input
              type="text"
              placeholder="Database"
              className="bg-white w-full px-2 py-1 rounded-md border border-slate-300 text-base text-slate-900 mb-1.5"
              onChange={(e) => setDbDatabase(e.target.value)}
              value={dbDatabase}
            />
            <input
              type="text"
              placeholder="Password"
              className="bg-white w-full px-2 py-1 rounded-md border border-slate-300 text-base text-slate-900 mb-1.5"
              onChange={(e) => setDbPassword(e.target.value)}
              value={dbPassword}
            />
            <input
              type="text"
              placeholder="Host"
              className="bg-white w-full px-2 py-1 rounded-md border border-slate-300 text-base text-slate-900 mb-1.5"
              onChange={(e) => setDbHost(e.target.value)}
              value={dbHost}
            />
            <input
              type="text"
              placeholder="Port"
              className="bg-white w-full px-2 py-1 rounded-md border border-slate-300 text-base text-slate-900 mb-1.5"
              onChange={(e) => setDbPort(e.target.value)}
              value={dbPort}
            />
          </div>

          {/** CTA to save updated context */}
          <div className="flex w-full justify-center mt-2">
            <Button title="Next" status={status} onClick={() => goStep3()} />
          </div>
        </>
      )}

      {/** Step 3: Presets configuration */}
      {step == 3 && (
        <>
          <div className="mt-2">
            <label className="text-base font-medium text-center">
              Database configuration:
            </label>
            <p className="text-sm text-slate-500 mb-2">
              This database will be used to index the data stored on your
              Ceramic node in order to query and analyze it easily.
            </p>
            {/** Display presets available */}
            <ConfigurationPreset presets={presets} setPresets={setPresets} />
          </div>

          {/** CTA to save updated context */}
          <div className="flex w-full justify-center mt-2">
            <Button title="Next" status={status} onClick={() => goStep4()} />
          </div>
        </>
      )}

      {/** Step 3: Add admins */}
      {step == 4 && (
        <>
          <div className="mt-2">
            <label className="text-base font-medium text-center">
              Add your OrbisDB admin:
            </label>
            <p className="text-sm text-slate-500 mb-2">
              Connect with your address which will be considered the admin and
              able to perform admin actions on your OrbisDB instance.
            </p>
            <div className="flex flex-col items-center">
              <Button
                type="secondary"
                title="Connect with Metamask"
                successTitle="Connected with Metamask"
                status={statusConnect}
                onClick={() => connectMM()}
              />
              {adminAccount && (
                <p className="text-sm text-slate-500 mt-1">
                  Admin: {adminAccount}
                </p>
              )}
            </div>
          </div>

          {/** CTA to save updated context */}
          <div className="flex w-full justify-center mt-4">
            <Button
              title={settings.configuration ? "Save" : "Get started"}
              status={adminAccount ? status : STATUS.DISABLED}
              onClick={() => saveSettings()}
            />
          </div>
        </>
      )}
    </>
  );
}

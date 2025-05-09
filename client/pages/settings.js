import React, { useState, useEffect, useContext } from "react";
import ConfigurationSettings from "../components/ConfigurationSettings";
import AceEditor from "react-ace";
import "ace-builds/src-min-noconflict/mode-json";
import "ace-builds/src-noconflict/theme-sqlserver";
import "ace-builds/src-min-noconflict/ext-language_tools";
import { useGlobal } from "../contexts/Global";
import Button from "../components/Button";
import { STATUS, sleep } from "../utils";

export default function Settings() {
  const {
    settings,
    globalSettings,
    setSettings,
    sessionJwt,
    isShared,
    isGlobalAdmin,
  } = useGlobal();
  const [showJson, setShowJson] = useState(false);
  const [jsonValue, setJsonValue] = useState(
    globalSettings
      ? JSON.stringify(globalSettings, null, "\t")
      : settings
        ? JSON.stringify(settings, null, "\t")
        : ""
  );
  const [status, setStatus] = useState(0);

  async function saveFullSettings() {
    console.log("Enter saveSettings() with:", jsonValue);
    setStatus(STATUS.LOADING);
    try {
      // TODO: Check the value of this and security implications
      const rawResponse = await fetch("/api/settings", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${sessionJwt}`,
        },
        body: jsonValue,
      });

      const response = await rawResponse.json();
      console.log("Configuration saved:", response);

      if (rawResponse.status == 200) {
        console.log(
          "Success updating configutation with:",
          response.updatedSettings
        );
        setStatus(STATUS.SUCCESS);
        setSettings(response.updatedSettings);
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

  return (
    <div className="flex items-center flex-col">
      <div className="w-1/3 flex flex-col mt-12 bg-white border border-slate-200 p-6 rounded-md">
        {showJson ? (
          <div className="flex flex-col">
            <AceEditor.default
              id="editor"
              aria-label="editor"
              mode="json" // Set mode to JSON
              theme="sqlserver"
              name="editor"
              width="100%"
              fontSize={13}
              minLines={25}
              maxLines={100}
              showPrintMargin={false}
              showGutter
              placeholder="Write your JSON here..."
              editorProps={{ $blockScrolling: true }}
              value={jsonValue} // Assuming you want to keep using this prop for JSON content
              onChange={(value) => setJsonValue(value)} // And this for handling changes
              showLineNumbers
            />
            <div className="flex mt-4 justify-center">
              <Button
                status={status}
                title="Save settings"
                onClick={() => saveFullSettings()}
              />
            </div>
          </div>
        ) : (
          <ConfigurationSettings showPresets={false} />
        )}
      </div>

      {/** Give users running non shared instances to be able to paste the full json as settings */}
      {(!isShared || isGlobalAdmin) && (
        <p
          className="w-full text-center mt-4 text-xs font-medium cursor-pointer hover:underline"
          onClick={() => setShowJson(!showJson)}
        >
          {showJson ? "Revert to manual settings" : "Paste full JSON settings"}
        </p>
      )}
    </div>
  );
}

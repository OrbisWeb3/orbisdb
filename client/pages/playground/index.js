import React, { useState, useEffect, useContext, useRef } from "react";
import AceEditor from "react-ace";
import "ace-builds/src-min-noconflict/mode-javascript";
import "ace-builds/src-noconflict/theme-nord_dark";
import "ace-builds/src-min-noconflict/ext-language_tools";
import { OrbisDB } from "@useorbis/db-sdk";
import Button from "../../components/Button";
import { useGlobal } from "../../contexts/Global";
import ConnectStep from "./ConnectStep";
import ConfigurationStep from "./ConfigurationStep";
import SetModel from "./SetModel";
import CreateModel from "./CreateModel";
import { sleep } from "../../utils";
import UseExistingModel from "./UseExistingModel";
import CreateModelInstance from "./CreateModelInstance";
import QueryModel from "./QueryModel";

let orbisdb;

export default function Playground() {
  const { settings, isShared, adminSession } = useGlobal();

  useEffect(() => {
    console.log(
      "settings.configuration.ceramic.node:",
      settings.configuration.ceramic.node
    );
    if (isShared) {
      orbisdb = new OrbisDB({
        ceramic: {
          gateway: settings.configuration.ceramic.node,
        },
        nodes: [
          {
            gateway: "http://localhost:7008/",
            env: adminSession,
          },
        ],
      });
    } else {
      if (settings.configuration.ceramic.node) {
        orbisdb = new OrbisDB({
          ceramic: {
            gateway: settings.configuration.ceramic.node,
          },
          nodes: [
            {
              gateway: "http://localhost:7008/",
              key: "",
            },
          ],
        });
      }
    }
  }, [settings?.configuration]);

  return (
    <main
      className={`playground flex min-h-screen flex-col items-center p-6 pt-12 bg-slate-50`}
    >
      <div className="text-xl text-slate-900 font-medium">Playground</div>
      <div className="text-base text-slate-500 text-center">
        Here is a quick playground to understand how our DB SDK works. It can
        also be helpful to test your OrbisDB setup.
      </div>

      {/** Demo container */}
      <div className="bg-white flex items-start justify-center flex-row rounded-md p-6 border border-slate-200 mt-6 w-full lg:w-8/12 shadow-sm">
        <div className="flex flex-col md:flex-row w-full space-x-0 md:space-x-2 items-start">
          <Demo />
        </div>
      </div>
    </main>
  );
}

const Demo = () => {
  const [step, setStep] = useState(0);
  const [modelId, setModelId] = useState("");
  const [tableName, setTableName] = useState("");
  const [modelDefinition, setModelDefinition] = useState({
    name: "MyCustomModel",
    schema: {
      type: "object",
      $defs: {
        DID: {
          type: "string",
          title: "DID",
          pattern:
            "^did:[a-zA-Z0-9.!#$%&'*+\\/=?^_`{|}~-]+:[a-zA-Z0-9.!#$%&'*+\\/=?^_`{|}~-]*:?[a-zA-Z0-9.!#$%&'*+\\/=?^_`{|}~-]*:?[a-zA-Z0-9.!#$%&'*+\\/=?^_`{|}~-]*$",
          maxLength: 100,
        },
        DateTime: {
          type: "string",
          title: "DateTime",
          format: "date-time",
          maxLength: 100,
        },
      },
      $schema: "https://json-schema.org/draft/2020-12/schema",
      properties: {
        custom_bool: {
          type: "boolean",
        },
      },
      additionalProperties: false,
    },
    version: "2.0",
    interface: false,
    immutableFields: [],
    implements: [],
    accountRelation: {
      type: "list",
    },
  });

  switch (step) {
    case 0:
      return <ConfigurationStep setStep={setStep} />;
    case 1:
      return <ConnectStep setStep={setStep} orbisdb={orbisdb} />;
    case 2:
      return <SetModel setModelId={setModelId} setStep={setStep} />;
    case 3.1:
      return (
        <CreateModel
          setModelId={setModelId}
          setModelDefinition={setModelDefinition}
          setStep={setStep}
          orbisdb={orbisdb}
        />
      );
    case 3.2:
      return (
        <UseExistingModel
          modelId={modelId}
          setModelId={setModelId}
          setStep={setStep}
          setModelDefinition={setModelDefinition}
          orbisdb={orbisdb}
        />
      );
    case 4.1:
      return (
        <CreateModelInstance
          modelId={modelId}
          tableName={tableName}
          modelDefinition={modelDefinition}
          setStep={setStep}
          orbisdb={orbisdb}
        />
      );
    case 5:
      return (
        <QueryModel
          modelId={modelId}
          tableName={tableName}
          setStep={setStep}
          orbisdb={orbisdb}
        />
      );
    default:
      return null;
  }
};

export const Instructions = ({
  showBack,
  backAction,
  title,
  description,
  buttons,
}) => {
  return (
    <div className="flex flex-col justify-center items-center pr-4">
      <div className="flex flex-row items-center w-full">
        {showBack && (
          <div className="flex p-1 cursor-pointer" onClick={backAction}>
            <svg
              width="7"
              height="10"
              viewBox="0 0 6 10"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                fill-rule="evenodd"
                clip-rule="evenodd"
                d="M5.79062 0.230169C6.07772 0.528748 6.06841 1.00353 5.76983 1.29063L1.83208 5L5.76983 8.70938C6.06841 8.99647 6.07772 9.47125 5.79062 9.76983C5.50353 10.0684 5.02875 10.0777 4.73017 9.79063L0.230167 5.54063C0.0831082 5.39922 -1.18115e-06 5.20401 -1.17223e-06 5C-1.16331e-06 4.79599 0.0831082 4.60078 0.230167 4.45938L4.73017 0.209376C5.02875 -0.077719 5.50353 -0.0684095 5.79062 0.230169Z"
                fill="#0F172A"
              />
            </svg>
          </div>
        )}
        <div className="text-base text-slate-900 font-medium flex-1 text-center">
          {title}
        </div>
      </div>
      <div className="text-sm text-slate-500 mb-4 text-center px-4">
        {description}
      </div>
      {/** Loop through all buttons CTA */}
      {buttons && buttons.length > 0 && (
        <div className="flex flex-row space-x-2">
          {buttons.map((button, key) => (
            <Button title={button.cta} onClick={button.action} key={key} />
          ))}
        </div>
      )}
    </div>
  );
};

export const CodeEditor = ({ code, className = "w-7/12" }) => {
  return (
    <div
      className={`text-white flex overflow-y-scroll sql_editor rounded-md py-3 bg-[#2e3440] ${className}`}
    >
      <AceEditor.default
        id="editor"
        aria-label="editor"
        mode="javascript"
        disabled={true}
        theme="nord_dark"
        name="editor"
        width="100%"
        fontSize={13}
        minLines={5}
        maxLines={100}
        showPrintMargin={false}
        showGutter
        readOnly={true}
        placeholder="Write your query here..."
        editorProps={{ $blockScrolling: true }}
        setOptions={{
          enableBasicAutocompletion: true,
          enableLiveAutocompletion: true,
          enableSnippets: true,
        }}
        value={code}
        showLineNumbers
      />
    </div>
  );
};

/** Returns a shortened version of a string */
export function shortAddress(address, number = 5) {
  if (!address) {
    return "-";
  }

  const firstChars = address.substring(0, number);
  const lastChars = address.substr(address.length - number);
  return firstChars.concat("---", lastChars);
}

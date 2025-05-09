import React, { useState, useEffect, useContext } from "react";
import Link from "next/link";
import { useGlobal } from "../../contexts/Global";
import {
  CheckIcon,
  SettingsIcon,
  DashIcon,
  ExternalLinkIcon,
  DeleteIcon,
} from "../../components/Icons";
import Alert from "../../components/Alert";
import PluginSettingsModal from "../../components/Modals/PluginSettings";
import AssignContextModal from "../../components/Modals/AssignContext";
import Button from "../../components/Button";
import InternalNavigation from "../../components/InternalNavigation";
import { useRouter } from "next/router";
import { STATUS, sleep, findContextById } from "../../utils";
import useContextDetails from "../../hooks/useContextDetails";
import MarkdownRenderer from "../../components/MarkdownRenderer";

export default function PluginDetails() {
  const { settings, setSettings, sessionJwt } = useGlobal();
  const [pluginDetails, setPluginDetails] = useState();
  const [status, setStatus] = useState(STATUS.ACTIVE);
  const [defaultVariables, setDefaultVariables] = useState();
  const [isInstalled, setIsInstalled] = useState(false);
  const [nav, setNav] = useState("Overview");
  const [installPluginModalVis, setInstallPluginModalVis] = useState(false);
  const [assignContextModalVis, setAssignContextModalVis] = useState(false);
  const [selectedContext, setSelectedContext] = useState(null);
  const [variableValues, setVariableValues] = useState(
    selectedContext ? selectedContext.variables : null
  );

  /** Use Next router to get conversation_id */
  const router = useRouter();
  const { plugin_id } = router.query;
  const existingPluginIndex = getPluginIndex();

  useEffect(() => {
    if (plugin_id) {
      loadPluginDetails();
    }

    async function loadPluginDetails() {
      /** Load plugin details */
      try {
        let rawResponse = await fetch(`/api/plugins/${plugin_id}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${sessionJwt}`,
          },
        });
        const result = await rawResponse.json();
        console.log("plugin details:", result);
        if (rawResponse.status == 200) {
          setPluginDetails(result.plugin);
        } else {
          console.log("Error retrieving plugin details.");
        }
      } catch (e) {
        console.log("Error retrieving plugin details:", e);
      }

      /** Check if plugin is already installed or not */
      if (existingPluginIndex != -1) {
        // Plugin is already installed, assign the default variables
        setIsInstalled(true);
        let _defaultVariables = settings.plugins[existingPluginIndex].variables;
        console.log("_defaultVariables:", _defaultVariables);
        setDefaultVariables(_defaultVariables);
        setVariableValues(_defaultVariables);
      }
    }
  }, [plugin_id]);

  function getPluginIndex() {
    let _existingPluginIndex = -1;
    if (settings.plugins && settings.plugins.length > 0) {
      _existingPluginIndex = settings.plugins.findIndex(
        (p) => p.plugin_id === plugin_id
      );
    }
    console.log("_existingPluginIndex:", _existingPluginIndex);
    return _existingPluginIndex;
  }

  /** Triggered when a variable field in the loop variable component is updated */
  const handleVariableChange = (variableId, value) => {
    setVariableValues((prevValues) => ({
      ...prevValues,
      [variableId]: value,
    }));
  };

  /** Will start using the plugin by adding it to the settings file */
  async function savePlugin() {
    setStatus(STATUS.LOADING);
    event.preventDefault(); // Prevents the default form submit behavior

    // Save settings in the orbisdb-settings.json file
    try {
      let rawResponse = await fetch("/api/plugins", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${sessionJwt}`,
        },
        body: JSON.stringify({
          plugin: {
            plugin_id: plugin_id,
            variables: variableValues,
          },
        }),
      });

      const response = await rawResponse.json();
      console.log("plugin added:", response);

      if (rawResponse.status == 200) {
        setStatus(STATUS.SUCCESS);
        setSettings(response.updatedSettings);
        setIsInstalled(true);
        await sleep(1500);
        setInstallPluginModalVis(false);
      } else {
        console.log("Error adding plugin.");
      }
    } catch (e) {
      console.log("Error adding plugin:", e);
    }

    console.log("Form data submitted:", variableValues);
  }

  return (
    <div className="flex flex-row space-x-8">
      {/** Plugin content */}
      <div className="px-16 py-12 md:w-2/3">
        {pluginDetails ? (
          <>
            <div className="flex flex-row items-center">
              {pluginDetails.logo && (
                <img
                  src={pluginDetails.logo}
                  className="mr-3 h-20 w-20 rounded-md"
                />
              )}
              <h1 className="text-3xl font-bold text-slate-900">
                {pluginDetails.name}
              </h1>
            </div>

            {/** Plugin Navigation */}
            <div className="flex justify-start mt-3 mb-5">
              <InternalNavigation
                items={[
                  { label: "Overview", active: true },
                  { label: "Contexts", active: isInstalled },
                ]}
                nav={nav}
                setNav={setNav}
              />
            </div>

            {/** Show overview tab content */}
            {nav == "Overview" && (
              <MarkdownRenderer
                filePath={"/api/plugins/readme/" + plugin_id}
                fallback={pluginDetails.description}
              />
            )}

            {/** Show contexts tab content */}
            {nav == "Contexts" && (
              <>
                {settings.plugins &&
                settings.plugins[existingPluginIndex]?.contexts?.length > 0 ? (
                  <>
                    <p className="text-slate-600 mt-3 text-base">
                      Enable this plugin on your contexts to start using it:
                    </p>
                    <div className="flex flex-row flex-wrap mt-2 items-start">
                      {settings.plugins[existingPluginIndex].contexts?.map(
                        (context, index) => (
                          <OneContext
                            plugin_id={plugin_id}
                            context={context}
                            key={index}
                            setSelectedContext={setSelectedContext}
                            pluginDetails={pluginDetails}
                          />
                        )
                      )}
                    </div>
                  </>
                ) : (
                  <Alert title="You haven't assigned this plugin to a context yet." />
                )}

                <div className="flex w-full justify-center mt-4">
                  <Button
                    type="secondary"
                    title="Assign to a new context"
                    onClick={() => setAssignContextModalVis(true)}
                  />
                </div>
              </>
            )}

            {/** Show settings tab content */}
            {nav == "Settings" && (
              <div className="flex flex-col space-y-4 mt-4 lg:w-2/5">
                <form onSubmit={savePlugin}>
                  {/** If this plugin is requiring variables we show those here */}
                  {pluginDetails.variables && (
                    <LoopPluginVariables
                      variables={pluginDetails.variables}
                      defaultVariables={defaultVariables}
                      handleVariableChange={handleVariableChange}
                    />
                  )}
                  <div className="flex flex-row justify-center">
                    <Button title="Save" status={status} successTitle="Saved" />
                  </div>
                </form>
              </div>
            )}
          </>
        ) : (
          <p>Loading...</p>
        )}
      </div>

      {/** Plugin right-side */}
      {pluginDetails && (
        <div className="flex flex-col py-12 md:w-1/3 pr-16">
          {/** Install block */}
          <div className="rounded-md bg-white border border-slate-200 p-6 py-5 w-full">
            <h2 className="font-medium text-lg">Installation</h2>
            <p className="text-slate-500 text-base">
              Install this plugin to start using it on your contexts.
            </p>

            <p className="text-base font-medium mt-3 mb-0.5">Hooks used:</p>
            <div className="flex flex-row space-x-2">
              {pluginDetails.hooks &&
                pluginDetails.hooks.map((hook, index) => (
                  <div
                    className="bg-slate-100 rounded-full px-3 py-1 text-xs font-medium text-slate-800"
                    key={index}
                  >
                    {hook}
                  </div>
                ))}
            </div>

            {/** Main install button */}
            <div className="flex flex-row mt-4 justify-center">
              {isInstalled ? (
                <div className="flex flex-col space-y-2">
                  <div className="bg-green-500 text-white text-sm px-2.5 py-1.5 rounded-md font-medium pointer flex flex-row items-center justify-center space-x-1">
                    <CheckIcon /> <span>Plugin installed</span>
                  </div>
                  <div
                    className="text-slate-900 hover:underline text-sm cursor-pointer font-medium"
                    onClick={() => setInstallPluginModalVis(true)}
                  >
                    Update plugin setings
                  </div>
                </div>
              ) : (
                <Button
                  title={
                    isInstalled ? "Update plugin settings" : "Install plugin"
                  }
                  status={status}
                  successTitle="Plugin added"
                  onClick={() => setInstallPluginModalVis(true)}
                />
              )}
            </div>
          </div>
        </div>
      )}

      {/** Modals */}
      {installPluginModalVis && (
        <PluginSettingsModal
          hide={() => setInstallPluginModalVis(false)}
          handleVariableChange={handleVariableChange}
          variableValues={variableValues}
          savePlugin={savePlugin}
          status={status}
          pluginDetails={pluginDetails}
          defaultVariables={defaultVariables}
        />
      )}

      {/** Modal to assign a plugin to a context */}
      {assignContextModalVis && (
        <AssignContextModal
          hide={() => setAssignContextModalVis(false)}
          plugin_id={plugin_id}
        />
      )}

      {/** Modal to assign a plugin to a context */}
      {selectedContext != null && (
        <AssignContextModal
          hide={() => setSelectedContext(null)}
          selectedContext={selectedContext}
          plugin_id={plugin_id}
        />
      )}
    </div>
  );
}

const OneContext = ({
  plugin_id,
  context,
  setSelectedContext,
  pluginDetails,
}) => {
  console.log("pluginDetails context:", context);
  const { settings, setSettings, sessionJwt } = useGlobal();
  const [dynamicVariables, setDynamicVariables] = useState(0);

  useEffect(() => {
    async function loadDynamicVariables() {
      try {
        let rawResponse = await fetch(
          `/api/plugins/${context.uuid}/dynamic-variables`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${sessionJwt}`,
            },
          }
        );
        const result = await rawResponse.json();
        console.log("Plugin dynamic variables:", result);
        if (result && result.dynamic_variables) {
          setDynamicVariables(result.dynamic_variables);
        }
      } catch (e) {
        console.log("Couldn't load plugin dynamic variables:", e);
      }
    }

    // Load dynamic variables on start
    loadDynamicVariables();

    // Call loadDynamicVariables every 2.5 seconds
    const intervalId = setInterval(loadDynamicVariables, 2500);

    // Cleanup interval function
    return () => clearInterval(intervalId);
  }, []);

  async function deletePlugin(context) {
    if (
      confirm("Are you sure you want to delete this plugin from this context?")
    ) {
      // Delete it
      console.log("Deleting plugin from context:", context.uuid);
      console.log("pluginDetails:", pluginDetails);
      /** Submit assign context form */
      const rawResponse = await fetch(`/api/plugins/delete`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${sessionJwt}`,
        },
        body: JSON.stringify({
          plugin_id: plugin_id,
          uuid: context.uuid,
        }),
      });
      const response = await rawResponse.json();
      console.log("response:", response);

      if (response.settings) {
        console.log("Plugin was deleted.");
        setSettings(response.settings);
      } else {
        console.log("Error deleting plugin.");
      }
    } else {
      // Do nothing!
      console.log("Plugin was not deleted.");
    }
  }

  const handleAction = (actionName) => {
    try {
      // Create a hidden file input dynamically
      const input = document.createElement("input");
      input.type = "file";
      input.accept = ".csv";
      input.style.display = "none";

      // Set up the file selection handler
      input.addEventListener("change", async function () {
        if (input.files.length > 0) {
          const file = input.files[0];
          const reader = new FileReader();

          reader.onload = async (event) => {
            // Parse CSV data using PapaParse
            const csvData = Papa.parse(event.target.result, {
              header: true,
            }).data;

            // Send parsed CSV data to server
            try {
              const response = await fetch(
                `/api/plugins/${context.uuid}/parse`,
                {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    data: csvData,
                    sessionId: context.uuid,
                  }),
                }
              );
              const result = await response.json();
              console.log("Upload result:", result);
            } catch (error) {
              console.error("Upload error:", error);
            }
          };

          // Read file as text
          reader.readAsText(file);
        }
      });

      // Append input, trigger click, and clean up
      document.body.appendChild(input);
      input.click();
      document.body.removeChild(input);
    } catch (e) {
      console.log("Error executing CSV upload");
    }

    /*if (actionName === 'upload') {
      // Trigger the action endpoint to open the file upload dialog
      fetch(`/api/plugins/${context.uuid}/actions/upload`)
        .then(response => response.text())
        .then(script => {
          // Execute the JavaScript received from the server
          eval(script);
        })
        .catch(error => console.error('Error triggering upload:', error));
    }*/
  };

  const openRouteInPopup = (routeUrl) => {
    const width = 600;
    const height = 600;
    const left = (window.screen.width - width) / 2;
    const top = (window.screen.height - height) / 2;

    window.open(
      routeUrl,
      "_blank", // Target: open in a new window
      `width=${width},height=${height},top=${top},left=${left},resizable,scrollbars`
    );
  };

  return (
    <div className="rounded-md bg-white border border-slate-200 flex flex-col overflow-hidden mb-3 mr-3 min-w-[230px] max-w-[350px]">
      {/** Context details */}
      <div className="flex flex-row px-4 py-3 items-center space-x-1.5">
        {context.path.map((context_id, index) => {
          const { name, logo } = useContextDetails(context_id);
          return (
            <>
              <div className="flex items-center">
                {/** Display context logo if any */}
                {logo && (
                  <img
                    src={logo}
                    alt={name}
                    className="h-5 w-5 flex-shrink-0 mr-1.5 rounded-full"
                  />
                )}
                <span className="text-base font-normal block truncate">
                  {name}
                </span>
              </div>
              {context_id != context.context && <DashIcon />}
            </>
          );
        })}
      </div>

      {/** Display context variables if any */}
      {context.variables && (
        <div className="flex flex-col px-4 text-sm border-t border-slate-100 py-2 text-slate-600 space-y-1">
          {Object.entries(context.variables).map(([key, value]) => (
            <div className="font-mono text-xxs truncate" key={key}>
              <span className="font-bold text-slate-900">{key}:</span>{" "}
              <span className="truncate">{value}</span>
            </div>
          ))}
        </div>
      )}

      {/** Display dynamic variables if any */}
      {dynamicVariables != null && dynamicVariables.length > 0 && (
        <div className="border-t border-slate-100 divide-y divide-slate-100">
          {dynamicVariables.map((dynamic_variable, index) => (
            <div key={index} className="flex flex-col  p-3">
              {/** Handle string */}
              {(dynamic_variable.type == "string" ||
                !dynamic_variable.type) && (
                <div className="flex flex-col">
                  <span className="font-medium text-xs mb-1">
                    {dynamic_variable.name}:{" "}
                    <span className="text-slate-600">
                      {dynamic_variable.value}
                    </span>
                  </span>
                </div>
              )}

              {/** Handle type progress bar */}
              {dynamic_variable.type == "slider" && (
                <ProgressBarVariable dynamic_variable={dynamic_variable} />
              )}

              {/** Handle type badge */}
              {dynamic_variable.type == "badge" && (
                <div className="flex flex-row items-center space-x-1.5">
                  <span className="font-medium text-xs">
                    {dynamic_variable.name}:
                  </span>
                  <div className={dynamic_variable.className}>
                    {dynamic_variable.value}
                  </div>
                </div>
              )}

              {/** Hanlde type logs */}
              {dynamic_variable.type == "logs" &&
                dynamic_variable.value.length > 0 && (
                  <>
                    <span className="font-medium text-xs mb-2">
                      {dynamic_variable.name}:
                    </span>
                    <div className="flex flex-col-reverse space-y-1.5 space-y-reverse max-h-90 overflow-y-scroll">
                      {dynamic_variable.value.map((log, index) => (
                        <Alert
                          key={index}
                          color={log.color}
                          title={log.title}
                          className="text-xs break-words"
                        />
                      ))}
                    </div>
                  </>
                )}
            </div>
          ))}
        </div>
      )}

      {/** Display active routes if any */}
      {pluginDetails.routes && (
        <div className="flex flex-row bg-white text-slate-600 text-sm cursor-pointer border-t border-slate-200 space-x-1 px-3 py-1.5 items-center justify-center">
          <div className="mr-1 font-medium">Routes:</div>
          <>
            {pluginDetails.routes.map((route, index) => (
              <Link
                href={`/api/plugins/${context.uuid}/routes/${route}`}
                target="_blank"
                className="bg-white border border-slate-200 hover:border-[#4483FD]  rounded-md px-3 py-2 text-xs font-medium text-slate-800 space-x-1 flex flex-row items-center"
                key={index}
              >
                <ExternalLinkIcon />
                <span className="font-mono">/{route}</span>
              </Link>
            ))}
          </>
        </div>
      )}

      {/* Display popups CTA if any */}
      {pluginDetails.actions && (
        <div className="flex flex-row bg-white text-slate-600 text-sm cursor-pointer border-t border-slate-200 space-x-1 px-3 py-1.5 items-center justify-center">
          <div className="mr-1 font-medium">Actions:</div>
          <>
            {pluginDetails.actions.map(
              (action, index) =>
                /** If popup */
                action.type === "popup" && (
                  <button
                    onClick={() =>
                      openRouteInPopup(
                        `/api/plugins/${context.uuid}/routes/${action.route}`
                      )
                    }
                    className="bg-white border border-slate-200 hover:border-[#4483FD] rounded-md px-3 py-2 text-xs font-medium text-slate-800 space-x-1 flex flex-row items-center"
                    key={index}
                  >
                    <span>{action.label}</span>
                  </button>
                )
            )}
          </>
        </div>
      )}

      {/** Context footer */}
      <div className="flex flex-row border-t border-slate-200 bg-[#FBFBFB] w-full">
        {/** Configure CTA */}
        <div
          className="flex flex-row  text-slate-700 hover:text-slate-800 space-x-1 cursor-pointer items-center justify-center flex-1 px-3 py-1.5"
          onClick={() => setSelectedContext(context)}
        >
          <SettingsIcon />
          <span className="text-sm font-medium">Configure</span>
        </div>

        {/** Delete CTA */}
        <div
          className="flex flex-row text-red-600 hover:text-red-700 space-x-1 cursor-pointer items-center justify-center flex-1 border-l border-slate-200 px-3 py-1.5"
          onClick={() => deletePlugin(context)}
        >
          <DeleteIcon />
          <span className="text-sm font-medium">Delete</span>
        </div>
      </div>
    </div>
  );
};

const ProgressBarVariable = ({ dynamic_variable }) => {
  // Will return a different bar color based on the current progress
  function getBarColor() {
    let progress = parseInt(dynamic_variable.progress);
    if (progress == 100) {
      return "bg-green-400";
    } else if (progress > 20) {
      return "bg-sky-400";
    } else {
      return "bg-amber-400";
    }
  }
  return (
    <div className="flex flex-col">
      <span className="font-medium text-xs mb-1">
        {dynamic_variable.name}:{" "}
        <span className="text-slate-600">{dynamic_variable.progress}%</span>
      </span>
      <div className="w-full bg-slate-100 rounded-full h-2 rounded-full">
        <div
          className={`${getBarColor(dynamic_variable.progress)} h-2 rounded-full`}
          style={{ width: `${dynamic_variable.progress}%` }}
        ></div>
      </div>
    </div>
  );
};

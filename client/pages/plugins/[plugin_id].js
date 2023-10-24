import React, { useState, useEffect, useContext } from "react";
import { GlobalContext } from "../../contexts/Global";
import { CheckIcon, CloseIcon, QuestionMarkIcon } from "../../components/Icons";
import AddModelModal from "../../components/Modals/AddModel";
import Button from "../../components/Button";
import { useRouter } from 'next/router'
import { STATUS, sleep } from "../../utils";

export default function PluginDetails() {
  const { settings, setSettings } = useContext(GlobalContext);
  const [addModalVis, setAddModalVis] = useState(false);
  const [pluginDetails, setPluginDetails] = useState();
  const [status, setStatus] = useState(STATUS.ACTIVE);
  const [defaultVariables, setDefaultVariables] = useState();
  const [isInstalled, setIsInstalled] = useState(false);

  /** Use Next router to get conversation_id */
  const router = useRouter();
  const { plugin_id } = router.query;

  useEffect(() => {
    if(plugin_id) {
      loadPluginDetails();
    }

    async function loadPluginDetails() {
      /** Load plugin details */
      try {
        let result = await fetch("/api/plugins/" + plugin_id);
        result = await result.json();
        console.log("plugin details:", result);
        if(result.status == 200) {
          setPluginDetails(result.plugin);
        } else {
          console.log("Error retrieving plugin details.");
        }
      } catch(e) {
        console.log("Error retrieving plugin details:", e);
      }

      /** Check if plugin is already installed or not */
      const existingPluginIndex = settings.plugins.findIndex(p => p.plugin_id === plugin_id);
      if (existingPluginIndex !== -1) {
        // Plugin is already installed, assign the default variables
        setIsInstalled(true);
        setDefaultVariables(settings.plugins[existingPluginIndex].variables);
      }
    }
  }, [plugin_id]);

  /** Will start using the plugin by adding it to the settings file */
  async function savePlugin() {
    setStatus(STATUS.LOADING);
    event.preventDefault(); // Prevents the default form submit behavior
    const form = event.target;
    const formData = new FormData(form);
    const data = {};

    // Loop through the FormData entries
    for (let [key, value] of formData.entries()) {
      data[key] = value;
    }

    // Save settings in the orbisdb-settings.json file
    try {
      let response = await fetch('/api/plugins/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          plugin: {
            plugin_id: plugin_id,
            variables: data
          }
        })
      });

      response = await response.json();
      console.log("plugin added:", response);

      if(response.status == 200) {
        setStatus(STATUS.SUCCESS);
        setSettings(response.updatedSettings);
      } else {
        console.log("Error adding plugin.");
      }
    } catch(e) {
      console.log("Error adding plugin:", e);
    }

    console.log('Form data submitted:', data);
  }

  return(
    <>
      <div className="px-16 py-12 md:w-2/3">
        {pluginDetails ?
          <>
            <h1 className="text-3xl font-bold text-slate-900">{pluginDetails.name}</h1>
            <p className="text-slate-600 mt-1 text-base">{pluginDetails.description}</p>
            <div className="flex flex-col space-y-4 mt-4 lg:w-2/5">
              <form onSubmit={savePlugin}>
                {/** If this plugin is requiring variables we show those here */}
                {pluginDetails.variables &&
                  <LoopPluginVariables variables={pluginDetails.variables} defaultVariables={defaultVariables} />
                }
                <div className="flex flex-row justify-center">
                  <Button title={isInstalled ? "Update plugin settings" : "Install plugin"} status={status} successTitle="Plugin added" />
                </div>
              </form>
            </div>

          </>
        :
          <p>Loading...</p>
        }

      </div>
    </>
  )
}

const LoopPluginVariables = ({variables, defaultVariables}) => {
  console.log("defaultVariables:", defaultVariables);
  return variables.map((variable, key) => {
    return (
        <div className="flex flex-col mb-4" key={key}>
          <p className="text-base font-medium text-slate-900">{variable.name}:</p>
          {variable.description &&
            <p className="text-base text-slate-500">{variable.description}</p>
          }
          <input type="text" placeholder={variable.name} name={variable.id} value={defaultVariables ? defaultVariables[variable.id] : "" } className="bg-white px-2 py-1 rounded-md border border-slate-300 text-base text-slate-900 mt-1" />
        </div>
    );
  });
}

import React, { useState, useEffect, useContext } from "react";
import Link from 'next/link';
import { GlobalContext } from "../../contexts/Global";
import { CheckIcon, SettingsIcon, DashIcon, AlertIcon, ExternalLinkIcon } from "../../components/Icons";
import AddModelModal from "../../components/Modals/AddModel";
import Alert from "../../components/Alert";
import PluginSettingsModal from "../../components/Modals/PluginSettings";
import AssignContextModal from "../../components/Modals/AssignContext";
import Modal from "../../components/Modals";
import Button from "../../components/Button";
import InternalNavigation from "../../components/InternalNavigation";
import { useRouter } from 'next/router'
import { STATUS, sleep, findContextById } from "../../utils";
import useContextDetails from "../../hooks/useContextDetails";

export default function PluginDetails() {
  const { settings, setSettings } = useContext(GlobalContext);
  const [addModalVis, setAddModalVis] = useState(false);
  const [pluginDetails, setPluginDetails] = useState();
  const [status, setStatus] = useState(STATUS.ACTIVE);
  const [defaultVariables, setDefaultVariables] = useState();
  const [isInstalled, setIsInstalled] = useState(false);
  const [nav, setNav] = useState("Overview");
  const [installPluginModalVis, setInstallPluginModalVis] = useState(false);
  const [assignContextModalVis, setAssignContextModalVis] = useState(false);
  const [selectedContext, setSelectedContext] = useState(null);

  /** Use Next router to get conversation_id */
  const router = useRouter();
  const { plugin_id } = router.query;

  const existingPluginIndex = settings.plugins.findIndex(p => p.plugin_id === plugin_id);

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
      let response = await fetch('/api/settings/install-plugin', {
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
        setIsInstalled(true);
        await sleep(1500);
        setInstallPluginModalVis(false);
      } else {
        console.log("Error adding plugin.");
      }
    } catch(e) {
      console.log("Error adding plugin:", e);
    }

    console.log('Form data submitted:', data);
  }

  return(
    <div className="flex flex-row space-x-8">
      {/** Plugin content */}
      <div className="px-16 py-12 md:w-2/3">
        {pluginDetails ?
          <>
            <div className="flex flex-row items-center">
              {pluginDetails.logo &&
                <img src={pluginDetails.logo} className="mr-3 h-20 w-20 rounded-md" />
              }
              <h1 className="text-3xl font-bold text-slate-900">{pluginDetails.name}</h1>
            </div>

            {/** Plugin Navigation */}
            <div className="flex justify-start mt-3 mb-3">
              <InternalNavigation items={[
                { label: 'Overview', active: true },
                { label: 'Contexts', active: isInstalled }
              ]} nav={nav} setNav={setNav} />
            </div>

            {/** Show overview tab content */}
            {nav == "Overview" &&
              <p className="text-slate-600 mt-1 text-base">{pluginDetails.full_description ? pluginDetails.full_description : pluginDetails.description}</p>
            }

            {/** Show contexts tab content */}
            {nav == "Contexts" &&
              <>
                {(settings.plugins && settings.plugins[existingPluginIndex]?.contexts?.length > 0) ?
                  <>
                    <p className="text-slate-600 mt-3 text-base">Enable this plugin on your contexts to start using it:</p>
                    <div className="flex flex-row flex-wrap mt-2 items-start">
                      {settings.plugins[existingPluginIndex].contexts?.map((context, index) => (
                        <OneContext context={context} key={index} setSelectedContext={setSelectedContext} pluginDetails={pluginDetails} />
                      ))}
                    </div>
                  </>
                :
                  <Alert title="You haven't assigned this plugin to a context yet." />
                }

                <div className="flex w-full justify-center mt-4">
                  <Button type="secondary" title="Assign to a new context" onClick={() => setAssignContextModalVis(true)}/>
                </div>
              </>
            }

            {/** Show settings tab content */}
            {nav == "Settings" &&
              <div className="flex flex-col space-y-4 mt-4 lg:w-2/5">
                <form onSubmit={savePlugin}>
                  {/** If this plugin is requiring variables we show those here */}
                  {pluginDetails.variables &&
                    <LoopPluginVariables variables={pluginDetails.variables} defaultVariables={defaultVariables} />
                  }
                  <div className="flex flex-row justify-center">
                    <Button title="Save" status={status} successTitle="Saved" />
                  </div>
                </form>
              </div>
            }
          </>
        :
          <p>Loading...</p>
        }

      </div>

      {/** Plugin right-side */}
      {pluginDetails &&
        <div className="flex flex-col py-12 md:w-1/3 pr-16">
          {/** Install block */}
          <div className="rounded-md bg-white border border-slate-200 p-6 py-5 w-full">
            <h2 className="font-medium text-lg">Installation</h2>
            <p className="text-slate-500 text-base">Install this plugin to start using it on your contexts.</p>

            <p className="text-base font-medium mt-3 mb-0.5">Hooks used:</p>
            <div className="flex flex-row space-x-2">
              {pluginDetails.hooks && pluginDetails.hooks.map((hook, index) => (
                <div className="bg-slate-100 rounded-full px-3 py-1 text-xs font-medium text-slate-800" key={index}>
                  {hook}
                </div>
              ))}
            </div>

            {/** Main install button */}
            <div className="flex flex-row mt-4 justify-center">
              {isInstalled ?
                <div className="flex flex-col space-y-2">
                  <div className="bg-green-500 text-white text-sm px-2.5 py-1.5 rounded-md font-medium pointer flex flex-row items-center justify-center space-x-1"><CheckIcon /> <span>Plugin installed</span></div>
                  <div className="text-slate-900 hover:underline text-sm cursor-pointer font-medium" onClick={() => setInstallPluginModalVis(true)}>Update plugin setings</div>
                </div>
              :
                <Button title={isInstalled ? "Update plugin settings" : "Install plugin"} status={status} successTitle="Plugin added" onClick={() => setInstallPluginModalVis(true)} />
              }

            </div>
          </div>
        </div>
      }

      {/** Modals */}
      {installPluginModalVis &&
        <PluginSettingsModal
          hide={() => setInstallPluginModalVis(false)}
          savePlugin={savePlugin}
          status={status}
          pluginDetails={pluginDetails}
          defaultVariables={defaultVariables} />
      }

      {/** Modal to assign a plugin to a context */}
      {assignContextModalVis &&
        <AssignContextModal hide={() => setAssignContextModalVis(false)} plugin_id={plugin_id} />
      }

      {/** Modal to assign a plugin to a context */}
      {selectedContext != null &&
        <AssignContextModal hide={() => setSelectedContext(null)} selectedContext={selectedContext} plugin_id={plugin_id} />
      }
    </div>
  )
}


const OneContext = ({context, setSelectedContext, pluginDetails}) => {
  const { settings } = useContext(GlobalContext);

  const getContextName = (id) => {
    let details = findContextById(settings.contexts, id);
    return details?.name;
  }
  const getContextLogo = (id) => {
    let details = findContextById(settings.contexts, id);
    return details?.logo;
  }

  return(
    <div className="rounded-md bg-white border border-slate-200 flex flex-col overflow-hidden mb-3 mr-3 min-w-[170px] max-w-[350px]">
      {/** Context details */}
      <div className="flex flex-row px-4 py-3 items-center space-x-1.5">
        {context.path.map((context_id, index) => {
          const { name, logo } = useContextDetails(context_id);
          return (
            <>
              <div className="flex items-center">
                {/** Display context logo if any */}
                {logo &&
                  <img
                    src={logo}
                    alt={name}
                    className="h-5 w-5 flex-shrink-0 mr-1.5 rounded-full" />
                }
                <span className="text-base font-normal block truncate">{name}</span>
              </div>
              {context_id != context.context &&
                <DashIcon />
              }
            </>
          );
        })}
      </div>

      {/** Display context variables if any */}
      {context.variables &&
        <div className="flex flex-col px-4 text-sm border-t border-slate-100 py-2 text-slate-600 space-y-1">
          {Object.entries(context.variables).map(([key, value]) => (
            <div className="font-mono text-xxs truncate" key={key}>
              <span className="font-bold text-slate-900">{key}:</span> <span className="truncate">{value}</span>
            </div>
          ))}
        </div>
      }

      {/** Display active routes if any */}
      
      {pluginDetails.routes &&
        <div className="flex flex-row bg-[#FBFBFB] text-[#989494] hover:text-[#807878] text-sm cursor-pointer border-t border-slate-200 space-x-1 px-3 py-1.5 items-center justify-center" onClick={() => setSelectedContext(context)}>
          <div className="mr-1 font-medium">Routes:</div>
          <>
            {pluginDetails.routes.map((route, index) => (
              <Link href={"/api/plugins/" + pluginDetails.id + "/" + context.context + "/" + route} target="_blank" className="bg-white border border-slate-200 hover:border-[#4483FD]  rounded-md px-3 py-2 text-xs font-medium text-slate-800 space-x-1 flex flex-row items-center" key={index}>
                <ExternalLinkIcon />
                <span className="font-mono">{route}</span>
              </Link>
            ))}
          </>
        </div>
      }
      

      {/** Configure CTA */}
      <div className="flex flex-row bg-[#FBFBFB] text-[#989494] hover:text-[#807878] cursor-pointer border-t border-slate-200 space-x-1 px-3 py-1.5 items-center justify-center" onClick={() => setSelectedContext(context)}>
        <SettingsIcon />
        <span className="text-sm font-medium">Configure</span>
      </div>
    </div>
  )
}

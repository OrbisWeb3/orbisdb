import React, { useState, useEffect, useContext } from "react";
import Modal from "../Modals";
import Button from "../Button";

export default function PluginSettingsModal({pluginDetails, defaultVariables, hide, savePlugin, status}) {
  return(
    <Modal hide={hide} title="Plugin settings" description="Those private settings are required for the plugin to work and will never be exposed to external actors.">
      <form onSubmit={savePlugin}>
        {/** If this plugin is requiring variables we show those here */}
        {pluginDetails.variables &&
          <LoopPluginVariables variables={pluginDetails.variables} defaultVariables={defaultVariables} />
        }
        <div className="flex flex-row justify-center">
          <Button title="Save" status={status} successTitle="Saved" />
        </div>
      </form>
    </Modal>
  )
}


const LoopPluginVariables = ({variables, defaultVariables}) => {
  return variables.map((variable, key) => {
    return (
        <PluginVariable variable={variable} defaultVariables={defaultVariables} key={key} />
    );
  });
}

const PluginVariable = ({variable, defaultVariables}) => {
  const [val, setVal] = useState(defaultVariables ? defaultVariables[variable.id] : "");
  return(
    <div className="flex flex-col mb-4">
      <p className="text-base font-medium text-slate-900">{variable.name}:</p>
      {variable.description &&
        <p className="text-base text-slate-500">{variable.description}</p>
      }
      <input type="text" placeholder={variable.name} name={variable.id} value={val} onChange={(e) => setVal(e.target.value)} className="bg-white px-2 py-1 rounded-md border border-slate-300 text-base text-slate-900 mt-1" />
    </div>
  )
}

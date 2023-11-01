import React, { useState, useEffect, useContext } from "react";
import Modal from "../Modals";
import LoopPluginVariables from "../PluginVariables";
import Button from "../Button";

export default function PluginSettingsModal({pluginDetails, defaultVariables, hide, savePlugin, status}) {
  return(
    <Modal hide={hide} title="Plugin settings" description="Those private settings are required for the plugin to work and will never be exposed to external actors.">
      <form onSubmit={savePlugin}>
        {/** If this plugin is requiring variables we show those here */}
        {pluginDetails.variables &&
          <LoopPluginVariables variables={pluginDetails.variables} defaultVariables={defaultVariables} per_context={false} />
        }
        <div className="flex flex-row justify-center">
          <Button title="Save" status={status} successTitle="Saved" />
        </div>
      </form>
    </Modal>
  )
}

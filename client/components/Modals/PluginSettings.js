import React, { useState, useEffect, useContext } from "react";
import Modal from "../Modals";
import LoopPluginVariables from "../PluginVariables";
import Button from "../Button";

export default function PluginSettingsModal({
  pluginDetails,
  variableValues,
  defaultVariables,
  hide,
  savePlugin,
  status,
  handleVariableChange,
}) {
  return (
    <Modal
      hide={hide}
      title="Plugin settings"
      description="Those private settings are required for the plugin to work and will never be exposed to external actors."
      style={{ overflowY: "scroll", maxHeight: "90%" }}
    >
      <form onSubmit={savePlugin}>
        {/** If this plugin is requiring variables we show those here */}
        {pluginDetails.variables && (
          <LoopPluginVariables
            variables={pluginDetails.variables}
            variableValues={variableValues}
            handleVariableChange={handleVariableChange}
            defaultVariables={defaultVariables}
            per_context={false}
          />
        )}
        <div className="flex flex-row justify-center">
          <Button
            title={defaultVariables ? "Save" : "Save"}
            status={status}
            successTitle="Saved"
          />
        </div>
      </form>
    </Modal>
  );
}

import React, { useState, useEffect, useContext } from "react";
import AceEditor from "react-ace";
import "ace-builds/src-min-noconflict/mode-mysql";
import "ace-builds/src-noconflict/theme-sqlserver";
import "ace-builds/src-min-noconflict/ext-language_tools";
import ModelPicker from "./ModelPicker";

export default function LoopPluginVariables({
  variables,
  variableValues,
  handleVariableChange,
  per_context,
}) {
  return variables?.map((variable, key) => {
    return (
      <PluginVariable
        variable={variable}
        per_context={per_context}
        allVariables={variables}
        variableValues={variableValues}
        handleVariableChange={handleVariableChange}
        key={key}
      />
    );
  });
}

const PluginVariable = ({
  variable,
  per_context,
  allVariables,
  variableValues,
  handleVariableChange,
}) => {
  /** Don't display the variable if it's a contextual variable */
  if (per_context == true) {
    if (!variable.per_context) {
      return null;
    }
  } else {
    if (variable.per_context) {
      return null;
    }
  }

  /** If variable has conditions, let's check if they are met before displaying it */
  if (variable.conditions) {
    let conditionsMet = true;
    for (let condition of variable.conditions) {
      if (!variableValues) {
        conditionsMet = false;
        break;
      } else if (variableValues[condition.id] !== condition.value) {
        conditionsMet = false;
        break;
      }
    }
    if (!conditionsMet) {
      return null; // Do not render the input if conditions are not met
    }
  }

  /** Return details variable */
  return (
    <div className="flex flex-col mb-4">
      <p className="text-base font-medium text-slate-900">{variable.name}:</p>
      {variable.description && (
        <p className="text-sm text-slate-500">{variable.description}</p>
      )}
      <VariableInput
        variable={variable}
        val={variableValues ? variableValues[variable.id] : ""}
        handleVariableChange={handleVariableChange}
      />
    </div>
  );
};

const VariableInput = ({ variable, val, handleVariableChange }) => {
  function setVal(value) {
    handleVariableChange(variable.id, value);
  }

  let input = (
    <input
      type="text"
      placeholder={variable.name}
      name={variable.id}
      value={val}
      onChange={(e) => setVal(e.target.value)}
      className={`bg-white px-2 py-1 rounded-md border border-slate-300 text-base text-slate-900 mt-1 ${variable.private && "private-input"}`}
    />
  );

  switch (variable.type) {
    case "model":
      input = (
        <>
          <ModelPicker value={val} setValue={setVal} />
        </>
      );
      break;
    case "textarea":
      input = (
        <textarea
          placeholder={variable.name}
          name={variable.id}
          value={val}
          onChange={(e) => setVal(e.target.value)}
          className={`bg-white px-2 py-1 rounded-md border border-slate-300 text-base text-slate-900 mt-1 ${variable.private && "private-input"}`}
        />
      );
      break;
    case "array":
      input = (
        <textarea
          placeholder={variable.name}
          name={variable.id}
          value={val}
          onChange={(e) => setVal(e.target.value)}
          className={`bg-white px-2 py-1 rounded-md border border-slate-300 text-base text-slate-900 mt-1 ${variable.private && "private-input"}`}
        />
      );
      break;
    case "object":
      input = (
        <textarea
          placeholder={variable.name}
          name={variable.id}
          value={val}
          onChange={(e) => setVal(e.target.value)}
          className={`bg-white px-2 py-1 rounded-md border border-slate-300 text-base text-slate-900 mt-1 ${variable.private && "private-input"}`}
        />
      );
      break;
    case "query":
      input = (
        <div className="sql_editor bg-white overflow-hidden rounded-md border border-slate-300 text-base text-slate-900 mt-1">
          <AceEditor.default
            id="editor"
            aria-label="editor"
            mode="mysql"
            theme="sqlserver"
            name={variable.id}
            width="100%"
            fontSize={13}
            minLines={8}
            maxLines={100}
            showPrintMargin={false}
            showGutter
            placeholder="Write your query here..."
            editorProps={{ $blockScrolling: true }}
            setOptions={{
              enableBasicAutocompletion: true,
              enableLiveAutocompletion: true,
              enableSnippets: true,
            }}
            value={val}
            onChange={(value) => setVal(value)}
            showLineNumbers
          />
        </div>
      );
      break;
    case "select":
      input = (
        <select
          name={variable.id}
          value={val}
          onChange={(e) => setVal(e.target.value)}
          className={`bg-white px-2 py-1 rounded-md border border-slate-300 text-base text-slate-900 mt-1 ${variable.private && "private-input"}`}
        >
          <option value="" disabled>
            Select option
          </option>
          {variable.options.map((option, index) => (
            <option key={index} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      );
      break;
  }
  return input;
};

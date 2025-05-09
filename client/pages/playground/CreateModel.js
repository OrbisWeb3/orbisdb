import { CodeEditor, Instructions } from ".";
import React, { useState, useEffect } from "react";
import { sleep } from "../../utils";
import Button from "../../components/Button";

/** Step 3.1: Getting users to create their own model */
const CreateModel = ({ setModelId, setModelDefinition, setStep, orbisdb }) => {
  const [status, setStatus] = useState(0);
  const [accountRelation, setAccountRelation] = useState("list");
  const [modelTitle, setModelTitle] = useState("MyCustomModel");
  const [inputGroups, setInputGroups] = useState([
    { id: 1, textValue: "", selectValue: "" },
  ]);
  const [modelDemoDefinition, setModelDemoDefinition] = useState(``);

  let createModelCode = `const createModel = async () => {
        const modelDefinition = ${modelDemoDefinition};
        
        let result = await orbisdb.ceramic.createModel(modelDefinition);
        console.log("Model ID is:", result.id);
    };`;

  useEffect(() => {
    updateModelDefintion(modelTitle, inputGroups);
  }, [modelTitle, inputGroups, accountRelation]);

  function updateModelDefintion(title, fields) {
    // Dynamically build the properties object from inputGroups
    const properties = fields.reduce((acc, group) => {
      if (group.textValue && group.selectValue) {
        if (group.selectValue === "did") {
          acc[group.textValue] = { $ref: "#/$defs/DID" };
        } else if (group.selectValue === "datetime") {
          acc[group.textValue] = { $ref: "#/$defs/DateTime" };
        } else {
          acc[group.textValue] = { type: group.selectValue };
        }
      }
      return acc;
    }, {});

    // Check if DID or DateTime types are used
    const usesDID = fields.some((group) => group.selectValue === "did");
    const usesDateTime = fields.some(
      (group) => group.selectValue === "datetime"
    );

    // Build the $defs object
    const $defs = {};
    if (usesDID) {
      $defs.DID = {
        type: "string",
        title: "DID",
        pattern:
          "^did:[a-zA-Z0-9.!#$%&'*+\\/=?^_`{|}~-]+:[a-zA-Z0-9.!#$%&'*+\\/=?^_`{|}~-]*:?[a-zA-Z0-9.!#$%&'*+\\/=?^_`{|}~-]*:?[a-zA-Z0-9.!#$%&'*+\\/=?^_`{|}~-]*$",
        maxLength: 100,
      };
    }
    if (usesDateTime) {
      $defs.DateTime = {
        type: "string",
        title: "DateTime",
        format: "date-time",
        maxLength: 100,
      };
    }

    // Generate the JSON schema string
    const schemaString = JSON.stringify(
      {
        name: title,
        version: "2.0",
        interface: false,
        immutableFields: [],
        implements: [],
        accountRelation: {
          type: accountRelation,
        },
        schema: {
          type: "object",
          $defs: usesDID || usesDateTime ? $defs : undefined,
          $schema: "https://json-schema.org/draft/2020-12/schema",
          properties: {
            ...properties,
          },
          additionalProperties: false,
        },
      },
      null,
      2
    );

    // Update the state or whatever is necessary with the new schema
    setModelDemoDefinition(schemaString);
  }

  const createModel = async () => {
    if (inputGroups && inputGroups.length > 0) {
      try {
        setStatus(1);
        console.log("orbisdb.ceramic:", orbisdb.ceramic);
        console.log("orbisdb.session:", orbisdb.session);

        let model_stream = await orbisdb.ceramic.createModel(
          JSON.parse(modelDemoDefinition)
        );
        console.log("model_stream:", model_stream);

        let model_id = model_stream?.id?.toString();
        console.log("model_stream:", model_id);
        setModelId(model_id);
        setModelDefinition(JSON.parse(modelDemoDefinition));
        setStatus(2);
        await sleep(2000);
        setStep(4.1);
      } catch (e) {
        console.log("Error creating model:", e);
        setStatus(3);
        await sleep(3000);
        setStatus(0);
      }
    } else {
      alert("You must assign properties to your model first.");
    }
  };

  return (
    <>
      {/** Instructions */}
      <div className="flex w-full md:w-5/12 pb-6 md:pb-0 items-center flex-col">
        {/** Instructions */}
        <Instructions
          title="Step 3:"
          description={
            <>
              Now you can create your own data model which will be used to
              structure your database.
            </>
          }
        />

        <div className="flex flex-col space-y-2 mt-2 pr-2">
          {/** Model title */}
          <div className="flex flex-col items-start mb-2">
            <div className="text-slate-600 text-sm mb-1">Model title:</div>
            <input
              type="text"
              placeholder="Your model title"
              value={modelTitle}
              onChange={(e) => setModelTitle(e.target.value)}
              className="bg-white border border-slate-200 rounded-md shadow-sm px-3 py-1.5 text-sm font-medium text-slate-900 mr-2 w-full"
            />
          </div>

          {/** Model account relation */}
          <div className="flex flex-col items-start mb-2">
            <div className="text-slate-600 text-sm mb-1">Account relation:</div>
            <select
              placeholder="Account relation"
              value={accountRelation}
              onChange={(e) => setAccountRelation(e.target.value)}
              className="bg-white border border-slate-200 rounded-md shadow-sm px-3 py-1.5 text-sm font-medium text-slate-900"
            >
              <option value="list">List</option>
              <option value="single">Single</option>
              <option value="set">Set</option>
            </select>
          </div>

          {/** Dynamic fields added by the user */}
          <div className="text-slate-600 text-sm mb-1">Model properties:</div>
          <ModelFieldsInputGroups
            inputGroups={inputGroups}
            setInputGroups={setInputGroups}
          />
        </div>

        <div className="flex flex-col mt-6 justify-center items-center space-y-4 w-full">
          <div className="flex w-1/3 border-b border-slate-200"></div>
          <Button
            title="Save"
            onClick={() => createModel()}
            status={status}
            successTitle="Model created"
          />
        </div>
      </div>

      {/** Code */}
      <CodeEditor code={createModelCode} className="w-full md:w-7/12" />
    </>
  );
};

function ModelFieldsInputGroups({ inputGroups, setInputGroups }) {
  const addInputGroup = () => {
    const newInputGroup = {
      id: inputGroups.length + 1,
      textValue: "",
      selectValue: "",
    };
    setInputGroups([...inputGroups, newInputGroup]);
  };

  const handleTextChange = (index, value) => {
    const updatedInputGroups = inputGroups.map((group, i) =>
      i === index ? { ...group, textValue: value } : group
    );
    setInputGroups(updatedInputGroups);
  };

  const handleSelectChange = (index, value) => {
    const updatedInputGroups = inputGroups.map((group, i) =>
      i === index ? { ...group, selectValue: value } : group
    );
    setInputGroups(updatedInputGroups);
  };

  return (
    <div className="items-center flex flex-col w-full space-y-2">
      {inputGroups.map((group, index) => (
        <div key={group.id} className="flex flex-row space-x-1 w-full">
          <input
            type="text"
            placeholder="Field name"
            value={group.textValue}
            onChange={(e) => handleTextChange(index, e.target.value)}
            className="flex-1 bg-white border border-slate-200 rounded-md shadow-sm px-3 py-1.5 text-sm font-medium text-slate-900 mr-2"
          />
          <select
            placeholder="Field type"
            value={group.selectValue}
            onChange={(e) => handleSelectChange(index, e.target.value)}
            className="bg-white border border-slate-200 rounded-md shadow-sm px-3 py-1.5 text-sm font-medium text-slate-900 w-full"
          >
            <option value="">Field type</option>
            <option value="string">String</option>
            <option value="number">Number</option>
            <option value="boolean">Boolean</option>
            <option value="object">Object</option>
            <option value="array">Array</option>
            <option value="did">DID</option>
            <option value="datetime">DateTime</option>
          </select>
        </div>
      ))}
      <button
        onClick={addInputGroup}
        className="text-sm font-medium text-[#4483FD] hover:underline"
      >
        + Add another field
      </button>
    </div>
  );
}

export default CreateModel;

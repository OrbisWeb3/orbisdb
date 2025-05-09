import React, { useState, useEffect, useContext } from "react";
import { GlobalContext, useGlobal } from "../../contexts/Global";
import { CheckIcon, CloseIcon, QuestionMarkIcon } from "../../components/Icons";
import Button from "../../components/Button";
import { sleep } from "../../utils";
import { CodeEditor } from "../playground";
import Alert from "../../components/Alert";

export default function Models() {
  const [modelId, setModelId] = useState();
  const [addModalVis, setAddModalVis] = useState(false);

  return (
    <>
      <div className="playground flex flex-row space-x-8 px-16 py-12">
        {/** Context details */}
        <div className="flex md:w-full flex-col">
          <h1 className="text-3xl font-bold text-slate-900">Create model</h1>
          <p className="text-slate-600 mt-1 text-base">
            Here is a simple tool to create Ceramic models to structure your
            data. Simply add all of the fields you want to use and click on
            "Create model".
          </p>
          <div className="flex flex-col mt-4 space-y-1.5">
            <CreateModel
              showBack={false}
              modelId={modelId}
              setModelId={setModelId}
            />
          </div>
        </div>
      </div>
    </>
  );
}

/** Will loop all of the models saved in the settings and display them */
const LoopModels = () => {
  const { settings } = useContext(GlobalContext);

  if (!settings) {
    return (
      <div className="text-slate-500 text-center text-base">
        <em>Loading...</em>
      </div>
    );
  } else {
    return settings?.models?.map((model, key) => {
      return (
        <div className="flex flex-row items-center space-x-2">
          {/** Indexing hasn't been finalized for this model */}
          {(model.status == 0 || !model.status) && <CloseIcon />}

          {/** Model hasn't started indexing  */}
          {model.status == 1 && <QuestionMarkIcon />}

          {/** Model is currently being indexed */}
          {model.status == 2 && <CheckIcon />}

          <div className="text-[#4483FD] font-medium text-base">
            {model.name}
          </div>
          <div className="rounded-md bg-white border border-slate-200 px-3 py-1 text-sm font-medium">
            140
          </div>
        </div>
      );
    });
  }
};

/** Step 3.1: Getting users to create their own model */
const CreateModel = ({ modelId, setModelId, setModelDefinition, setStep }) => {
  const { orbisdb, sessionJwt } = useGlobal();
  const [status, setStatus] = useState(0);
  const [accountRelation, setAccountRelation] = useState("list");
  const [selectedField, setSelectedField] = useState("");
  const [selectedFieldPicked, setSelectedFieldPicked] = useState(false);
  const [modelTitle, setModelTitle] = useState("MyCustomModel");
  const [inputGroups, setInputGroups] = useState([
    { id: 1, textValue: "", selectValue: "string" },
  ]);
  const [modelDemoDefinition, setModelDemoDefinition] = useState(``);

  let createModelCode = `const createModel = async () => {
  const modelDefinition = ${modelDemoDefinition};
    
  let result = await orbisdb.ceramic.createModel(modelDefinition);
};`;

  useEffect(() => {
    if (inputGroups.length > 0 && !selectedFieldPicked) {
      setSelectedField(inputGroups[0].textValue);
    }
  }, [inputGroups]);

  useEffect(() => {
    updateModelDefintion(modelTitle, inputGroups);
  }, [modelTitle, inputGroups, accountRelation, selectedField]);

  function selectAccountRelationField(field) {
    setSelectedField(field);
    setSelectedFieldPicked(true);
  }

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
          ...(accountRelation === "set" && {
            fields: [selectedField],
          }),
        },
        schema: {
          type: "object",
          $defs: usesDID || usesDateTime ? $defs : undefined,
          $schema: "https://json-schema.org/draft/2020-12/schema",
          properties: {
            ...properties,
          },
          ...(accountRelation === "set" && {
            required: [selectedField],
          }),
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

        let _content = {
          ...JSON.parse(modelDemoDefinition),
          accountRelation: {
            type: accountRelation,
            ...(accountRelation === "set" && {
              fields: [selectedField],
            }),
          },
          schema: {
            ...JSON.parse(modelDemoDefinition).schema,
            ...(accountRelation === "set" && {
              required: [selectedField],
            }),
          },
        };

        console.log("definition:", _content);

        let model_stream = await orbisdb.ceramic.createModel(_content);
        console.log("model_stream:", model_stream);

        let model_id = model_stream?.id?.toString();
        console.log("model_stream:", model_id);
        setModelId(model_id);
        setStatus(2);

        let rawResponse = await fetch("/api/db/index/model", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${sessionJwt}`,
          },
          body: JSON.stringify({ model_id: model_id }),
        });
        const result = await rawResponse.json();
        console.log("data from forced index model:", result);
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
    <div className="flex flex-row space-x-2 w-full">
      {/** Instructions */}
      <div className="flex w-1/2 pb-6 md:pb-0 flex-col">
        <div className="flex flex-col space-y-2 mt-2 pr-2">
          {/** Model account relation */}
          <div className="flex flex-col items-start mb-2">
            <div className="text-slate-600 text-sm mb-1 font-medium">
              Model title:
            </div>
            <input
              type="text"
              placeholder="Your model title"
              value={modelTitle}
              onChange={(e) => setModelTitle(e.target.value)}
              className="bg-white border border-slate-200 rounded-md shadow-sm px-3 py-1.5 text-sm font-medium text-slate-900 mr-2 w-full"
            />

            <div className="text-slate-600 text-sm mb-1 font-medium mt-2.5">
              Account relation:
            </div>
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

            {accountRelation === "set" && (
              <div className="flex flex-col items-start mb-2">
                <div className="text-slate-600 text-sm mb-1 mt-2.5 font-medium">
                  Field:
                </div>
                {inputGroups.some((group) => group.textValue !== "") ? (
                  <select
                    value={selectedField}
                    onChange={(e) => selectAccountRelationField(e.target.value)}
                    className="bg-white border border-slate-200 rounded-md shadow-sm px-3 py-1.5 text-sm font-medium text-slate-900"
                  >
                    {inputGroups.map((group) => (
                      <option key={group.id} value={group.textValue}>
                        {group.textValue}
                      </option>
                    ))}
                  </select>
                ) : (
                  <Alert
                    className="text-xs"
                    title="No properties created yet. Please create a property first."
                  />
                )}
              </div>
            )}
          </div>

          {/** Dynamic fields added by the user */}
          <div className="flex flex-col py-3 px-4 bg-white border border-dashed border-slate-200 rounded-md">
            <div className="text-slate-600 text-sm mb-1 font-medium">
              Model properties:
            </div>
            <ModelFieldsInputGroups
              inputGroups={inputGroups}
              setInputGroups={setInputGroups}
            />
          </div>
        </div>

        <div className="flex flex-col mt-6 justify-center items-center space-y-4 w-full">
          <Button
            title="Create Model"
            onClick={() => createModel()}
            status={status}
            successTitle="Model created"
          />

          {/** Show model id created once finalized */}
          {modelId && (
            <p className="text-base font-medium">
              Model ID: <span className="font-normal">{modelId}</span>
            </p>
          )}
        </div>
      </div>

      {/** Code */}
      <CodeEditor
        code={createModelCode}
        className="text-white w-1/2 md:w-7/12"
      />
    </div>
  );
};

function ModelFieldsInputGroups({ inputGroups, setInputGroups }) {
  const addInputGroup = () => {
    const newInputGroup = {
      id: inputGroups.length + 1,
      textValue: "",
      selectValue: "string",
    };
    setInputGroups([...inputGroups, newInputGroup]);
  };

  const handleTextChange = (index, value) => {
    // Define a regular expression to allow only alphanumeric characters
    const regex = /^[a-zA-Z0-9_]*$/;

    // Check if the value matches the regex
    if (regex.test(value)) {
      const updatedInputGroups = inputGroups.map((group, i) =>
        i === index ? { ...group, textValue: value } : group
      );
      setInputGroups(updatedInputGroups);
    } else {
      // Optionally, provide feedback or handle the invalid input scenario
      console.error("Invalid input: Only alphanumeric characters are allowed.");
    }
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
            className="bg-white border border-slate-200 rounded-md shadow-sm px-3 py-1.5 text-sm font-medium text-slate-900"
          >
            <option value="">Field type</option>
            <option value="string">String</option>
            <option value="number">Number</option>
            <option value="boolean">Boolean</option>
            {/**<option value="object">Object</option>
                <option value="array">Array</option>*/}
            <option value="did">DID</option>
            <option value="datetime">DateTime</option>
          </select>
        </div>
      ))}
      <button
        onClick={addInputGroup}
        className="text-sm font-medium text-[#4483FD] hover:underline"
      >
        + Add another property
      </button>
    </div>
  );
}

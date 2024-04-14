import React, { useState, useEffect, useContext } from "react";
import Button from "./Button";
import { useGlobal } from "../contexts/Global";
import { sleep } from "../utils";

export default function ModelPicker({ value, setValue }) {
  const [step, setStep] = useState(value ? 1.0 : 0);

  return (
    <div
      className={`flex w-full items-center flex-col border rounded-md mt-2 ${value ? "bg-emerald-50 border-emerald-200" : "bg-slate-50 border-slate-200 border-dashed"}`}
    >
      <StepsModel
        step={step}
        setStep={setStep}
        modelId={value}
        setModelId={setValue}
      />
    </div>
  );
}

const StepsModel = ({ step, setStep, modelId, setModelId }) => {
  switch (step) {
    // Pick new or existing model
    case 0:
      return (
        <div className="flex flex-col space-y-2 p-3">
          <div
            className="rounded-md bg-white border border-slate-200 p-3 cursor-pointer"
            onClick={() => setStep(1.0)}
          >
            <p className="text-sm font-medium text-slate-900">
              Use existing model
            </p>
            <p className="text-sm text-slate-600">
              Will use an existing model, you will only have to share the model
              ID you want to use.
            </p>
          </div>

          <div
            className="rounded-md bg-white border border-slate-200 hover:border-slate-300 p-3 cursor-pointer"
            onClick={() => setStep(1.1)}
          >
            <p className="text-sm font-medium text-slate-900">Create model</p>
            <p className="text-sm text-slate-600">
              Will create a new model on the Ceramic network based on your
              definition.
            </p>
          </div>
        </div>
      );
    case 1.0:
      return (
        <ModelSelect
          modelId={modelId}
          setModelId={setModelId}
          back={() => setStep(0)}
        />
      );
    case 1.1:
      return <ModelBuilder setModelId={setModelId} back={() => setStep(0)} />;
    default:
      return null;
  }
};

const ModelSelect = ({ modelId, setModelId, back }) => {
  return (
    <div className="flex flex-col items-start mb-2 w-full p-3">
      <BackButton back={back} />
      <div className="text-slate-600 text-sm ml-1 font-medium">Model ID:</div>
      <input
        type="text"
        placeholder="Paste the model ID you want to use"
        value={modelId}
        onChange={(e) => setModelId(e.target.value)}
        className="bg-white border border-slate-200 rounded-md shadow-sm px-3 py-1.5 text-sm font-medium text-slate-900 mr-2 w-full"
      />
    </div>
  );
};

export const ModelBuilder = ({
  setModelId,
  back,
  showBack = true,
  createColor = "secondary",
}) => {
  const { orbisdb } = useGlobal();
  const [modelTitle, setModelTitle] = useState(``);
  const [modelDemoDefinition, setModelDemoDefinition] = useState(``);
  const [status, setStatus] = useState(0);
  const [inputGroups, setInputGroups] = useState([
    { id: 1, textValue: "", selectValue: "" },
  ]);

  useEffect(() => {
    updateModelDefintion(modelTitle, inputGroups);
  }, [modelTitle, inputGroups]);

  function updateModelDefintion(title, fields) {
    // Dynamically build the properties object from inputGroups
    const properties = fields.reduce((acc, group) => {
      if (group.textValue && group.selectValue) {
        acc[group.textValue] = { type: group.selectValue };
      }
      return acc;
    }, {});

    // Generate the JSON schema string
    const schemaString = JSON.stringify(
      {
        name: title,
        version: "1.0",
        accountRelation: {
          type: "list",
        },
        schema: {
          type: "object",
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

  const createModel = async (event) => {
    event.preventDefault();
    if (inputGroups && inputGroups.length > 0) {
      try {
        setStatus(1);
        let model_stream = await orbisdb.ceramic.createModel(
          JSON.parse(modelDemoDefinition)
        );
        let model_id = model_stream?.id?.toString();
        console.log("model_stream:", model_id);
        setModelId(model_id);
        setStatus(2);
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
      <div className="flex flex-col mt-2 pr-2">
        {showBack && <BackButton back={back} />}

        {/** Model title */}
        <div className="flex flex-col items-start mb-2">
          <div className="text-slate-600 font-medium text-sm mb-1">
            Model title:
          </div>
          <input
            type="text"
            placeholder="Your model title"
            value={modelTitle}
            onChange={(e) => setModelTitle(e.target.value)}
            className="bg-white border border-slate-200 rounded-md shadow-sm px-3 py-1.5 text-sm font-medium text-slate-900 mr-2 w-full"
          />
        </div>

        {/** Dynamic fields added by the user */}
        <div className="text-slate-600 font-medium text-sm mb-1 mt-1">
          Model properties:
        </div>
        <ModelFieldsInputGroups
          inputGroups={inputGroups}
          setInputGroups={setInputGroups}
        />
      </div>

      <div className="flex flex-col mt-3 justify-center items-center space-y-3 w-full mb-2">
        <div className="flex w-1/3 border-b border-slate-200"></div>
        <Button
          title="Create model"
          type={createColor}
          onClick={(e) => createModel(e)}
          status={status}
          successTitle="Model created"
        />
      </div>
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
            className="bg-white border border-slate-200 rounded-md shadow-sm px-3 py-1.5 text-sm font-medium text-slate-900"
          >
            <option value="">Type</option>
            <option value="string">String</option>
            <option value="number">Number</option>
            <option value="boolean">Boolean</option>
            <option value="object">Object</option>
            <option value="array">Array</option>
          </select>
        </div>
      ))}
      <div
        onClick={addInputGroup}
        className="text-sm font-medium text-[#4483FD] hover:underline"
      >
        + Add another field
      </div>
    </div>
  );
}

const BackButton = ({ back }) => {
  return (
    <div
      className="flex cursor-pointer space-x-1.5 hover:underline items-center mb-2"
      onClick={back}
    >
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
      <span className="flex text-slate-6900 text-sm ml-1 font-medium">
        Back
      </span>
    </div>
  );
};

import React, { useState, useEffect } from "react";
import { CodeEditor, Instructions } from ".";
import { sleep } from "../../utils";
import Button from "../../components/Button";

/** Step 4.1: Create model instance document */
const CreateModelInstance = ({
  modelId,
  tableName,
  modelDefinition,
  setStep,
  orbisdb,
}) => {
  const [status, setStatus] = useState(0);
  const [contextId, setContextId] = useState("");

  const initialFields = modelDefinition.schema.properties
    ? Object.keys(modelDefinition.schema.properties).map((key) => {
        const type = modelDefinition.schema.properties[key].type;
        let defaultValue = ""; // Default to empty string for basic types

        if (type == "array" || type?.includes("array")) {
          defaultValue = []; // Default to empty array for array types
        } else if (type == "object" || type?.includes("object")) {
          defaultValue = {}; // Default to empty object for object types
        }

        return {
          name: key,
          type: type,
          value: defaultValue,
        };
      })
    : [];

  const [fields, setFields] = useState(initialFields);
  const [propertiesData, setPropertiesData] = useState();

  useEffect(() => {
    let _propertiesData = fields.reduce((obj, field) => {
      obj[field.name] = field.value;
      return obj;
    }, {});

    setPropertiesData(_propertiesData);
  }, [fields]);

  let createStreamCode = `const createStream = async () => {
    /** Build insert statement */
    const insertStatement = orbisdb
      .insert("${modelId}")
      .value(${JSON.stringify(propertiesData, null, 2)})
      .context("${contextId ? contextId : "<CONTEXT_ID>"}")
      .run();
    }`;

  const createStream = async () => {
    if (!(await orbisdb.isUserConnected())) {
      alert("User isn't connected.");
      throw "Not connected";
    }
    setStatus(1);
    const resultInsert = await orbisdb
      .insert(modelId)
      .value(propertiesData)
      .context(contextId)
      .run();

    console.log("createStream() result", resultInsert);
    if (resultInsert.error) {
      setStatus(3);
      await sleep(1000);
      setStatus(0);
    } else {
      setStatus(2);
      await sleep(1000);
      setStep(5);
    }
  };

  return (
    <>
      {/** Instructions */}
      <div className="flex w-full md:w-5/12 pb-6 md:pb-0 items-center flex-col">
        <Instructions
          title="Step 4:"
          description={
            <>
              Now we can create a stream / document following the schema you
              specified.
            </>
          }
        />

        {/** Context ID */}
        <div className="flex flex-col items-start mb-2 w-full pr-2">
          <div className="text-slate-600 text-sm mb-1">Context ID:</div>
          <input
            type="text"
            placeholder="Your context ID"
            value={contextId}
            onChange={(e) => setContextId(e.target.value)}
            className="flex-1 bg-white border border-slate-200 rounded-md shadow-sm px-3 py-1.5 text-sm font-medium text-slate-900 mb-2 w-full"
          />
        </div>

        <div className="flex flex-col items-center space-y-3 w-full pr-2">
          <PropertiesInput fields={fields} setFields={setFields} />
          <Button
            title="Create stream"
            onClick={() => createStream()}
            status={status}
            successTitle="Stream created"
          />
        </div>
      </div>

      {/** Code */}
      <CodeEditor code={createStreamCode} className="w-full md:w-7/12" />
    </>
  );
};

/** Will render each property as an input */
const PropertiesInput = ({ fields, setFields }) => {
  const handleInputChange = (index, value) => {
    const updatedFields = fields.map((field, i) =>
      i === index ? { ...field, value } : field
    );
    console.log("updatedFields", updatedFields);
    setFields(updatedFields);
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const submittedData = fields.reduce((acc, field) => {
      acc[field.name] = field.value;
      return acc;
    }, {});
    console.log("Submitted Data:", submittedData);
    // Process the submitted data as needed
  };

  // Will render correct input field based on the property's type
  function renderInputField(field, index) {
    // TODO: Handle $ref instead of always defaulting to string

    // Handle boolean
    if (field.type == "boolean" || field.type?.includes("boolean")) {
      return (
        <select
          value={field.value}
          onChange={(e) =>
            handleInputChange(index, e.target.value == "true" ? true : false)
          }
          className="bg-white border border-slate-200 w-full rounded-md shadow-sm px-3 py-1.5 text-sm font-medium text-slate-900 mr-2"
        >
          <option value="">Select value</option>
          <option value={true}>True</option>
          <option value={false}>False</option>
        </select>
      );
    }

    // Handle number
    if (field.type == "number" || field.type?.includes("number")) {
      return (
        <input
          type="number"
          value={field.value}
          onChange={(e) => handleInputChange(index, parseFloat(e.target.value))}
          className="bg-white border border-slate-200 w-full rounded-md shadow-sm px-3 py-1.5 text-sm font-medium text-slate-900 mr-2"
          placeholder={"Enter the " + field.name + " value here"}
        />
      );
    }

    // Handle object
    if (field.type == "object" || field.type?.includes("object")) {
      return (
        <span className="text-xxs font-mono">
          Objects are not yet supported in the playground.
        </span>
      );
    }

    // Handle arrays
    if (field.type == "array" || field.type?.includes("array")) {
      return (
        <span className="text-xxs font-mono">
          Arrays are not yet supported in the playground.
        </span>
      );
    }

    // Default render string
    return (
      <input
        type="text"
        value={field.value}
        onChange={(e) => handleInputChange(index, e.target.value)}
        className="bg-white border border-slate-200 w-full rounded-md shadow-sm px-3 py-1.5 text-sm font-medium text-slate-900 mr-2"
        placeholder={"Enter the " + field.name + " value here"}
      />
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2 w-full">
      {fields.map((field, index) => (
        <div key={field.name} className="flex flex-col w-full items-start">
          <div className="text-slate-600 text-sm mb-1">{field.name}:</div>
          {renderInputField(field, index)}
        </div>
      ))}
    </form>
  );
};

export default CreateModelInstance;

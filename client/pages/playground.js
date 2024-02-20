import React, { useState, useEffect, useContext, useRef } from "react";
import AceEditor from "react-ace";
import "ace-builds/src-min-noconflict/mode-javascript";
import "ace-builds/src-noconflict/theme-nord_dark";
import "ace-builds/src-min-noconflict/ext-language_tools";
import { OrbisDB } from "@useorbis/db-sdk";
import { OrbisEVMAuth } from "@useorbis/db-sdk/auth";
import Button from "../components/Button";
import { useGlobal } from "../contexts/Global";

let orbisdb;

export default function Playground() {
    const { settings } = useGlobal();

    useEffect(() => {
        console.log("settings.configuration.ceramic.node:", settings.configuration.ceramic.node);
        if(settings.configuration.ceramic.node) {
            orbisdb = new OrbisDB({
                ceramic: {
                    gateway: settings.configuration.ceramic.node,
                },
                nodes: [
                    {
                        gateway: "http://localhost:7008/",
                        key: "",
                    },
                ],
            });
        }
    }, [settings?.configuration]);

  return (
    <main className={`playground flex min-h-screen flex-col items-center p-6 pt-12 bg-slate-50`}>
      <div className='text-xl text-slate-900 font-medium'>Playground</div>
      <div className='text-base text-slate-500 text-center'>Here is a quick playground to understand how our DB SDK works. It can also be helpful to test your OrbisDB setup.</div>

      {/** Demo container */}
      <div className='bg-white flex items-start justify-center flex-row rounded-md p-6 border border-slate-200 mt-6 w-full lg:w-8/12 shadow-sm'>
        <div className="flex flex-col md:flex-row w-full space-x-0 md:space-x-2 items-start">
          <Demo />
        </div>
      </div>
    </main>
  )
}
let configurationCode = `import { OrbisDB } from "@useorbis/db-sdk";
import { OrbisEVMAuth } from "@useorbis/db-sdk/auth";

const orbisdb = new OrbisDB({
  ceramic: {
    gateway: "<CERAMIC_NODE_URL>",
  },
  nodes: [
    {
      gateway: "<ORBIS_DB_INSTANCE_URL>",
      key: "<YOUR_API_KEY>",
    },
  ],
});`;
let connectCode = `const connect = async () => {
  const auth = new OrbisEVMAuth(window.ethereum);
  const result = await orbisdb.connectUser({ auth });
  console.log(result);
};`;

const Demo = () => {
  const [step, setStep] = useState(0);
  const [modelId, setModelId] = useState("");
  const [tableName, setTableName] = useState("");
  const [modelDefinition, setModelDefinition] = useState({
    "name": "MyCustomModel",
    "schema": {
      "type": "object",
      "$schema": "https://json-schema.org/draft/2020-12/schema",
      "properties": {
        "custom_bool": {
          "type": "boolean"
        }
      },
      "additionalProperties": false
    },
    "version": "1.0",
    "accountRelation": {
      "type": "list"
    }
  });

  switch(step) {
    case 0:
      return(
        <ConfigurationStep setStep={setStep} />
      );
    case 1:
      return(
        <ConnectStep setStep={setStep} />
      );
    case 2:
      return(
        <SetModel setModelId={setModelId} setStep={setStep} />
      );
    case 3.1:
      return(
        <CreateModel setModelId={setModelId} setModelDefinition={setModelDefinition} setStep={setStep} />
      );
    case 3.2:
      return(
        <UseExistingModel modelId={modelId} setModelId={setModelId} setStep={setStep} setModelDefinition={setModelDefinition} />
      );
    case 4.1:
      return(
        <CreateModelInstance modelId={modelId} tableName={tableName} modelDefinition={modelDefinition} setStep={setStep} />
      );
    case 5:
      return(
        <QueryModel modelId={modelId} tableName={tableName} setStep={setStep} />
      );
    default:
      return null;
  }
}

/** Step 0: Configure your OrbisDB object */
const ConfigurationStep = ({setStep}) => {
  const nextStep = async () => {
    setStep(1);
  };

  return(
    <>
      <div className="w-full md:w-5/12 pb-6 md:pb-0">
        {/** Instructions */}
        <Instructions 
          title="Configuration:" 
          description="First of all you will have to import the OrbisDB libraries in your app and configure the OrbisDB and Ceramic settings." 
          buttons={
            [
              {
                cta: "Next",
                action: () => nextStep()
              }
            ]
          } />
      </div>

      {/** Code */}
      <CodeEditor code={configurationCode} className="w-full md:w-7/12" />
    </>
  )
}

/** Step 1: Getting the users to connect to Ceramic */
const ConnectStep = ({setStep}) => {
  const connect = async () => {
    const auth = new OrbisEVMAuth(window.ethereum);
    /*if (await orbisdb.isUserConnected()) {
      return true;
    }*/
  
    const result = await orbisdb.connectUser({ auth });
    console.log(result);
    setStep(2);
  };

  return(
    <>
      <div className="w-full md:w-5/12 pb-6 md:pb-0">
        {/** Instructions */}
        <Instructions 
          title="Step 1:" 
          description="Now you can connect your wallet." 
          buttons={[
            {
              cta: "Connect",
              action: () => connect()
            }
          ]} />
      </div>
      {/** Code */}
      <CodeEditor code={connectCode} className="w-full md:w-7/12" />
    </>
  )
}


/** Step 2: Getting users to create their own model */
const SetModel = ({setStep}) => {

  const createModel = async () => {
    setStep(3.1);
  };

  const loadExistingModel = () => {
    setStep(3.2);
  }

  return(
    <>
      {/** Instructions */}
      <div className="w-full pb-6 md:pb-0">
        <Instructions 
          title="Step 2:" 
          description={<>Do you want to use an existing model on the network to start with existing data or do you want to create your own?</>} 
          buttons={[
            {
              cta: "Create model",
              action: () => createModel()
            },
            {
              cta: "Load existing model",
              action: () => loadExistingModel()
            }
          ]} />
      </div>
    </>
  )
}

/** Step 3.1: Getting users to create their own model */
const CreateModel = ({setModelId, setModelDefinition, setStep}) => {
  const [status, setStatus] = useState(0);
  const [modelTitle, setModelTitle] = useState("MyCustomModel");
  const [inputGroups, setInputGroups] = useState([
    { id: 1, textValue: '', selectValue: '' }
  ]);
  const [modelDemoDefinition, setModelDemoDefinition] = useState(``);

  let createModelCode = `const createModel = async () => {
    const modelDefinition = ${modelDemoDefinition};
    
    let result = await orbisdb.ceramic.createModel(modelDefinition);
    console.log("Model ID is:", result.id);
  };`;

  useEffect(() => {
    updateModelDefintion(modelTitle, inputGroups)
  }, [modelTitle, inputGroups])

  function updateModelDefintion(title, fields) {
    // Dynamically build the properties object from inputGroups
    const properties = fields.reduce((acc, group) => {
      if (group.textValue && group.selectValue) {
        acc[group.textValue] = { type: group.selectValue };
      }
      return acc;
    }, {});

    // Generate the JSON schema string
    const schemaString = JSON.stringify({
        name: title,
        version: "1.0",
        accountRelation: {
          type: "list"
        },
        schema: {
          type: "object",
          $schema: "https://json-schema.org/draft/2020-12/schema",
          properties: {
            ...properties
          },
          additionalProperties: false
        }
    }, null, 2); // The last two arguments format the JSON for readability

    // Update the state or whatever is necessary with the new schema
    setModelDemoDefinition(schemaString);
  }

  const createModel = async () => {
    if(inputGroups && inputGroups.length > 0) {
      try {
        setStatus(1);
        console.log("orbisdb.ceramic:", orbisdb.ceramic);
        console.log("orbisdb.session:", orbisdb.session);

        let model_stream = await orbisdb.ceramic.createModel(JSON.parse(modelDemoDefinition));
        console.log("model_stream:", model_stream);

        let model_id = model_stream?.id?.toString();
        console.log("model_stream:", model_id)
        setModelId(model_id)
        setModelDefinition(JSON.parse(modelDemoDefinition));
        setStatus(2);
        await sleep(2000);
        setStep(4.1);
      } catch(e) {
        console.log("Error creating model:", e);
        setStatus(3);
        await sleep(3000);
        setStatus(0);
      }
      
    } else {
      alert("You must assign properties to your model first.");
    }
  };

  return(
    <>
    
      {/** Instructions */}
      <div className="flex w-full md:w-5/12 pb-6 md:pb-0 items-center flex-col">
        {/** Instructions */}
        <Instructions 
          title="Step 3:" 
          description={<>Now you can create your own data model which will be used to structure your database.</>}  />


        <div className="flex flex-col space-y-2 mt-2 pr-2">
          {/** Model title */}
          <div className="flex flex-col items-start mb-2">
            <div className="text-slate-600 text-sm mb-1">Model title:</div>
            <input
              type="text"
              placeholder="Your model title"
              value={modelTitle}
              onChange={(e) => setModelTitle(e.target.value)}
              className="bg-white border border-slate-200 rounded-md shadow-sm px-3 py-1.5 text-sm font-medium text-slate-900 mr-2 w-full" />
          </div>

          {/** Dynamic fields added by the user */}
          <div className="text-slate-600 text-sm mb-1">Model properties:</div>
          <ModelFieldsInputGroups inputGroups={inputGroups} setInputGroups={setInputGroups} />
        </div>

        <div className="flex flex-col mt-6 justify-center items-center space-y-4 w-full">
          <div className="flex w-1/3 border-b border-slate-200"></div>
          <Button title="Save" onClick={() => createModel()} status={status} successTitle="Model created" />
        </div>
      </div>

      {/** Code */}
      <CodeEditor code={createModelCode} className="w-full md:w-7/12" />
    </>
  )
}


/** Step 3.2: Getting users to create their own model */
const UseExistingModel = ({modelId, setModelId, setModelDefinition, setStep}) => {
  const [status, setStatus] = useState(0);

  async function loadModel() {
    setStatus(1);
    let modelContent = await orbisdb.ceramic.getModel(modelId);
    if(modelContent) {
      setStatus(2);
      console.log("modelContent:", modelContent);
      setModelDefinition(modelContent.schema);
      await sleep(2000);
      setStep(4.1);
    } else {
      console.log("Error loading model content.");
    }
    
    //setStep(4.2);
  }

  return(
      <div className="flex w-full justify-center items-center flex-col md:flex-row">
        <div className="w-1/2 flex flex-col">
          {/** Instructions */}
          <Instructions 
            title="Step 3:" 
            description={<>Load an existing model to start creating data with it.</>} />

          {/** Model ID */}
          <div className="flex flex-col items-start mt-1">
            <div className="text-slate-600 text-sm mb-1">Model ID:</div>
            <input
              type="text"
              placeholder="Your model's Stream ID"
              value={modelId}
              onChange={(e) => setModelId(e.target.value.trim())}
              className="bg-white border border-slate-200 rounded-md shadow-sm px-3 py-1.5 text-sm font-medium text-slate-900 mr-2 w-full" />
          </div>

          {/** Load model CTA */}
          <div className="flex flex-col mt-2 justify-center items-center space-y-4 w-full">
            <div className="flex w-1/3"></div>
            <Button title="Load" onClick={() => loadModel()} status={status} successTitle="Model loaded" />
          </div>
        </div>
    </div>
  )
}

/** Step 4.1: Create model instance document */
const CreateModelInstance = ({modelId, tableName, modelDefinition, setStep}) => {
  const [status, setStatus] = useState(0);
  const [contextId, setContextId] = useState("");

  const initialFields = modelDefinition.schema.properties
    ? Object.keys(modelDefinition.schema.properties).map(key => ({
        name: key,
        type: modelDefinition.schema.properties[key].type,
        value: ''
      }))
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
    .context("${contextId ? contextId : "<CONTEXT_ID>" }")
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
    if(resultInsert.error) {
      setStatus(3);
      await sleep(1000);
      setStatus(0);
    } else {
      setStatus(2);
      await sleep(1000);
      setStep(5);
    }
    
  };

  return(
    <>
          
      {/** Instructions */}
      <div className="flex w-full md:w-5/12 pb-6 md:pb-0 items-center flex-col">
        <Instructions 
          title="Step 4:" 
          description={<>Now we can create a stream / document following the schema you specified.</>} />

        {/** Context ID */}
        <div className="flex flex-col items-start mb-2 w-full pr-2">
            <div className="text-slate-600 text-sm mb-1">Context ID:</div>
            <input
                type="text"
                placeholder="Your context ID"
                value={contextId}
                onChange={(e) => setContextId(e.target.value)}
                className="flex-1 bg-white border border-slate-200 rounded-md shadow-sm px-3 py-1.5 text-sm font-medium text-slate-900 mb-2 w-full" />
        </div>


        <div className="flex flex-col items-center space-y-3 w-full pr-2">
          <ModelDocumentVariables fields={fields} setFields={setFields} />
          <Button title="Create stream" onClick={() => createStream()} status={status} successTitle="Stream created" />
        </div>
      </div>

      {/** Code */}
      <CodeEditor code={createStreamCode} className="w-full md:w-7/12" />
    </>
  )
}

/** Step 5: Query streams inserted in new model table */
const QueryModel = ({modelId, tableName, setStep}) => {
  const [status, setStatus] = useState(0);
  const [data, setData] = useState([]);
  const [_tableName, setTableName] = useState(tableName);

  let queryCode = `const query = async () => {
  const results = await orbisdb.select()
    .from("${_tableName ? _tableName : "<TABLE_NAME>"}")
    .orderBy(["indexed_at", "desc"])
    .limit(10)
    .run();
};`;

  const query = async () => {
    setStatus(1);
    const result = await orbisdb.select().from(_tableName).orderBy(["indexed_at", "desc"]).limit(10).run();
    console.log("result:", result);
    if(result.rows) {
      setData(result.rows);
    }
    setStatus(2);
  };

  return(
    <>
      <div className="flex w-full md:w-5/12 pb-6 md:pb-0 items-center flex-col">
        {/** Instructions */}
        <Instructions 
          title="Step 5:" 
          showBack={true}
          backAction={() => setStep(4.1)}
          description="Let's query the streams we just created with our model. " />
        
        {!tableName &&
          <div className="flex flex-col items-start mb-2 w-full pr-2">
            <div className="text-slate-600 text-sm mb-1">Table name:</div>
            <input
            type="text"
            placeholder="Table name"
            value={_tableName}
            onChange={(e) => setTableName(e.target.value)}
            className="flex-1 bg-white border border-slate-200 rounded-md shadow-sm px-3 py-1.5 text-sm font-medium text-slate-900 mb-2 w-full" />
          </div>
        }

        {/** Display results */}
        {(data && data.length > 0) &&
          <div className="flex flex-col space-y-2 mb-2">
            {data.map((item, key) => {
              item.stream_id = shortAddress(item.stream_id);
              item.controller = shortAddress(item.controller);
              return (
                  <div key={key} className="bg-white border border-slate-200 w-full rounded-md px-3 py-1.5 text-sm text-slate-900 mr-2 whitespace-pre-wrap font-mono">
                      {JSON.stringify(item, null, 3)}:
                  </div>
              );
          })}
          </div>
        }
        
        {/** Query CTA */}
        <Button title="Query" onClick={() => query()} status={status} successTitle="Results returned" />
      </div>
      {/** Code */}
      <CodeEditor code={queryCode} className="w-full md:w-7/12" />
    </>
  )
}



const ModelDocumentVariables = ({fields, setFields}) => {

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
    console.log('Submitted Data:', submittedData);
    // Process the submitted data as needed
  };

  function renderInputField(field, index) {
    switch (field.type) {
      case "string":
        return (
          <input
            type="text"
            value={field.value}
            onChange={(e) => handleInputChange(index, e.target.value)}
            className="bg-white border border-slate-200 w-full rounded-md shadow-sm px-3 py-1.5 text-sm font-medium text-slate-900 mr-2"
            placeholder={"Enter the " + field.name + " value here"}
          />
        );

      case "boolean":
        return (
          <select
            value={field.value}
            onChange={(e) => handleInputChange(index, e.target.value == "true" ? true : false)}
            className="bg-white border border-slate-200 w-full rounded-md shadow-sm px-3 py-1.5 text-sm font-medium text-slate-900 mr-2">
            <option value="">Select value</option>
            <option value={true}>True</option>
            <option value={false}>False</option>
          </select>
        );

      case "number":
        return (
          <input
            type="number"
            value={field.value}
            onChange={(e) => handleInputChange(index, parseFloat(e.target.value))}
            className="bg-white border border-slate-200 w-full rounded-md shadow-sm px-3 py-1.5 text-sm font-medium text-slate-900 mr-2"
            placeholder={"Enter the " + field.name + " value here"}
          />
        );
      // Add more cases for different field types if necessary
      default:
        return null;
    }
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
}

function ModelFieldsInputGroups({inputGroups, setInputGroups}) {

  const addInputGroup = () => {
    const newInputGroup = {
      id: inputGroups.length + 1,
      textValue: '',
      selectValue: ''
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
            className="flex-1 bg-white border border-slate-200 rounded-md shadow-sm px-3 py-1.5 text-sm font-medium text-slate-900 mr-2" />
          <select
            placeholder="Field type"
            value={group.selectValue}
            onChange={(e) => handleSelectChange(index, e.target.value)}
            className="bg-white border border-slate-200 rounded-md shadow-sm px-3 py-1.5 text-sm font-medium text-slate-900">
            <option value="">Field type</option>
            <option value="string">String</option>
            <option value="number">Number</option>
            <option value="boolean">Boolean</option>
          </select>
        </div>
      ))}
      <button
        onClick={addInputGroup}
        className="text-sm font-medium text-[#4483FD] hover:underline">
        + Add another field
      </button>
    </div>
  );
}

const Instructions = ({ showBack, backAction, title, description, buttons}) => {
  return(
    <div className='flex flex-col justify-center items-center pr-4'>
      <div className="flex flex-row items-center w-full">
        {showBack &&
          <div className="flex p-1 cursor-pointer" onClick={backAction}>
            <svg width="7" height="10" viewBox="0 0 6 10" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path fill-rule="evenodd" clip-rule="evenodd" d="M5.79062 0.230169C6.07772 0.528748 6.06841 1.00353 5.76983 1.29063L1.83208 5L5.76983 8.70938C6.06841 8.99647 6.07772 9.47125 5.79062 9.76983C5.50353 10.0684 5.02875 10.0777 4.73017 9.79063L0.230167 5.54063C0.0831082 5.39922 -1.18115e-06 5.20401 -1.17223e-06 5C-1.16331e-06 4.79599 0.0831082 4.60078 0.230167 4.45938L4.73017 0.209376C5.02875 -0.077719 5.50353 -0.0684095 5.79062 0.230169Z" fill="#0F172A"/>
            </svg>
          </div>
        }
        <div className='text-base text-slate-900 font-medium flex-1 text-center'>{title}</div>
      </div>
      <div className='text-sm text-slate-500 mb-4 text-center px-4'>{description}</div>
      {/** Loop through all buttons CTA */}
      {(buttons && buttons.length > 0) &&
        <div className="flex flex-row space-x-2">
          {buttons.map((button, key) => (
            <Button title={button.cta} onClick={button.action} key={key}  />
          ))}
        </div>
      }
    </div>
  )
}

const CodeEditor = ({code, className = "w-7/12"}) => {
  return(
    <div className={`text-white flex overflow-y-scroll sql_editor rounded-md py-3 bg-[#2e3440] ${className}`}>
      <AceEditor
        id="editor"
        aria-label="editor"
        mode="javascript"
        disabled={true}
        theme="nord_dark"
        name="editor"
        width="100%"
        fontSize={13}
        minLines={5}
        maxLines={100}
        showPrintMargin={false}
        showGutter
        readOnly={true}
        placeholder="Write your query here..."
        editorProps={{ $blockScrolling: true }}
        setOptions={{
          enableBasicAutocompletion: true,
          enableLiveAutocompletion: true,
          enableSnippets: true,
        }}
        value={code}
        showLineNumbers />
    </div>
  )
}

/** Helpful to delay a function for a few seconds */
export const sleep = (milliseconds) => {
  return new Promise(resolve => setTimeout(resolve, milliseconds))
}

/** Returns a shortened version of a string */
export function shortAddress(address, number = 5) {
  if(!address) {
    return "-";
  }

  const firstChars = address.substring(0, number);
  const lastChars = address.substr(address.length - number);
  return firstChars.concat('---', lastChars);
}
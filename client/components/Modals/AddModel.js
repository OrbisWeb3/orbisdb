import React, { useState, useEffect, useContext } from "react";
import { GlobalContext } from "../../contexts/Global";
import Modal from "../Modals";
import Button from "../Button";
import StepsProgress from "../StepsProgress";
import { STATUS, sleep } from "../../utils";

/** Modal to start tracking a new model */
export default function AddModelModal({ setAddModalVis }) {
  const [step, setStep] = useState(1);

  return (
    <Modal hide={() => setAddModalVis(false)}>
      <div className="flex flex-col justify-center">
        <h2 className="text-center font-medium mb-1">
          Start indexing a new model
        </h2>
        <p className="text-center text-slate-500 text-base mb-2">
          This will archive the model's streams in your Ceramic node as well as
          start indexing those in your database.
        </p>
        <div className="w-full">
          <StepsProgress
            steps={["Add your model", "Get model details", "Setup indexing"]}
            currentStep={step}
          />
        </div>

        <AddModelSteps
          step={step}
          setStep={setStep}
          setAddModalVis={setAddModalVis}
        />
      </div>
    </Modal>
  );
}

const AddModelSteps = ({ step, setStep, setAddModalVis }) => {
  const { orbis, setSettings } = useContext(GlobalContext);
  const [modelId, setModelId] = useState("");
  const [status, setStatus] = useState(STATUS.ACTIVE);
  const [modelDetails, setModelDetails] = useState();

  /** Step 1: Load models details */
  async function loadModelDetails() {
    setStatus(STATUS.LOADING);
    try {
      // Load model details from ceramic
      const stream = await orbis.ceramic.loadStream(modelId);
      console.log("stream.state:", stream.state);
      if (stream) {
        setModelDetails(stream.state.content);
      }
      setStatus(STATUS.SUCCESS);
      await sleep(500);
      setStep(2);
      setStatus(STATUS.ACTIVE);
    } catch (e) {
      alert("Couldn't load model details.");
      console.log("Error adding new model to the settings file:", e);
      setStatus(STATUS.ERROR);
      await sleep(500);
      setStatus(STATUS.ACTIVE);
    }
  }

  /** Step 2: Update local settings to save the model */
  async function saveInSettings() {
    setStatus(STATUS.LOADING);
    try {
      let rawResponse = await fetch("/api/settings/add-model", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: {
            name: modelDetails.name ? modelDetails.name : modelDetails.title,
            stream_id: modelId,
            status: 0,
          },
        }),
      });
      const response = await rawResponse.json();
      console.log("response:", response);
      if (rawResponse.status == 200) {
        setSettings(response.settings);
        setStatus(STATUS.SUCCESS);
        await sleep(500);
        setStep(STATUS.ERROR);
        setStatus(0);
      } else {
        setStatus(STATUS.ERROR);
      }
    } catch (e) {
      console.log("Error saving model in settings.");
      setStatus(STATUS.ERROR);
    }
  }

  /** Start indexing the model by adding a new table in the database and updating the status in the settings file */
  async function startIndexing() {
    setStatus(STATUS.LOADING);
    try {
      const rawResponse = await fetch("/api/settings/index-model", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          modelId,
        }),
      });
      const response = await rawResponse.json();
      console.log("response in startIndexing:", response);
      if (rawResponse.status == 200) {
        setSettings(response.settings);
        setStatus(STATUS.SUCCESS);
        await sleep(500);
        setAddModalVis(false);
      } else {
        setStatus(STATUS.ERROR);
      }
    } catch (e) {
      console.log("Error saving model in settings.");
      setStatus(3);
    }
  }

  switch (step) {
    case 1:
      return (
        <>
          <input
            type="text"
            placeholder="Model ID"
            className="bg-white px-2 py-1 rounded-md border border-slate-300 text-base text-slate-900 mb-2"
            onChange={(e) => setModelId(e.target.value)}
            value={modelId}
          />
          <Button
            type="primary"
            onClick={() => loadModelDetails(true)}
            status={status}
            title="Load details"
          />
        </>
      );
    case 2:
      return (
        <>
          <p className="text-base text-slate-500 mb-2">
            Model name:{" "}
            <span className="font-medium text-slate-900">
              {modelDetails.name ? modelDetails.name : modelDetails.title}
            </span>
          </p>
          <Button
            type="primary"
            onClick={() => saveInSettings()}
            status={status}
            title="Save"
          />
        </>
      );
    case 3:
      return (
        <>
          <p className="text-base text-slate-900 mb-3 text-center">
            We will now initialize the indexing of this model which is going to
            create a new table in your database with those fields.
          </p>
          <div className="mb-3 justify-center flex">
            {modelDetails.schema ? (
              <SchemaDetails
                content={modelDetails}
                properties={modelDetails.schema.properties}
              />
            ) : (
              <p className="rounded-md p-2 bg-slate-50 text-center w-full">
                This stream is not a model.
              </p>
            )}
          </div>
          <Button
            type="primary"
            onClick={() => startIndexing()}
            status={status}
            title="Start indexing"
          />
        </>
      );
    default:
  }
};

/** Display the details of a schema  */
const SchemaDetails = ({ content, properties }) => {
  if (properties) {
    return (
      <ul className="space-y-3 text-sm">
        <SchemaType properties={Object.entries(properties)} isParent={true} />
      </ul>
    );
  } else {
    return (
      <p className="text-gray-500 text-md">
        We couldn't find any property for this schema.
      </p>
    );
  }
};

const ValueDetails = ({ val }) => {
  if (Array.isArray(val)) {
    return val.map((type, key) => {
      if (type) {
        return (
          <>
            :
            <span
              className="rounded-md px-2 py-1 bg-slate-100 text-gray-600 mr-1.5"
              key={key}
            >
              {type}
            </span>
          </>
        );
      } else {
        return null;
      }
    });
  } else {
    if (val) {
      return (
        <>
          :
          <span className="rounded-md px-2 py-1 bg-slate-100 text-gray-600">
            {val}
          </span>
        </>
      );
    } else {
      return null;
    }
  }
};

/** Display schema type */
const SchemaType = ({ properties, isParent }) => {
  return properties.map(([key, value]) => (
    <>
      <li key={key}>
        <span
          className={
            isParent ? "text-gray-900 font-mono" : "text-gray-500 font-mono"
          }
        >
          {key}
        </span>{" "}
        <ValueDetails val={value.type} />
      </li>
      {value?.type?.includes("object") && value.properties && (
        <div className="pl-4 mt-2 border-l border-gray-200 space-y-2">
          <SchemaType
            properties={Object.entries(value.properties)}
            isParent={false}
          />
        </div>
      )}
    </>
  ));
};

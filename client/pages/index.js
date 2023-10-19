import React, { useState, useEffect, useContext } from "react";
import { GlobalContext } from "../contexts/Global";
import { CheckIcon } from "../components/Icons";
import Modal from "../components/Modals";
import Button from "../components/Button";
import StepsProgress from "../components/StepsProgress";
import { sleep } from "../utils";

export default function Home() {
  const [addModalVis, setAddModalVis] = useState(false);

  return(
    <>
      <div className="px-16 py-12">
        <h1 className="text-3xl font-bold text-slate-900">Project</h1>
        <p className="text-slate-600 mt-1 text-base">Here are the models you are currently indexing.</p>
        <div className="flex flex-col mt-4 space-y-1.5 w-2/3">
          <LoopModels />
          <div className="flex flex-col w-full items-center space-y-2 mt-2">
            <p className="text-slate-500 text-sm">Create a new model or start indexing an existing one.</p>
            <Button type="primary" onClick={() => setAddModalVis(true)} title="+ Add a model" />
            <p className="text-slate-900 font-medium text-sm hover:underline">Browse the models marketplace</p>
          </div>
        </div>
      </div>
      {addModalVis &&
        <AddModelModal setAddModalVis={setAddModalVis} />
      }
    </>
  )
}

/** Will loop all of the models saved in the settings and display them */
const LoopModels = () => {
  const { settings } = useContext(GlobalContext);

  if(!settings) {
    return(
      <div className="text-slate-500 text-center text-base"><em>Loading...</em></div>
    )
  } else {
    return settings?.models.map((model, key) => {
      return (
          <div className="flex flex-row items-center space-x-2">
            <CheckIcon />
            <div className="text-[#4483FD] font-medium text-base">{model.name}</div>
            <div className="rounded-md bg-white border border-slate-200 px-3 py-1 text-sm font-medium">140</div>
          </div>
      );
    });
  }
}

/** Modal to start tracking a new model */
const AddModelModal = ({setAddModalVis}) => {

  const [step, setStep] = useState(1);


  // This will load the model on Ceramic and start indexing it by adding it to the "orbisdb-settings.json" file as well as create the corresponding table in the database
  async function loadAndSaveModel() {
    setStatus(1);
    console.log("Add model:", modelId);

    try {
      // Load model details from ceramic
      const stream = await orbis.ceramic.loadStream(modelId);
      console.log("stream.state:", stream.state);
      if(stream) {
        setModelDetails(stream.state.content)
      }

      // Try to add the new model details to the orbisdb settings
      /*let response = await fetch('http://localhost:8080/api/settings/add-model', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ model: {name: stream.state?.content?.name ? stream.state.content.name : stream.state.content.title , stream_id: modelId} }),
      });
      response = await response.json();
      console.log("response:", response);*/
      setStatus(2);
      //setSettings(response.settings);
      await sleep(500);
      setCurrentStep(2);
    } catch(e) {
      console.log("Error adding new model to the settings file:", e);
      setStatus(3);
      //setSettings(defaultSettings);
    }
  }


  return(
    <Modal hide={() => setAddModalVis(false)}>
      <div className="flex flex-col justify-center">
        <h2 className="text-center font-medium mb-1">Start indexing a new model</h2>
        <p className="text-center text-slate-500 text-base mb-2">This will archive the model's streams in your Ceramic node as well as start indexing those in your database.</p>
        <div className="w-full">
          <StepsProgress steps={["Add your model", "Get model details", "Setup indexing"]} currentStep={step} />
        </div>

        <AddModelSteps step={step} setStep={setStep} />
      </div>
    </Modal>
  )
}

const AddModelSteps = ({step, setStep}) => {
  const { orbis, setSettings } = useContext(GlobalContext);
  const [modelId, setModelId] = useState("");
  const [status, setStatus] = useState(0);
  const [modelDetails, setModelDetails] = useState();

  /** Step 1: Load models details */
  async function loadModelDetails() {
    setStatus(1);
    try {
      // Load model details from ceramic
      const stream = await orbis.ceramic.loadStream(modelId);
      console.log("stream.state:", stream.state);
      if(stream) {
        setModelDetails(stream.state.content)
      }
      setStatus(2);
      await sleep(500);
      setStep(2);
      setStatus(0);
    } catch(e) {
      console.log("Error adding new model to the settings file:", e);
      setStatus(3);
    }
  }

  /** Step 2: Update local settings to save the model */
  async function saveInSettings() {
    setStatus(1);
    try {
      let response = await fetch('/api/settings/add-model', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: {
            name: modelDetails.name ? modelDetails.name : modelDetails.title ,
            stream_id: modelId,
            status: 0
          }
        }),
      });
      response = await response.json();
      console.log("response:", response);
      if(response.status == 200) {
        setSettings(response.settings);
        setStatus(2);
      } else {
        setStatus(3);
      }

    } catch(e) {
      console.log("Error saving model in settings.");
      setStatus(3);
    }

  }

  switch (step) {
    case 1:
      return(
        <>
          <input type="text" placeholder="Model ID" className="bg-white px-2 py-1 rounded-md border border-slate-300 text-base text-slate-900 mb-2" onChange={(e) => setModelId(e.target.value)} value={modelId} />
          <Button type="primary" onClick={() => loadModelDetails(true)} status={status} title="Load details" />
        </>
      )
    case 2:
      return(
        <>
          <p className="text-base text-slate-900">Model name: {modelDetails.name ? modelDetails.name : modelDetails.title}</p>
          <Button type="primary" onClick={() => saveInSettings()} status={status} title="Save" />
        </>
      )
    default:

  }
}

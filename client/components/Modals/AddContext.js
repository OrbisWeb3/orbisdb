import React, { useState, useEffect, useContext } from "react";
import { GlobalContext } from "../../contexts/Global";
import Modal from "../Modals";
import Button from "../Button";
import StepsProgress from "../StepsProgress";
import { STATUS, sleep } from "../../utils";
import ContextDetails from "../ContextDetails";

/** Modal to start tracking a new model */
export default function AddContextModal({hide, parentContext}) {
  const [step, setStep] = useState(1);

  return(
    <Modal hide={hide}>
      <div className="flex flex-col justify-center">
        <h2 className="text-center font-medium mb-1">{parentContext ? "Add a new sub-context" : "Use a new context" }</h2>
        <p className="text-center text-slate-500 text-base mb-2">You can either create or use an existing context.</p>
        <div className="w-full">
          <StepsProgress steps={["Type", "Details", "Save in settings"]} currentStep={step} />
        </div>

        <AddContextSteps step={step} setStep={setStep} parentContext={parentContext} hide={hide} />
      </div>
    </Modal>
  )
}

const AddContextSteps = ({step, setStep, hide, parentContext}) => {
  const { orbis, setSettings } = useContext(GlobalContext);
  const [selectedOption, setSelectedOption] = useState(null);
  const [contextId, setContextId] = useState("");
  const [contextName, setContextName] = useState("");
  const [status, setStatus] = useState(STATUS.ACTIVE);
  const [contextDetails, setContextDetails] = useState();

  /** Step 1: Load models details */
  async function loadContextDetails() {
    setStatus(STATUS.LOADING);
    try {
      // Load model details from ceramic
      const stream = await orbis.ceramic.loadStream(contextId);
      console.log("stream.state:", stream.state);
      if(stream) {
        let content = {
          name: stream.state.content.name,
          stream_id: contextId
        };
        setContextDetails(content)
      }
      setStatus(STATUS.SUCCESS);
      await sleep(500);
      setStep(3);
      setStatus(STATUS.ACTIVE);
    } catch(e) {
      alert("Couldn't load context details.");
      console.log("Error adding new context to the settings file:", e);
      setStatus(STATUS.ERROR);
      await sleep(500);
      setStatus(STATUS.ACTIVE);
    }
  }

  /** Create a new context in Ceramic and save in state  */
  async function createNewContext() {
    setStatus(STATUS.LOADING);
    let content = {
      name: contextName,
    };
    let res = await orbis.createContext(content);
    console.log("res:", res);
    content.stream_id = res.doc;
    setContextDetails(content)
    setStatus(STATUS.SUCCESS);
    await sleep(500);
    setStep(3);
    setStatus(STATUS.ACTIVE);
  }

  /** Step 2: Update local settings to save the model */
  async function saveInSettings() {
    setStatus(STATUS.LOADING);
    try {
      if(parentContext) {
        contextDetails.context = parentContext;
      }
      console.log("Saving contextDetails:", contextDetails);
      let response = await fetch('/api/settings/add-context', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          context: contextDetails
        }),
      });
      response = await response.json();
      console.log("response:", response);
      if(response.status == 200) {
        setSettings(response.settings);
        setStatus(STATUS.SUCCESS);
        await sleep(500);
        setStep(STATUS.ERROR);
        setStatus(0);
        hide();
      } else {
        setStatus(STATUS.ERROR);
      }

    } catch(e) {
      console.log("Error saving model in settings.");
      setStatus(STATUS.ERROR);
    }
  }


  function nextStep() {
    switch (step) {
      case 1:
        if(selectedOption) {
          setStep(2)
        } else {
          alert("You must select an option first.");
          return;
        }
        break;
      case 2:
        switch (selectedOption) {
          case "existing":
            if(contextId == "" || !contextId) {
              alert("Context ID can't be empty.");
              return;
            }
            loadContextDetails();
            break;
          case "new":
            createNewContext();
            break;
          default:

        }
        break;
      default:

    }
  }

  switch (step) {
    /** Creating or updating a context */
    case 1:
      return(
        <div className="flex flex-col items-center">
          <div className="space-y-2 flex flex-col mb-4 text-base mt-2 w-full">
            <ContextOption
              title="Use existing context"
              description="Add a context you created in the past."
              isSelected={selectedOption === 'existing'}
              onSelect={() => setSelectedOption('existing')} />
            <ContextOption
              title="Create new context"
              description="Create a new context and start using it."
              isSelected={selectedOption === 'new'}
              onSelect={() => setSelectedOption('new')}/>
          </div>
          {/**<input type="text" placeholder="Model ID" className="bg-white px-2 py-1 rounded-md border border-slate-300 text-base text-slate-900 mb-2" onChange={(e) => setModelId(e.target.value)} value={modelId} />*/}
          <Button type="primary" onClick={() => nextStep()} status={status} title="Next" />
        </div>
      );

    /** Set details for new context or load the existing one  */
    case 2:
      if(selectedOption == "existing") {
        return(
          <div className="flex flex-col items-center">
            <input type="text" placeholder="Context ID" className="bg-white w-full mt-2 px-2 py-1 rounded-md border border-slate-300 text-base text-slate-900 mb-2" onChange={(e) => setContextId(e.target.value)} value={contextId} />
            <Button type="primary" onClick={() => nextStep()} status={status} title="Next" />
          </div>
        );
      } else if(selectedOption == "new") {
        return(
          <div className="flex flex-col items-center">
            <input type="text" placeholder="Context name" className="bg-white w-full mt-2 px-2 py-1 rounded-md border border-slate-300 text-base text-slate-900 mb-2" onChange={(e) => setContextName(e.target.value)} value={contextName} />
            <Button type="primary" onClick={() => nextStep()} status={status} title="Next" />
          </div>
        )
      };

    /** Display and save */
    case 3:
    return(
      <div className="flex flex-col items-center">
        <p className="text-base text-slate-900 mb-3 text-center">We are now going to save this new context in your settings.</p>
        <div className="w-full mb-3">
          <ContextDetails context={contextDetails} />
        </div>
        <Button type="primary" onClick={() => saveInSettings()} status={status} title="Save" />
      </div>
    );
    default:

  }
}

// Reusable ContextOption component
const ContextOption = ({ title, description, isSelected, onSelect }) => (
  <div className={`rounded-md border border-slate-200 px-4 py-3 flex flex-col ${isSelected ? 'bg-[#eef5ff] border-[#4483fd] border' : 'hover:bg-slate-50'} cursor-pointer`} onClick={onSelect}>
    <p className={`font-medium ${isSelected ? 'text-slate-800' : 'text-slate-900'}`}>{title}</p>
    <p className="text-slate-600">{description}</p>
  </div>
);

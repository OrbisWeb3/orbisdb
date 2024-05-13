import React, { useState, useEffect, useContext } from "react";
import { GlobalContext } from "../../contexts/Global";
import Modal from "../Modals";
import Button from "../Button";
import ContextSettings from "../ContextSettings";
import StepsProgress from "../StepsProgress";
import { STATUS, sleep } from "../../utils";
import ContextDetails from "../ContextDetails";

/** Modal to start tracking a new model */
export default function AddContextModal({ hide, parentContext, callback }) {
  const [step, setStep] = useState(2);

  return (
    <Modal hide={hide}>
      <div className="flex flex-col justify-center">
        <h2 className="text-center font-medium mb-1">
          {parentContext ? "Add a new sub-context" : "Use a new context"}
        </h2>
        <p className="text-center text-slate-500 text-base mb-2">
          You can either create or use an existing context.
        </p>
        <div className="w-full">
          <StepsProgress
            steps={["Type", "Details", "Save in settings"]}
            currentStep={step}
          />
        </div>

        <AddContextSteps
          callback={callback}
          step={step}
          setStep={setStep}
          parentContext={parentContext}
          hide={hide}
        />
      </div>
    </Modal>
  );
}

const AddContextSteps = ({ step, setStep, hide, parentContext, callback }) => {
  const [selectedOption, setSelectedOption] = useState("new");
  const [contextId, setContextId] = useState("");
  const [status, setStatus] = useState(STATUS.ACTIVE);
  const [contextDetails, setContextDetails] = useState();

  /** Step 1: Load models details */
  async function loadContextDetails() {
    setStatus(STATUS.LOADING);
    try {
      // Load model details from ceramic
      const stream = await orbis.ceramic.loadStream(contextId);
      console.log("stream.state:", stream.state);
      if (stream) {
        let content = {
          name: stream.state.content.name,
          description: stream.state.content.description,
          stream_id: contextId,
        };
        setContextDetails(content);
        setStatus(STATUS.SUCCESS);
        await sleep(500);
        setStep(3);
        setStatus(STATUS.ACTIVE);
      } else {
        alert("Error loading context details.");
        console.log(
          "Error loading context details and adding it to the settings file:",
          e
        );
        setStatus(STATUS.ERROR);
        await sleep(500);
        setStatus(STATUS.ACTIVE);
      }
    } catch (e) {
      alert("Couldn't load context details.");
      console.log("Error adding new context to the settings file:", e);
      setStatus(STATUS.ERROR);
      await sleep(500);
      setStatus(STATUS.ACTIVE);
    }
  }

  /** Will perform the correct action on submit based on the step the user is on */
  function nextStep() {
    switch (step) {
      /** Handle step 2 directly since step 1 is handled with selectType */
      case 2:
        switch (selectedOption) {
          case "existing":
            if (contextId == "" || !contextId) {
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

  /** Select creation type */
  function selectType(type) {
    setSelectedOption(type);
    setStep(2);
  }

  async function _callback(context) {
    if (callback) {
      callback(context);
    }

    await sleep(500);
    hide();
  }

  switch (step) {
    /** Creating or updating a context */
    case 1:
      return (
        <div className="flex flex-col items-center">
          <div className="space-y-2 flex flex-col mb-4 text-base mt-2 w-full">
            <ContextOption
              title="Import existing context"
              description="Import a context you created in the past to start using it in this instance."
              isSelected={selectedOption === "existing"}
              onSelect={() => selectType("existing")}
            />
            <ContextOption
              title="Create new context"
              description="Create a new context and start using it."
              isSelected={selectedOption === "new"}
              onSelect={() => selectType("new")}
            />
          </div>
        </div>
      );

    /** Set details for new context or load the existing one  */
    case 2:
      if (selectedOption == "existing") {
        return (
          <div className="flex flex-col items-center">
            <input
              type="text"
              placeholder="Context ID"
              className="bg-white w-full mt-2 px-2 py-1 rounded-md border border-slate-300 text-base text-slate-900 mb-2"
              onChange={(e) => setContextId(e.target.value)}
              value={contextId}
            />
            <Button
              type="primary"
              onClick={() => nextStep()}
              status={status}
              title="Next"
            />
          </div>
        );
      } else if (selectedOption == "new") {
        return (
          <ContextSettings callback={_callback} parentContext={parentContext} />
        );
      }

    /** Display and save */
    case 3:
      return (
        <div className="flex flex-col items-center">
          <p className="text-base text-slate-900 mb-3 text-center">
            We are now going to save this new context in your settings.
          </p>
          <div className="w-full mb-3">
            <ContextDetails context={contextDetails} />
          </div>
          <Button
            type="primary"
            onClick={() => saveInSettings()}
            status={status}
            title="Save"
          />
        </div>
      );
    default:
  }
};

// Reusable ContextOption component
const ContextOption = ({ title, description, isSelected, onSelect }) => (
  <div
    className={`rounded-md border border-slate-200 px-4 py-3 flex flex-col ${isSelected ? "bg-[#eef5ff] border-[#4483fd] border" : "hover:bg-slate-50"} cursor-pointer`}
    onClick={onSelect}
  >
    <p
      className={`font-medium ${isSelected ? "text-slate-800" : "text-slate-900"}`}
    >
      {title}
    </p>
    <p className="text-slate-600">{description}</p>
  </div>
);

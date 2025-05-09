import { Instructions } from ".";
import React, { useState } from "react";
import { sleep } from "../../utils";
import Button from "../../components/Button";

/** Step 3.2: Getting users to create their own model */
const UseExistingModel = ({
  modelId,
  setModelId,
  setModelDefinition,
  setStep,
  orbisdb,
}) => {
  const [status, setStatus] = useState(0);

  async function loadModel() {
    setStatus(1);
    let modelContent = await orbisdb.ceramic.getModel(modelId);
    if (modelContent) {
      setStatus(2);
      console.log("modelContent:", modelContent);
      setModelDefinition(modelContent.schema);
      await sleep(2000);
      setStep(4.1);
    } else {
      console.log("Error loading model content.");
    }
  }

  return (
    <div className="flex w-full justify-center items-center flex-col md:flex-row">
      <div className="w-1/2 flex flex-col">
        {/** Instructions */}
        <Instructions
          title="Step 3:"
          description={
            <>Load an existing model to start creating data with it.</>
          }
        />

        {/** Model ID */}
        <div className="flex flex-col items-start mt-1">
          <div className="text-slate-600 text-sm mb-1">Model ID:</div>
          <input
            type="text"
            placeholder="Your model's Stream ID"
            value={modelId}
            onChange={(e) => setModelId(e.target.value.trim())}
            className="bg-white border border-slate-200 rounded-md shadow-sm px-3 py-1.5 text-sm font-medium text-slate-900 mr-2 w-full"
          />
        </div>

        {/** Load model CTA */}
        <div className="flex flex-col mt-2 justify-center items-center space-y-4 w-full">
          <div className="flex w-1/3"></div>
          <Button
            title="Load"
            onClick={() => loadModel()}
            status={status}
            successTitle="Model loaded"
          />
        </div>
      </div>
    </div>
  );
};

export default UseExistingModel;

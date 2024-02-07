import React, { useState, useEffect, useContext } from "react";
import { GlobalContext } from "../../contexts/Global";
import { CheckIcon, CloseIcon, QuestionMarkIcon } from "../../components/Icons";
import AddModelModal from "../../components/Modals/AddModel";
import Button from "../../components/Button";
import { ModelBuilder } from "../../components/ModelPicker";

export default function Models() {
  const [modelId, setModelId] = useState();
  const [addModalVis, setAddModalVis] = useState(false);

  return(
    <>
      <div className="px-16 py-12">
        <h1 className="text-3xl font-bold text-slate-900">Create model</h1>
        <p className="text-slate-600 mt-1 text-base">Here is a simple tool to create Ceramic models to structure your data. Simply add all of the fields you want to use and click on "Create model".</p>
        <div className="flex flex-col mt-4 space-y-1.5 w-1/3">
          <ModelBuilder showBack={false} createColor="primary" setModelId={setModelId} />

          {/** Show model id created once finalized */}
          {modelId &&
            <p className="text-base font-medium">Model ID: <span className="font-normal">{modelId}</span></p>
          }
        </div>
      </div>
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
    return settings?.models?.map((model, key) => {
      return (
          <div className="flex flex-row items-center space-x-2">
            {/** Indexing hasn't been finalized for this model */}
            {(model.status == 0 || !model.status) &&
              <CloseIcon />
            }

            {/** Model hasn't started indexing  */}
            {model.status == 1 &&
              <QuestionMarkIcon />
            }

            {/** Model is currently being indexed */}
            {model.status == 2 &&
              <CheckIcon />
            }

            <div className="text-[#4483FD] font-medium text-base">{model.name}</div>
            <div className="rounded-md bg-white border border-slate-200 px-3 py-1 text-sm font-medium">140</div>
          </div>
      );
    });
  }
}

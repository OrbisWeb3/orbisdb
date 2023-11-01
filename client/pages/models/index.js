import React, { useState, useEffect, useContext } from "react";
import { GlobalContext } from "../../contexts/Global";
import { CheckIcon, CloseIcon, QuestionMarkIcon } from "../../components/Icons";
import AddModelModal from "../../components/Modals/AddModel";
import Button from "../../components/Button";

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

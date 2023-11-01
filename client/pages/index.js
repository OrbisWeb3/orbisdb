import React, { useState, useEffect, useContext } from "react";
import Link from 'next/link';
import { GlobalContext } from "../contexts/Global";
import { CheckIcon, CloseIcon, QuestionMarkIcon } from "../components/Icons";
import ContextDetails from "../components/ContextDetails";
import AddContextModal from "../components/Modals/AddContext";
import Button from "../components/Button";

export default function Contexts() {
  const [addModalVis, setAddModalVis] = useState(false);

  return(
    <>
      <div className="px-16 py-12 w-2/3">
        <h1 className="text-3xl font-bold text-slate-900">Contexts</h1>
        <p className="text-slate-600 mt-1 text-base">Contexts can be used to scope your applications into multiple different parts that can have different rules.</p>
        <div className="flex flex-col mt-4">
          <div className="grid grid-cols-2 gap-4 mt-4 items-start">
            <LoopContexts />
          </div>
          <div className="flex flex-col w-full items-center mt-4">
            <Button type="primary" onClick={() => setAddModalVis(true)} title="+ Add context" />
          </div>
        </div>
      </div>

      {/** Will display the add context modal */}
      {addModalVis &&
        <AddContextModal hide={() => setAddModalVis(false)} />
      }
    </>
  )
}

const LoopContexts = () => {
  const { settings, setSettings } = useContext(GlobalContext);
  return settings.contexts.map((context, key) => {
    return (
        <ContextDetails context={context} key={key} />
    );
  });
}

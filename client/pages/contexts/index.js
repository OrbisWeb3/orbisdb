import React, { useState, useEffect, useContext } from "react";
import Link from 'next/link';
import { GlobalContext } from "../../contexts/Global";
import { CheckIcon, CloseIcon, QuestionMarkIcon } from "../../components/Icons";
import AddModelModal from "../../components/Modals/AddModel";
import Button from "../../components/Button";

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
            <Button type="primary" onClick={() => setAddModalVis(true)} title="+ Create context" />
          </div>
        </div>

      </div>
    </>
  )
}

const LoopContexts = () => {
  const { settings, setSettings } = useContext(GlobalContext);
  return settings.contexts.map((context, key) => {
    return (
        <div className="flex flex-row bg-white px-4 py-3 border border-slate-200 rounded-md items-center" key={key}>
          <img
            src={context.logo}
            alt={context.name}
            className="h-14 w-14 flex-shrink-0 mr-3 rounded-md" />
          <div className="flex flex-col space-y-1">
            <Link className="text-[#4483FD] font-medium text-base hover:underline" href={"/contexts/" + context.stream_id}>{context.name}</Link>
            <div className="flex flex-row">
              <div className="bg-slate-100 rounded-full px-3 py-1 text-xs font-medium text-slate-800 mr-1">{context.contexts ? context.contexts.length : "0" } sub-context</div>
              <div className="bg-slate-100 rounded-full px-3 py-1 text-xs font-medium text-slate-800">{context.plugins ? context.plugins.length : "0" } plugins</div>
            </div>
          </div>
        </div>
    );
  });
}

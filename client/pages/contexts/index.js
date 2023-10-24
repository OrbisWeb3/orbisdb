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
        <div className="flex flex-col w-2/3 space-y-4 mt-4">
          <LoopContexts />
          <div className="flex flex-col w-full items-center space-y-2 mt-2">
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
        <div className="flex flex-col space-y-1 bg-white px-4 py-3 border border-slate-200 rounded-md items-start" key={key}>
          <Link className="text-[#4483FD] font-medium text-base hover:underline" href={"/contexts/" + context.stream_id}>{context.name}</Link>
          <code className="text-xs text-gray-800 py-1 px-2 bg-gray-50 border border-gray-300 rounded-md">{context.stream_id}</code>
        </div>
    );
  });
}

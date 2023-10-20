import React, { useState, useEffect, useContext } from "react";
import { GlobalContext } from "../../contexts/Global";
import { CheckIcon, CloseIcon, QuestionMarkIcon } from "../../components/Icons";
import AddModelModal from "../../components/Modals/AddModel";
import Button from "../../components/Button";
import { useRouter } from 'next/router'

export default function PluginDetails() {
  const [addModalVis, setAddModalVis] = useState(false);

  /** Use Next router to get conversation_id */
  const router = useRouter();
  const { plugin_id } = router.query;

  return(
    <>
      <div className="px-16 py-12 w-2/3">
        <h1 className="text-3xl font-bold text-slate-900">{plugin_id}</h1>
        <p className="text-slate-600 mt-1 text-base">Plugins can be used to extand the possibilities of Ceramic. Select the plugins you would like to use here.</p>
        <div className="grid grid-cols-3 gap-4 mt-4">
        </div>
      </div>
    </>
  )
}

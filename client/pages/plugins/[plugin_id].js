import React, { useState, useEffect, useContext } from "react";
import { GlobalContext } from "../../contexts/Global";
import { CheckIcon, CloseIcon, QuestionMarkIcon } from "../../components/Icons";
import AddModelModal from "../../components/Modals/AddModel";
import Button from "../../components/Button";
import { useRouter } from 'next/router'

export default function PluginDetails() {
  const [addModalVis, setAddModalVis] = useState(false);
  const [pluginDetails, setPluginDetails] = useState();

  /** Use Next router to get conversation_id */
  const router = useRouter();
  const { plugin_id } = router.query;

  useEffect(() => {
    if(plugin_id) {
      loadPluginDetails();
    }

    async function loadPluginDetails() {
      try {
        let result = await fetch("/api/plugins/" + plugin_id);
        result = await result.json();
        console.log("plugin details:", result);
        if(result.status == 200) {
          setPluginDetails(result.plugin);
        } else {
          console.log("Error retrieving plugin details.");
        }
      } catch(e) {
        console.log("Error retrieving plugin details:", e);
      }
    }
  }, [plugin_id])

  return(
    <>
      <div className="px-16 py-12 w-2/3">
        {pluginDetails ?
          <>
            <h1 className="text-3xl font-bold text-slate-900">{pluginDetails.name}</h1>
            <p className="text-slate-600 mt-1 text-base">{pluginDetails.description}</p>
            <div className="grid grid-cols-3 gap-4 mt-4">
            </div>
          </>
        :
          <p>Loading...</p>
        }

      </div>
    </>
  )
}

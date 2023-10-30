import React, { useState, useEffect, useContext } from "react";
import { GlobalContext } from "../../contexts/Global";
import { findContextById } from "../../utils";
import { useRouter } from 'next/router'

export default function ContextDetails() {
  const { settings, setSettings } = useContext(GlobalContext);
  const [context, setContext] = useState();

  /** Use Next router to get conversation_id */
  const router = useRouter();
  const { context_id } = router.query;

  useEffect(() => {
    if(context_id) {
      loadContextDetails();
    }

    async function loadContextDetails() {
      let _context = findContextById(settings.contexts, context_id);
      setContext(_context);
      console.log("context:", context);
    }
  }, [context_id]);

  return(
    <div className="flex flex-row space-x-8">
      {/** Context details */}
      <div className="px-16 py-12 md:w-2/3">
      {context ?
        <div className="flex flex-row items-center">
          {context.logo &&
            <img src={context.logo} className="mr-3 h-20 w-20 rounded-md" />
          }
          <h1 className="text-3xl font-bold text-slate-900">{context.name}</h1>
        </div>
      :
        <>Loading...</>
      }
      </div>
    </div>

  )
}

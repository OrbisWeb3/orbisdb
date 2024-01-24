import React, { useState, useEffect, useContext } from "react";
import Link from 'next/link';
import { GlobalContext } from "../contexts/Global";
import { LoadingCircle } from "../components/Icons";
import ContextDetails from "../components/ContextDetails";
import AddContextModal from "../components/Modals/AddContext";
import Button from "../components/Button";
import Alert from "../components/Alert";

export default function Contexts() {
  const { orbisdb, settings } = useContext(GlobalContext);
  const [addModalVis, setAddModalVis] = useState(false);
  const [contexts, setContexts] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadContexts();
    async function loadContexts() {
      setLoading(true);
      /** Building query statement */
      const query = orbisdb.select().from("orbis_db_context").where("context", 'is', null).orderBy("indexed_at", "desc").limit(50); 

      /** Executing query */
      const results = await orbisdb.execute(query);
      setContexts(results.rows);
      setLoading(false);
      console.log("results:", results)
    }
  }, [])

  function callback(context) {
    let _contexts = [context, ...contexts];
    console.log("_contexts:", _contexts);
    setContexts(_contexts)
  }

  return(
    <>
      <div className="px-16 py-12 w-2/3">
        <h1 className="text-3xl font-bold text-slate-900">Contexts</h1>
        <p className="text-slate-600 mt-1 text-base">Contexts can be viewed as projects and can be used to scope your applications into multiple different parts that can have different rules.</p>
        <div className="flex flex-col mt-4">
          {loading ?
            <div className="flex w-full justify-center">
              <LoadingCircle />
            </div>
          :
            <>
              {(contexts && contexts.length > 0) ?
                <div className="grid grid-cols-2 gap-4 items-start mb-4">
                  <LoopContexts contexts={contexts} />
                </div>
              :
                <div className="flex justify-center w-full">
                  <Alert title="You haven't created any context yet." />
                </div>
              }
              <div className="flex flex-col w-full items-center">
                <Button type="primary" onClick={() => setAddModalVis(true)} title="+ Add context" />
              </div>
            </>
          }

          
        </div>
      </div>

      {/** Will display the add context modal */}
      {addModalVis &&
        <AddContextModal hide={() => setAddModalVis(false)} callback={callback} />
      }
    </>
  )
}

const LoopContexts = ({contexts}) => {
  return contexts?.map((context, key) => {
    return (
        <ContextDetails context={context} key={key} />
    );
  });
  
}

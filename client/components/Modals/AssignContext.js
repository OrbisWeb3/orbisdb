import React, { useState, useEffect, useContext } from "react";
import { GlobalContext } from "../../contexts/Global";
import Modal from "../Modals";
import Button from "../Button";
import { STATUS, sleep, findContextById } from "../../utils";
import { DropdownArrow } from "../Icons";

export default function AssignContextModal({hide, plugin_id}) {
  const { settings, setSettings } = useContext(GlobalContext);
  const [status, setStatus] = useState(STATUS.ACTIVE);
  const [selectedContextIds, setSelectedContextIds] = useState([]);

  async function assignContext() {
      if(!selectedContextIds || selectedContextIds.length == 0) {
        alert("Please select a context first.");
        return null;
      }

      setStatus(STATUS.LOADING);
      event.preventDefault(); // Prevents the default form submit behavior


      /** Submit assign context form */
      let response = await fetch('/api/settings/assign-context', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          plugin_id: plugin_id,
          path: selectedContextIds
        }),
      });
      response = await response.json();
      console.log("response:", response)
      setStatus(STATUS.SUCCESS);
      setSettings(response.settings);
      await sleep(1500)
      hide();
  }

  return(
    <Modal hide={hide} title="Assign to a new context" description="Assign this plugin to a new context.">
      <form onSubmit={assignContext} className="mt-4">
        {/** Select the parent context you want to use here */}
        {(selectedContextIds && selectedContextIds.length >= 1) ?
          <>
            {[...selectedContextIds, {}].map((context, index) => (
              <ContextDropdown
                index={index}
                selectedContext={context}
                selectedContextIds={selectedContextIds}
                setSelectedContextIds={setSelectedContextIds} />
            ))}
          </>
        :
          <ContextDropdown
            selectedContextIds={selectedContextIds}
            setSelectedContextIds={setSelectedContextIds} />
        }

        {/** Save button */}
        <div className="flex flex-row justify-center mt-4">
          <Button title="Save" status={status} successTitle="Saved" />
        </div>
      </form>
    </Modal>
  )
}

const ContextDropdown = ({ selectedContext, selectedContextIds, setSelectedContextIds, index }) => {
  const { settings } = useContext(GlobalContext);
  const [listVis, setListVis] = useState(false);

  // Get the current context based on the last ID in selectedContextIds
  const parentContextId = selectedContextIds[index];
  const parentContext = findContextById(settings.contexts, selectedContextIds[index - 1]);
  const _contexts = parentContext?.contexts ? parentContext.contexts : settings.contexts;
  const currentContext = findContextById(settings.contexts, selectedContext);

  function selectContext(context) {
    setListVis(false);
    let newContexts = [];
    if(!selectedContext) {
      // Save a new context
      newContexts = [...selectedContextIds, context.stream_id];
    } else {
      // Update a context already in the array
      newContexts = [...selectedContextIds];
      newContexts[index] = context.stream_id;

      // Make sure context saved one level under the updated one are removed from the array
      newContexts.splice(index + 1);
    }

    setSelectedContextIds(newContexts);
    console.log("newContexts:", newContexts);
  }

  if(parentContext && (!parentContext || !parentContext.contexts || parentContext.contexts.length == 0)) {
    return null;
  }

  return (
    <div className="w-full relative">
      {/* Dropdown selector */}
      <div className="flex flex-row bg-white px-2 py-1 rounded-md border border-slate-300 hover:border-slate-400 cursor-pointer text-base text-slate-900 mt-1 items-center" onClick={() => setListVis(!listVis)}>
        {currentContext ?
          <span className="flex flex-1">
            <ContextDetails context={currentContext} />
          </span>
        :
          <span className="flex flex-1">Select your context</span>
        }

        {/* Dropdown arrow */}
        <span className="flex justify-self-end inset-y-0 right-0 ml-3 flex items-center">
          <DropdownArrow />
        </span>
      </div>

      {/* Dropdown list content */}
      {listVis &&
        <ul className="absolute z-10 mt-1 max-h-56 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm"
            tabIndex="-1"
            role="listbox"
            aria-labelledby="listbox-label">
          {_contexts.map((context, index) => (
            <li
              className="text-gray-900 relative select-none py-2 pl-3 pr-9 hover:bg-slate-50 cursor-pointer"
              role="option"
              key={index}
              onClick={() => selectContext(context)}>
              <ContextDetails context={context} />
            </li>
          ))}
        </ul>
      }
    </div>
  );
};


const ContextDetails = ({context}) => {
  return(
      <div className="flex items-center">
        {/** Display context logo if any */}
        {context.logo &&
          <img
            src={context.logo}
            alt={context.name}
            className="h-5 w-5 flex-shrink-0 mr-1.5 rounded-full" />
        }
        <span className="font-normal block truncate">{context.name}</span>
      </div>

  )
}

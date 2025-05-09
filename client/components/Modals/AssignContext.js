import React, { useState, useEffect, useContext } from "react";
import { useGlobal } from "../../contexts/Global";
import Modal from "../Modals";
import Alert from "../Alert";
import Button from "../Button";
import { STATUS, sleep, findContextById } from "../../utils";
import { DropdownArrow } from "../Icons";
import LoopPluginVariables from "../PluginVariables";
import StepsProgress from "../StepsProgress";

export default function AssignContextModal({
  hide,
  plugin_id,
  selectedContext,
}) {
  const { setSettings, sessionJwt } = useGlobal();
  const [status, setStatus] = useState(STATUS.ACTIVE);
  const [pluginDetails, setPluginDetails] = useState();
  const [selectedContextIds, setSelectedContextIds] = useState([]);
  const [step, setStep] = useState(selectedContext ? 2 : 1);
  const [variableValues, setVariableValues] = useState(
    selectedContext ? selectedContext.variables : null
  );

  useEffect(() => {
    if (plugin_id) {
      loadPluginDetails();
    }
    async function loadPluginDetails() {
      /** Load plugin details */
      try {
        let response = await fetch(`/api/plugins/${plugin_id}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${sessionJwt}`,
          },
        });
        const result = await response.json();
        console.log("plugin details:", result);
        if (response.status == 200) {
          setPluginDetails(result.plugin);
        } else {
          console.log("Error retrieving plugin details.");
        }
      } catch (e) {
        console.log("Error retrieving plugin details:", e);
      }
    }
  }, [plugin_id]);

  /** Triggered when a variable field in the loop variable component is updated */
  const handleVariableChange = (variableId, value) => {
    setVariableValues((prevValues) => ({
      ...prevValues,
      [variableId]: value,
    }));
  };

  /** Go to the settings step for plugin */
  function nextStep() {
    if (!selectedContextIds || selectedContextIds.length == 0) {
      alert("Please select a context first.");
      return null;
    }

    setStep(2);
  }

  /** Will either assign a new context to this plugin or add a new one */
  async function saveOrUpdateContext() {
    event.preventDefault(); // Prevents the default form submit behavior

    if (
      (!selectedContextIds || selectedContextIds.length == 0) &&
      !selectedContext
    ) {
      alert("Please select a context first.");
      return null;
    }

    setStatus(STATUS.LOADING);

    // Determine if we are updating an existing context or saving a new one
    let requestBody = {
      plugin_id: plugin_id,
      variables: variableValues,
    };
    console.log("Submitting:", requestBody);

    if (selectedContext) {
      console.log("selectedContext:", selectedContext);
      requestBody.context_id = selectedContext.context;
      requestBody.uuid = selectedContext.uuid;
    } else {
      requestBody.path = selectedContextIds;
    }
    console.log("requestBody:", requestBody);

    /** Submit assign context form */
    const rawResponse = await fetch(`/api/plugins/${plugin_id}/context`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${sessionJwt}`,
      },
      body: JSON.stringify(requestBody),
    });
    const response = await rawResponse.json();
    console.log("response:", response);
    setStatus(STATUS.SUCCESS);
    setSettings(response.settings);
    await sleep(1500);
    hide();
  }

  function getLastContext() {
    let last_context = selectedContextIds[selectedContextIds.length - 1];
    return last_context;
  }

  return (
    <Modal
      hide={hide}
      title={
        selectedContext
          ? "Update the context settings"
          : "Assign to a new context"
      }
      description={
        selectedContext
          ? "Update the plugin settings for this context."
          : "Assign this plugin to a new context."
      }
      className="w-[500px]"
    >
      {/** Show stepper only if user is assigning a plugin to a new context (not updating it) */}
      {!selectedContext && (
        <div className="w-full mt-6">
          <StepsProgress
            steps={["Select your context", "Settings"]}
            currentStep={step}
          />
        </div>
      )}

      {/** Step 1: Select context */}
      {step == 1 && (
        <div className="mt-4">
          {/** Select the parent context you want to use here */}
          {selectedContextIds && selectedContextIds.length >= 1 ? (
            <>
              {[...selectedContextIds, {}].map((context, index) => (
                <ContextDropdown
                  index={index}
                  plugin_id={plugin_id}
                  selectedContext={context}
                  selectedContextIds={selectedContextIds}
                  setSelectedContextIds={setSelectedContextIds}
                />
              ))}
            </>
          ) : (
            <ContextDropdown
              selectedContextIds={selectedContextIds}
              plugin_id={plugin_id}
              setSelectedContextIds={setSelectedContextIds}
            />
          )}

          {/** Save button */}
          <div className="flex flex-row justify-center mt-4">
            {!selectedContextIds || selectedContextIds.length == 0 ? (
              <Button title="Next" status={STATUS.DISABLED} />
            ) : (
              <>
                {isContextUsed(plugin_id, getLastContext()) &&
                status != STATUS.SUCCESS ? (
                  <>
                    {/**<Button title="Context already used" status={STATUS.DISABLED} />*/}
                    <Button title="Next" onClick={() => nextStep()} />
                  </>
                ) : (
                  <Button title="Next" onClick={() => nextStep()} />
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/** Step 2: Set variables */}
      {step == 2 && (
        <form onSubmit={saveOrUpdateContext} className="mt-6 flex flex-col">
          {pluginDetails?.variables && pluginDetails.variables.length > 0 ? (
            <LoopPluginVariables
              variables={pluginDetails?.variables}
              variableValues={variableValues}
              handleVariableChange={handleVariableChange}
              per_context={true}
            />
          ) : (
            <div className="bg-amber-50 rounded-md border-dashed border border-amber-200 w-full py-2 justify-center flex mb-4">
              <span className="text-center text-amber-800 text-base">
                There aren't any contextualized variables to setup for this
                plugin.
              </span>
            </div>
          )}

          {/** Save button */}
          <div className="flex flex-row justify-center">
            {(selectedContextIds && selectedContextIds.length > 0) ||
            selectedContext.context ? (
              <Button title="Save" status={status} successTitle="Saved" />
            ) : (
              <Button title="Context already used" status={STATUS.DISABLED} />
            )}
          </div>
        </form>
      )}
    </Modal>
  );
}

export const ContextDropdown = ({
  selectedContext,
  selectedContextIds,
  setSelectedContextIds,
  index,
  showGlobal = false,
  size,
}) => {
  const { settings, isShared } = useGlobal();
  const [listVis, setListVis] = useState(false);

  // Get the current context based on the last ID in selectedContextIds
  const parentContextId = selectedContextIds[index];
  const parentContext = findContextById(
    settings.contexts,
    selectedContextIds[index - 1]
  );
  const _contexts = parentContext?.contexts
    ? parentContext.contexts
    : settings.contexts;
  const currentContext = findContextById(settings.contexts, selectedContext);

  function selectContext(context) {
    console.log("In selectContext() context:", context);
    setListVis(false);
    let newContexts = [];
    if (!selectedContext) {
      // Save a new context
      newContexts = [...selectedContextIds, context.stream_id];
    } else {
      // Update a context already in the array
      newContexts = [...selectedContextIds];
      newContexts[index] = context.stream_id;

      // Make sure context saved one level under the updated one are removed from the array
      newContexts.splice(index + 1);
    }
    console.log("newContexts:", newContexts);

    setSelectedContextIds(newContexts);
  }

  if (
    parentContext &&
    (!parentContext ||
      !parentContext.contexts ||
      parentContext.contexts.length == 0)
  ) {
    return null;
  }

  return (
    <div className="w-full relative mb-2">
      {/* Dropdown selector */}
      <div
        className={`flex flex-row bg-white px-2 py-1 rounded-md border border-slate-300 hover:border-slate-400 cursor-pointer text-slate-900 mt-1 items-center ${size == "xs" ? "text-xs" : "text-base"}`}
        onClick={() => setListVis(!listVis)}
      >
        {currentContext ? (
          <span className="flex flex-1">
            <SmContextDetails
              context={
                size == "xs"
                  ? { name: "All contexts", stream_id: "global" }
                  : currentContext
              }
            />
          </span>
        ) : (
          <span className="flex flex-1">Select your context</span>
        )}

        {/* Dropdown arrow */}
        <span className="flex justify-self-end inset-y-0 right-0 ml-3 flex items-center">
          <DropdownArrow />
        </span>
      </div>

      {/* Dropdown list content */}
      {listVis && (
        <>
          <ul
            className={`absolute z-10 mt-1 max-h-56 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm  ${size == "xs" ? "text-xs" : "text-base"}`}
            tabIndex="-1"
            role="listbox"
            aria-labelledby="listbox-label"
          >
            {/** Only allow Global context option on dedicated instance */}
            {(!isShared || showGlobal) && (
              <li
                className={`relative select-none pr-9 text-gray-900 hover:bg-slate-50 cursor-pointer ${size == "xs" ? "py-1 pl-2" : "py-2 pl-3"}`}
                role="option"
                key={999}
                onClick={() =>
                  selectContext({
                    name: size == "xs" ? "All contexts" : "Global",
                    stream_id: "global",
                  })
                }
              >
                <SmContextDetails
                  context={{
                    name: size == "xs" ? "All contexts" : "Global",
                    stream_id: "global",
                  }}
                />
              </li>
            )}
            {_contexts && _contexts.length > 0 ? (
              <>
                {_contexts.map((context, index) => (
                  <li
                    className={`relative select-none pr-9 text-gray-900 hover:bg-slate-50 cursor-pointer ${size == "xs" ? "py-1 pl-2" : "py-2 pl-3"}`}
                    role="option"
                    key={index}
                    onClick={() => selectContext(context)}
                  >
                    <SmContextDetails context={context} />
                  </li>
                ))}
              </>
            ) : (
              <div className="p-4">
                <Alert
                  title="You haven't created any context yet."
                  className="text-xs mt-2"
                />
              </div>
            )}
          </ul>
        </>
      )}
    </div>
  );
};

export const SmContextDetails = ({ context }) => {
  return (
    <div className="flex items-center">
      {/** Display context logo if any */}
      {context.logo && (
        <img
          src={context.logo}
          alt={context.name}
          className="h-5 w-5 flex-shrink-0 mr-1.5 rounded-full"
        />
      )}
      <span className={"font-normal block truncate"}>{context.name}</span>
    </div>
  );
};

function isContextUsed(plugin_id, targetContext) {
  const { settings } = useGlobal();
  const pluginSettings = settings.plugins?.find(
    (plugin) => plugin.plugin_id === plugin_id
  );
  if (!pluginSettings) return false;

  if (pluginSettings.contexts) {
    return pluginSettings.contexts.some((ctx) => ctx.context === targetContext);
  } else {
    return false;
  }
}

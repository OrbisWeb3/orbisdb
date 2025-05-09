import React, { useState, useEffect, useContext, useRef } from "react";
import Link from "next/link";
import { GlobalContext, useGlobal } from "../../contexts/Global";
import {
  STATUS,
  findContextById,
  getPluginsByContext,
  findParentContextId,
  sleep,
} from "../../utils";
import { useRouter } from "next/router";
import {
  PluginsCountTag,
  countSubContexts,
  countPluginsByContext,
} from "../../components/ContextDetails";
import Alert from "../../components/Alert";
import ContextSettings from "../../components/ContextSettings";
import AddContextModal from "../../components/Modals/AddContext";
import AssignContextModal from "../../components/Modals/AssignContext";
import Button from "../../components/Button";
import InternalNavigation from "../../components/InternalNavigation";
import {
  SettingsIcon,
  DashIcon,
  ExternalLinkIcon,
  LoadingCircle,
} from "../../components/Icons";
import RightSideContainer from "../../components/RightSideContainer";

export default function ContextDetails() {
  const { settings } = useGlobal();
  const [context, setContext] = useState();
  const [plugins, setPlugins] = useState([]);
  const [parentContext, setParentContext] = useState();
  const [addModalVis, setAddModalVis] = useState(false);
  const [selectedPlugin, setSelectedPlugin] = useState(null);
  const [assignedContext, setAssignedContext] = useState(null);
  const [nav, setNav] = useState("Sub-contexts");

  /** Use Next router to get conversation_id */
  const router = useRouter();
  const { context_id } = router.query;

  useEffect(() => {
    if (context_id) {
      loadContextDetails();
      loadContextPlugins();
      let result = findParentContextId(
        context_id,
        settings.contexts ? settings.contexts : null
      );
      setParentContext(result);
    }

    async function loadContextDetails() {
      let _context = findContextById(settings.contexts, context_id);
      setContext(_context);
    }

    function loadContextPlugins() {
      let results = getPluginsByContext(context_id, settings.plugins);
      console.log("results loadContextPlugins:", results);
      setPlugins(results);
    }
  }, [context_id, settings]);

  if (!context) {
    return (
      <div className="flex flex-row space-x-8">
        <div className="px-16 py-12 w-full flex justify-center">
          <LoadingCircle />
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-row space-x-8 px-16 py-12">
        {/** Context details */}
        <div className="flex md:w-2/3 flex-col">
          {/** Context details */}
          {parentContext && <Breadcrumbs context_id={context_id} />}
          <div className="flex flex-row items-center">
            {parentContext && (
              <Link
                href={"/contexts/" + parentContext}
                className="rounded-full bg-white w-10 h-10 flex justify-center items-center cursor-pointer border border-slate-200 hover:border-slate-300 mr-3"
              >
                <svg
                  width="7"
                  height="12"
                  viewBox="0 0 6 10"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    fill-rule="evenodd"
                    clip-rule="evenodd"
                    d="M5.79062 0.230169C6.07772 0.528748 6.06841 1.00353 5.76983 1.29063L1.83208 5L5.76983 8.70938C6.06841 8.99647 6.07772 9.47125 5.79062 9.76983C5.50353 10.0684 5.02875 10.0777 4.73017 9.79063L0.230167 5.54063C0.0831082 5.39922 -1.18115e-06 5.20401 -1.17223e-06 5C-1.16331e-06 4.79599 0.0831082 4.60078 0.230167 4.45938L4.73017 0.209376C5.02875 -0.077719 5.50353 -0.0684095 5.79062 0.230169Z"
                    fill="#0F172A"
                  />
                </svg>
              </Link>
            )}
            {context.logo && (
              <img src={context.logo} className="mr-3 h-20 w-20 rounded-md" />
            )}
            <div className="flex flex-col">
              <h1 className="text-3xl font-bold text-slate-900">
                {context.name}
              </h1>
              <p className="font-mono text-[12px] bg-white rounded-full px-3 py-0.5 border border-slate-200 mt-1">
                {context_id}
              </p>
            </div>
          </div>

          {/** Context navigation */}
          <div className="flex flex-row mt-3">
            <InternalNavigation
              items={[
                {
                  label: "Sub-contexts",
                  title: (
                    <span className="flex flex-row items-center space-x-1">
                      <span className="bg-slate-100 py-0.5 text-xs px-1.5 rounded-md font-medium text-slate-900">
                        {countSubContexts(context_id)}
                      </span>
                      <span>Sub-context(s)</span>
                    </span>
                  ),
                  active: true,
                },
                {
                  label: "Plugins",
                  title: (
                    <span className="flex flex-row items-center space-x-1">
                      <span className="bg-slate-100 py-0.5 text-xs px-1.5 rounded-md font-medium text-slate-900">
                        {countPluginsByContext(context_id)}
                      </span>
                      <span>Plugin(s)</span>
                    </span>
                  ),
                  active: true,
                },
                { label: "Settings", active: true },
              ]}
              nav={nav}
              setNav={setNav}
            />
          </div>

          {/** Sub-contexts card */}
          {nav == "Sub-contexts" && (
            <div className="w-full bg-white border border-slate-200 rounded-md px-6 py-6 mt-5 flex flex-col">
              <h2 className="text-lg font-bold text-slate-900">Sub-contexts</h2>
              <p className="text-base text-slate-600">
                Create sub-contexts to manage your data more granularly within
                your application.
              </p>
              <div className="flex flex-col mt-3 space-y-2">
                {context.contexts && context.contexts.length > 0 ? (
                  <Contexts contexts={context.contexts} />
                ) : (
                  <div className="flex justify-center">
                    <Alert title="This context doesn't have any sub-contexts." />
                  </div>
                )}
              </div>
              <div className="flex flex-col w-full items-center mt-4">
                <Button
                  title="+ Add sub-context"
                  onClick={() => setAddModalVis(true)}
                />
              </div>
            </div>
          )}

          {/** Plugins card */}
          {nav == "Plugins" && (
            <div className="w-full bg-white border border-slate-200 rounded-md px-6 py-6 mt-5 flex flex-col">
              <h2 className="text-lg font-bold text-slate-900">Plugins used</h2>
              <p className="text-base text-slate-600 mb-1">
                Manage the plugins being used in this context.
              </p>
              {/** Display plugins installed on parent context if this context has a parent context. */}
              {parentContext && (
                <>
                  {plugins.parent.length > 0 && (
                    <>
                      <span className="font-medium text-base mt-2">
                        From parent:
                      </span>
                      <div className="flex flex-row grid grid-cols-2 gap-1 items-start">
                        <PluginsInstalled
                          plugins={plugins.parent}
                          context_id={context_id}
                          setSelectedPlugin={setSelectedPlugin}
                          setAssignedContext={setAssignedContext}
                        />
                      </div>
                    </>
                  )}
                </>
              )}

              {/** Display plugins directly used on this context */}
              <span className="font-medium text-base mt-2">Direct:</span>
              <div className="flex flex-row flex-wrap mt-2 items-start">
                {plugins.direct.length > 0 ? (
                  <div className="flex flex-row grid grid-cols-2 gap-1 items-start">
                    <PluginsInstalled
                      plugins={plugins.direct}
                      context_id={context_id}
                      setSelectedPlugin={setSelectedPlugin}
                      setAssignedContext={setAssignedContext}
                    />
                  </div>
                ) : (
                  <div className="flex justify-center">
                    <Alert title="There aren't any plugins installed on this context." />
                  </div>
                )}
              </div>

              {/** CTA to add a plugin */}
              <div className="flex w-full justify-center mt-2">
                <Link href="/plugins">
                  <Button title="+ Add plugin" />
                </Link>
              </div>
            </div>
          )}

          {/** Plugins card */}
          {nav == "Settings" && (
            <div className="w-full bg-white border border-slate-200 rounded-md px-6 py-6 mt-5 flex flex-col">
              <h2 className="text-lg font-bold text-slate-900">Settings</h2>
              <p className="text-base text-slate-600 mb-1">
                Update your context settings here.
              </p>
              <ContextSettings context={context} setContext={setContext} />
            </div>
          )}
        </div>

        {/** Show RightSide */}
        <RightSideContainer showContexts={true} />
      </div>

      {/** Will display the add context modal */}
      {addModalVis && (
        <AddContextModal
          parentContext={context_id}
          hide={() => setAddModalVis(false)}
        />
      )}

      {/** Modal to assign a plugin to a context */}
      {selectedPlugin != null && assignedContext != null && (
        <AssignContextModal
          hide={() => setSelectedPlugin(null)}
          selectedContext={assignedContext}
          plugin_id={selectedPlugin}
        />
      )}
    </>
  );
}

/** Loop through all sub-contexts */
const Contexts = ({ contexts }) => {
  return contexts?.map((context, key) => (
    <div key={key}>
      <div className="flex flex-row space-x-1">
        <Link
          className="text-base text-[#4483FD] hover:underline"
          href={"/contexts/" + context.stream_id}
          key={key}
        >
          · {context.name}
        </Link>
        <PluginsCountTag context_id={context.stream_id} />
      </div>
      {context.contexts && context.contexts.length > 0 && (
        <div className="flex flex-col pl-4 mt-2">
          <Contexts contexts={context.contexts} />
        </div>
      )}
    </div>
  ));
};

/** Loop through all plugins */
const PluginsInstalled = ({
  plugins,
  context_id,
  setSelectedPlugin,
  setAssignedContext,
}) => {
  return plugins?.map((plugin, key) => (
    <OnePlugin
      plugin={plugin}
      context_id={context_id}
      setSelectedPlugin={setSelectedPlugin}
      setAssignedContext={setAssignedContext}
      key={key}
    />
  ));
};

const OnePlugin = ({
  plugin,
  context_id,
  setSelectedPlugin,
  setAssignedContext,
}) => {
  console.log("plugin:", plugin);
  const { settings, sessionJwt } = useGlobal();
  const [pluginDetails, setPluginDetails] = useState();

  const existingPluginIndex = settings.plugins.findIndex(
    (p) => p.plugin_id === plugin.plugin_id
  );
  const existingContextIndex = settings.plugins[
    existingPluginIndex
  ].contexts.findIndex((c) => c.context === context_id);
  const contextAssigned =
    settings.plugins[existingPluginIndex].contexts[existingContextIndex];

  useEffect(() => {
    loadPluginDetails();
    async function loadPluginDetails() {
      try {
        let rawResponse = await fetch(`/api/plugins/${plugin.plugin_id}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${sessionJwt}`,
          },
        });
        const result = await rawResponse.json();
        console.log("plugin details:", result);
        if (rawResponse.status == 200) {
          setPluginDetails(result.plugin);
        } else {
          console.log("Error retrieving plugin details.");
        }
      } catch (e) {
        console.log("Error retrieving plugin details:", e);
      }
    }
  }, []);

  function selectAssignedContext() {
    console.log("contextAssigned:", plugin.contextAssigned);
    setAssignedContext(plugin.contextAssigned);
    setSelectedPlugin(plugin.plugin_id);
  }

  if (!pluginDetails) {
    return null;
  }

  return (
    <div className="rounded-md bg-white border border-slate-200 flex flex-col overflow-hidden mb-3 mr-3 flex-1">
      {/** Plugin details */}
      <div className="flex items-center flex-row px-4 py-3 items-center space-x-1.5">
        {/** Display context logo if any */}
        {pluginDetails.logo && (
          <img
            src={pluginDetails.logo}
            alt={pluginDetails.plugin_id}
            className="h-5 w-5 flex-shrink-0 mr-1.5 rounded-full"
          />
        )}
        <span className="text-base font-medium block truncate">
          {pluginDetails.name}
        </span>
      </div>

      {/** Display context variables if any */}
      {plugin.contextAssigned?.variables && (
        <div className="flex flex-col px-4 text-sm border-t border-slate-100 py-2 text-slate-600 space-y-1">
          {Object.entries(plugin.contextAssigned.variables).map(
            ([key, value]) => (
              <div className="font-mono text-xxs truncate" key={key}>
                <span className="font-bold text-slate-900">{key}:</span>{" "}
                <span className="truncate">{value}</span>
              </div>
            )
          )}
        </div>
      )}

      {/** Display active routes if any*/}
      {pluginDetails.routes && (
        <div className="flex flex-row bg-white text-slate-600 text-sm cursor-pointer border-t border-slate-200 space-x-1 px-3 py-1.5 items-center justify-center">
          <div className="mr-1 font-medium">Routes:</div>
          <>
            {pluginDetails.routes.map((route, index) => (
              <Link
                href={`/api/plugins/${plugin.contextAssigned.uuid}/routes/${route}`}
                target="_blank"
                className="bg-white border border-slate-200 hover:border-[#4483FD]  rounded-md px-3 py-2 text-xs font-medium text-slate-800 space-x-1 flex flex-row items-center"
                key={index}
              >
                <ExternalLinkIcon />
                <span className="font-mono">/{route}</span>
              </Link>
            ))}
          </>
        </div>
      )}

      {/** Configure CTA */}
      <div
        className="flex flex-row bg-[#FBFBFB] text-slate-700 hover:text-slate-800 cursor-pointer border-t border-slate-200 space-x-1 px-3 py-1.5 items-center justify-center"
        onClick={() => selectAssignedContext()}
      >
        <SettingsIcon />
        <span className="text-sm font-medium">Configure</span>
      </div>
    </div>
  );
};

const Breadcrumbs = ({ context_id }) => {
  const { settings } = useGlobal();
  const breadcrumbPath = findBreadcrumbPath(settings.contexts, context_id);

  if (!breadcrumbPath) {
    return null;
  }

  return (
    <div className="flex flex-row items-center space-x-2 text-base mb-3">
      {breadcrumbPath.map((crumb, index) => (
        <React.Fragment key={crumb.stream_id}>
          {index > 0 && <DashIcon />}
          {crumb.stream_id == context_id ? (
            <span className="text-slate-500">{crumb.name}</span>
          ) : (
            <Link
              href={"/contexts/" + crumb.stream_id}
              className="font-medium text-slate-900 hover:underline"
            >
              {crumb.name}
            </Link>
          )}
        </React.Fragment>
      ))}
    </div>
  );
};

function findBreadcrumbPath(contexts, contextId, path = []) {
  for (const context of contexts) {
    // Check if the current context matches the contextId
    if (context.stream_id === contextId) {
      // If it's a match, add this context to the path
      return [...path, { name: context.name, stream_id: context.stream_id }];
    }
    // If this context has subcontexts, traverse them
    if (context.contexts && context.contexts.length > 0) {
      const subPath = findBreadcrumbPath(context.contexts, contextId, [
        ...path,
        { name: context.name, stream_id: context.stream_id },
      ]);
      if (subPath) {
        return subPath; // Return the path if it was found in subcontexts
      }
    }
  }
  // If we've searched all contexts and subcontexts and haven't found a match, return null
  return null;
}

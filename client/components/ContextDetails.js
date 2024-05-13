import Link from "next/link";
import { useContext } from "react";
import { GlobalContext, useGlobal } from "../contexts/Global";
import { getPluginsByContext } from "../utils";

export default function ContextDetails({ context }) {
  const { slot } = useGlobal();
  return (
    <div className="flex flex-row bg-white px-4 py-3 border border-slate-200 rounded-md items-center">
      {/** Show context logo if any */}
      {context.logo && (
        <img
          src={context.logo}
          alt={context.name}
          className="h-14 w-14 flex-shrink-0 mr-3 rounded-md"
        />
      )}
      <div className="flex flex-col space-y-1">
        <Link
          className="text-[#4483FD] font-medium text-base hover:underline"
          href={"/contexts/" + context.stream_id}
        >
          {context.name}
        </Link>
        <SubContextsCountTag context_id={context.stream_id} />
      </div>
    </div>
  );
}

export const ContextTags = ({ context }) => {
  return (
    <div className="flex flex-row">
      <SubContextsCountTag context_id={context.stream_id} />
      <PluginsCountTag context_id={context.stream_id} />
    </div>
  );
};

export const SubContextsCountTag = ({ context_id }) => {
  return (
    <div className="bg-slate-100 rounded-full px-3 py-1 text-xs font-medium text-slate-800 mr-1">
      {countSubContexts(context_id)} sub-context(s)
    </div>
  );
};

export const PluginsCountTag = ({ context_id }) => {
  return (
    <div className="bg-slate-100 rounded-full px-3 py-1 text-xs font-medium text-slate-800">
      {countPluginsByContext(context_id)} plugin(s)
    </div>
  );
};

/** Count all of the plugins being used by a context */
export const countPluginsByContext = (contextId) => {
  const { settings } = useContext(GlobalContext);

  let results = getPluginsByContext(contextId, settings.plugins);
  console.log("results:", results);
  let countDirect = results.direct.length;
  let countParent = results.parent.length;
  let countTotal = countDirect + countParent;

  return countTotal;
};

/** Count all of the child of a context including the nested ones */
export const countSubContexts = (stream_id, contexts) => {
  const { settings } = useContext(GlobalContext);

  let _contexts;
  if (contexts) {
    _contexts = contexts;
  } else {
    _contexts = settings.contexts;
  }

  // Recursive function to find a context by its stream_id
  const findContext = (id, ctxs) => {
    if (ctxs) {
      for (let ctx of ctxs) {
        if (ctx.stream_id === id) return ctx;
        if (ctx.contexts) {
          const found = findContext(id, ctx.contexts);
          if (found) return found;
        }
      }
    }

    return null;
  };

  // Use the recursive function to find the context with the given stream_id
  const context = findContext(stream_id, _contexts);

  // If the context is not found or has no sub-contexts, return 0
  if (!context || !context.contexts || context.contexts.length === 0) return 0;

  // Count the immediate sub-contexts
  let count = context.contexts.length;

  // Recursively count the sub-contexts of each sub-context
  for (let subContext of context.contexts) {
    count += countSubContexts(subContext.stream_id, context.contexts);
  }

  return count;
};

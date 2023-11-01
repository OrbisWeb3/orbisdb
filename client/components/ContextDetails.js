import Link from 'next/link';
import { useContext } from "react";
import { GlobalContext } from "../contexts/Global";

export default function ContextDetails({context}) {
  return(
    <div className="flex flex-row bg-white px-4 py-3 border border-slate-200 rounded-md items-center">
      {/** Show context logo if any */}
      {context.logo &&
        <img
          src={context.logo}
          alt={context.name}
          className="h-14 w-14 flex-shrink-0 mr-3 rounded-md" />
        }
      <div className="flex flex-col space-y-1">
        <Link className="text-[#4483FD] font-medium text-base hover:underline" href={"/contexts/" + context.stream_id}>{context.name}</Link>
        <ContextTags context={context} />
      </div>
    </div>
  )
}


export const ContextTags = ({context}) => {
  return(
    <div className="flex flex-row">
      <div className="bg-slate-100 rounded-full px-3 py-1 text-xs font-medium text-slate-800 mr-1">{countSubContexts(context.stream_id) } sub-context</div>
      <div className="bg-slate-100 rounded-full px-3 py-1 text-xs font-medium text-slate-800">{context.plugins ? context.plugins.length : "0" } plugins</div>
    </div>
  )
}

/** Count all of the child of a context including the nested ones */
export const countSubContexts = (stream_id, contexts) => {
  const { settings } = useContext(GlobalContext);

  let _contexts;
  if(contexts) {
    _contexts = contexts;
  } else {
    _contexts = settings.contexts;
  }

  // Recursive function to find a context by its stream_id
  const findContext = (id, ctxs) => {
    for (let ctx of ctxs) {
      if (ctx.stream_id === id) return ctx;
      if (ctx.contexts) {
        const found = findContext(id, ctx.contexts);
        if (found) return found;
      }
    }
    return null;
  }

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

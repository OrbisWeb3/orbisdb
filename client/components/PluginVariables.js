import React, { useState, useEffect, useContext } from "react";

export default function LoopPluginVariables({variables, defaultVariables, per_context}) {
  return variables?.map((variable, key) => {
    return (
        <PluginVariable variable={variable} defaultVariables={defaultVariables} per_context={per_context} key={key} />
    );
  });
}

const PluginVariable = ({variable, defaultVariables, per_context}) => {
  const [val, setVal] = useState(defaultVariables ? defaultVariables[variable.id] : "");

  /** Don't display the variable if it's a contextual variable */
  if(per_context == true) {
    if(!variable.per_context) {
      return null;
    }
  } else {
    if(variable.per_context) {
      return null;
    }
  }

  /** Return details variable */
  return(
    <div className="flex flex-col mb-4">
      <p className="text-base font-medium text-slate-900">{variable.name}:</p>
      {variable.description &&
        <p className="text-base text-slate-500">{variable.description}</p>
      }
      <input type="text" placeholder={variable.name} name={variable.id} value={val} onChange={(e) => setVal(e.target.value)} className="bg-white px-2 py-1 rounded-md border border-slate-300 text-base text-slate-900 mt-1" />
    </div>
  )

}

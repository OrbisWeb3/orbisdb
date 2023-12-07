import React, { useState, useEffect, useContext } from "react";

export default function LoopPluginVariables({variables, defaultVariables, per_context}) {
  const [variableValues, setVariableValues] = useState(defaultVariables);

  const handleVariableChange = (variableId, value) => {
    setVariableValues((prevValues) => ({
      ...prevValues,
      [variableId]: value,
    }));
  };

  return variables?.map((variable, key) => {
    return (
      <PluginVariable variable={variable} defaultVariables={defaultVariables} per_context={per_context} allVariables={variables} variableValues={variableValues} handleVariableChange={handleVariableChange} key={key} />
    );
  });
}

const PluginVariable = ({variable, defaultVariables, per_context, allVariables, variableValues, handleVariableChange}) => {

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

  /** If variable has conditions, let's check if they are met before displaying it */
  if (variable.conditions) {
    console.log("The variable " + variable.name + " has conditions, let's check if they are met.");
    let conditionsMet = true;
    for (let condition of variable.conditions) {
      console.log("condition:", condition);
      console.log("variableValues:", variableValues);
      if(!variableValues) {
        conditionsMet = false;
        break;
      } else if (variableValues[condition.id] !== condition.value) {
        conditionsMet = false;
        break;
      }
    }
    console.log("conditionsMet:", conditionsMet);
    if (!conditionsMet) {
      return null; // Do not render the input if conditions are not met
    }
  }

  /** Return details variable */
  return(
    <div className="flex flex-col mb-4">
      <p className="text-base font-medium text-slate-900">{variable.name}:</p>
      {variable.description &&
        <p className="text-base text-slate-500">{variable.description}</p>
      }
      <VariableInput variable={variable} val={variableValues ? variableValues[variable.id] : ""} setVal={(value) => handleVariableChange(variable.id, value)} />
    </div>
  )
}

const VariableInput = ({variable, val, setVal}) => {
  let input = <input type="text" placeholder={variable.name} name={variable.id} value={val} onChange={(e) => setVal(e.target.value)} className={`bg-white px-2 py-1 rounded-md border border-slate-300 text-base text-slate-900 mt-1 ${variable.private && "private-input"}`}  />;


  switch (variable.type) {
    case "array":
      input = <textarea placeholder={variable.name} name={variable.id} value={val} onChange={(e) => setVal(e.target.value)} className={`bg-white px-2 py-1 rounded-md border border-slate-300 text-base text-slate-900 mt-1 ${variable.private && "private-input"}`} />;
      break;
    case "object":
      input = <textarea placeholder={variable.name} name={variable.id} value={val} onChange={(e) => setVal(e.target.value)} className={`bg-white px-2 py-1 rounded-md border border-slate-300 text-base text-slate-900 mt-1 ${variable.private && "private-input"}`}  />;
      break;
    case "select":
      input = <select 
          name={variable.id} 
          value={val} 
          onChange={(e) => setVal(e.target.value)} 
          className={`bg-white px-2 py-1 rounded-md border border-slate-300 text-base text-slate-900 mt-1 ${variable.private && "private-input"}`}
        >
          <option value="" disabled>Select option</option>
          {variable.options.map((option, index) => (
            <option key={index} value={option.value}>{option.label}</option>
          ))}
        </select>;
      break;
  }
  return input;
}

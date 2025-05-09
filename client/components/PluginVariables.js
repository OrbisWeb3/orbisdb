import React, { useState, useEffect, useContext } from "react";
import AceEditor from "react-ace";
import "ace-builds/src-min-noconflict/mode-mysql";
import "ace-builds/src-noconflict/theme-sqlserver";
import "ace-builds/src-min-noconflict/ext-language_tools";
import ModelPicker from "./ModelPicker";
import Alert from "./Alert";

export default function LoopPluginVariables({
  variables,
  variableValues,
  handleVariableChange,
  per_context,
}) {
  return variables?.map((variable, key) => {
    return (
      <PluginVariable
        variable={variable}
        per_context={per_context}
        variableValues={variableValues}
        handleVariableChange={handleVariableChange}
        key={key}
      />
    );
  });
}

const PluginVariable = ({
  variable,
  per_context,
  variableValues,
  handleVariableChange,
}) => {
  /** Don't display the variable if it's a contextual variable */
  if (per_context == true) {
    if (!variable.per_context) {
      return null;
    }
  } else {
    if (variable.per_context) {
      return null;
    }
  }

  /** If variable has conditions, let's check if they are met before displaying it */
  if (variable.conditions) {
    let conditionsMet = true;
    for (let condition of variable.conditions) {
      if (!variableValues) {
        conditionsMet = false;
        break;
      } else if (variableValues[condition.id] !== condition.value) {
        conditionsMet = false;
        break;
      }
    }
    if (!conditionsMet) {
      return null; // Do not render the input if conditions are not met
    }
  }

  /** Return details variable */
  return (
    <div className="flex flex-col mb-4">
      <p className="text-base font-medium text-slate-900">{variable.name}:</p>
      {variable.description && (
        <p className="text-sm text-slate-500">{variable.description}</p>
      )}
      {variable.alert && (
        <Alert title={variable.alert} className="text-xs mt-1" />
      )}
      <VariableInput
        variable={variable}
        variableValues={variableValues}
        val={variableValues ? variableValues[variable.id] : ""}
        handleVariableChange={handleVariableChange}
      />
    </div>
  );
};

const VariableInput = ({
  variable,
  variableValues,
  val,
  handleVariableChange,
}) => {
  function setVal(value) {
    handleVariableChange(variable.id, value);
  }

  let input = (
    <input
      type="text"
      placeholder={variable.name}
      name={variable.id}
      value={val}
      onChange={(e) => setVal(e.target.value)}
      className={`bg-white px-2 py-1 rounded-md border border-slate-300 text-base text-slate-900 mt-1 ${variable.private && "private-input"}`}
    />
  );

  switch (variable.type) {
    case "model":
      input = (
        <>
          <ModelPicker value={val} setValue={setVal} />
        </>
      );
      break;
    case "textarea":
      input = (
        <textarea
          placeholder={variable.name}
          name={variable.id}
          value={val}
          onChange={(e) => setVal(e.target.value)}
          className={`bg-white px-2 py-1 rounded-md border border-slate-300 text-base text-slate-900 mt-1 ${variable.private && "private-input"}`}
        />
      );
      break;
    case "array":
      input = (
        <textarea
          placeholder={variable.name}
          name={variable.id}
          value={val}
          onChange={(e) => setVal(e.target.value)}
          className={`bg-white px-2 py-1 rounded-md border border-slate-300 text-base text-slate-900 mt-1 ${variable.private && "private-input"}`}
        />
      );
      break;
    case "object":
      input = (
        <textarea
          placeholder={variable.name}
          name={variable.id}
          value={val}
          onChange={(e) => setVal(e.target.value)}
          className={`bg-white px-2 py-1 rounded-md border border-slate-300 text-base text-slate-900 mt-1 ${variable.private && "private-input"}`}
        />
      );
      break;
    case "query":
      input = (
        <div className="sql_editor bg-white overflow-hidden rounded-md border border-slate-300 text-base text-slate-900 mt-1">
          <AceEditor.default
            id="editor"
            aria-label="editor"
            mode="mysql"
            theme="sqlserver"
            name={variable.id}
            width="100%"
            fontSize={13}
            minLines={8}
            maxLines={100}
            showPrintMargin={false}
            showGutter
            placeholder="Write your query here..."
            editorProps={{ $blockScrolling: true }}
            setOptions={{
              enableBasicAutocompletion: true,
              enableLiveAutocompletion: true,
              enableSnippets: true,
            }}
            value={val}
            onChange={(value) => setVal(value)}
            showLineNumbers
          />
        </div>
      );
      break;
    case "select":
      input = (
        <select
          name={variable.id}
          value={val}
          onChange={(e) => setVal(e.target.value)}
          className={`bg-white px-2 py-1 rounded-md border border-slate-300 text-base text-slate-900 mt-1 ${variable.private && "private-input"}`}
        >
          <option value="" disabled>
            Select option
          </option>
          {variable.options.map((option, index) => (
            <option key={index} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      );
      break;
    case "select_custom_event":
      input = (
        <SelectCustomEvent
          variable={variable}
          variableValues={variableValues}
          val={val}
          setVal={setVal}
        />
      );
      break;
    case "cron":
      input = <CronInput val={val} setVal={setVal} />;
      break;
  }
  return input;
};

/** Custom smart contract event selection */
const SelectCustomEvent = ({ variable, variableValues, val, setVal }) => {
  const [events, setEvents] = useState([]);
  useEffect(() => {
    console.log("variableValues:", variableValues);

    if (variableValues?.contract_abi) {
      try {
        let abi = JSON.parse(variableValues.contract_abi);
        console.log("abi:", abi);
        const _events = abi.filter((item) => item.type === "event");
        console.log("events:", _events);
        setEvents(_events);
        if (_events && _events.length > 0) {
          setVal(_events[0].name);
        }
      } catch (e) {
        console.log("Error parsing ABI:", e);
        setEvents([]);
      }
    }
  }, [variableValues?.contract_abi]);
  return (
    <select
      name={variable.id}
      value={val}
      onChange={(e) => setVal(e.target.value)}
      className={`bg-white px-2 py-1 rounded-md border border-slate-300 text-base text-slate-900 mt-1 ${variable.private && "private-input"}`}
    >
      <option value="" disabled>
        Select event name
      </option>
      {events &&
        events.map((event, index) => (
          <option key={index} value={event.name}>
            {event.name}
          </option>
        ))}
    </select>
  );
};

/** Custom Cron Input components */
const CronInput = ({ val, setVal }) => {
  const [min, setMin] = useState("*");
  const [hour, setHour] = useState("*");
  const [dayMonth, setDayMonth] = useState("*");
  const [mo, setMonth] = useState("*");
  const [dayWeek, setDayWeek] = useState("*");

  // Cron options
  let minutes = [
    0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20,
    21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39,
    40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58,
    59,
  ];
  let hours = [
    0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20,
    21, 22, 23,
  ];
  let days_month = [
    1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21,
    22, 23, 24, 25, 26, 27, 28, 29, 30, 31,
  ];
  let months = [
    { value: 1, label: "January" },
    { value: 2, label: "February" },
    { value: 3, label: "March" },
    { value: 4, label: "April" },
    { value: 5, label: "May" },
    { value: 6, label: "June" },
    { value: 7, label: "July" },
    { value: 8, label: "August" },
    { value: 9, label: "September" },
    { value: 10, label: "October" },
    { value: 11, label: "November" },
    { value: 12, label: "December" },
  ];
  let days_week = [
    { value: 0, label: "Sunday" },
    { value: 1, label: "Monday" },
    { value: 2, label: "Tuesday" },
    { value: 3, label: "Wed." },
    { value: 4, label: "Thursday" },
    { value: 5, label: "Friday" },
    { value: 6, label: "Saturday" },
  ];

  useEffect(() => {
    if (val) {
      const [newMin, newHour, newDayMonth, newMonth, newDayWeek] =
        val.split(" ");
      setMin(newMin);
      setHour(newHour);
      setDayMonth(newDayMonth);
      setMonth(newMonth);
      setDayWeek(newDayWeek);
    }
  }, []);

  useEffect(() => {
    setVal(`${min} ${hour} ${dayMonth} ${mo} ${dayWeek}`);
  }, [min, hour, dayMonth, mo, dayWeek]);

  return (
    <div className="flex flex-row items-center space-x-3 mt-2">
      {/** Minute dropdown select */}
      <div className="flex flex-col">
        <label className="text-xs text-slate-600 font-medium">Minutes</label>
        <select
          name="minute"
          value={min}
          onChange={(e) => setMin(e.target.value)}
          className={`bg-white px-1 py-2 rounded-md border border-slate-300 text-base text-slate-900 mt-1`}
        >
          <option value="*">*</option>
          {minutes.map((value, index) => (
            <option key={index} value={value}>
              {value}
            </option>
          ))}
        </select>
      </div>

      {/** Hours dropdown select */}
      <div className="flex flex-col">
        <label className="text-xs text-slate-600 font-medium">Hours</label>
        <select
          name="hour"
          value={hour}
          onChange={(e) => setHour(e.target.value)}
          className={`bg-white px-1 py-2 rounded-md border border-slate-300 text-base text-slate-900 mt-1`}
        >
          <option value="*">*</option>
          {hours.map((value, index) => (
            <option key={index} value={value}>
              {value}
            </option>
          ))}
        </select>
      </div>

      {/** Day in the month dropdown select */}
      <div className="flex flex-col">
        <label className="text-xs text-slate-600 font-medium">
          Day (month)
        </label>
        <select
          name="day_month"
          value={dayMonth}
          onChange={(e) => setDayMonth(e.target.value)}
          className={`bg-white px-1 py-2 rounded-md border border-slate-300 text-base text-slate-900 mt-1`}
        >
          <option value="*">*</option>
          {days_month.map((value, index) => (
            <option key={index} value={value}>
              {value}
            </option>
          ))}
        </select>
      </div>

      {/** Month dropdown select */}
      <div className="flex flex-col">
        <label className="text-xs text-slate-600 font-medium">Month</label>
        <select
          name="month"
          value={mo}
          onChange={(e) => setMonth(e.target.value)}
          className={`bg-white px-1 py-2 rounded-md border border-slate-300 text-base text-slate-900 mt-1`}
        >
          <option value="*">*</option>
          {months.map((month, index) => (
            <option key={index} value={month.value}>
              {month.label}
            </option>
          ))}
        </select>
      </div>

      {/** Day / week select */}
      <div className="flex flex-col">
        <label className="text-xs text-slate-600 font-medium">Day (week)</label>
        <select
          name="day_week"
          value={dayWeek}
          onChange={(e) => setDayWeek(e.target.value)}
          className={`bg-white px-1 py-2 rounded-md border border-slate-300 text-base text-slate-900 mt-1`}
        >
          <option value="*">*</option>
          {days_week.map((day, index) => (
            <option key={index} value={day.value}>
              {day.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};

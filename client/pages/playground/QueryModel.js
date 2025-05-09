import { CodeEditor, Instructions } from ".";
import React, { useState, useEffect } from "react";
import Button from "../../components/Button";

/** Step 5: Query streams inserted in new model table */
const QueryModel = ({ modelId, tableName, setStep, orbisdb }) => {
  const [status, setStatus] = useState(0);
  const [data, setData] = useState([]);
  const [_tableName, setTableName] = useState(tableName);

  let queryCode = `const query = async () => {
    const results = await orbisdb.select()
      .from("${_tableName ? _tableName : "<TABLE_NAME>"}")
      .orderBy(["indexed_at", "desc"])
      .limit(10)
      .run();
    };`;

  const query = async () => {
    setStatus(1);
    let result;
    try {
      result = await orbisdb
        .select()
        .from(_tableName)
        .orderBy(["indexed_at", "desc"])
        .limit(10)
        .run();
      console.log("result:", result);
      if (result.rows) {
        setData(result.rows);
      }
      setStatus(2);
    } catch (e) {
      console.log("error querying stream:", e);
      alert("Error querying table.");
    }
  };

  return (
    <>
      <div className="flex w-full md:w-5/12 pb-6 md:pb-0 items-center flex-col">
        {/** Instructions */}
        <Instructions
          title="Step 5:"
          showBack={true}
          backAction={() => setStep(4.1)}
          description="Let's query the streams we just created with our model. "
        />

        {!tableName && (
          <div className="flex flex-col items-start mb-2 w-full pr-2">
            <div className="text-slate-600 text-sm mb-1">Table name:</div>
            <input
              type="text"
              placeholder="Table name"
              value={_tableName}
              onChange={(e) => setTableName(e.target.value)}
              className="flex-1 bg-white border border-slate-200 rounded-md shadow-sm px-3 py-1.5 text-sm font-medium text-slate-900 mb-2 w-full"
            />
          </div>
        )}

        {/** Display results */}
        {data && data.length > 0 && (
          <div className="flex flex-col space-y-2 mb-2">
            {data.map((item, key) => {
              item.stream_id = shortAddress(item.stream_id);
              item.controller = shortAddress(item.controller);
              item._metadata_context = item._metadata_context
                ? shortAddress(item._metadata_context)
                : "";
              return (
                <div
                  key={key}
                  className="bg-white border border-slate-200 w-full rounded-md px-3 py-1.5 text-xxs text-slate-900 mr-2 whitespace-pre-wrap font-mono"
                >
                  {JSON.stringify(item, null, 3)}:
                </div>
              );
            })}
          </div>
        )}

        {/** Query CTA */}
        <Button
          title="Query"
          onClick={() => query()}
          status={status}
          successTitle="Results returned"
        />
      </div>
      {/** Code */}
      <CodeEditor code={queryCode} className="w-full md:w-7/12" />
    </>
  );
};

export default QueryModel;

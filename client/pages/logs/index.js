import { useEffect, useState } from "react";
import { useGlobal } from "../../contexts/Global.js";
import Button from "../../components/Button.js";

export default function Logs() {
  const [logs, setLogs] = useState(false);
  const [currentLog, viewLog] = useState("");
  const [logData, setLogData] = useState(false);
  const { sessionJwt } = useGlobal();

  const exportLog = (log) => {
    const blob = new Blob([JSON.stringify(log, null, 4)], {
      type: "text/json",
    });

    const link = document.createElement("a");

    link.download = log.id;
    link.href = window.URL.createObjectURL(blob);
    link.dataset.downloadurl = ["text/json", link.download, link.href].join(
      ":"
    );

    const evt = new MouseEvent("click", {
      view: window,
      bubbles: true,
      cancelable: true,
    });

    link.dispatchEvent(evt);
    link.remove();
  };

  const fetchLogs = async () => {
    try {
      const response = await fetch("/api/logs", {
        headers: {
          Authorization: `Bearer ${sessionJwt}`,
        },
      });

      if (!response.ok) {
        throw response.status;
      }

      const { level, logs } = await response.json();

      setLogs(logs);
    } catch (err) {
      setLogs({ error: err });
    }
  };

  const fetchLog = async (log) => {
    const response = await fetch(`/api/logs/${log}`, {
      headers: {
        Authorization: `Bearer ${sessionJwt}`,
      },
    });

    if (response.status !== 200) {
      return;
    }

    const logData = await response.json();

    // Sort logs from newest to oldest
    logData.logs.sort(
      (logA, logB) => new Date(logB.timestamp) - new Date(logA.timestamp)
    );

    setLogData(logData);
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  useEffect(() => {
    if (!currentLog) {
      return;
    }

    fetchLog(currentLog);
  }, [currentLog]);

  return (
    <>
      <div className="px-16 py-12 w-full">
        <h1 className="text-3xl font-bold text-slate-900">Node Logs</h1>
        {logs ? (
          logs.error ? (
            <div>Error occurred while loading logs: {logs.error}</div>
          ) : (
            <div className="flex mt-4">
              <select
                name="Current log"
                value={currentLog}
                onChange={(e) => viewLog(e.target.value)}
                className={`bg-white px-2 py-1 rounded-md border border-slate-300 text-base text-slate-900`}
              >
                <option value="" disabled>
                  Select a log
                </option>
                {logs.map((log) => (
                  <option key={log.id} value={log.id}>
                    {log.level}: {new Date(log.timestamp).toDateString()}
                  </option>
                ))}
              </select>
              {currentLog && (
                <div className="ml-2">
                  <Button
                    onClick={() => fetchLog(currentLog)}
                    title="Refresh log"
                    type="secondary"
                  ></Button>
                </div>
              )}
              {logData && logData.id === currentLog && (
                <div className="ml-2">
                  <Button
                    onClick={() => exportLog(logData)}
                    title="Export full log"
                    successTitle="Log successfully exported"
                  ></Button>
                </div>
              )}
            </div>
          )
        ) : (
          <h2>Loading logs...</h2>
        )}

        {logData && (
          <div className="mt-4">
            <table className="min-w-full divide-y-2 divide-gray-200 bg-white text-sm">
              <thead className="ltr:text-left rtl:text-right">
                <tr>
                  <th className="whitespace-nowrap px-4 py-2 font-medium text-gray-900">
                    Type
                  </th>
                  <th className="whitespace-nowrap px-4 py-2 font-medium text-gray-900">
                    Timestamp
                  </th>
                  <th className="whitespace-nowrap px-4 py-2 font-medium text-gray-900">
                    Message
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-200">
                {[...logData.logs].splice(0, 50).map((event, i) => (
                  <tr key={i + event.timestamp} className="odd:bg-gray-50">
                    <td className="whitespace-nowrap px-4 py-2 font-medium text-gray-900">
                      {event.level.toUpperCase()}
                    </td>
                    <td className="whitespace-nowrap px-4 py-2 text-gray-700">
                      {event.timestamp}
                    </td>
                    <td className="whitespace-nowrap px-4 py-2 text-gray-700 text-wrap">
                      {event.message}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}

import { useEffect, useState } from "react";
import { useGlobal } from "../../contexts/Global.js";
import Button from "../../components/Button.js";
import ReactTimeAgo from "react-time-ago";

export default function Logs() {
  const [logs, setLogs] = useState(false);
  const [currentLog, viewLog] = useState("");
  const [logData, setLogData] = useState(false);
  const { sessionJwt } = useGlobal();

  /*const exportLog = (log) => {
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
  };*/

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
      const selectedLog = logs.find((log) => log.level === "debug");

      /** Display logs available in dropdown */
      console.log("logs:", logs);
      setLogs(logs);

      /** Sellect latest log */
      viewLog(selectedLog.id);
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
    console.log("logData:", logData);
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
    console.log("currentLog:", currentLog);
    if (!currentLog) {
      return;
    }

    fetchLog(currentLog);
  }, [currentLog]);

  return (
    <>
      <div className="px-16 py-12 w-full">
        <h1 className="text-3xl font-bold text-slate-900">Node Logs</h1>
        {logs && logs.length > 0 ? (
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
            {/*logData && logData.id === currentLog && (
              <div className="ml-2">
                <Button
                  onClick={() => exportLog(logData)}
                  title="Export full log"
                  successTitle="Log successfully exported"
                ></Button>
              </div>
            )*/}
          </div>
        ) : (
          <h2>Loading logs...</h2>
        )}

        {logData && (
          <div className="mt-4">
            <table className="min-w-full divide-y divide-slate-300 text-sm">
              <thead className="ltr:text-left rtl:text-right">
                <tr>
                  <th className="whitespace-nowrap py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-slate-900 sm:pl-3">
                    Type
                  </th>
                  <th className="whitespace-nowrap py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-slate-900 sm:pl-3">
                    Message
                  </th>
                  <th className="whitespace-nowrap py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-slate-900 sm:pl-3">
                    Timestamp
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-200 bg-white">
                {[...logData.logs].splice(0, 50).map((event, i) => (
                  <tr key={i + event.timestamp} className="odd:bg-gray-50">
                    <td className="whitespace-nowrap px-4 py-2 font-semibold text-gray-900">
                      <EventLevel level={event.level} />
                    </td>
                    <td className="whitespace-nowrap text-xs px-4 py-2 text-gray-900 text-wrap">
                      {event.message}
                    </td>
                    <td className="whitespace-nowrap text-xxs px-4 py-2 text-slate-500">
                      <ReactTimeAgo date={event.timestamp} locale="en-US" />
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

const EventLevel = ({ level }) => {
  switch (level) {
    case "debug":
      return (
        <span class="inline-flex items-center rounded-md bg-gray-50 px-2 py-1 text-xs font-medium text-gray-700 ring-1 ring-inset ring-gray-600/20">
          {level.toUpperCase()}
        </span>
      );
    case "success":
      return (
        <span class="inline-flex items-center rounded-md bg-green-50 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20">
          {level.toUpperCase()}
        </span>
      );
    case "info":
      return (
        <span class="inline-flex items-center rounded-md bg-sky-50 px-2 py-1 text-xs font-medium text-sky-700 ring-1 ring-inset ring-sky-600/20">
          {level.toUpperCase()}
        </span>
      );
    case "error":
      return (
        <span class="inline-flex items-center rounded-md bg-red-50 px-2 py-1 text-xs font-medium text-red-700 ring-1 ring-inset ring-red-600/20">
          {level.toUpperCase()}
        </span>
      );
    default:
      return (
        <span class="inline-flex items-center rounded-md bg-amber-50 px-2 py-1 text-xs font-medium text-amber-700 ring-1 ring-inset ring-amber-600/20">
          {level.toUpperCase()}
        </span>
      );
  }
};

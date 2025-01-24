import React, { useState, useEffect } from "react";
import { useGlobal } from "../../contexts/Global";
import {
  LoadingCircle,
  TableIcon,
  ViewIcon,
  CaretDown,
  RefreshIcon,
  FilterIcon,
  ArrowLeft,
  ArrowRight,
  AddIcon,
  PlayIcon,
  EyeIcon,
  CopyIcon,
  RelationsIcon,
} from "../../components/Icons";
import AddViewModal from "../../components/Modals/AddViewModal";
import Alert from "../../components/Alert";
import AceEditor from "react-ace";
import "ace-builds/src-min-noconflict/mode-mysql";
import "ace-builds/src-noconflict/mode-graphqlschema";
import "ace-builds/src-noconflict/theme-sqlserver";
import "ace-builds/src-min-noconflict/ext-language_tools";
import { cleanDidPath, copyToClipboard, getCleanTableName } from "../../utils";
import { ContextDropdown } from "../../components/Modals/AssignContext";
import { createGraphiQLFetcher } from "@graphiql/create-fetcher";
import { GraphiQL } from "graphiql";
import "graphiql/graphiql.css";
import ManageDataRelations from "../../components/Modals/ManageDataRelations";

export default function Data() {
  const { settings, sessionJwt, loadSettings } = useGlobal();
  const [addModalVis, setAddModalVis] = useState(false);
  const [selectedTable, setSelectedTable] = useState({
    id: "kh4q0ozorrgaq2mezktnrmdwleo1d",
  });
  const [selectedTableName, setSelectedTableName] = useState("models_indexed");
  const [data, setData] = useState([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [countTotalResults, setCountTotalResults] = useState();
  const [title, setTitle] = useState();
  const [schemaLoading, setSchemaLoading] = useState(false);
  const [tables, setTables] = useState([]);
  const [views, setViews] = useState([]);
  const [sqlValue, setSqlValue] = useState("");
  const [selectedContextIds, setSelectedContextIds] = useState(["global"]);
  const [isFKModalOpen, setIsFKModalOpen] = useState(false);

  /** Will be called on start to load the db schema */
  useEffect(() => {
    loadSettings(); // Will make sure we are using latest version of settings
    loadSchema();
  }, []);

  useEffect(() => {
    console.log("selectedContextIds:", selectedContextIds);
  }, [selectedContextIds]);

  /** Will be called everytime the selected table or page changes */
  useEffect(() => {
    if (selectedTable) {
      loadData();
      let currentTableName = getCleanTableName(settings, selectedTable?.id);
      setSelectedTableName(currentTableName);
    }
  }, [selectedTable, page, selectedContextIds]);

  /** Will load all of the tables and views available in the database */
  async function loadSchema() {
    setSchemaLoading(true);

    /** Will run custom query wrote by user */
    try {
      let rawResponse = await fetch("/api/db/schema", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${sessionJwt}`,
        },
      });

      const result = await rawResponse.json();
      console.log("result schema:", result);
      if (rawResponse.status === 200) {
        const fetchedTables = result.data
          .filter((item) => item.type === "TABLE")
          .map((item) => ({
            id: item.table_name,
            columns: item.columns.map((col) => ({
              name: col.column_name,
              dataType: col.data_type,
            })),
          }));

        const fetchedViews = result.data
          .filter((item) => item.type === "VIEW")
          .map((item) => ({
            id: item.table_name,
            viewDefinition: item.view_definition,
            columns: item.columns.map((col) => ({
              name: col.column_name,
              dataType: col.data_type,
            })),
          }));

        setSchemaLoading(false);
        setTables(fetchedTables);
        setViews(fetchedViews);
      } else {
        setSchemaLoading(false);
        setTables([]);
        setViews([]);
      }
    } catch (e) {
      console.log("Error querying db:", e);
      setSchemaLoading(false);
      setTables([]);
      setViews([]);
    }
  }

  async function loadData() {
    setLoading(true);
    const isView = views.some((view) => view.id === selectedTable.id);
    console.log("Is " + selectedTable.id + " a view?", isView);

    const requestBody = {
      table: selectedTable.id,
      page: page,
      context: selectedContextIds ? selectedContextIds[0] : "global",
      order_by_indexed_at: !isView.toString(),
    };

    try {
      let rawResponse = await fetch("/api/db/query/all", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${sessionJwt}`, // Assuming sessionJwt is available
        },
        body: JSON.stringify(requestBody),
      });
      const result = await rawResponse.json();
      console.log("data in loadData():", result);
      if (rawResponse.status == 200) {
        setLoading(false);
        setData(result);
        setCountTotalResults(result.totalCount); // Assuming you have a state to hold the total count
        setTitle(result.title);
      } else {
        resetResults(null); // Assuming resetResults handles unsuccessful fetches
      }
    } catch (e) {
      resetResults(e); // Assuming resetResults handles exceptions
    }
  }

  function resetResults(e) {
    console.log("Error retrieving data:", e);
    setLoading(false);
    setData({ data: [], columns: [] });
    setCountTotalResults(0);
    setTitle(null);
  }

  function selectTable(table) {
    setPage(1);
    setSelectedTable(table);
  }

  function viewDefinition(viewName, query) {
    console.log("Enter viewDefinition with query: ", query);
    setSelectedTable({ id: "sql_editor" });

    const fullQuery = `CREATE OR REPLACE VIEW ${viewName} AS\n${query}`;

    setSqlValue(fullQuery);
  }

  return (
    <>
      <div className="flex flex-row w-full flex-1 overflow-hidden">
        {/** Table navigation */}
        <div className="w-[250px] bg-slate-50 h-full px-4 overflow-y-scroll border-r border-slate-200">
          {/** List all contexts 
          <p className="font-medium text-xxs flex flex-row items-center space-x-1 mt-4 mb-0.5 text-slate-600">
            CONTEXTS
          </p>*/}
          {/**<div className="flex flex-col">
             Select the parent context you want to use here 
            {selectedContextIds && selectedContextIds.length >= 1 ? (
              <>
                {[...selectedContextIds, {}].map((context, index) => (
                  <ContextDropdown
                    index={index}
                    size="xs"
                    showGlobal={true}
                    selectedContext={context}
                    selectedContextIds={selectedContextIds}
                    setSelectedContextIds={setSelectedContextIds}
                  />
                ))}
              </>
            ) : (
              <ContextDropdown
                selectedContextIds={selectedContextIds}
                size="xs"
                showGlobal={true}
                setSelectedContextIds={setSelectedContextIds}
              />
            )}
          </div>*/}

          {/** Manage SQL editor */}
          <p className="font-medium text-xxs flex flex-row items-center space-x-1 mt-3 mb-1 text-slate-600">
            EDITOR
          </p>
          <p className="text-xxs flex flex-row items-center space-x-1 mb-3 text-slate-500">
            Perform custom queries using GraphQL or SQL or create views.
          </p>
          <div className="flex justify-center pb-4">
            <div
              className="flex bg-[#4483FD] text-xxs text-white px-3 py-0.5 opacity-90 hover:opacity-100 cursor-pointer items-center rounded-full space-x-1 font-mono"
              onClick={() => setSelectedTable({ id: "sql_editor" })}
            >
              <span>Open Editor</span>
            </div>
          </div>

          {/** List all tables */}
          <p className="font-medium text-xxs flex flex-row items-center space-x-1 mb-2 text-slate-600">
            TABLES
          </p>
          <div className="flex flex-col space-y-2">
            {schemaLoading ? (
              <div className="px-3 py-2 text-slate-500 flex flex-row text-slate-600 space-x-2 font-mono text-[12px]">
                <LoadingCircle />
                <span>Loading tables</span>
              </div>
            ) : (
              <TablesListNav
                selectedTable={selectedTable}
                items={tables}
                select={selectTable}
                type="tables"
              />
            )}
          </div>

          {/** List all views */}
          <div className="font-medium text-xxs flex flex-row items-center space-x-1 mt-8 mb-2 text-slate-600">
            <span className="flex flex-1">VIEWS</span>
          </div>
          <div className="flex flex-col space-y-2 pb-8">
            {schemaLoading ? (
              <div className="px-3 py-2 text-slate-500 flex flex-row text-slate-600 space-x-2 font-mono text-[12px]">
                <LoadingCircle />
                <span>Loading views</span>
              </div>
            ) : (
              <TablesListNav
                selectedTable={selectedTable}
                items={views}
                select={selectTable}
                type="views"
              />
            )}
          </div>
        </div>

        {/** Display selected table content */}
        <div className="flex flex-1 flex-col bg-white h-full overflow-y-scroll">
          <Content
            selectedTable={selectedTable}
            selectedTableName={selectedTableName}
            refresh={loadData}
            title={title}
            countResults={data ? data.length : 0}
            countTotalResults={countTotalResults}
            page={page}
            setPage={setPage}
            loading={loading}
            data={data}
            sqlValue={sqlValue}
            setSqlValue={setSqlValue}
            viewDefinition={viewDefinition}
            setIsFKModalOpen={setIsFKModalOpen}
          />
        </div>
      </div>

      {/** Will display the add context modal */}
      {addModalVis && <AddViewModal hide={() => setAddModalVis(false)} />}

      {/** Will display the modal to add a new foreign key */}
      {isFKModalOpen && (
        <ManageDataRelations
          isOpen={isFKModalOpen}
          selectedTable={selectedTable}
          selectedTableName={selectedTableName}
          onClose={() => setIsFKModalOpen(false)}
          schema={{ tables: tables }}
        />
      )}
    </>
  );
}

/** Display correct content based on the internal data navigation */
const Content = (props) => {
  switch (props.selectedTable?.id) {
    /** Create a new view */
    case "sql_editor":
      return <Editor {...props} />;
    /** Show selected table */
    default:
      return (
        <>
          <TableCTAs {...props} />
          <TableData
            {...props}
            sqlResult={{
              columns: props?.data?.columns,
              data: props?.data?.data,
            }}
          />
        </>
      );
  }
};

const Editor = (props) => {
  const [type, setType] = useState("graphql");
  const { isShared, adminSession, baseUrl } = useGlobal();
  const url = getEndpointUrl();

  function getEndpointUrl() {
    let _url;
    if (isShared) {
      _url = `${baseUrl}/${cleanDidPath(adminSession)}/graphql`;
    } else {
      _url = `${baseUrl}/global/graphql`;
    }
    return _url;
  }

  const EndpointUrl = () => {
    return (
      <button
        className="bg-slate-100 rounded-md hover:bg-slate-200 px-2.5 py-0.5 space-x-1 flex flex-row items-center space-x-1.5"
        onClick={() => copyToClipboard(url)}
      >
        <span>{url}</span> <CopyIcon />
      </button>
    );
  };

  switch (type) {
    case "sql":
      return <SqlEditor type={type} setType={setType} {...props} />;
    case "graphql":
      return (
        <>
          <div className="w-full text-[12px] table-data -mt-px -ml-px font-mono px-2 p-2 justify-start flex flex-row space-x-2 items-center border-b border-slate-200">
            <Toggle type={type} setType={setType} />

            {/** Show create view CTAs */}
            <div className="flex flex-1 justify-end space-x-1 items-center">
              <div className="flex flex-row space-x-2 mr-5">
                <b>Endpoint</b>: <EndpointUrl />
              </div>
            </div>
          </div>
          <div className="flex flex-col w-full h-full font-mono text-[12px]">
            <div className="flex flex-1 w-full overflow-y-scroll sql_editor">
              <GraphiQLContent endpoint={url} />
            </div>
          </div>
        </>
      );
  }
};

const GraphiQLContent = ({ endpoint }) => {
  const fetcher = createGraphiQLFetcher({ url: endpoint });
  return <GraphiQL fetcher={fetcher} />;
};
const TableCTAs = ({
  selectedTableName,
  refresh,
  loading,
  page,
  setPage,
  countResults,
  countTotalResults,
  title,
  selectedTable,
  viewDefinition,
  setIsFKModalOpen,
}) => {
  function filter() {
    alert("Filters are coming soon.");
  }
  function previousPage() {
    if (page > 1) {
      setPage(page - 1);
    }
  }
  function nextPage() {
    if (countResults == 100) {
      setPage(page + 1);
    }
  }
  return (
    <div className="w-full text-[12px] table-data -mt-px -ml-px font-mono px-2 p-2 justify-start flex flex-row space-x-2 items-center sticky left-0">
      {loading ? (
        <button className="px-3 py-0.5 space-x-1 border border-transparent flex flex-row items-center w-full text-center justify-center">
          <LoadingCircle /> <span>Loading</span>
        </button>
      ) : (
        <>
          {/** Show table title of available */}
          {selectedTable && (
            <div className="flex flex-row space-x-1 ml-2">
              <div className="text-[14px] font-bold mr-2">
                {selectedTableName ? selectedTableName : selectedTable.id}
              </div>
              {selectedTableName && (
                <div className="text-[10px] border border-dashed border-slate-300 rounded-full px-3 py-0.5 bg-slate-50">
                  {selectedTable.id}
                </div>
              )}
            </div>
          )}

          {/** Show table CTAs */}
          <div className="flex flex-1 justify-end space-x-1 items-center">
            <div className="flex flex-row space-x-1 mr-3">
              {selectedTable && selectedTable.view_definition && (
                <button
                  className="bg-slate-100 rounded-md hover:bg-slate-200 px-3 py-0.5 space-x-1 flex flex-row items-center"
                  onClick={() =>
                    viewDefinition(
                      selectedTable.id,
                      selectedTable.view_definition
                    )
                  }
                >
                  <EyeIcon /> <span>View definition</span>
                </button>
              )}

              <button
                className="bg-slate-100 rounded-md hover:bg-slate-200 px-2.5 py-0.5 space-x-1.5 flex flex-row items-center"
                onClick={() => setIsFKModalOpen(true)}
              >
                <RelationsIcon /> <span>Manage relations</span>
              </button>

              <button
                className="bg-slate-100 rounded-md hover:bg-slate-200 px-2.5 py-0.5 space-x-1.5 flex flex-row items-center"
                onClick={refresh}
              >
                <RefreshIcon /> <span>Refresh</span>
              </button>
            </div>
            <div className="flex flex-row space-x-1 items-center">
              <div
                className={`bg-slate-100 rounded-md px-3 py-0.5 space-x-1 flex flex-row items-center select-none ${page == 1 ? "opacity-50 cursor-not-allowed" : "hover:bg-slate-200 cursor-pointer"}`}
                onClick={previousPage}
              >
                <ArrowLeft /> <span>Previous</span>
              </div>
              <div className="bg-white border border-slate-200 rounded-md px-3 py-0.5 space-x-1 flex flex-row items-center">
                {page}
              </div>
              <button
                className={`bg-slate-100 rounded-md hover:bg-slate-200 px-3 py-0.5 space-x-1 flex flex-row items-center ${countResults != 100 ? "opacity-50 cursor-not-allowed" : "hover:bg-slate-200 cursor-pointer"}`}
                onClick={nextPage}
              >
                <span>Next</span>
                <ArrowRight />
              </button>
              <span className="ml-2">{countTotalResults} records</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

/** Top rows for SQL Editor */
const SqlEditorCTAs = ({ runQuery, loading, type, setType }) => {
  return (
    <div className="w-full text-[12px] table-data -mt-px -ml-px font-mono px-2 p-2 justify-start flex flex-row space-x-2 items-center border-b border-slate-200">
      <Toggle type={type} setType={setType} />

      {/** Show create view CTAs */}
      <div className="flex flex-1 justify-end space-x-1 items-center">
        <div className="flex flex-row space-x-2 mr-5">
          {/**<button className="bg-slate-100 rounded-md hover:bg-slate-200 px-3 py-0.5 space-x-1 flex flex-row items-center">
            Create with AI
  </button>*/}
          {loading ? (
            <button
              className="bg-[#4483FD] rounded-md text-white px-3 py-0.5 space-x-2 flex flex-row items-center opacity-60"
              onClick={() => runQuery()}
            >
              <LoadingCircle /> <span>Running</span>
            </button>
          ) : (
            <button
              className="bg-[#4483FD] rounded-md opacity-90 hover:opacity-100 text-white px-3 py-0.5 space-x-2 flex flex-row items-center"
              onClick={() => runQuery()}
            >
              <PlayIcon /> <span>Run query</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

/** SQL Editor */
const SqlEditor = (props) => {
  const { sessionJwt } = useGlobal();
  const [loading, setLoading] = useState(false);
  const [sqlResult, setSqlResult] = useState();

  /** Will run custom query wrote by user */
  async function runQuery() {
    setLoading(true);
    console.log("Running query:", props.sqlValue);
    try {
      let rawResponse = await fetch("/api/db/query/raw", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${sessionJwt}`,
        },
        body: JSON.stringify({ query: props.sqlValue }),
      });
      const result = await rawResponse.json();
      console.log("data from custom query:", result);
      if (rawResponse.status == 200) {
        setLoading(false);
        setSqlResult(result);
      } else {
        setLoading(false);
        setSqlResult(null);
      }
    } catch (e) {
      setLoading(false);
      setSqlResult(null);
    }
  }

  return (
    <>
      <SqlEditorCTAs
        selectedTableName={props.selectedTableName}
        type={props.type}
        setType={props.setType}
        runQuery={runQuery}
        loading={loading}
      />
      <div className="flex flex-col w-full h-full font-mono text-[12px]">
        <div className="flex flex-1 w-full overflow-y-scroll sql_editor">
          <AceEditor.default
            id="editor"
            aria-label="editor"
            mode="sql"
            theme="sqlserver"
            name="editor"
            width="100%"
            fontSize={13}
            minLines={25}
            maxLines={100}
            showPrintMargin={false}
            showGutter
            placeholder="Write your SQL query here..."
            editorProps={{ $blockScrolling: true }}
            setOptions={{
              enableBasicAutocompletion: true,
              enableLiveAutocompletion: true,
              enableSnippets: true,
            }}
            value={props.sqlValue}
            onChange={(value) => props.setSqlValue(value)}
            showLineNumbers
          />
        </div>
        <div className="flex flex-1 w-full table-data -ml-px font-mono overflow-y-scroll border-t-4 border-slate-200">
          {loading ? (
            <div className="px-3 py-2 text-slate-500 flex flex-row text-slate-600 space-x-2">
              <LoadingCircle />
              <span>Loading results</span>
            </div>
          ) : (
            <>
              {sqlResult ? (
                <TableData sqlResult={sqlResult} showSuccessIfEmpty={true} />
              ) : (
                <div className="px-3 py-2 text-slate-500">
                  Results will be visible here...
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
};

const TableData = ({ sqlResult, showSuccessIfEmpty }) => {
  console.log("sqlResult in <TableData />:", sqlResult);

  // Function to extract headers (keys) from the columns in the data object
  const getHeaders = (data) => {
    if (!data || !data.columns || data.columns.length === 0) return [];
    return data.columns.map((column) => ({
      name: column.name,
      dataTypeID: column.dataTypeID,
    }));
  };

  // Generate table headers
  const headers = getHeaders(sqlResult);

  // Function to check if the item is an object or an array
  const isObjectOrArray = (item) => {
    return typeof item === "object" && item !== null;
  };

  // Display empty state if no results available
  if (sqlResult?.data && sqlResult?.data.length === 0) {
    // Show success state if no results are returned (useful after an SQL editor query)
    if (showSuccessIfEmpty) {
      if (sqlResult.error) {
        return (
          <div className="pt-4 w-full justify-center items-start flex border-t border-slate-200">
            <Alert
              color="red"
              title={"Error performing the query: " + sqlResult.error}
              className="font-mono text-[12px]"
            />
          </div>
        );
      } else {
        return (
          <div className="pt-4 w-full justify-center items-start flex border-t border-slate-200">
            <Alert
              color="green"
              title={"The query was successful but returned no results."}
              className="font-mono text-[12px]"
            />
          </div>
        );
      }
    }
  }

  // Display results table with data
  return (
    <>
      <table className="w-full text-[12px] table-data -mt-px -ml-px font-mono">
        <thead className="bg-slate-100">
          <tr className="font-medium">
            {headers.map((header, index) => (
              <th key={index} className="cursor-pointer hover:bg-slate-200">
                <span className="flex items-center justify-center space-x-1.5">
                  <span className="flex-1">{header.name}</span>{" "}
                  <span className="font-mono text-[10px] bg-white font-normal rounded-full border border-slate-200 px-2 py-0.5">
                    {pgTypeIDMapping[header.dataTypeID] || "custom"}
                  </span>
                  <CaretDown className="text-slate-500" />
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sqlResult?.data?.length > 0 ? (
            sqlResult.data.map((item, rowIndex) => (
              <tr key={rowIndex}>
                {headers.map((header, columnIndex) => {
                  const cellValue = item[header.name];
                  const displayValue = isObjectOrArray(cellValue)
                    ? JSON.stringify(cellValue)
                    : String(cellValue);
                  return (
                    <td
                      className={`hover:bg-slate-50 hover:opacity-100 cursor-pointer ${(cellValue === null && "opacity-25") || ""}`}
                      onClick={() => copyToClipboard(displayValue)}
                      key={columnIndex}
                    >
                      {displayValue}
                    </td>
                  );
                })}
              </tr>
            ))
          ) : (
            <tr>
              <td colspan={headers.length} className="border-transparent">
                <div className="py-6 px-24 max-w-lg">
                  <Alert
                    title={"There isn't any data in this table."}
                    className="font-mono text-[12px]"
                  />
                </div>
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </>
  );
};

/** Will render navigation for tables */
const TablesListNav = ({ selectedTable, select, items, type }) => {
  const Icon = () => {
    switch (type) {
      case "tables":
        return <TableIcon />;
      case "views":
        return <ViewIcon />;
      default:
    }
  };

  if (!items || items.length == 0) {
    return (
      <Alert
        title={"There aren't any " + type + " in your database."}
        className="font-mono text-[12px]"
      />
    );
  }

  return items.map((item, key) => {
    const { settings } = useGlobal();
    const tableName = getCleanTableName(settings, item.id);
    return (
      <div
        className={`text-[12px] flex flex-row items-center space-x-1 hover:underline cursor-pointer font-mono ${selectedTable?.id == item.id ? "text-[#4483FD] font-medium" : "text-slate-900"} `}
        onClick={() => select(item)}
        key={key}
      >
        <Icon />{" "}
        <span className="truncate flex-1">
          {tableName ? tableName : item.id}
        </span>
      </div>
    );
  });
};

const Toggle = ({ type, setType }) => {
  return (
    <div className="flex items-center text-xs font-normal mr-3">
      <span className="ml-2 mr-3 text-xxs" id="graphql-editor-label">
        <span
          className={`${type == "graphql" ? "font-bold text-active" : "text-slate-500"}`}
        >
          GraphQL
        </span>
      </span>
      <button
        type="button"
        className={`relative inline-flex h-6 w-11 px-0.5 items-center flex-shrink-0 cursor-pointer rounded-full bg-slate-50 border border-slate-200 hover:border-slate-400 transition-colors duration-200 ease-in-out ${type == "graphql" ? "justify-start" : "justify-end"}`}
        role="switch"
        aria-checked="false"
        aria-labelledby="annual-billing-label"
        onClick={() => setType(type == "graphql" ? "sql" : "graphql")}
      >
        <span
          aria-hidden="true"
          className="pointer-events-none inline-block h-5 w-5 translate-x-0 transform rounded-full bg-active shadow ring-0 transition duration-200 ease-in-out"
        ></span>
      </button>
      <span className="ml-3 text-xxs" id="sql-editor-label">
        <span
          className={`${type == "sql" ? "font-bold text-active" : "text-slate-500"}`}
        >
          SQL
        </span>
      </span>
    </div>
  );
};

const pgTypeIDMapping = {
  16: "bool",
  17: "bytea",
  18: "char",
  19: "name",
  20: "int8",
  21: "int2",
  23: "int4",
  25: "text",
  114: "json",
  142: "xml",
  194: "pg_node_tree",
  600: "point",
  601: "lseg",
  602: "path",
  603: "box",
  604: "polygon",
  700: "float4",
  701: "float8",
  705: "unknown",
  718: "circle",
  790: "money",
  829: "macaddr",
  869: "inet",
  650: "cidr",
  774: "macaddr8",
  1033: "aclitem",
  1042: "bpchar",
  1043: "varchar",
  1082: "date",
  1083: "time",
  1114: "timestamp",
  1184: "timestamptz",
  1186: "interval",
  1266: "timetz",
  1560: "bit",
  1562: "varbit",
  1700: "numeric",
  1790: "refcursor",
  2202: "regprocedure",
  2203: "regoper",
  2204: "regoperator",
  2205: "regclass",
  2206: "regtype",
  2950: "uuid",
  3220: "pg_lsn",
  3614: "tsvector",
  3615: "tsquery",
  3734: "regconfig",
  3769: "regdictionary",
  3802: "jsonb",
  4089: "jsonpath",
  2970: "txid_snapshot",
  2278: "pg_snapshot",
  4451: "pg_ndistinct",
  4532: "pg_dependencies",
  5017: "pg_mcv_list",
  325: "pg_type",
  199: "_json",
  3807: "_jsonb",
  1000: "_bool",
  1001: "_bytea",
  1002: "_char",
  1003: "_name",
  1005: "_int2",
  1006: "_int2vector",
  1007: "_int4",
  1008: "_regproc",
  1009: "_text",
  1028: "_oid",
  1016: "_int8",
  1021: "_float4",
  1022: "_float8",
  1014: "_bpchar",
  1015: "_varchar",
  1029: "_oidvector",
  1231: "_numeric",
  1017: "_point",
  1027: "_polygon",
  1034: "_aclitem",
  1040: "_macaddr",
  1041: "_inet",
  651: "_cidr",
  1182: "_date",
  1183: "_time",
  1185: "_timestamp",
  1187: "_timestamptz",
  1188: "_interval",
  1270: "_timetz",
  1561: "_bit",
  1563: "_varbit",
  2951: "_uuid",
  3221: "_pg_lsn",
};

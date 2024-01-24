import React, { useState, useEffect, useContext } from "react";
import Link from 'next/link';
import { GlobalContext } from "../../contexts/Global";
import { LoadingCircle, TableIcon, ViewIcon, CaretDown, RefreshIcon, FilterIcon, ArrowLeft, ArrowRight, AddIcon, PlayIcon, EyeIcon } from "../../components/Icons";
import AddViewModal from "../../components/Modals/AddViewModal";
import Alert from "../../components/Alert";
import AceEditor from "react-ace";
import "ace-builds/src-min-noconflict/mode-mysql";
import "ace-builds/src-noconflict/theme-sqlserver";
import "ace-builds/src-min-noconflict/ext-language_tools";

export default function Data() {
  const { settings } = useContext(GlobalContext);
  const [addModalVis, setAddModalVis] = useState(false);
  const [selectedTable, setSelectedTable] = useState({id: "models_indexed"});
  const [selectedTableModel, setSelectedTableModel] = useState("kh4q0ozorrgaq2mezktnrmdwleo1d");
  const [data, setData] = useState([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [countTotalResults, setCountTotalResults] = useState();
  const [title, setTitle] = useState();
  const [schemaLoading, setSchemaLoading] = useState(false);
  const [tables, setTables] = useState([]);
  const [views, setViews] = useState([]);
  const [sqlValue, setSqlValue] = useState("");

  /** Will be called on start to load the db schema */
  useEffect(() => {
    loadSchema();
  }, [])

  /** Will be called everytime the selected table or page changes */
  useEffect(() => {
    if(selectedTable) {
      loadData();
      let modelId = getTableModelId(selectedTable?.id);
      console.log("modelId:", modelId);
      setSelectedTableModel(modelId);
    }
  }, [selectedTable, page]);

  // Method to get the model ID for a human-readable table name
  function getTableModelId(tableName) {
    const modelsMapping = settings.models_mapping;
    for (const [id, name] of Object.entries(modelsMapping || {})) {
      if (name === tableName) {
        return id;
      }
    }
    return undefined;
  }

  /** Will load all of the tables and views available in the database */
  async function loadSchema() {
    setSchemaLoading(true);
    let query = `SELECT
      t.table_name,
      'TABLE' as type,
      NULL as view_definition
    FROM
      information_schema.tables t
    WHERE
      t.table_type = 'BASE TABLE'
      AND t.table_schema = 'public'

    UNION ALL

    SELECT
      v.table_name,
      'VIEW' as type,
      v.view_definition
    FROM
      information_schema.views v
    WHERE
      v.table_schema = 'public';`;

    /** Will run custom query wrote by user */
    console.log("Running query:", query);
    try {
      let result = await fetch("/api/db/query", {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ query: query })
      });
      result = await result.json();
      if (result.status == 200) {
        const fetchedTables = result.data.filter(item => item.type === 'TABLE').map(item => ({ id: item.table_name }));;
        const fetchedViews = result.data.filter(item => item.type === 'VIEW').map(item => ({ id: item.table_name, ...item }));;

        setSchemaLoading(false);
        setTables(fetchedTables);
        setViews(fetchedViews);
      } else {
        setSchemaLoading(false);
        setTables([]);
        setViews([]);
      }
    } catch (e) {

    }
  }

  async function loadData() {
    setLoading(true);
    try {
      let result = await fetch("/api/db/query-all/" + selectedTable.id + "/" + page);
      result = await result.json();
      console.log("data:", result);
      if (result.status == 200) {
        setLoading(false);
        setData(result.data);
        setCountTotalResults(result.totalCount); // Assuming you have a state to hold the total count
        setTitle(result.title);
      } else {
        resetResults(null);
      }
    } catch (e) {
      resetResults(e);
    }
  }

  function resetResults(e) {
    console.log("Error retrieving data:", e);
    setLoading(false);
    setData([]);
    setCountTotalResults(0);
    setTitle(null);
  }

  function selectTable(table) {
    setPage(1);
    setSelectedTable(table);
  }

  function viewDefinition(viewName, query) {
    console.log("Enter viewDefinition with query: ", query)
    setSelectedTable({id: "sql_editor"});

     const fullQuery = `CREATE OR REPLACE VIEW ${viewName} AS\n${query}`;

    setSqlValue(fullQuery);
  }

  return(
    <>
      <div className="flex flex-row w-full flex-1 overflow-hidden">
        {/** Table navigation */}
        <div className="w-[250px] bg-slate-50 h-full px-4 overflow-y-scroll border-r border-slate-299">
          {/** List all tables */}
          <p className="font-medium text-xxs flex flex-row items-center space-x-1 mt-4 mb-2 text-slate-600">TABLES</p>
          <div className="flex flex-col space-y-2">
            {schemaLoading ?
              <div className="px-3 py-2 text-slate-500 flex flex-row text-slate-600 space-x-2 font-mono text-[12px]"><LoadingCircle /><span>Loading tables</span></div>
            :
              <TablesListNav selectedTable={selectedTable} items={tables} select={selectTable} type="tables" />
            }

          </div>

          {/** List all views */}
          <div className="font-medium text-xxs flex flex-row items-center space-x-1 mt-8 mb-2 text-slate-600">
            <span className="flex flex-1">VIEWS</span>
          </div>
          <div className="flex flex-col space-y-2">
            {schemaLoading ?
              <div className="px-3 py-2 text-slate-500 flex flex-row text-slate-600 space-x-2 font-mono text-[12px]"><LoadingCircle /><span>Loading views</span></div>
            :
              <TablesListNav selectedTable={selectedTable} items={views} select={selectTable} type="views" />
            }
          </div>

          {/** Manage SQL editor */}
          <p className="font-medium text-xxs flex flex-row items-center space-x-1 mt-8 mb-1text-slate-600">SQL EDITOR</p>
          <p className="text-xxs flex flex-row items-center space-x-1 mb-3 text-slate-500">Perform custom queries or create views for your tables.</p>
          <div className="flex justify-center pb-8">
            <div className="flex bg-[#4483FD] text-xxs text-white px-3 py-0.5 opacity-90 hover:opacity-100 cursor-pointer items-center rounded-full space-x-1 font-mono" onClick={() => setSelectedTable({id: "sql_editor"})}><span>Open SQL Editor</span></div>
          </div>
        </div>

        {/** Display selected table content */}
        <div className="flex flex-1 flex-col bg-white h-full overflow-y-scroll">
          <Content
            selectedTable={selectedTable}
            selectedTableModel={selectedTableModel}
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
            viewDefinition={viewDefinition} />
        </div>
      </div>

      {/** Will display the add context modal */}
      {addModalVis &&
        <AddViewModal hide={() => setAddModalVis(false)} />
      }
    </>
  )
}

/** Display correct content based on the internal data navigation */
const Content = (props) => {
  switch (props.selectedTable?.id) {
    /** Create a new view */
    case "sql_editor":
      return(
        <SqlEditor {...props} />
      )
    /** Show selected table */
    default:
      return(
        <>
          <TableCTAs {...props} />
          <TableData {...props} />
        </>
      )
  }
}

const SqlEditorCTAs = ({ runQuery, loading }) => {
  return(
    <div className="w-full text-[12px] table-data -mt-px -ml-px font-mono px-2 p-2 justify-start flex flex-row space-x-2 items-center border-b border-slate-200">
      <div className="text-[14px] ml-2 font-bold mr-2">SQL Editor</div>

      {/** Show create view CTAs */}
      <div className="flex flex-1 justify-end space-x-1 items-center">
        <div className="flex flex-row space-x-2 mr-5">
          <button className="bg-slate-100 rounded-md hover:bg-slate-200 px-3 py-0.5 space-x-1 flex flex-row items-center">Create with AI</button>
          {loading ?
            <button className="bg-[#4483FD] rounded-md text-white px-3 py-0.5 space-x-2 flex flex-row items-center opacity-60" onClick={() => runQuery()}><LoadingCircle /> <span>Running</span></button>
          :
            <button className="bg-[#4483FD] rounded-md opacity-90 hover:opacity-100 text-white px-3 py-0.5 space-x-2 flex flex-row items-center" onClick={() => runQuery()}><PlayIcon /> <span>Run query</span></button>
          }
        </div>
      </div>
    </div>
  )
}

const TableCTAs = ({ selectedTableModel, refresh, loading, page, setPage, countResults, countTotalResults, title, selectedTable, viewDefinition }) => {
  function filter() {
    alert("Filters are coming soon.");
  }
  function previousPage() {
    if(page > 1) {
      setPage(page - 1);
    }
  }
  function nextPage() {
    if(countResults == 100) {
      setPage(page + 1);
    }
  }
  return(
    <div className="w-full text-[12px] table-data -mt-px -ml-px font-mono px-2 p-2 justify-start flex flex-row space-x-2 items-center">
      {loading ?
        <button className="px-3 py-0.5 space-x-1 border border-transparent flex flex-row items-center w-full text-center justify-center"><LoadingCircle /> <span>Loading</span></button>
      :
        <>
          {/** Show table title of available */}
          {selectedTable &&
            <div className="flex flex-row space-x-1 ml-2">
              <div className="text-[14px] font-bold mr-2">{selectedTable.id}</div>
              <div className="text-[10px] border border-dashed border-slate-300 rounded-full px-3 py-0.5 bg-slate-50">{selectedTableModel}</div>
            </div>
          }

          {/** Show table CTAs */}
          <div className="flex flex-1 justify-end space-x-1 items-center">
            <div className="flex flex-row space-x-1 mr-5">
              {(selectedTable && selectedTable.view_definition) &&
                <button className="bg-slate-100 rounded-md hover:bg-slate-200 px-3 py-0.5 space-x-1 flex flex-row items-center" onClick={() => viewDefinition(selectedTable.id, selectedTable.view_definition)}><EyeIcon /> <span>View definition</span></button>
              }
              <button className="bg-slate-100 rounded-md hover:bg-slate-200 px-3 py-0.5 space-x-1 flex flex-row items-center" onClick={refresh}><RefreshIcon /> <span>Refresh</span></button>
              <button className="bg-slate-100 rounded-md hover:bg-slate-200 px-3 py-0.5 space-x-1 flex flex-row items-center" onClick={filter}><FilterIcon /> <span>Filter</span></button>
            </div>
            <div className="flex flex-row space-x-1 items-center">
              <div className="mr-1">Page</div>
              <div className={`bg-slate-100 rounded-md px-3 py-0.5 space-x-1 flex flex-row items-center select-none ${page == 1 ? "opacity-50 cursor-not-allowed" : "hover:bg-slate-200 cursor-pointer" }`} onClick={previousPage}><ArrowLeft /> <span>Previous</span></div>
              <div className="bg-white border border-slate-200 rounded-md px-3 py-0.5 space-x-1 flex flex-row items-center">{page}</div>
              <button className={`bg-slate-100 rounded-md hover:bg-slate-200 px-3 py-0.5 space-x-1 flex flex-row items-center ${countResults != 100 ? "opacity-50 cursor-not-allowed" : "hover:bg-slate-200 cursor-pointer"}`} onClick={nextPage}><span>Next</span><ArrowRight /></button>
              <span className="ml-2">{countTotalResults} records</span>
            </div>
          </div>
        </>
      }
    </div>
  )
}

/** SQL Editor */
const SqlEditor = (props) => {
  const [loading, setLoading] = useState(false);
  const [sqlResults, setSqlResults] = useState();

  /** Will run custom query wrote by user */
  async function runQuery() {
    setLoading(true);
    console.log("Running query:", props.sqlValue);
    try {
      let result = await fetch("/api/db/query", {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ query: props.sqlValue })
      });
      result = await result.json();
      console.log("data from custom query:", result);
      if (result.status == 200) {
        setLoading(false);
        setSqlResults(result.data);
      } else {
        setLoading(false);
        setSqlResults([]);
      }
    } catch (e) {
      setLoading(false);
      setSqlResults([]);
    }
  }

  return(
    <>
      <SqlEditorCTAs selectedTableModel={props.selectedTableModel} runQuery={runQuery} loading={loading} />
        <div className="flex flex-col w-full h-full font-mono text-[12px]">
          <div className="flex flex-1 w-full overflow-y-scroll sql_editor">
            <AceEditor
              id="editor"
              aria-label="editor"
              mode="mysql"
              theme="sqlserver"
              name="editor"
              width="100%"
              fontSize={13}
              minLines={25}
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
              value={props.sqlValue}
              onChange={(value) => props.setSqlValue(value)}
              showLineNumbers
            />
          </div>
          <div className="flex flex-1 w-full table-data -ml-px font-mono overflow-y-scroll border-t-4 border-slate-200">
            {loading ?
              <div className="px-3 py-2 text-slate-500 flex flex-row text-slate-600 space-x-2"><LoadingCircle /><span>Loading results</span></div>
            :
              <>
                {sqlResults ?
                  <TableData data={sqlResults} showSuccessIfEmpty={true} />
                :
                  <div className="px-3 py-2 text-slate-500">Results will be visible here...</div>
                }
              </>
            }
          </div>
        </div>
    </>
  )
}

const TableData = ({ data, showSuccessIfEmpty }) => {
  // Function to extract headers (keys) from the first item in the data array
  const getHeaders = (data) => {
    if (data.length === 0) return [];
    return Object.keys(data[0]);
  };

  // Generate table headers
  const headers = getHeaders(data);

  // Will copy the cell data to the clipboard
  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      console.log('Text copied to clipboard');
    } catch (err) {
      console.error('Failed to copy: ', err);
    }
  };

  // Function to check if the item is an object or an array
  const isObjectOrArray = (item) => {
    return typeof item === 'object' && item !== null;
  };

  // Display empty state if no results available
  if(data && data.length == 0) {

    // Show success state if no results are returned (useful after an SQL editor query)
    if(showSuccessIfEmpty) {
      return(
        <div className="pt-4 w-full justify-center items-start flex border-t border-slate-200">
          <Alert color="green" title={"The query was successful but returned no results."} className="font-mono text-[12px]" />
        </div>
      )
    }

    // Show empty state if no success are returned
    else {
      return(
        <div className="pt-4 w-full justify-center items-start flex border-t border-slate-200">
          <Alert title={"There isn't any data in this table."} className="font-mono text-[12px]" />
        </div>
      )
    }
  }

  // Display results table with data
  return (
    <>
      <table className="w-full text-[12px] table-data -mt-px -ml-px font-mono">
        <thead className="bg-slate-100">
          <tr className="font-medium">
            {headers.map((header, index) => (
              <th key={index} className="cursor-pointer hover:bg-slate-200"><span className="flex items-center justify-center space-x-1"><span className="flex-1">{header}</span> <CaretDown className="text-slate-500" /></span></th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((item, rowIndex) => (
            <tr key={rowIndex}>
              {headers.map((header, columnIndex) => {
                const cellValue = item[header];
                const displayValue = isObjectOrArray(cellValue) ? JSON.stringify(cellValue) : cellValue;
                return (
                  <td className="hover:bg-slate-50 cursor-pointer" onClick={() => copyToClipboard(displayValue)} key={columnIndex}>{displayValue}</td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
};

/** Will render navigation for tables */
const TablesListNav = ({selectedTable, select, items, type}) => {

  const Icon = () => {
    switch (type) {
      case "tables":
        return(
          <TableIcon />
        );
      case "views":
        return(
          <ViewIcon />
        );
      default:

    }
  }

  if(!items || items.length == 0) {
    return(
      <Alert title={"There aren't any "+type+" in your database."} className="font-mono text-[12px]" />
    )
  }

  return items.map((item, key) => {
    return (
        <div className={`text-[12px] flex flex-row items-center space-x-1 hover:underline cursor-pointer font-mono ${selectedTable?.id == item.id ? "text-[#4483FD] font-medium" : "text-slate-900"} `} onClick={() => select(item)} key={key}>
          <Icon /> <span className="truncate flex-1">{item.name ? item.name : item.id}</span>
        </div>
    );
  });
}
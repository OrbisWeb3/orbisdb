import React, { useState, useEffect } from "react";
import Modal from ".";
import { useGlobal } from "../../contexts/Global";
import { getCleanTableName, setForeignKey, sleep, STATUS } from "../../utils";
import Button from "../Button";
import Alert from "../Alert";
import { ArrowRight } from "../Icons";

const ManageDataRelations = ({
  isOpen,
  onClose,
  schema,
  selectedTable,
  selectedTableName,
}) => {
  const { settings, setSettings, sessionJwt } = useGlobal();
  const [step, setStep] = useState(1);
  const [status, setStatus] = useState(STATUS.ACTIVE);
  const [relations, setRelations] = useState([]);
  const [selectedRelationIndex, setSelectedRelationIndex] = useState(null);
  const [columns, setColumns] = useState([]);
  const [selectedColumn, setSelectedColumn] = useState(null);
  const [referencedTable, setReferencedTable] = useState(null);
  const [referencedColumns, setReferencedColumns] = useState([]);
  const [selectedReferencedColumn, setSelectedReferencedColumn] =
    useState(null);
  const [referenceName, setReferenceName] = useState("");
  const [referencedType, setReferencedType] = useState("");

  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setColumns([]);
      resetFields();
    }
  }, [isOpen]);

  useEffect(() => {
    if (selectedTable) {
      const table = schema.tables.find((t) => t.id === selectedTable.id);
      setColumns(table ? table.columns : []);
      if (settings && settings.relations) {
        setRelations(
          settings.relations[selectedTable.id]
            ? settings.relations[selectedTable.id]
            : []
        );
      } else {
        setRelations([]);
      }
    }
  }, [selectedTable, schema, settings]);

  useEffect(() => {
    if (referencedTable) {
      const table = schema.tables.find((t) => t.id === referencedTable);
      setReferencedColumns(table ? table.columns : []);
    }
  }, [referencedTable, schema]);

  function resetFields() {
    setStatus(STATUS.ACTIVE);
    setSelectedRelationIndex(null);
    setSelectedColumn(null);
    setReferencedTable(null);
    setReferencedColumns([]);
    setSelectedReferencedColumn(null);
    setReferenceName("");
    setReferencedType("single");
  }

  const _setReferenceName = (name) => {
    // Define a regular expression to allow only alphanumeric characters
    const regex = /^[a-zA-Z0-9_]*$/;

    // Check if the value matches the regex
    if (regex.test(name)) {
      setReferenceName(name);
    } else {
      // Optionally, provide feedback or handle the invalid input scenario
      console.error("Invalid input: Only alphanumeric characters are allowed.");
    }
  };

  const saveNewForeignKey = async () => {
    if (
      !referenceName ||
      referenceName == "" ||
      !selectedColumn ||
      !referencedTable ||
      !selectedReferencedColumn
    ) {
      alert("All fields are required.");
      return;
    }
    setStatus(STATUS.LOADING);
    try {
      const relation = {
        table: selectedTable.id,
        column: selectedColumn,
        referenceName: referenceName,
        referencedTable: referencedTable,
        referencedColumn: selectedReferencedColumn,
        referencedType: referencedType,
      };

      const response = await fetch("/api/db/foreign-key", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${sessionJwt}`,
        },
        body: JSON.stringify(relation),
      });

      const result = await response.json();
      if (result.success) {
        setStatus(STATUS.SUCCESS);
        setSettings(result.settings);
        await sleep(2000);
        onClose();
      } else {
        console.log("Error setting foreign key: ", result);
        alert("Error setting foreign key: " + result.message);
      }
    } catch (error) {
      console.error("Error setting foreign key:", error);
      alert("An error occurred while setting the foreign key.");
    }
  };

  const updateExistingForeignKey = async () => {
    setStatus(STATUS.LOADING);
    try {
      const relation = {
        table: selectedTable.id,
        column: selectedColumn,
        referenceName: referenceName,
        referencedTable: referencedTable,
        referencedColumn: selectedReferencedColumn,
        referencedType: referencedType,
        index: selectedRelationIndex,
      };

      const response = await fetch("/api/db/foreign-key", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${sessionJwt}`,
        },
        body: JSON.stringify(relation),
      });

      const result = await response.json();
      if (result.success) {
        setStatus(STATUS.SUCCESS);
        setSettings(result.settings);
        await sleep(2000);
        onClose();
      } else {
        console.log("Error updating foreign key: ", result);
        alert("Error updating foreign key: " + result.message);
      }
    } catch (error) {
      console.error("Error updating foreign key:", error);
      alert("An error occurred while updating the foreign key.");
    }
  };

  const handleEditRelation = (index) => {
    const relation = relations[index];
    setSelectedRelationIndex(index);
    setSelectedColumn(relation.column);
    setReferenceName(relation.referenceName);
    setReferencedTable(relation.referencedTable);
    setSelectedReferencedColumn(relation.referencedColumn);
    setReferencedType(
      relation.referencedType ? relation.referencedType : "single"
    );
    setStep(2);
  };

  /** Will go to step 2 while making sure to disable the selected relation index */
  function goStepAddRelation() {
    console.log("enter goStepAddRelation");
    resetFields();
    setSelectedRelationIndex(null);
    setStep(2);
  }

  return (
    <Modal
      isOpen={isOpen}
      hide={onClose}
      title="Manage Relations"
      description="Those relations can then be used in your GraphQL queries."
      className="w-[500px]"
    >
      <div className="space-y-4 text-base">
        {step === 1 && (
          <div className="mt-4">
            {relations.length > 0 ? (
              <ul className="mb-2">
                {relations.map((relation, index) => (
                  <ExistingRelation
                    key={index}
                    index={index}
                    relation={relation}
                    handleEditRelation={handleEditRelation}
                  />
                ))}
              </ul>
            ) : (
              <Alert
                title="No relations found for the selected table."
                className="text-xs"
              />
            )}
            <div className="flex justify-center w-full mt-3">
              <Button
                title="Add New Relation"
                onClick={() => goStepAddRelation()}
              />
            </div>
          </div>
        )}
        {step === 2 && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Table
              </label>
              <select
                className={`bg-white px-2 py-1 rounded-md border border-slate-300 text-base text-slate-900 mt-1 w-full truncate`}
                value={selectedTable.id || ""}
                disabled={true}
              >
                <option value="" disabled>
                  Select a table
                </option>
                {schema.tables.map((table) => (
                  <TableOption key={table.id} id={table.id} />
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Column
              </label>
              <select
                className={`bg-white px-2 py-1 rounded-md border border-slate-300 text-base text-slate-900 mt-1 w-full truncate`}
                value={selectedColumn || ""}
                onChange={(e) => setSelectedColumn(e.target.value)}
                disabled={!selectedTable.id}
              >
                <option value="" disabled>
                  Select a column
                </option>
                {columns?.map((column) => (
                  <option key={column.name} value={column.name}>
                    {column.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Referenced Table
              </label>
              <select
                className={`bg-white px-2 py-1 rounded-md border border-slate-300 text-base text-slate-900 mt-1 w-full truncate`}
                value={referencedTable || ""}
                onChange={(e) => setReferencedTable(e.target.value)}
              >
                <option value="" disabled>
                  Select a referenced table
                </option>
                {schema.tables.map((table) => (
                  <TableOption key={table.id} id={table.id} />
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Referenced Column
              </label>
              <select
                className={`bg-white px-2 py-1 rounded-md border border-slate-300 text-base text-slate-900 mt-1 w-full truncate`}
                value={selectedReferencedColumn || ""}
                onChange={(e) => setSelectedReferencedColumn(e.target.value)}
                disabled={!referencedTable}
              >
                <option value="" disabled>
                  Select a referenced column
                </option>
                {referencedColumns?.map((column) => (
                  <option key={column.name} value={column.name}>
                    {column.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Reference name
              </label>
              <p className="text-slate-500 text-xs">
                The name of this reference in your GraphQL schema.
              </p>
              <input
                type="text"
                placeholder="Context name"
                className="bg-white w-full mt-2 px-2 py-1 rounded-md border border-slate-300 text-base text-slate-900"
                onChange={(e) => _setReferenceName(e.target.value)}
                value={referenceName}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Reference type
              </label>
              <p className="text-slate-500 text-xs">
                Use "Single" if the relation should return only one result or
                "List" if it should return an array.
              </p>
              <select
                className={`bg-white px-2 py-1 rounded-md border border-slate-300 text-base text-slate-900 mt-1 w-full truncate mb-1.5`}
                value={referencedType || ""}
                onChange={(e) => setReferencedType(e.target.value)}
              >
                <option value="" disabled>
                  Select a referenced type
                </option>
                <option value="single">Single</option>
                <option value="list">List</option>
              </select>
            </div>

            <div className="flex justify-end">
              <div className="flex flex-1 justify-start">
                <Button
                  type="secondary"
                  title="Back"
                  onClick={() => setStep(1)}
                />
              </div>

              {selectedRelationIndex !== null ? (
                <Button
                  status={status}
                  title="Update relation"
                  onClick={updateExistingForeignKey}
                  disabled={
                    !selectedTable ||
                    !selectedColumn ||
                    !referencedTable ||
                    !selectedReferencedColumn
                  }
                />
              ) : (
                <Button
                  status={status}
                  title="Add relation"
                  onClick={saveNewForeignKey}
                  disabled={
                    !selectedTable ||
                    !selectedColumn ||
                    !referencedTable ||
                    !selectedReferencedColumn
                  }
                />
              )}
            </div>
          </>
        )}
      </div>
    </Modal>
  );
};

const ExistingRelation = ({ index, relation, handleEditRelation }) => {
  const { settings } = useGlobal();
  let cleanRelTableName = getCleanTableName(settings, relation.table);
  let cleanRelRefTableName = getCleanTableName(
    settings,
    relation.referencedTable
  );
  console.log("relation:", relation);
  return (
    <li className="mb-2 flex justify-between items-center">
      <div className="flex flex-col flex-1">
        <div className="flex flex-row space-x-1.5 items-center">
          <span className="text-base font-medium">
            {relation.referenceName}
          </span>
          <span className="bg-slate-100 text-slate-900 rounded-full px-2.5 text-xxs font-medium">
            {!relation.referencedType || relation.referencedType == "single"
              ? "Single"
              : "List"}
          </span>
        </div>
        <span className="text-slate-600 text-xs flex flex-row items-center space-x-1.5">
          <span>
            {cleanRelTableName}.{relation.column}
          </span>{" "}
          <ArrowRight className="opacity-60" />{" "}
          <span>
            {cleanRelRefTableName}.{relation.referencedColumn}
          </span>
        </span>
      </div>
      <Button
        type="secondary"
        title="Edit"
        onClick={() => handleEditRelation(index)}
      />
    </li>
  );
};

const TableOption = ({ id }) => {
  const { settings } = useGlobal();
  let tableName = getCleanTableName(settings, id);

  return <option value={id}>{tableName ? tableName : id}</option>;
};

export default ManageDataRelations;

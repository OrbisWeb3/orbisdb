import React, { useState, useEffect, useContext } from "react";
import ConfigurationSettings from "../components/Settings";

export default function Settings() {
 return(
    <div className="flex justify-center">
        <div className="w-1/3 flex flex-col mt-12 bg-white border border-slate-200 p-6 rounded-md">
            <ConfigurationSettings />
        </div>
    </div>
 )
}
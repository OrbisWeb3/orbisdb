import React, { useState, useEffect, useContext } from "react";
import Link from "next/link";
import { useGlobal } from "../../contexts/Global";
import RightSideContainer from "../../components/RightSideContainer";

export default function Plugins() {
  const { sessionJwt } = useGlobal();
  const [plugins, setPlugins] = useState([]);

  useEffect(() => {
    loadPlugins();
    async function loadPlugins() {
      try {
        let rawResponse = await fetch("/api/plugins", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${sessionJwt}`,
          },
        });
        const result = await rawResponse.json();
        console.log("plugins:", result);
        if (rawResponse.status == 200) {
          setPlugins(result.plugins);
        } else {
          console.log("Error retrieving plugins available.");
        }
      } catch (e) {
        console.log("Error retrieving plugins available:", e);
      }
    }
  }, []);

  return (
    <div className="px-16 py-12 flex flex-row">
      <div className="w-2/3 pr-4">
        <h1 className="text-3xl font-bold text-slate-900 flex flex-row items-center">
          <span>Plugins</span>{" "}
          <span className="bg-blue-50 border border-dashed border-blue-200 px-3 py-1 text-sm rounded-full font-medium ml-3 text-blue-900">
            Experimental
          </span>
        </h1>
        <p className="text-slate-600 mt-1 text-base">
          Plugins can be used to extend OrbisDB's capabilities. Select the
          plugins you would like to use here.
        </p>
        <div className="grid grid-cols-3 gap-4 mt-4 items-start">
          <LoopPlugins plugins={plugins} />
        </div>
      </div>

      {/** Show RightSide */}
      <RightSideContainer showSetup={false} showPlugins={true} />
    </div>
  );
}

const LoopPlugins = ({ plugins }) => {
  return plugins.map((plugin, key) => {
    if (plugin.visible == false) {
      return null;
    }
    return (
      <div
        className="flex flex-col items-center bg-white px-4 py-3 border border-slate-200 rounded-md"
        key={key}
      >
        {/** Optional plugin logo */}
        {plugin.logo && (
          <Link href={"/plugins/" + plugin.id}>
            <img src={plugin.logo} className="h-12 w-12 rounded-md mb-1" />
          </Link>
        )}

        <Link
          className="text-[#4483FD] text-center font-medium text-base hover:underline"
          href={"/plugins/" + plugin.id}
        >
          {plugin.name}
        </Link>
        <div className="text-slate-500 text-base text-center">
          {plugin.description}
        </div>
        <div className="mt-2 flex flex-row flex-wrap justify-center space-x-2">
          {/** Display hooks used by this plugin */}
          {plugin.hooks &&
            plugin.hooks.map((hook, index) => (
              <div
                className="bg-slate-100 rounded-full px-3 py-1 text-xs font-medium text-slate-800"
                key={index}
              >
                {hook}
              </div>
            ))}
        </div>
      </div>
    );
  });
};

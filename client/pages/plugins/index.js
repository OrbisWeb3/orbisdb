import React, { useState, useEffect, useContext } from "react";
import Link from 'next/link';
import { GlobalContext } from "../../contexts/Global";
import { CheckIcon, CloseIcon, QuestionMarkIcon } from "../../components/Icons";
import AddModelModal from "../../components/Modals/AddModel";
import Button from "../../components/Button";

export default function Plugins() {
  const [addModalVis, setAddModalVis] = useState(false);

  return(
    <>
      <div className="px-16 py-12 w-2/3">
        <h1 className="text-3xl font-bold text-slate-900">Plugins</h1>
        <p className="text-slate-600 mt-1 text-base">Plugins can be used to extand the possibilities of Ceramic. Select the plugins you would like to use here.</p>
        <div className="grid grid-cols-3 gap-4 mt-4">
          <LoopPlugins />
        </div>
      </div>
    </>
  )
}

let pluginsAvailable = [
  {
    id: "openaimoderation",
    name: "Moderation with Open AI",
    description: "Use Open AI to the moderate the fields of your choice.",
    hooks: ["Validator"]
  },
  {
    id: "googleclassify",
    name: "Google Classify",
    description: "Classify your text with Google Natural Language API.",
    hooks: ["Enhancer"]
  },
  {
    id: "gitcoinpassport",
    name: "Gitcoin Passport",
    description: "Make your app sybil resistant by using Gitcoin Passport.",
    hooks: ["Validator", "Enhancer"]
  }
]

const LoopPlugins = () => {
  return pluginsAvailable.map((plugin, key) => {
    return (
        <div className="flex flex-col items-center space-x-2 bg-white px-4 py-3 border border-slate-200 rounded-md" key={key}>
          <Link className="text-[#4483FD] text-center font-medium text-base hover:underline" href={"/plugins/" + plugin.id}>{plugin.name}</Link>
          <div className="text-slate-500 text-base text-center">{plugin.description}</div>
          <div className="mt-2 flex flex-row flex-wrap justify-center">
            {/** Display hooks used by this plugin */}
            {plugin.hooks && plugin.hooks.map((hook, index) => (
              <div className="bg-slate-100 rounded-full px-3 py-1 text-xs font-medium text-slate-800 m-0.5" key={index}>
                {hook}
              </div>
            ))}
          </div>
        </div>
    );
  });
}

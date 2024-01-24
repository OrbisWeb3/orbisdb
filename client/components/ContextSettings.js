import { useContext, useState, useRef } from "react";
import Button from "./Button";
import { GlobalContext } from "../contexts/Global";
import { STATUS, sleep } from "../utils";

export default function ContextSettings ({context, setContext, callback, parentContext}) {
  const { orbisdb, settings, setSettings } = useContext(GlobalContext);
  const [status, setStatus] = useState(STATUS.ACTIVE);
  const [contextName, setContextName] = useState(context?.name ? context.name : "" );
  const [contextLogo, setContextLogo] = useState(context?.logo ? context.logo : null);
  const [contextLogoImg, setContextLogoImg] = useState(context?.logo ? context.logo : null);
  const [contextDescription, setContextDescription] = useState(context?.description ? context.description : "");
  const hiddenPfpInput = useRef(null);

  /** Will trigger the file upload for the context logo */
  async function selectLogo() {
    hiddenPfpInput.current.click();
  }

  // Function to handle file selection and update the logo preview
  const handleFileChange = (event) => {
    if (event.target.files && event.target.files[0]) {
      const i = event.target.files[0];
      setContextLogoImg(i);
      setContextLogo(URL.createObjectURL(i));
    }
  };

  /** Will update the context stream on Ceramic and save it locally */
  const uploadToServer = async (event) => {
    setStatus(STATUS.LOADING);
    /** Update Ceramic stream */
    let content = { ...context };
    console.log("Previous context:", content);
    content.name = contextName;
    content.description = contextDescription ? contextDescription : "";
    console.log("New context:", content);
    if(parentContext) {
      content.context = parentContext;
    }
    let res;

    /** Update if existing or create new context */
    if(context) {
      res = await orbis.updateContext(context.stream_id, content);
    } else {
      const insertStatement = orbisdb.insert("kjzl6hvfrbw6c7f831brdq6w5j7cd3d1rjsmqm23zpp9imsxpu859d59koykunx").value(content);
      res = await orbisdb.execute(insertStatement);
      content.stream_id = res.id;
    }
    console.log("res:", res);

    /** If successful update in local settings */
    if(res.id) {
      const body = new FormData();
      body.append("file", contextLogoImg);
      body.append("context", JSON.stringify(content));
      console.log("body:", body);
      const response = await fetch("/api/settings/add-context", {
        method: "POST",
        body
      });
      const data = await response.json();
      console.log("data:", data);
      if(data.status == 200) {
        /** Update context state */
        if(setContext) {
          setContext(data.context);
        }

        setSettings(data.settings);
        setStatus(STATUS.SUCCESS);
        await sleep(500);

        /** Run callback if available (can be used to hide modal) */
        if(callback) {
          callback(content);
        }
      } else {
        setStatus(STATUS.ERROR);
      }
    } else {
      setStatus(STATUS.ERROR);
      alert("There was an error updating the Ceramic stream.");
    }
  };

  return(
    <div className="flex flex-col">
      <input type="text" placeholder="Context name" className="bg-white w-full mt-2 px-2 py-1 rounded-md border border-slate-300 text-base text-slate-900 mb-1.5" onChange={(e) => setContextName(e.target.value)} value={contextName} />
      <textarea type="text" placeholder="Context description" rows="2" className="bg-white w-full px-2 py-1 rounded-md border border-slate-300 text-base text-slate-900 mb-2" onChange={(e) => setContextDescription(e.target.value)} value={contextDescription} />
      <div className="flex flex-row items-center space-x-2 mb-2">
        <p className="font-medium text-slate-900 text-base">Logo:</p>
        {contextLogo &&
          <img src={contextLogo} className="h-8 w-8 ml-2 rounded-md" />
        }
        <input
          ref={hiddenPfpInput}
          type="file"
          className="hidden"
          accept="image/png, image/jpeg, image/gif"
          onChange={handleFileChange} />
        <Button type="secondary" onClick={() => selectLogo()} title="Upload logo" />
      </div>

      {/** CTA to save updated context */}
      <div className="flex w-full justify-center mt-2">
        <Button title="Save" status={status} onClick={() => uploadToServer()} />
      </div>
    </div>
  )
}

import React, { useState, useEffect, useContext } from "react";
import Link from "next/link";
import { useGlobal } from "../contexts/Global";
import { LoadingCircle } from "../components/Icons";
import ContextDetails from "../components/ContextDetails";
import AddContextModal from "../components/Modals/AddContext";
import Button from "../components/Button";
import Alert from "../components/Alert";
import RightSideContainer from "../components/RightSideContainer";
import Script from "next/script";

export default function Contexts() {
  const { settings, isShared } = useGlobal();
  const [addModalVis, setAddModalVis] = useState(false);
  const [contexts, setContexts] = useState([]);
  const [loading, setLoading] = useState(false);

  function callback(context) {
    let _contexts = [context, ...contexts];
    console.log("_contexts:", _contexts);
    setContexts(_contexts);
  }

  return (
    <>
      <Script
        src="https://www.googletagmanager.com/gtag/js?id=G-FG6J6YEJE7"
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){window.dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', 'G-FG6J6YEJE7');
        `}
      </Script>
      <div className="flex flex-row px-16 py-12">
        {/** Left part */}
        <div className="w-2/3 pr-4">
          <h1 className="text-3xl font-bold text-slate-900">Contexts</h1>
          <p className="text-slate-600 mt-1 text-base">
            Contexts can be viewed as projects or applications and can be used
            to divide your work into multiple parts, each with its own set of
            rules.
          </p>
          <div className="flex flex-col mt-4">
            {loading ? (
              <div className="flex w-full justify-center">
                <LoadingCircle />
              </div>
            ) : (
              <>
                {settings.contexts && settings.contexts.length > 0 ? (
                  <div className="grid grid-cols-2 gap-4 items-start mb-4">
                    <LoopContexts />
                  </div>
                ) : (
                  <div className="flex justify-center w-full">
                    <Alert title="You haven't created any context yet." />
                  </div>
                )}
                <div className="flex flex-col w-full items-center">
                  <Button
                    type="primary"
                    onClick={() => setAddModalVis(true)}
                    title="+ Add context"
                  />
                </div>
              </>
            )}
          </div>
        </div>

        {/** Right part */}
        <RightSideContainer showContexts={true} />
      </div>

      {/** Will display the add context modal */}
      {addModalVis && (
        <AddContextModal
          hide={() => setAddModalVis(false)}
          callback={callback}
        />
      )}
    </>
  );
}

const LoopContexts = () => {
  const { settings } = useGlobal();
  return settings.contexts.map((context, key) => {
    return <ContextDetails context={context} key={key} />;
  });
};

import { CodeEditor, Instructions } from ".";

/** Step 0: Configure your OrbisDB object */
const ConfigurationStep = ({ setStep }) => {
  const nextStep = async () => {
    setStep(1);
  };

  return (
    <>
      <div className="w-full md:w-5/12 pb-6 md:pb-0">
        {/** Instructions */}
        <Instructions
          title="Configuration:"
          description="First of all you will have to import the OrbisDB libraries in your app and configure the OrbisDB and Ceramic settings."
          buttons={[
            {
              cta: "Next",
              action: () => nextStep(),
            },
          ]}
        />
      </div>

      {/** Code */}
      <CodeEditor code={configurationCode} className="w-full md:w-7/12" />
    </>
  );
};

let configurationCode = `import { OrbisDB } from "@useorbis/db-sdk";
import { OrbisEVMAuth } from "@useorbis/db-sdk/auth";

const orbisdb = new OrbisDB({
  ceramic: {
    gateway: "<CERAMIC_NODE_URL>",
  },
  nodes: [
    {
      gateway: "<ORBIS_DB_INSTANCE_URL>",
      // If using a shared node instead of a dedicated.
      env:  "<ENVIRONMENT_ID>" 
    },
  ],
});`;

export default ConfigurationStep;

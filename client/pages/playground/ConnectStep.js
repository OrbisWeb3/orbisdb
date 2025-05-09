import { CodeEditor, Instructions } from ".";
import { OrbisEVMAuth } from "@useorbis/db-sdk/auth";

/** Step 1: Getting the users to connect to Ceramic */
const ConnectStep = ({ setStep, orbisdb }) => {
  const connect = async () => {
    const auth = new OrbisEVMAuth(window.ethereum);
    /*if (await orbisdb.isUserConnected()) {
        return true;
      }*/

    const result = await orbisdb.connectUser({ auth });
    console.log(result);
    setStep(2);
  };

  return (
    <>
      <div className="w-full md:w-5/12 pb-6 md:pb-0">
        {/** Instructions */}
        <Instructions
          title="Step 1:"
          description="Now you can connect your wallet."
          buttons={[
            {
              cta: "Connect",
              action: () => connect(),
            },
          ]}
        />
      </div>
      {/** Code */}
      <CodeEditor code={connectCode} className="w-full md:w-7/12" />
    </>
  );
};

let connectCode = `const connect = async () => {
    const auth = new OrbisEVMAuth(window.ethereum);
    const result = await orbisdb.connectUser({ auth });
    console.log(result);
};`;

export default ConnectStep;

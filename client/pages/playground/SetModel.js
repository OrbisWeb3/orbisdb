import { Instructions } from ".";

/** Step 2: Getting users to create their own model */
const SetModel = ({ setStep }) => {
  const createModel = async () => {
    setStep(3.1);
  };

  const loadExistingModel = () => {
    setStep(3.2);
  };

  return (
    <>
      {/** Instructions */}
      <div className="w-full pb-6 md:pb-0">
        <Instructions
          title="Step 2:"
          description={
            <>
              Do you want to use an existing model on the network to start with
              existing data or do you want to create your own?
            </>
          }
          buttons={[
            {
              cta: "Create model",
              action: () => createModel(),
            },
            {
              cta: "Load existing model",
              action: () => loadExistingModel(),
            },
          ]}
        />
      </div>
    </>
  );
};

export default SetModel;

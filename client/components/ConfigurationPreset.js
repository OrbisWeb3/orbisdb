import Button from "./Button";
import { GovernanceIcon, SocialIcon } from "./Icons";

const ConfigurationPreset = ({ presets, setPresets, status, save }) => {
  /** Will enable or disable a prest on click */
  function enablePreset(type, enabled) {
    if (enabled) {
      // Add the new type if it's not already in the array to avoid duplicates
      setPresets((prevPresets) => {
        return prevPresets.includes(type)
          ? prevPresets
          : [...prevPresets, type];
      });
    } else {
      // Delete preset "type" from presets array
      setPresets((prevPresets) => {
        return prevPresets.filter((p) => p !== type);
      });
    }
  }

  return (
    <>
      <div className="mt-2">
        <label className="text-base font-medium text-center">
          Enable some presets:
        </label>
        <p className="text-sm text-slate-500 mb-2">
          Click on the presets you want to use in order to configure your
          instance to cover specific use cases immediately.
        </p>
        <div className="flex flex-row items-center space-x-2 mb-3">
          {/** Social preset */}
          <div
            className={`select-none rounded-xl border-2 h-24 w-24 items-center justify-center uppercase text-xxs font-medium flex flex-col cursor-pointer ${presets.includes("social") ? "border-[#4483FD] text-[#1e58f2]" : "border-slate-200 text-slate-600 hover:border-dashed hover:border-[#5a9eff]"}`}
            onClick={() => enablePreset("social", !presets.includes("social"))}
          >
            <SocialIcon />
            <span className="mt-1">Social</span>
          </div>
          {/** Governance preset */}
          <div
            className={`select-none rounded-xl border-2 h-24 w-24 items-center justify-center uppercase text-xxs font-medium flex flex-col cursor-pointer ${presets.includes("governance") ? "border-[#4483FD] text-[#1e58f2]" : "border-slate-200 text-slate-600 hover:border-dashed hover:border-[#5a9eff]"}`}
            onClick={() =>
              enablePreset("governance", !presets.includes("governance"))
            }
          >
            <GovernanceIcon />
            <span className="mt-1">Governance</span>
          </div>
        </div>
      </div>

      {/** Go to next step */}
      {save && (
        <div className="flex w-full justify-center">
          <Button title="Next" status={status} onClick={save} />
        </div>
      )}
    </>
  );
};

export default ConfigurationPreset;

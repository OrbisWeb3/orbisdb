import Link from "next/link";
import Alert from "./Alert";
import { useGlobal } from "../contexts/Global";
import { CopyIcon } from "./Icons";
import { copyToClipboard } from "../utils";

export default function RightSideContainer({
  showSetup = true,
  showContexts = false,
  showPlugins = false,
}) {
  return (
    <div className="w-1/3 flex flex-col space-y-3">
      {/** Will display some setup details */}
      {showSetup && <SetupDetails />}

      {/** Will display more details about what contexts are */}
      {showContexts && <ContextDetails />}

      {/** Will display more details about what plugins are */}
      {showPlugins && <PluginsDetails />}
    </div>
  );
}

const SetupDetails = () => {
  const { isShared, adminSession, baseUrl, settings } = useGlobal();

  return (
    <div className="rounded-md bg-white border border-slate-200 px-5 py-4 flex flex-col">
      <span className="font-medium text-base">Setup:</span>
      <p className="text-slate-600 text-xs">
        Here are some important variables you'll need when initializing the
        OrbisDB object using{" "}
        <Link
          className="hover:underline text-[#4483FD]"
          href={
            isShared
              ? "https://github.com/OrbisWeb3/db-sdk?tab=readme-ov-file#for-shared-instances"
              : "https://github.com/OrbisWeb3/db-sdk?tab=readme-ov-file#initialize-the-sdk"
          }
          target="_blank"
        >
          our SDK
        </Link>
        :
      </p>

      {/** Ceramic node URL */}
      <p className="flex flex-col mt-3 justify-start items-start space-y-1">
        <span className="font-medium text-xs">Ceramic Node URL:</span>
        <button
          className="bg-slate-50 border border-dashed hover:border-solid cursor-pointer border-slate-200 text-slate-600 px-2 py-1 rounded-full text-xxxs font-medium items-center flex flex-row space-x-1.5"
          onClick={() =>
            copyToClipboard(settings?.configuration?.ceramic?.node)
          }
        >
          <span>{settings?.configuration?.ceramic?.node}</span>
          <CopyIcon />
        </button>
      </p>

      {/** Displaying instance URL */}
      <p className="flex flex-col mt-3 justify-start items-start space-y-1">
        <span className="font-medium text-xs">OrbisDB Instance URL:</span>
        <button
          className="bg-slate-50 border border-dashed hover:border-solid cursor-pointer border-slate-200 text-slate-600 px-2 py-1 rounded-full text-xxxs font-medium items-center flex flex-row space-x-1.5"
          onClick={() => copyToClipboard(baseUrl)}
        >
          <span>{baseUrl}</span>
          <CopyIcon />
        </button>
      </p>

      {/** If is shared use our SDK */}
      {isShared && (
        <p className="flex flex-col mt-2 items-start mt-3 space-y-1">
          <span className="font-medium text-xs flex flex-row items-center space-x-2">
            <span>Environment ID:</span>{" "}
            <div className="bg-red-100 text-red-900 text-xxs px-3 py-0.5 rounded-full">
              Required
            </div>
          </span>
          <button
            className="bg-slate-50 border border-dashed hover:border-solid cursor-pointer border-slate-200 text-slate-600 px-2 py-1 rounded-full text-xxxs font-medium items-center flex flex-row space-x-1.5"
            onClick={() => copyToClipboard(adminSession)}
          >
            <span>{adminSession}</span>
            <CopyIcon />
          </button>
        </p>
      )}
    </div>
  );
};

const PluginsDetails = () => {
  return (
    <div className="rounded-md bg-white border border-slate-200 px-5 py-4">
      <span className="font-medium text-base">What are plugins?</span>
      <div className="text-slate-600 text-xs">
        <p>
          Plugins can be used to perform any computing task in addition to the
          write and query abilities of OrbisDB. They offer four different
          capabilities:
        </p>
        <ul className="mb-3 mt-3 space-y-2.5 list-disc ml-4">
          <li>
            <Code>Generate</Code>: Automatically generates streams, as used by
            our CSV uploader plugin.
          </li>
          <li>
            <Code>Add Metadata</Code>: Adds additional details to created
            streams, such as finding users' default ENS names or classifying
            text using AI.
          </li>
          <li>
            <Code>Validate</Code>: Performs validation checks before indexing
            streams, useful for sybil resistance, token gating, or moderation.
          </li>
          <li>
            <Code>Post process</Code>: Executes automated tasks after stream
            indexing, like sending automatic emails, push notifications, or
            blockchain transactions.
          </li>
        </ul>
        <p className="mt-3">
          Anyone can build plugins. You can find more details about how plugins
          work{" "}
          <Link
            className="hover:underline text-[#4483FD]"
            href="https://github.com/OrbisWeb3/orbisdb#plugin-structure"
            target="_blank"
          >
            here
          </Link>
          .
        </p>
      </div>
    </div>
  );
};

const ContextDetails = () => {
  const { isShared } = useGlobal();
  return (
    <div className="rounded-md bg-white border border-slate-200 px-5 py-4">
      <span className="font-medium text-base">What are contexts?</span>
      <p className="text-slate-600 text-xs">
        Contexts allow you to organize your data across different applications
        or projects. Within each context, you can create sub-contexts for a more
        detailed and granular approach.
        <br /> <br />
        Plugins are enabled per context, allowing each context to have its own
        set of rules and automation.
        <br />
        <br />
        Here's how you can use contexts when creating streams with{" "}
        <Link
          className="hover:underline text-[#4483FD]"
          href="https://github.com/OrbisWeb3/db-sdk"
          target="_blank"
        >
          our SDK
        </Link>
        :{/** Display additional alert for shared instances */}
        {isShared && (
          <Alert
            className="text-xs mt-1 mb-3"
            title={
              <>
                Because you are using a shared instance <b>make sure</b> to use
                the <code className="text-xxs font-medium">{`context()`}</code>{" "}
                modifier when creating streams otherwise you won't be able to
                view your data.
              </>
            }
          />
        )}
        <pre className="mt-1 text-xs bg-slate-50 w-full rounded-md p-3 leading-5">
          <code>
            <span className="text-[#2DAEF8]">{`await`}</span>
            {` orbisdb.insert(`}
            <span className="text-[#F38A29]">{`<MODEL>`}</span>
            {`)
    .value(`}
            <span className="text-[#F38A29]">{`<CONTENT>`}</span>
            {`)
    `}
            <span className="text-[#D237F8]">
              {`.context(`}
              <span className="text-[#F38A29]">{`<CONTEXT_ID>`}</span>
              {`)`}
            </span>
            {`
    .run();`}
          </code>
        </pre>
      </p>
    </div>
  );
};

const Code = ({ children }) => {
  return (
    <code className="text-xxs rounded-full bg-slate-50 text-slate-900 px-2.5 py-1">
      {children}
    </code>
  );
};

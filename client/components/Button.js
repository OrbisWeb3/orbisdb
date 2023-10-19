import { LoadingCircle } from "./Icons";

export default function Button({type = "primary", status = 0, onClick, title}) {
  switch (type) {
    /** Primary blue button */
    case "primary":
      switch (status) {
        // Active state
        case 0:
          return (
            <button className="bg-[#4483FD] hover:bg-[#1e58f2] text-white text-sm px-2.5 py-1.5 rounded-md font-medium pointer flex flex-row items-center justify-center" onClick={onClick}>{title}</button>
          );

        // Loading state
        case 1:
          return (
            <button className="bg-[#5a9eff] text-white text-sm px-2.5 py-1.5 rounded-md font-medium pointer flex flex-row items-center justify-center"><LoadingCircle />{title}</button>
          );

        // Success state
        case 2:
          return (
            <button className="bg-green-500 text-white text-sm px-2.5 py-1.5 rounded-md font-medium pointer flex flex-row items-center justify-center" onClick={onClick}>{title}</button>
          );

        /// Error state
        case 3:
          return (
            <button className="bg-red-500 text-white text-sm px-2.5 py-1.5 rounded-md font-medium pointer flex flex-row items-center justify-center" onClick={onClick}>{title}</button>
          );
        default:

      }
      break;

    /** Secondary blue border button */
    case "secondary":
      break;
    default:

  }
}

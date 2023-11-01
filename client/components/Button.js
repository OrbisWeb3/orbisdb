import { LoadingCircle } from "./Icons";

export default function Button({type = "primary", status = 0, onClick, title, successTitle}) {
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
            <button className="bg-green-500 text-white text-sm px-2.5 py-1.5 rounded-md font-medium flex flex-row items-center justify-center" onClick={onClick}>{successTitle ? successTitle : title}</button>
          );

        /// Error state
        case 3:
          return (
            <button className="bg-red-500 text-white text-sm px-2.5 py-1.5 rounded-md font-medium flex flex-row items-center justify-center" onClick={onClick}>{title}</button>
          );

        // Disabled state
        case 4:
          return (
            <button className="bg-[#8fc1ff] text-white text-sm px-2.5 py-1.5 rounded-md font-medium flex flex-row items-center justify-center cursor-not-allowed">{title}</button>
          );
        default:

      }
      break;

    /** Secondary blue border button */
    case "secondary":
      switch (status) {
        // Active state
        case 0:
          return (
            <button className="bg-white hover:bg-slate-50 text-sm px-2.5 py-1.5 rounded-md font-medium pointer flex flex-row items-center justify-center border border-color-[#4483FD] text-[#4483FD]" onClick={onClick}>{title}</button>
          );

        // Loading state
        case 1:
          return (
            <button className="bg-slate-50 text-sm px-2.5 py-1.5 rounded-md font-medium pointer flex flex-row items-center justify-center border border-color-[#4483FD] text-[#4483FD]"><LoadingCircle />{title}</button>
          );

        // Success state
        case 2:
          return (
            <button className="bg-white text-sm px-2.5 py-1.5 rounded-md font-medium pointer flex flex-row items-center justify-center border border-green-500 text-green-500" onClick={onClick}>{successTitle ? successTitle : title}</button>
          );

        /// Error state
        case 3:
          return (
            <button className="bg-red-500 text-white text-sm px-2.5 py-1.5 rounded-md font-medium pointer flex flex-row items-center justify-center" onClick={onClick}>{title}</button>
          );
        default:

      }
      break;
    default:

  }
}

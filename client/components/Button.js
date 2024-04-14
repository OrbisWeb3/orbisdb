import { LoadingCircle } from "./Icons";

export default function Button({
  type = "primary",
  status = 0,
  onClick,
  title,
  successTitle,
}) {
  let classes =
    "text-sm px-2.5 py-1.5 rounded-md font-medium flex flex-row items-center justify-center";
  switch (type) {
    /** Primary blue button */
    case "primary":
      switch (status) {
        // Active state
        case 0:
          return (
            <button
              className={
                "bg-[#4483FD] hover:bg-[#1e58f2] text-white pointer " + classes
              }
              onClick={onClick}
            >
              {title}
            </button>
          );

        // Loading state
        case 1:
          return (
            <button className={"bg-[#5a9eff] text-white " + classes}>
              <LoadingCircle />
              {title}
            </button>
          );

        // Success state
        case 2:
          return (
            <button
              className={"bg-green-500 text-white " + classes}
              onClick={onClick}
            >
              {successTitle ? successTitle : title}
            </button>
          );

        /// Error state
        case 3:
          return (
            <button
              className={"bg-red-500 text-white " + classes}
              onClick={onClick}
            >
              {title}
            </button>
          );

        // Disabled state
        case 4:
          return (
            <button
              className={
                "bg-[#8fc1ff] text-white cursor-not-allowed " + +classes
              }
            >
              {title}
            </button>
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
            <button
              className={
                "bg-white hover:bg-slate-50 border border-color-[#4483FD] text-[#4483FD] " +
                classes
              }
              onClick={onClick}
            >
              {title}
            </button>
          );

        // Loading state
        case 1:
          return (
            <button
              className={
                "bg-slate-50 border border-color-[#4483FD] text-[#4483FD] " +
                classes
              }
            >
              <LoadingCircle />
              {title}
            </button>
          );

        // Success state
        case 2:
          return (
            <button
              className={
                "bg-white border border-green-500 text-green-500 " + classes
              }
              onClick={onClick}
            >
              {successTitle ? successTitle : title}
            </button>
          );

        /// Error state
        case 3:
          return (
            <button
              className={"bg-red-500 text-white " + classes}
              onClick={onClick}
            >
              {title}
            </button>
          );
        default:
      }
      break;

    /** Metamask button */
    case "metamask":
      switch (status) {
        // Active state
        case 0:
          return (
            <button
              className={
                "bg-[#FF7E00] hover:bg-[#F27800] text-[#402000] pointer " +
                classes
              }
              onClick={onClick}
            >
              {title}
            </button>
          );

        // Loading state
        case 1:
          return (
            <button className={"bg-[#FFB266] text-[#B25800] " + classes}>
              <LoadingCircle />
              {title}
            </button>
          );

        // Success state
        case 2:
          return (
            <button
              className={"bg-green-500 text-white " + classes}
              onClick={onClick}
            >
              {successTitle ? successTitle : title}
            </button>
          );

        /// Error state
        case 3:
          return (
            <button
              className={"bg-red-500 text-white " + classes}
              onClick={onClick}
            >
              {title}
            </button>
          );

        // Disabled state
        case 4:
          return (
            <button
              className={
                "bg-[#FFB266] text-[#B25800] cursor-not-allowed " + +classes
              }
            >
              {title}
            </button>
          );
        default:
      }
      break;
    /** Phantom button */
    case "phantom":
      switch (status) {
        // Active state
        case 0:
          return (
            <button
              className={
                "bg-[#AB9FF3] hover:bg-[#A297E7] text-[#2B283D] pointer " +
                classes
              }
              onClick={onClick}
            >
              {title}
            </button>
          );

        // Loading state
        case 1:
          return (
            <button className={"bg-[#CDC5F8] text-[#897FC2] " + classes}>
              <LoadingCircle />
              {title}
            </button>
          );

        // Success state
        case 2:
          return (
            <button
              className={"bg-green-500 text-white " + classes}
              onClick={onClick}
            >
              {successTitle ? successTitle : title}
            </button>
          );

        /// Error state
        case 3:
          return (
            <button
              className={"bg-red-500 text-white " + classes}
              onClick={onClick}
            >
              {title}
            </button>
          );

        // Disabled state
        case 4:
          return (
            <button
              className={
                "bg-[#CDC5F8] text-[#897FC2] cursor-not-allowed " + +classes
              }
            >
              {title}
            </button>
          );
        default:
      }
      break;

    default:
  }
}

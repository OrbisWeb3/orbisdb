import { useContext } from "react";
import { GlobalContext } from "../contexts/Global";
import { findContextById } from "../utils";

const useContextDetails = (id) => {
  const { settings } = useContext(GlobalContext);

  const details = findContextById(settings.contexts, id);

  const name = details?.name;
  const logo = details?.logo;

  return {
    name,
    logo,
  };
};
export default useContextDetails;

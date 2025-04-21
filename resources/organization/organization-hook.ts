import { useContext } from "react";
import OrganizationContext from "./organization-context";

export const useOrganization = () => {
  const context = useContext(OrganizationContext);
  if (!context) {
    throw new Error(
      "useOrganization deve ser usado dentro de um OrganizationProvider"
    );
  }
  return context;
};

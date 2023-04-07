import React from "react";
import { apiAddressGateway } from "src/config/dependencies";

import { AddressAndPosition } from "shared";

export const getAddressesFromApi = async (
  term: string,
  setOptions: React.Dispatch<React.SetStateAction<AddressAndPosition[]>>,
  setIsSearching: React.Dispatch<React.SetStateAction<boolean>>,
): Promise<AddressAndPosition[]> => {
  const sanitizedTerm = term.trim();
  if (sanitizedTerm.length < 2) return [];
  try {
    setIsSearching(true);

    const addresses = await apiAddressGateway.lookupStreetAddress(
      sanitizedTerm,
    );
    setOptions(addresses);
    return addresses;
  } catch (e: any) {
    //eslint-disable-next-line no-console
    console.error("lookupStreetAddress", e);
    return [];
  } finally {
    setIsSearching(false);
  }
};

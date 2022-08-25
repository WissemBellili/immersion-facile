import React, { useEffect, useState } from "react";
import { ErrorSelector } from "../Error/ErrorSelector";

interface ApiDataContainerProps<T> {
  callApi: () => Promise<T>;
  children: (data: T | null) => React.ReactElement;
  jwt?: string;
}

export function ApiDataContainer<T>({
  callApi,
  children,
  jwt,
}: ApiDataContainerProps<T>): React.ReactElement {
  const { data, error } = useApiCall({ callApi });
  return error ? <ErrorSelector error={error} jwt={jwt} /> : children(data);
}

// Inspired by https://itnext.io/centralizing-api-error-handling-in-react-apps-810b2be1d39d
interface UseApiCallProps<T> {
  callApi: () => Promise<T>;
}

function useApiCall<T>({ callApi }: UseApiCallProps<T>) {
  const [error, setError] = useState<Error | null>(null);
  const [apiData, setApiData] = useState<T | null>(null);

  useEffect(() => {
    callApi()
      .then((apiData) => {
        setApiData(apiData);
      })
      .catch((e) => {
        setError(e);
      });
  }, []);

  return { data: apiData, error };
}

import { useMemo } from "react";
export function useSearch<T>(
  data: T[],
  query: string,
  matchFn: (item: T, query: string) => boolean
) {
  return useMemo(() => {
    if (!query) return data;
    return data.filter((item) => matchFn(item, query));
  }, [data, query, matchFn]);
}

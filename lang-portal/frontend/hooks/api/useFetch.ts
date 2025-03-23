"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { apiCache } from "@/lib/cache";

type FetchState<T> = {
  data: T | null;
  isLoading: boolean;
  error: Error | null;
};

/**
 * Custom hook for fetching data from the API with caching and error handling
 */
export function useFetch<T>(
  fetchFn: () => Promise<T>,
  dependencies: any[] = [],
  options: {
    cacheDuration?: number;
    cacheKey?: string;
    errorMessage?: string;
  } = {}
): FetchState<T> & { refetch: () => void } {
  const [state, setState] = useState<FetchState<T>>({
    data: null,
    isLoading: true,
    error: null,
  });

  const cacheKey = options.cacheKey || fetchFn.toString();

  const fetchData = async () => {
    // Check cache first
    const cachedData = apiCache.get<T>(cacheKey);
    if (cachedData) {
      setState({ data: cachedData, isLoading: false, error: null });
      return;
    }

    setState(prev => ({ ...prev, isLoading: true }));
    try {
      const data = await fetchFn();
      setState({ data, isLoading: false, error: null });
      // Cache the successful response
      apiCache.set(cacheKey, data, options.cacheDuration);
    } catch (error) {
      const err = error as Error;
      setState({ data: null, isLoading: false, error: err });
      // Show error toast
      toast.error(options.errorMessage || "Failed to fetch data", {
        description: err.message,
      });
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, dependencies);

  const refetch = () => {
    // Invalidate cache for this request
    apiCache.invalidate(cacheKey);
    fetchData();
  };

  return { ...state, refetch };
}

export default useFetch;
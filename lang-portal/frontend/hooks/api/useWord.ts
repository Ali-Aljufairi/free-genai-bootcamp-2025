"use client";

import { useCallback, useEffect, useState } from "react";
import { wordApi } from "@/services/api";
import { Word, WordsResponse } from "@/types/api";

const CACHE_DURATION = parseInt(process.env.NEXT_PUBLIC_API_CACHE_DURATION || '300000');
const ITEMS_PER_PAGE = 20;

interface Cache {
  data: WordsResponse;
  timestamp: number;
}

let wordsCache: Record<number, Cache> = {};

/**
 * Hook to fetch all words with pagination and caching
 */
export function useWords() {
  const [data, setData] = useState<WordsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchPage = useCallback(async (page: number) => {
    try {
      const now = Date.now();
      
      // Check cache first
      if (wordsCache[page] && (now - wordsCache[page].timestamp) < CACHE_DURATION) {
        return wordsCache[page].data;
      }

      const response = await wordApi.getWords(page, ITEMS_PER_PAGE);
      
      // Update cache
      wordsCache[page] = {
        data: response,
        timestamp: now
      };

      return response;
    } catch (err) {
      throw err;
    }
  }, []);

  const prefetchNextPages = useCallback(async (currentPage: number, totalPages: number) => {
    // Prefetch next 2 pages if they exist
    const pagesToPrefetch = Math.min(currentPage + 2, totalPages);
    for (let page = currentPage + 1; page <= pagesToPrefetch; page++) {
      fetchPage(page).catch(() => {
        // Silently fail on prefetch errors
      });
    }
  }, [fetchPage]);

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setIsLoading(true);
        const firstPage = await fetchPage(1);
        setData(firstPage);
        
        // Start prefetching next pages
        if (firstPage.totalPages > 1) {
          prefetchNextPages(1, firstPage.totalPages);
        }
      } catch (err) {
        setError(err as Error);
      } finally {
        setIsLoading(false);
      }
    };

    loadInitialData();
  }, [fetchPage, prefetchNextPages]);

  const loadMore = useCallback(async (page: number) => {
    try {
      const newData = await fetchPage(page);
      setData(prev => {
        if (!prev) return newData;
        return {
          ...newData,
          items: [...prev.items, ...newData.items]
        };
      });
      
      // Prefetch next pages
      if (page < newData.totalPages) {
        prefetchNextPages(page, newData.totalPages);
      }
    } catch (err) {
      setError(err as Error);
    }
  }, [fetchPage, prefetchNextPages]);

  return {
    data,
    isLoading,
    error,
    loadMore,
    hasMore: data ? data.page < data.totalPages : false
  };
}

/**
 * Hook to fetch a specific word
 */
export function useWord(id: string) {
  return useFetch(() => wordApi.getWord(id), [id]);
}

/**
 * Hook to create a word
 */
export function useCreateWord() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const createWord = async (data: any) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await wordApi.createWord(data);
      setIsLoading(false);
      return result;
    } catch (err) {
      setError(err as Error);
      setIsLoading(false);
      throw err;
    }
  };

  return { createWord, isLoading, error };
}

export default {
  useWords,
  useWord,
  useCreateWord,
};
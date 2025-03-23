"use client";

import { useFetch } from "./useFetch";
import { wordApi } from "@/services/api";
import { useState } from "react";

/**
 * Hook to fetch all words
 */
export function useWords() {
  return useFetch(wordApi.getWords);
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
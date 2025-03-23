"use client";

import { useFetch } from "./useFetch";
import { studySessionApi } from "@/services/api";
import { useState } from "react";

/**
 * Hook to fetch all study sessions
 */
export function useStudySessions() {
  return useFetch(studySessionApi.getStudySessions);
}

/**
 * Hook to fetch a specific study session
 */
export function useStudySession(id: string) {
  return useFetch(() => studySessionApi.getStudySession(id), [id]);
}

/**
 * Hook to fetch words for a study session
 */
export function useStudySessionWords(id: string) {
  return useFetch(() => studySessionApi.getStudySessionWords(id), [id]);
}

/**
 * Hook to create a study session
 */
export function useCreateStudySession() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const createSession = async (data: any) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await studySessionApi.createStudySession(data);
      setIsLoading(false);
      return result;
    } catch (err) {
      setError(err as Error);
      setIsLoading(false);
      throw err;
    }
  };

  return { createSession, isLoading, error };
}

/**
 * Hook to review a word in a study session
 */
export function useReviewWord() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const reviewWord = async (sessionId: string, wordId: string, data: any) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await studySessionApi.reviewWord(sessionId, wordId, data);
      setIsLoading(false);
      return result;
    } catch (err) {
      setError(err as Error);
      setIsLoading(false);
      throw err;
    }
  };

  return { reviewWord, isLoading, error };
}

export default {
  useStudySessions,
  useStudySession,
  useStudySessionWords,
  useCreateStudySession,
  useReviewWord,
};
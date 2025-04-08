"use client";

import { useFetch } from "./useFetch";
import { studyActivityApi } from "@/services/api";
import { useState } from "react";

/**
 * Hook to fetch all study activities with pagination
 */
export function useStudyActivities(page = 1, pageSize = 20) {
  return useFetch(() => studyActivityApi.getStudyActivities(page, pageSize), [page, pageSize]);
}

/**
 * Hook to fetch a specific study activity
 */
export function useStudyActivity(id: string) {
  return useFetch(() => studyActivityApi.getStudyActivity(id), [id]);
}

/**
 * Hook to fetch sessions for a study activity
 */
export function useStudyActivitySessions(id: string) {
  return useFetch(() => studyActivityApi.getStudyActivitySessions(id), [id]);
}

/**
 * Hook to create a study activity
 */
export function useCreateStudyActivity() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const createActivity = async (data: any) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await studyActivityApi.createStudyActivity(data);
      setIsLoading(false);
      return result;
    } catch (err) {
      setError(err as Error);
      setIsLoading(false);
      throw err;
    }
  };

  return { createActivity, isLoading, error };
}

export default {
  useStudyActivities,
  useStudyActivity,
  useStudyActivitySessions,
  useCreateStudyActivity,
};
/**
 * API Service for Lang Portal
 * Handles all communication with the backend API
 */

import {
  StudySession,
  Word,
  Group,
  QuickStats,
  StudyProgress,
  StudyActivity,
} from "@/types/api";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';

/**
 * Basic fetch wrapper with error handling
 */
async function fetchData<T>(
  endpoint: string, 
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const defaultHeaders = {
    'Content-Type': 'application/json',
  };

  const response = await fetch(url, {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `API request failed with status ${response.status}`);
  }

  return response.json();
}

// Dashboard API calls
export const dashboardApi = {
  getLastStudySession: () => fetchData<StudySession>('/dashboard/last_study_session'),
  getStudyProgress: () => fetchData<StudyProgress>('/dashboard/study_progress'),
  getQuickStats: () => fetchData<QuickStats>('/dashboard/quick-stats'),
};

// Study Session API calls
export const studySessionApi = {
  getStudySessions: () => fetchData<StudySession[]>('/study_sessions'),
  getStudySession: (id: string) => fetchData<StudySession>(`/study_sessions/${id}`),
  getStudySessionWords: (id: string) => fetchData<Word[]>(`/study_sessions/${id}/words`),
  createStudySession: (data: Partial<StudySession>) => fetchData<StudySession>('/study_sessions', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  reviewWord: (sessionId: string, wordId: string, data: { proficiency: number }) => 
    fetchData<{ success: boolean }>(`/study_sessions/${sessionId}/words/${wordId}/review`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};

// Group API calls
export const groupApi = {
  getGroups: () => fetchData<Group[]>('/groups'),
  getGroup: (id: string) => fetchData<Group>(`/groups/${id}`),
  getGroupWords: (id: string) => fetchData<Word[]>(`/groups/${id}/words`),
  getGroupStudySessions: (id: string) => fetchData<StudySession[]>(`/groups/${id}/study_sessions`),
};

// Study Activity API calls
export const studyActivityApi = {
  getStudyActivity: (id: string) => fetchData<StudyActivity>(`/study_activities/${id}`),
  getStudyActivitySessions: (id: string) => fetchData<StudySession[]>(`/study_activities/${id}/sessions`),
  createStudyActivity: (data: Partial<StudyActivity>) => fetchData<StudyActivity>('/study_activities', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
};

// Word API calls
export const wordApi = {
  getWords: () => fetchData<Word[]>('/words'),
  getWord: (id: string) => fetchData<Word>(`/words/${id}`),
  createWord: (data: Partial<Word>) => fetchData<Word>('/words', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
};

export const api = {
  dashboard: dashboardApi,
  studySession: studySessionApi,
  group: groupApi,
  studyActivity: studyActivityApi,
  word: wordApi,
};

export default api;
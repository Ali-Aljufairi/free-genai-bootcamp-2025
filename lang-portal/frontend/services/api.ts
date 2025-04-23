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
  WordsResponse
} from "@/types/api";

const API_BASE_URL = '/api/langportal';

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
  getStudyActivities: (page: number = 1, pageSize: number = 20) => 
    fetchData<{ items: StudyActivity[], total: number, page: number }>(`/study_activities?page=${page}&per_page=${pageSize}`),
  getStudyActivity: (id: string) => fetchData<StudyActivity>(`/study_activities/${id}`),
  getStudyActivitySessions: (id: string) => fetchData<StudySession[]>(`/study_activities/${id}/sessions`),
  createStudyActivity: (data: Partial<StudyActivity>) => fetchData<StudyActivity>('/study_activities', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
};

// Word API calls
export const wordApi = {
  getWords: (page: number = 1, pageSize: number = 20) => 
    fetchData<WordsResponse>(`/words?page=${page}&pageSize=${pageSize}`),
  getWord: (id: string) => fetchData<Word>(`/words/${id}`),
  createWord: (data: Partial<Word>) => fetchData<Word>('/words', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
};

// JLPT API calls
export const jlptApi = {
  getRandomKanji: (level: string) => 
    fetchData<{
      kanji: string;
      similar_kanji: { kanji: string; correct: boolean; }[];
      compound_options: { word: string; reading: string; meaning: string; position: number; correct: boolean; }[];
    }>(`/jlpt/${level}/random-kanji`),
  
  getKanjiCompounds: (kanji: string) =>
    fetchData<{
      compounds: { word: string; reading: string; meaning: string; position: number }[];
    }>(`/kanji/${kanji}/compounds`),

  getGameCompounds: async (kanji: string, level: string) => {
    const response = await fetch(`/api/langportal/game/kanji-compound/compounds/${kanji}/${level}`);
    if (!response.ok) {
      throw new Error('Failed to fetch compounds');
    }
    return response.json();
  },

  getGameChoices: async (kanji: string, level: string) => {
    const response = await fetch(`/api/langportal/game/kanji-compound/choices/${kanji}/${level}`);
    if (!response.ok) {
      throw new Error('Failed to fetch kanji choices');
    }
    return response.json();
  },

  validateGameCompound: async ({ 
    kanji, 
    compound, 
    level, 
    position 
  }: {
    kanji: string;
    compound: string;
    level: string;
    position: number;
  }) => {
    const response = await fetch('/api/langportal/game/kanji-compound/validate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        kanji,
        compound,
        level,
        position
      })
    });

    if (!response.ok) {
      throw new Error('Failed to validate compound');
    }

    return response.json();
  }
};

export const api = {
  dashboard: dashboardApi,
  studySession: studySessionApi,
  group: groupApi,
  studyActivity: studyActivityApi,
  word: wordApi,
  jlpt: jlptApi,
};

export default api;
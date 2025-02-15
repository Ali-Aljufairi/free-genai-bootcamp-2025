import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:8080/api/v1",
});

export interface DashboardStats {
  success_rate: number;
  total_study_sessions: number;
  total_active_groups: number;
  study_streak_days: number;
}

export interface StudyProgress {
  total_words_studied: number;
  total_available_words: number;
}

export interface LastStudySession {
  id: number;
  group_id: number;
  created_at: string;
  study_activity_id: number;
  group_name: string;
}

export interface Word {
  japanese: string;
  romaji: string;
  english: string;
  correct_count: number;
  wrong_count: number;
}

export interface Group {
  id: number;
  name: string;
  word_count: number;
}

export interface StudyActivity {
  id: number;
  name: string;
  thumbnail_url: string;
  description: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  pagination: {
    current_page: number;
    total_pages: number;
    total_items: number;
    items_per_page: number;
  };
}

export const getDashboardStats = async () => {
  const { data } = await api.get<DashboardStats>("/dashboard/quick-stats");
  return data;
};

export const getStudyProgress = async () => {
  const { data } = await api.get<StudyProgress>("/dashboard/study_progress");
  return data;
};

export const getLastStudySession = async () => {
  const { data } = await api.get<LastStudySession>("/dashboard/last_study_session");
  return data;
};

export const getWords = async (page = 1) => {
  const { data } = await api.get<PaginatedResponse<Word>>(`/words?page=${page}`);
  return data;
};

export const getGroups = async (page = 1) => {
  const { data } = await api.get<PaginatedResponse<Group>>(`/groups?page=${page}`);
  return data;
};

export const getActivities = async () => {
  const { data } = await api.get<StudyActivity[]>("/study_activities");
  return data;
};

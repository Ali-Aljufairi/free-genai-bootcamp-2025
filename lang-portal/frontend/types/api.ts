// Study Session Types
export interface StudySession {
  id: string;
  type: 'quiz' | 'flashcards' | 'free' | 'speech';
  name: string;
  description: string;
  created_at: string;
  completed_at?: string;
  progress: number;
}

// Word Types
export interface Word {
  id: number;
  japanese: string;
  romaji: string;
  english: string;
  parts: {
    type: string;
    category?: string;
    formality?: string;
  };
}

// Group Types
export interface Group {
  id: string;
  name: string;
  description: string;
  wordCount: number;
  createdAt: string;
}

// Dashboard Types
export interface QuickStats {
  success_rate: number;
  total_study_sessions: number;
  total_active_groups: number;
  study_streak_days: number;
}

export interface StudyProgress {
  dailyProgress: number;
  currentStreak: number;
  dailyActivity: {
    date: string;
    sessionCount: number;
    wordsStudied: number;
  }[];
}

// Study Activity Types
export interface StudyActivity {
  id: string;
  type: 'flashcards' | 'quiz' | 'chat' | 'drawing' | 'agent' | 'speech';
  name: string;
  description: string;
  study_session_id: string;
  group_id: string;
  created_at: string;
  thumbnail_url?: string;
}

export interface WordsResponse {
  items: Word[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
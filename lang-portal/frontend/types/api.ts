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
  wordsLearned: number;
  studyTime: string;
  masteryLevel: string;
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
  type: string;
  progress: number;
  created_at: string;
  completed_at?: string;
  word_count: number;
}

export interface WordsResponse {
  items: Word[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
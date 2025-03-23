// Study Session Types
export interface StudySession {
  id: string;
  type: 'quiz' | 'flashcards' | 'free';
  name: string;
  description: string;
  created_at: string;
  completed_at?: string;
  progress: number;
}

// Word Types
export interface Word {
  id: string;
  term: string;
  definition: string;
  reading?: string;
  examples?: string[];
  groupId: string;
  createdAt: string;
  lastReviewed?: string;
  proficiency: number;
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
// src/shared/types.ts
// Shared types used across the mobile app

export type ThemeName = 'dark' | 'light' | 'sepia';

export interface UserProfile {
  id: number;
  name: string;
  email: string | null;
  avatar_path: string | null;
  preferences: UserPreferences;
  created_at: string;
  updated_at: string;
}

export interface UserPreferences {
  theme: ThemeName;
  fontSize: number;
  pageFlipSound: boolean;
  soundVolume: number;
  defaultView: 'single' | 'spread';
  autoSaveInterval: number;
  showPageNumbers: boolean;
}

export interface Book {
  id: number;
  title: string;
  author: string | null;
  file_path: string;
  file_size: number;
  page_count: number;
  cover_thumbnail: string | null;
  last_read_page: number;
  progress: number;
  is_favorite: boolean;
  date_added: string;
  last_opened: string | null;
  tags: string[];
  metadata: BookMetadata;
}

export interface BookMetadata {
  publisher?: string;
  publishDate?: string;
  isbn?: string;
  language?: string;
  description?: string;
}

export interface Bookmark {
  id: number;
  book_id: number;
  page_number: number;
  title: string;
  note: string | null;
  created_at: string;
}

export type HighlightColor = 'yellow' | 'green' | 'blue' | 'pink' | 'orange';

export interface Highlight {
  id: number;
  book_id: number;
  page_number: number;
  text: string;
  color: HighlightColor;
  note: string | null;
  start_position: number;
  end_position: number;
  created_at: string;
  updated_at: string;
}

export interface Annotation {
  id: number;
  book_id: number;
  page_number: number;
  type: 'note' | 'sticky';
  content: string;
  created_at: string;
  updated_at: string;
}

export interface ReadingSession {
  id: number;
  book_id: number;
  start_page: number;
  end_page: number;
  pages_read: number;
  duration_seconds: number;
  started_at: string;
  ended_at: string;
}

export interface ReadingStats {
  totalBooks: number;
  totalPagesRead: number;
  totalTimeSpent: number;
  currentStreak: number;
  longestStreak: number;
  lastReadDate: string | null;
  dailyStats: DailyStat[];
}

export interface DailyStat {
  date: string;
  pagesRead: number;
  timeSpent: number;
}

export interface TableOfContentsItem {
  title: string;
  pageNumber: number;
  level: number;
  children?: TableOfContentsItem[];
}

export const DEFAULT_PREFERENCES: UserPreferences = {
  theme: 'dark',
  fontSize: 16,
  pageFlipSound: true,
  soundVolume: 0.3,
  defaultView: 'single',
  autoSaveInterval: 30,
  showPageNumbers: true,
};

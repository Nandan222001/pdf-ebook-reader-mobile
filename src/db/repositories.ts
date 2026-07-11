// src/db/repositories.ts
// Data access layer — all CRUD operations for the mobile app

import { getDb } from './database';
import type {
  Book, Bookmark, Highlight, Annotation, ReadingSession,
  ReadingStats, DailyStat, UserProfile, UserPreferences,
  HighlightColor
} from '../shared/types';

// ============================================================
// BOOK REPOSITORY
// ============================================================

export const bookRepo = {
  async getAll(): Promise<Book[]> {
    const db = getDb();
    const rows = await db.getAllAsync(
      'SELECT * FROM books ORDER BY last_opened DESC NULLS LAST, date_added DESC'
    ) as any[];
    return rows.map(rowToBook);
  },

  async getById(id: number): Promise<Book | null> {
    const db = getDb();
    const row = await db.getFirstAsync('SELECT * FROM books WHERE id = ?') as any;
    return row ? rowToBook(row) : null;
  },

  async add(book: {
    title: string;
    author: string | null;
    file_path: string;
    file_size: number;
    page_count: number;
    cover_thumbnail: string | null;
  }): Promise<Book> {
    const db = getDb();
    const result = await db.runAsync(
      `INSERT INTO books (title, author, file_path, file_size, page_count, cover_thumbnail, tags, metadata)
       VALUES (?, ?, ?, ?, ?, ?, '[]', '{}')`,
      [book.title, book.author, book.file_path, book.file_size, book.page_count, book.cover_thumbnail]
    );
    return (await this.getById(result.lastInsertRowId as number))!;
  },

  async update(id: number, updates: Partial<Book>): Promise<void> {
    const db = getDb();
    const current = await this.getById(id);
    if (!current) throw new Error(`Book ${id} not found`);
    const merged = { ...current, ...updates };
    await db.runAsync(
      `UPDATE books SET
        title = ?, author = ?, file_path = ?, file_size = ?,
        page_count = ?, cover_thumbnail = ?, last_read_page = ?,
        progress = ?, is_favorite = ?, tags = ?, metadata = ?,
        last_opened = ?
      WHERE id = ?`,
      [
        merged.title, merged.author, merged.file_path, merged.file_size,
        merged.page_count, merged.cover_thumbnail, merged.last_read_page,
        merged.progress, merged.is_favorite ? 1 : 0,
        JSON.stringify(merged.tags), JSON.stringify(merged.metadata),
        merged.last_opened ?? new Date().toISOString(), id
      ]
    );
  },

  async delete(id: number): Promise<void> {
    const db = getDb();
    await db.runAsync('DELETE FROM books WHERE id = ?', [id]);
  },

  async toggleFavorite(id: number): Promise<Book | null> {
    const book = await this.getById(id);
    if (!book) return null;
    await this.update(id, { is_favorite: !book.is_favorite });
    return this.getById(id);
  },

  async updateProgress(id: number, page: number, pageCount: number): Promise<void> {
    const db = getDb();
    const progress = pageCount > 0 ? (page / pageCount) * 100 : 0;
    await db.runAsync(
      `UPDATE books SET last_read_page = ?, progress = ?, last_opened = datetime('now') WHERE id = ?`,
      [page, progress, id]
    );
  },

  async search(query: string): Promise<Book[]> {
    const db = getDb();
    const rows = await db.getAllAsync(
      `SELECT * FROM books WHERE title LIKE '%' || ? || '%' OR author LIKE '%' || ? || '%' ORDER BY last_opened DESC NULLS LAST`,
      [query, query]
    ) as any[];
    return rows.map(rowToBook);
  },
};

// ============================================================
// BOOKMARK REPOSITORY
// ============================================================

export const bookmarkRepo = {
  async getByBook(bookId: number): Promise<Bookmark[]> {
    const db = getDb();
    return await db.getAllAsync(
      'SELECT * FROM bookmarks WHERE book_id = ? ORDER BY page_number ASC, created_at DESC',
      [bookId]
    ) as Bookmark[];
  },

  async add(bookId: number, pageNumber: number, title: string, note: string | null): Promise<Bookmark> {
    const db = getDb();
    const result = await db.runAsync(
      'INSERT INTO bookmarks (book_id, page_number, title, note) VALUES (?, ?, ?, ?)',
      [bookId, pageNumber, title, note]
    );
    return (await db.getFirstAsync('SELECT * FROM bookmarks WHERE id = ?', [result.lastInsertRowId])) as Bookmark;
  },

  async delete(id: number): Promise<void> {
    const db = getDb();
    await db.runAsync('DELETE FROM bookmarks WHERE id = ?', [id]);
  },
};

// ============================================================
// HIGHLIGHT REPOSITORY
// ============================================================

export const highlightRepo = {
  async getByBook(bookId: number): Promise<Highlight[]> {
    const db = getDb();
    return await db.getAllAsync(
      'SELECT * FROM highlights WHERE book_id = ? ORDER BY page_number ASC, created_at DESC',
      [bookId]
    ) as Highlight[];
  },

  async add(h: {
    book_id: number;
    page_number: number;
    text: string;
    color: HighlightColor;
    note: string | null;
    start_position: number;
    end_position: number;
  }): Promise<Highlight> {
    const db = getDb();
    const result = await db.runAsync(
      `INSERT INTO highlights (book_id, page_number, text, color, note, start_position, end_position)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [h.book_id, h.page_number, h.text, h.color, h.note, h.start_position, h.end_position]
    );
    return (await db.getFirstAsync('SELECT * FROM highlights WHERE id = ?', [result.lastInsertRowId])) as Highlight;
  },

  async delete(id: number): Promise<void> {
    const db = getDb();
    await db.runAsync('DELETE FROM highlights WHERE id = ?', [id]);
  },
};

// ============================================================
// ANNOTATION REPOSITORY
// ============================================================

export const annotationRepo = {
  async getByBook(bookId: number): Promise<Annotation[]> {
    const db = getDb();
    return await db.getAllAsync(
      'SELECT * FROM annotations WHERE book_id = ? ORDER BY page_number ASC, created_at DESC',
      [bookId]
    ) as Annotation[];
  },

  async add(a: {
    book_id: number;
    page_number: number;
    type: 'note' | 'sticky';
    content: string;
  }): Promise<Annotation> {
    const db = getDb();
    const result = await db.runAsync(
      'INSERT INTO annotations (book_id, page_number, type, content) VALUES (?, ?, ?, ?)',
      [a.book_id, a.page_number, a.type, a.content]
    );
    return (await db.getFirstAsync('SELECT * FROM annotations WHERE id = ?', [result.lastInsertRowId])) as Annotation;
  },

  async delete(id: number): Promise<void> {
    const db = getDb();
    await db.runAsync('DELETE FROM annotations WHERE id = ?', [id]);
  },
};

// ============================================================
// READING STATS REPOSITORY
// ============================================================

export const statsRepo = {
  async addSession(session: Omit<ReadingSession, 'id'>): Promise<void> {
    const db = getDb();
    const today = new Date().toISOString().split('T')[0];
    await db.runAsync(
      `INSERT INTO reading_sessions (book_id, start_page, end_page, pages_read, duration_seconds, started_at, ended_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [session.book_id, session.start_page, session.end_page, session.pages_read, session.duration_seconds, session.started_at, session.ended_at]
    );
    await db.runAsync(
      `INSERT INTO reading_streaks (date, pages_read, time_spent, books_read)
       VALUES (?, ?, ?, 1)
       ON CONFLICT(date) DO UPDATE SET pages_read = pages_read + ?, time_spent = time_spent + ?, books_read = books_read + 1`,
      [today, session.pages_read, session.duration_seconds, session.pages_read, session.duration_seconds]
    );
  },

  async getStats(): Promise<ReadingStats> {
    const db = getDb();
    const totalBooks = ((await db.getFirstAsync('SELECT COUNT(*) as count FROM books')) as any)?.count ?? 0;
    const totalPages = ((await db.getFirstAsync('SELECT COALESCE(SUM(pages_read), 0) as count FROM reading_sessions')) as any)?.count ?? 0;
    const totalTime = ((await db.getFirstAsync('SELECT COALESCE(SUM(duration_seconds), 0) as count FROM reading_sessions')) as any)?.count ?? 0;

    const streakRows = await db.getAllAsync('SELECT date FROM reading_streaks ORDER BY date DESC') as { date: string }[];
    const { currentStreak, longestStreak } = calculateStreaks(streakRows.map(s => s.date));
    const lastRead = streakRows.length > 0 ? streakRows[0].date : null;

    const dailyRows = await db.getAllAsync(
      `SELECT date, pages_read, time_spent FROM reading_streaks WHERE date >= date('now', '-30 days') ORDER BY date ASC`
    ) as DailyStat[];

    return {
      totalBooks,
      totalPagesRead: totalPages,
      totalTimeSpent: totalTime,
      currentStreak,
      longestStreak,
      lastReadDate: lastRead,
      dailyStats: dailyRows,
    };
  },
};

// ============================================================
// USER PROFILE REPOSITORY
// ============================================================

export const profileRepo = {
  async get(): Promise<UserProfile> {
    const db = getDb();
    const row = await db.getFirstAsync('SELECT * FROM user_profile WHERE id = 1') as any;
    return {
      id: row.id,
      name: row.name,
      email: row.email,
      avatar_path: row.avatar_path,
      preferences: JSON.parse(row.preferences),
      created_at: row.created_at,
      updated_at: row.updated_at,
    };
  },

  async update(name: string, email: string | null): Promise<void> {
    const db = getDb();
    await db.runAsync(
      `UPDATE user_profile SET name = ?, email = ?, updated_at = datetime('now') WHERE id = 1`,
      [name, email]
    );
  },

  async updatePreferences(prefs: Partial<UserPreferences>): Promise<void> {
    const db = getDb();
    const current = await this.get();
    const merged = { ...current.preferences, ...prefs };
    await db.runAsync(
      `UPDATE user_profile SET preferences = ?, updated_at = datetime('now') WHERE id = 1`,
      [JSON.stringify(merged)]
    );
  },
};

// ============================================================
// HELPERS
// ============================================================

function rowToBook(row: any): Book {
  return {
    id: row.id,
    title: row.title,
    author: row.author,
    file_path: row.file_path,
    file_size: row.file_size,
    page_count: row.page_count,
    cover_thumbnail: row.cover_thumbnail,
    last_read_page: row.last_read_page,
    progress: row.progress,
    is_favorite: row.is_favorite === 1,
    tags: JSON.parse(row.tags || '[]'),
    metadata: JSON.parse(row.metadata || '{}'),
    date_added: row.date_added,
    last_opened: row.last_opened,
  };
}

function calculateStreaks(dates: string[]): { currentStreak: number; longestStreak: number } {
  if (dates.length === 0) return { currentStreak: 0, longestStreak: 0 };
  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

  let currentStreak = 0;
  if (dates[0] === today || dates[0] === yesterday) {
    currentStreak = 1;
    for (let i = 1; i < dates.length; i++) {
      const prev = new Date(dates[i - 1]);
      const curr = new Date(dates[i]);
      const diff = (prev.getTime() - curr.getTime()) / 86400000;
      if (Math.round(diff) === 1) currentStreak++;
      else break;
    }
  }

  let longestStreak = 1;
  let tempStreak = 1;
  for (let i = 1; i < dates.length; i++) {
    const prev = new Date(dates[i - 1]);
    const curr = new Date(dates[i]);
    const diff = (prev.getTime() - curr.getTime()) / 86400000;
    if (Math.round(diff) === 1) {
      tempStreak++;
      longestStreak = Math.max(longestStreak, tempStreak);
    } else {
      tempStreak = 1;
    }
  }

  return { currentStreak, longestStreak };
}

// src/db/database.ts
// Database initialization and connection management using expo-sqlite

import * as SQLite from 'expo-sqlite';
import { SCHEMA_SQL, SEED_SQL } from './schema';
import { DEFAULT_PREFERENCES } from '../shared/types';

const DB_NAME = 'ebook_reader.db';

let dbInstance: SQLite.SQLiteDatabase | null = null;

/**
 * Initialize the database — create tables and seed default data.
 */
export async function initDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (dbInstance) return dbInstance;

  const db = await SQLite.openDatabaseAsync(DB_NAME);

  // Enable foreign keys
  await db.execAsync('PRAGMA foreign_keys = ON;');

  // Execute schema
  await db.execAsync(SCHEMA_SQL);

  // Seed default profile
  const prefsJson = JSON.stringify(DEFAULT_PREFERENCES);
  await db.execAsync(SEED_SQL(prefsJson));

  dbInstance = db;
  console.log('[DB] Database initialized successfully');
  return db;
}

/**
 * Get the current database instance.
 */
export function getDb(): SQLite.SQLiteDatabase {
  if (!dbInstance) {
    throw new Error('Database not initialized. Call initDatabase() first.');
  }
  return dbInstance;
}

/**
 * Close the database connection.
 */
export async function closeDatabase(): Promise<void> {
  if (dbInstance) {
    await dbInstance.closeAsync();
    dbInstance = null;
    console.log('[DB] Database connection closed');
  }
}

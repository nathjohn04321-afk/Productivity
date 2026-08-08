import * as SQLite from 'expo-sqlite';

const DB_NAME = 'focusflow.db';

let dbInstance: SQLite.SQLiteDatabase | null = null;

/**
 * Opens (or returns the cached) SQLite connection. WAL journal mode is enabled
 * so writes are durable across app kills without sacrificing read concurrency.
 */
export function getDb(): SQLite.SQLiteDatabase {
  if (!dbInstance) {
    dbInstance = SQLite.openDatabaseSync(DB_NAME, {
      useNewConnection: false,
    });
    dbInstance.execSync('PRAGMA journal_mode = WAL;');
    dbInstance.execSync('PRAGMA foreign_keys = ON;');
  }
  return dbInstance;
}

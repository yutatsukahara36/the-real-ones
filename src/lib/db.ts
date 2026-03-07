import Database from 'better-sqlite3';
import path from 'path';

const DB_PATH = process.env.NODE_ENV === 'production'
  ? '/data/survey.db'
  : path.join(process.cwd(), 'survey.db');

let db: Database.Database;

function getDb(): Database.Database {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    initDb(db);
  }
  return db;
}

function initDb(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS respondents (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      submitted_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS self_answers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      respondent_name TEXT NOT NULL,
      question_id TEXT NOT NULL,
      answer TEXT NOT NULL,
      UNIQUE(respondent_name, question_id)
    );

    CREATE TABLE IF NOT EXISTS peer_answers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      respondent_name TEXT NOT NULL,
      target_name TEXT NOT NULL,
      question_id TEXT NOT NULL,
      answer TEXT NOT NULL,
      UNIQUE(respondent_name, target_name, question_id)
    );

    CREATE TABLE IF NOT EXISTS group_answers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      respondent_name TEXT NOT NULL,
      question_id TEXT NOT NULL,
      answer TEXT NOT NULL,
      UNIQUE(respondent_name, question_id)
    );

    CREATE TABLE IF NOT EXISTS analysis_results (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      generated_at TEXT NOT NULL,
      result_json TEXT NOT NULL
    );
  `);
}

export default getDb;

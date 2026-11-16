import fs from 'fs'
import path from 'path'
import Database from 'better-sqlite3'
import pg from 'pg'
import dotenv from 'dotenv'

dotenv.config()

const { Pool } = pg

const isProduction = process.env.NODE_ENV === 'production'
const dbPath = process.env.DB_PATH || './data/chat.db'

async function initDatabase() {
  if (isProduction && process.env.DATABASE_URL) {
    return initPostgreSQL()
  }
  return initSQLite()
}

function initSQLite() {
  const dataDir = path.dirname(dbPath)
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true })
  }

  const db = new Database(dbPath)
  
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    
    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
  `)
  
  console.log('SQLite database initialized at', dbPath)
  db.close()
}

async function initPostgreSQL() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  })
  
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      email TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    
    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
  `)
  
  console.log('PostgreSQL database initialized')
  await pool.end()
}

initDatabase().catch(console.error)
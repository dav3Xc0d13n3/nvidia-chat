import express from 'express'
import cors from 'cors'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import dotenv from 'dotenv'
import Database from 'better-sqlite3'
import pg from 'pg'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

dotenv.config()

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const app = express()
const PORT = process.env.PORT || 10000
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-production'
const isProduction = process.env.NODE_ENV === 'production'

const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5173',
  process.env.FRONTEND_URL,
].filter(Boolean)

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true)
    if (allowedOrigins.some(o => o && origin === o)) {
      return callback(null, true)
    }
    if (origin.includes('.onrender.com') || origin.includes('localhost')) {
      return callback(null, true)
    }
    callback(new Error('Not allowed by CORS'))
  },
  credentials: true
}))
app.use(express.json())

const { Pool } = pg

let db
let pgPool

async function initDB() {
  if (isProduction && process.env.DATABASE_URL) {
    pgPool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    })
    await pgPool.query('SELECT 1')
    console.log('Connected to PostgreSQL')
    
    // Create tables
    await pgPool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        password_hash TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
    `)
    console.log('PostgreSQL tables initialized')
  } else {
    const dataDir = path.join(process.cwd(), 'data')
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true })
    }
    const dbPath = path.join(dataDir, 'chat.db')
    db = new Database(dbPath)
    console.log('Connected to SQLite at', dbPath)
    
    // Create tables
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
    console.log('SQLite tables initialized')
  }
}

function generateId() {
  return crypto.randomUUID()
}

async function findUserByEmail(email) {
  if (pgPool) {
    const result = await pgPool.query('SELECT * FROM users WHERE email = $1', [email])
    return result.rows[0] || null
  }
  return db.prepare('SELECT * FROM users WHERE email = ?').get(email) || null
}

async function createUser(user) {
  const id = generateId()
  const createdAt = new Date().toISOString()
  
  if (pgPool) {
    await pgPool.query(
      'INSERT INTO users (id, email, name, password_hash, created_at) VALUES ($1, $2, $3, $4, $5)',
      [id, user.email, user.name, user.passwordHash, createdAt]
    )
  } else {
    db.prepare(
      'INSERT INTO users (id, email, name, password_hash, created_at) VALUES (?, ?, ?, ?, ?)'
    ).run(id, user.email, user.name, user.passwordHash, createdAt)
  }
  
  return { id, email: user.email, name: user.name, createdAt }
}

function generateToken(user) {
  return jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' })
}

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' })
  }
  
  const token = authHeader.slice(7)
  try {
    const decoded = jwt.verify(token, JWT_SECRET)
    req.user = decoded
    next()
  } catch {
    return res.status(401).json({ error: 'Invalid token' })
  }
}

app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, name } = req.body
    
    if (!email || !password || !name) {
      return res.status(400).json({ error: 'All fields are required' })
    }
    
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' })
    }
    
    const existingUser = await findUserByEmail(email)
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' })
    }
    
    const passwordHash = await bcrypt.hash(password, 10)
    const user = await createUser({ email, passwordHash, name })
    const token = generateToken(user)
    
    res.status(201).json({ user, token })
  } catch (error) {
    console.error('Register error:', error)
    res.status(500).json({ error: 'Registration failed' })
  }
})

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' })
    }
    
    const user = await findUserByEmail(email)
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' })
    }
    
    const validPassword = await bcrypt.compare(password, user.password_hash)
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' })
    }
    
    const token = generateToken(user)
    res.json({ user: { id: user.id, email: user.email, name: user.name, createdAt: user.created_at }, token })
  } catch (error) {
    console.error('Login error:', error)
    res.status(500).json({ error: 'Login failed' })
  }
})

app.get('/api/auth/me', authMiddleware, async (req, res) => {
  try {
    const user = await findUserByEmail(req.user.email)
    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }
    res.json({ user: { id: user.id, email: user.email, name: user.name, createdAt: user.created_at } })
  } catch (error) {
    console.error('Me error:', error)
    res.status(500).json({ error: 'Failed to get user' })
  }
})

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// Proxy chat completions to NVIDIA API (avoids CORS)
app.post('/api/chat/completions', authMiddleware, async (req, res) => {
  try {
    const { model, messages, stream, max_tokens, temperature } = req.body
    const apiKey = req.headers['x-api-key'] || process.env.VITE_NVIDIA_API_KEY
    const baseUrl = process.env.VITE_NVIDIA_BASE_URL || 'https://integrate.api.nvidia.com/v1'
    
    if (!apiKey) {
      return res.status(400).json({ error: 'No API key configured' })
    }

    const nvidiaRes = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: model || 'nvidia/nemotron-3-ultra',
        messages,
        stream: stream ?? true,
        max_tokens: max_tokens ?? 4096,
        temperature: temperature ?? 0.7,
      }),
    })

    if (!nvidiaRes.ok) {
      const err = await nvidiaRes.json().catch(() => ({ error: nvidiaRes.statusText }))
      return res.status(nvidiaRes.status).json(err)
    }

    // Stream response back to client
    res.setHeader('Content-Type', 'text/event-stream')
    res.setHeader('Cache-Control', 'no-cache')
    res.setHeader('Connection', 'keep-alive')
    res.flushHeaders()

    const reader = nvidiaRes.body?.getReader()
    const decoder = new TextDecoder()

    if (reader) {
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value)
        res.write(chunk)
      }
    }
    res.end()
  } catch (error) {
    console.error('Chat proxy error:', error)
    if (!res.headersSent) {
      res.status(500).json({ error: 'Chat completion failed' })
    }
  }
})

// Proxy models endpoint
app.get('/api/models', authMiddleware, async (req, res) => {
  try {
    const apiKey = req.headers['x-api-key'] || process.env.VITE_NVIDIA_API_KEY
    const baseUrl = process.env.VITE_NVIDIA_BASE_URL || 'https://integrate.api.nvidia.com/v1'
    
    if (!apiKey) {
      return res.status(400).json({ error: 'No API key configured' })
    }

    const nvidiaRes = await fetch(`${baseUrl}/models`, {
      headers: { 'Authorization': `Bearer ${apiKey}` },
    })

    if (!nvidiaRes.ok) {
      const err = await nvidiaRes.json().catch(() => ({ error: nvidiaRes.statusText }))
      return res.status(nvidiaRes.status).json(err)
    }

    const data = await nvidiaRes.json()
    res.json(data)
  } catch (error) {
    console.error('Models proxy error:', error)
    res.status(500).json({ error: 'Failed to fetch models' })
  }
})

// Serve frontend static files in production
if (isProduction) {
  const distPath = path.join(__dirname, '..', 'dist')
  app.use(express.static(distPath))
  
  app.get('*', (req, res) => {
    if (req.path.startsWith('/api')) return
    res.sendFile(path.join(distPath, 'index.html'))
  })
}

app.use((err, req, res, next) => {
  console.error('Server error:', err)
  res.status(500).json({ error: 'Internal server error' })
})

await initDB()
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
})
// Vercel serverless entry point — REST API only (no WebSockets)
import express from 'express'
import cors from 'cors'
import usersRouter from '../src/routes/users.js'
import roomsRouter from '../src/routes/rooms.js'
import snapshotsRouter from '../src/routes/snapshots.js'

const app = express()

const CLIENT_URL = process.env.CLIENT_URL ?? 'http://localhost:5173'

const allowedOrigins = [CLIENT_URL, 'https://collab-board-coral.vercel.app']
app.use(cors({ origin: (origin, cb) => {
  if (!origin || allowedOrigins.includes(origin)) return cb(null, true)
  cb(new Error('Not allowed by CORS'))
}, credentials: true }))
app.use(express.json())

app.get('/health', (_req, res) => res.json({ status: 'ok' }))

app.use('/api/users', usersRouter)
app.use('/api/rooms', roomsRouter)
app.use('/api/rooms/:id/snapshots', snapshotsRouter)

export default app

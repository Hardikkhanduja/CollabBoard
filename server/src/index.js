import express from 'express'
import cors from 'cors'
import { createServer } from 'http'
import usersRouter from './routes/users.js'
import roomsRouter from './routes/rooms.js'
import snapshotsRouter from './routes/snapshots.js'
import { setupYjsProvider } from './socket/yjsProvider.js'
import { setupSocketIO } from './socket/index.js'

const app = express()
const httpServer = createServer(app)

const PORT = process.env.PORT ?? 4000
const CLIENT_URL = process.env.CLIENT_URL ?? 'http://localhost:5173'

app.use(cors({ origin: CLIENT_URL, credentials: true }))
app.use(express.json())

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' })
})

app.use('/api/users', usersRouter)
app.use('/api/rooms', roomsRouter)
app.use('/api/rooms/:id/snapshots', snapshotsRouter)

// Real-time: Yjs WebSocket provider + Socket.io
setupYjsProvider(httpServer)
setupSocketIO(httpServer, CLIENT_URL)

httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})

export { app, httpServer }

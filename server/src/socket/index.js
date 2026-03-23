import { Server } from 'socket.io'
import { registerPresenceHandlers } from './presence.js'

export function setupSocketIO(httpServer, clientUrl) {
  const io = new Server(httpServer, {
    cors: { origin: clientUrl, credentials: true },
    path: '/socket.io',
  })

  io.on('connection', (socket) => {
    registerPresenceHandlers(socket, io)
  })

  return io
}

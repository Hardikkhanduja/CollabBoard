import { redis } from '../lib/redis.js'

const CURSOR_TTL = 5 // seconds

/**
 * Register presence event handlers on a socket.
 * @param {import('socket.io').Socket} socket
 * @param {import('socket.io').Server} io
 */
export function registerPresenceHandlers(socket, io) {
  let currentRoomId = null
  let currentUserId = null

  socket.on('room:join', async ({ roomId, userId, name, color, avatar }) => {
    currentRoomId = roomId
    currentUserId = userId

    socket.join(roomId)

    // Broadcast to others in the room
    socket.to(roomId).emit('user:joined', { userId, name, color, avatar })

    // Send current active users to the joiner
    try {
      const keys = await redis.keys(`cursor:${roomId}:*`)
      const activeUsers = []
      for (const key of keys) {
        const data = await redis.get(key)
        if (data) activeUsers.push(typeof data === 'string' ? JSON.parse(data) : data)
      }
      socket.emit('room:users', activeUsers)
    } catch (err) {
      console.error('[presence] Failed to fetch active users', err)
      socket.emit('room:users', [])
    }
  })

  socket.on('cursor:move', async ({ roomId, userId, name, color, x, y }) => {
    const key = `cursor:${roomId}:${userId}`
    const data = { userId, name, color, x, y }

    try {
      await redis.set(key, JSON.stringify(data), { ex: CURSOR_TTL })
    } catch (err) {
      console.error('[presence] Failed to write cursor to Redis', err)
    }

    io.to(roomId).emit('cursor:update', data)
  })

  socket.on('cursor:leave', async ({ roomId, userId }) => {
    await cleanupCursor(roomId, userId)
    io.to(roomId).emit('user:left', { userId })
  })

  socket.on('disconnect', async () => {
    if (currentRoomId && currentUserId) {
      await cleanupCursor(currentRoomId, currentUserId)
      io.to(currentRoomId).emit('user:left', { userId: currentUserId })
    }
  })
}

async function cleanupCursor(roomId, userId) {
  try {
    await redis.del(`cursor:${roomId}:${userId}`)
  } catch (err) {
    console.error('[presence] Failed to delete cursor key', err)
  }
}

import { useEffect, useCallback, useRef } from 'react'
import { socket } from '../lib/socket'
import { useStore } from '../store/useStore'
import { toast } from '../lib/toast'
import { getColorForUser } from '../lib/colorHash'

const CURSOR_THROTTLE_MS = 33 // ~30fps

/**
 * Manages Socket.io presence lifecycle for a board session.
 * @param {{ roomId: string, userId: string, userName: string, userAvatar?: string }} params
 */
export function usePresence({ roomId, userId, userName, userAvatar }) {
  const { setActiveUsers, addActiveUser, removeActiveUser, setCursors } = useStore()
  const lastEmitRef = useRef(0)
  const color = getColorForUser(userId ?? '')

  useEffect(() => {
    if (!roomId || !userId) return

    socket.connect()

    socket.emit('room:join', { roomId, userId, name: userName, color, avatar: userAvatar })

    socket.on('room:users', (users) => {
      setActiveUsers(users)
    })

    socket.on('user:joined', (user) => {
      addActiveUser(user)
      toast.info(`${user.name} joined`)
    })

    socket.on('user:left', ({ userId: leftId }) => {
      removeActiveUser(leftId)
      setCursors((prev) => {
        const next = { ...prev }
        delete next[leftId]
        return next
      })
      toast.info('A user left')
    })

    socket.on('cursor:update', (data) => {
      setCursors((prev) => ({ ...prev, [data.userId]: data }))
    })

    return () => {
      socket.emit('cursor:leave', { roomId, userId })
      socket.off('room:users')
      socket.off('user:joined')
      socket.off('user:left')
      socket.off('cursor:update')
      socket.disconnect()
    }
  }, [roomId, userId, userName, userAvatar, color, setActiveUsers, addActiveUser, removeActiveUser, setCursors])

  const emitCursorMove = useCallback(
    (x, y) => {
      const now = Date.now()
      if (now - lastEmitRef.current < CURSOR_THROTTLE_MS) return
      lastEmitRef.current = now
      socket.emit('cursor:move', { roomId, userId, name: userName, color, x, y })
    },
    [roomId, userId, userName, color]
  )

  return { emitCursorMove }
}

import { io } from 'socket.io-client'

const WS_URL = import.meta.env.VITE_WS_URL ?? 'http://localhost:4000'

export const socket = io(WS_URL, {
  path: '/socket.io',
  autoConnect: false,
  reconnection: true,
  reconnectionAttempts: Infinity,
  reconnectionDelay: 1000,
})

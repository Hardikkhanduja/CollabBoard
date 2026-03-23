import * as Y from 'yjs'
import { WebsocketProvider } from 'y-websocket'

const WS_URL = import.meta.env.VITE_WS_URL ?? 'ws://localhost:4000'

/**
 * Create a Yjs document + WebSocket provider for a room session.
 * @param {string} roomId
 * @returns {{ doc: Y.Doc, provider: WebsocketProvider }}
 */
export function createYjsSession(roomId) {
  const doc = new Y.Doc()
  const provider = new WebsocketProvider(`${WS_URL}/yjs`, roomId, doc, {
    connect: true,
  })
  return { doc, provider }
}

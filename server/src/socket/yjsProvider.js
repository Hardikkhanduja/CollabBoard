import { WebSocketServer } from 'ws'
import * as Y from 'yjs'
import * as syncProtocol from 'y-protocols/sync'
import * as awarenessProtocol from 'y-protocols/awareness'
import * as encoding from 'lib0/encoding'
import * as decoding from 'lib0/decoding'

// In-memory Yjs docs for live sessions only — no DB persistence here
const docs = new Map()

const messageSync = 0
const messageAwareness = 1

function getYDoc(roomId) {
  if (docs.has(roomId)) return docs.get(roomId)
  const doc = new Y.Doc()
  doc._clients = new Set()
  doc._awareness = new awarenessProtocol.Awareness(doc)
  docs.set(roomId, doc)
  return doc
}

export function setupYjsProvider(httpServer) {
  const wss = new WebSocketServer({ noServer: true })

  httpServer.on('upgrade', (request, socket, head) => {
    const { pathname } = new URL(request.url, 'http://localhost')
    if (pathname.startsWith('/yjs')) {
      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit('connection', ws, request)
      })
    }
  })

  wss.on('connection', (ws, req) => {
    const { pathname } = new URL(req.url, 'http://localhost')
    const roomId = pathname.replace(/^\/yjs\/?/, '')
    if (!roomId) { ws.close(); return }

    const doc = getYDoc(roomId)
    doc._clients.add(ws)

    // Send sync step 1
    const encoder = encoding.createEncoder()
    encoding.writeVarUint(encoder, messageSync)
    syncProtocol.writeSyncStep1(encoder, doc)
    ws.send(encoding.toUint8Array(encoder))

    // Send current awareness states
    const awarenessStates = doc._awareness.getStates()
    if (awarenessStates.size > 0) {
      const aEncoder = encoding.createEncoder()
      encoding.writeVarUint(aEncoder, messageAwareness)
      encoding.writeVarUint8Array(
        aEncoder,
        awarenessProtocol.encodeAwarenessUpdate(doc._awareness, Array.from(awarenessStates.keys()))
      )
      ws.send(encoding.toUint8Array(aEncoder))
    }

    ws.on('message', (data) => {
      try {
        const buf = data instanceof Buffer ? data : Buffer.from(data)
        const decoder = decoding.createDecoder(new Uint8Array(buf))
        const msgType = decoding.readVarUint(decoder)

        if (msgType === messageSync) {
          const replyEncoder = encoding.createEncoder()
          encoding.writeVarUint(replyEncoder, messageSync)
          const hasReply = syncProtocol.readSyncMessage(decoder, replyEncoder, doc, null)
          if (hasReply) ws.send(encoding.toUint8Array(replyEncoder))
          broadcast(doc, ws, buf)
        } else if (msgType === messageAwareness) {
          awarenessProtocol.applyAwarenessUpdate(
            doc._awareness,
            decoding.readVarUint8Array(decoder),
            ws
          )
          broadcast(doc, ws, buf)
        }
      } catch (err) {
        console.error('[yjs] message error:', err.message)
      }
    })

    ws.on('close', () => {
      doc._clients.delete(ws)
      awarenessProtocol.removeAwarenessStates(doc._awareness, [doc.clientID], null)
      // Clean up doc from memory when room is empty
      if (doc._clients.size === 0) {
        docs.delete(roomId)
      }
    })

    ws.on('error', (err) => console.error('[yjs] ws error:', err))
  })

  return wss
}

function broadcast(doc, sender, buf) {
  doc._clients.forEach((client) => {
    if (client !== sender && client.readyState === 1) {
      client.send(buf)
    }
  })
}

export { docs }

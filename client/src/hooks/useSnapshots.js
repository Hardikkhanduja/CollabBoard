import { useCallback } from 'react'
import * as Y from 'yjs'
import api from '../lib/api'
import { socket } from '../lib/socket'
import { toast } from '../lib/toast'
import { useStore } from '../store/useStore'

/**
 * Snapshot CRUD operations for a room.
 * @param {{ roomId: string, doc: Y.Doc|null, role: string }} params
 */
export function useSnapshots({ roomId, doc, role }) {
  const { roomMeta } = useStore()

  const listSnapshots = useCallback(async () => {
    const res = await api.get(`/api/rooms/${roomId}/snapshots`)
    return res.data
  }, [roomId])

  const createSnapshot = useCallback(
    async ({ label, thumbnail } = {}) => {
      if (!doc) throw new Error('No Yjs document')
      const stateBytes = Y.encodeStateAsUpdate(doc)
      // Safe base64 encoding that handles large Uint8Arrays without stack overflow
      let binary = ''
      const chunkSize = 8192
      for (let i = 0; i < stateBytes.length; i += chunkSize) {
        binary += String.fromCharCode(...stateBytes.subarray(i, i + chunkSize))
      }
      const canvasState = btoa(binary)
      const res = await api.post(`/api/rooms/${roomId}/snapshots`, {
        label,
        thumbnail,
        canvasState,
      })
      return res.data
    },
    [roomId, doc]
  )

  const getSnapshot = useCallback(
    async (snapshotId) => {
      const res = await api.get(`/api/rooms/${roomId}/snapshots/${snapshotId}`)
      return res.data
    },
    [roomId]
  )

  const deleteSnapshot = useCallback(
    async (snapshotId) => {
      await api.delete(`/api/rooms/${roomId}/snapshots/${snapshotId}`)
    },
    [roomId]
  )

  const restoreSnapshot = useCallback(
    async (snapshotId) => {
      if (role === 'VIEWER') {
        toast.error('Viewers cannot restore snapshots')
        return
      }
      if (!doc) throw new Error('No Yjs document')

      const snapshot = await getSnapshot(snapshotId)

      // Decode base64 → Uint8Array
      const binary = atob(snapshot.canvasState)
      const bytes = new Uint8Array(binary.length)
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i)
      }

      Y.applyUpdate(doc, bytes)
      socket.emit('canvas:save', { roomId })
      toast.success('Snapshot restored')
    },
    [roomId, doc, role, getSnapshot]
  )

  return { listSnapshots, createSnapshot, getSnapshot, deleteSnapshot, restoreSnapshot }
}

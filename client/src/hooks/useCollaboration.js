import { useEffect, useRef, useState, useCallback } from 'react'
import { createTLStore, defaultShapeUtils, getSnapshot, loadSnapshot } from 'tldraw'
import { createYjsSession } from '../lib/yjs'
import api from '../lib/api'

function safePut(store, records) {
  if (!records.length) return
  const knownTypes = new Set(Object.keys(store.schema.types))
  const valid = records.filter(
    (r) => r && typeof r === 'object' && r.id && r.typeName && knownTypes.has(r.typeName)
  )
  if (!valid.length) return
  try {
    store.mergeRemoteChanges(() => { store.put(valid) })
  } catch (e) {
    for (const record of valid) {
      try { store.mergeRemoteChanges(() => { store.put([record]) }) } catch (_) {}
    }
  }
}

export function useCollaboration(roomId) {
  const [store] = useState(() =>
    createTLStore({ shapeUtils: defaultShapeUtils })
  )
  const [status, setStatus] = useState('connecting')
  const sessionRef = useRef(null)
  const editorRef = useRef(null)
  const persistTimerRef = useRef(null)

  // Debounced save to REST API
  const schedulePersist = useCallback(() => {
    if (persistTimerRef.current) clearTimeout(persistTimerRef.current)
    persistTimerRef.current = setTimeout(async () => {
      if (!editorRef.current) return
      try {
        const snapshot = getSnapshot(store)
        await api.put(`/api/rooms/${roomId}/canvas`, snapshot)
      } catch (e) {
        console.warn('[collab] persist failed:', e.message)
      }
    }, 2000) // save 2s after last change
  }, [roomId, store])

  const onEditorReady = useCallback(async (editor) => {
    editorRef.current = editor

    // Load persisted snapshot from REST API
    try {
      const res = await api.get(`/api/rooms/${roomId}/canvas`)
      if (res.data) {
        loadSnapshot(store, res.data)
        console.log('[collab] loaded snapshot from REST')
      }
    } catch (e) {
      console.warn('[collab] failed to load snapshot:', e.message)
    }

    // Now connect Yjs for live sync with other clients
    const session = sessionRef.current
    if (!session) return
    const yRecords = session.doc.getMap('tldraw')

    // Push current store state into Yjs so other clients can sync
    if (yRecords.size === 0) {
      session.doc.transact(() => {
        store.allRecords().forEach((r) => yRecords.set(r.id, r))
      })
    } else {
      // Other clients already have state — apply it
      const records = []
      yRecords.forEach((r) => records.push(r))
      safePut(store, records)
    }
  }, [roomId, store])

  useEffect(() => {
    if (!roomId) return

    const { doc, provider } = createYjsSession(roomId)
    sessionRef.current = { doc, provider }

    const yRecords = doc.getMap('tldraw')

    function onStatus({ status: s }) {
      if (s === 'connected') setStatus('connected')
      else if (s === 'disconnected') setStatus('disconnected')
    }
    provider.on('status', onStatus)

    // Live sync: apply remote Yjs changes to tldraw store
    function onYjsChange(event) {
      if (!editorRef.current) return
      const puts = []
      const deletes = []
      event.changes.keys.forEach((change, key) => {
        if (change.action === 'delete') {
          deletes.push(key)
        } else {
          const record = yRecords.get(key)
          if (record) puts.push(record)
        }
      })
      if (!puts.length && !deletes.length) return
      try {
        store.mergeRemoteChanges(() => {
          if (puts.length) store.put(puts)
          if (deletes.length) store.remove(deletes)
        })
      } catch (e) {
        if (puts.length) safePut(store, puts)
      }
    }
    yRecords.observe(onYjsChange)

    function onSync(isSynced) {
      if (isSynced) setStatus('connected')
    }
    provider.on('sync', onSync)

    // Push local tldraw changes into Yjs for live sync
    const unsub = store.listen(
      ({ changes }) => {
        doc.transact(() => {
          Object.values(changes.added).forEach((r) => yRecords.set(r.id, r))
          Object.values(changes.updated).forEach(([, r]) => yRecords.set(r.id, r))
          Object.values(changes.removed).forEach((r) => yRecords.delete(r.id))
        })
        schedulePersist()
      },
      { source: 'user', scope: 'document' }
    )

    return () => {
      if (persistTimerRef.current) clearTimeout(persistTimerRef.current)
      editorRef.current = null
      unsub()
      yRecords.unobserve(onYjsChange)
      provider.off('status', onStatus)
      provider.off('sync', onSync)
      provider.destroy()
      doc.destroy()
      sessionRef.current = null
      setStatus('disconnected')
    }
  }, [roomId, store, schedulePersist])

  return { store, status, onEditorReady }
}

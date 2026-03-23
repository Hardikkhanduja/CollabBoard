import { useEffect, useState, useRef } from 'react'
import { Camera, Share2, History, WifiOff } from 'lucide-react'
import { useParams } from 'react-router-dom'
import { useAuth, useUser } from '@clerk/clerk-react'
import CanvasWrapper from '../components/canvas/CanvasWrapper'
import CursorOverlay from '../components/canvas/CursorOverlay'
import AvatarStack from '../components/AvatarStack'
import SnapshotDrawer from '../components/SnapshotDrawer'
import { useCollaboration } from '../hooks/useCollaboration'
import { usePresence } from '../hooks/usePresence'
import { useSnapshots } from '../hooks/useSnapshots'
import { useStore } from '../store/useStore'
import api from '../lib/api'

function RoomNameEditor({ roomId, roomMeta, role, onRename }) {
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState('')
  const inputRef = useRef(null)
  const isOwner = role === 'OWNER'

  function startEdit() {
    if (!isOwner) return
    setValue(roomMeta?.name ?? '')
    setEditing(true)
    setTimeout(() => inputRef.current?.select(), 0)
  }

  async function commit() {
    const trimmed = value.trim()
    setEditing(false)
    if (!trimmed || trimmed === roomMeta?.name) return
    try {
      const res = await api.patch(`/api/rooms/${roomId}`, { name: trimmed })
      onRename(res.data)
    } catch {
      // toast shown by interceptor
    }
  }

  function onKeyDown(e) {
    if (e.key === 'Enter') commit()
    if (e.key === 'Escape') setEditing(false)
  }

  if (editing) {
    return (
      <input
        ref={inputRef}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={commit}
        onKeyDown={onKeyDown}
        style={{
          background: '#1a1a1a',
          border: '1px solid #6ee7b7',
          borderRadius: '4px',
          color: '#fafafa',
          fontSize: '14px',
          fontWeight: 500,
          padding: '2px 8px',
          outline: 'none',
          width: '180px',
          flexShrink: 0,
        }}
      />
    )
  }

  return (
    <span
      onClick={startEdit}
      title={isOwner ? 'Click to rename' : undefined}
      style={{
        color: '#fafafa', fontSize: '14px', fontWeight: 500, flexShrink: 0,
        cursor: isOwner ? 'text' : 'default',
        borderRadius: '4px',
        padding: '2px 4px',
      }}
    >
      {roomMeta?.name ?? 'Loading…'}
    </span>
  )
}

export default function Board() {
  const { roomId } = useParams()
  const { userId: clerkId, isLoaded: authLoaded } = useAuth()
  const { user, isLoaded: userLoaded } = useUser()
  const { store, status, onEditorReady } = useCollaboration(roomId)
  const { activeUsers, roomMeta, setRoomMeta, snapshotDrawerOpen, setSnapshotDrawerOpen } = useStore()
  const docRef = useRef(null)

  const [snapshots, setSnapshots] = useState([])
  const [snapshotsLoading, setSnapshotsLoading] = useState(false)
  const [role, setRole] = useState('EDITOR')

  const userName = user?.fullName ?? user?.username ?? 'Anonymous'
  const userAvatar = user?.imageUrl

  const { emitCursorMove } = usePresence({
    roomId,
    userId: clerkId,
    userName,
    userAvatar,
  })

  const { listSnapshots, createSnapshot, deleteSnapshot, restoreSnapshot } = useSnapshots({
    roomId,
    doc: docRef.current,
    role,
  })

  // Load room metadata + role
  useEffect(() => {
    if (!roomId) return
    api.get(`/api/rooms/${roomId}`)
      .then((res) => {
        setRoomMeta(res.data)
        if (res.data.role) setRole(res.data.role)
      })
      .catch(() => {})
  }, [roomId, setRoomMeta])

  // Load snapshots when drawer opens
  useEffect(() => {
    if (!snapshotDrawerOpen) return
    setSnapshotsLoading(true)
    listSnapshots()
      .then(setSnapshots)
      .catch(() => {})
      .finally(() => setSnapshotsLoading(false))
  }, [snapshotDrawerOpen, listSnapshots])

  async function handleSnapshotClick() {
    try {
      await createSnapshot({ label: `Snapshot ${new Date().toLocaleString()}` })
      setSnapshotDrawerOpen(true)
      const list = await listSnapshots()
      setSnapshots(list)
    } catch {
      // toast already shown by api interceptor
    }
  }

  async function handleDelete(id) {
    await deleteSnapshot(id)
    setSnapshots((prev) => prev.filter((s) => s.id !== id))
  }

  async function handleRestore(id) {
    await restoreSnapshot(id)
  }

  function handlePointerMove(e) {
    emitCursorMove(e.clientX, e.clientY)
  }

  // Wait for Clerk auth to load
  if (!authLoaded || !userLoaded) return (
    <div style={{
      width: '100vw', height: '100vh', background: '#0a0a0a',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <p style={{ color: '#71717a', fontSize: '14px' }}>Authenticating…</p>
    </div>
  )

  // Wait for Yjs store to connect
  if (!store) return (
    <div style={{
      width: '100vw', height: '100vh', background: '#0a0a0a',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <p style={{ color: '#71717a', fontSize: '14px' }}>Connecting to board…</p>
    </div>
  )

  return (
    <div
      style={{ width: '100vw', height: '100vh', overflow: 'hidden', position: 'relative' }}
      onPointerMove={handlePointerMove}
    >
      {/* Canvas — offset top by 52px to sit below the top bar */}
      <div style={{ position: 'absolute', top: '52px', left: 0, right: 0, bottom: 0 }}>
        <CanvasWrapper store={store} onEditorReady={onEditorReady} />
      </div>

      {/* Cursor overlay */}
      <CursorOverlay currentUserId={clerkId} />

      {/* Reconnecting banner */}
      {status === 'disconnected' && (
        <div
          style={{
            position: 'fixed', top: '60px', left: '50%',
            transform: 'translateX(-50%)', zIndex: 20,
            display: 'flex', alignItems: 'center', gap: '8px',
            padding: '8px 16px', borderRadius: '8px',
            background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.08)',
            color: '#fbbf24', fontSize: '13px', fontWeight: 500,
          }}
        >
          <WifiOff size={14} />
          Reconnecting…
        </div>
      )}

      {/* Floating top bar */}
      <div
        style={{
          position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
          backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
          background: 'rgba(17,17,17,0.8)', borderBottom: '1px solid rgba(255,255,255,0.08)',
          display: 'flex', alignItems: 'center', gap: '12px',
          padding: '8px 16px', height: '52px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
          <div style={{
            width: '26px', height: '26px', borderRadius: '6px',
            background: '#6ee7b7', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Camera size={14} color="#0a0a0a" />
          </div>
        </div>

        <div style={{ width: '1px', height: '20px', background: 'rgba(255,255,255,0.08)', flexShrink: 0 }} />

        <RoomNameEditor roomId={roomId} roomMeta={roomMeta} role={role} onRename={setRoomMeta} />

        <div
          title={status}
          style={{
            width: '7px', height: '7px', borderRadius: '50%', flexShrink: 0,
            background: status === 'connected' ? '#6ee7b7' : status === 'connecting' ? '#fbbf24' : '#f87171',
          }}
        />

        <div style={{ flex: 1 }} />

        <AvatarStack users={activeUsers ?? []} />

        <button
          onClick={handleSnapshotClick}
          style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            padding: '5px 12px', borderRadius: '6px', fontSize: '13px', fontWeight: 500,
            background: '#1a1a1a', color: '#fafafa', border: '1px solid rgba(255,255,255,0.08)',
            cursor: 'pointer',
          }}
        >
          <History size={13} />
          <span className="hidden sm:inline">Snapshot</span>
        </button>

        <button
          onClick={() => {
            const clientUrl = import.meta.env.VITE_CLIENT_URL ?? window.location.origin
            const url = `${clientUrl}/join/${roomMeta?.inviteCode}`
            navigator.clipboard.writeText(url).then(() => {
              import('../lib/toast').then(({ toast }) => toast.success('Invite link copied!'))
            })
          }}
          disabled={!roomMeta?.inviteCode}
          style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            padding: '5px 12px', borderRadius: '6px', fontSize: '13px', fontWeight: 500,
            background: '#6ee7b7', color: '#0a0a0a', border: 'none',
            cursor: roomMeta?.inviteCode ? 'pointer' : 'not-allowed',
            opacity: roomMeta?.inviteCode ? 1 : 0.5,
          }}
        >
          <Share2 size={13} />
          <span className="hidden sm:inline">Share</span>
        </button>
      </div>

      {/* Snapshot drawer */}
      <SnapshotDrawer
        open={snapshotDrawerOpen}
        onClose={() => setSnapshotDrawerOpen(false)}
        snapshots={snapshots ?? []}
        onRestore={handleRestore}
        onDelete={handleDelete}
        role={role}
        loading={snapshotsLoading}
      />
    </div>
  )
}
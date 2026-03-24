import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Camera, X, Trash2 } from 'lucide-react'
import { SignInButton, SignedIn, SignedOut, UserButton, useAuth } from '@clerk/clerk-react'
import api from '../lib/api'

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

const modalBase = {
  background: '#111111',
  borderColor: 'rgba(255,255,255,0.08)',
}

const inputStyle = {
  background: '#1a1a1a',
  borderColor: 'rgba(255,255,255,0.08)',
  color: '#fafafa',
}

function CreateRoomModal({ onClose, onCreated }) {
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!name.trim()) return
    setLoading(true)
    try {
      const res = await api.post('/api/rooms', { name: name.trim() })
      onCreated(res.data.room.id)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="fixed inset-0 flex items-center justify-center"
      style={{ zIndex: 50, background: 'rgba(0,0,0,0.7)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm mx-4 rounded-xl p-6 border"
        style={modalBase}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-text-primary font-semibold text-base">Create Board</h2>
          <button onClick={onClose} className="text-text-muted hover:text-text-primary transition-colors">
            <X size={16} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <input
            autoFocus
            type="text"
            placeholder="Board name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={200}
            className="w-full px-3 py-2 rounded-md text-sm border outline-none focus:ring-1 focus:ring-accent"
            style={inputStyle}
          />
          <button
            type="submit"
            disabled={!name.trim() || loading}
            className="w-full py-2 rounded-md text-sm font-medium text-background bg-accent transition-opacity hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {loading ? 'Creating…' : 'Create Board'}
          </button>
        </form>
      </div>
    </div>
  )
}

function JoinRoomModal({ onClose, onJoined }) {
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!code.trim()) return
    setLoading(true)
    try {
      const res = await api.get(`/api/rooms/join/${code.trim()}`)
      onJoined(res.data.id)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="fixed inset-0 flex items-center justify-center"
      style={{ zIndex: 50, background: 'rgba(0,0,0,0.7)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm mx-4 rounded-xl p-6 border"
        style={modalBase}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-text-primary font-semibold text-base">Join with Code</h2>
          <button onClick={onClose} className="text-text-muted hover:text-text-primary transition-colors">
            <X size={16} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <input
            autoFocus
            type="text"
            placeholder="Invite code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="w-full px-3 py-2 rounded-md text-sm border outline-none focus:ring-1 focus:ring-accent"
            style={inputStyle}
          />
          <button
            type="submit"
            disabled={!code.trim() || loading}
            className="w-full py-2 rounded-md text-sm font-medium text-background bg-accent transition-opacity hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {loading ? 'Joining…' : 'Join Board'}
          </button>
        </form>
      </div>
    </div>
  )
}

function RoomSkeleton() {
  return (
    <div className="rounded-xl border p-4 animate-pulse" style={{ borderColor: 'rgba(255,255,255,0.08)', background: '#111111' }}>
      <div className="h-4 w-2/3 rounded bg-surface-2 mb-2" />
      <div className="h-3 w-1/3 rounded bg-surface-2" />
    </div>
  )
}

function ConfirmDeleteModal({ roomName, onConfirm, onClose }) {
  return (
    <div
      className="fixed inset-0 flex items-center justify-center"
      style={{ zIndex: 60, background: 'rgba(0,0,0,0.7)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm mx-4 rounded-xl p-6 border"
        style={modalBase}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-text-primary font-semibold text-base">Delete Board</h2>
          <button onClick={onClose} className="text-text-muted hover:text-text-primary transition-colors">
            <X size={16} />
          </button>
        </div>
        <p className="text-text-muted text-sm mb-5">
          Are you sure you want to delete <span style={{ color: '#fafafa', fontWeight: 500 }}>{roomName}</span>? This cannot be undone.
        </p>
        <div className="flex gap-2 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-md text-sm font-medium border transition-colors hover:bg-surface"
            style={{ borderColor: 'rgba(255,255,255,0.08)', color: '#fafafa' }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 rounded-md text-sm font-medium transition-opacity hover:opacity-90"
            style={{ background: '#ef4444', color: '#fff' }}
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  )
}

export default function Home() {
  const navigate = useNavigate()
  const { isSignedIn } = useAuth()
  const [showCreate, setShowCreate] = useState(false)
  const [showJoin, setShowJoin] = useState(false)
  const [rooms, setRooms] = useState([])
  const [loadingRooms, setLoadingRooms] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(null) // { id, name }

  useEffect(() => {
    if (!isSignedIn) return
    setLoadingRooms(true)
    api.get('/api/rooms')
      .then((res) => setRooms(Array.isArray(res.data) ? res.data : []))
      .catch(() => {})
      .finally(() => setLoadingRooms(false))
  }, [isSignedIn])

  function handleCreated(id) {
    setShowCreate(false)
    navigate(`/board/${id}`)
  }

  function handleJoined(id) {
    setShowJoin(false)
    navigate(`/board/${id}`)
  }

  async function handleDelete(e, room) {
    e.stopPropagation()
    setConfirmDelete({ id: room.id, name: room.name })
  }

  async function confirmDeleteRoom() {
    if (!confirmDelete) return
    try {
      await api.delete(`/api/rooms/${confirmDelete.id}`)
      setRooms((prev) => prev.filter((r) => r.id !== confirmDelete.id))
    } catch {}
    setConfirmDelete(null)
  }

  return (
    <div className="min-h-screen bg-background text-text-primary font-sans flex flex-col">
      {/* Nav */}
      <header className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-md bg-accent flex items-center justify-center">
            <Camera size={15} className="text-background" />
          </div>
          <span className="font-semibold text-sm tracking-tight">CollabBoard</span>
        </div>
        <SignedOut>
          <SignInButton mode="modal">
            <button
              className="px-4 py-1.5 rounded-md text-sm font-medium border cursor-pointer"
              style={{ borderColor: 'rgba(255,255,255,0.08)', color: '#fafafa', background: '#111111' }}
            >
              Sign In
            </button>
          </SignInButton>
        </SignedOut>
        <SignedIn>
          <UserButton afterSignOutUrl="/" />
        </SignedIn>
      </header>

      {/* Hero */}
      <section className="flex flex-col items-center justify-center px-6 py-16 text-center">
        <div className="w-14 h-14 rounded-2xl bg-accent flex items-center justify-center mb-6">
          <Camera size={28} className="text-background" />
        </div>
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-text-primary mb-3">
          CollabBoard
        </h1>
        <p className="text-text-muted text-base sm:text-lg max-w-md mb-10">
          Real-time collaborative whiteboards. Draw, annotate, and create together — live.
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => setShowCreate(true)}
            className="px-6 py-2.5 rounded-md text-sm font-semibold text-background bg-accent transition-opacity hover:opacity-90"
          >
            Create Board
          </button>
          <button
            onClick={() => setShowJoin(true)}
            className="px-6 py-2.5 rounded-md text-sm font-semibold text-text-primary border transition-colors hover:bg-surface"
            style={{ borderColor: 'rgba(255,255,255,0.08)' }}
          >
            Join with Code
          </button>
        </div>
      </section>

      {/* Recent boards */}
      <SignedIn>
        <section className="px-6 pb-16 max-w-3xl mx-auto w-full">
          <h2 className="text-text-primary font-semibold text-sm mb-4">Recent Boards</h2>
          {loadingRooms ? (
            <div className="flex flex-col gap-3">
              <RoomSkeleton /><RoomSkeleton /><RoomSkeleton />
            </div>
          ) : rooms.length === 0 ? (
            <div
              className="rounded-xl border p-10 flex flex-col items-center justify-center text-center"
              style={{ borderColor: 'rgba(255,255,255,0.08)', background: '#111111' }}
            >
              <p className="text-text-muted text-sm">No boards yet. Create or join one to get started.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {rooms.map((room) => (
                <button
                  key={room.id}
                  onClick={() => navigate(`/board/${room.id}`)}
                  className="w-full text-left rounded-xl border p-4 transition-colors hover:bg-surface-2"
                  style={{ borderColor: 'rgba(255,255,255,0.08)', background: '#111111' }}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-text-primary font-medium text-sm truncate">{room.name}</span>
                    <div className="flex items-center gap-2 ml-2 shrink-0">
                      <span className="text-xs text-text-muted capitalize">{room.role?.toLowerCase()}</span>
                      {room.role === 'OWNER' && (
                        <span
                          role="button"
                          onClick={(e) => handleDelete(e, room)}
                          className="p-1 rounded hover:bg-red-500/20 text-text-muted hover:text-red-400 transition-colors"
                          title="Delete board"
                        >
                          <Trash2 size={13} />
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 mt-1.5">
                    {room.memberCount !== undefined && (
                      <span className="text-xs text-text-muted">{room.memberCount} member{room.memberCount !== 1 ? 's' : ''}</span>
                    )}
                    {room.updatedAt && (
                      <span className="text-xs text-text-muted">{timeAgo(room.updatedAt)}</span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </section>
      </SignedIn>

      {showCreate && <CreateRoomModal onClose={() => setShowCreate(false)} onCreated={handleCreated} />}
      {showJoin && <JoinRoomModal onClose={() => setShowJoin(false)} onJoined={handleJoined} />}
      {confirmDelete && (
        <ConfirmDeleteModal
          roomName={confirmDelete.name}
          onConfirm={confirmDeleteRoom}
          onClose={() => setConfirmDelete(null)}
        />
      )}
    </div>
  )
}

import { useEffect, useState } from 'react'
import { X, RotateCcw, Trash2, Clock } from 'lucide-react'

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

/**
 * @param {{
 *   open: boolean,
 *   onClose: () => void,
 *   snapshots: Array,
 *   onRestore: (id: string) => Promise<void>,
 *   onDelete: (id: string) => Promise<void>,
 *   role: string,
 *   loading: boolean,
 * }} props
 */
export default function SnapshotDrawer({ open, onClose, snapshots = [], onRestore, onDelete, role, loading }) {
  const [confirmId, setConfirmId] = useState(null)
  const [actionLoading, setActionLoading] = useState(null)

  // Close on Escape
  useEffect(() => {
    if (!open) return
    function onKey(e) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  async function handleRestore(id) {
    setActionLoading(id + ':restore')
    try {
      await onRestore(id)
      onClose()
    } finally {
      setActionLoading(null)
    }
  }

  async function handleDelete(id) {
    setActionLoading(id + ':delete')
    try {
      await onDelete(id)
      setConfirmId(null)
    } finally {
      setActionLoading(null)
    }
  }

  const isViewer = role === 'VIEWER'

  return (
    <>
      {/* Backdrop */}
      {open && (
        <div
          onClick={onClose}
          style={{
            position: 'fixed', inset: 0, zIndex: 30,
            background: 'rgba(0,0,0,0.4)',
          }}
        />
      )}

      {/* Drawer */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          bottom: 0,
          width: '320px',
          zIndex: 40,
          background: '#111111',
          borderLeft: '1px solid rgba(255,255,255,0.08)',
          display: 'flex',
          flexDirection: 'column',
          transform: open ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 0.25s ease',
        }}
      >
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '16px', borderBottom: '1px solid rgba(255,255,255,0.08)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Clock size={15} color="#6ee7b7" />
            <span style={{ color: '#fafafa', fontWeight: 600, fontSize: '14px' }}>Version History</span>
          </div>
          <button
            onClick={onClose}
            style={{ color: '#71717a', background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}
          >
            <X size={16} />
          </button>
        </div>

        {/* List */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '8px' }}>
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '8px' }}>
              {[1, 2, 3].map((i) => (
                <div key={i} style={{
                  height: '72px', borderRadius: '8px',
                  background: '#1a1a1a', animation: 'pulse 1.5s infinite',
                }} />
              ))}
            </div>
          ) : snapshots.length === 0 ? (
            <div style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              justifyContent: 'center', height: '200px', color: '#71717a', fontSize: '13px',
            }}>
              No snapshots yet
            </div>
          ) : (
            snapshots.map((snap) => (
              <div
                key={snap.id}
                style={{
                  borderRadius: '8px',
                  border: '1px solid rgba(255,255,255,0.08)',
                  background: '#1a1a1a',
                  marginBottom: '8px',
                  overflow: 'hidden',
                }}
              >
                {/* Thumbnail */}
                {snap.thumbnail && (
                  <img
                    src={snap.thumbnail}
                    alt="snapshot"
                    style={{ width: '100%', height: '80px', objectFit: 'cover', display: 'block' }}
                  />
                )}

                <div style={{ padding: '10px 12px' }}>
                  <div style={{ color: '#fafafa', fontSize: '13px', fontWeight: 500, marginBottom: '2px' }}>
                    {snap.label ?? 'Snapshot'}
                  </div>
                  <div style={{ color: '#71717a', fontSize: '11px', marginBottom: '10px' }}>
                    {timeAgo(snap.createdAt)} · {snap.createdBy?.name ?? 'Unknown'}
                  </div>

                  {/* Confirm delete */}
                  {confirmId === snap.id ? (
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button
                        onClick={() => handleDelete(snap.id)}
                        disabled={actionLoading === snap.id + ':delete'}
                        style={{
                          flex: 1, padding: '5px', borderRadius: '5px', fontSize: '12px',
                          background: '#f87171', color: '#0a0a0a', border: 'none', cursor: 'pointer', fontWeight: 600,
                        }}
                      >
                        {actionLoading === snap.id + ':delete' ? '…' : 'Confirm Delete'}
                      </button>
                      <button
                        onClick={() => setConfirmId(null)}
                        style={{
                          padding: '5px 10px', borderRadius: '5px', fontSize: '12px',
                          background: '#222222', color: '#fafafa', border: '1px solid rgba(255,255,255,0.08)', cursor: 'pointer',
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button
                        onClick={() => handleRestore(snap.id)}
                        disabled={isViewer || actionLoading === snap.id + ':restore'}
                        title={isViewer ? 'Viewers cannot restore snapshots' : 'Restore this snapshot'}
                        style={{
                          flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px',
                          padding: '5px', borderRadius: '5px', fontSize: '12px', fontWeight: 500,
                          background: isViewer ? '#1a1a1a' : '#6ee7b7',
                          color: isViewer ? '#71717a' : '#0a0a0a',
                          border: isViewer ? '1px solid rgba(255,255,255,0.08)' : 'none',
                          cursor: isViewer ? 'not-allowed' : 'pointer',
                          opacity: actionLoading === snap.id + ':restore' ? 0.6 : 1,
                        }}
                      >
                        <RotateCcw size={11} />
                        {actionLoading === snap.id + ':restore' ? '…' : 'Restore'}
                      </button>
                      <button
                        onClick={() => setConfirmId(snap.id)}
                        style={{
                          padding: '5px 8px', borderRadius: '5px',
                          background: '#222222', color: '#f87171',
                          border: '1px solid rgba(255,255,255,0.08)', cursor: 'pointer',
                        }}
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  )
}

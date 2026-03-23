import { useStore } from '../../store/useStore'

export default function CursorOverlay({ currentUserId }) {
  const cursors = useStore((s) => s.cursors)

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        overflow: 'hidden',
        zIndex: 5,
      }}
    >
      {Object.values(cursors)
        .filter((c) => c.userId !== currentUserId)
        .map((cursor) => (
          <div
            key={cursor.userId}
            style={{
              position: 'absolute',
              left: cursor.x,
              top: cursor.y,
              transform: 'translate(-2px, -2px)',
              pointerEvents: 'none',
            }}
          >
            {/* SVG cursor pointer */}
            <svg width="18" height="22" viewBox="0 0 18 22" fill="none">
              <path
                d="M0 0L0 16L4.5 12L7.5 19L9.5 18L6.5 11L12 11L0 0Z"
                fill={cursor.color}
                stroke="rgba(0,0,0,0.4)"
                strokeWidth="1"
              />
            </svg>
            {/* Name label */}
            <div
              style={{
                position: 'absolute',
                top: '18px',
                left: '10px',
                background: cursor.color,
                color: '#0a0a0a',
                fontSize: '11px',
                fontWeight: 600,
                padding: '2px 6px',
                borderRadius: '4px',
                whiteSpace: 'nowrap',
                maxWidth: '120px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {cursor.name}
            </div>
          </div>
        ))}
    </div>
  )
}

/**
 * @param {{ users: Array<{userId: string, name: string, color: string, avatar?: string}> }} props
 */
export default function AvatarStack({ users = [] }) {
  const MAX_VISIBLE = 4
  const visible = users.slice(0, MAX_VISIBLE)
  const overflow = users.length - MAX_VISIBLE

  return (
    <div style={{ display: 'flex', alignItems: 'center' }}>
      {visible.map((user, i) => (
        <div
          key={user.userId}
          title={user.name}
          style={{
            width: '28px',
            height: '28px',
            borderRadius: '50%',
            border: `2px solid ${user.color}`,
            background: user.avatar ? 'transparent' : user.color,
            marginLeft: i === 0 ? 0 : '-8px',
            overflow: 'hidden',
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '11px',
            fontWeight: 700,
            color: '#0a0a0a',
            zIndex: MAX_VISIBLE - i,
            position: 'relative',
          }}
        >
          {user.avatar ? (
            <img src={user.avatar} alt={user.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            user.name?.[0]?.toUpperCase() ?? '?'
          )}
        </div>
      ))}

      {overflow > 0 && (
        <div
          style={{
            width: '28px',
            height: '28px',
            borderRadius: '50%',
            background: '#222222',
            border: '2px solid rgba(255,255,255,0.08)',
            marginLeft: '-8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '10px',
            fontWeight: 700,
            color: '#fafafa',
            flexShrink: 0,
            position: 'relative',
            zIndex: 0,
          }}
        >
          +{overflow}
        </div>
      )}
    </div>
  )
}

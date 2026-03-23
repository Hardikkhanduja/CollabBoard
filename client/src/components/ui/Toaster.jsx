import { useEffect, useState } from 'react'
import { toast } from '../../lib/toast'

export default function Toaster() {
  const [toasts, setToasts] = useState([])

  useEffect(() => {
    return toast.subscribe((event) => {
      setToasts((prev) => [...prev, event])
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== event.id))
      }, 4000)
    })
  }, [])

  if (toasts.length === 0) return null

  return (
    <div className="fixed bottom-4 right-4 flex flex-col gap-2" style={{ zIndex: 100 }}>
      {toasts.map((t) => (
        <div
          key={t.id}
          className="px-4 py-3 rounded-lg text-sm font-medium shadow-lg"
          style={{
            background: t.type === 'error' ? '#f87171' : t.type === 'success' ? '#6ee7b7' : '#1a1a1a',
            color: t.type === 'error' || t.type === 'success' ? '#0a0a0a' : '#fafafa',
            border: '1px solid rgba(255,255,255,0.08)',
          }}
        >
          {t.message}
        </div>
      ))}
    </div>
  )
}

import { useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '@clerk/clerk-react'
import api from '../lib/api'

export default function Join() {
  const { code } = useParams()
  const navigate = useNavigate()
  const { isSignedIn, isLoaded } = useAuth()

  useEffect(() => {
    if (!isLoaded) return

    // Not signed in — redirect to home, preserve the join code in state
    if (!isSignedIn) {
      navigate('/', { state: { joinCode: code } })
      return
    }

    api.get(`/api/rooms/join/${code}`)
      .then((res) => navigate(`/board/${res.data.id}`, { replace: true }))
      .catch(() => navigate('/', { replace: true }))
  }, [isLoaded, isSignedIn, code, navigate])

  return (
    <div style={{
      minHeight: '100vh', background: '#0a0a0a', display: 'flex',
      alignItems: 'center', justifyContent: 'center', color: '#fafafa',
      fontSize: '14px',
    }}>
      Joining board…
    </div>
  )
}

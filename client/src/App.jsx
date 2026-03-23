import { useEffect } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { useAuth } from '@clerk/clerk-react'
import Home from './pages/Home'
import Board from './pages/Board'
import Join from './pages/Join'
import NotFound from './pages/NotFound'
import Toaster from './components/ui/Toaster'
import ErrorBoundary from './components/ErrorBoundary'
import { setTokenGetter } from './lib/api'
import api from './lib/api'

function ApiInitializer() {
  const { getToken, isSignedIn } = useAuth()

  useEffect(() => {
    setTokenGetter(() => getToken())
  }, [getToken])

  // Upsert user in DB on sign-in
  useEffect(() => {
    if (!isSignedIn) return
    api.get('/api/users/me').catch(() => {})
  }, [isSignedIn])

  return null
}

function App() {
  return (
    <BrowserRouter>
      <ApiInitializer />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/board/:roomId" element={<ErrorBoundary><Board /></ErrorBoundary>} />
        <Route path="/join/:code" element={<Join />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      <Toaster />
    </BrowserRouter>
  )
}

export default App

import { createClerkClient } from '@clerk/backend'

const clerkClient = createClerkClient({
  secretKey: process.env.CLERK_SECRET_KEY ?? '',
  publishableKey: process.env.CLERK_PUBLISHABLE_KEY ?? '',
})

export async function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Unauthorized: missing token' })
    return
  }

  try {
    // Build a full URL so authenticateRequest can parse it
    const protocol = req.protocol ?? 'http'
    const host = req.headers.host ?? 'localhost'
    const fullUrl = `${protocol}://${host}${req.originalUrl}`

    const requestState = await clerkClient.authenticateRequest(
      new Request(fullUrl, {
        method: req.method,
        headers: new Headers(req.headers),
      })
    )

    if (!requestState.isSignedIn) {
      res.status(401).json({ error: 'Unauthorized: invalid token' })
      return
    }

    const auth = requestState.toAuth()
    req.auth = {
      userId: auth.userId,
      clerkId: auth.userId,
    }
    next()
  } catch (err) {
    console.error('[auth] verification error:', err?.message ?? err)
    res.status(401).json({ error: 'Unauthorized: invalid token' })
  }
}

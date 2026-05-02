import { createClerkClient, verifyToken } from '@clerk/backend'

const clerkClient = createClerkClient({
  secretKey: process.env.CLERK_SECRET_KEY ?? '',
})

export async function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Unauthorized: missing token' })
    return
  }

  const token = authHeader.split(' ')[1]

  try {
    const payload = await verifyToken(token, {
      secretKey: process.env.CLERK_SECRET_KEY ?? '',
    })

    req.auth = {
      userId: payload.sub,
      clerkId: payload.sub,
    }

    next()
  } catch (err) {
    console.error('[auth] verification error:', err?.message ?? err)
    res.status(401).json({ error: 'Unauthorized: invalid token' })
  }
}
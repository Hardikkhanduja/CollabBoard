import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '../lib/prisma.js'
import { requireAuth } from '../middleware/auth.js'

const router = Router()

const updateUserSchema = z
  .object({
    name: z.string().min(1).max(100).optional(),
    avatar: z.string().url().optional(),
  })
  .refine((data) => data.name !== undefined || data.avatar !== undefined, {
    message: 'At least one of name or avatar must be provided',
  })

// GET /api/users/me — get or create user profile
router.get('/me', requireAuth, async (req, res) => {
  const { clerkId } = req.auth

  try {
    const user = await prisma.user.upsert({
      where: { clerkId },
      update: {},
      create: {
        clerkId,
        email: `${clerkId}@placeholder.local`,
        name: 'Anonymous',
      },
    })

    res.json({
      id: user.id,
      clerkId: user.clerkId,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
    })
  } catch (error) {
    console.error('GET /api/users/me error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// PATCH /api/users/me — update display name / avatar
router.patch('/me', requireAuth, async (req, res) => {
  const { clerkId } = req.auth

  const parsed = updateUserSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: 'Validation failed', details: parsed.error.issues })
    return
  }

  const { name, avatar } = parsed.data

  try {
    const user = await prisma.user.update({
      where: { clerkId },
      data: {
        ...(name !== undefined && { name }),
        ...(avatar !== undefined && { avatar }),
      },
    })

    res.json({
      id: user.id,
      clerkId: user.clerkId,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
    })
  } catch (error) {
    console.error('PATCH /api/users/me error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

export default router

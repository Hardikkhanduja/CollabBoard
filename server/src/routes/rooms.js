import { Router } from 'express'
import { z } from 'zod'
import { nanoid } from 'nanoid'
import { prisma } from '../lib/prisma.js'
import { requireAuth } from '../middleware/auth.js'

const router = Router()

const roomNameSchema = z.object({
  name: z.string().min(1).max(200),
})

function toRoomMeta(room) {
  return {
    id: room.id,
    name: room.name,
    inviteCode: room.inviteCode,
    createdAt: room.createdAt.toISOString(),
    updatedAt: room.updatedAt.toISOString(),
    ownerId: room.ownerId,
  }
}

// POST /api/rooms — create room
router.post('/', requireAuth, async (req, res) => {
  const parsed = roomNameSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: 'Validation failed', details: parsed.error.issues })
    return
  }

  const { clerkId } = req.auth

  try {
    const user = await prisma.user.findUnique({ where: { clerkId } })
    if (!user) {
      res.status(401).json({ error: 'User not found' })
      return
    }

    const inviteCode = nanoid(10)

    const room = await prisma.$transaction(async (tx) => {
      const newRoom = await tx.room.create({
        data: { name: parsed.data.name, inviteCode, ownerId: user.id },
      })
      await tx.membership.create({
        data: { userId: user.id, roomId: newRoom.id, role: 'OWNER' },
      })
      return newRoom
    })

    res.status(201).json({ room: toRoomMeta(room), inviteCode: room.inviteCode })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// GET /api/rooms — list user's rooms
router.get('/', requireAuth, async (req, res) => {
  const { clerkId } = req.auth

  try {
    const user = await prisma.user.findUnique({ where: { clerkId } })
    if (!user) {
      res.status(401).json({ error: 'User not found' })
      return
    }

    const memberships = await prisma.membership.findMany({
      where: { userId: user.id },
      include: {
        room: { include: { _count: { select: { members: true } } } },
      },
      orderBy: { room: { updatedAt: 'desc' } },
    })

    const rooms = memberships.map((m) => ({
      ...toRoomMeta(m.room),
      role: m.role,
      memberCount: m.room._count.members,
    }))

    res.json(rooms)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// GET /api/rooms/join/:code — join by invite code (must be before /:id)
router.get('/join/:code', requireAuth, async (req, res) => {
  const { code } = req.params
  const { clerkId } = req.auth

  try {
    const user = await prisma.user.findUnique({ where: { clerkId } })
    if (!user) {
      res.status(401).json({ error: 'User not found' })
      return
    }

    const room = await prisma.room.findUnique({ where: { inviteCode: code } })
    if (!room) {
      res.status(404).json({ error: 'Room not found' })
      return
    }

    await prisma.membership.upsert({
      where: { userId_roomId: { userId: user.id, roomId: room.id } },
      update: {},
      create: { userId: user.id, roomId: room.id, role: 'EDITOR' },
    })

    res.json(toRoomMeta(room))
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// GET /api/rooms/:id — get room metadata
router.get('/:id', requireAuth, async (req, res) => {
  const { id } = req.params
  const { clerkId } = req.auth

  try {
    const user = await prisma.user.findUnique({ where: { clerkId } })
    if (!user) {
      res.status(401).json({ error: 'User not found' })
      return
    }

    const membership = await prisma.membership.findUnique({
      where: { userId_roomId: { userId: user.id, roomId: id } },
      include: { room: true },
    })

    if (!membership) {
      res.status(403).json({ error: 'Forbidden' })
      return
    }

    res.json({ ...toRoomMeta(membership.room), role: membership.role })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// PATCH /api/rooms/:id — rename room (owner only)
router.patch('/:id', requireAuth, async (req, res) => {
  const { id } = req.params
  const { clerkId } = req.auth

  const parsed = roomNameSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: 'Validation failed', details: parsed.error.issues })
    return
  }

  try {
    const user = await prisma.user.findUnique({ where: { clerkId } })
    if (!user) {
      res.status(401).json({ error: 'User not found' })
      return
    }

    const membership = await prisma.membership.findUnique({
      where: { userId_roomId: { userId: user.id, roomId: id } },
    })

    if (!membership || membership.role !== 'OWNER') {
      res.status(403).json({ error: 'Forbidden' })
      return
    }

    const room = await prisma.room.update({
      where: { id },
      data: { name: parsed.data.name },
    })

    res.json(toRoomMeta(room))
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// GET /api/rooms/:id/canvas — load canvas state
router.get('/:id/canvas', requireAuth, async (req, res) => {
  const { id } = req.params
  const { clerkId } = req.auth
  try {
    const user = await prisma.user.findUnique({ where: { clerkId } })
    if (!user) return res.status(401).json({ error: 'User not found' })
    const membership = await prisma.membership.findUnique({
      where: { userId_roomId: { userId: user.id, roomId: id } },
    })
    if (!membership) return res.status(403).json({ error: 'Forbidden' })
    const room = await prisma.room.findUnique({ where: { id }, select: { canvasState: true } })
    if (!room?.canvasState || room.canvasState.length === 0) return res.json(null)
    try {
      const json = JSON.parse(room.canvasState.toString('utf8'))
      res.json(json)
    } catch {
      res.json(null)
    }
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// PUT /api/rooms/:id/canvas — save canvas state
router.put('/:id/canvas', requireAuth, async (req, res) => {
  const { id } = req.params
  const { clerkId } = req.auth
  try {
    const user = await prisma.user.findUnique({ where: { clerkId } })
    if (!user) return res.status(401).json({ error: 'User not found' })
    const membership = await prisma.membership.findUnique({
      where: { userId_roomId: { userId: user.id, roomId: id } },
    })
    if (!membership) return res.status(403).json({ error: 'Forbidden' })
    const snapshot = req.body
    await prisma.room.update({
      where: { id },
      data: { canvasState: Buffer.from(JSON.stringify(snapshot), 'utf8') },
    })
    res.json({ ok: true })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// DELETE /api/rooms/:id — delete room (owner only)
router.delete('/:id', requireAuth, async (req, res) => {
  const { id } = req.params
  const { clerkId } = req.auth

  try {
    const user = await prisma.user.findUnique({ where: { clerkId } })
    if (!user) {
      res.status(401).json({ error: 'User not found' })
      return
    }

    const membership = await prisma.membership.findUnique({
      where: { userId_roomId: { userId: user.id, roomId: id } },
    })

    if (!membership) {
      res.status(404).json({ error: 'Room not found' })
      return
    }

    if (membership.role !== 'OWNER') {
      res.status(403).json({ error: 'Forbidden' })
      return
    }

    await prisma.room.delete({ where: { id } })
    res.status(204).send()
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

export default router

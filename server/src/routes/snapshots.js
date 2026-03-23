import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '../lib/prisma.js'
import { requireAuth } from '../middleware/auth.js'

const router = Router({ mergeParams: true })

const createSnapshotSchema = z.object({
  label: z.string().max(200).optional(),
  thumbnail: z.string().optional(),
  canvasState: z.string(), // base64-encoded Yjs binary from client
})

function toSnapshotMeta(snapshot) {
  return {
    id: snapshot.id,
    label: snapshot.label,
    thumbnail: snapshot.thumbnail,
    createdAt: snapshot.createdAt.toISOString(),
    createdBy: snapshot.createdBy
      ? { id: snapshot.createdBy.id, name: snapshot.createdBy.name }
      : { id: snapshot.userId, name: 'Unknown' },
  }
}

// POST /api/rooms/:id/snapshots — create snapshot
router.post('/', requireAuth, async (req, res) => {
  const { id: roomId } = req.params
  const { clerkId } = req.auth

  const parsed = createSnapshotSchema.safeParse(req.body)
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
      where: { userId_roomId: { userId: user.id, roomId } },
    })

    if (!membership) {
      res.status(403).json({ error: 'Forbidden' })
      return
    }

    const canvasStateBuffer = Buffer.from(parsed.data.canvasState, 'base64')

    const snapshot = await prisma.snapshot.create({
      data: {
        roomId,
        userId: user.id,
        label: parsed.data.label ?? null,
        thumbnail: parsed.data.thumbnail ?? null,
        canvasState: canvasStateBuffer,
      },
      include: { createdBy: true },
    })

    res.status(201).json(toSnapshotMeta(snapshot))
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// GET /api/rooms/:id/snapshots — list snapshots
router.get('/', requireAuth, async (req, res) => {
  const { id: roomId } = req.params
  const { clerkId } = req.auth

  try {
    const user = await prisma.user.findUnique({ where: { clerkId } })
    if (!user) {
      res.status(401).json({ error: 'User not found' })
      return
    }

    const membership = await prisma.membership.findUnique({
      where: { userId_roomId: { userId: user.id, roomId } },
    })

    if (!membership) {
      res.status(403).json({ error: 'Forbidden' })
      return
    }

    const snapshots = await prisma.snapshot.findMany({
      where: { roomId },
      orderBy: { createdAt: 'desc' },
      include: { createdBy: true },
    })

    res.json(snapshots.map(toSnapshotMeta))
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// GET /api/rooms/:id/snapshots/:sid — get full snapshot (with canvasState)
router.get('/:sid', requireAuth, async (req, res) => {
  const { id: roomId, sid } = req.params
  const { clerkId } = req.auth

  try {
    const user = await prisma.user.findUnique({ where: { clerkId } })
    if (!user) {
      res.status(401).json({ error: 'User not found' })
      return
    }

    const membership = await prisma.membership.findUnique({
      where: { userId_roomId: { userId: user.id, roomId } },
    })

    if (!membership) {
      res.status(403).json({ error: 'Forbidden' })
      return
    }

    const snapshot = await prisma.snapshot.findFirst({
      where: { id: sid, roomId },
      include: { createdBy: true },
    })

    if (!snapshot) {
      res.status(404).json({ error: 'Snapshot not found' })
      return
    }

    res.json({
      ...toSnapshotMeta(snapshot),
      canvasState: snapshot.canvasState.toString('base64'),
      roomId: snapshot.roomId,
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// DELETE /api/rooms/:id/snapshots/:sid — delete snapshot (editor+ only)
router.delete('/:sid', requireAuth, async (req, res) => {
  const { id: roomId, sid } = req.params
  const { clerkId } = req.auth

  try {
    const user = await prisma.user.findUnique({ where: { clerkId } })
    if (!user) {
      res.status(401).json({ error: 'User not found' })
      return
    }

    const membership = await prisma.membership.findUnique({
      where: { userId_roomId: { userId: user.id, roomId } },
    })

    if (!membership) {
      res.status(403).json({ error: 'Forbidden' })
      return
    }

    if (membership.role === 'VIEWER') {
      res.status(403).json({ error: 'Viewers cannot delete snapshots' })
      return
    }

    const snapshot = await prisma.snapshot.findFirst({
      where: { id: sid, roomId },
    })

    if (!snapshot) {
      res.status(404).json({ error: 'Snapshot not found' })
      return
    }

    await prisma.snapshot.delete({ where: { id: sid } })
    res.status(204).send()
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

export default router

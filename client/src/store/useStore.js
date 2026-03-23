import { create } from 'zustand'

/**
 * @typedef {Object} ActiveUser
 * @property {string} userId
 * @property {string} name
 * @property {string} color
 * @property {string} [avatar]
 */

/**
 * @typedef {Object} CursorData
 * @property {string} userId
 * @property {string} name
 * @property {string} color
 * @property {number} x
 * @property {number} y
 */

/**
 * @typedef {Object} RoomMeta
 * @property {string} id
 * @property {string} name
 * @property {string} inviteCode
 * @property {string} ownerId
 * @property {string} createdAt
 * @property {string} updatedAt
 */

export const useStore = create((set) => ({
  /** @type {ActiveUser[]} */
  activeUsers: [],

  /** @type {Record<string, CursorData>} */
  cursors: {},

  /** @type {RoomMeta|null} */
  roomMeta: null,

  snapshotDrawerOpen: false,

  // Actions
  setActiveUsers: (users) => set({ activeUsers: users }),

  addActiveUser: (user) =>
    set((state) => {
      const exists = state.activeUsers.some((u) => u.userId === user.userId)
      if (exists) return state
      return { activeUsers: [...state.activeUsers, user] }
    }),

  removeActiveUser: (userId) =>
    set((state) => ({
      activeUsers: state.activeUsers.filter((u) => u.userId !== userId),
    })),

  setCursors: (updater) =>
    set((state) => ({
      cursors: typeof updater === 'function' ? updater(state.cursors) : updater,
    })),

  setRoomMeta: (roomMeta) => set({ roomMeta }),

  setSnapshotDrawerOpen: (open) => set({ snapshotDrawerOpen: open }),
}))

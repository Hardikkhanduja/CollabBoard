// Shared type documentation (JS — no runtime values, just JSDoc for IDE support)

/**
 * @typedef {Object} RoomMeta
 * @property {string} id
 * @property {string} name
 * @property {string} inviteCode
 * @property {string} createdAt
 * @property {string} updatedAt
 * @property {string} ownerId
 * @property {number} [memberCount]
 */

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
 * @typedef {Object} SnapshotMeta
 * @property {string} id
 * @property {string|null} label
 * @property {string|null} thumbnail
 * @property {string} createdAt
 * @property {{id: string, name: string}} createdBy
 */

/**
 * @typedef {Object} UserProfile
 * @property {string} id
 * @property {string} clerkId
 * @property {string} name
 * @property {string} email
 * @property {string|null} avatar
 */

/**
 * @typedef {'OWNER'|'EDITOR'|'VIEWER'} Role
 */

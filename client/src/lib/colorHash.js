const COLORS = [
  '#f87171',
  '#fb923c',
  '#fbbf24',
  '#34d399',
  '#60a5fa',
  '#a78bfa',
  '#f472b6',
]

/**
 * Deterministically pick a color for a userId.
 * @param {string} userId
 * @returns {string}
 */
export function getColorForUser(userId) {
  if (!userId) return COLORS[0]
  let hash = 0
  for (let i = 0; i < userId.length; i++) {
    hash = (hash * 31 + userId.charCodeAt(i)) >>> 0
  }
  return COLORS[hash % COLORS.length]
}

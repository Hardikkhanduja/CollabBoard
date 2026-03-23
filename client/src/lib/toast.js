const listeners = []

function emit(type, message) {
  const event = { id: crypto.randomUUID(), type, message }
  listeners.forEach((l) => l(event))
}

export const toast = {
  success: (message) => emit('success', message),
  error: (message) => emit('error', message),
  info: (message) => emit('info', message),
  subscribe: (listener) => {
    listeners.push(listener)
    return () => {
      const idx = listeners.indexOf(listener)
      if (idx !== -1) listeners.splice(idx, 1)
    }
  },
}

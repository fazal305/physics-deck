/**
 * Minimal synchronous pub/sub bus. This is the only channel through which the
 * physics simulation layer and the React/Zustand layer are allowed to talk.
 * Neither side holds a reference to the other's internals.
 */
export class EventBus {
  constructor() {
    this.listeners = new Map()
  }

  on(eventType, handler) {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set())
    }
    this.listeners.get(eventType).add(handler)
    return () => this.off(eventType, handler)
  }

  off(eventType, handler) {
    this.listeners.get(eventType)?.delete(handler)
  }

  emit(eventType, payload) {
    const handlers = this.listeners.get(eventType)
    if (!handlers || handlers.size === 0) return
    for (const handler of handlers) {
      handler(payload)
    }
  }

  clear() {
    this.listeners.clear()
  }
}

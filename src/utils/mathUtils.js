export function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value))
}

export function lerp(a, b, t) {
  return a + (b - a) * t
}

export function magnitude(vector) {
  return Math.sqrt(vector.x * vector.x + vector.y * vector.y)
}

export function distance(a, b) {
  return magnitude({ x: a.x - b.x, y: a.y - b.y })
}

export function roundTo(value, decimals = 1) {
  const factor = 10 ** decimals
  return Math.round(value * factor) / factor
}

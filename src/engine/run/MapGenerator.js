import { createRng, hashStringToSeed, shuffle } from '../../utils/rng.js'

const LAYER_NODE_COUNTS = [1, 3, 4, 4, 3, 4, 3, 1]
const LAST_REGULAR_LAYER = LAYER_NODE_COUNTS.length - 2

function pickNodeType(layerIndex, rng) {
  if (layerIndex === 0) return 'combat'
  if (layerIndex === LAST_REGULAR_LAYER) return 'rest'
  const weighted = [
    ['combat', 5],
    ['combat', 5],
    ['event', 3],
    ['shop', 1.5],
    ['rest', 1.5],
  ]
  const total = weighted.reduce((sum, [, w]) => sum + w, 0)
  let roll = rng() * total
  for (const [type, weight] of weighted) {
    roll -= weight
    if (roll <= 0) return type
  }
  return 'combat'
}

/**
 * Generates a layered DAG map: nodes in each layer connect forward to 1-2
 * nodes in the next layer, guaranteeing every node (except the start) has at
 * least one incoming edge so nothing is orphaned.
 */
export function generateMap(seed) {
  const rng = typeof seed === 'string' ? hashStringToSeed(seed) : createRng(seed)
  const layers = []
  const nodes = {}
  let idCounter = 0

  for (let layerIndex = 0; layerIndex < LAYER_NODE_COUNTS.length; layerIndex++) {
    const count = LAYER_NODE_COUNTS[layerIndex]
    const layerNodeIds = []
    for (let i = 0; i < count; i++) {
      const id = `n${idCounter++}`
      const type =
        layerIndex === LAYER_NODE_COUNTS.length - 1
          ? 'boss'
          : layerIndex === 0
            ? 'combat'
            : pickNodeType(layerIndex, rng)
      nodes[id] = { id, layer: layerIndex, type, x: i, connections: [] }
      layerNodeIds.push(id)
    }
    layers.push(layerNodeIds)
  }

  for (let layerIndex = 0; layerIndex < layers.length - 1; layerIndex++) {
    const current = layers[layerIndex]
    const next = layers[layerIndex + 1]
    const incoming = new Set()

    for (const nodeId of current) {
      const connectionCount = current.length <= next.length ? (rng() < 0.4 ? 2 : 1) : 1
      const nodeX = nodes[nodeId].x
      const targets = shuffle(
        rng,
        next
          .map((id) => id)
          .sort((a, b) => Math.abs(nodes[a].x - nodeX) - Math.abs(nodes[b].x - nodeX))
      ).slice(0, connectionCount)
      nodes[nodeId].connections = targets
      targets.forEach((t) => incoming.add(t))
    }

    for (const nodeId of next) {
      if (incoming.has(nodeId)) continue
      const closest = current.reduce((best, id) =>
        Math.abs(nodes[id].x - nodes[nodeId].x) < Math.abs(nodes[best].x - nodes[nodeId].x) ? id : best
      , current[0])
      nodes[closest].connections.push(nodeId)
    }
  }

  return {
    seed,
    layers,
    nodes,
    startNodeId: layers[0][0],
    bossNodeId: layers[layers.length - 1][0],
  }
}

export function getReachableNextNodes(map, currentNodeId) {
  if (!currentNodeId) return [map.startNodeId]
  return map.nodes[currentNodeId]?.connections ?? []
}

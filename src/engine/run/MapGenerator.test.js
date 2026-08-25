import { describe, expect, it } from 'vitest'
import { generateMap, getReachableNextNodes } from './MapGenerator.js'

describe('generateMap', () => {
  it('gives every non-start node at least one incoming connection', () => {
    const map = generateMap(123)
    const reachableFromSomewhere = new Set()
    for (const node of Object.values(map.nodes)) {
      for (const targetId of node.connections) reachableFromSomewhere.add(targetId)
    }
    for (const node of Object.values(map.nodes)) {
      if (node.id === map.startNodeId) continue
      expect(reachableFromSomewhere.has(node.id)).toBe(true)
    }
  })

  it('has exactly one boss node in the final layer', () => {
    const map = generateMap(456)
    const lastLayer = map.layers[map.layers.length - 1]
    expect(lastLayer).toHaveLength(1)
    expect(map.nodes[lastLayer[0]].type).toBe('boss')
    expect(map.bossNodeId).toBe(lastLayer[0])
  })

  it('is deterministic for the same seed', () => {
    const a = generateMap(999)
    const b = generateMap(999)
    expect(Object.values(a.nodes).map((n) => n.type)).toEqual(Object.values(b.nodes).map((n) => n.type))
  })

  it('getReachableNextNodes returns the start node when nothing visited yet', () => {
    const map = generateMap(1)
    expect(getReachableNextNodes(map, null)).toEqual([map.startNodeId])
  })
})

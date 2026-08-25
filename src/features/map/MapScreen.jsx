import { useMemo } from 'react'
import { useRunStore } from '../../stores/useRunStore.js'
import { getReachableNextNodes } from '../../engine/run/MapGenerator.js'
import { MapNode } from './MapNode.jsx'
import { RelicBar } from '../relics/RelicBar.jsx'
import { useRelicStore } from '../../stores/useRelicStore.js'
import { getRelic } from '../../data/relics/relics.js'
import { ProgressBar } from '../../components/ProgressBar.jsx'

const COL_WIDTH = 110
const ROW_HEIGHT = 96

export function MapScreen({ onEnterNode }) {
  const map = useRunStore((s) => s.map)
  const currentNodeId = useRunStore((s) => s.currentNodeId)
  const visitedNodeIds = useRunStore((s) => s.visitedNodeIds)
  const gold = useRunStore((s) => s.gold)
  const playerHp = useRunStore((s) => s.playerHp)
  const playerMaxHp = useRunStore((s) => s.playerMaxHp)
  const ownedRelicIds = useRelicStore((s) => s.ownedRelicIds)
  const relics = useMemo(() => ownedRelicIds.map(getRelic), [ownedRelicIds])

  const reachable = useMemo(() => new Set(getReachableNextNodes(map, currentNodeId)), [map, currentNodeId])

  const maxNodesPerLayer = Math.max(...map.layers.map((l) => l.length))
  const width = map.layers.length * COL_WIDTH
  const height = maxNodesPerLayer * ROW_HEIGHT

  const positionOf = (nodeId) => {
    const node = map.nodes[nodeId]
    const layerNodes = map.layers[node.layer]
    const yOffset = (maxNodesPerLayer - layerNodes.length) * (ROW_HEIGHT / 2)
    return {
      x: node.layer * COL_WIDTH + COL_WIDTH / 2,
      y: yOffset + node.x * ROW_HEIGHT + ROW_HEIGHT / 2,
    }
  }

  const statusFor = (nodeId) => {
    if (nodeId === currentNodeId) return 'current'
    if (visitedNodeIds.includes(nodeId)) return 'visited'
    if (reachable.has(nodeId)) return 'available'
    return 'locked'
  }

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-4 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-surface px-4 py-3">
        <div className="flex min-w-48 items-center gap-3">
          <div className="w-40">
            <ProgressBar value={playerHp} max={playerMaxHp} colorClass="bg-kinetic-bright" label="Your health" />
          </div>
          <span className="text-sm text-ink-muted">
            {playerHp} / {playerMaxHp} HP
          </span>
        </div>
        <RelicBar relics={relics} />
        <div className="flex items-center gap-2 rounded-md border border-border-strong bg-surface-inset px-3 py-1.5">
          <span className="text-xs uppercase tracking-wide text-ink-faint">Gold</span>
          <span className="text-lg font-bold text-gold">{gold}</span>
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border border-border bg-surface p-6">
        <div className="relative" style={{ width, height }}>
          <svg className="absolute inset-0 h-full w-full" aria-hidden="true">
            {Object.values(map.nodes).flatMap((node) =>
              node.connections.map((targetId) => {
                const a = positionOf(node.id)
                const b = positionOf(targetId)
                const traveled = visitedNodeIds.includes(node.id) && visitedNodeIds.includes(targetId)
                return (
                  <line
                    key={`${node.id}-${targetId}`}
                    x1={a.x}
                    y1={a.y}
                    x2={b.x}
                    y2={b.y}
                    stroke={traveled ? 'var(--color-ember)' : 'var(--color-border-strong)'}
                    strokeWidth={traveled ? 2.5 : 1.5}
                  />
                )
              })
            )}
          </svg>
          {Object.values(map.nodes).map((node) => {
            const pos = positionOf(node.id)
            return (
              <div key={node.id} className="absolute -translate-x-1/2 -translate-y-1/2" style={{ left: pos.x, top: pos.y }}>
                <MapNode node={node} status={statusFor(node.id)} onSelect={onEnterNode} />
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

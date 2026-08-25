import { useMemo, useState } from 'react'
import { useRunStore } from '../../stores/useRunStore.js'
import { useRelicStore } from '../../stores/useRelicStore.js'
import { useDeckStore } from '../../stores/useDeckStore.js'
import { pickShopRelic } from '../../engine/run/RoguelikeRunManager.js'
import { getCard } from '../../data/cards/cards.js'
import { Button } from '../../components/Button.jsx'
import { Panel } from '../../components/Panel.jsx'

const REMOVAL_COST = 55

export function ShopScreen({ onContinue }) {
  const gold = useRunStore((s) => s.gold)
  const spendGold = useRunStore((s) => s.spendGold)
  const rng = useDeckStore((s) => s.rng)
  const ownedRelicIds = useRelicStore((s) => s.ownedRelicIds)
  const addRelic = useRelicStore((s) => s.addRelic)
  const masterDeck = useDeckStore((s) => s.masterDeck)
  const removeCard = useDeckStore((s) => s.removeCardFromMasterDeck)

  const [purchasedRelicIds, setPurchasedRelicIds] = useState([])
  const [removedInstanceId, setRemovedInstanceId] = useState(null)

  const stock = useMemo(() => {
    const owned = [...ownedRelicIds, ...purchasedRelicIds]
    const relics = []
    for (let i = 0; i < 3; i++) {
      const r = pickShopRelic(rng, [...owned, ...relics.map((x) => x.id)])
      if (r) relics.push(r)
    }
    return relics.map((r, i) => ({ ...r, price: 55 + i * 20 }))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const buyRelic = (relic) => {
    if (gold < relic.price || purchasedRelicIds.includes(relic.id)) return
    spendGold(relic.price)
    addRelic(relic.id)
    setPurchasedRelicIds((prev) => [...prev, relic.id])
  }

  const buyRemoval = (instanceId) => {
    if (gold < REMOVAL_COST || removedInstanceId) return
    spendGold(REMOVAL_COST)
    removeCard(instanceId)
    setRemovedInstanceId(instanceId)
  }

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl">Quarry Trader</h1>
        <div className="rounded-md border border-border-strong bg-surface-inset px-3 py-1.5 text-lg font-bold text-gold">
          {gold} gold
        </div>
      </div>

      <Panel title="Relics for sale">
        <div className="flex flex-wrap gap-4">
          {stock.map((relic) => {
            const bought = purchasedRelicIds.includes(relic.id)
            return (
              <div key={relic.id} className="w-56 rounded-md border border-border-strong bg-surface-raised p-3">
                <h3 className="font-heading text-sm font-semibold text-heading">{relic.name}</h3>
                <p className="mt-1 text-xs text-ink-muted">{relic.description}</p>
                <Button
                  variant={bought ? 'ghost' : 'primary'}
                  className="mt-3 w-full"
                  disabled={bought || gold < relic.price}
                  onClick={() => buyRelic(relic)}
                >
                  {bought ? 'Purchased' : `Buy — ${relic.price}g`}
                </Button>
              </div>
            )
          })}
        </div>
      </Panel>

      <Panel title={`Card removal — ${REMOVAL_COST} gold`}>
        <div className="flex max-h-56 flex-wrap gap-2 overflow-y-auto">
          {masterDeck.map((instance) => (
            <Button
              key={instance.instanceId}
              variant="ghost"
              disabled={!!removedInstanceId || gold < REMOVAL_COST}
              onClick={() => buyRemoval(instance.instanceId)}
              className="text-xs"
            >
              {getCard(instance.cardId).name}
            </Button>
          ))}
        </div>
        {removedInstanceId && <p className="mt-2 text-xs text-guard-bright">Card removed.</p>}
      </Panel>

      <div className="flex justify-end">
        <Button variant="primary" onClick={onContinue}>
          Leave Shop
        </Button>
      </div>
    </div>
  )
}

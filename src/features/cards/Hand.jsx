import { getCard } from '../../data/cards/cards.js'
import { Card } from './Card.jsx'

export function Hand({ hand, energy, selectedInstanceId, onSelectCard }) {
  return (
    <div
      className="flex gap-3 overflow-x-auto px-4 py-3 [scrollbar-width:thin]"
      role="list"
      aria-label="Hand of cards"
    >
      {hand.length === 0 && <p className="px-2 py-6 text-sm text-ink-faint">Hand is empty.</p>}
      {hand.map((instance) => {
        const cardDef = getCard(instance.cardId)
        return (
          <div role="listitem" key={instance.instanceId}>
            <Card
              cardDef={cardDef}
              instanceId={instance.instanceId}
              selected={selectedInstanceId === instance.instanceId}
              affordable={energy >= cardDef.cost}
              onSelect={onSelectCard}
            />
          </div>
        )
      })}
    </div>
  )
}

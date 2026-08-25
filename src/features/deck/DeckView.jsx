import { getCard } from '../../data/cards/cards.js'
import { Card } from '../cards/Card.jsx'
import { Button } from '../../components/Button.jsx'

export function DeckView({ masterDeck, onClose }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Deck contents"
      onClick={onClose}
    >
      <div
        className="max-h-[85vh] w-full max-w-4xl overflow-y-auto rounded-lg border border-border-strong bg-surface p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl">Your Deck ({masterDeck.length})</h2>
          <Button variant="ghost" onClick={onClose}>
            Close
          </Button>
        </div>
        <div className="flex flex-wrap gap-3">
          {masterDeck.map((instance) => (
            <Card
              key={instance.instanceId}
              cardDef={getCard(instance.cardId)}
              instanceId={instance.instanceId}
              selected={false}
              affordable
              onSelect={() => {}}
              compact
            />
          ))}
        </div>
      </div>
    </div>
  )
}

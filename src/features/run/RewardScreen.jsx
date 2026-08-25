import { useState } from 'react'
import { Card } from '../cards/Card.jsx'
import { Button } from '../../components/Button.jsx'
import { Panel } from '../../components/Panel.jsx'

export function RewardScreen({ reward, onConfirm }) {
  const [chosenId, setChosenId] = useState(null)

  return (
    <div className="mx-auto flex max-w-4xl flex-col items-center gap-6 p-6 text-center">
      <h1 className="text-3xl">Victory</h1>
      <Panel title="Spoils" className="w-full max-w-md">
        <p className="text-ink-muted">
          Gained <span className="font-semibold text-gold">{reward.gold} gold</span>
          {reward.relic && (
            <>
              {' '}
              and found <span className="font-semibold text-heading">{reward.relic.name}</span>.
            </>
          )}
        </p>
      </Panel>

      <div>
        <h2 className="mb-3 text-lg">Choose a card to add to your deck</h2>
        <div className="flex flex-wrap justify-center gap-4">
          {reward.cardChoices.map((cardDef) => (
            <Card
              key={cardDef.id}
              cardDef={cardDef}
              instanceId={cardDef.id}
              selected={chosenId === cardDef.id}
              affordable
              onSelect={(id) => setChosenId((current) => (current === id ? null : id))}
            />
          ))}
        </div>
      </div>

      <div className="flex gap-3">
        <Button variant="ghost" onClick={() => onConfirm(null)}>
          Skip
        </Button>
        <Button variant="primary" disabled={!chosenId} onClick={() => onConfirm(chosenId)}>
          Take Card
        </Button>
      </div>
    </div>
  )
}

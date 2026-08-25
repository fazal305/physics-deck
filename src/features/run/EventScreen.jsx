import { useState } from 'react'
import { useRunStore } from '../../stores/useRunStore.js'
import { useRelicStore } from '../../stores/useRelicStore.js'
import { useDeckStore } from '../../stores/useDeckStore.js'
import { pickRandomRelic } from '../../engine/run/RoguelikeRunManager.js'
import { CARD_REWARD_POOL_IDS } from '../../data/cards/cards.js'
import { rngPick } from '../../utils/rng.js'
import { Button } from '../../components/Button.jsx'
import { Panel } from '../../components/Panel.jsx'

export function EventScreen({ event, onContinue }) {
  const gold = useRunStore((s) => s.gold)
  const spendGold = useRunStore((s) => s.spendGold)
  const addGold = useRunStore((s) => s.addGold)
  const damagePlayer = useRunStore((s) => s.damagePlayerOutOfCombat)
  const ownedRelicIds = useRelicStore((s) => s.ownedRelicIds)
  const addRelic = useRelicStore((s) => s.addRelic)
  const rng = useDeckStore((s) => s.rng)
  const addCardToMasterDeck = useDeckStore((s) => s.addCardToMasterDeck)

  const [resultText, setResultText] = useState(null)

  const resolveOutcome = (outcome) => {
    switch (outcome.type) {
      case 'relic': {
        const relic = pickRandomRelic(rng, ownedRelicIds)
        if (relic) {
          addRelic(relic.id)
          setResultText(`You received ${relic.name}.`)
        } else {
          setResultText('Nothing happened.')
        }
        break
      }
      case 'damageAndCard': {
        damagePlayer(outcome.damage)
        const cardId = rngPick(rng, CARD_REWARD_POOL_IDS)
        addCardToMasterDeck(cardId)
        setResultText(`You took ${outcome.damage} damage and gained a new card.`)
        break
      }
      case 'damageAndGold': {
        damagePlayer(outcome.damage)
        addGold(outcome.gold)
        setResultText(`You took ${outcome.damage} damage and found ${outcome.gold} gold.`)
        break
      }
      default:
        setResultText('Nothing happened.')
    }
  }

  const handleChoice = (choice) => {
    if (choice.requiresGold && gold < choice.requiresGold) return
    if (choice.requiresGold) spendGold(choice.requiresGold)
    resolveOutcome(choice.outcome)
  }

  return (
    <div className="mx-auto flex max-w-xl flex-col items-center gap-6 p-6 text-center">
      <h1 className="text-3xl">{event.title}</h1>
      <p className="text-ink-muted">{event.description}</p>

      {resultText ? (
        <Panel className="w-full">
          <p className="text-guard-bright">{resultText}</p>
        </Panel>
      ) : (
        <div className="flex w-full flex-col gap-2">
          {event.choices.map((choice) => (
            <Button
              key={choice.id}
              variant="secondary"
              disabled={choice.requiresGold ? gold < choice.requiresGold : false}
              onClick={() => handleChoice(choice)}
            >
              {choice.label}
            </Button>
          ))}
        </div>
      )}

      <Button variant="primary" disabled={!resultText} onClick={onContinue}>
        Continue
      </Button>
    </div>
  )
}

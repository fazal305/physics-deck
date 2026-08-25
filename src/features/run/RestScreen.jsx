import { useState } from 'react'
import { useRunStore } from '../../stores/useRunStore.js'
import { useDeckStore } from '../../stores/useDeckStore.js'
import { getCard } from '../../data/cards/cards.js'
import { Button } from '../../components/Button.jsx'
import { Panel } from '../../components/Panel.jsx'

export function RestScreen({ onContinue }) {
  const playerHp = useRunStore((s) => s.playerHp)
  const playerMaxHp = useRunStore((s) => s.playerMaxHp)
  const healPlayer = useRunStore((s) => s.healPlayer)
  const masterDeck = useDeckStore((s) => s.masterDeck)
  const upgradeCard = useDeckStore((s) => s.upgradeCardInMasterDeck)

  const [mode, setMode] = useState(null) // 'rest' | 'upgrade' | 'done'
  const upgradeable = masterDeck.filter((c) => getCard(c.cardId).upgradesTo)

  const handleRest = () => {
    healPlayer(Math.round(playerMaxHp * 0.3))
    setMode('done')
  }

  const handleUpgrade = (instanceId) => {
    upgradeCard(instanceId)
    setMode('done')
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col items-center gap-6 p-6 text-center">
      <h1 className="text-3xl">Rest Site</h1>
      <p className="text-ink-muted">
        {playerHp}/{playerMaxHp} HP. Tend your wounds, or hone the edge of your deck — not both.
      </p>

      {mode === 'done' ? (
        <Panel className="w-full">
          <p className="text-guard-bright">Your party is ready to move on.</p>
        </Panel>
      ) : mode === 'upgrade' ? (
        <Panel title="Choose a card to upgrade" className="w-full">
          <div className="flex flex-wrap justify-center gap-2">
            {upgradeable.length === 0 && <p className="text-xs text-ink-faint">No upgradeable cards.</p>}
            {upgradeable.map((instance) => (
              <Button key={instance.instanceId} variant="ghost" onClick={() => handleUpgrade(instance.instanceId)}>
                {getCard(instance.cardId).name}
              </Button>
            ))}
          </div>
        </Panel>
      ) : (
        <div className="flex gap-4">
          <Button variant="primary" onClick={handleRest}>
            Rest (heal 30%)
          </Button>
          <Button variant="secondary" onClick={() => setMode('upgrade')}>
            Upgrade a card
          </Button>
        </div>
      )}

      <Button variant="ghost" disabled={mode !== 'done'} onClick={onContinue}>
        Continue
      </Button>
    </div>
  )
}

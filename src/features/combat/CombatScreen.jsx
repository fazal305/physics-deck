import { useEffect, useMemo, useRef, useState } from 'react'
import { EventBus } from '../../engine/events/EventBus.js'
import { CombatEngine } from '../../engine/combat/CombatEngine.js'
import { useCombatStore } from '../../stores/useCombatStore.js'
import { useDeckStore } from '../../stores/useDeckStore.js'
import { useRelicStore } from '../../stores/useRelicStore.js'
import { getCard } from '../../data/cards/cards.js'
import { getRelic } from '../../data/relics/relics.js'
import { PhysicsCanvas } from '../physics/PhysicsCanvas.jsx'
import { CombatHUD } from './CombatHUD.jsx'
import { CombatLog } from './CombatLog.jsx'
import { EnemyDisplay } from '../enemies/EnemyDisplay.jsx'
import { Hand } from '../cards/Hand.jsx'
import { PileButton } from '../deck/PileButton.jsx'
import { RelicBar } from '../relics/RelicBar.jsx'
import { Button } from '../../components/Button.jsx'
import { useReducedMotion } from '../../hooks/useReducedMotion.js'
import { useSettingsStore } from '../../stores/useSettingsStore.js'

const ENEMY_TURN_DELAY_MS = 900

export function CombatScreen({ enemyIds, playerVitals, onVictory, onDefeat }) {
  const engineRef = useRef(null)
  const [ready, setReady] = useState(false)
  const reducedMotion = useReducedMotion()
  const screenShakeEnabled = useSettingsStore((s) => s.screenShake)

  const phase = useCombatStore((s) => s.phase)
  const player = useCombatStore((s) => s.player)
  const enemies = useCombatStore((s) => s.enemies)
  const turnNumber = useCombatStore((s) => s.turnNumber)
  const log = useCombatStore((s) => s.log)
  const selectedCardInstanceId = useCombatStore((s) => s.selectedCardInstanceId)
  const setSelectedCard = useCombatStore((s) => s.setSelectedCard)

  const hand = useDeckStore((s) => s.hand)
  const drawPile = useDeckStore((s) => s.drawPile)
  const discardPile = useDeckStore((s) => s.discardPile)
  const exhaustPile = useDeckStore((s) => s.exhaustPile)

  const ownedRelicIds = useRelicStore((s) => s.ownedRelicIds)
  const relics = useMemo(() => ownedRelicIds.map(getRelic), [ownedRelicIds])

  useEffect(() => {
    const bus = new EventBus()
    const engine = new CombatEngine(bus)
    engineRef.current = engine
    engine.start(enemyIds, playerVitals)
    setReady(true)
    return () => {
      engine.destroy()
      engineRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (phase !== 'enemyTurn') return
    const timer = setTimeout(() => {
      engineRef.current?.runEnemyTurn()
    }, ENEMY_TURN_DELAY_MS)
    return () => clearTimeout(timer)
  }, [phase])

  useEffect(() => {
    if (phase === 'victory') {
      const timer = setTimeout(() => onVictory(useCombatStore.getState().player.hp), 700)
      return () => clearTimeout(timer)
    }
    if (phase === 'defeat') {
      const timer = setTimeout(() => onDefeat(), 700)
      return () => clearTimeout(timer)
    }
  }, [phase, onVictory, onDefeat])

  if (!ready) return null

  const selectedCard = selectedCardInstanceId ? hand.find((c) => c.instanceId === selectedCardInstanceId) : null
  const selectedCardDef = selectedCard ? getCard(selectedCard.cardId) : null
  const needsTarget = selectedCardDef?.targetType === 'chosenEnemy'

  const handleSelectCard = (instanceId) => {
    if (selectedCardInstanceId === instanceId) {
      setSelectedCard(null)
      return
    }
    const instance = hand.find((c) => c.instanceId === instanceId)
    const cardDef = getCard(instance.cardId)
    if (cardDef.targetType === 'chosenEnemy') {
      setSelectedCard(instanceId)
    } else {
      engineRef.current.playCard(instanceId, null)
      setSelectedCard(null)
    }
  }

  const handleSelectEnemy = (entityId) => {
    if (!needsTarget || !selectedCardInstanceId) return
    engineRef.current.playCard(selectedCardInstanceId, entityId)
    setSelectedCard(null)
  }

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-3 p-3 md:p-4">
      <CombatHUD player={player} turnNumber={turnNumber} phase={phase} />

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-[1fr_260px]">
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap justify-end gap-2">
            {enemies.map((enemy) => (
              <EnemyDisplay
                key={enemy.id}
                enemy={enemy}
                targetable={needsTarget}
                targeted={false}
                onSelect={handleSelectEnemy}
              />
            ))}
          </div>

          <div className="overflow-hidden rounded-lg border border-border-strong bg-void">
            <PhysicsCanvas
              physicsEngine={engineRef.current?.physicsEngine}
              reducedMotion={reducedMotion}
              screenShakeEnabled={screenShakeEnabled}
            />
          </div>

          <div className="flex items-center justify-between rounded-lg border border-border bg-surface px-3 py-2">
            <div className="flex gap-2">
              <PileButton label="Draw" cards={drawPile} />
              <PileButton label="Discard" cards={discardPile} />
              <PileButton label="Exhaust" cards={exhaustPile} />
            </div>
            <RelicBar relics={relics} />
            <Button
              variant="primary"
              onClick={() => engineRef.current.endPlayerTurn()}
              disabled={phase !== 'playerTurn'}
            >
              End Turn
            </Button>
          </div>

          <Hand hand={hand} energy={player.energy} selectedInstanceId={selectedCardInstanceId} onSelectCard={handleSelectCard} />
        </div>

        <div className="hidden lg:block">
          <CombatLog entries={log} />
        </div>
      </div>

      <div className="lg:hidden">
        <CombatLog entries={log.slice(-12)} />
      </div>
    </div>
  )
}

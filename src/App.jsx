import { useEffect, useState } from 'react'
import { useRunStore } from './stores/useRunStore.js'
import { useDeckStore } from './stores/useDeckStore.js'
import { useRelicStore } from './stores/useRelicStore.js'
import { useSettingsStore } from './stores/useSettingsStore.js'
import { isCombatNode, pickEncounterForNode, generateCardReward, generateGoldReward, pickRandomEvent, pickRandomRelic } from './engine/run/RoguelikeRunManager.js'
import { loadSave, updateSave, recordBestRun } from './utils/save.js'
import { Button } from './components/Button.jsx'

import { MainMenu } from './features/run/MainMenu.jsx'
import { SettingsModal } from './features/run/SettingsModal.jsx'
import { MapScreen } from './features/map/MapScreen.jsx'
import { CombatScreen } from './features/combat/CombatScreen.jsx'
import { RewardScreen } from './features/run/RewardScreen.jsx'
import { ShopScreen } from './features/run/ShopScreen.jsx'
import { RestScreen } from './features/run/RestScreen.jsx'
import { EventScreen } from './features/run/EventScreen.jsx'
import { RunEndScreen } from './features/run/RunEndScreen.jsx'
import { DeckView } from './features/deck/DeckView.jsx'

function App() {
  const [screen, setScreen] = useState('mainMenu')
  const [activeNode, setActiveNode] = useState(null)
  const [combatEnemyIds, setCombatEnemyIds] = useState([])
  const [activeEvent, setActiveEvent] = useState(null)
  const [enemiesDefeated, setEnemiesDefeated] = useState(0)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [deckViewOpen, setDeckViewOpen] = useState(false)
  const [bestRun, setBestRun] = useState(() => loadSave().bestRun)

  const map = useRunStore((s) => s.map)
  const floorsCleared = useRunStore((s) => s.floorsCleared)
  const playerHp = useRunStore((s) => s.playerHp)
  const playerMaxHp = useRunStore((s) => s.playerMaxHp)
  const pendingReward = useRunStore((s) => s.pendingReward)
  const masterDeck = useDeckStore((s) => s.masterDeck)
  const ownedRelicIds = useRelicStore((s) => s.ownedRelicIds)

  useEffect(() => {
    useSettingsStore.getState().hydrate(loadSave().settings)
    const unsub = useSettingsStore.subscribe((state) => {
      updateSave({ settings: { reducedMotion: state.reducedMotion, screenShake: state.screenShake, soundEnabled: state.soundEnabled } })
    })
    return unsub
  }, [])

  const startNewRun = () => {
    useRunStore.getState().startRun()
    useDeckStore.getState().resetToStarterDeck()
    useDeckStore.getState().seedRng(useRunStore.getState().seed)
    useRelicStore.getState().reset()
    setEnemiesDefeated(0)
    setScreen('map')
  }

  const enterNode = (nodeId) => {
    const node = map.nodes[nodeId]
    useRunStore.getState().travelTo(nodeId)
    setActiveNode(node)

    if (isCombatNode(node.type)) {
      const rng = useDeckStore.getState().rng
      const encounter = pickEncounterForNode(node, rng)
      setCombatEnemyIds(encounter.enemyIds)
      setScreen('combat')
    } else if (node.type === 'shop') {
      setScreen('shop')
    } else if (node.type === 'rest') {
      setScreen('rest')
    } else if (node.type === 'event') {
      const rng = useDeckStore.getState().rng
      setActiveEvent(pickRandomEvent(rng))
      setScreen('event')
    }
  }

  const handleVictory = (finalHp) => {
    useRunStore.getState().setPlayerHp(finalHp)
    useRunStore.getState().completeFloor()
    setEnemiesDefeated((n) => n + combatEnemyIds.length)

    const rng = useDeckStore.getState().rng
    const cardChoices = generateCardReward(rng, ownedRelicIds)
    const goldReward = generateGoldReward(activeNode.type, rng)
    const relic = activeNode.type === 'elite' ? pickRandomRelic(rng, ownedRelicIds) : null
    useRunStore.getState().setPendingReward({ cardChoices, gold: goldReward, relic })
    setScreen('reward')
  }

  const handleDefeat = () => {
    const finalFloors = floorsCleared
    recordBestRun(finalFloors, enemiesDefeated)
    setBestRun(loadSave().bestRun)
    useRunStore.getState().endRun('defeat')
    setScreen('runEnd')
  }

  const confirmReward = (chosenCardId) => {
    if (chosenCardId) useDeckStore.getState().addCardToMasterDeck(chosenCardId)
    useRunStore.getState().addGold(pendingReward.gold)
    if (pendingReward.relic) useRelicStore.getState().addRelic(pendingReward.relic.id)
    useRunStore.getState().clearPendingReward()

    if (activeNode?.type === 'boss') {
      recordBestRun(floorsCleared, enemiesDefeated)
      setBestRun(loadSave().bestRun)
      useRunStore.getState().endRun('victory')
      setScreen('runEnd')
    } else {
      setScreen('map')
    }
  }

  const returnToMenu = () => {
    setScreen('mainMenu')
  }

  return (
    <div className="min-h-screen bg-void text-ink">
      <header className="flex items-center justify-between border-b border-border px-4 py-2.5">
        <span className="font-heading text-sm font-semibold tracking-wide text-heading">PHYSICS DECK</span>
        {screen === 'map' && (
          <div className="flex gap-2">
            <Button variant="ghost" onClick={() => setDeckViewOpen(true)}>
              Deck ({masterDeck.length})
            </Button>
            <Button variant="ghost" onClick={() => setSettingsOpen(true)}>
              Settings
            </Button>
          </div>
        )}
        {screen === 'mainMenu' && (
          <Button variant="ghost" onClick={() => setSettingsOpen(true)}>
            Settings
          </Button>
        )}
      </header>

      <main>
        {screen === 'mainMenu' && (
          <MainMenu bestRun={bestRun} onStartRun={startNewRun} onOpenSettings={() => setSettingsOpen(true)} />
        )}
        {screen === 'map' && map && <MapScreen onEnterNode={enterNode} />}
        {screen === 'combat' && (
          <CombatScreen
            enemyIds={combatEnemyIds}
            playerVitals={{ hp: playerHp, maxHp: playerMaxHp }}
            onVictory={handleVictory}
            onDefeat={handleDefeat}
          />
        )}
        {screen === 'reward' && pendingReward && <RewardScreen reward={pendingReward} onConfirm={confirmReward} />}
        {screen === 'shop' && <ShopScreen onContinue={() => setScreen('map')} />}
        {screen === 'rest' && <RestScreen onContinue={() => setScreen('map')} />}
        {screen === 'event' && activeEvent && <EventScreen event={activeEvent} onContinue={() => setScreen('map')} />}
        {screen === 'runEnd' && (
          <RunEndScreen
            victory={useRunStore.getState().status === 'victory'}
            floorsCleared={floorsCleared}
            onReturnToMenu={returnToMenu}
          />
        )}
      </main>

      {settingsOpen && <SettingsModal onClose={() => setSettingsOpen(false)} />}
      {deckViewOpen && <DeckView masterDeck={masterDeck} onClose={() => setDeckViewOpen(false)} />}
    </div>
  )
}

export default App

# Physics Deck

A roguelike deckbuilder where cards don't just change numbers — they spawn real physics
objects into a Matter.js arena. A "Boulder" card drops an actual physics body; gravity
pulls it down; it collides with an enemy at some measured impact speed; damage and
knockback come out of that collision, not off a lookup table.

Built with React 19 + Vite, Zustand for state, and Matter.js for simulation. No
TypeScript, no UI kit, no external art — the visual identity is CSS design tokens and
a hand-drawn canvas renderer.

## Running it

```bash
npm install
npm run dev       # dev server
npm run build     # production build to dist/
npm run test      # vitest — engine/gameplay unit tests
npm run lint      # oxlint
```

## The React ↔ Matter.js bridge

This is the architectural centerpiece, so it's worth explaining precisely.

**The physics simulation never lives in React state, and React never re-renders because
of it.** `PhysicsEngine` (`src/engine/physics/PhysicsEngine.js`) wraps a `Matter.Engine`
and runs its own `requestAnimationFrame` loop, completely outside React's render cycle.
`PhysicsCanvas` (`src/features/physics/PhysicsCanvas.jsx`) reads live body positions
directly off that engine in its *own* `requestAnimationFrame` loop and draws them to a
`<canvas>` imperatively. Neither loop touches `useState` or a Zustand `set()` call per
frame — the two loops just happen to run in the same tab.

The only communication channel between the two worlds is a small synchronous
`EventBus` (`src/engine/events/EventBus.js`) and a fixed set of message types
(`src/engine/events/eventTypes.js`):

```
Card played
  → CardEngine resolves its data-driven `effects` array
  → for a physics effect, dispatches a PHYSICS_COMMAND (e.g. SPAWN_OBJECT) to PhysicsEngine
  → PhysicsEngine creates a Matter body, tags it with metadata (kind, owner, damage profile)
  → Matter simulates gravity/velocity/collision on its own clock
  → CollisionManager listens to Matter's collisionStart/collisionEnd
  → it computes impact speed, dedupes the contact episode, emits PHYSICS_EVENT.COLLISION_RESOLVED
  → PhysicsEventBridge is the ONLY module allowed to translate that fact into gameplay
  → it calls CombatEngine.applyPhysicsCollision(), which mutates the Zustand combat store
  → React re-renders the HUD/enemy HP bars because the store changed — once, not 60x/sec
```

`CollisionManager` never mentions "damage" or "HP" — it only knows about mass, velocity,
and impulses. `PhysicsEventBridge` never touches a Matter body — it only knows about
gameplay facts. That separation is what makes rebalancing a card (say, doubling boulder
damage) a one-line change in `physicsObjectProfiles.js` with zero physics-engine risk.

Combatant HP/status *numbers* live in Zustand (`useCombatStore`) so React can render
them normally. Combatant *positions* live only in Matter bodies. `PhysicsCanvas` bridges
the two for rendering by subscribing to the Zustand store with `useCombatStore.subscribe`
(the vanilla API, not the `useX` hook) into a `ref` — so HP numbers can update every
physics frame on canvas without ever triggering a React commit.

## Performance decisions

- **No physics body is a React component.** Every rock, crate, and combatant is a plain
  Matter body drawn imperatively on canvas. Adding a hundred pebble shards costs zero
  React reconciliation.
- **The physics `requestAnimationFrame` loop and the canvas draw loop are separate loops
  that never call `setState`.** State only changes on discrete gameplay events (a card
  played, a collision resolved, a turn ending) — an order of magnitude less often than
  60/sec.
- **Zustand selectors are narrow.** Components select just the slice they render
  (`s.player`, `s.enemies`, `s.hand`) so unrelated store writes don't force a re-render.
  Any selector that computed a *new* array/object every call (e.g. `getOwnedRelics()`)
  was rewritten to select the underlying primitive/id array and derive with `useMemo`
  — calling a store method inside a `useX((s) => s.method())` selector returns a fresh
  reference every render and creates an infinite re-render loop with React 19's
  `useSyncExternalStore`; the fix is always "select data, derive with `useMemo`."
- **Spawned physics objects are cleared once per turn** (not settle-detected every frame)
  so the arena doesn't accumulate rocks indefinitely across a long fight.
- **Collision dedup** guards against Matter firing multiple `collisionStart` events for
  the same contact episode (compound bodies, multi-vertex polys): a pair is tracked in
  an `activePairs` set from `collisionStart` to `collisionEnd`, so sustained resting
  contact never re-fires damage, but a genuine separation-and-recollide (a bounce) does.

## Project structure

```
src/
  components/       generic UI atoms (Button, Panel, ProgressBar, Tooltip)
  features/         screen-level React components, grouped by domain
    combat/         CombatScreen, CombatHUD, CombatLog
    cards/          Card, Hand
    enemies/        EnemyDisplay
    physics/        PhysicsCanvas (the only canvas-owning component)
    map/            MapScreen, MapNode
    deck/           DeckView, PileButton
    relics/         RelicBar
    run/            MainMenu, RewardScreen, ShopScreen, RestScreen, EventScreen, SettingsModal
  engine/
    physics/        PhysicsEngine, PhysicsWorld, PhysicsObjectManager, CollisionManager
    combat/         CombatEngine, TurnManager, CardEngine, EnemyManager, StatusEffectManager
    events/         EventBus, PhysicsEventBridge, eventTypes
    run/            MapGenerator, RoguelikeRunManager
  stores/           Zustand stores (run, deck, combat, relics, settings)
  data/             pure data: cards, enemies, relics, encounters, status effects
  utils/            rng (seeded, deterministic), math, save/localStorage
```

## How to add a new card

Add an entry to `src/data/cards/cards.js`. Nothing else needs to change as long as the
card's `effects` only use `type`s already implemented in `CardEngine`'s resolver map
(`damage`, `block`, `draw`, `energy`, `applyStatus`, `spawnObject`, `applyForce`,
`setGravity`, `attractToPoint`, `armChainReaction`):

```js
frostBoulder: {
  id: 'frostBoulder',
  name: 'Frost Boulder',
  type: 'physics',
  rarity: 'uncommon',
  cost: 2,
  targetType: 'chosenEnemy',
  tags: ['physics', 'spawn', 'cold'],
  description: 'A boulder that freezes on impact.',
  effects: [
    { type: 'spawnObject', objectKind: 'boulder', target: 'chosenEnemy', spawnSide: 'above' },
    { type: 'applyStatus', target: 'chosenEnemy', status: 'frozen', amount: 1 },
  ],
},
```

If the card spawns a genuinely new *kind* of physical object (not just reusing
`boulder`/`crate`/`ice_block`/etc.), add a profile to
`src/engine/physics/physicsObjectProfiles.js` describing its mass/friction/restitution
and damage-from-impact formula — the engine picks it up automatically.

## How to add a new enemy

Add an entry to `src/data/enemies/enemies.js`: HP, armor, a `physics` block (mass,
friction, restitution, radius — this is what makes a Heavy Brute barely budge from a
knockback while a Skitterling flies across the arena), `resistances` (e.g.
`knockbackMultiplier`, `explosiveDamageMultiplier`, `directDamageMultiplier`), and a
`moves` array cycled in fixed order by `EnemyManager` (attack/defend/applyStatus).
Then reference its id from an entry in `src/data/encounters/encounters.js` so it can
actually appear in a run.

## How physics collisions become gameplay events

1. A card's `spawnObject` effect dispatches `PHYSICS_COMMAND.SPAWN_OBJECT` to
   `PhysicsEngine`.
2. `PhysicsObjectManager` creates a Matter body with `body.plugin.physicsDeck` metadata
   describing what it is (kind, owning team, damage profile, destructible/explosive
   flags).
3. Matter simulates gravity/velocity on its own clock; nothing in gameplay code drives
   this.
4. `CollisionManager` listens to Matter's native `collisionStart`. When one side is a
   spawned object and the other is a combatant, it computes relative impact speed,
   looks up `damageFromImpact(profile, impactSpeed)`, computes a knockback impulse, and
   emits **one** `PHYSICS_EVENT.COLLISION_RESOLVED` fact (dedup guarded — see above).
   Explosive objects instead emit `PHYSICS_EVENT.EXPLOSION` with a list of everyone
   caught in the blast radius.
5. `PhysicsEventBridge` is subscribed to both event types and forwards them to
   `CombatEngine.applyPhysicsCollision` / `applyExplosion`.
6. `CombatEngine` applies relic multipliers and status-effect multipliers (Vulnerable,
   Weak, etc.), mutates `useCombatStore` (HP/block), and appends a combat log line.
   React re-renders the HUD from that store change — the physics engine itself was never
   touched by React and never will be.

## Known simplifications

- Enemy "AI" is a deterministic fixed-order move cycle with telegraphed intents, not a
  utility-based planner — deliberately simple to keep balance readable and testable.
- Only settings, best-run stats, and card "seen" unlocks persist to `localStorage`
  (`src/utils/save.js`). A run itself is not saved/resumable across a page reload —
  physics/simulation state is never a good persistence candidate, and per-turn combat
  state was judged not worth the complexity for this scope.

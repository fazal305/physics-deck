export const PHASES = Object.freeze({
  PLAYER_TURN: 'playerTurn',
  ENEMY_TURN: 'enemyTurn',
  VICTORY: 'victory',
  DEFEAT: 'defeat',
})

/**
 * Small phase-machine guard used by CombatEngine so phase transitions are
 * validated in one place rather than scattered `if (phase === ...)` checks.
 * CombatEngine still owns *what happens* during a transition (status ticks,
 * physics cleanup); this only answers "is this transition legal right now".
 */
export class TurnManager {
  canEndPlayerTurn(phase) {
    return phase === PHASES.PLAYER_TURN
  }

  canRunEnemyTurn(phase) {
    return phase === PHASES.ENEMY_TURN
  }

  isCombatOver(phase) {
    return phase === PHASES.VICTORY || phase === PHASES.DEFEAT
  }
}

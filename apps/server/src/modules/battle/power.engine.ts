// power.engine.ts — re-exports calculateFinalPower from battle.engine for
// consumers that want a focused import. No new logic lives here.
export {
  calculateFinalPower,
  resolveBattleOutcome,
  calculateCasualties,
  calculateRewards,
  calculateStatGrowth,
  type BattleContext,
} from '../battle/battle.engine.js';

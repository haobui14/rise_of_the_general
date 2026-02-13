import { create } from 'zustand';
import type { IBattle } from '@rotg/shared-types';

interface BattleState {
  activeBattleId: string | null;
  lastBattleResult: IBattle | null;
  setActiveBattle: (id: string | null) => void;
  setLastResult: (battle: IBattle | null) => void;
}

export const useBattleStore = create<BattleState>()((set) => ({
  activeBattleId: null,
  lastBattleResult: null,
  setActiveBattle: (id) => set({ activeBattleId: id }),
  setLastResult: (battle) => set({ lastBattleResult: battle }),
}));

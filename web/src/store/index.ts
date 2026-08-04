import { clearAll } from './storage'
import { loadSettings, saveSettings } from './settings'
import { loadScores, submitScore } from './scores'
import {
    addPlayer,
    ensurePlayer,
    getLastGame,
    getPlayer,
    getPlayers,
    removePlayer,
    savePlayer,
    selectPlayer,
    setLastGame,
} from './profiles'
import {
    computeBadge,
    getArcadeFacts,
    getCommonMistake,
    getDueFacts,
    getFactBox,
    getFormAccuracy,
    getFormStats,
    getStrategyMix,
    leadingStrategy,
    getWorkingMax,
    getMisses,
    getPersonalBests,
    getSkillStats,
    getSpacedRepetition,
    getWeakness,
    recordAnswer,
    recordFact,
    recordForm,
    recordRankAnswer,
    recordStrategy,
    recordMiss,
    updatePersonalBest,
} from './progress'

export type { GameSettings, TimerMode } from './settings'
export { THINKING_TIMES, TIMER_MODES, defaultSettings, settingsKeys } from './settings'

export type { ScoreEntry } from './scores'
export { RULESET_VERSION, scoreKeys } from './scores'

export type { GameRoute, Player } from './profiles'
export { gameRouteOf, profileKey, profileKeys, profilePrefix } from './profiles'

export type {
    ArcadeFacts,
    BadgeTier,
    FormStats,
    NamedMissReason,
    RankTunings,
    Strategy,
    StrategyMix,
    MissRecord,
    SkillStats,
    SpacedRepetitionData,
    SpacedRepetitionEntry,
} from './progress'
export { BADGE_EMOJI, STRATEGIES, computeBadge, progressKeys } from './progress'

export type { ProgressReport, SectionLine, SkillLine } from './report'
export { buildReport, readableFact } from './report'

export { storageKey } from './storage'

export const store = {

    getSettings: loadSettings,
    saveSettings,

    getPlayer,
    getPlayers,
    savePlayer,
    ensurePlayer,
    addPlayer,
    selectPlayer,
    removePlayer,

    getLastGame,
    setLastGame,

    getScores: loadScores,
    submitScore,

    getWeakness,
    getSpacedRepetition,
    getSkillStats,
    recordAnswer,

    getCommonMistake,
    getMisses,
    recordMiss,

    getArcadeFacts,
    getDueFacts,
    getFactBox,
    recordFact,

    getFormStats,
    getFormAccuracy,
    recordForm,

    getWorkingMax,
    recordRankAnswer,

    getStrategyMix,
    leadingStrategy,
    recordStrategy,

    getPersonalBests,
    updatePersonalBest,

    computeBadge,
    clearAllData: clearAll,
}

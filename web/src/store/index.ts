import { clearAll } from './storage'
import { loadSettings, saveSettings } from './settings'
import { loadLegacyScores, loadScores, submitScore } from './scores'
import {
    addPlayer,
    adoptLegacyProfile,
    ensurePlayer,
    getPlayer,
    getPlayers,
    removePlayer,
    savePlayer,
    selectPlayer,
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
export { THINKING_TIMES, TIMER_MODES, defaultSettings, legacyLevelToRank, settingsKeys } from './settings'

export type { LegacyScoreEntry, ScoreEntry } from './scores'
export { RULESET_VERSION, scoreKeys } from './scores'

export type { Player } from './profiles'
export { adoptLegacyProfile, profileKey, profileKeys, profilePrefix } from './profiles'

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

export { purgeRetiredStorage, storageKey } from './storage'

export const store = {
    adoptLegacyProfile,

    getSettings: loadSettings,
    saveSettings,

    getPlayer,
    getPlayers,
    savePlayer,
    ensurePlayer,
    addPlayer,
    selectPlayer,
    removePlayer,

    getScores: loadScores,
    getLegacyScores: loadLegacyScores,
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

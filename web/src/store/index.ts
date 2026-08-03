import { clearAll } from './storage'
import { loadSettings, saveSettings } from './settings'
import { loadLegacyScores, loadScores, submitScore } from './scores'
import {
    computeBadge,
    ensurePlayer,
    getMisses,
    getPersonalBests,
    getPlayer,
    getSkillStats,
    getSpacedRepetition,
    getWeakness,
    recordAnswer,
    recordMiss,
    savePlayer,
    updatePersonalBest,
} from './progress'

export type { GameSettings } from './settings'
export { defaultSettings, legacyLevelToRank, settingsKeys } from './settings'

export type { LegacyScoreEntry, ScoreEntry } from './scores'
export { RULESET_VERSION, scoreKeys } from './scores'

export type {
    BadgeTier,
    MissRecord,
    Player,
    SkillStats,
    SpacedRepetitionData,
    SpacedRepetitionEntry,
} from './progress'
export { BADGE_EMOJI, computeBadge, progressKeys } from './progress'

export { storageKey } from './storage'

export const store = {
    getSettings: loadSettings,
    saveSettings,

    getPlayer,
    savePlayer,
    ensurePlayer,

    getScores: loadScores,
    getLegacyScores: loadLegacyScores,
    submitScore,

    getWeakness,
    getSpacedRepetition,
    getSkillStats,
    recordAnswer,

    getMisses,
    recordMiss,

    getPersonalBests,
    updatePersonalBest,

    computeBadge,
    clearAllData: clearAll,
}

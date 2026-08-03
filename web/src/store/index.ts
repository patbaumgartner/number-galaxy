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
    getMisses,
    getPersonalBests,
    getSkillStats,
    getSpacedRepetition,
    getWeakness,
    recordAnswer,
    recordMiss,
    updatePersonalBest,
} from './progress'

export type { GameSettings } from './settings'
export { defaultSettings, legacyLevelToRank, settingsKeys } from './settings'

export type { LegacyScoreEntry, ScoreEntry } from './scores'
export { RULESET_VERSION, scoreKeys } from './scores'

export type { Player } from './profiles'
export { adoptLegacyProfile, profileKey, profileKeys, profilePrefix } from './profiles'

export type {
    BadgeTier,
    MissRecord,
    SkillStats,
    SpacedRepetitionData,
    SpacedRepetitionEntry,
} from './progress'
export { BADGE_EMOJI, computeBadge, progressKeys } from './progress'

export { storageKey } from './storage'

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

    getMisses,
    recordMiss,

    getPersonalBests,
    updatePersonalBest,

    computeBadge,
    clearAllData: clearAll,
}

import type { Language } from './game'

export const avatars = [
    '🚀', '👾', '🤖', '👽', '🛸', '⭐', '🌙', '☄️',
    '🔥', '💫', '🌟', '⚡', '🎮', '🕹️', '🎯', '🏆',
    '💎', '🦄', '🐉', '🦅', '🦁', '🐺', '🐼', '🦊',
]

export const languageLabels: Record<Language, string> = {
    de: '🇩🇪 Deutsch',
    it: '🇮🇹 Italiano',
    en: '🇬🇧 English',
    fr: '🇫🇷 Français',
}

/** 20 questions per training session (~15 min/day target). */
export const TOTAL_QUESTIONS_PER_RUN = 20

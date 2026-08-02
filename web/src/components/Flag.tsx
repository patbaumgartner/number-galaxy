import type { Language } from '../game'

/**
 * Flags drawn as SVG rather than 🇩🇪-style emoji.
 *
 * A flag emoji is a pair of regional indicator letters. Platforms without a
 * flag font — Windows and most Linux desktops — render that pair as the bare
 * letters "DE" or "GB" instead of a flag, so the picker stopped looking like
 * flags anywhere outside Apple devices. Drawn flags look the same everywhere.
 */

const FLAGS: Record<Language, React.ReactElement> = {
    de: (
        <>
            <rect width="24" height="6" y="0" fill="#000000" />
            <rect width="24" height="6" y="6" fill="#dd0000" />
            <rect width="24" height="6" y="12" fill="#ffce00" />
        </>
    ),
    it: (
        <>
            <rect width="8" height="18" x="0" fill="#008c45" />
            <rect width="8" height="18" x="8" fill="#f4f5f0" />
            <rect width="8" height="18" x="16" fill="#cd212a" />
        </>
    ),
    fr: (
        <>
            <rect width="8" height="18" x="0" fill="#002395" />
            <rect width="8" height="18" x="8" fill="#ffffff" />
            <rect width="8" height="18" x="16" fill="#ed2939" />
        </>
    ),
    en: (
        <>
            <rect width="24" height="18" fill="#012169" />
            <path d="M0 0 24 18M24 0 0 18" stroke="#ffffff" strokeWidth="4" />
            <path d="M0 0 24 18M24 0 0 18" stroke="#c8102e" strokeWidth="2" />
            <path d="M12 0v18M0 9h24" stroke="#ffffff" strokeWidth="6" />
            <path d="M12 0v18M0 9h24" stroke="#c8102e" strokeWidth="3.5" />
        </>
    ),
}

type FlagProps = {
    readonly language: Language
}

export default function Flag({ language }: FlagProps) {
    return (
        <svg className="flag" viewBox="0 0 24 18" role="presentation" aria-hidden="true" focusable="false">
            {FLAGS[language]}
        </svg>
    )
}

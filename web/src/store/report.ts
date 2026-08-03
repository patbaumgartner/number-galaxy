import { OPERATIONS, type Operation } from '../game'
import { isMastered } from '../review/leitner'
import { factsForPlanet } from '../timesTable/facts'
import { GALAXIES } from '../timesTable/tables'
import { ttStore } from '../timesTable/ttStore'
import { beamStore } from '../beam'
import { BEAM_STATIONS } from '../beam/stations'
import { senseStore } from '../sense'
import { SENSE_STATIONS } from '../sense/stations'
import { loadSettings } from './settings'
import { getArcadeFacts, getCommonMistake, getSkillStats, leadingStrategy, type NamedMissReason, type Strategy } from './progress'
import { getPlayer } from './profiles'

/**
 * One read-only page for a parent or a teacher.
 *
 * Everything here is already on the device; nothing new is recorded to build it,
 * and nothing leaves. The point is to answer "what should we practise next?" in
 * words someone can act on — a named mistake and a short list of facts — rather
 * than with a percentage, which tells you how it went and not what to do.
 */

/** The box from which an arcade fact counts as owned, as elsewhere in the app. */
const OWNED_BOX = 4

export type SkillLine = {
    readonly operation: Operation
    readonly answered: number
    readonly accuracy: number | null
    /** How the child says they mostly get there, once they have said so enough. */
    readonly strategy: Strategy | null
}

export type SectionLine = {
    readonly name: string
    readonly stars: number
    readonly outOf: number
}

export type ProgressReport = {
    readonly player: string
    readonly generatedAt: string
    readonly arcade: {
        readonly skills: readonly SkillLine[]
        readonly factsKnown: number
        readonly factsSeen: number
        /** The facts to look at next, newest first, as `7 + 8`-style strings. */
        readonly practiseNext: readonly string[]
        readonly mistake: NamedMissReason | null
    }
    readonly tables: {
        readonly factsKnown: number
        readonly factsTotal: number
        readonly stars: number
        readonly starsOutOf: number
    }
    readonly beam: SectionLine
    readonly sense: SectionLine
}

/**
 * `addition:7:8` reads back as `7 + 8`, which is what a parent can act on.
 *
 * A fact is stored as its *pair* — the two parts for `+ −`, the two factors for
 * `× ÷` — so taking or dividing needs the whole put back first. Printing the
 * stored pair directly would hand a parent "5 − 12", which is not a sum.
 */
export function readableFact(key: string): string | null {
    const [operation, first, second] = key.split(':')
    const a = Number(first)
    const b = Number(second)
    if (!Number.isFinite(a) || !Number.isFinite(b)) return null

    switch (operation) {
        case 'addition': return `${a} + ${b}`
        case 'multiplication': return `${a} × ${b}`
        case 'subtraction': return `${a + b} − ${b}`
        case 'division': return `${a * b} ÷ ${b}`
        default: return null
    }
}

function arcadeSkills(): SkillLine[] {
    const stats = getSkillStats()
    return OPERATIONS.map(operation => {
        const history = stats[operation]?.history ?? []
        return {
            operation,
            answered: history.length,
            accuracy: history.length === 0 ? null : history.filter(Boolean).length / history.length,
            strategy: leadingStrategy(operation),
        }
    })
}

/** How many trainer facts are known by heart, at the child's own thinking time. */
function tablesKnown(thinkingTime: number): { known: number; total: number } {
    const progress = ttStore.getProgress()
    const facts = GALAXIES
        .flatMap(galaxy => galaxy.planets)
        .flatMap(planet => factsForPlanet(planet.id))
    const seen = new Map(facts.map(fact => [fact.key, fact]))

    let known = 0
    for (const key of seen.keys()) {
        const entry = progress[key]
        if (entry !== undefined && isMastered(entry, thinkingTime)) known += 1
    }
    return { known, total: seen.size }
}

const sumStars = (values: readonly number[]): number => values.reduce((total, value) => total + value, 0)

export function buildReport(): ProgressReport {
    const { thinkingTime } = loadSettings()
    const facts = getArcadeFacts()
    const entries = Object.entries(facts)
    const tables = tablesKnown(thinkingTime)

    const ttStars = ttStore.getStars()
    const beamStars = beamStore.getStars()
    const senseStars = senseStore.getStars()

    return {
        player: getPlayer()?.playerName ?? '',
        generatedAt: new Date().toISOString(),
        arcade: {
            skills: arcadeSkills(),
            factsKnown: entries.filter(([, entry]) => entry.box >= OWNED_BOX).length,
            factsSeen: entries.length,
            practiseNext: entries
                .filter(([, entry]) => entry.box < OWNED_BOX)
                .reverse()
                .map(([key]) => readableFact(key))
                .filter((fact): fact is string => fact !== null)
                .slice(0, 8),
            mistake: getCommonMistake(),
        },
        tables: {
            factsKnown: tables.known,
            factsTotal: tables.total,
            stars: sumStars(Object.values(ttStars)),
            starsOutOf: GALAXIES.flatMap(galaxy => galaxy.planets).length * 3,
        },
        beam: { name: 'beam', stars: sumStars(Object.values(beamStars)), outOf: BEAM_STATIONS.length * 3 },
        sense: { name: 'sense', stars: sumStars(Object.values(senseStars)), outOf: SENSE_STATIONS.length * 3 },
    }
}

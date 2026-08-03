import type { Equation, BinaryOperation } from './equations'
import type { Language } from './types'
import { pick, type Rng } from './rng'

/**
 * The same arithmetic, wearing the situation it came from.
 *
 * A child who can compute `24 ÷ 6` perfectly well may still not know that this
 * is the sum a question about sharing apples is asking for — choosing the
 * operation is a separate skill from carrying it out, and a page of bare
 * equations never exercises it.
 *
 * The types below are the standard ones, and the distinction that matters most
 * is inside division: *sharing* 24 apples between 6 children and *grouping* 24
 * apples into bags of 6 give the same answer for entirely different reasons, and
 * children who meet only one of them reliably come unstuck on the other.
 */
export type StoryType =
    | 'join' // 7 and 5 more
    | 'partWhole' // 7 red and 5 blue together
    | 'separate' // 12, give 5 away
    | 'compare' // 12 against 5 — how many more
    | 'grouping' // 6 boxes of 7
    | 'sharing' // 24 shared between 6
    | 'measuring' // 24 in bags of 6

const STORY_TYPES: Record<BinaryOperation, readonly StoryType[]> = {
    addition: ['join', 'partWhole'],
    subtraction: ['separate', 'compare'],
    multiplication: ['grouping'],
    division: ['sharing', 'measuring'],
}

type Words = {
    /** Plural nouns, chosen so no template ever needs a gendered article. */
    readonly things: readonly string[]
    readonly holders: readonly string[]
    readonly people: readonly string[]
    readonly colours: readonly [string, string]
    readonly line: Record<StoryType, (parts: Parts) => string>
}

type Parts = {
    readonly a: number
    readonly b: number
    readonly thing: string
    readonly holder: string
    readonly person: string
    readonly other: string
    readonly colours: readonly [string, string]
}

const WORDS: Record<Language, Words> = {
    de: {
        things: ['Murmeln', 'Sticker', 'Äpfel', 'Steine'],
        holders: ['Kisten', 'Körbe', 'Taschen'],
        people: ['Mia', 'Jonas', 'Lea', 'Elias'],
        colours: ['rote', 'blaue'],
        line: {
            join: p => `${p.person} hat ${p.a} ${p.thing} und bekommt ${p.b} dazu. Wie viele sind es jetzt?`,
            partWhole: p => `Da sind ${p.a} ${p.colours[0]} und ${p.b} ${p.colours[1]} ${p.thing}. Wie viele sind es zusammen?`,
            separate: p => `${p.person} hat ${p.a} ${p.thing} und gibt ${p.b} davon weg. Wie viele bleiben?`,
            compare: p => `${p.person} hat ${p.a} ${p.thing}, ${p.other} hat ${p.b}. Wie viele hat ${p.person} mehr?`,
            grouping: p => `${p.a} ${p.holder} mit je ${p.b} ${p.thing}. Wie viele ${p.thing} sind es?`,
            sharing: p => `${p.a} ${p.thing} werden gerecht an ${p.b} Kinder verteilt. Wie viele bekommt jedes Kind?`,
            measuring: p => `${p.a} ${p.thing} kommen zu je ${p.b} in ${p.holder}. Wie viele ${p.holder} braucht es?`,
        },
    },
    en: {
        things: ['marbles', 'stickers', 'apples', 'stones'],
        holders: ['boxes', 'baskets', 'bags'],
        people: ['Mia', 'Jonas', 'Lea', 'Elias'],
        colours: ['red', 'blue'],
        line: {
            join: p => `${p.person} has ${p.a} ${p.thing} and gets ${p.b} more. How many now?`,
            partWhole: p => `There are ${p.a} ${p.colours[0]} and ${p.b} ${p.colours[1]} ${p.thing}. How many altogether?`,
            separate: p => `${p.person} has ${p.a} ${p.thing} and gives ${p.b} away. How many are left?`,
            compare: p => `${p.person} has ${p.a} ${p.thing}, ${p.other} has ${p.b}. How many more has ${p.person}?`,
            grouping: p => `${p.a} ${p.holder} with ${p.b} ${p.thing} in each. How many ${p.thing} are there?`,
            sharing: p => `${p.a} ${p.thing} are shared equally between ${p.b} children. How many does each child get?`,
            measuring: p => `${p.a} ${p.thing} go into ${p.holder} of ${p.b}. How many ${p.holder} are needed?`,
        },
    },
    fr: {
        things: ['billes', 'autocollants', 'pommes', 'cailloux'],
        holders: ['boîtes', 'paniers', 'sacs'],
        people: ['Mia', 'Jonas', 'Léa', 'Elias'],
        colours: ['rouges', 'bleus'],
        line: {
            join: p => `${p.person} a ${p.a} ${p.thing} et en reçoit ${p.b} de plus. Combien maintenant ?`,
            partWhole: p => `Il y a ${p.a} ${p.thing} ${p.colours[0]} et ${p.b} ${p.colours[1]}. Combien en tout ?`,
            separate: p => `${p.person} a ${p.a} ${p.thing} et en donne ${p.b}. Combien en reste-t-il ?`,
            compare: p => `${p.person} a ${p.a} ${p.thing}, ${p.other} en a ${p.b}. Combien ${p.person} en a-t-il de plus ?`,
            grouping: p => `${p.a} ${p.holder} avec ${p.b} ${p.thing} dans chacune. Combien de ${p.thing} en tout ?`,
            sharing: p => `${p.a} ${p.thing} sont partagées entre ${p.b} enfants. Combien pour chaque enfant ?`,
            measuring: p => `${p.a} ${p.thing} sont mises par ${p.b} dans des ${p.holder}. Combien de ${p.holder} faut-il ?`,
        },
    },
    it: {
        things: ['biglie', 'adesivi', 'mele', 'sassi'],
        holders: ['scatole', 'cesti', 'sacchetti'],
        people: ['Mia', 'Jonas', 'Lea', 'Elia'],
        colours: ['rosse', 'blu'],
        line: {
            join: p => `${p.person} ha ${p.a} ${p.thing} e ne riceve ${p.b} in più. Quante sono adesso?`,
            partWhole: p => `Ci sono ${p.a} ${p.thing} ${p.colours[0]} e ${p.b} ${p.colours[1]}. Quante sono in tutto?`,
            separate: p => `${p.person} ha ${p.a} ${p.thing} e ne regala ${p.b}. Quante ne restano?`,
            compare: p => `${p.person} ha ${p.a} ${p.thing}, ${p.other} ne ha ${p.b}. Quante ne ha in più ${p.person}?`,
            grouping: p => `${p.a} ${p.holder} con ${p.b} ${p.thing} ciascuna. Quante ${p.thing} sono?`,
            sharing: p => `${p.a} ${p.thing} vengono divise fra ${p.b} bambini. Quante ne riceve ogni bambino?`,
            measuring: p => `${p.a} ${p.thing} vanno a ${p.b} per ${p.holder}. Quante ${p.holder} servono?`,
        },
    },
}

/**
 * A story for `equation`, or nothing when its numbers would make a silly one.
 *
 * Sharing 3 apples between 12 children is arithmetic that works and a situation
 * that does not, and a child who pictures the situation — which is the entire
 * point of asking this way — will be misled by it.
 */
export function storyFor(
    rng: Rng,
    language: Language,
    operation: BinaryOperation,
    equation: Equation,
): string | null {
    const { left, right } = equation
    const words = WORDS[language]
    const type = pick(rng, STORY_TYPES[operation])

    if (operation === 'division' && right > left) return null
    if (operation === 'multiplication' && left > 12) return null

    const people = words.people
    const person = pick(rng, people)
    const other = pick(rng, people.filter(name => name !== person))

    return words.line[type]({
        a: left,
        b: right,
        thing: pick(rng, words.things),
        holder: pick(rng, words.holders),
        person,
        other,
        colours: words.colours,
    })
}

export const STORY_TYPES_BY_OPERATION = STORY_TYPES

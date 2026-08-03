import type { Language } from '../game'
import type { Fact, PlanetId } from './types'

type StrategyCard = {
    readonly title: string
    readonly lines: readonly string[]
}

type LocalizedCards = Record<Language, StrategyCard>

const skipCountCard = (
    factor: number,
    pattern: Record<Language, string>,
): LocalizedCards => ({
    de: {
        title: `Die ${factor}er-Reihe`,
        lines: [`Zähle in ${factor}er-Schritten: ${factor}, ${factor * 2}, ${factor * 3} …`, pattern.de],
    },
    it: {
        title: `La tabellina del ${factor}`,
        lines: [`Conta di ${factor} in ${factor}: ${factor}, ${factor * 2}, ${factor * 3} …`, pattern.it],
    },
    en: {
        title: `The ${factor} times table`,
        lines: [`Count in ${factor}s: ${factor}, ${factor * 2}, ${factor * 3} …`, pattern.en],
    },
    fr: {
        title: `La table de ${factor}`,
        lines: [`Compte de ${factor} en ${factor} : ${factor}, ${factor * 2}, ${factor * 3} …`, pattern.fr],
    },
})

export const STRATEGY_CARDS: Partial<Record<PlanetId, LocalizedCards>> = {
    t1: skipCountCard(1, {
        de: 'Mal 1 bleibt die Zahl selbst.',
        it: 'Per 1 il numero resta uguale.',
        en: 'Times 1 keeps the number the same.',
        fr: 'Multiplier par 1 garde le même nombre.',
    }),
    t2: skipCountCard(2, {
        de: 'Mal 2 heisst: die Zahl verdoppeln.',
        it: 'Per 2 vuol dire raddoppiare.',
        en: 'Times 2 means double the number.',
        fr: 'Multiplier par 2, c’est doubler.',
    }),
    t3: skipCountCard(3, {
        de: 'Dreimal ist ein Doppeltes und noch einmal die Zahl.',
        it: 'Tre volte è il doppio più ancora una volta il numero.',
        en: 'Three times is double, plus one more group.',
        fr: 'Trois fois, c’est le double plus encore une fois.',
    }),
    t4: skipCountCard(4, {
        de: 'Mal 4 heisst: zweimal verdoppeln.',
        it: 'Per 4 vuol dire raddoppiare due volte.',
        en: 'Times 4 means double twice.',
        fr: 'Multiplier par 4, c’est doubler deux fois.',
    }),
    t5: skipCountCard(5, {
        de: 'Mal 5 ist die Hälfte von mal 10.',
        it: 'Per 5 è la metà di per 10.',
        en: 'Times 5 is half of times 10.',
        fr: 'Multiplier par 5, c’est la moitié de multiplier par 10.',
    }),
    t6: skipCountCard(6, {
        de: 'Mal 6 ist mal 5 und noch einmal die Zahl.',
        it: 'Per 6 è per 5 più ancora una volta il numero.',
        en: 'Times 6 is times 5 plus one more group.',
        fr: 'Multiplier par 6, c’est multiplier par 5 plus encore une fois.',
    }),
    t7: skipCountCard(7, {
        de: 'Mal 7 ist mal 5 und noch zweimal die Zahl.',
        it: 'Per 7 è per 5 più due volte il numero.',
        en: 'Times 7 is times 5 plus two more groups.',
        fr: 'Multiplier par 7, c’est multiplier par 5 plus deux fois le nombre.',
    }),
    t8: skipCountCard(8, {
        de: 'Mal 8 heisst: dreimal verdoppeln.',
        it: 'Per 8 vuol dire raddoppiare tre volte.',
        en: 'Times 8 means double three times.',
        fr: 'Multiplier par 8, c’est doubler trois fois.',
    }),
    t9: skipCountCard(9, {
        de: 'Mal 9 ist mal 10 minus einmal die Zahl.',
        it: 'Per 9 è per 10 meno una volta il numero.',
        en: 'Times 9 is times 10 minus one group.',
        fr: 'Multiplier par 9, c’est multiplier par 10 moins une fois le nombre.',
    }),
    t10: skipCountCard(10, {
        de: 'Mal 10 hängt eine Null an die Zahl.',
        it: 'Per 10 aggiunge uno zero al numero.',
        en: 'Times 10 puts a zero after the number.',
        fr: 'Multiplier par 10 ajoute un zéro au nombre.',
    }),
    t11: skipCountCard(11, {
        de: 'Bei 11×n helfen die Ziffern: 11×4 = 44, denn 4+4 = 8.',
        it: 'Con 11×n aiutano le cifre: 11×4 = 44, perché 4+4 = 8.',
        en: 'For 11×n, notice the digits: 11×4 = 44, and 4+4 = 8.',
        fr: 'Pour 11×n, regarde les chiffres : 11×4 = 44, et 4+4 = 8.',
    }),
    t12: skipCountCard(12, {
        de: 'Mal 12 ist mal 10 und noch zweimal die Zahl.',
        it: 'Per 12 è per 10 più due volte il numero.',
        en: 'Times 12 is times 10 plus two more groups.',
        fr: 'Multiplier par 12, c’est multiplier par 10 plus deux fois le nombre.',
    }),
    'sq-core': {
        de: {
            title: 'Quadrate als Punktefeld',
            lines: ['Ein Quadrat mit 7 Reihen und 7 Spalten hat 49 Punkte.', 'Reihen mal Spalten zeigt, warum 7² = 49 ist.'],
        },
        it: {
            title: 'I quadrati come griglia',
            lines: ['Un quadrato con 7 righe e 7 colonne ha 49 puntini.', 'Righe per colonne mostrano perché 7² = 49.'],
        },
        en: {
            title: 'Squares as a dot grid',
            lines: ['A square with 7 rows and 7 columns has 49 dots.', 'Rows times columns show why 7² = 49.'],
        },
        fr: {
            title: 'Les carrés en grille de points',
            lines: ['Un carré de 7 rangées et 7 colonnes a 49 points.', 'Rangées fois colonnes montrent pourquoi 7² = 49.'],
        },
    },
    'sq-deep': {
        de: {
            title: 'Grosse Quadrate bauen',
            lines: ['Bei grossen Quadraten hilft die Formel n².', 'Nahe Quadrate unterscheiden sich um ungerade Zahlen: 15² − 14² = 29.'],
        },
        it: {
            title: 'Costruire quadrati grandi',
            lines: ['Per i quadrati grandi aiuta la formula n².', 'Quadrati vicini differiscono per numeri dispari: 15² − 14² = 29.'],
        },
        en: {
            title: 'Building large squares',
            lines: ['For large squares, use the formula n².', 'Nearby squares differ by odd numbers: 15² − 14² = 29.'],
        },
        fr: {
            title: 'Construire de grands carrés',
            lines: ['Pour les grands carrés, utilise la formule n².', 'Deux carrés voisins diffèrent d’un nombre impair : 15² − 14² = 29.'],
        },
    },
    t15: skipCountCard(15, {
        de: 'Mal 15 ist mal 10 plus die Hälfte davon.',
        it: 'Per 15 è per 10 più la metà.',
        en: 'Times 15 is times 10 plus half of it.',
        fr: 'Multiplier par 15, c’est multiplier par 10 plus la moitié.',
    }),
    t20: skipCountCard(20, {
        de: 'Mal 20 ist mal 10 und dann verdoppeln.',
        it: 'Per 20 è per 10 e poi raddoppia.',
        en: 'Times 20 is times 10, then double it.',
        fr: 'Multiplier par 20, c’est multiplier par 10 puis doubler.',
    }),
    t25: skipCountCard(25, {
        de: 'Mal 25 ist mal 100 geteilt durch 4.',
        it: 'Per 25 è per 100 diviso 4.',
        en: 'Times 25 is times 100 divided by 4.',
        fr: 'Multiplier par 25, c’est multiplier par 100 puis diviser par 4.',
    }),
    t13: skipCountCard(13, {
        de: 'Mal 13 ist mal 10 und noch dreimal die Zahl.',
        it: 'Per 13 è per 10 più tre volte il numero.',
        en: 'Times 13 is times 10 plus three more groups.',
        fr: 'Multiplier par 13, c’est multiplier par 10 plus trois fois le nombre.',
    }),
    t14: skipCountCard(14, {
        de: 'Mal 14 ist mal 10 und noch viermal die Zahl.',
        it: 'Per 14 è per 10 più quattro volte il numero.',
        en: 'Times 14 is times 10 plus four more groups.',
        fr: 'Multiplier par 14, c’est multiplier par 10 plus quatre fois le nombre.',
    }),
    t16: skipCountCard(16, {
        de: 'Mal 16 ist mal 10 und noch sechsmal die Zahl.',
        it: 'Per 16 è per 10 più sei volte il numero.',
        en: 'Times 16 is times 10 plus six more groups.',
        fr: 'Multiplier par 16, c’est multiplier par 10 plus six fois le nombre.',
    }),
    t17: skipCountCard(17, {
        de: 'Mal 17 ist mal 10 und noch siebenmal die Zahl.',
        it: 'Per 17 è per 10 più sette volte il numero.',
        en: 'Times 17 is times 10 plus seven more groups.',
        fr: 'Multiplier par 17, c’est multiplier par 10 plus sept fois le nombre.',
    }),
    t18: skipCountCard(18, {
        de: 'Mal 18 ist mal 10 und noch achtmal die Zahl.',
        it: 'Per 18 è per 10 più otto volte il numero.',
        en: 'Times 18 is times 10 plus eight more groups.',
        fr: 'Multiplier par 18, c’est multiplier par 10 plus huit fois le nombre.',
    }),
    t19: skipCountCard(19, {
        de: 'Mal 19 ist mal 20 minus einmal die Zahl.',
        it: 'Per 19 è per 20 meno una volta il numero.',
        en: 'Times 19 is times 20 minus one group.',
        fr: 'Multiplier par 19, c’est multiplier par 20 moins une fois le nombre.',
    }),
}

export const getStrategyCard = (planetId: PlanetId, language: Language): StrategyCard => {
    const card = STRATEGY_CARDS[planetId]?.[language]
    if (card === undefined) throw new Error(`unknown planet: ${planetId}`)
    return card
}

const factorForPlanet = (planetId: PlanetId): number | undefined => {
    const match = /^t(\d+)$/.exec(planetId)
    return match === null ? undefined : Number(match[1])
}

const otherFactor = (fact: Fact, factor: number): number =>
    fact.a === factor ? fact.b : fact.a

const sequence = (factor: number, count: number): string =>
    Array.from({ length: count }, (_, index) => String(factor * (index + 1))).join(', ')

const distributiveExplanation = (fact: Fact, factor: number, language: Language): string => {
    const other = otherFactor(fact, factor)
    const tens = 10 * other
    const ones = (factor - 10) * other
    const equation = `${factor}×${other} = 10×${other} + ${factor - 10}×${other} = ${tens} + ${ones} = ${fact.answer}`
    const introductions: Record<Language, string> = {
        de: 'Teile die 10 ab:',
        it: 'Separa il 10:',
        en: 'Split off the 10:',
        fr: 'Sépare le 10 :',
    }
    return `${introductions[language]} ${equation}`
}

const shortcutExplanation = (fact: Fact, planetId: PlanetId, language: Language): string => {
    const factor = factorForPlanet(planetId)
    if (factor === undefined) throw new Error(`unknown planet: ${planetId}`)
    const other = otherFactor(fact, factor)
    const equation = `${factor}×${other} = ${fact.answer}`
    const rules: Record<PlanetId, Record<Language, string> | undefined> = {
        t1: undefined, t2: undefined, t3: undefined, t4: undefined, t5: undefined, t6: undefined,
        t7: undefined, t8: undefined, t9: undefined, t10: undefined, t11: undefined, t12: undefined,
        'sq-core': undefined, 'sq-deep': undefined,
        t15: {
            de: `10×${other} + die Hälfte von 10×${other}`,
            it: `10×${other} più la metà di 10×${other}`,
            en: `10×${other} plus half of 10×${other}`,
            fr: `10×${other} plus la moitié de 10×${other}`,
        },
        t20: {
            de: `verdopple 10×${other}`,
            it: `raddoppia 10×${other}`,
            en: `double 10×${other}`,
            fr: `double 10×${other}`,
        },
        t25: {
            de: `${other}×100 ÷ 4`, it: `${other}×100 ÷ 4`, en: `${other}×100 ÷ 4`, fr: `${other}×100 ÷ 4`,
        },
        t13: undefined, t14: undefined, t16: undefined, t17: undefined, t18: undefined, t19: undefined,
    }
    const rule = rules[planetId]
    if (rule === undefined) throw new Error(`unknown planet: ${planetId}`)
    return `${equation}: ${rule[language]} = ${fact.answer}`
}

export const explainFact = (fact: Fact, planetId: PlanetId, language: Language): string => {
    if (STRATEGY_CARDS[planetId] === undefined) throw new Error(`unknown planet: ${planetId}`)

    if (planetId === 'sq-core' || planetId === 'sq-deep') {
        const area: Record<Language, string> = {
            de: `${fact.a} Reihen mit je ${fact.b} Punkten bilden ${fact.answer}.`,
            it: `${fact.a} righe da ${fact.b} puntini formano ${fact.answer}.`,
            en: `${fact.a} rows of ${fact.b} dots make ${fact.answer}.`,
            fr: `${fact.a} rangées de ${fact.b} points font ${fact.answer}.`,
        }
        return area[language]
    }

    if (planetId === 't15' || planetId === 't20' || planetId === 't25') {
        return shortcutExplanation(fact, planetId, language)
    }

    if (planetId === 't13' || planetId === 't14' || planetId === 't16' || planetId === 't17' || planetId === 't18' || planetId === 't19') {
        const factor = factorForPlanet(planetId)
        if (factor === undefined) throw new Error(`unknown planet: ${planetId}`)
        return distributiveExplanation(fact, factor, language)
    }

    const factor = factorForPlanet(planetId)
    if (factor === undefined) throw new Error(`unknown planet: ${planetId}`)
    const count = otherFactor(fact, factor)
    const phrases: Record<Language, string> = {
        de: `Zähle ${count} ${factor}er: ${sequence(factor, count)} = ${fact.answer}.`,
        it: `Conta ${count} volte ${factor}: ${sequence(factor, count)} = ${fact.answer}.`,
        en: `Count ${count} ${factor}s: ${sequence(factor, count)} = ${fact.answer}.`,
        fr: `Compte ${count} fois ${factor} : ${sequence(factor, count)} = ${fact.answer}.`,
    }
    return phrases[language]
}

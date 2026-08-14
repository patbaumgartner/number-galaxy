import { readdirSync, readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import config from '../vitest.config.ts'

/**
 * Keeps `docs/TESTING.md` honest.
 *
 * The inventory it publishes — how many suites there are, which end-to-end
 * specs exist, what the coverage floors are — has drifted from the code twice
 * already, and a wrong number in a testing guide is worse than no number: it is
 * the one page a new contributor trusts to tell them what is covered.
 *
 * Counting suites by file rather than by `it` is deliberate. A file count is
 * exact and knowable from disk; a test count is not knowable from inside the
 * run that would have to assert it, and one `it` here routinely sweeps two
 * hundred seeds, so it was never the more honest number anyway.
 */
const web = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const testingGuide = readFileSync(resolve(web, '../docs/TESTING.md'), 'utf8')

function countFiles(directory: string, matches: (name: string) => boolean): number {
    return readdirSync(resolve(web, directory), { recursive: true, encoding: 'utf8' })
        .filter(name => matches(name))
        .length
}

const projects = config.test?.projects ?? []
const thresholds = config.test?.coverage?.thresholds ?? {}

describe('docs/TESTING.md', () => {
    it.each([
        ['domain', () => countFiles('src', name => name.endsWith('.test.ts'))],
        ['ui', () => countFiles('src', name => name.endsWith('.test.tsx'))],
    ])('states how many %s suites there are', (project, count) => {
        const row = testingGuide.match(new RegExp(`\\| \\*\\*${project}\\*\\*.*`, 'i'))?.[0]
        expect(row, `no row for the ${project} layer`).toBeDefined()
        expect(row).toContain(`${count()} files`)
    })

    it('states how many test files there are in total', () => {
        const total = countFiles('src', name => name.endsWith('.test.ts') || name.endsWith('.test.tsx'))
        expect(testingGuide).toContain(`**${total} unit-test files**`)
    })

    it('gives every end-to-end spec a row in the spec table', () => {
        const specs = readdirSync(resolve(web, 'e2e')).filter(name => name.endsWith('.spec.ts'))
        const tabled = [...testingGuide.matchAll(/^\| `([\w-]+\.spec\.ts)` \|/gm)].map(match => match[1])

        expect([...tabled].sort()).toEqual([...specs].sort())
        expect(testingGuide).toContain(`${specs.length} files, both viewports`)
    })

    it('quotes the coverage floors the config actually enforces', () => {
        const documented = Object.fromEntries(
            [...testingGuide.matchAll(/^\| (Statements|Branches|Functions|Lines) \| (\d+) % \|/gm)]
                .map(([, metric, floor]) => [metric.toLowerCase(), Number(floor)]),
        )

        expect(documented).toEqual({
            statements: thresholds.statements,
            branches: thresholds.branches,
            functions: thresholds.functions,
            lines: thresholds.lines,
        })
    })

    it('names the two Vitest projects the config declares', () => {
        const names = projects.map(project => typeof project === 'object' && 'test' in project ? project.test?.name : undefined)

        expect(names).toEqual(['domain', 'ui'])
        for (const name of names) expect(testingGuide).toContain(`--project ${name}`)
    })
})

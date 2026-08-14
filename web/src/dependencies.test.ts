import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

/**
 * Holds the Dependabot grouping to the shape of the dependency tree.
 *
 * Dependabot pull requests here are approved and merged without a human
 * reading them, so a group that no longer matches what is installed does not
 * produce a review comment — it produces a red build on main, or an
 * unsatisfiable `npm ci` that has to be untangled by hand. The two ways that
 * happens are a pattern for a package that has been renamed away, and two
 * packages that pin each other arriving in separate pull requests.
 */
const web = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const pkg = JSON.parse(readFileSync(resolve(web, 'package.json'), 'utf8'))
const dependabot = readFileSync(resolve(web, '../.github/dependabot.yml'), 'utf8')

const installed: readonly string[] = Object.keys({ ...pkg.dependencies, ...pkg.devDependencies })

/**
 * The npm ecosystem's groups, as `name -> patterns`.
 *
 * Read with a regex rather than a YAML parser: the file is ours, its shape is
 * fixed, and a parser is a dependency this project would have to justify.
 */
function readGroups(): Map<string, string[]> {
    const npmSection = dependabot.slice(dependabot.indexOf('groups:'), dependabot.indexOf('  labels:'))
    const groups = new Map<string, string[]>()
    let current: string[] | undefined

    for (const line of npmSection.split('\n')) {
        const heading = line.match(/^ {4}([\w-]+):$/)
        if (heading !== null) groups.set(heading[1], current = [])
        const pattern = line.match(/^ {6}- '?([^'\s]+)'?$/)
        if (pattern !== null) current?.push(pattern[1])
    }
    return groups
}

const groups = readGroups()

function matches(pattern: string, name: string): boolean {
    return new RegExp(`^${pattern.split('*').map(part => part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('.*')}$`).test(name)
}

function groupOf(name: string): string | undefined {
    for (const [group, patterns] of groups) if (patterns.some(pattern => matches(pattern, name))) return group
    return undefined
}

describe('.github/dependabot.yml', () => {
    it('declares the groups it is meant to', () => {
        expect([...groups.keys()]).toEqual(['react', 'vitest', 'vite', 'playwright', 'eslint', 'typescript'])
    })

    it('has no pattern that matches nothing installed', () => {
        const dead = [...groups].flatMap(([group, patterns]) =>
            patterns
                .filter(pattern => !installed.some(name => matches(pattern, name)))
                .map(pattern => `${group}: ${pattern}`))

        expect(dead).toEqual([])
    })

    it('keeps every dependency that pins another in the same group', () => {
        const split: string[] = []

        for (const name of installed) {
            const peers = readInstalledPeers(name)
            for (const [peer, range] of Object.entries(peers)) {
                if (!installed.includes(peer)) continue
                if (!/^\d+\.\d+\.\d+/.test(range)) continue
                if (groupOf(name) !== groupOf(peer)) split.push(`${name} pins ${peer} at ${range}, but they update separately`)
            }
        }

        expect(split).toEqual([])
    })
})

function readInstalledPeers(name: string): Record<string, string> {
    try {
        return JSON.parse(readFileSync(resolve(web, 'node_modules', name, 'package.json'), 'utf8')).peerDependencies ?? {}
    } catch {
        return {}
    }
}

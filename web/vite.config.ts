import { createHash } from 'node:crypto'
import { readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'

const BASE = '/number-galaxy/'

/**
 * Stamps the built service worker with this release's identity.
 *
 * `public/sw.js` is copied verbatim, so with a hardcoded cache name it was
 * byte-identical on every deploy. A browser installs a new worker only when the
 * file's bytes change, so `activate` never ran, the old cache was never swept,
 * and each release quietly left its bundles behind for good.
 *
 * Hashing the output filenames gives a name that changes exactly when the app
 * does, and handing the worker that same list lets it precache the bundles
 * instead of waiting for a second visit to pick them up.
 */
function stampServiceWorker(): Plugin {
    return {
        name: 'stamp-service-worker',
        apply: 'build',
        writeBundle(options, bundle) {
            const assets = Object.keys(bundle).filter(name => name.startsWith('assets/')).sort()
            const build = createHash('sha256').update(assets.join('|')).digest('hex').slice(0, 8)
            const path = resolve(options.dir ?? 'dist', 'sw.js')

            const stamped = readFileSync(path, 'utf8')
                .replace('__BUILD__', build)
                .replace('const BUILD_ASSETS = []', `const BUILD_ASSETS = ${JSON.stringify(assets.map(name => BASE + name))}`)

            // A silent no-op here would ship a worker that never updates, which
            // is the whole fault this plugin exists to fix.
            if (stamped.includes('__BUILD__')) throw new Error('sw.js was not stamped')
            writeFileSync(path, stamped)
        },
    }
}

export default defineConfig({
    base: BASE,
    plugins: [react(), stampServiceWorker()],
})

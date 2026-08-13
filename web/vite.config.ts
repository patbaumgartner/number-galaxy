import { createHash } from 'node:crypto'
import { readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import { BASE_PATH } from './base.ts'

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
            // Everything the browser has to fetch to render the app, which is
            // every emitted chunk and asset bar the worker itself and the entry
            // document — both of which the worker lists on its own. Selecting by
            // what a file *is* rather than by the directory it landed in keeps
            // this correct if `assetsDir` is ever changed.
            const assets = Object.keys(bundle)
                .filter(name => name !== 'sw.js' && name !== 'index.html')
                .sort()
            if (assets.length === 0) throw new Error('sw.js stamping found no build output to precache')

            const build = createHash('sha256').update(assets.join('|')).digest('hex').slice(0, 8)
            const path = resolve(options.dir ?? 'dist', 'sw.js')
            const source = readFileSync(path, 'utf8')

            // Both replacements are checked. A silent no-op here would ship a
            // worker that never updates or one that precaches nothing, and the
            // second failure is invisible until someone goes offline.
            const stamped = source
                .replace('__BUILD__', build)
                .replace('const BUILD_ASSETS = []', `const BUILD_ASSETS = ${JSON.stringify(assets.map(name => BASE_PATH + name))}`)

            if (stamped === source) throw new Error('sw.js was not stamped: neither placeholder matched')
            if (stamped.includes('__BUILD__')) throw new Error('sw.js was not stamped: __BUILD__ remains')
            if (stamped.includes('const BUILD_ASSETS = []')) throw new Error('sw.js was not stamped: BUILD_ASSETS is still empty')

            writeFileSync(path, stamped)
        },
    }
}

export default defineConfig({
    base: BASE_PATH,
    plugins: [react(), stampServiceWorker()],
})

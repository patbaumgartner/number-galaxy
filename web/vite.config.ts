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

/**
 * Adds a Content-Security-Policy to the two documents that ship.
 *
 * GitHub Pages serves headers nobody here can configure, so the policy has to
 * travel in the markup. There is no live vulnerability it closes — this app has
 * no `dangerouslySetInnerHTML`, no `eval`, no third-party script and nothing it
 * could inject anybody else's markup into. It is the second barrier for the day
 * one of those stops being true, on a page holding children's names and
 * progress.
 *
 * The hashes are computed from the files rather than written into them. Both
 * documents carry one inline script — the GitHub Pages deep-link redirect — and
 * a policy pinned to a hash someone forgot to update is a blank page, so the
 * build derives them and fails loudly if it finds no script to hash.
 *
 * `style-src` has to allow inline: React writes `style` attributes for the bar
 * widths and beam positions that are only known at runtime, which the house
 * style already permits and which no hash can cover.
 */
function addContentSecurityPolicy(): Plugin {
    const POLICY = (hash: string): string => [
        "default-src 'none'",
        `script-src 'self' '${hash}'`,
        "style-src 'self' 'unsafe-inline'",
        "img-src 'self' data:",
        "font-src 'self'",
        "manifest-src 'self'",
        "worker-src 'self'",
        "connect-src 'self'",
        "base-uri 'none'",
        "form-action 'none'",
        // No `frame-ancestors`: it is header-only, and a `<meta>` policy that
        // names it is not stricter — it is a console error on every page load.
        // Clickjacking cover would need a response header, which GitHub Pages
        // does not let anybody set.
    ].join('; ')

    const stamp = (path: string): void => {
        const source = readFileSync(path, 'utf8')
        const inline = source.match(/<script>([\s\S]*?)<\/script>/)
        if (inline === null) throw new Error(`CSP: no inline script found in ${path}`)

        const hash = `sha256-${createHash('sha256').update(inline[1], 'utf8').digest('base64')}`
        const meta = `  <meta http-equiv="Content-Security-Policy" content="${POLICY(hash)}" />\n`
        if (source.includes('Content-Security-Policy')) throw new Error(`CSP: ${path} already carries a policy`)

        writeFileSync(path, source.replace('<head>', `<head>\n${meta}`))
    }

    return {
        name: 'add-content-security-policy',
        apply: 'build',
        writeBundle(options) {
            const dir = options.dir ?? 'dist'
            stamp(resolve(dir, 'index.html'))
            stamp(resolve(dir, '404.html'))
        },
    }
}

export default defineConfig({
    base: BASE_PATH,
    plugins: [react(), stampServiceWorker(), addContentSecurityPolicy()],
})

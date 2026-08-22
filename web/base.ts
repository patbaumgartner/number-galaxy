/**
 * Where this app is deployed, declared once.
 *
 * The app is served from the root of the custom domain galaxy.patbaumgartner.com,
 * but everything that builds a URL still has to agree about the prefix. That
 * prefix used to be spelled out in eight places — the Vite config, the router,
 * the service worker registration and its precache list, the web app manifest,
 * and the end-to-end base URL. Any one of them drifting produced a failure that
 * only shows up in production, and the two loudest ones are silent: a manifest
 * pointing at icons that are not there still installs, and a service worker
 * precaching URLs that 404 simply stops working offline.
 *
 * So: this constant is the only literal. Vite turns it into `import.meta.env
 * .BASE_URL` for anything that is bundled, the manifest uses relative URLs that
 * resolve against its own location, and the service worker derives it from the
 * URL it was served from. Moving this app back under a path prefix (for example
 * a repository-named GitHub Pages URL) means changing this line, and nothing
 * else.
 */
export const BASE_PATH = '/'

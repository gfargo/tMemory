import type Conf from 'conf'
import { isBrowser } from './environment.js'

export type ConfigConstructor = typeof Conf

/**
 * Loads `conf`'s constructor, or `undefined` when running in a browser.
 *
 * `conf`'s module body imports `node:fs`/`node:path`/`node:os` at the top
 * level, so merely importing it crashes a browser bundle even if `new
 * Conf()` is never called. `isBrowserEnv` and `importConfig` are accepted
 * as parameters (rather than this function calling `isBrowser()` and
 * `import('conf')` directly) so tests can assert `importConfig` is never
 * invoked when `isBrowserEnv` is `true` — proving the exact behavior that
 * keeps `conf` out of a browser bundle, without needing a real browser to
 * observe it.
 *
 * Shared by storage.ts and device.ts, the two modules that need a `conf`
 * instance on Node but must stay `conf`-free in a browser.
 */
export const loadConfigCtor = async (
  isBrowserEnv = isBrowser(),
  importConfig: () => Promise<{
    default: ConfigConstructor
  }> = async () => import('conf')
): Promise<ConfigConstructor | undefined> => {
  if (isBrowserEnv) {
    return undefined
  }

  const configModule = await importConfig()
  return configModule.default
}

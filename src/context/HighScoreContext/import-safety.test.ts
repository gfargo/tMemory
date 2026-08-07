import process from 'node:process'
import test from 'ava'

/**
 * True import-time regression check for the bug this PR fixes: `conf` was
 * constructed at module scope in `HighScoreContext`, so merely importing it
 * would crash wherever the underlying storage isn't writable/available
 * (e.g. `node:fs` missing entirely, as in a browser bundle). We can't run
 * an actual browser here, but we can reliably reproduce "storage is
 * unavailable" in Node by pointing `HOME`/`XDG_CONFIG_HOME` at a path that
 * can't be used as a directory — `conf`'s eager constructor throws
 * synchronously on that, which is exactly the failure mode a browser bundle
 * hits. This file must not statically import `conf`-touching modules
 * itself, so the dynamic imports below are each module's first evaluation.
 */

const ENV_KEYS = ['HOME', 'XDG_CONFIG_HOME', 'APPDATA'] as const

test.serial(
  'importing storage, device, and HighScoreContext does not throw when the Node storage backend is unusable',
  async (t) => {
    const originalEnv = Object.fromEntries(
      ENV_KEYS.map((key) => [key, process.env[key]])
    )

    // A path that exists as a file (not a directory) so `conf`'s
    // `mkdir`-on-construct throws ENOTDIR if it's ever eagerly constructed.
    const unusablePath = new URL('../../../package.json', import.meta.url)
      .pathname

    for (const key of ENV_KEYS) {
      process.env[key] = unusablePath
    }

    try {
      await t.notThrowsAsync(async () => {
        await import('../../utils/storage.js')
        await import('../../utils/device.js')
        await import('./index.js')
      })
    } finally {
      for (const key of ENV_KEYS) {
        const value = originalEnv[key]
        if (value === undefined) {
          Reflect.deleteProperty(process.env, key)
        } else {
          process.env[key] = value
        }
      }
    }
  }
)

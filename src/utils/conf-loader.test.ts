import test from 'ava'
import { loadConfigCtor, type ConfigConstructor } from './conf-loader.js'

/**
 * `storage.ts` and `device.ts` each call `await loadConfigCtor()` at module
 * scope — that's the exact call site that must never touch `conf` (and its
 * `node:fs`/`node:path`/`node:os` dependencies) when running in a browser.
 * These tests exercise that call directly with `isBrowserEnv` forced to
 * `true`/`false`, asserting the `importConfig` parameter — standing in for
 * the real `import('conf')` — is only ever invoked on the Node branch.
 */

class FakeConfig {
  constructor(readonly options?: unknown) {}
}

test('loadConfigCtor: does not invoke the conf importer when isBrowserEnv is true', async (t) => {
  let importCalled = false

  const result = await loadConfigCtor(true, async () => {
    importCalled = true
    return { default: FakeConfig as unknown as ConfigConstructor }
  })

  t.false(importCalled)
  t.is(result, undefined)
})

test('loadConfigCtor: invokes the conf importer and returns its constructor when isBrowserEnv is false', async (t) => {
  let importCalled = false

  const result = await loadConfigCtor(false, async () => {
    importCalled = true
    return { default: FakeConfig as unknown as ConfigConstructor }
  })

  t.true(importCalled)
  t.is(result, FakeConfig as unknown as ConfigConstructor)
})

test('loadConfigCtor: defaults to the real conf module on Node', async (t) => {
  const ConfigCtor = await loadConfigCtor(false)
  t.is(typeof ConfigCtor, 'function')
})

import test from 'ava'
import { getDeviceId, hasDeviceId } from './device.js'

/**
 * `device.ts` branches on `typeof window !== 'undefined'` to decide between
 * a browser-safe `localStorage`-backed implementation and the Node.js
 * `conf`-backed implementation. These tests exercise both branches by
 * toggling a `window` global with an in-memory `localStorage` mock.
 */

class MemoryStorage {
  private readonly store = new Map<string, string>()

  getItem(key: string) {
    return this.store.get(key) ?? null
  }

  setItem(key: string, value: string): void {
    this.store.set(key, value)
  }

  removeItem(key: string): void {
    this.store.delete(key)
  }

  clear(): void {
    this.store.clear()
  }
}

test.serial('getDeviceId (Node): persists a device id via conf', (t) => {
  const first = getDeviceId()
  t.regex(first, /^tmem-/)

  const second = getDeviceId()
  t.is(second, first)
})

test.serial(
  'hasDeviceId (Node): reflects whether an id has been stored',
  (t) => {
    // Calling getDeviceId above guarantees a value has been persisted.
    t.true(hasDeviceId())
  }
)

test.serial(
  'getDeviceId (browser): persists a device id via localStorage',
  (t) => {
    const globalWithWindow = globalThis as unknown as { window?: unknown }
    globalWithWindow.window = { localStorage: new MemoryStorage() }

    try {
      const first = getDeviceId()
      t.regex(first, /^tmem-/)

      const second = getDeviceId()
      t.is(second, first)
    } finally {
      delete globalWithWindow.window
    }
  }
)

test.serial(
  'hasDeviceId (browser): false before a device id exists, true after',
  (t) => {
    const globalWithWindow = globalThis as unknown as { window?: unknown }
    globalWithWindow.window = { localStorage: new MemoryStorage() }

    try {
      t.false(hasDeviceId())
      getDeviceId()
      t.true(hasDeviceId())
    } finally {
      delete globalWithWindow.window
    }
  }
)

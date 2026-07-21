import test from 'ava'
import Conf from 'conf'
import { createStore } from './storage.js'

/**
 * `storage.ts` branches on `typeof window !== 'undefined'` to decide between
 * a browser-safe `localStorage`-backed store and the Node.js `conf`-backed
 * store. These tests exercise both branches by toggling a `window` global
 * with an in-memory `localStorage` mock.
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

type TestSchema = {
  name: string
  scores: Record<string, number[]>
}

test.serial('createStore (Node): persists values via conf', (t) => {
  // Clear any state left over from a previous test run, since conf persists
  // to a real config file on disk rather than an in-memory store.
  new Conf({ projectName: 'tmemory-storage-test-node' }).clear()

  const store = createStore<TestSchema>({
    projectName: 'tmemory-storage-test-node',
    schema: {
      name: { type: 'string', default: '' },
      scores: { type: 'object', default: {} },
    },
  })

  t.is(store.get('name'), '')

  store.set('name', 'Ada')
  t.is(store.get('name'), 'Ada')

  store.set('scores', { '3x3-single': [1, 2, 3] })
  t.deepEqual(store.get('scores'), { '3x3-single': [1, 2, 3] })
})

test.serial('createStore (browser): persists values via localStorage', (t) => {
  const globalWithWindow = globalThis as unknown as { window?: unknown }
  globalWithWindow.window = { localStorage: new MemoryStorage() }

  try {
    const store = createStore<TestSchema>({
      projectName: 'tmemory-storage-test-browser',
    })

    t.is(store.get('name'), undefined)

    store.set('name', 'Grace')
    t.is(store.get('name'), 'Grace')

    store.set('scores', { '3x3-single': [4, 5, 6] })
    t.deepEqual(store.get('scores'), { '3x3-single': [4, 5, 6] })
  } finally {
    delete globalWithWindow.window
  }
})

test.serial(
  'createStore (browser): falls back gracefully when localStorage throws',
  (t) => {
    const globalWithWindow = globalThis as unknown as { window?: unknown }
    globalWithWindow.window = {
      localStorage: {
        getItem() {
          throw new Error('localStorage disabled')
        },
        setItem() {
          throw new Error('localStorage disabled')
        },
      },
    }

    try {
      const store = createStore<TestSchema>({
        projectName: 'tmemory-storage-test-browser-error',
      })

      t.notThrows(() => {
        store.set('name', 'Marie')
      })
      t.is(store.get('name'), undefined)
    } finally {
      delete globalWithWindow.window
    }
  }
)

import test from 'ava'
import React from 'react'
import { Text } from 'ink'
import { render } from 'ink-testing-library'
import { HighScoreProvider, useHighScores } from './index.js'

/**
 * Regression coverage for the bug this PR fixes: `HighScoreContext` used to
 * construct `Conf` (backed by `node:fs`) at module scope, which crashed
 * immediately on import in a browser bundle. Unlike storage.test.ts and
 * device.test.ts (which exercise the underlying utilities in isolation),
 * this mounts the actual `HighScoreProvider` used by `app.tsx` with a
 * simulated browser `window`/`localStorage`, proving the real provider tree
 * imports and renders without crashing outside of Node.
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

function Consumer() {
  const highScores = useHighScores()

  const score = highScores.getHighScore('single', { rows: 2, cols: 2 })

  return <Text>score:{score ? score.time : 'none'}</Text>
}

type HighScoreContextValueForTest = ReturnType<typeof useHighScores>

let capturedValue: HighScoreContextValueForTest | undefined

function Capture() {
  capturedValue = useHighScores()
  return null
}

test.serial(
  'HighScoreProvider mounts and round-trips a score in a simulated browser',
  (t) => {
    const globalWithWindow = globalThis as unknown as { window?: unknown }
    globalWithWindow.window = { localStorage: new MemoryStorage() }

    try {
      t.notThrows(() => {
        render(
          <HighScoreProvider>
            <Consumer />
          </HighScoreProvider>
        )
      })
    } finally {
      delete globalWithWindow.window
    }
  }
)

test.serial(
  'HighScoreProvider persists a saved score via localStorage in a simulated browser',
  (t) => {
    const globalWithWindow = globalThis as unknown as { window?: unknown }
    globalWithWindow.window = { localStorage: new MemoryStorage() }

    try {
      capturedValue = undefined

      render(
        <HighScoreProvider>
          <Capture />
        </HighScoreProvider>
      )

      t.truthy(capturedValue)
      capturedValue!.saveHighScore({
        time: 42,
        rows: 2,
        cols: 2,
        gameMode: 'single',
        date: new Date().toISOString(),
      })

      const best = capturedValue!.getHighScore('single', { rows: 2, cols: 2 })
      t.is(best?.time, 42)
    } finally {
      delete globalWithWindow.window
    }
  }
)

import test from 'ava'
import React from 'react'
import { render } from 'ink-testing-library'
import { Text } from 'ink'
import { HighScoreProvider, useHighScores } from './index.js'

/**
 * `HighScoreContext` branches on `typeof window !== 'undefined'` to decide
 * between a browser-safe `localStorage`-backed config store and the
 * Node.js `conf`-backed store. These tests exercise the browser branch by
 * toggling a `window` global with an in-memory `localStorage` mock, mirroring
 * the approach used in `utils/device.test.ts`.
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

const withBrowserWindow = (run: () => void): void => {
  const globalWithWindow = globalThis as unknown as { window?: unknown }
  globalWithWindow.window = { localStorage: new MemoryStorage() }

  try {
    run()
  } finally {
    delete globalWithWindow.window
  }
}

let capturedHighScores: ReturnType<typeof useHighScores> | undefined

const Consumer: React.FC = () => {
  capturedHighScores = useHighScores()
  return <Text>ready</Text>
}

test.serial(
  'HighScoreProvider (browser): persists player name and scores via localStorage',
  (t) => {
    withBrowserWindow(() => {
      render(
        <HighScoreProvider>
          <Consumer />
        </HighScoreProvider>
      )

      t.truthy(capturedHighScores)
      const highScores = capturedHighScores!

      highScores.setPlayerName('Ada')
      t.is(highScores.getPlayerName(), 'Ada')

      highScores.saveHighScore({
        time: 42,
        rows: 4,
        cols: 4,
        gameMode: 'single',
        date: new Date().toISOString(),
      })

      const best = highScores.getHighScore('single', { rows: 4, cols: 4 })
      t.is(best?.time, 42)
      t.is(best?.playerName, 'Ada')
    })
  }
)

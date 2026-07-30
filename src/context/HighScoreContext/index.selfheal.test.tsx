import test from 'ava'
import React from 'react'
import { render } from 'ink-testing-library'
import { Text } from 'ink'
import type * as HighScoreContextModule from './index.js'

/**
 * Exercises the self-heal branch in `getConfig()`: if `isBrowser()` was
 * (incorrectly) `true` when the module first loaded — so the eager
 * `ensureConfClassLoaded()` call was skipped — and `window` later
 * disappears, `getConfig()` should kick off a background load, throw once,
 * and then succeed on a subsequent call once `conf` has loaded.
 *
 * A cache-busting dynamic import is used to get a fresh module instance
 * whose module-scope `await ensureConfClassLoaded()` evaluates while
 * `window` is present, mirroring the scenario the reviewed fix targets.
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

class CaughtError extends React.Component<
  { children: React.ReactNode },
  { error: Error | undefined }
> {
  static getDerivedStateFromError(error: Error) {
    return { error }
  }

  override state: { error: Error | undefined } = { error: undefined }

  override render() {
    if (this.state.error) {
      return <Text>{this.state.error.message}</Text>
    }

    return this.props.children
  }
}

test.serial(
  'HighScoreProvider: self-heals when isBrowser() flips from true to false after module load',
  async (t) => {
    const globalWithWindow = globalThis as unknown as { window?: unknown }
    globalWithWindow.window = { localStorage: new MemoryStorage() }

    let loadedModule: typeof HighScoreContextModule

    try {
      loadedModule = (await import(
        `./index.js?self-heal-test=${t.title}`
      )) as typeof HighScoreContextModule
    } finally {
      delete globalWithWindow.window
    }

    const { HighScoreProvider, useHighScores } = loadedModule

    let captured: ReturnType<typeof useHighScores> | undefined

    const Consumer: React.FC = () => {
      captured = useHighScores()
      return <Text>ready</Text>
    }

    // React logs errors caught by an error boundary via `console.error`
    // even though this test expects and handles the throw; silence it for
    // just this render so the caught, expected error doesn't spam test
    // output.
    const originalConsoleError = console.error
    console.error = () => {}

    let first: ReturnType<typeof render>
    try {
      first = render(
        <CaughtError>
          <HighScoreProvider>
            <Consumer />
          </HighScoreProvider>
        </CaughtError>
      )
    } finally {
      console.error = originalConsoleError
    }

    t.regex(first.lastFrame() ?? '', /conf is still loading/)

    // Let the background `import('conf')` kicked off by the failed attempt
    // above resolve.
    await new Promise((resolve) => {
      setTimeout(resolve, 0)
    })

    render(
      <CaughtError>
        <HighScoreProvider>
          <Consumer />
        </HighScoreProvider>
      </CaughtError>
    )

    t.truthy(captured)
    captured!.setPlayerName('Grace')
    t.is(captured!.getPlayerName(), 'Grace')
  }
)

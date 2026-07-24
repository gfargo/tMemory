// `conf` is Node.js-only (backed by `node:fs`/`node:path`/`node:os`), so it
// must never be statically imported here: a top-level `import Conf from
// 'conf'` is evaluated by browser bundlers regardless of any runtime branch,
// which pulls conf's `node:*` imports into the bundle and breaks it. Import
// only the type here (erased at compile time) and load the runtime value via
// a guarded dynamic `import('conf')` below, so a browser bundle never
// references the module at all.
import type Conf from 'conf'
import React, { createContext, useContext } from 'react'
import { GameMode, GridDimension, HighScore } from '../../types/game.js'
import { getDeviceId } from '../../utils/device.js'
import { HighScoreConfig, HighScoreContextValue } from './types.js'

/**
 * Detects whether we're running in a browser-like environment with a usable
 * `localStorage`, as opposed to Node.js where `conf` (backed by `node:fs`)
 * should be used instead.
 *
 * Implemented as a function (rather than a module-scope constant) so it can
 * be re-evaluated on every call, which keeps it testable and avoids caching
 * a stale result at import time.
 */
const isBrowser = (): boolean =>
  typeof window !== 'undefined' && window.localStorage !== undefined

// Only ever loaded on the Node.js branch (guarded by `isBrowser()`), via a
// dynamic import so the module specifier is never eagerly evaluated when
// this file is loaded in a browser.
let ConfClass: typeof Conf | undefined

/**
 * Loads `conf` if it hasn't been loaded yet and we're not in a browser.
 * `isBrowser()` is re-checked on every call (rather than relying on a single
 * snapshot taken at module-evaluation time), so this self-heals if the
 * `window` global's presence differs between when this module first loaded
 * and when the Node.js branch is actually reached.
 */
const ensureConfClassLoaded = async (): Promise<void> => {
  if (ConfClass || isBrowser()) {
    return
  }

  const confModule = await import('conf')
  ConfClass = confModule.default
}

// Eagerly load in the common case (this module evaluating in Node.js), so
// `ConfClass` is ready before any synchronous `getConfig()` call below.
await ensureConfClassLoaded()

const STORAGE_KEY_PREFIX = 'tmemory'

const configDefaults: HighScoreConfig = {
  scores: {},
  playerName: '',
  onlineEnabled: false,
}

type ConfigStore = {
  get<K extends keyof HighScoreConfig>(key: K): HighScoreConfig[K]
  set<K extends keyof HighScoreConfig>(key: K, value: HighScoreConfig[K]): void
}

/**
 * `localStorage`-backed implementation of `ConfigStore`, used in the browser
 * where `conf`'s `node:fs`-based persistence isn't available. Each config key
 * is stored under its own namespaced `localStorage` entry.
 */
class BrowserConfigStore implements ConfigStore {
  get<K extends keyof HighScoreConfig>(key: K): HighScoreConfig[K] {
    try {
      const raw = window.localStorage.getItem(`${STORAGE_KEY_PREFIX}:${key}`)
      return raw === null
        ? configDefaults[key]
        : (JSON.parse(raw) as HighScoreConfig[K])
    } catch {
      return configDefaults[key]
    }
  }

  set<K extends keyof HighScoreConfig>(
    key: K,
    value: HighScoreConfig[K]
  ): void {
    try {
      window.localStorage.setItem(
        `${STORAGE_KEY_PREFIX}:${key}`,
        JSON.stringify(value)
      )
    } catch {
      // LocalStorage may be unavailable (e.g. disabled in browser privacy
      // settings) or full. Silently skip persistence in that case.
    }
  }
}

let browserConfig: BrowserConfigStore | undefined
let nodeConfig: Conf<HighScoreConfig> | undefined

/**
 * Lazily initializes and returns the config store used to persist high
 * scores, player name, and the online-leaderboard flag. Only ever
 * instantiates `conf` from the Node branch so that a browser bundle never
 * needs to touch `node:fs` at instantiation time.
 */
const getConfig = (): ConfigStore => {
  if (isBrowser()) {
    browserConfig ||= new BrowserConfigStore()
    return browserConfig
  }

  if (!ConfClass) {
    // `isBrowser()` was (incorrectly) `true` when this module first loaded,
    // so the eager load above was skipped. Kick off a background load so a
    // subsequent call succeeds, and surface a clear error for this one.
    void ensureConfClassLoaded().catch(() => {})
    throw new Error(
      'conf is still loading for the Node.js environment; retry the operation'
    )
  }

  nodeConfig ||= new ConfClass<HighScoreConfig>({
    projectName: 'tmemory',
    schema: {
      scores: {
        type: 'object',
        additionalProperties: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              time: { type: 'number', minimum: 0 },
              rows: { type: 'number', minimum: 1, maximum: 12 },
              cols: { type: 'number', minimum: 1, maximum: 12 },
              gameMode: {
                type: 'string',
                enum: ['single', 'vs-ai', 'vs-player'],
              },
              date: { type: 'string', format: 'date-time' },
              playerName: { type: 'string', maxLength: 12 },
              deviceId: { type: 'string' },
              isOnline: { type: 'boolean' },
            },
            required: ['time', 'rows', 'cols', 'gameMode', 'date'],
            additionalProperties: false,
          },
          default: [],
        },
        default: {},
      },
      playerName: {
        type: 'string',
        default: '',
      },
      onlineEnabled: {
        type: 'boolean',
        default: false,
      },
    },
    clearInvalidConfig: true, // This will clear any invalid config data
  })

  return nodeConfig
}

const getHighScoreKey = (grid: GridDimension, mode: GameMode): string => {
  return `${grid.rows}x${grid.cols}-${mode}`
}

const HighScoreContext = createContext<HighScoreContextValue | undefined>(
  undefined
)

export const HighScoreProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [onlineEnabled, setOnlineEnabled] = React.useState<boolean>(
    getConfig().get('onlineEnabled') || false
  )

  const getAllHighScores = (): Record<string, HighScore[]> => {
    const scores = getConfig().get('scores') as unknown as Record<
      string,
      HighScore | HighScore[]
    >

    // Handle migration from old format (single score) to new format (array of scores)
    const migratedScores: Record<string, HighScore[]> = {}

    for (const key in scores) {
      if (Array.isArray(scores[key])) {
        migratedScores[key] = scores[key] as HighScore[]
      } else if (scores[key]) {
        // Convert single score to array
        migratedScores[key] = [scores[key] as HighScore]
      } else {
        migratedScores[key] = []
      }
    }

    return migratedScores
  }

  const getHighScore = (
    mode: GameMode,
    grid: GridDimension
  ): HighScore | null => {
    const scores = getAllHighScores()
    const key = getHighScoreKey(grid, mode)

    if (!scores[key] || scores[key].length === 0) {
      return null
    }

    // Return the best score (lowest time)
    return scores[key].reduce(
      (best, current) => (!best || current.time < best.time ? current : best),
      null as HighScore | null
    )
  }

  const saveHighScore = (score: HighScore) => {
    // Ensure the score has a deviceId and playerName
    const scoreWithDetails = {
      ...score,
      deviceId: score.deviceId || getDeviceId(),
      playerName: score.playerName || getPlayerName() || 'Anonymous',
      isOnline: score.isOnline || false,
    }

    const scores = getAllHighScores()
    const key = getHighScoreKey(
      { rows: score.rows, cols: score.cols },
      score.gameMode
    )

    // Initialize array if it doesn't exist
    if (!scores[key]) {
      scores[key] = []
    }

    // Add new score to the array
    scores[key].push(scoreWithDetails)

    // Sort by time (ascending) and keep only top 10
    scores[key] = scores[key].sort((a, b) => a.time - b.time).slice(0, 10)

    getConfig().set('scores', scores)
  }

  const isNewHighScore = (
    time: number,
    grid: GridDimension,
    mode: GameMode
  ): boolean => {
    const scores = getAllHighScores()
    const key = getHighScoreKey(grid, mode)

    // If we have fewer than 10 scores, it's a new high score
    if (!scores[key] || scores[key].length < 10) {
      return true
    }

    // Check if this time beats the worst time in the top 10
    const worstScore = [...scores[key]].sort((a, b) => a.time - b.time)[9]
    return worstScore ? time < worstScore.time : true
  }

  // Get local leaderboard for a specific mode and grid size
  const getLocalLeaderboard = (
    mode: GameMode,
    grid: GridDimension
  ): HighScore[] => {
    const key = getHighScoreKey(grid, mode)
    const scores = getAllHighScores()

    // Return the array of scores sorted by time
    return scores[key] ? [...scores[key]].sort((a, b) => a.time - b.time) : []
  }

  // Get the player's name
  const getPlayerName = (): string | undefined => {
    return getConfig().get('playerName') as string
  }

  // Set the player's name
  const setPlayerName = (name: string): void => {
    getConfig().set('playerName', name)
  }

  const value: HighScoreContextValue = {
    getHighScore,
    saveHighScore,
    isNewHighScore,

    // TODO: This really doesn't make sense here but it's where we have our persistent data store...
    onlineEnabled,
    setOnlineEnabled: (enabled: boolean): void => {
      // Update the config value and the local state
      getConfig().set('onlineEnabled', enabled)
      setOnlineEnabled(enabled)
    },

    getAllHighScores,
    getLocalLeaderboard,
    getPlayerName,
    setPlayerName,
    getDeviceId,
  }

  return (
    <HighScoreContext.Provider value={value}>
      {children}
    </HighScoreContext.Provider>
  )
}

export const useHighScores = () => {
  const context = useContext(HighScoreContext)
  if (context === undefined) {
    throw new Error('useHighScores must be used within a HighScoreProvider')
  }
  return context
}

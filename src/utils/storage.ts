import Conf, { type Schema } from 'conf'

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

export type KeyValueStore<T extends Record<string, any>> = {
  get<K extends keyof T>(key: K): T[K] | undefined
  set<K extends keyof T>(key: K, value: T[K]): void
}

class LocalStorageStore<T extends Record<string, any>>
  implements KeyValueStore<T>
{
  constructor(private readonly projectName: string) {}

  get<K extends keyof T>(key: K): T[K] | undefined {
    try {
      const raw = window.localStorage.getItem(this.namespacedKey(key))
      const value: T[K] | undefined =
        raw === null ? undefined : (JSON.parse(raw) as T[K])
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return -- T[K] is structurally `any` here because T is bounded by Record<string, any>, not because `value` is actually unchecked.
      return value
    } catch {
      // LocalStorage may be unavailable (e.g. disabled in browser privacy
      // settings) or the stored value may be corrupt JSON.
      return undefined
    }
  }

  set<K extends keyof T>(key: K, value: T[K]): void {
    try {
      window.localStorage.setItem(
        this.namespacedKey(key),
        JSON.stringify(value)
      )
    } catch {
      // LocalStorage may be unavailable; silently skip persistence.
    }
  }

  private namespacedKey(key: keyof T): string {
    return `${this.projectName}:${String(key)}`
  }
}

class ConfigStore<T extends Record<string, any>> implements KeyValueStore<T> {
  private store: Conf<T> | undefined

  constructor(
    private readonly options: {
      projectName: string
      schema?: Schema<T>
      clearInvalidConfig?: boolean
    }
  ) {}

  get<K extends keyof T>(key: K): T[K] | undefined {
    const value: T[K] | undefined = this.getConf().get(key)
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return -- T[K] is structurally `any` here because T is bounded by Record<string, any>, not because `value` is actually unchecked.
    return value
  }

  set<K extends keyof T>(key: K, value: T[K]): void {
    this.getConf().set(key, value)
  }

  /**
   * Lazily initializes the underlying `conf` instance so `node:fs` is only
   * touched when a get/set actually runs, not at import time.
   */
  private getConf(): Conf<T> {
    this.store ||= new Conf<T>(this.options)
    return this.store
  }
}

export const createStore = <T extends Record<string, any>>(options: {
  projectName: string
  schema?: Schema<T>
  clearInvalidConfig?: boolean
}): KeyValueStore<T> =>
  isBrowser()
    ? new LocalStorageStore<T>(options.projectName)
    : new ConfigStore<T>(options)

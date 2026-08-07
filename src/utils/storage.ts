// `Schema` must be imported separately from `Conf`: `import type Conf, { type Schema }` (a single type-only import mixing a default and named binding) is a TS1363 syntax error.
// eslint-disable-next-line import/no-duplicates
import type Conf from 'conf'
// eslint-disable-next-line import/no-duplicates
import type { Schema } from 'conf'
import { isBrowser } from './environment.js'
import { loadConfigCtor, createConfigCtorGetter } from './conf-loader.js'

const getConfigCtor = createConfigCtorGetter(await loadConfigCtor())

export type KeyValueStore<T extends Record<string, any>> = {
  get<K extends keyof T>(key: K): T[K] | undefined
  set<K extends keyof T>(key: K, value: T[K]): void
}

class LocalStorageStore<T extends Record<string, any>>
  implements KeyValueStore<T>
{
  constructor(
    private readonly projectName: string,
    private readonly schema?: Schema<T>
  ) {}

  get<K extends keyof T>(key: K): T[K] | undefined {
    try {
      const raw = window.localStorage.getItem(this.namespacedKey(key))
      if (raw === null) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-return -- T[K] is structurally `any` here because T is bounded by Record<string, any>, not because the default is actually unchecked.
        return this.defaultFor(key)
      }

      const value = JSON.parse(raw) as T[K]
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return -- T[K] is structurally `any` here because T is bounded by Record<string, any>, not because `value` is actually unchecked.
      return value
    } catch {
      // LocalStorage may be unavailable (e.g. disabled in browser privacy
      // settings) or the stored value may be corrupt JSON.
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return -- T[K] is structurally `any` here because T is bounded by Record<string, any>, not because the default is actually unchecked.
      return this.defaultFor(key)
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

  /**
   * Mirrors `conf`'s behavior of falling back to the schema's `default` for
   * a key that hasn't been set yet, so Node and browser reads agree.
   */
  private defaultFor<K extends keyof T>(key: K): T[K] | undefined {
    const valueSchema = this.schema?.[key]
    if (!valueSchema || typeof valueSchema === 'boolean') {
      return undefined
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-return -- T[K] is structurally `any` here because T is bounded by Record<string, any>, not because the default is actually unchecked.
    return valueSchema.default as T[K] | undefined
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
   * Lazily initializes the underlying `conf` instance so it's only
   * constructed when a get/set actually runs, not at import time.
   */
  private getConf(): Conf<T> {
    this.store ||= new (getConfigCtor())<T>(this.options)
    return this.store
  }
}

export const createStore = <T extends Record<string, any>>(options: {
  projectName: string
  schema?: Schema<T>
  clearInvalidConfig?: boolean
}): KeyValueStore<T> =>
  isBrowser()
    ? new LocalStorageStore<T>(options.projectName, options.schema)
    : new ConfigStore<T>(options)

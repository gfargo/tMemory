import type Conf from 'conf'
import { isBrowser } from './environment.js'

const DEVICE_ID_KEY = 'tmemory-device-id'

/**
 * `conf`'s module body imports `node:fs`/`node:path`/`node:os` at the top
 * level, so a static `import Conf from 'conf'` crashes in a browser bundle
 * the moment this module is imported, even if `new Conf()` is deferred. A
 * top-level `await import(...)`, guarded by `isBrowser()`, means `conf`
 * (and its Node builtins) is never evaluated when running in a browser.
 */
const configModule = isBrowser() ? undefined : await import('conf')
const ConfigCtor = configModule?.default

/**
 * Generates a random device ID
 * @returns A newly generated device ID
 */
const generateDeviceId = (): string =>
  `tmem-${Math.random().toString(36).slice(2, 10)}-${Date.now().toString(36)}`

type DeviceConfigSchema = {
  deviceId: string
}

let deviceConfig: Conf<DeviceConfigSchema> | undefined

/**
 * Lazily initializes and returns the `conf` store used to persist the
 * device ID on Node.js. Only ever called from the Node branch, where
 * `ConfigCtor` is always loaded — see the module-scope
 * `await import('conf')` above.
 */
const getConfig = (): Conf<DeviceConfigSchema> => {
  if (!ConfigCtor) {
    throw new Error('conf is unavailable in this environment')
  }

  deviceConfig ||= new ConfigCtor<DeviceConfigSchema>({
    projectName: 'tmemory-device',
    schema: {
      deviceId: {
        type: 'string',
        default: '',
      },
    },
  })

  return deviceConfig
}

/**
 * Generates a random device ID if one doesn't exist
 * @returns The device ID
 */
export const getDeviceId = (): string => {
  if (isBrowser()) {
    try {
      let deviceId = window.localStorage.getItem(DEVICE_ID_KEY)

      if (!deviceId) {
        deviceId = generateDeviceId()
        window.localStorage.setItem(DEVICE_ID_KEY, deviceId)
      }

      return deviceId
    } catch {
      // LocalStorage may be unavailable (e.g. disabled in browser privacy
      // settings). Fall back to a non-persisted, in-memory device ID.
      return generateDeviceId()
    }
  }

  const config = getConfig()
  let deviceId = config.get('deviceId')

  if (!deviceId) {
    // Generate a random device ID
    deviceId = generateDeviceId()
    config.set('deviceId', deviceId)
  }

  return deviceId
}

/**
 * Checks if the device has a stored ID
 * @returns True if the device has an ID
 */
export const hasDeviceId = (): boolean => {
  if (isBrowser()) {
    try {
      return Boolean(window.localStorage.getItem(DEVICE_ID_KEY))
    } catch {
      return false
    }
  }

  return Boolean(getConfig().get('deviceId'))
}

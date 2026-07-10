import Conf from 'conf'

const DEVICE_ID_KEY = 'tmemory-device-id'

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
 * device ID on Node.js. Only ever called from the Node branch so that a
 * browser bundle never needs to touch `node:fs` at instantiation time.
 */
const getConfig = (): Conf<DeviceConfigSchema> => {
  deviceConfig ||= new Conf<DeviceConfigSchema>({
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

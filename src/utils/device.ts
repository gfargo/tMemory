import Conf from 'conf'

// Initialize Conf for device settings
const deviceConfig = new Conf({
  projectName: 'tmemory-device',
  schema: {
    deviceId: {
      type: 'string',
      default: '',
    },
  },
})

/**
 * Generates a random device ID if one doesn't exist
 * @returns The device ID
 */
export const getDeviceId = (): string => {
  let deviceId = deviceConfig.get('deviceId') as string
  
  if (!deviceId) {
    // Generate a random device ID
    deviceId = `tmem-${Math.random().toString(36).substring(2, 10)}-${Date.now().toString(36)}`
    deviceConfig.set('deviceId', deviceId)
  }
  
  return deviceId
}

/**
 * Checks if the device has a stored ID
 * @returns True if the device has an ID
 */
export const hasDeviceId = (): boolean => {
  return Boolean(deviceConfig.get('deviceId'))
}
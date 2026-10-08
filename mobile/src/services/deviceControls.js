import { NativeModules, Platform } from 'react-native';

const { DeviceControls: NativeDeviceControls } = NativeModules;

export const DeviceControls = {
  /**
   * Set actual device screen brightness (0.01 to 1.0)
   */
  setBrightness: async (value) => {
    if (Platform.OS === 'android' && NativeDeviceControls?.setBrightness) {
      try {
        return await NativeDeviceControls.setBrightness(value);
      } catch (e) {
        console.warn('DeviceControls.setBrightness error:', e);
      }
    }
    return value;
  },

  /**
   * Restore device system screen brightness default
   */
  restoreBrightness: async () => {
    if (Platform.OS === 'android' && NativeDeviceControls?.restoreBrightness) {
      try {
        return await NativeDeviceControls.restoreBrightness();
      } catch (e) {
        console.warn('DeviceControls.restoreBrightness error:', e);
      }
    }
  },

  /**
   * Get current device screen brightness (0.0 to 1.0)
   */
  getBrightness: async () => {
    if (Platform.OS === 'android' && NativeDeviceControls?.getBrightness) {
      try {
        return await NativeDeviceControls.getBrightness();
      } catch (e) {
        console.warn('DeviceControls.getBrightness error:', e);
      }
    }
    return 0.8;
  },

  /**
   * Set actual device system media volume (0.0 to 1.0)
   */
  setVolume: async (value) => {
    if (Platform.OS === 'android' && NativeDeviceControls?.setVolume) {
      try {
        return await NativeDeviceControls.setVolume(value);
      } catch (e) {
        console.warn('DeviceControls.setVolume error:', e);
      }
    }
    return value;
  },

  /**
   * Get current device media volume (0.0 to 1.0)
   */
  getVolume: async () => {
    if (Platform.OS === 'android' && NativeDeviceControls?.getVolume) {
      try {
        return await NativeDeviceControls.getVolume();
      } catch (e) {
        console.warn('DeviceControls.getVolume error:', e);
      }
    }
    return 0.8;
  },
};

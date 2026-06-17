import * as Location from 'expo-location';

export interface Coordinates {
  lat: number;
  lng: number;
}

/**
 * Requests foreground location permission.
 * Returns true if granted. Never throws — denial is handled gracefully by callers.
 */
export async function requestLocationPermission(): Promise<boolean> {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    return status === 'granted';
  } catch {
    return false;
  }
}

/**
 * Returns the device's current coordinates, or null if permission is denied
 * or the location cannot be resolved.
 */
export async function getCurrentLocation(): Promise<Coordinates | null> {
  try {
    const { status } = await Location.getForegroundPermissionsAsync();
    if (status !== 'granted') return null;

    const position = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });
    return {
      lat: position.coords.latitude,
      lng: position.coords.longitude,
    };
  } catch {
    return null;
  }
}

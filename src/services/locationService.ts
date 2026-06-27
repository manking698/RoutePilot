import * as Location from 'expo-location';
import type { LatLng, LocationResult } from '../types/location';

export const DEFAULT_LOCATION: LatLng = {
  latitude: 3.0634703,
  longitude: 101.6374375,
};

const toLatLng = (location: Location.LocationObject): LatLng => ({
  latitude: location.coords.latitude,
  longitude: location.coords.longitude,
});

export const requestCurrentLocation = async (): Promise<LocationResult> => {
  const permission = await Location.requestForegroundPermissionsAsync();

  if (permission.status !== Location.PermissionStatus.GRANTED) {
    return {
      location: null,
      error: 'Location permission denied. Enable GPS permission to show your current location.',
    };
  }

  const lastKnown = await Location.getLastKnownPositionAsync({
    maxAge: 30000,
    requiredAccuracy: 100,
  });

  if (lastKnown) {
    return {
      location: toLatLng(lastKnown),
      error: null,
    };
  }

  const current = await Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.Balanced,
  });

  return {
    location: toLatLng(current),
    error: null,
  };
};

export const watchUserLocation = async (
  onLocation: (location: LatLng) => void,
  onError: (message: string) => void,
) => {
  const permission = await Location.getForegroundPermissionsAsync();

  if (permission.status !== Location.PermissionStatus.GRANTED) {
    onError('Location permission is not granted.');
    return null;
  }

  return Location.watchPositionAsync(
    {
      accuracy: Location.Accuracy.Balanced,
      distanceInterval: 5,
      timeInterval: 1000,
    },
    (location) => onLocation(toLatLng(location)),
  );
};

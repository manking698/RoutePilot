export type LatLng = {
  latitude: number;
  longitude: number;
};

export type LocationResult = {
  location: LatLng | null;
  error: string | null;
};

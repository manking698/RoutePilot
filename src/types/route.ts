import type { LatLng } from './location';

export type PlaceSuggestion = {
  id: string;
  name: string;
  address: string;
  location: LatLng;
  isFallback?: boolean;
};

export type NavigationStep = {
  instruction: string;
  distanceText: string;
  durationText: string;
  startLocation: LatLng;
  endLocation: LatLng;
  maneuver?: string;
};

export type RouteDetails = {
  destination: PlaceSuggestion;
  coordinates: LatLng[];
  distanceText: string;
  durationText: string;
  distanceMeters: number;
  durationSeconds: number;
  etaText: string;
  steps: NavigationStep[];
  source: 'google' | 'demo';
  warning?: string;
};

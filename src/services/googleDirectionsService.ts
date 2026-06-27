import type { LatLng } from '../types/location';
import type { NavigationStep, PlaceSuggestion, RouteDetails } from '../types/route';
import { distanceMeters, formatDistance, formatDuration, formatEta } from '../utils/distance';
import { decodePolyline } from '../utils/polylineDecoder';

const DIRECTIONS_URL = 'https://maps.googleapis.com/maps/api/directions/json';

type GoogleDirectionsStep = {
  html_instructions?: string;
  distance?: {
    text: string;
    value: number;
  };
  duration?: {
    text: string;
    value: number;
  };
  start_location: {
    lat: number;
    lng: number;
  };
  end_location: {
    lat: number;
    lng: number;
  };
  maneuver?: string;
};

const toLatLng = (location: { lat: number; lng: number }): LatLng => ({
  latitude: location.lat,
  longitude: location.lng,
});

const cleanInstruction = (value?: string): string => {
  if (!value) {
    return 'Continue to your destination';
  }

  return value
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&#39;/g, "'")
    .trim();
};

const appendDestinationCoordinate = (
  coordinates: LatLng[],
  destinationLocation: LatLng,
): LatLng[] => {
  const lastCoordinate = coordinates[coordinates.length - 1];

  if (!lastCoordinate || distanceMeters(lastCoordinate, destinationLocation) > 3) {
    return [...coordinates, destinationLocation];
  }

  return coordinates;
};

const buildDemoRoute = (
  origin: LatLng,
  destination: PlaceSuggestion,
  warning: string,
): RouteDetails => {
  const midPointA = {
    latitude: origin.latitude + (destination.location.latitude - origin.latitude) * 0.35,
    longitude: origin.longitude + (destination.location.longitude - origin.longitude) * 0.12,
  };
  const midPointB = {
    latitude: origin.latitude + (destination.location.latitude - origin.latitude) * 0.7,
    longitude: origin.longitude + (destination.location.longitude - origin.longitude) * 0.65,
  };
  const controlPoints = [origin, midPointA, midPointB, destination.location];
  const coordinates = expandRoute(controlPoints, 8);
  const totalDistance = controlPoints.reduce((total, point, index) => {
    if (index === 0) {
      return total;
    }

    return total + distanceMeters(controlPoints[index - 1], point);
  }, 0);
  const durationSeconds = Math.max(360, Math.round(totalDistance / 7.5));

  const steps: NavigationStep[] = [
    {
      instruction: 'Turn left onto Jalan Kinrara',
      distanceText: '250 m',
      durationText: '1 min',
      startLocation: origin,
      endLocation: midPointA,
      maneuver: 'turn-left',
    },
    {
      instruction: 'Continue straight',
      distanceText: formatDistance(Math.max(800, totalDistance * 0.55)),
      durationText: formatDuration(durationSeconds * 0.6),
      startLocation: midPointA,
      endLocation: midPointB,
      maneuver: 'straight',
    },
    {
      instruction: 'Destination will be on the left',
      distanceText: '150 m',
      durationText: '1 min',
      startLocation: midPointB,
      endLocation: destination.location,
      maneuver: 'arrive',
    },
  ];

  return {
    destination,
    coordinates,
    distanceText: formatDistance(totalDistance),
    durationText: formatDuration(durationSeconds),
    distanceMeters: totalDistance,
    durationSeconds,
    etaText: formatEta(durationSeconds),
    steps,
    source: 'demo',
    warning,
  };
};

const expandRoute = (controlPoints: LatLng[], pointsPerSegment: number): LatLng[] => {
  const expanded: LatLng[] = [];

  controlPoints.forEach((point, index) => {
    if (index === controlPoints.length - 1) {
      expanded.push(point);
      return;
    }

    const nextPoint = controlPoints[index + 1];

    for (let step = 0; step < pointsPerSegment; step += 1) {
      const ratio = step / pointsPerSegment;
      expanded.push({
        latitude: point.latitude + (nextPoint.latitude - point.latitude) * ratio,
        longitude: point.longitude + (nextPoint.longitude - point.longitude) * ratio,
      });
    }
  });

  return expanded;
};

export const getDirections = async (
  origin: LatLng,
  destination: PlaceSuggestion,
  apiKey?: string,
): Promise<RouteDetails> => {
  if (!apiKey) {
    return buildDemoRoute(
      origin,
      destination,
      'Missing GOOGLE_MAPS_API_KEY. Showing simulated demo route.',
    );
  }

  const params = new URLSearchParams({
    origin: `${origin.latitude},${origin.longitude}`,
    destination: `${destination.location.latitude},${destination.location.longitude}`,
    mode: 'driving',
    key: apiKey,
  });

  try {
    const response = await fetch(`${DIRECTIONS_URL}?${params.toString()}`);
    const data = await response.json();

    if (data.status !== 'OK') {
      return buildDemoRoute(
        origin,
        destination,
        data.error_message || `Directions API failed: ${data.status}. Showing simulated route.`,
      );
    }

    const route = data.routes?.[0];
    const leg = route?.legs?.[0];

    if (!route?.overview_polyline?.points || !leg) {
      return buildDemoRoute(origin, destination, 'Directions API returned no route geometry.');
    }

    const coordinates = appendDestinationCoordinate(
      decodePolyline(route.overview_polyline.points),
      destination.location,
    );
    const steps = (leg.steps || []).map(
      (step: GoogleDirectionsStep): NavigationStep => ({
        instruction: cleanInstruction(step.html_instructions),
        distanceText: step.distance?.text || '',
        durationText: step.duration?.text || '',
        startLocation: toLatLng(step.start_location),
        endLocation: toLatLng(step.end_location),
        maneuver: step.maneuver,
      }),
    );

    return {
      destination,
      coordinates,
      distanceText: leg.distance?.text || formatDistance(0),
      durationText: leg.duration?.text || formatDuration(0),
      distanceMeters: leg.distance?.value || 0,
      durationSeconds: leg.duration?.value || 0,
      etaText: formatEta(leg.duration?.value || 0),
      steps,
      source: 'google',
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown Directions API error';

    return buildDemoRoute(origin, destination, `${message}. Showing simulated route.`);
  }
};

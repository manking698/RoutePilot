import type { PlaceSuggestion } from '../types/route';

const PLACES_AUTOCOMPLETE_URL =
  'https://maps.googleapis.com/maps/api/place/autocomplete/json';
const PLACE_DETAILS_URL = 'https://maps.googleapis.com/maps/api/place/details/json';

export const DEFAULT_DESTINATION_PLACE: PlaceSuggestion = {
  id: 'icity-demo',
  name: 'Shah Alam I-City',
  address: 'Jalan i-City 7/1, Shah Alam, Selangor',
  location: {
    latitude: 3.0638655,
    longitude: 101.4848547,
  },
  isFallback: true,
};

type GoogleAutocompletePrediction = {
  place_id: string;
  structured_formatting?: {
    main_text?: string;
    secondary_text?: string;
  };
  description: string;
};

type GooglePlaceDetailsResult = {
  name?: string;
  formatted_address?: string;
  geometry?: {
    location?: {
      lat: number;
      lng: number;
    };
  };
};

const getPlaceDetails = async (
  placeId: string,
  apiKey: string,
): Promise<PlaceSuggestion | null> => {
  const params = new URLSearchParams({
    place_id: placeId,
    fields: 'name,formatted_address,geometry',
    key: apiKey,
  });

  const response = await fetch(`${PLACE_DETAILS_URL}?${params.toString()}`);
  const data = await response.json();

  if (data.status !== 'OK') {
    return null;
  }

  const result = data.result as GooglePlaceDetailsResult;
  const location = result.geometry?.location;

  if (!location) {
    return null;
  }

  return {
    id: placeId,
    name: result.name || 'Selected place',
    address: result.formatted_address || '',
    location: {
      latitude: location.lat,
      longitude: location.lng,
    },
  };
};

export const searchPlaces = async (
  query: string,
  apiKey?: string,
): Promise<PlaceSuggestion[]> => {
  const normalizedQuery = query.trim();
  const normalizedLowerQuery = normalizedQuery.toLowerCase();

  if (
    !normalizedQuery ||
    normalizedLowerQuery.includes('i-city') ||
    normalizedLowerQuery.includes('icity') ||
    normalizedLowerQuery.includes('shah alam') ||
    normalizedLowerQuery.includes('bandar kinrara') ||
    normalizedLowerQuery.includes('taman kinrara')
  ) {
    return [DEFAULT_DESTINATION_PLACE];
  }

  if (!apiKey) {
    return [DEFAULT_DESTINATION_PLACE];
  }

  const params = new URLSearchParams({
    input: normalizedQuery,
    components: 'country:my',
    key: apiKey,
  });

  const response = await fetch(`${PLACES_AUTOCOMPLETE_URL}?${params.toString()}`);
  const data = await response.json();

  if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
    throw new Error(data.error_message || `Places API failed: ${data.status}`);
  }

  const predictions = (data.predictions || []) as GoogleAutocompletePrediction[];
  const limitedPredictions = predictions.slice(0, 4);
  const places = await Promise.all(
    limitedPredictions.map((prediction) => getPlaceDetails(prediction.place_id, apiKey)),
  );

  const resolvedPlaces = places.filter(Boolean) as PlaceSuggestion[];

  if (resolvedPlaces.length === 0) {
    return [DEFAULT_DESTINATION_PLACE];
  }

  return resolvedPlaces;
};

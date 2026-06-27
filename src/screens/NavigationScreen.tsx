import Constants from 'expo-constants';
import { StatusBar } from 'expo-status-bar';
import { LocateFixed, X } from 'lucide-react-native';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import MapView, { type Region } from 'react-native-maps';
import { MapViewComponent } from '../components/MapViewComponent';
import { NavigationInstructionCard } from '../components/NavigationInstructionCard';
import { RouteStepsOverlay } from '../components/RouteStepsOverlay';
import { RouteSummaryCard } from '../components/RouteSummaryCard';
import { SearchBar } from '../components/SearchBar';
import { BrandMark } from '../components/BrandMark';
import { getDirections } from '../services/googleDirectionsService';
import {
  DEFAULT_LOCATION,
  requestCurrentLocation,
  watchUserLocation,
} from '../services/locationService';
import type { LatLng } from '../types/location';
import type { NavigationStep, PlaceSuggestion, RouteDetails } from '../types/route';
import { distanceMeters } from '../utils/distance';
import { colors, radii, shadows } from '../theme/routePilotTheme';

type ScreenMode = 'idle' | 'preview' | 'navigating' | 'arrived';

const MIN_DEMO_SPEED_KMH = 40;
const MAX_DEMO_SPEED_KMH = 90;
const SMOOTH_POINT_SPACING_M = 3;
const DEMO_TICK_MS = 90;
const DEMO_TOTAL_TICKS = 606;
const MAX_DEMO_ROUTE_STEP_POINTS = 11;
const CAMERA_FOLLOW_INTERVAL_TICKS = 2;
const CAMERA_FOLLOW_ANIMATION_MS = DEMO_TICK_MS * CAMERA_FOLLOW_INTERVAL_TICKS;
const SPEED_UPDATE_INTERVAL_TICKS = 8;
const NAVIGATION_CAMERA_ZOOM = 17;
const NAVIGATION_CAMERA_PITCH = 45;
const FINAL_APPROACH_DISTANCE_M = 70;
const ARRIVAL_DISTANCE_M = 12;
const STEP_REACHED_DISTANCE_M = 180;
const FINAL_STEP_REACHED_DISTANCE_M = 35;
const CAR_VISIBLE_REGION_RATIO = 0.42;
const MIN_VISIBLE_DELTA = 0.0005;

const nextDemoSpeed = (currentSpeed: number) => {
  const drift = Math.floor(Math.random() * 15) - 7;
  return Math.min(MAX_DEMO_SPEED_KMH, Math.max(MIN_DEMO_SPEED_KMH, currentSpeed + drift));
};

const randomDemoSpeed = () =>
  MIN_DEMO_SPEED_KMH + Math.floor(Math.random() * (MAX_DEMO_SPEED_KMH - MIN_DEMO_SPEED_KMH + 1));

const interpolateLocation = (from: LatLng, to: LatLng, ratio: number): LatLng => ({
  latitude: from.latitude + (to.latitude - from.latitude) * ratio,
  longitude: from.longitude + (to.longitude - from.longitude) * ratio,
});

const buildSmoothRoute = (coordinates: LatLng[]): LatLng[] => {
  if (coordinates.length < 2) {
    return coordinates;
  }

  const smoothCoordinates: LatLng[] = [];

  coordinates.forEach((coordinate, index) => {
    if (index === coordinates.length - 1) {
      smoothCoordinates.push(coordinate);
      return;
    }

    const nextCoordinate = coordinates[index + 1];
    const segmentDistance = distanceMeters(coordinate, nextCoordinate);
    const steps = Math.max(1, Math.ceil(segmentDistance / SMOOTH_POINT_SPACING_M));

    for (let step = 0; step < steps; step += 1) {
      smoothCoordinates.push(interpolateLocation(coordinate, nextCoordinate, step / steps));
    }
  });

  return smoothCoordinates;
};

const buildNavigationCamera = (center: LatLng) => ({
  center,
  pitch: NAVIGATION_CAMERA_PITCH,
  zoom: NAVIGATION_CAMERA_ZOOM,
});

const isLocationVisibleInRegion = (location: LatLng, region: Region) => {
  const latitudeLimit = Math.max(region.latitudeDelta * CAR_VISIBLE_REGION_RATIO, MIN_VISIBLE_DELTA);
  const longitudeLimit = Math.max(region.longitudeDelta * CAR_VISIBLE_REGION_RATIO, MIN_VISIBLE_DELTA);

  return (
    Math.abs(location.latitude - region.latitude) <= latitudeLimit &&
    Math.abs(location.longitude - region.longitude) <= longitudeLimit
  );
};

export function NavigationScreen() {
  const mapRef = useRef<MapView | null>(null);
  const modeRef = useRef<ScreenMode>('idle');
  const routeOverviewModeRef = useRef(false);
  const userCameraControlRef = useRef(false);
  const latestMapRegionRef = useRef<Region | null>(null);
  const navigationTickRef = useRef(0);
  const [currentLocation, setCurrentLocation] = useState<LatLng>(DEFAULT_LOCATION);
  const [routeOrigin, setRouteOrigin] = useState<LatLng | null>(null);
  const [route, setRoute] = useState<RouteDetails | null>(null);
  const [mode, setMode] = useState<ScreenMode>('idle');
  const [locationMessage, setLocationMessage] = useState<string | null>('Requesting GPS...');
  const [isLoadingRoute, setIsLoadingRoute] = useState(false);
  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const [simulatedIndex, setSimulatedIndex] = useState(0);
  const [speedKmh, setSpeedKmh] = useState(80);
  const [isRouteStepsOpen, setIsRouteStepsOpen] = useState(false);

  const googleMapsApiKey = useMemo(
    () => Constants.expoConfig?.extra?.googleMapsApiKey as string | undefined,
    [],
  );

  const activeStep: NavigationStep | undefined = route?.steps[activeStepIndex];
  const smoothRouteCoordinates = useMemo(
    () => (route ? buildSmoothRoute(route.coordinates) : []),
    [route],
  );

  useEffect(() => {
    modeRef.current = mode;
  }, [mode]);

  const focusCurrentLocation = useCallback((targetLocation = currentLocation) => {
    routeOverviewModeRef.current = false;
    userCameraControlRef.current = false;
    mapRef.current?.animateCamera(
      {
        center: targetLocation,
        pitch: mode === 'navigating' ? NAVIGATION_CAMERA_PITCH : 0,
        zoom: mode === 'navigating' ? NAVIGATION_CAMERA_ZOOM : 15,
      },
      { duration: mode === 'navigating' ? CAMERA_FOLLOW_ANIMATION_MS : 450 },
    );
  }, [currentLocation, mode]);

  const handleMapRegionChangeComplete = useCallback(
    (region: Region, details?: { isGesture?: boolean }) => {
      latestMapRegionRef.current = region;

      if (details?.isGesture && modeRef.current === 'navigating') {
        userCameraControlRef.current = true;
        routeOverviewModeRef.current = false;
      }
    },
    [],
  );

  const fitRoute = useCallback((coordinates: LatLng[]) => {
    if (coordinates.length < 2) {
      return;
    }

    requestAnimationFrame(() => {
      mapRef.current?.fitToCoordinates(coordinates, {
        edgePadding: {
          top: 150,
          right: 70,
          bottom: 240,
          left: 70,
        },
        animated: true,
      });
    });
  }, []);

  const showRemainingRoute = useCallback(() => {
    if (!route) {
      return;
    }

    if (isRouteStepsOpen) {
      setIsRouteStepsOpen(false);
      focusCurrentLocation();
      return;
    }

    setIsRouteStepsOpen(true);

    const nextRemainingIndex = Math.min(simulatedIndex + 1, smoothRouteCoordinates.length);
    const remainingCoordinates =
      smoothRouteCoordinates.length > 0
        ? smoothRouteCoordinates.slice(nextRemainingIndex)
        : route.coordinates;
    const overviewCoordinates = [
      currentLocation,
      ...remainingCoordinates,
      route.destination.location,
    ];

    if (overviewCoordinates.length < 2) {
      return;
    }

    routeOverviewModeRef.current = true;

    requestAnimationFrame(() => {
      mapRef.current?.fitToCoordinates(overviewCoordinates, {
        edgePadding: {
          top: 130,
          right: 70,
          bottom: 260,
          left: 70,
        },
        animated: true,
      });
    });
  }, [
    currentLocation,
    focusCurrentLocation,
    isRouteStepsOpen,
    route,
    simulatedIndex,
    smoothRouteCoordinates,
  ]);

  useEffect(() => {
    let isMounted = true;
    let subscription: { remove: () => void } | null = null;

    const initializeLocation = async () => {
      try {
        const result = await requestCurrentLocation();

        if (!isMounted) {
          return;
        }

        if (result.location) {
          setCurrentLocation(result.location);
          setLocationMessage(null);
        } else {
          setLocationMessage(result.error);
        }

        subscription = await watchUserLocation(
          (location) => {
            if (modeRef.current !== 'navigating') {
              setCurrentLocation(location);
            }
          },
          (message) => setLocationMessage(message),
        );
      } catch (error) {
        setLocationMessage(
          error instanceof Error ? error.message : 'Unable to read device location.',
        );
      }
    };

    initializeLocation();

    return () => {
      isMounted = false;
      subscription?.remove();
    };
  }, []);

  useEffect(() => {
    if (mode !== 'navigating' || simulatedIndex !== 0) {
      return undefined;
    }

    focusCurrentLocation();
    return undefined;
  }, [focusCurrentLocation, mode, simulatedIndex]);

  useEffect(() => {
    if (mode !== 'navigating' || !route || smoothRouteCoordinates.length === 0) {
      return undefined;
    }

    const interval = setInterval(() => {
      setSimulatedIndex((previousIndex) => {
        const currentRouteLocation = smoothRouteCoordinates[previousIndex];
        const distanceToDestination = distanceMeters(
          currentRouteLocation,
          route.destination.location,
        );
        const baseStepSize = Math.max(1, Math.ceil(smoothRouteCoordinates.length / DEMO_TOTAL_TICKS));
        const routeStepSize = Math.min(MAX_DEMO_ROUTE_STEP_POINTS, baseStepSize);
        const stepSize = distanceToDestination <= FINAL_APPROACH_DISTANCE_M ? 1 : routeStepSize;
        const nextIndex = Math.min(previousIndex + stepSize, smoothRouteCoordinates.length - 1);
        const nextLocation = smoothRouteCoordinates[nextIndex];
        const nextDistanceToDestination = distanceMeters(nextLocation, route.destination.location);
        const shouldAnimateCamera =
          navigationTickRef.current % CAMERA_FOLLOW_INTERVAL_TICKS === 0 ||
          nextIndex === smoothRouteCoordinates.length - 1;
        const latestMapRegion = latestMapRegionRef.current;
        const shouldResumeFollow =
          userCameraControlRef.current &&
          latestMapRegion !== null &&
          !isLocationVisibleInRegion(nextLocation, latestMapRegion);

        setCurrentLocation(nextLocation);

        if (navigationTickRef.current % SPEED_UPDATE_INTERVAL_TICKS === 0) {
          setSpeedKmh(nextDemoSpeed);
        }

        if (shouldResumeFollow) {
          userCameraControlRef.current = false;
          routeOverviewModeRef.current = false;
        }

        if (
          !routeOverviewModeRef.current &&
          (shouldResumeFollow || (!userCameraControlRef.current && shouldAnimateCamera))
        ) {
          mapRef.current?.animateCamera(buildNavigationCamera(nextLocation), {
            duration: CAMERA_FOLLOW_ANIMATION_MS,
          });
        }

        navigationTickRef.current += 1;

        const reachedStepIndex = route.steps.findIndex((step, index) => {
          const threshold =
            index === route.steps.length - 1
              ? FINAL_STEP_REACHED_DISTANCE_M
              : STEP_REACHED_DISTANCE_M;

          return distanceMeters(nextLocation, step.endLocation) < threshold;
        });

        if (reachedStepIndex >= 0) {
          setActiveStepIndex(Math.min(reachedStepIndex + 1, route.steps.length - 1));
        }

        if (
          nextIndex === smoothRouteCoordinates.length - 1 &&
          nextDistanceToDestination <= ARRIVAL_DISTANCE_M
        ) {
          setMode('arrived');
        }

        return nextIndex;
      });
    }, DEMO_TICK_MS);

    return () => clearInterval(interval);
  }, [mode, route, smoothRouteCoordinates]);

  const handleSelectDestination = async (destination: PlaceSuggestion) => {
    setIsLoadingRoute(true);
    setRoute(null);
    setMode('idle');
    routeOverviewModeRef.current = false;
    userCameraControlRef.current = false;
    setIsRouteStepsOpen(false);
    navigationTickRef.current = 0;
    setActiveStepIndex(0);
    setSimulatedIndex(0);

    const origin = currentLocation;
    setRouteOrigin(origin);

    try {
      const nextRoute = await getDirections(origin, destination, googleMapsApiKey);
      setRoute(nextRoute);
      setMode('preview');
      fitRoute(nextRoute.coordinates);
    } finally {
      setIsLoadingRoute(false);
    }
  };

  const handleGo = () => {
    if (!route) {
      return;
    }

    setMode('navigating');
    routeOverviewModeRef.current = false;
    userCameraControlRef.current = false;
    setIsRouteStepsOpen(false);
    navigationTickRef.current = 0;
    setActiveStepIndex(0);
    setSimulatedIndex(0);
    setSpeedKmh(randomDemoSpeed());
    setCurrentLocation(route.coordinates[0]);
    focusCurrentLocation(route.coordinates[0]);
  };

  const handleCancel = () => {
    setMode('idle');
    routeOverviewModeRef.current = false;
    userCameraControlRef.current = false;
    setIsRouteStepsOpen(false);
    navigationTickRef.current = 0;
    setRoute(null);
    setRouteOrigin(null);
    setActiveStepIndex(0);
    setSimulatedIndex(0);
    focusCurrentLocation();
  };

  const handleArrived = () => {
    handleCancel();
  };

  return (
    <View style={styles.screen}>
      <StatusBar style={mode === 'navigating' || mode === 'arrived' ? 'light' : 'dark'} />
      <MapViewComponent
        mapRef={mapRef}
        currentLocation={currentLocation}
        destination={route?.destination}
        origin={routeOrigin}
        routeCoordinates={route?.coordinates || []}
        navigationMode={mode === 'navigating' || mode === 'arrived'}
        onRegionChangeComplete={handleMapRegionChangeComplete}
      />

      <SearchBar
        apiKey={googleMapsApiKey}
        disabled={mode === 'navigating' || mode === 'arrived'}
        onSelect={handleSelectDestination}
      />

      {mode === 'navigating' || mode === 'arrived' ? (
        <NavigationInstructionCard
          step={activeStep}
          arrived={mode === 'arrived'}
          onShowRouteOverview={showRemainingRoute}
        />
      ) : null}

      <View style={styles.mapControls}>
        <Pressable
          accessibilityLabel="Focus current location"
          onPress={() => focusCurrentLocation()}
          style={({ pressed }) => [styles.roundButton, pressed && styles.pressed]}
        >
          <LocateFixed color={colors.accent} size={20} />
        </Pressable>
        {route && mode !== 'idle' ? (
          <Pressable
            accessibilityLabel="Clear route"
            onPress={handleCancel}
            style={({ pressed }) => [styles.roundButton, pressed && styles.pressed]}
          >
            <X color={colors.textSecondary} size={20} />
          </Pressable>
        ) : null}
      </View>

      {locationMessage ? (
        <View style={styles.locationBanner}>
          <Text style={styles.locationBannerText}>{locationMessage}</Text>
        </View>
      ) : null}

      {isLoadingRoute ? (
        <View style={styles.loadingCard}>
          <ActivityIndicator color={colors.primary} />
          <Text style={styles.loadingText}>Loading route...</Text>
        </View>
      ) : null}

      {mode === 'preview' && route ? (
        <RouteSummaryCard route={route} onGo={handleGo} onCancel={handleCancel} />
      ) : null}

      {(mode === 'navigating' || mode === 'arrived') && route ? (
        <View style={styles.navigationCard}>
          <View style={styles.routeHeader}>
            <View style={styles.routeTitleButton}>
              <BrandMark />
              <Text style={styles.destinationLabel}>Destination</Text>
              <Text style={styles.destinationText} numberOfLines={2}>
                {route.destination.name}
              </Text>
            </View>
            {mode === 'arrived' ? (
              <Pressable
                onPress={handleArrived}
                style={({ pressed }) => [styles.doneButton, pressed && styles.pressed]}
              >
                <Text style={styles.doneButtonText}>Arrived</Text>
              </Pressable>
            ) : null}
          </View>
          <View style={styles.navMetricsRow}>
            <View style={styles.navMetricBlock}>
              <Text style={styles.navLabel}>ETA</Text>
              <Text style={styles.navMetric}>{route.durationText}</Text>
            </View>
            <View style={styles.navMetricBlock}>
              <Text style={styles.navLabel}>Distance</Text>
              <Text style={styles.navMetric}>{route.distanceText}</Text>
            </View>
            <View style={styles.navMetricBlock}>
              <Text style={styles.navLabel}>Current Speed</Text>
              <Text style={styles.navMetric}>{mode === 'arrived' ? '0' : speedKmh} km/h</Text>
            </View>
          </View>
        </View>
      ) : null}

      {isRouteStepsOpen && route ? (
        <RouteStepsOverlay
          destination={route.destination}
          onToggle={showRemainingRoute}
          steps={route.steps}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.lightBackground,
  },
  mapControls: {
    position: 'absolute',
    top: 188,
    right: 16,
    zIndex: 15,
    gap: 10,
  },
  roundButton: {
    width: 44,
    height: 44,
    borderRadius: radii.large,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.subtle,
  },
  locationBanner: {
    position: 'absolute',
    left: 16,
    right: 16,
    top: 118,
    zIndex: 18,
    padding: 10,
    borderRadius: radii.small,
    backgroundColor: '#FFFBEB',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#FED7AA',
  },
  locationBannerText: {
    color: colors.warning,
    fontSize: 12,
    fontWeight: '700',
  },
  loadingCard: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 32,
    zIndex: 20,
    minHeight: 72,
    borderRadius: radii.small,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 12,
    shadowColor: '#000000',
    shadowOpacity: 0.14,
    shadowRadius: 18,
    elevation: 10,
  },
  loadingText: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '700',
  },
  navigationCard: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 20,
    zIndex: 30,
    borderRadius: radii.card,
    padding: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(226, 232, 240, 0.9)',
    ...shadows.card,
  },
  routeHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  routeTitleButton: {
    flex: 1,
    paddingRight: 10,
  },
  destinationLabel: {
    marginTop: 7,
    color: colors.textSecondary,
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  destinationText: {
    marginTop: 2,
    color: colors.textPrimary,
    fontSize: 15,
    lineHeight: 19,
    fontWeight: '900',
  },
  navMetricsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
  },
  navMetricBlock: {
    flex: 1,
    minHeight: 58,
    borderRadius: radii.medium,
    justifyContent: 'center',
    backgroundColor: colors.lightBackground,
    paddingHorizontal: 10,
  },
  navMetric: {
    marginTop: 4,
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '900',
  },
  navLabel: {
    color: colors.textSecondary,
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  doneButton: {
    minWidth: 86,
    height: 42,
    borderRadius: radii.medium,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
  },
  doneButtonText: {
    color: colors.card,
    fontSize: 14,
    fontWeight: '900',
  },
  pressed: {
    opacity: 0.78,
  },
});

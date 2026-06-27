import type { RefObject } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE, type Region } from 'react-native-maps';
import { CarFront } from 'lucide-react-native';
import type { LatLng } from '../types/location';
import type { PlaceSuggestion } from '../types/route';
import { colors } from '../theme/routePilotTheme';

type RegionChangeDetails = {
  isGesture?: boolean;
};

type Props = {
  mapRef: RefObject<MapView | null>;
  currentLocation: LatLng;
  destination?: PlaceSuggestion | null;
  origin?: LatLng | null;
  routeCoordinates: LatLng[];
  navigationMode: boolean;
  onRegionChangeComplete?: (region: Region, details?: RegionChangeDetails) => void;
};

export function MapViewComponent({
  mapRef,
  currentLocation,
  destination,
  origin,
  routeCoordinates,
  navigationMode,
  onRegionChangeComplete,
}: Props) {
  const { height } = useWindowDimensions();
  const navigationMapPadding = navigationMode
    ? { top: 0, right: 0, bottom: Math.round(height * 0.2), left: 0 }
    : undefined;

  return (
    <MapView
      ref={mapRef}
      provider={PROVIDER_GOOGLE}
      style={styles.map}
      mapPadding={navigationMapPadding}
      initialRegion={{
        ...currentLocation,
        latitudeDelta: 0.035,
        longitudeDelta: 0.035,
      }}
      showsCompass={false}
      showsMyLocationButton={false}
      toolbarEnabled={false}
      zoomEnabled
      scrollEnabled
      rotateEnabled
      pitchEnabled
      onRegionChangeComplete={onRegionChangeComplete}
    >
      {routeCoordinates.length > 1 ? (
        <Polyline
          coordinates={routeCoordinates}
          strokeColor={colors.routeLine}
          strokeWidth={navigationMode ? 6 : 4}
          lineCap="round"
          lineJoin="round"
        />
      ) : null}

      {origin && routeCoordinates.length > 1 ? (
        <Marker coordinate={origin} anchor={{ x: 0.5, y: 0.5 }}>
          <View style={styles.originMarker} />
        </Marker>
      ) : null}

      <Marker coordinate={currentLocation} anchor={{ x: 0.5, y: 0.5 }}>
        <View style={[styles.currentMarker, navigationMode && styles.navigationMarker]}>
          {navigationMode ? (
            <View style={styles.carMarker}>
              <CarFront color={colors.card} size={21} strokeWidth={2.6} />
            </View>
          ) : (
            <View style={styles.currentMarkerDot} />
          )}
        </View>
      </Marker>

      {destination ? (
        <Marker coordinate={destination.location} anchor={{ x: 0.5, y: 1 }}>
          <View style={styles.destinationPin}>
            <View style={styles.destinationPinHead} />
            <View style={styles.destinationPinTail} />
          </View>
        </Marker>
      ) : null}
    </MapView>
  );
}

const styles = StyleSheet.create({
  map: {
    ...StyleSheet.absoluteFill,
  },
  currentMarker: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(20, 184, 166, 0.22)',
    borderWidth: 2,
    borderColor: 'rgba(20, 184, 166, 0.4)',
  },
  currentMarkerDot: {
    width: 19,
    height: 19,
    borderRadius: 10,
    backgroundColor: colors.currentLocation,
    borderWidth: 4,
    borderColor: colors.card,
  },
  navigationMarker: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(20, 184, 166, 0.24)',
    borderColor: colors.card,
    shadowColor: '#000000',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  carMarker: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.currentLocation,
    borderWidth: 2,
    borderColor: colors.card,
  },
  originMarker: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.primary,
    borderWidth: 2,
    borderColor: colors.card,
  },
  destinationPin: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  destinationPinHead: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.destination,
    borderWidth: 3,
    borderColor: colors.card,
    shadowColor: '#000000',
    shadowOpacity: 0.18,
    shadowRadius: 4,
    elevation: 5,
  },
  destinationPinTail: {
    width: 4,
    height: 13,
    marginTop: -2,
    backgroundColor: colors.destination,
    borderRadius: 2,
  },
});

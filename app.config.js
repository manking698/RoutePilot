require('dotenv').config({ quiet: true });

const googleMapsApiKey =
  process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || process.env.GOOGLE_MAPS_API_KEY || '';

module.exports = {
  name: 'RoutePilot',
  slug: 'route-pilot',
  description:
    'RoutePilot is a simple mobile navigation prototype focused on live location, destination routing, route preview, ETA, and lightweight navigation UI.',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/routepilot-icon.png',
  userInterfaceStyle: 'light',
  primaryColor: '#2563EB',
  backgroundColor: '#F8FAFC',
  android: {
    package: 'com.routepilot.mobile',
    predictiveBackGestureEnabled: false,
    adaptiveIcon: {
      backgroundColor: '#F8FAFC',
      foregroundImage: './assets/routepilot-adaptive-foreground.png',
      backgroundImage: './assets/routepilot-adaptive-background.png',
      monochromeImage: './assets/routepilot-adaptive-foreground.png',
    },
  },
  ios: {
    supportsTablet: true,
    bundleIdentifier: 'com.routepilot.mobile',
  },
  web: {
    favicon: './assets/favicon.png',
  },
  plugins: [
    [
      'react-native-maps',
      {
        androidGoogleMapsApiKey: googleMapsApiKey,
        iosGoogleMapsApiKey: googleMapsApiKey,
      },
    ],
    [
      'expo-location',
      {
        locationWhenInUsePermission:
          'Allow RoutePilot to use your location for route previews and demo navigation.',
      },
    ],
  ],
  extra: {
    googleMapsApiKey,
  },
};

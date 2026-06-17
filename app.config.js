// Dynamic Expo config. Merges static values from app.json (provided via the
// `config` argument) and injects native Google Maps API keys from environment
// variables so the key is never hardcoded in source control.
//
// Required env vars (see .env.example):
//   EXPO_PUBLIC_GOOGLE_MAPS_API_KEY  - native Maps SDK key (iOS + Android)
//   EXPO_PUBLIC_GOOGLE_PLACES_API_KEY - Places/Geocoding key (falls back to maps key)
//
// The same Google Cloud key may be used for all of: Maps SDK for Android,
// Maps SDK for iOS, Places API and Geocoding API. Restrict the key to the
// app's bundle id / package name in Google Cloud Console for production.

const { withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

const GOOGLE_MAPS_API_KEY =
  process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ||
  process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY ||
  '';

// @expo/config-plugins hard-codes 'react-native-google-maps' as the pod name,
// but react-native-maps v1.x only ships 'react-native-maps.podspec'.
// This plugin patches the generated Podfile after every prebuild.
function withReactNativeMapsIOS(config) {
  return withDangerousMod(config, [
    'ios',
    (expoConfig) => {
      const podfilePath = path.join(expoConfig.modRequest.platformProjectRoot, 'Podfile');
      if (fs.existsSync(podfilePath)) {
        let contents = fs.readFileSync(podfilePath, 'utf-8');
        contents = contents.replace(
          "pod 'react-native-google-maps'",
          "pod 'react-native-maps'",
        );
        fs.writeFileSync(podfilePath, contents);
      }
      return expoConfig;
    },
  ]);
}

export default ({ config }) => {
  const updatedConfig = {
    ...config,
    ios: {
      ...config.ios,
      config: {
        ...(config.ios?.config ?? {}),
        googleMapsApiKey: GOOGLE_MAPS_API_KEY,
      },
    },
    android: {
      ...config.android,
      googleServicesFile: './google-services.json',
      config: {
        ...(config.android?.config ?? {}),
        googleMaps: {
          ...(config.android?.config?.googleMaps ?? {}),
          apiKey: GOOGLE_MAPS_API_KEY,
        },
      },
    },
    plugins: [
      ...(config.plugins ?? []),
      [
        'expo-location',
        {
          locationWhenInUsePermission:
            'Triply uses your location to show nearby places and your position on the trip map.',
        },
      ],
    ],
  };

  return withReactNativeMapsIOS(updatedConfig);
};

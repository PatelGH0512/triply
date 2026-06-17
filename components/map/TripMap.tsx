import { useEffect, useRef } from 'react';
import { StyleSheet, View, ActivityIndicator, Platform } from 'react-native';
import MapView, { PROVIDER_GOOGLE, Marker } from 'react-native-maps';
import { ActivityWithDay, MapPlace } from '@/lib/api/map';
import { Coordinates } from '@/lib/api/location';
import { ActivityIcon } from '@/constants/enums';
import MapPin from './MapPin';
import Colors from '@/constants/colors';

interface TripMapProps {
  center: Coordinates | null;
  pins: ActivityWithDay[];
  highlightPlace: MapPlace | null;
  showUserLocation: boolean;
  onPinPress: (activity: ActivityWithDay) => void;
  onMapPress: () => void;
}

const CITY_DELTA = { latitudeDelta: 0.0922, longitudeDelta: 0.0421 };
const PLACE_DELTA = { latitudeDelta: 0.01, longitudeDelta: 0.01 };

export default function TripMap({
  center,
  pins,
  highlightPlace,
  showUserLocation,
  onPinPress,
  onMapPress,
}: TripMapProps) {
  const mapRef = useRef<MapView | null>(null);

  // Recenter on destination changes (city-level zoom).
  useEffect(() => {
    if (center) {
      mapRef.current?.animateToRegion(
        { latitude: center.lat, longitude: center.lng, ...CITY_DELTA },
        500,
      );
    }
  }, [center?.lat, center?.lng]);

  // Animate to a freshly selected search result (closer zoom).
  useEffect(() => {
    if (highlightPlace) {
      mapRef.current?.animateToRegion(
        {
          latitude: highlightPlace.latitude,
          longitude: highlightPlace.longitude,
          ...PLACE_DELTA,
        },
        500,
      );
    }
  }, [highlightPlace?.latitude, highlightPlace?.longitude]);

  if (!center) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color={Colors.primary.coral} />
      </View>
    );
  }

  return (
    <MapView
      ref={mapRef}
      provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
      style={StyleSheet.absoluteFill}
      initialRegion={{ latitude: center.lat, longitude: center.lng, ...CITY_DELTA }}
      showsUserLocation={showUserLocation}
      showsMyLocationButton={false}
      toolbarEnabled={false}
      onPress={onMapPress}
    >
      {pins.map((activity) =>
        activity.latitude != null && activity.longitude != null ? (
          <Marker
            key={activity.id}
            coordinate={{ latitude: activity.latitude, longitude: activity.longitude }}
            onPress={(e) => {
              e.stopPropagation();
              onPinPress(activity);
            }}
            anchor={{ x: 0.5, y: 1 }}
          >
            <MapPin icon={activity.icon} />
          </Marker>
        ) : null,
      )}

      {highlightPlace && (
        <Marker
          coordinate={{
            latitude: highlightPlace.latitude,
            longitude: highlightPlace.longitude,
          }}
          anchor={{ x: 0.5, y: 1 }}
          zIndex={999}
        >
          <MapPin icon={highlightPlace.icon ?? ActivityIcon.Other} highlighted />
        </Marker>
      )}
    </MapView>
  );
}

const styles = StyleSheet.create({
  loader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.neutral.background,
  },
});

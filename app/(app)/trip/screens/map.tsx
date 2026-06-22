import { useEffect, useRef, useState, useCallback } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Animated } from 'react-native';
import BottomSheet from '@gorhom/bottom-sheet';
import { Ionicons } from '@expo/vector-icons';
import { TripDestination } from '@/types';
import { useTripContext } from '@/lib/context/TripContext';
import { useItineraryPins } from '@/hooks/useMap';
import {
  ActivityWithDay,
  MapPlace,
  resolveDestinationCoordinates,
  placeFromActivity,
} from '@/lib/api/map';
import { Coordinates, requestLocationPermission } from '@/lib/api/location';
import TripMap from '@/components/map/TripMap';
import PlaceSearchBar from '@/components/map/PlaceSearchBar';
import PlaceDetailSheet from '@/components/map/PlaceDetailSheet';
import AddToTripSheet from '@/components/map/AddToTripSheet';
import Colors from '@/constants/colors';
import { NAV_TOTAL_HEIGHT } from '@/components/trip/TripBottomNav';

export default function MapScreen() {
  const { tripId, trip } = useTripContext();
  const insets = useSafeAreaInsets();
  const destinations: TripDestination[] = [...(trip.trip_destinations ?? [])].sort(
    (a, b) => a.order - b.order,
  );

  const { data: pins = [] } = useItineraryPins(tripId);

  const [selectedDestIndex, setSelectedDestIndex] = useState(0);
  const [center, setCenter] = useState<Coordinates | null>(null);
  const centerCache = useRef<Record<number, Coordinates>>({});

  const [hasLocationPermission, setHasLocationPermission] = useState(false);
  const [showItinerary, setShowItinerary] = useState(true);

  const [selectedPlace, setSelectedPlace] = useState<MapPlace | null>(null);
  const [isExisting, setIsExisting] = useState(false);
  const [highlightPlace, setHighlightPlace] = useState<MapPlace | null>(null);

  const detailSheetRef = useRef<BottomSheet>(null);
  const addSheetRef = useRef<BottomSheet>(null);

  // Toast
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const toastOpacity = useRef(new Animated.Value(0)).current;

  const showToast = useCallback(
    (msg: string) => {
      setToastMsg(msg);
      Animated.timing(toastOpacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
      setTimeout(() => {
        Animated.timing(toastOpacity, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }).start(() => setToastMsg(null));
      }, 2200);
    },
    [toastOpacity],
  );

  // Request location permission once on mount (graceful on denial).
  useEffect(() => {
    requestLocationPermission().then(setHasLocationPermission);
  }, []);

  // Resolve (and cache) the center coordinates for the selected destination.
  useEffect(() => {
    const dest = destinations[selectedDestIndex];
    if (!dest) return;

    const cached = centerCache.current[selectedDestIndex];
    if (cached) {
      setCenter(cached);
      return;
    }

    let active = true;
    resolveDestinationCoordinates(dest).then((coords) => {
      if (!active || !coords) return;
      centerCache.current[selectedDestIndex] = coords;
      setCenter(coords);
    });
    return () => {
      active = false;
    };
  }, [selectedDestIndex, destinations.length]);

  const handlePlaceSelected = (place: MapPlace) => {
    setSelectedPlace(place);
    setIsExisting(false);
    setHighlightPlace(place);
    detailSheetRef.current?.expand();
  };

  const handlePinPress = (activity: ActivityWithDay) => {
    const place = placeFromActivity(activity);
    if (!place) return;
    setSelectedPlace(place);
    setIsExisting(true);
    setHighlightPlace(null);
    detailSheetRef.current?.expand();
  };

  const handleMapPress = () => {
    addSheetRef.current?.close();
    detailSheetRef.current?.close();
  };

  const handleDetailClose = () => {
    setHighlightPlace(null);
    setSelectedPlace(null);
  };

  const handleAddToTrip = () => {
    addSheetRef.current?.expand();
  };

  const handleAdded = (dayLabel: string) => {
    detailSheetRef.current?.close();
    setHighlightPlace(null);
    showToast(`Added to ${dayLabel} \u2713`);
  };

  const destinationName = destinations[selectedDestIndex]?.name ?? 'destination';
  const visiblePins = showItinerary ? pins : [];

  return (
    <View style={styles.container}>
      <TripMap
        center={center}
        pins={visiblePins}
        highlightPlace={highlightPlace}
        showUserLocation={hasLocationPermission}
        onPinPress={handlePinPress}
        onMapPress={handleMapPress}
      />

      <PlaceSearchBar
        destinationName={destinationName}
        center={center}
        onPlaceSelected={handlePlaceSelected}
      />

      {destinations.length > 1 && (
        <View style={styles.switcherWrap}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.switcherRow}
            keyboardShouldPersistTaps="handled"
          >
            {destinations.map((dest, index) => {
              const active = index === selectedDestIndex;
              return (
                <TouchableOpacity
                  key={dest.id}
                  style={[styles.pill, active && styles.pillActive]}
                  onPress={() => setSelectedDestIndex(index)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.pillText, active && styles.pillTextActive]}>
                    {dest.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      )}

      <TouchableOpacity
        style={[styles.itineraryToggle, { bottom: NAV_TOTAL_HEIGHT + insets.bottom + 8 }]}
        onPress={() => setShowItinerary((v) => !v)}
        activeOpacity={0.85}
      >
        <Ionicons
          name={showItinerary ? 'eye-outline' : 'eye-off-outline'}
          size={16}
          color={Colors.primary.coral}
        />
        <Text style={styles.itineraryToggleText}>
          {showItinerary ? 'Hide itinerary' : 'Show itinerary'}
        </Text>
      </TouchableOpacity>

      {toastMsg && (
        <Animated.View style={[styles.toast, { opacity: toastOpacity }]} pointerEvents="none">
          <Text style={styles.toastText}>{toastMsg}</Text>
        </Animated.View>
      )}

      <PlaceDetailSheet
        sheetRef={detailSheetRef}
        place={selectedPlace}
        isExisting={isExisting}
        onAddToTrip={handleAddToTrip}
        onClose={handleDetailClose}
      />

      <AddToTripSheet
        sheetRef={addSheetRef}
        tripId={tripId}
        place={isExisting ? null : selectedPlace}
        onAdded={handleAdded}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.neutral.background,
  },
  switcherWrap: {
    position: 'absolute',
    top: 64,
    left: 0,
    right: 0,
    zIndex: 9,
  },
  switcherRow: {
    paddingHorizontal: 16,
    gap: 8,
  },
  pill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.neutral.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  pillActive: {
    backgroundColor: Colors.primary.coral,
  },
  pillText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.text.secondary,
  },
  pillTextActive: {
    color: Colors.neutral.white,
  },
  itineraryToggle: {
    position: 'absolute',
    left: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 22,
    backgroundColor: Colors.neutral.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 5,
  },
  itineraryToggleText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.primary.coral,
  },
  toast: {
    position: 'absolute',
    bottom: 80,
    alignSelf: 'center',
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 24,
    backgroundColor: Colors.text.primary,
  },
  toastText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.neutral.white,
  },
});

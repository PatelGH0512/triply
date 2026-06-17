import { useCallback } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Linking,
  Platform,
} from 'react-native';
import BottomSheet, {
  BottomSheetScrollView,
  BottomSheetBackdrop,
  BottomSheetBackdropProps,
} from '@gorhom/bottom-sheet';
import { Ionicons } from '@expo/vector-icons';
import dayjs from 'dayjs';
import { MapPlace } from '@/lib/api/map';
import Colors from '@/constants/colors';

interface PlaceDetailSheetProps {
  sheetRef: React.RefObject<BottomSheet | null>;
  place: MapPlace | null;
  /** When true the place is an existing activity (no "Add to Trip" action). */
  isExisting: boolean;
  onAddToTrip: () => void;
  onClose: () => void;
}

const SNAP_POINTS = ['55%', '92%'];

/** Maps JS day index (0=Sun) to Google weekday_text index (0=Mon). */
function todayWeekdayIndex(): number {
  return (dayjs().day() + 6) % 7;
}

export default function PlaceDetailSheet({
  sheetRef,
  place,
  isExisting,
  onAddToTrip,
  onClose,
}: PlaceDetailSheetProps) {
  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop
        {...props}
        appearsOnIndex={0}
        disappearsOnIndex={-1}
        pressBehavior="close"
      />
    ),
    [],
  );

  const openInMaps = () => {
    if (!place) return;
    const query = place.placeId
      ? `${encodeURIComponent(place.name)}`
      : `${place.latitude},${place.longitude}`;
    const url = place.placeId
      ? `https://www.google.com/maps/search/?api=1&query=${query}&query_place_id=${place.placeId}`
      : `https://www.google.com/maps/search/?api=1&query=${query}`;
    Linking.openURL(url).catch(() => {});
  };

  const callPhone = () => {
    if (!place?.phone) return;
    const sanitized = place.phone.replace(/\s+/g, '');
    Linking.openURL(`tel:${sanitized}`).catch(() => {});
  };

  const openWebsite = () => {
    if (!place?.website) return;
    Linking.openURL(place.website).catch(() => {});
  };

  const todayIndex = todayWeekdayIndex();

  return (
    <BottomSheet
      ref={sheetRef}
      index={-1}
      snapPoints={SNAP_POINTS}
      enablePanDownToClose
      onClose={onClose}
      backdropComponent={renderBackdrop}
      backgroundStyle={styles.sheetBg}
      handleIndicatorStyle={styles.handle}
    >
      {place && (
        <BottomSheetScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {place.photos.length > 0 && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.photoRow}
            >
              {place.photos.map((uri) => (
                <Image key={uri} source={{ uri }} style={styles.photo} />
              ))}
            </ScrollView>
          )}

          <Text style={styles.name}>{place.name}</Text>

          <View style={styles.metaRow}>
            {place.category && <Text style={styles.category}>{place.category}</Text>}
            {place.rating != null && (
              <View style={styles.ratingRow}>
                <Ionicons name="star" size={14} color={Colors.secondary.sandDark} />
                <Text style={styles.rating}>{place.rating.toFixed(1)}</Text>
                {place.userRatingsTotal != null && (
                  <Text style={styles.reviews}>
                    · {place.userRatingsTotal.toLocaleString()} reviews
                  </Text>
                )}
              </View>
            )}
          </View>

          {place.address && (
            <View style={styles.infoRow}>
              <Ionicons name="location-outline" size={18} color={Colors.text.tertiary} />
              <Text style={styles.infoText}>{place.address}</Text>
            </View>
          )}

          {place.openingHours?.weekday_text?.length ? (
            <View style={styles.hoursBlock}>
              <View style={styles.infoRow}>
                <Ionicons name="time-outline" size={18} color={Colors.text.tertiary} />
                <Text
                  style={[
                    styles.openStatus,
                    place.openingHours.open_now ? styles.openNow : styles.closedNow,
                  ]}
                >
                  {place.openingHours.open_now == null
                    ? 'Opening hours'
                    : place.openingHours.open_now
                      ? 'Open now'
                      : 'Closed now'}
                </Text>
              </View>
              <View style={styles.hoursList}>
                {place.openingHours.weekday_text.map((line, i) => (
                  <Text
                    key={line}
                    style={[styles.hoursLine, i === todayIndex && styles.hoursToday]}
                  >
                    {line}
                  </Text>
                ))}
              </View>
            </View>
          ) : null}

          {place.phone && (
            <TouchableOpacity style={styles.infoRow} onPress={callPhone} activeOpacity={0.7}>
              <Ionicons name="call-outline" size={18} color={Colors.text.tertiary} />
              <Text style={[styles.infoText, styles.link]}>{place.phone}</Text>
            </TouchableOpacity>
          )}

          {place.website && (
            <TouchableOpacity style={styles.infoRow} onPress={openWebsite} activeOpacity={0.7}>
              <Ionicons name="globe-outline" size={18} color={Colors.text.tertiary} />
              <Text style={[styles.infoText, styles.link]} numberOfLines={1}>
                {place.website}
              </Text>
            </TouchableOpacity>
          )}

          {place.description && <Text style={styles.description}>{place.description}</Text>}

          <View style={styles.actions}>
            {!isExisting && (
              <TouchableOpacity style={styles.addBtn} onPress={onAddToTrip} activeOpacity={0.85}>
                <Ionicons name="add" size={18} color={Colors.neutral.white} />
                <Text style={styles.addBtnText}>Add to Trip</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[styles.mapsBtn, isExisting && styles.mapsBtnFull]}
              onPress={openInMaps}
              activeOpacity={0.85}
            >
              <Ionicons name="map-outline" size={18} color={Colors.primary.coral} />
              <Text style={styles.mapsBtnText}>
                {Platform.OS === 'ios' ? 'View on Maps' : 'View on Google Maps'}
              </Text>
            </TouchableOpacity>
          </View>
        </BottomSheetScrollView>
      )}
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  sheetBg: {
    backgroundColor: Colors.neutral.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  handle: { backgroundColor: Colors.neutral.border, width: 40 },
  content: { padding: 20, paddingBottom: 40, gap: 14 },
  photoRow: { gap: 8 },
  photo: {
    width: 220,
    height: 140,
    borderRadius: 12,
    backgroundColor: Colors.neutral.background,
  },
  name: {
    fontSize: 24,
    fontWeight: '800',
    color: Colors.text.primary,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: -6,
  },
  category: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text.secondary,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  rating: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text.primary,
  },
  reviews: {
    fontSize: 13,
    color: Colors.text.tertiary,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: Colors.text.secondary,
  },
  link: {
    color: Colors.primary.coral,
  },
  hoursBlock: { gap: 6 },
  openStatus: {
    fontSize: 14,
    fontWeight: '700',
  },
  openNow: { color: Colors.status.success },
  closedNow: { color: Colors.status.error },
  hoursList: {
    paddingLeft: 28,
    gap: 2,
  },
  hoursLine: {
    fontSize: 13,
    color: Colors.text.tertiary,
  },
  hoursToday: {
    color: Colors.text.primary,
    fontWeight: '700',
  },
  description: {
    fontSize: 14,
    color: Colors.text.secondary,
    lineHeight: 20,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
  },
  addBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 52,
    borderRadius: 12,
    backgroundColor: Colors.primary.coral,
  },
  addBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.neutral.white,
  },
  mapsBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 52,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: Colors.primary.coral,
    backgroundColor: Colors.neutral.white,
  },
  mapsBtnFull: { flex: 1 },
  mapsBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.primary.coral,
  },
});

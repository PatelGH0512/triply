import { View, StyleSheet } from 'react-native';
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';
import { Ionicons } from '@expo/vector-icons';
import { MapPlace, GooglePlaceDetail, placeFromGoogleDetail } from '@/lib/api/map';
import { Coordinates } from '@/lib/api/location';
import Colors from '@/constants/colors';

interface PlaceSearchBarProps {
  destinationName: string;
  center: Coordinates | null;
  onPlaceSelected: (place: MapPlace) => void;
}

const DETAIL_FIELDS =
  'name,place_id,types,rating,user_ratings_total,formatted_address,vicinity,formatted_phone_number,international_phone_number,website,opening_hours,geometry,photos';

export default function PlaceSearchBar({
  destinationName,
  center,
  onPlaceSelected,
}: PlaceSearchBarProps) {
  return (
    <View style={styles.container}>
      <GooglePlacesAutocomplete
        placeholder={`Search places in ${destinationName}...`}
        minLength={2}
        fetchDetails
        enablePoweredByContainer={false}
        keepResultsAfterBlur
        listViewDisplayed="auto"
        onPress={(_data, details) => {
          if (!details) return;
          const place = placeFromGoogleDetail(details as unknown as GooglePlaceDetail);
          if (place) onPlaceSelected(place);
        }}
        query={{
          key: process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY,
          language: 'en',
          ...(center ? { location: `${center.lat},${center.lng}`, radius: 50000 } : {}),
        }}
        GooglePlacesDetailsQuery={{ fields: DETAIL_FIELDS }}
        renderLeftButton={() => (
          <View style={styles.iconWrap}>
            <Ionicons name="search" size={18} color={Colors.text.tertiary} />
          </View>
        )}
        textInputProps={{
          placeholderTextColor: Colors.neutral.placeholder,
        }}
        styles={{
          container: styles.autocompleteContainer,
          textInputContainer: styles.textInputContainer,
          textInput: styles.textInput,
          listView: styles.listView,
          row: styles.row,
          description: styles.description,
          separator: styles.separator,
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 12,
    left: 0,
    right: 0,
    zIndex: 10,
    paddingHorizontal: 16,
  },
  autocompleteContainer: {
    flex: 0,
  },
  textInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.neutral.white,
    borderRadius: 14,
    paddingLeft: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 5,
  },
  iconWrap: {
    justifyContent: 'center',
  },
  textInput: {
    flex: 1,
    height: 48,
    fontSize: 15,
    color: Colors.text.primary,
    backgroundColor: 'transparent',
    paddingLeft: 8,
    marginBottom: 0,
  },
  listView: {
    backgroundColor: Colors.neutral.white,
    borderRadius: 14,
    marginTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 5,
  },
  row: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: 'transparent',
  },
  description: {
    fontSize: 14,
    color: Colors.text.primary,
  },
  separator: {
    height: 1,
    backgroundColor: Colors.neutral.borderLight,
  },
});

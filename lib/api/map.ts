import { supabase } from '../supabase';
import { Activity, Day, TripDestination } from '@/types';
import { ActivityIcon } from '@/constants/enums';
import { createActivity } from './activities';
import { Coordinates } from './location';

const GOOGLE_KEY =
  process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ||
  process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY ||
  '';

/** An activity joined with its day, used to render itinerary pins on the map. */
export interface ActivityWithDay extends Activity {
  day?: Pick<Day, 'id' | 'date' | 'label' | 'order'> | null;
}

/**
 * Normalized place model used by the detail sheet and add-to-trip flow.
 * Sourced either from a Google Places result or an existing activity.
 */
export interface MapPlace {
  placeId: string | null;
  name: string;
  category: string | null;
  rating: number | null;
  userRatingsTotal: number | null;
  address: string | null;
  openingHours: { weekday_text?: string[]; open_now?: boolean } | null;
  phone: string | null;
  website: string | null;
  photos: string[];
  latitude: number;
  longitude: number;
  icon: ActivityIcon;
  description: string | null;
  /** Set when the place is an already-saved activity (view-only mode). */
  activityId?: string;
}

/** Subset of the Google Place Details object returned via fetchDetails. */
export interface GooglePlaceDetail {
  place_id?: string;
  name?: string;
  types?: string[];
  rating?: number;
  user_ratings_total?: number;
  formatted_address?: string;
  vicinity?: string;
  formatted_phone_number?: string;
  international_phone_number?: string;
  website?: string;
  opening_hours?: { weekday_text?: string[]; open_now?: boolean };
  geometry?: { location?: { lat: number; lng: number } };
  photos?: { photo_reference?: string }[];
}

const MAX_PHOTOS = 5;

/** Builds Google Places photo URLs from photo references (capped at MAX_PHOTOS). */
export function buildPhotoUrls(
  photos: { photo_reference?: string }[] | undefined,
  maxWidth = 600,
): string[] {
  if (!photos?.length || !GOOGLE_KEY) return [];
  return photos
    .slice(0, MAX_PHOTOS)
    .map((p) => p.photo_reference)
    .filter((ref): ref is string => !!ref)
    .map(
      (ref) =>
        `https://maps.googleapis.com/maps/api/place/photo?maxwidth=${maxWidth}&photo_reference=${ref}&key=${GOOGLE_KEY}`,
    );
}

/** Maps Google Place types to a suggested activity icon. */
export function suggestIconFromTypes(types: string[] | undefined): ActivityIcon {
  if (!types?.length) return ActivityIcon.Other;
  const set = new Set(types);
  const has = (...t: string[]) => t.some((x) => set.has(x));

  if (has('bar', 'night_club', 'liquor_store')) return ActivityIcon.Bar;
  if (has('cafe', 'coffee_shop', 'bakery')) return ActivityIcon.Coffee;
  if (has('restaurant', 'food', 'meal_takeaway', 'meal_delivery'))
    return ActivityIcon.Restaurant;
  if (has('lodging', 'hotel')) return ActivityIcon.Hotel;
  if (has('airport')) return ActivityIcon.Flight;
  if (
    has(
      'transit_station',
      'bus_station',
      'train_station',
      'subway_station',
      'light_rail_station',
      'taxi_stand',
    )
  )
    return ActivityIcon.Transport;
  if (has('car_rental', 'car_repair', 'gas_station', 'parking'))
    return ActivityIcon.Transport;
  if (has('museum', 'art_gallery')) return ActivityIcon.Museum;
  if (has('tourist_attraction', 'amusement_park', 'zoo', 'aquarium'))
    return ActivityIcon.Activity;
  if (has('movie_theater', 'casino', 'stadium')) return ActivityIcon.Entertainment;
  if (has('natural_feature', 'park', 'campground', 'hiking_area'))
    return ActivityIcon.Hiking;
  if (has('shopping_mall', 'store', 'clothing_store', 'department_store'))
    return ActivityIcon.Shopping;
  if (set.has('marina')) return ActivityIcon.Beach;
  if (has('hospital', 'pharmacy', 'doctor', 'spa')) return ActivityIcon.Health;

  return ActivityIcon.Other;
}

/** Produces a human-readable category label from Google Place types. */
export function formatPlaceCategory(types: string[] | undefined): string | null {
  if (!types?.length) return null;
  const ignored = new Set([
    'point_of_interest',
    'establishment',
    'political',
    'premise',
  ]);
  const primary = types.find((t) => !ignored.has(t)) ?? types[0];
  return primary
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

/** Converts a Google Place Details object into the normalized MapPlace model. */
export function placeFromGoogleDetail(detail: GooglePlaceDetail): MapPlace | null {
  const loc = detail.geometry?.location;
  if (!loc) return null;
  return {
    placeId: detail.place_id ?? null,
    name: detail.name ?? 'Unnamed place',
    category: formatPlaceCategory(detail.types),
    rating: detail.rating ?? null,
    userRatingsTotal: detail.user_ratings_total ?? null,
    address: detail.formatted_address ?? detail.vicinity ?? null,
    openingHours: detail.opening_hours ?? null,
    phone: detail.formatted_phone_number ?? detail.international_phone_number ?? null,
    website: detail.website ?? null,
    photos: buildPhotoUrls(detail.photos),
    latitude: loc.lat,
    longitude: loc.lng,
    icon: suggestIconFromTypes(detail.types),
    description: null,
  };
}

/** Converts an existing activity into the normalized MapPlace model (view-only). */
export function placeFromActivity(activity: ActivityWithDay): MapPlace | null {
  if (activity.latitude == null || activity.longitude == null) return null;
  return {
    placeId: activity.place_id,
    name: activity.title,
    category: null,
    rating: null,
    userRatingsTotal: null,
    address: activity.location_name,
    openingHours: null,
    phone: null,
    website: null,
    photos: [],
    latitude: activity.latitude,
    longitude: activity.longitude,
    icon: activity.icon,
    description: activity.description,
    activityId: activity.id,
  };
}

/**
 * Geocodes a destination name to coordinates using the Google Geocoding API.
 * Should be called once and the result cached — each call is billable.
 */
export async function geocodeDestination(name: string): Promise<Coordinates | null> {
  if (!name || !GOOGLE_KEY) return null;
  try {
    const res = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
        name,
      )}&key=${GOOGLE_KEY}`,
    );
    const json = await res.json();
    const loc = json?.results?.[0]?.geometry?.location;
    if (loc && typeof loc.lat === 'number' && typeof loc.lng === 'number') {
      return { lat: loc.lat, lng: loc.lng };
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Resolves coordinates for a destination: uses stored lat/lng when available,
 * otherwise geocodes the name. Avoids unnecessary billable Geocoding calls.
 */
export async function resolveDestinationCoordinates(
  destination: TripDestination,
): Promise<Coordinates | null> {
  if (destination.latitude != null && destination.longitude != null) {
    return { lat: destination.latitude, lng: destination.longitude };
  }
  return geocodeDestination(destination.name);
}

/** Fetches all activities for a trip that have coordinates, joined with day info. */
export async function getActivitiesWithCoordinates(
  tripId: string,
): Promise<ActivityWithDay[]> {
  const { data, error } = await supabase
    .from('activities')
    .select('*, day:days(id, date, label, order)')
    .eq('trip_id', tripId)
    .not('latitude', 'is', null)
    .not('longitude', 'is', null)
    .order('start_time', { ascending: true, nullsFirst: false });
  if (error || !data) return [];
  return data as ActivityWithDay[];
}

export interface AddActivityFromMapParams {
  dayId: string;
  tripId: string;
  place: MapPlace;
  time: string;
  icon: ActivityIcon;
  title?: string;
  description?: string | null;
  userId?: string;
}

/**
 * Convenience wrapper around createActivity that pre-fills location fields
 * from a selected map place.
 */
export async function addActivityFromMap({
  dayId,
  tripId,
  place,
  time,
  icon,
  title,
  description,
  userId,
}: AddActivityFromMapParams): Promise<Activity | null> {
  return createActivity({
    trip_id: tripId,
    day_id: dayId,
    title: title?.trim() || place.name,
    icon,
    location_name: place.address ?? place.name,
    place_id: place.placeId ?? null,
    latitude: place.latitude,
    longitude: place.longitude,
    start_time: time,
    description: description?.trim() || null,
    created_by: userId,
  });
}

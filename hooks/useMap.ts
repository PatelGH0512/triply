import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getActivitiesWithCoordinates,
  addActivityFromMap,
  AddActivityFromMapParams,
} from '@/lib/api/map';

/** Fetches all activities with coordinates for rendering itinerary pins. */
export function useItineraryPins(tripId: string) {
  return useQuery({
    queryKey: ['itineraryPins', tripId],
    queryFn: () => getActivitiesWithCoordinates(tripId),
    enabled: !!tripId,
  });
}

/**
 * Creates an activity from a selected map place and refreshes both the day's
 * activities and the map pins so the new pin appears immediately.
 */
export function useAddActivityFromMap() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (params: AddActivityFromMapParams) => addActivityFromMap(params),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['activities', variables.dayId] });
      queryClient.invalidateQueries({ queryKey: ['itineraryPins', variables.tripId] });
    },
  });
}

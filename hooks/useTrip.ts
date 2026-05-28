import { useTripStore } from '@/store/tripStore';

export function useTrip() {
  const { activeTrip, trips, setActiveTrip, setTrips } = useTripStore();

  return {
    activeTrip,
    trips,
    setActiveTrip,
    setTrips,
  };
}

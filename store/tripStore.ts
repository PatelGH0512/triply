import { create } from 'zustand';
import { Trip } from '@/types';

interface TripState {
  activeTrip: Trip | null;
  trips: Trip[];
  setActiveTrip: (trip: Trip | null) => void;
  setTrips: (trips: Trip[]) => void;
}

export const useTripStore = create<TripState>((set) => ({
  activeTrip: null,
  trips: [],
  setActiveTrip: (trip) => set({ activeTrip: trip }),
  setTrips: (trips) => set({ trips }),
}));

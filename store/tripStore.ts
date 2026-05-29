import { create } from 'zustand';
import { TripWithDetails } from '@/types';

interface TripState {
  activeTrip: TripWithDetails | null;
  trips: TripWithDetails[];
  isLoading: boolean;
  setActiveTrip: (trip: TripWithDetails | null) => void;
  setTrips: (trips: TripWithDetails[]) => void;
  addTrip: (trip: TripWithDetails) => void;
  removeTrip: (tripId: string) => void;
  setLoading: (isLoading: boolean) => void;
}

export const useTripStore = create<TripState>((set) => ({
  activeTrip: null,
  trips: [],
  isLoading: false,
  setActiveTrip: (trip) => set({ activeTrip: trip }),
  setTrips: (trips) => set({ trips }),
  addTrip: (trip) => set((state) => ({ trips: [trip, ...state.trips] })),
  removeTrip: (tripId) =>
    set((state) => ({ trips: state.trips.filter((t) => t.id !== tripId) })),
  setLoading: (isLoading) => set({ isLoading }),
}));

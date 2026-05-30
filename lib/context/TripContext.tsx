import { createContext, useContext, ReactNode } from 'react';
import { TripWithDetails } from '@/types';
import { MemberRole } from '@/constants/enums';
import { useAuthStore } from '@/store/authStore';

interface TripContextValue {
  tripId: string;
  trip: TripWithDetails;
  isAdmin: boolean;
}

const TripContext = createContext<TripContextValue | null>(null);

interface TripProviderProps {
  children: ReactNode;
  tripId: string;
  trip: TripWithDetails;
}

export function TripProvider({ children, tripId, trip }: TripProviderProps) {
  const { user } = useAuthStore();

  const isAdmin =
    trip.trip_members?.some(
      (m) => m.user_id === user?.id && m.role === MemberRole.Admin,
    ) ?? false;

  return (
    <TripContext.Provider value={{ tripId, trip, isAdmin }}>
      {children}
    </TripContext.Provider>
  );
}

export function useTripContext(): TripContextValue {
  const ctx = useContext(TripContext);
  if (!ctx) throw new Error('useTripContext must be used inside TripProvider');
  return ctx;
}

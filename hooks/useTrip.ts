import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getTrips, getTripById, createTrip, deleteOwnTrip, CreateTripInput } from '@/lib/api/trips';
import { useAuthStore } from '@/store/authStore';

export function useTrips() {
  const { session } = useAuthStore();
  const userId = session?.user?.id ?? '';
  return useQuery({
    queryKey: ['trips', userId],
    queryFn: () => getTrips(userId),
    enabled: !!userId,
  });
}

export function useTrip(tripId: string) {
  return useQuery({
    queryKey: ['trip', tripId],
    queryFn: () => getTripById(tripId),
    enabled: !!tripId,
  });
}

export function useCreateTrip() {
  const queryClient = useQueryClient();
  const { session } = useAuthStore();
  const userId = session?.user?.id ?? '';
  return useMutation({
    mutationFn: (input: Omit<CreateTripInput, 'userId'>) =>
      createTrip({ ...input, userId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trips', userId] });
    },
  });
}

export function useDeleteOwnTrip() {
  const queryClient = useQueryClient();
  const { session } = useAuthStore();
  const userId = session?.user?.id ?? '';
  return useMutation({
    mutationFn: (tripId: string) => deleteOwnTrip(tripId, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trips', userId] });
    },
  });
}

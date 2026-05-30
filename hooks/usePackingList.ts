import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getPackingItems,
  addPackingItem,
  getChecks,
  checkItem,
  uncheckItem,
} from '@/lib/api/packingList';
import { useAuthStore } from '@/store/authStore';

export function usePackingItems(tripId: string) {
  return useQuery({
    queryKey: ['packing', tripId],
    queryFn: () => getPackingItems(tripId),
    enabled: !!tripId,
  });
}

export function usePackingChecks(tripId: string, userId: string) {
  return useQuery({
    queryKey: ['packingChecks', tripId, userId],
    queryFn: () => getChecks(tripId, userId),
    enabled: !!tripId && !!userId,
  });
}

export function useAddPackingItem(tripId: string) {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  return useMutation({
    mutationFn: (name: string) => addPackingItem(tripId, name, user?.id ?? ''),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['packing', tripId] });
    },
  });
}

export function useToggleCheck(tripId: string, userId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      itemId,
      isChecked,
    }: {
      itemId: string;
      isChecked: boolean;
    }) => (isChecked ? uncheckItem(itemId, userId) : checkItem(itemId, userId)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['packingChecks', tripId, userId] });
    },
  });
}

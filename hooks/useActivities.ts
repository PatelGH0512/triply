import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getDays,
  getActivitiesByDay,
  createActivity,
  updateActivity,
  deleteActivity,
  reorderActivity,
} from '@/lib/api/activities';
import { Activity } from '@/types';

export function useDays(tripId: string) {
  return useQuery({
    queryKey: ['days', tripId],
    queryFn: () => getDays(tripId),
    enabled: !!tripId,
  });
}

export function useActivities(dayId: string) {
  return useQuery({
    queryKey: ['activities', dayId],
    queryFn: () => getActivitiesByDay(dayId),
    enabled: !!dayId,
  });
}

export function useCreateActivity(dayId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Activity>) => createActivity(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activities', dayId] });
    },
  });
}

export function useUpdateActivity(dayId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      activityId,
      data,
    }: {
      activityId: string;
      data: Partial<Activity>;
    }) => updateActivity(activityId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activities', dayId] });
    },
  });
}

export function useDeleteActivity(dayId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (activityId: string) => deleteActivity(activityId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activities', dayId] });
    },
  });
}

export function useReorderActivity(dayId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      activityId,
      newOrder,
    }: {
      activityId: string;
      newOrder: number;
    }) => reorderActivity(activityId, newOrder),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activities', dayId] });
    },
  });
}

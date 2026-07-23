import { useRef, useMemo, useEffect } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { View, StyleSheet } from 'react-native';
import BottomSheet from '@gorhom/bottom-sheet';
import dayjs from 'dayjs';
import { useTripContext } from '@/lib/context/TripContext';
import { useDays, useActivitiesByTrip } from '@/hooks/useActivities';
import { buildTripContext } from '@/lib/utils/buildTripContext';
import { useAIChat } from '@/hooks/useAIChat';
import ChatV1 from '@/components/ui/templates/chat-v1';
import QuickPromptSheet from '@/components/ai/QuickPromptSheet';
import { NAV_TOTAL_HEIGHT } from '@/components/trip/TripBottomNav';

export default function AiScreen() {
  const { tripId, trip } = useTripContext();
  const insets = useSafeAreaInsets();
  const bottomInset = insets.bottom + NAV_TOTAL_HEIGHT;
  const quickPromptSheetRef = useRef<BottomSheet>(null);

  const { data: days = [] } = useDays(tripId);
  const { data: activities = [] } = useActivitiesByTrip(tripId);

  const tripContext = useMemo(
    () => buildTripContext(trip, days, activities),
    [trip, days, activities],
  );

  const {
    messages,
    isLoading,
    streamingId,
    rateLimitHit,
    sendMessage,
    cancelMessage,
    onStreamComplete,
    clearChat,
  } = useAIChat(tripContext);

  useEffect(() => {
    return () => {
      clearChat();
    };
  }, []);

  const destination = trip.trip_destinations[0]?.name ?? trip.name;

  const dateRange = useMemo(() => {
    const start = dayjs(trip.start_date).format('MMM D');
    const end = dayjs(trip.end_date).format('MMM D');
    return `${start} – ${end}`;
  }, [trip.start_date, trip.end_date]);

  const memberCount = trip.trip_members.length;

  const totalDays = useMemo(
    () => dayjs(trip.end_date).diff(dayjs(trip.start_date), 'day') + 1,
    [trip.start_date, trip.end_date],
  );

  const nextEmptyDayNumber = useMemo(() => {
    const activitiesByDay: Record<string, number> = {};
    for (const a of activities) {
      activitiesByDay[a.day_id] = (activitiesByDay[a.day_id] ?? 0) + 1;
    }
    const emptyDayIndex = days.findIndex((d) => !(activitiesByDay[d.id] > 0));
    return emptyDayIndex >= 0 ? emptyDayIndex + 1 : days.length + 1;
  }, [days, activities]);

  return (
    <View style={[styles.container, { paddingBottom: bottomInset }]}>
      <ChatV1
        destination={destination}
        dateRange={dateRange}
        memberCount={memberCount}
        totalDays={totalDays}
        onPressPlus={() => quickPromptSheetRef.current?.expand()}
        messages={messages}
        isLoading={isLoading}
        streamingId={streamingId}
        rateLimitHit={rateLimitHit}
        sendMessage={sendMessage}
        cancelMessage={cancelMessage}
        onStreamComplete={onStreamComplete}
      />
      <QuickPromptSheet
        sheetRef={quickPromptSheetRef}
        destination={destination}
        tripStartDate={trip.start_date}
        nextEmptyDayNumber={nextEmptyDayNumber}
        onSelectPrompt={(prompt) => {
          sendMessage(prompt);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

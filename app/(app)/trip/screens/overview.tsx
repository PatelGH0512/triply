import { useRef, useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import BottomSheet from '@gorhom/bottom-sheet';
import { Ionicons } from '@expo/vector-icons';
import { Activity } from '@/types';
import { useTripContext } from '@/lib/context/TripContext';
import { useDays } from '@/hooks/useActivities';
import DayCard from '@/components/trip/DayCard';
import ActivityBottomSheet from '@/components/activity/ActivityBottomSheet';
import DocumentsSheet from '@/components/trip/DocumentsSheet';
import PackingListSheet from '@/components/trip/PackingListSheet';
import Colors from '@/constants/colors';
import { NAV_TOTAL_HEIGHT } from '@/components/trip/TripBottomNav';

export default function OverviewScreen() {
  const { tripId } = useTripContext();
  const insets = useSafeAreaInsets();
  const { data: days = [], isLoading } = useDays(tripId);

  const activitySheetRef = useRef<BottomSheet>(null);
  const documentsSheetRef = useRef<BottomSheet>(null);
  const packingSheetRef = useRef<BottomSheet>(null);

  const [sheetMode, setSheetMode] = useState<'add' | 'edit'>('add');
  const [selectedActivity, setSelectedActivity] = useState<Activity | undefined>(undefined);
  const [selectedDayId, setSelectedDayId] = useState<string>('');

  const openAddActivity = (dayId: string) => {
    setSheetMode('add');
    setSelectedActivity(undefined);
    setSelectedDayId(dayId);
    activitySheetRef.current?.expand();
  };

  const openEditActivity = (activity: Activity) => {
    setSheetMode('edit');
    setSelectedActivity(activity);
    setSelectedDayId(activity.day_id);
    activitySheetRef.current?.expand();
  };

  return (
    <>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: NAV_TOTAL_HEIGHT + insets.bottom + 8 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.quickAccess}>
          <TouchableOpacity
            style={styles.quickCard}
            onPress={() => documentsSheetRef.current?.expand()}
            activeOpacity={0.8}
          >
            <View style={[styles.quickIcon, { backgroundColor: Colors.accent.tealLight + '33' }]}>
              <Ionicons name="document-text-outline" size={22} color={Colors.accent.teal} />
            </View>
            <Text style={styles.quickLabel}>Documents</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickCard}
            onPress={() => packingSheetRef.current?.expand()}
            activeOpacity={0.8}
          >
            <View style={[styles.quickIcon, { backgroundColor: Colors.secondary.sand + '33' }]}>
              <Ionicons name="checkbox-outline" size={22} color={Colors.secondary.sandDark} />
            </View>
            <Text style={styles.quickLabel}>Packing List</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.daysSection}>
          <Text style={styles.sectionTitle}>Itinerary</Text>

          {isLoading ? (
            <ActivityIndicator color={Colors.primary.coral} style={styles.loader} />
          ) : days.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No days found for this trip.</Text>
            </View>
          ) : (
            <View style={styles.daysStack}>
              {days.map((day, index) => (
                <DayCard
                  key={day.id}
                  day={day}
                  defaultExpanded={index === 0}
                  onAddActivity={openAddActivity}
                  onEditActivity={openEditActivity}
                />
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      <ActivityBottomSheet
        sheetRef={activitySheetRef}
        tripId={tripId}
        dayId={selectedDayId}
        mode={sheetMode}
        activity={selectedActivity}
      />

      <DocumentsSheet sheetRef={documentsSheetRef} tripId={tripId} />

      <PackingListSheet sheetRef={packingSheetRef} tripId={tripId} />
    </>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    backgroundColor: Colors.neutral.background,
  },
  content: {
    padding: 16,
    gap: 20,
  },
  quickAccess: {
    flexDirection: 'row',
    gap: 12,
  },
  quickCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: Colors.neutral.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.neutral.border,
    padding: 14,
  },
  quickIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  daysSection: {
    gap: 12,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.text.primary,
  },
  loader: { marginTop: 24 },
  emptyState: {
    paddingVertical: 24,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: Colors.text.tertiary,
  },
  daysStack: {
    gap: 10,
  },
});

import { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  FadeIn,
  FadeOut,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import dayjs from 'dayjs';
import { Day, Activity } from '@/types';
import { useActivities } from '@/hooks/useActivities';
import ActivityCard from '@/components/activity/ActivityCard';
import Colors from '@/constants/colors';

interface DayCardProps {
  day: Day;
  defaultExpanded?: boolean;
  onAddActivity: (dayId: string) => void;
  onEditActivity: (activity: Activity) => void;
}

export default function DayCard({
  day,
  defaultExpanded = false,
  onAddActivity,
  onEditActivity,
}: DayCardProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const { data: activities = [], isLoading } = useActivities(day.id);

  const chevronRotation = useSharedValue(defaultExpanded ? 180 : 0);
  const chevronStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${chevronRotation.value}deg` }],
  }));

  const toggle = () => {
    const next = !expanded;
    setExpanded(next);
    chevronRotation.value = withTiming(next ? 180 : 0, { duration: 220 });
  };

  const date = dayjs(day.date);
  const dayLabel = `Day ${day.order}`;
  const dateLabel = date.format('MMM D · dddd');
  const activityCount = activities.length;

  return (
    <Animated.View style={styles.container}>
      <TouchableOpacity style={styles.header} onPress={toggle} activeOpacity={0.8}>
        <View style={styles.headerLeft}>
          <Text style={styles.dayLabel}>{dayLabel}</Text>
          <Text style={styles.dateLabel}>{dateLabel}</Text>
        </View>
        <View style={styles.headerRight}>
          {!expanded && (
            <Text style={styles.countLabel}>
              {activityCount} {activityCount === 1 ? 'activity' : 'activities'}
            </Text>
          )}
          <Animated.View style={chevronStyle}>
            <Ionicons name="chevron-down" size={18} color={Colors.text.tertiary} />
          </Animated.View>
        </View>
      </TouchableOpacity>

      {expanded && (
        <Animated.View
          entering={FadeIn.duration(200)}
          exiting={FadeOut.duration(150)}
          style={styles.body}
        >
          {isLoading ? (
            <ActivityIndicator
              size="small"
              color={Colors.primary.coral}
              style={styles.loader}
            />
          ) : activities.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No activities yet. Tap + to add one.</Text>
            </View>
          ) : (
            <View style={styles.activitiesStack}>
              {activities.map((activity) => (
                <ActivityCard
                  key={activity.id}
                  activity={activity}
                  dayId={day.id}
                  onEdit={onEditActivity}
                />
              ))}
            </View>
          )}

          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => onAddActivity(day.id)}
            activeOpacity={0.8}
          >
            <Ionicons name="add" size={16} color={Colors.primary.coral} />
            <Text style={styles.addBtnText}>Add Activity</Text>
          </TouchableOpacity>
        </Animated.View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.neutral.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.neutral.border,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  headerLeft: {
    gap: 2,
  },
  dayLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.text.primary,
  },
  dateLabel: {
    fontSize: 12,
    color: Colors.text.tertiary,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  countLabel: {
    fontSize: 12,
    color: Colors.text.tertiary,
  },
  body: {
    borderTopWidth: 1,
    borderTopColor: Colors.neutral.borderLight,
    padding: 12,
    gap: 8,
  },
  loader: {
    paddingVertical: 12,
  },
  emptyState: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 13,
    color: Colors.text.tertiary,
    fontStyle: 'italic',
  },
  activitiesStack: {
    gap: 8,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: Colors.primary.coralFaded,
    backgroundColor: Colors.primary.coralFaded,
    marginTop: 4,
  },
  addBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.primary.coral,
  },
});

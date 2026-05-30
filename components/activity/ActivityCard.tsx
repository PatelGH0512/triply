import { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  FadeIn,
  FadeOut,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import dayjs from 'dayjs';
import { Activity } from '@/types';
import { ActivityIconMap } from '@/constants/icons';
import { ActivityIcon } from '@/constants/enums';
import { useTripContext } from '@/lib/context/TripContext';
import { useDeleteActivity } from '@/hooks/useActivities';
import TabRow, { Tab } from '@/components/ui/TabRow';
import ActivityLinksList from '@/components/activity/ActivityLinksList';
import ActivityMediaViewer from '@/components/activity/ActivityMediaViewer';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import VoteStrip from '@/components/activity/VoteStrip';
import Colors from '@/constants/colors';

const TABS: Tab[] = [
  { key: 'description', label: 'Description' },
  { key: 'links', label: 'Links' },
  { key: 'media', label: 'Media' },
];

interface ActivityCardProps {
  activity: Activity;
  dayId: string;
  onEdit: (activity: Activity) => void;
}

export default function ActivityCard({ activity, dayId, onEdit }: ActivityCardProps) {
  const { isAdmin } = useTripContext();
  const [expanded, setExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState('description');
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  const { mutate: deleteActivity, isPending: isDeleting } = useDeleteActivity(dayId);

  const chevronRotation = useSharedValue(0);
  const chevronStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${chevronRotation.value}deg` }],
  }));

  const toggle = () => {
    const next = !expanded;
    setExpanded(next);
    chevronRotation.value = withTiming(next ? 180 : 0, { duration: 200 });
  };

  const handleDelete = () => {
    setDeleteConfirm(false);
    deleteActivity(activity.id);
  };

  const iconName =
    (ActivityIconMap[activity.icon as ActivityIcon] as keyof typeof Ionicons.glyphMap) ??
    'ellipsis-horizontal';

  const timeLabel = activity.start_time
    ? dayjs(`2000-01-01T${activity.start_time}`).format('h:mm A')
    : null;

  return (
    <>
      <TouchableOpacity
        style={[styles.card, expanded && styles.cardExpanded]}
        onPress={toggle}
        activeOpacity={0.85}
      >
        <View style={styles.header}>
          <View style={styles.iconWrap}>
            <Ionicons name={iconName} size={18} color={Colors.primary.coral} />
          </View>
          <View style={styles.meta}>
            <Text style={styles.title} numberOfLines={expanded ? undefined : 1}>
              {activity.title}
            </Text>
            {activity.location_name ? (
              <Text style={styles.location} numberOfLines={1}>
                {activity.location_name}
              </Text>
            ) : null}
          </View>
          {timeLabel ? <Text style={styles.time}>{timeLabel}</Text> : null}
          <Animated.View style={chevronStyle}>
            <Ionicons name="chevron-down" size={16} color={Colors.text.tertiary} />
          </Animated.View>
        </View>

        <VoteStrip activityId={activity.id} />

        {expanded && (
          <Animated.View
            entering={FadeIn.duration(180)}
            exiting={FadeOut.duration(120)}
            style={styles.body}
          >
            <TabRow tabs={TABS} activeTab={activeTab} onTabPress={setActiveTab} />

            <View style={styles.tabContent}>
              {activeTab === 'description' && (
                <Text style={styles.description}>
                  {activity.description?.trim() ? activity.description : 'No description added.'}
                </Text>
              )}
              {activeTab === 'links' && <ActivityLinksList links={activity.links ?? []} />}
              {activeTab === 'media' && <ActivityMediaViewer media={activity.media ?? []} />}
            </View>

            <View style={styles.actions}>
              <TouchableOpacity
                style={[styles.actionBtn, styles.editBtn]}
                onPress={() => onEdit(activity)}
              >
                <Ionicons name="pencil-outline" size={14} color={Colors.primary.coral} />
                <Text style={styles.editBtnText}>Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionBtn, styles.deleteBtn]}
                onPress={() => setDeleteConfirm(true)}
                disabled={isDeleting}
              >
                <Ionicons name="trash-outline" size={14} color={Colors.status.error} />
                <Text style={styles.deleteBtnText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        )}
      </TouchableOpacity>

      <ConfirmDialog
        visible={deleteConfirm}
        title="Delete this activity?"
        message="This cannot be undone."
        confirmText="Delete"
        destructive
        onConfirm={handleDelete}
        onCancel={() => setDeleteConfirm(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.neutral.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.neutral.border,
    overflow: 'hidden',
  },
  cardExpanded: {
    borderColor: Colors.primary.coralFaded,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
  },
  iconWrap: {
    width: 34,
    height: 34,
    borderRadius: 9,
    backgroundColor: Colors.primary.coralFaded,
    alignItems: 'center',
    justifyContent: 'center',
  },
  meta: {
    flex: 1,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  location: {
    fontSize: 12,
    color: Colors.text.tertiary,
    marginTop: 1,
  },
  time: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.text.secondary,
  },
  body: {
    paddingHorizontal: 12,
    paddingBottom: 12,
    gap: 10,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.neutral.borderLight,
    marginBottom: 2,
  },
  tabContent: {
    minHeight: 48,
  },
  description: {
    fontSize: 13,
    color: Colors.text.secondary,
    lineHeight: 19,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  editBtn: {
    borderColor: Colors.primary.coralFaded,
    backgroundColor: Colors.primary.coralFaded,
  },
  editBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.primary.coral,
  },
  deleteBtn: {
    borderColor: Colors.status.errorLight,
    backgroundColor: Colors.status.errorLight,
  },
  deleteBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.status.error,
  },
});

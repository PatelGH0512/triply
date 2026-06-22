import { useState, useEffect, useCallback } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import BottomSheet, {
  BottomSheetScrollView,
  BottomSheetBackdrop,
  BottomSheetBackdropProps,
} from '@gorhom/bottom-sheet';
import RNDateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import dayjs from 'dayjs';
import { Day } from '@/types';
import { ActivityIcon } from '@/constants/enums';
import { MapPlace } from '@/lib/api/map';
import { useDays } from '@/hooks/useActivities';
import { useAddActivityFromMap } from '@/hooks/useMap';
import { useAuthStore } from '@/store/authStore';
import ActivityIconPicker from '@/components/activity/ActivityIconPicker';
import Colors from '@/constants/colors';
import { NAV_TOTAL_HEIGHT } from '@/components/trip/TripBottomNav';

interface AddToTripSheetProps {
  sheetRef: React.RefObject<BottomSheet | null>;
  tripId: string;
  place: MapPlace | null;
  onAdded: (dayLabel: string) => void;
}

const SNAP_POINTS = ['85%', '95%'];

export default function AddToTripSheet({ sheetRef, tripId, place, onAdded }: AddToTripSheetProps) {
  const { user } = useAuthStore();
  const insets = useSafeAreaInsets();
  const { data: days = [] } = useDays(tripId);
  const addActivity = useAddActivityFromMap();

  const [step, setStep] = useState<1 | 2>(1);
  const [selectedDay, setSelectedDay] = useState<{ day: Day; label: string } | null>(null);
  const [title, setTitle] = useState('');
  const [icon, setIcon] = useState<ActivityIcon>(ActivityIcon.Other);
  const [description, setDescription] = useState('');
  const [time, setTime] = useState('');
  const [timeError, setTimeError] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  useEffect(() => {
    if (place) {
      setTitle(place.name);
      setIcon(place.icon);
      setDescription('');
      setTime('');
      setTimeError(false);
      setSelectedDay(null);
      setStep(1);
    }
  }, [place]);

  const resetState = useCallback(() => {
    setStep(1);
    setSelectedDay(null);
    setTime('');
    setTimeError(false);
    setShowTimePicker(false);
  }, []);

  const handleSelectDay = (day: Day, index: number) => {
    setSelectedDay({ day, label: `Day ${index + 1}` });
    setStep(2);
  };

  const handleTimeChange = (_event: DateTimePickerEvent, selected?: Date) => {
    if (Platform.OS === 'android') setShowTimePicker(false);
    if (selected) {
      setTime(dayjs(selected).format('HH:mm:ss'));
      setTimeError(false);
    }
  };

  const handleAdd = () => {
    if (!place || !selectedDay) return;
    if (!time) {
      setTimeError(true);
      return;
    }
    addActivity.mutate(
      {
        dayId: selectedDay.day.id,
        tripId,
        place,
        time,
        icon,
        title,
        description,
        userId: user?.id,
      },
      {
        onSuccess: (created) => {
          if (!created) {
            Alert.alert('Error', 'Could not add the activity. Please try again.');
            return;
          }
          const label = selectedDay.label;
          sheetRef.current?.close();
          resetState();
          onAdded(label);
        },
        onError: () => {
          Alert.alert('Error', 'Could not add the activity. Please try again.');
        },
      },
    );
  };

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop
        {...props}
        appearsOnIndex={0}
        disappearsOnIndex={-1}
        pressBehavior="close"
      />
    ),
    [],
  );

  const timeDisplay = time ? dayjs(`2000-01-01T${time}`).format('h:mm A') : 'Set time';

  return (
    <BottomSheet
      ref={sheetRef}
      index={-1}
      snapPoints={SNAP_POINTS}
      enablePanDownToClose
      keyboardBehavior="interactive"
      keyboardBlurBehavior="restore"
      onClose={resetState}
      backdropComponent={renderBackdrop}
      backgroundStyle={styles.sheetBg}
      handleIndicatorStyle={styles.handle}
    >
      <BottomSheetScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: NAV_TOTAL_HEIGHT + insets.bottom + 16 },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        {step === 1 ? (
          <>
            <Text style={styles.sheetTitle}>Select a day</Text>
            <Text style={styles.subtitle}>Add {place?.name} to your itinerary</Text>
            <View style={styles.dayList}>
              {days.map((day, index) => (
                <TouchableOpacity
                  key={day.id}
                  style={styles.dayRow}
                  onPress={() => handleSelectDay(day, index)}
                  activeOpacity={0.7}
                >
                  <View>
                    <Text style={styles.dayLabel}>Day {index + 1}</Text>
                    <Text style={styles.dayDate}>
                      {dayjs(day.date).format('MMM D')} · {dayjs(day.date).format('dddd')}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={Colors.text.tertiary} />
                </TouchableOpacity>
              ))}
              {days.length === 0 && (
                <Text style={styles.emptyText}>No days available for this trip.</Text>
              )}
            </View>
          </>
        ) : (
          <>
            <View style={styles.stepHeader}>
              <TouchableOpacity onPress={() => setStep(1)} style={styles.backBtn}>
                <Ionicons name="chevron-back" size={20} color={Colors.text.secondary} />
              </TouchableOpacity>
              <Text style={styles.sheetTitle}>Confirm details</Text>
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Name</Text>
              <TextInput
                style={styles.input}
                value={title}
                onChangeText={setTitle}
                placeholder="Activity name"
                placeholderTextColor={Colors.neutral.placeholder}
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Icon</Text>
              <ActivityIconPicker selected={icon} onSelect={setIcon} />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Location</Text>
              <View style={[styles.input, styles.readOnly]}>
                <Ionicons name="location" size={15} color={Colors.text.tertiary} />
                <Text style={styles.readOnlyText} numberOfLines={1}>
                  {place?.address ?? place?.name}
                </Text>
              </View>
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Time *</Text>
              <TouchableOpacity
                style={[styles.input, styles.timeBtn, timeError && styles.inputError]}
                onPress={() => setShowTimePicker(true)}
              >
                <Ionicons name="time-outline" size={16} color={Colors.text.tertiary} />
                <Text style={time ? styles.timeValue : styles.timePlaceholder}>{timeDisplay}</Text>
              </TouchableOpacity>
              {timeError && <Text style={styles.error}>Please set a time for this activity</Text>}
              {showTimePicker && (
                <RNDateTimePicker
                  value={time ? dayjs(`2000-01-01T${time}`).toDate() : new Date()}
                  mode="time"
                  is24Hour={false}
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={handleTimeChange}
                  onTouchCancel={() => setShowTimePicker(false)}
                />
              )}
              {showTimePicker && Platform.OS === 'ios' && (
                <TouchableOpacity style={styles.doneBtn} onPress={() => setShowTimePicker(false)}>
                  <Text style={styles.doneBtnText}>Done</Text>
                </TouchableOpacity>
              )}
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Description</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={description}
                onChangeText={setDescription}
                placeholder="Add notes (optional)"
                placeholderTextColor={Colors.neutral.placeholder}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>

            <TouchableOpacity
              style={[styles.addBtn, addActivity.isPending && styles.addBtnDisabled]}
              onPress={handleAdd}
              disabled={addActivity.isPending}
              activeOpacity={0.85}
            >
              {addActivity.isPending ? (
                <ActivityIndicator color={Colors.neutral.white} />
              ) : (
                <Text style={styles.addBtnText}>Add to {selectedDay?.label}</Text>
              )}
            </TouchableOpacity>
          </>
        )}
      </BottomSheetScrollView>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  sheetBg: {
    backgroundColor: Colors.neutral.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  handle: { backgroundColor: Colors.neutral.border, width: 40 },
  content: { padding: 20, gap: 16 },
  sheetTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.text.primary,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.text.secondary,
    marginTop: -8,
  },
  dayList: { gap: 10, marginTop: 4 },
  dayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: Colors.neutral.border,
    backgroundColor: Colors.neutral.white,
  },
  dayLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.text.primary,
  },
  dayDate: {
    fontSize: 13,
    color: Colors.text.secondary,
    marginTop: 2,
  },
  emptyText: {
    fontSize: 14,
    color: Colors.text.tertiary,
    textAlign: 'center',
    paddingVertical: 16,
  },
  stepHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  backBtn: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -6,
  },
  field: { gap: 8 },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  input: {
    minHeight: 48,
    borderWidth: 1.5,
    borderColor: Colors.neutral.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    fontSize: 15,
    color: Colors.text.primary,
    backgroundColor: Colors.neutral.white,
  },
  inputError: { borderColor: Colors.status.error },
  readOnly: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.neutral.background,
  },
  readOnlyText: {
    flex: 1,
    fontSize: 14,
    color: Colors.text.secondary,
  },
  textArea: {
    height: 80,
    paddingTop: 12,
  },
  timeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  timeValue: {
    fontSize: 15,
    color: Colors.text.primary,
  },
  timePlaceholder: {
    fontSize: 15,
    color: Colors.neutral.placeholder,
  },
  doneBtn: { alignItems: 'flex-end', paddingVertical: 6 },
  doneBtnText: {
    color: Colors.primary.coral,
    fontWeight: '700',
    fontSize: 15,
  },
  error: { fontSize: 12, color: Colors.status.error },
  addBtn: {
    height: 52,
    borderRadius: 12,
    backgroundColor: Colors.primary.coral,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  addBtnDisabled: { opacity: 0.6 },
  addBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.neutral.white,
  },
});

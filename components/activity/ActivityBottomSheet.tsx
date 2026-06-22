import { useState, useCallback, useEffect } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Platform,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import BottomSheet, { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import RNDateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';
import { Ionicons } from '@expo/vector-icons';
import dayjs from 'dayjs';
import { Activity } from '@/types';
import { ActivityIcon } from '@/constants/enums';
import { activitySchema, ActivityForm } from '@/lib/validations/activity';
import { createActivity, updateActivity } from '@/lib/api/activities';
import { createLinks, deleteLinks } from '@/lib/api/activityLinks';
import { uploadMedia } from '@/lib/api/activityMedia';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/store/authStore';
import ActivityIconPicker from '@/components/activity/ActivityIconPicker';
import MediaThumbnail from '@/components/ui/MediaThumbnail';
import Colors from '@/constants/colors';
import { NAV_TOTAL_HEIGHT } from '@/components/trip/TripBottomNav';

interface PendingMedia {
  uri: string;
  fileName: string;
  mimeType: string;
  type: 'image' | 'pdf';
}

interface ActivityBottomSheetProps {
  sheetRef: React.RefObject<BottomSheet | null>;
  tripId: string;
  dayId: string;
  mode: 'add' | 'edit';
  activity?: Activity;
  onSuccess?: () => void;
}

const MAX_MEDIA = 10;
const SNAP_POINTS = ['92%'];

export default function ActivityBottomSheet({
  sheetRef,
  tripId,
  dayId,
  mode,
  activity,
  onSuccess,
}: ActivityBottomSheetProps) {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const insets = useSafeAreaInsets();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [pendingMedia, setPendingMedia] = useState<PendingMedia[]>([]);

  const form = useForm<ActivityForm>({
    resolver: zodResolver(activitySchema),
    defaultValues: {
      title: activity?.title ?? '',
      start_time: activity?.start_time ?? '',
      icon: activity?.icon ?? ActivityIcon.Other,
      location_name: activity?.location_name ?? '',
      place_id: activity?.place_id ?? '',
      latitude: activity?.latitude ?? undefined,
      longitude: activity?.longitude ?? undefined,
      description: activity?.description ?? '',
      links: activity?.links?.map((l) => ({ title: l.title, url: l.url })) ?? [],
    },
  });

  const {
    fields: linkFields,
    append: appendLink,
    remove: removeLink,
  } = useFieldArray({ control: form.control, name: 'links' });

  useEffect(() => {
    form.reset({
      title: activity?.title ?? '',
      start_time: activity?.start_time ?? '',
      icon: activity?.icon ?? ActivityIcon.Other,
      location_name: activity?.location_name ?? '',
      place_id: activity?.place_id ?? '',
      latitude: activity?.latitude ?? undefined,
      longitude: activity?.longitude ?? undefined,
      description: activity?.description ?? '',
      links: activity?.links?.map((l) => ({ title: l.title, url: l.url })) ?? [],
    });
    setPendingMedia([]);
  }, [activity?.id, mode]);

  const handleClose = useCallback(() => {
    sheetRef.current?.close();
    setTimeout(() => {
      form.reset();
      setPendingMedia([]);
    }, 300);
  }, []);

  const handleTimeChange = (_event: DateTimePickerEvent, selected?: Date) => {
    if (Platform.OS === 'android') setShowTimePicker(false);
    if (selected) {
      form.setValue('start_time', dayjs(selected).format('HH:mm:ss'), {
        shouldValidate: true,
      });
    }
  };

  const handlePickImage = async () => {
    const existing = (activity?.media?.length ?? 0) + pendingMedia.length;
    if (existing >= MAX_MEDIA) {
      Alert.alert('Limit reached', `Maximum ${MAX_MEDIA} media files per activity.`);
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.85,
      allowsMultipleSelection: true,
    });
    if (!result.canceled) {
      const available = MAX_MEDIA - existing;
      const selected = result.assets.slice(0, available).map<PendingMedia>((a) => ({
        uri: a.uri,
        fileName: a.fileName ?? `photo_${Date.now()}.jpg`,
        mimeType: a.mimeType ?? 'image/jpeg',
        type: 'image',
      }));
      setPendingMedia((prev) => [...prev, ...selected]);
    }
  };

  const handlePickPdf = async () => {
    const existing = (activity?.media?.length ?? 0) + pendingMedia.length;
    if (existing >= MAX_MEDIA) {
      Alert.alert('Limit reached', `Maximum ${MAX_MEDIA} media files per activity.`);
      return;
    }
    const result = await DocumentPicker.getDocumentAsync({
      type: 'application/pdf',
      copyToCacheDirectory: true,
    });
    if (!result.canceled && result.assets?.length) {
      const asset = result.assets[0];
      setPendingMedia((prev) => [
        ...prev,
        {
          uri: asset.uri,
          fileName: asset.name ?? `doc_${Date.now()}.pdf`,
          mimeType: 'application/pdf',
          type: 'pdf',
        },
      ]);
    }
  };

  const onSubmit = form.handleSubmit(async (data) => {
    setIsSubmitting(true);
    try {
      const activityPayload: Partial<Activity> = {
        trip_id: tripId,
        day_id: dayId,
        title: data.title,
        start_time: data.start_time,
        icon: data.icon,
        location_name: data.location_name || null,
        place_id: data.place_id || null,
        latitude: data.latitude ?? null,
        longitude: data.longitude ?? null,
        description: data.description || null,
        created_by: user?.id,
      };

      let activityId: string;

      if (mode === 'add') {
        const created = await createActivity(activityPayload);
        if (!created) throw new Error('Failed to create activity');
        activityId = created.id;
        if (data.links.length) await createLinks(activityId, data.links);
      } else {
        if (!activity) throw new Error('No activity to update');
        await updateActivity(activity.id, activityPayload);
        activityId = activity.id;
        await deleteLinks(activityId);
        if (data.links.length) await createLinks(activityId, data.links);
      }

      for (const media of pendingMedia) {
        try {
          await uploadMedia(activityId, media.uri, media.fileName, media.mimeType);
        } catch (e) {
          Alert.alert(
            'Upload warning',
            `Could not upload ${media.fileName}: ${(e as Error).message}`,
          );
        }
      }

      queryClient.invalidateQueries({ queryKey: ['activities', dayId] });
      handleClose();
      onSuccess?.();
    } catch (e) {
      Alert.alert('Error', (e as Error).message ?? 'Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  });

  const currentTime = form.watch('start_time');
  const timeDisplay = currentTime
    ? dayjs(`2000-01-01T${currentTime}`).format('h:mm A')
    : 'Select time';

  return (
    <BottomSheet
      ref={sheetRef}
      index={-1}
      snapPoints={SNAP_POINTS}
      enablePanDownToClose
      keyboardBehavior="interactive"
      keyboardBlurBehavior="restore"
      onClose={handleClose}
      backgroundStyle={styles.sheetBg}
      handleIndicatorStyle={styles.handle}
    >
      <BottomSheetScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: NAV_TOTAL_HEIGHT + insets.bottom + 16 },
        ]}
        keyboardShouldPersistTaps="always"
      >
        <View style={styles.sheetHeader}>
          <Text style={styles.sheetTitle}>{mode === 'add' ? 'Add Activity' : 'Edit Activity'}</Text>
          <TouchableOpacity onPress={handleClose}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.form}>
          <View style={styles.field}>
            <Text style={styles.label}>Activity name *</Text>
            <Controller
              control={form.control}
              name="title"
              render={({ field: { onChange, value, onBlur } }) => (
                <TextInput
                  style={[styles.input, form.formState.errors.title && styles.inputError]}
                  placeholder="e.g. Eiffel Tower visit"
                  placeholderTextColor={Colors.neutral.placeholder}
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                />
              )}
            />
            {form.formState.errors.title && (
              <Text style={styles.error}>{form.formState.errors.title.message}</Text>
            )}
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Time *</Text>
            <TouchableOpacity
              style={[
                styles.input,
                styles.timeBtn,
                form.formState.errors.start_time && styles.inputError,
              ]}
              onPress={() => setShowTimePicker(true)}
            >
              <Ionicons name="time-outline" size={16} color={Colors.text.tertiary} />
              <Text style={currentTime ? styles.timeBtnValue : styles.timeBtnPlaceholder}>
                {timeDisplay}
              </Text>
            </TouchableOpacity>
            {form.formState.errors.start_time && (
              <Text style={styles.error}>{form.formState.errors.start_time.message}</Text>
            )}
            {showTimePicker && (
              <RNDateTimePicker
                value={currentTime ? dayjs(`2000-01-01T${currentTime}`).toDate() : new Date()}
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
            <Text style={styles.label}>Icon *</Text>
            <Controller
              control={form.control}
              name="icon"
              render={({ field: { onChange, value } }) => (
                <ActivityIconPicker selected={value} onSelect={onChange} />
              )}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Location</Text>
            <Controller
              control={form.control}
              name="location_name"
              render={({ field: { onChange, value } }) => (
                <GooglePlacesAutocomplete
                  placeholder="Search location..."
                  onPress={(data, details) => {
                    onChange(data.description);
                    form.setValue('place_id', data.place_id);
                    if (details?.geometry?.location) {
                      form.setValue('latitude', details.geometry.location.lat);
                      form.setValue('longitude', details.geometry.location.lng);
                    }
                  }}
                  query={{
                    key: process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY,
                    language: 'en',
                  }}
                  fetchDetails
                  styles={{
                    textInput: styles.placesInput,
                    listView: styles.placesList,
                    row: styles.placesRow,
                    description: styles.placesDescription,
                  }}
                  enablePoweredByContainer={false}
                  textInputProps={{
                    placeholderTextColor: Colors.neutral.placeholder,
                    value: value ?? '',
                    onChangeText: onChange,
                  }}
                  listViewDisplayed="auto"
                  keepResultsAfterBlur
                />
              )}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Description</Text>
            <Controller
              control={form.control}
              name="description"
              render={({ field: { onChange, value, onBlur } }) => (
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Add details about this activity..."
                  placeholderTextColor={Colors.neutral.placeholder}
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                />
              )}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Links</Text>
            {linkFields.map((field, index) => (
              <View key={field.id} style={styles.linkRow}>
                <View style={styles.linkInputs}>
                  <Controller
                    control={form.control}
                    name={`links.${index}.title`}
                    render={({ field: { onChange, value } }) => (
                      <TextInput
                        style={[
                          styles.input,
                          styles.linkInput,
                          form.formState.errors.links?.[index]?.title && styles.inputError,
                        ]}
                        placeholder="Label"
                        placeholderTextColor={Colors.neutral.placeholder}
                        value={value}
                        onChangeText={onChange}
                      />
                    )}
                  />
                  <Controller
                    control={form.control}
                    name={`links.${index}.url`}
                    render={({ field: { onChange, value } }) => (
                      <TextInput
                        style={[
                          styles.input,
                          styles.linkInput,
                          form.formState.errors.links?.[index]?.url && styles.inputError,
                        ]}
                        placeholder="https://..."
                        placeholderTextColor={Colors.neutral.placeholder}
                        value={value}
                        onChangeText={onChange}
                        keyboardType="url"
                        autoCapitalize="none"
                      />
                    )}
                  />
                </View>
                <TouchableOpacity style={styles.removeLinkBtn} onPress={() => removeLink(index)}>
                  <Ionicons name="close" size={16} color={Colors.text.secondary} />
                </TouchableOpacity>
              </View>
            ))}
            <TouchableOpacity
              style={styles.addLinkBtn}
              onPress={() => appendLink({ title: '', url: '' })}
            >
              <Ionicons name="add" size={14} color={Colors.primary.coral} />
              <Text style={styles.addLinkText}>Add Link</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>
              Media{' '}
              <Text style={styles.labelMuted}>
                ({(activity?.media?.length ?? 0) + pendingMedia.length}/{MAX_MEDIA})
              </Text>
            </Text>
            <View style={styles.mediaBtns}>
              <TouchableOpacity style={styles.mediaBtn} onPress={handlePickImage}>
                <Ionicons name="image-outline" size={16} color={Colors.text.secondary} />
                <Text style={styles.mediaBtnText}>Add Photo</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.mediaBtn} onPress={handlePickPdf}>
                <Ionicons name="document-outline" size={16} color={Colors.text.secondary} />
                <Text style={styles.mediaBtnText}>Add PDF</Text>
              </TouchableOpacity>
            </View>
            {(pendingMedia.length > 0 ||
              (mode === 'edit' && (activity?.media?.length ?? 0) > 0)) && (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.mediaRow}
              >
                {mode === 'edit' &&
                  activity?.media?.map((m) => (
                    <MediaThumbnail
                      key={m.id}
                      uri={m.url}
                      type={m.type === 'video' ? 'image' : m.type}
                      size={72}
                    />
                  ))}
                {pendingMedia.map((m, i) => (
                  <MediaThumbnail
                    key={`pending-${i}`}
                    uri={m.uri}
                    type={m.type}
                    size={72}
                    onRemove={() => setPendingMedia((prev) => prev.filter((_, idx) => idx !== i))}
                  />
                ))}
              </ScrollView>
            )}
          </View>

          <TouchableOpacity
            style={[styles.submitBtn, isSubmitting && styles.submitBtnDisabled]}
            onPress={onSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.submitBtnText}>
                {mode === 'add' ? 'Add Activity' : 'Save Changes'}
              </Text>
            )}
          </TouchableOpacity>
        </View>
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
  content: { padding: 24 },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  sheetTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text.primary,
  },
  cancelText: {
    fontSize: 15,
    color: Colors.text.secondary,
  },
  form: { gap: 18 },
  field: { gap: 8 },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  labelMuted: {
    fontWeight: '400',
    color: Colors.text.tertiary,
  },
  input: {
    height: 48,
    borderWidth: 1.5,
    borderColor: Colors.neutral.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    fontSize: 15,
    color: Colors.text.primary,
    backgroundColor: Colors.neutral.white,
  },
  inputError: { borderColor: Colors.status.error },
  textArea: {
    height: 88,
    paddingTop: 12,
  },
  timeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  timeBtnValue: {
    fontSize: 15,
    color: Colors.text.primary,
  },
  timeBtnPlaceholder: {
    fontSize: 15,
    color: Colors.neutral.placeholder,
  },
  doneBtn: { alignItems: 'flex-end', paddingVertical: 6 },
  doneBtnText: {
    color: Colors.primary.coral,
    fontWeight: '700',
    fontSize: 15,
  },
  placesInput: {
    height: 48,
    borderWidth: 1.5,
    borderColor: Colors.neutral.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    fontSize: 15,
    color: Colors.text.primary,
    backgroundColor: Colors.neutral.white,
  },
  placesList: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.neutral.border,
    marginTop: 4,
    zIndex: 99,
  },
  placesRow: { paddingHorizontal: 12, paddingVertical: 10 },
  placesDescription: { fontSize: 14, color: Colors.text.primary },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  linkInputs: { flex: 1, gap: 6 },
  linkInput: { height: 44, fontSize: 14 },
  removeLinkBtn: {
    width: 36,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    backgroundColor: Colors.neutral.background,
    borderWidth: 1,
    borderColor: Colors.neutral.border,
  },
  addLinkBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 6,
  },
  addLinkText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.primary.coral,
  },
  mediaBtns: {
    flexDirection: 'row',
    gap: 10,
  },
  mediaBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 44,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: Colors.neutral.border,
    backgroundColor: Colors.neutral.background,
  },
  mediaBtnText: {
    fontSize: 13,
    fontWeight: '500',
    color: Colors.text.secondary,
  },
  mediaRow: {
    gap: 8,
    paddingTop: 4,
  },
  error: { fontSize: 12, color: Colors.status.error },
  submitBtn: {
    height: 52,
    backgroundColor: Colors.primary.coral,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  submitBtnDisabled: { opacity: 0.6 },
  submitBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.neutral.white,
  },
});

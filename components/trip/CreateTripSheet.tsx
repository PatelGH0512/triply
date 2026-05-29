import { useRef, useState, useCallback } from 'react';
import { View, Text, TextInput, ActivityIndicator, StyleSheet, Alert } from 'react-native';
import { TouchableOpacity } from 'react-native-gesture-handler';
import BottomSheet, { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import dayjs from 'dayjs';
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';
import {
  tripStep1Schema,
  tripStep2Schema,
  TripStep1Form,
  TripStep2Form,
} from '@/lib/validations/trip';
import DatePicker from '@/components/ui/DatePicker';
import { useCreateTrip } from '@/hooks/useTrip';
import Colors from '@/constants/colors';

interface CreateTripSheetProps {
  sheetRef: React.RefObject<BottomSheet | null>;
  onCreated: (tripId: string) => void;
}

export default function CreateTripSheet({ sheetRef, onCreated }: CreateTripSheetProps) {
  const snapPoints = ['85%'];
  const [step, setStep] = useState<1 | 2>(1);
  const [step1Data, setStep1Data] = useState<TripStep1Form | null>(null);
  const { mutateAsync: createTrip, isPending } = useCreateTrip();

  const step1Form = useForm<TripStep1Form>({
    resolver: zodResolver(tripStep1Schema),
    defaultValues: { name: '', destinations: [{ name: '' }] },
  });
  const { fields, append, remove } = useFieldArray({
    control: step1Form.control,
    name: 'destinations',
  });

  const step2Form = useForm<TripStep2Form>({
    resolver: zodResolver(tripStep2Schema),
    defaultValues: { start_date: '', end_date: '' },
  });

  const handleClose = useCallback(() => {
    sheetRef.current?.close();
    setTimeout(() => {
      setStep(1);
      step1Form.reset();
      step2Form.reset();
      setStep1Data(null);
    }, 300);
  }, []);

  const onStep1Next = step1Form.handleSubmit((data) => {
    setStep1Data(data);
    setStep(2);
  });

  const onStep2Submit = step2Form.handleSubmit(async (data) => {
    if (!step1Data) return;
    const trip = await createTrip({
      name: step1Data.name,
      destinations: step1Data.destinations,
      start_date: data.start_date,
      end_date: data.end_date,
    });
    if (trip) {
      handleClose();
      onCreated(trip.id);
    } else {
      Alert.alert('Error', 'Failed to create trip. Please try again.');
    }
  });

  const startDate = step2Form.watch('start_date');

  return (
    <BottomSheet
      ref={sheetRef}
      index={-1}
      snapPoints={snapPoints}
      enablePanDownToClose
      keyboardBehavior="interactive"
      keyboardBlurBehavior="restore"
      onClose={handleClose}
      backgroundStyle={styles.sheetBg}
      handleIndicatorStyle={styles.handle}
    >
      <BottomSheetScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="always"
      >
        <View style={styles.sheetHeader}>
          <Text style={styles.sheetTitle}>{step === 1 ? 'New Trip' : 'Pick Dates'}</Text>
          <View style={styles.stepIndicator}>
            <View style={[styles.stepDot, step === 1 && styles.stepDotActive]} />
            <View style={[styles.stepDot, step === 2 && styles.stepDotActive]} />
          </View>
          <TouchableOpacity onPress={handleClose}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>

        {step === 1 && (
          <View style={styles.stepContainer}>
            <View style={styles.field}>
              <Text style={styles.label}>Trip name</Text>
              <Controller
                control={step1Form.control}
                name="name"
                render={({ field: { onChange, value, onBlur } }) => (
                  <TextInput
                    style={[styles.input, step1Form.formState.errors.name && styles.inputError]}
                    placeholder="e.g. Summer Bali Trip"
                    placeholderTextColor={Colors.neutral.placeholder}
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                  />
                )}
              />
              {step1Form.formState.errors.name && (
                <Text style={styles.error}>{step1Form.formState.errors.name.message}</Text>
              )}
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Destinations</Text>
              {fields.map((field, index) => (
                <View key={field.id} style={styles.destinationRow}>
                  <View style={styles.destinationInput}>
                    <GooglePlacesAutocomplete
                      placeholder={`Destination ${index + 1}`}
                      onPress={(data, details) => {
                        step1Form.setValue(`destinations.${index}.name`, data.description);
                        step1Form.setValue(`destinations.${index}.place_id`, data.place_id);
                        if (details?.geometry?.location) {
                          step1Form.setValue(
                            `destinations.${index}.latitude`,
                            details.geometry.location.lat,
                          );
                          step1Form.setValue(
                            `destinations.${index}.longitude`,
                            details.geometry.location.lng,
                          );
                        }
                      }}
                      query={{
                        key: process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY,
                        language: 'en',
                        types: '(cities)',
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
                        onChangeText: (text) => {
                          step1Form.setValue(`destinations.${index}.name`, text);
                        },
                      }}
                    />
                  </View>
                  {fields.length > 1 && (
                    <TouchableOpacity style={styles.removeBtn} onPress={() => remove(index)}>
                      <Text style={styles.removeBtnText}>✕</Text>
                    </TouchableOpacity>
                  )}
                </View>
              ))}
              {step1Form.formState.errors.destinations && (
                <Text style={styles.error}>{step1Form.formState.errors.destinations.message}</Text>
              )}
              <TouchableOpacity style={styles.addDestBtn} onPress={() => append({ name: '' })}>
                <Text style={styles.addDestText}>+ Add another destination</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.primaryBtn} onPress={onStep1Next}>
              <Text style={styles.primaryBtnText}>Next →</Text>
            </TouchableOpacity>
          </View>
        )}

        {step === 2 && (
          <View style={styles.stepContainer}>
            <Controller
              control={step2Form.control}
              name="start_date"
              render={({ field: { onChange, value } }) => (
                <DatePicker
                  label="Start date"
                  value={value}
                  onChange={onChange}
                  minimumDate={new Date()}
                  error={step2Form.formState.errors.start_date?.message}
                />
              )}
            />

            <Controller
              control={step2Form.control}
              name="end_date"
              render={({ field: { onChange, value } }) => (
                <DatePicker
                  label="End date"
                  value={value}
                  onChange={onChange}
                  minimumDate={startDate ? new Date(startDate) : new Date()}
                  error={step2Form.formState.errors.end_date?.message}
                />
              )}
            />

            <View style={styles.btnRow}>
              <TouchableOpacity style={styles.backBtn} onPress={() => setStep(1)}>
                <Text style={styles.backBtnText}>← Back</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.primaryBtn, styles.primaryBtnFlex, isPending && styles.btnDisabled]}
                onPress={onStep2Submit}
                disabled={isPending}
              >
                {isPending ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.primaryBtnText}>Create Trip</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
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
  content: { padding: 24, paddingBottom: 60 },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 28,
  },
  sheetTitle: { fontSize: 20, fontWeight: '700', color: Colors.text.primary },
  stepIndicator: { flexDirection: 'row', gap: 6 },
  stepDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.neutral.border },
  stepDotActive: { backgroundColor: Colors.primary.coral },
  cancelText: { fontSize: 15, color: Colors.text.secondary },
  stepContainer: { gap: 20 },
  field: { gap: 8 },
  label: { fontSize: 14, fontWeight: '600', color: Colors.text.primary },
  input: {
    height: 52,
    borderWidth: 1.5,
    borderColor: Colors.neutral.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    color: Colors.text.primary,
    backgroundColor: Colors.neutral.white,
  },
  inputError: { borderColor: Colors.status.error },
  error: { fontSize: 12, color: Colors.status.error },
  destinationRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 8 },
  destinationInput: { flex: 1 },
  placesInput: {
    height: 52,
    borderWidth: 1.5,
    borderColor: Colors.neutral.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    color: Colors.text.primary,
    backgroundColor: Colors.neutral.white,
  },
  placesList: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.neutral.border,
    marginTop: 4,
  },
  placesRow: { paddingHorizontal: 12, paddingVertical: 10 },
  placesDescription: { fontSize: 14, color: Colors.text.primary },
  removeBtn: {
    width: 40,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    backgroundColor: Colors.status.errorLight,
    marginTop: 0,
  },
  removeBtnText: { color: Colors.status.error, fontSize: 16, fontWeight: '700' },
  addDestBtn: { paddingVertical: 8 },
  addDestText: { color: Colors.primary.coral, fontWeight: '600', fontSize: 14 },
  btnRow: { flexDirection: 'row', gap: 12, marginTop: 8 },
  backBtn: {
    height: 52,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: Colors.neutral.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backBtnText: { fontSize: 15, color: Colors.text.secondary, fontWeight: '600' },
  primaryBtn: {
    height: 52,
    backgroundColor: Colors.primary.coral,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnFlex: { flex: 1 },
  btnDisabled: { opacity: 0.6 },
  primaryBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});

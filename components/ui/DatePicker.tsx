import { useState } from 'react';
import { View, Text, Platform, StyleSheet } from 'react-native';
import { TouchableOpacity } from 'react-native-gesture-handler';
import RNDateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import dayjs from 'dayjs';
import Colors from '@/constants/colors';

interface DatePickerProps {
  label: string;
  value: string;
  onChange: (date: string) => void;
  minimumDate?: Date;
  error?: string;
}

export default function DatePicker({
  label,
  value,
  onChange,
  minimumDate,
  error,
}: DatePickerProps) {
  const [show, setShow] = useState(false);
  const date = value ? new Date(value) : new Date();

  const handleChange = (_event: DateTimePickerEvent, selected?: Date) => {
    if (Platform.OS === 'android') setShow(false);
    if (selected) onChange(dayjs(selected).format('YYYY-MM-DD'));
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <TouchableOpacity
        style={[styles.button, error && styles.buttonError]}
        onPress={() => setShow(true)}
      >
        <Text style={value ? styles.valueText : styles.placeholder}>
          {value ? dayjs(value).format('MMM D, YYYY') : 'Select date'}
        </Text>
      </TouchableOpacity>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {show && (
        <RNDateTimePicker
          value={date}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          minimumDate={minimumDate}
          onChange={handleChange}
          onTouchCancel={() => setShow(false)}
        />
      )}
      {show && Platform.OS === 'ios' && (
        <TouchableOpacity style={styles.doneBtn} onPress={() => setShow(false)}>
          <Text style={styles.doneBtnText}>Done</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 6 },
  label: { fontSize: 14, fontWeight: '600', color: Colors.text.primary },
  button: {
    height: 52,
    borderWidth: 1.5,
    borderColor: Colors.neutral.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    justifyContent: 'center',
    backgroundColor: Colors.neutral.white,
  },
  buttonError: { borderColor: Colors.status.error },
  valueText: { fontSize: 16, color: Colors.text.primary },
  placeholder: { fontSize: 16, color: Colors.neutral.placeholder },
  error: { fontSize: 12, color: Colors.status.error },
  doneBtn: { alignItems: 'flex-end', paddingVertical: 8 },
  doneBtnText: { color: Colors.primary.coral, fontWeight: '700', fontSize: 15 },
});

import React, { useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import BottomSheet, {
  BottomSheetView,
  BottomSheetBackdrop,
  BottomSheetBackdropProps,
} from '@gorhom/bottom-sheet';
import { colors, typography, spacing, radius, shadows } from '@/constants/tokens';
import dayjs from 'dayjs';

interface QuickPromptSheetProps {
  sheetRef: React.RefObject<BottomSheet | null>;
  destination: string;
  tripStartDate: string;
  nextEmptyDayNumber: number;
  onSelectPrompt: (prompt: string) => void;
}

export default function QuickPromptSheet({
  sheetRef,
  destination,
  tripStartDate,
  nextEmptyDayNumber,
  onSelectPrompt,
}: QuickPromptSheetProps) {
  const month = dayjs(tripStartDate).format('MMMM');

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} opacity={0.35} />
    ),
    [],
  );

  const prompts = [
    `What's the best time to visit ${destination}?`,
    `Suggest a Day ${nextEmptyDayNumber} itinerary for ${destination}`,
    `What currency is used in ${destination}?`,
    `What should we pack for ${destination} in ${month}?`,
    `Are there any cultural rules we should know in ${destination}?`,
    `What's the average cost of a meal in ${destination}?`,
    `Suggest budget-friendly activities in ${destination}`,
    `What are the must-see spots in ${destination}?`,
    `How do we get from the airport to the city in ${destination}?`,
    `What's the weather like in ${destination} in ${month}?`,
  ];

  const handlePress = useCallback(
    (prompt: string) => {
      sheetRef.current?.close();
      onSelectPrompt(prompt);
    },
    [sheetRef, onSelectPrompt],
  );

  return (
    <BottomSheet
      ref={sheetRef}
      index={-1}
      snapPoints={['60%']}
      enablePanDownToClose
      backdropComponent={renderBackdrop}
      backgroundStyle={styles.sheetBg}
      handleIndicatorStyle={styles.handle}
    >
      <BottomSheetView style={styles.content}>
        <Text style={styles.title}>Suggested questions</Text>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.listContent}>
          {prompts.map((prompt, index) => (
            <TouchableOpacity
              key={index}
              style={styles.promptRow}
              activeOpacity={0.7}
              onPress={() => handlePress(prompt)}
            >
              <Text style={styles.promptText}>{prompt}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </BottomSheetView>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  sheetBg: {
    backgroundColor: colors.neutral[0],
    borderRadius: 24,
    ...shadows.lg,
  },
  handle: {
    backgroundColor: colors.neutral[300],
    width: 36,
  },
  content: {
    flex: 1,
    paddingTop: spacing[2],
  },
  title: {
    fontSize: typography.sizes.md,
    fontFamily: typography.fonts.semibold,
    color: colors.neutral[800],
    paddingHorizontal: spacing[4],
    paddingBottom: spacing[3],
  },
  listContent: {
    paddingHorizontal: spacing[4],
    paddingBottom: spacing[8],
    gap: spacing[1],
  },
  promptRow: {
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[3],
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.neutral[100],
    backgroundColor: colors.neutral[50],
  },
  promptText: {
    fontSize: typography.sizes.base,
    fontFamily: typography.fonts.regular,
    color: colors.neutral[700],
    lineHeight: typography.sizes.base * 1.5,
  },
});

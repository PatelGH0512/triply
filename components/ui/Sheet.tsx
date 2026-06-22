import { forwardRef, useCallback } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import BottomSheet, {
  BottomSheetBackdrop,
  BottomSheetBackdropProps,
  BottomSheetScrollView,
  BottomSheetView,
} from '@gorhom/bottom-sheet';
import Animated, { FadeIn } from 'react-native-reanimated';
import { colors, radius, shadows, typography } from '@/constants/tokens';

export type SheetSize = 'small' | 'medium' | 'large' | 'full';

const SNAP_POINTS: Record<SheetSize, string[]> = {
  small:  ['45%'],
  medium: ['60%'],
  large:  ['85%', '95%'],
  full:   ['95%'],
};

interface SheetProps {
  title?: string;
  size?: SheetSize;
  snapPoints?: string[];
  onClose?: () => void;
  children: React.ReactNode;
  scrollable?: boolean;
}

export const Sheet = forwardRef<BottomSheet, SheetProps>(function Sheet(
  { title, size = 'medium', snapPoints, onClose, children, scrollable = false },
  ref,
) {
  const points = snapPoints ?? SNAP_POINTS[size];

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} opacity={0.35} />
    ),
    [],
  );

  const ContentWrapper = scrollable ? BottomSheetScrollView : BottomSheetView;

  return (
    <BottomSheet
      ref={ref}
      index={-1}
      snapPoints={points}
      enablePanDownToClose
      onClose={onClose}
      backdropComponent={renderBackdrop}
      handleIndicatorStyle={styles.handle}
      backgroundStyle={styles.background}
      style={styles.sheet}
    >
      <ContentWrapper style={styles.content}>
        <Animated.View entering={FadeIn.duration(200)}>
          {title || onClose ? (
            <View style={styles.header}>
              <Text style={styles.title}>{title ?? ''}</Text>
              {onClose ? (
                <TouchableOpacity onPress={onClose} hitSlop={12} style={styles.closeBtn}>
                  <Text style={styles.closeText}>✕</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          ) : null}
          {children}
        </Animated.View>
      </ContentWrapper>
    </BottomSheet>
  );
});

const styles = StyleSheet.create({
  sheet: {
    borderTopLeftRadius: radius.xxl,
    borderTopRightRadius: radius.xxl,
    ...shadows.lg,
  },
  background: {
    backgroundColor: 'rgba(250, 249, 247, 0.97)',
    borderTopLeftRadius: radius.xxl,
    borderTopRightRadius: radius.xxl,
  },
  handle: {
    width: 36,
    height: 4,
    backgroundColor: colors.neutral[300],
    borderRadius: radius.full,
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    position: 'relative',
  },
  title: {
    fontSize: typography.sizes.md,
    fontFamily: typography.fonts.semibold,
    color: colors.neutral[800],
    textAlign: 'center',
  },
  closeBtn: {
    position: 'absolute',
    right: 20,
    top: 12,
    width: 28,
    height: 28,
    borderRadius: radius.full,
    backgroundColor: colors.neutral[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeText: {
    fontSize: 12,
    color: colors.neutral[500],
    fontFamily: typography.fonts.medium,
  },
});

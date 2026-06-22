import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
} from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, radius, shadows, typography } from '@/constants/tokens';

export type ToastVariant = 'default' | 'success' | 'error';

interface ToastConfig {
  message: string;
  variant?: ToastVariant;
}

interface ToastContextValue {
  showToast: (config: ToastConfig) => void;
}

const ToastContext = createContext<ToastContextValue>({ showToast: () => {} });

export function useToast() {
  return useContext(ToastContext);
}

const VARIANT_BG: Record<ToastVariant, string> = {
  default: colors.neutral[800],
  success: colors.success,
  error:   colors.error,
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const insets = useSafeAreaInsets();
  const [toast, setToast] = useState<ToastConfig | null>(null);
  const translateY = useRef(new Animated.Value(-80)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const hide = useCallback(() => {
    Animated.parallel([
      Animated.timing(translateY, { toValue: -80, duration: 200, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 0, duration: 200, useNativeDriver: true }),
    ]).start(() => setToast(null));
  }, [opacity, translateY]);

  const showToast = useCallback(
    ({ message, variant = 'default' }: ToastConfig) => {
      if (timer.current) clearTimeout(timer.current);
      setToast({ message, variant });
      translateY.setValue(-80);
      opacity.setValue(0);

      Animated.parallel([
        Animated.timing(translateY, { toValue: 0, duration: 200, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
      ]).start();

      timer.current = setTimeout(hide, 3000);
    },
    [hide, opacity, translateY],
  );

  const bg = toast ? VARIANT_BG[toast.variant ?? 'default'] : colors.neutral[800];

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {toast && (
        <Animated.View
          style={[
            styles.container,
            { top: insets.top + 12, backgroundColor: bg },
            { transform: [{ translateY }], opacity },
            shadows.md,
          ]}
          pointerEvents="none"
        >
          <Text style={styles.message}>{toast.message}</Text>
        </Animated.View>
      )}
    </ToastContext.Provider>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 20,
    right: 20,
    zIndex: 9999,
    borderRadius: radius.full,
    paddingHorizontal: 20,
    paddingVertical: 12,
    alignItems: 'center',
  },
  message: {
    color: colors.neutral[0],
    fontSize: typography.sizes.sm,
    fontFamily: typography.fonts.medium,
    textAlign: 'center',
  },
});

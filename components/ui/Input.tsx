import { useRef, useState } from 'react';
import {
  Animated,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  TouchableWithoutFeedback,
  View,
  ViewStyle,
} from 'react-native';
import { colors, radius, shadows, typography } from '@/constants/tokens';

interface InputProps extends Omit<TextInputProps, 'style'> {
  label?: string;
  error?: string;
  containerStyle?: ViewStyle;
  multiline?: boolean;
}

export function Input({
  label,
  error,
  containerStyle,
  multiline = false,
  value,
  onFocus,
  onBlur,
  editable = true,
  ...rest
}: InputProps) {
  const [focused, setFocused] = useState(false);
  const labelAnim = useRef(new Animated.Value(value ? 1 : 0)).current;
  const inputRef = useRef<TextInput>(null);

  const hasValue = !!value;

  const handleFocus = (e: any) => {
    setFocused(true);
    Animated.timing(labelAnim, {
      toValue: 1,
      duration: 150,
      useNativeDriver: false,
    }).start();
    onFocus?.(e);
  };

  const handleBlur = (e: any) => {
    setFocused(false);
    if (!hasValue) {
      Animated.timing(labelAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: false,
      }).start();
    }
    onBlur?.(e);
  };

  const labelTop = labelAnim.interpolate({ inputRange: [0, 1], outputRange: [16, 6] });
  const labelSize = labelAnim.interpolate({ inputRange: [0, 1], outputRange: [15, 11] });
  const labelColor = labelAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [colors.neutral[400], focused ? colors.primary[400] : colors.neutral[600]],
  });

  const borderColor = error
    ? colors.error
    : focused
    ? colors.primary[400]
    : colors.neutral[200];

  const focusGlow = focused && !error
    ? {
        shadowColor: colors.primary[400],
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.18,
        shadowRadius: 8,
        elevation: 3,
      }
    : {};

  const height = multiline ? undefined : 52;
  const minHeight = multiline ? 100 : undefined;

  return (
    <View style={containerStyle}>
      <TouchableWithoutFeedback onPress={() => inputRef.current?.focus()}>
        <View
          style={[
            styles.container,
            { borderColor, height, minHeight },
            !editable && styles.disabled,
            focusGlow,
          ]}
        >
          {label ? (
            <Animated.Text
              style={[
                styles.label,
                { top: labelTop, fontSize: labelSize, color: labelColor },
              ]}
            >
              {label}
            </Animated.Text>
          ) : null}
          <TextInput
            ref={inputRef}
            value={value}
            editable={editable}
            onFocus={handleFocus}
            onBlur={handleBlur}
            multiline={multiline}
            textAlignVertical={multiline ? 'top' : 'center'}
            style={[
              styles.input,
              label ? styles.inputWithLabel : undefined,
              multiline && styles.inputMultiline,
            ]}
            placeholderTextColor={colors.neutral[400]}
            {...rest}
          />
        </View>
      </TouchableWithoutFeedback>
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.neutral[0],
    borderWidth: 1.5,
    borderRadius: radius.lg,
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  disabled: {
    backgroundColor: colors.neutral[100],
    opacity: 0.5,
  },
  label: {
    position: 'absolute',
    left: 16,
    fontFamily: typography.fonts.semibold,
    zIndex: 1,
  },
  input: {
    fontSize: typography.sizes.base,
    fontFamily: typography.fonts.regular,
    color: colors.neutral[800],
    paddingTop: 18,
    paddingBottom: 6,
  },
  inputWithLabel: {
    paddingTop: 22,
    paddingBottom: 6,
  },
  inputMultiline: {
    paddingTop: 24,
    paddingBottom: 10,
  },
  error: {
    marginTop: 4,
    fontSize: typography.sizes.xs,
    fontFamily: typography.fonts.regular,
    color: colors.error,
    marginLeft: 4,
  },
});

import React, { useState } from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  Pressable,
  Platform,
  type TextInputContentSizeChangeEvent,
} from 'react-native';
import { useResponsive } from '@/helpers/hooks/use-responsive';
import { Feather, Ionicons } from '@expo/vector-icons';
import { SymbolView } from 'expo-symbols';
import { colors, radius, typography } from '@/constants/tokens';

const MAX_LINES = 5;

interface InputBarProps {
  onSend: (message: string) => void;
  onPressPlus?: () => void;
  disabled?: boolean;
  disabledPlaceholder?: string;
  value?: string;
  onChangeValue?: (v: string) => void;
}

export const InputBar: React.FC<InputBarProps> = ({
  onSend,
  onPressPlus,
  disabled = false,
  disabledPlaceholder,
  value: controlledValue,
  onChangeValue,
}: InputBarProps) => {
  const screen = useResponsive();

  const [internalValue, setInternalValue] = useState<string>('');
  const [inputHeight, setInputHeight] = useState<number>(0);

  const value = controlledValue !== undefined ? controlledValue : internalValue;
  const setValue = onChangeValue ?? setInternalValue;

  const iconSize = screen.rf(20);
  const circleSize = screen.rf(36);

  const lineHeight = screen.rf(22);
  const minHeight = lineHeight;
  const maxHeight = lineHeight * MAX_LINES;

  const handleContentSizeChange = (e: TextInputContentSizeChangeEvent) => {
    const newHeight = e.nativeEvent.contentSize.height;
    setInputHeight(Math.min(newHeight, maxHeight));
  };

  const handleOnPress = () => {
    if (!value.trim() || disabled) return;
    onSend(value);
    setValue('');
  };

  const placeholder = disabled && disabledPlaceholder ? disabledPlaceholder : 'Ask me anything...';

  return (
    <View style={styles.wrapper}>
      <View style={styles.container}>
        <TextInput
          value={value}
          onChangeText={setValue}
          placeholder={placeholder}
          placeholderTextColor={colors.neutral[400]}
          multiline
          editable={!disabled}
          scrollEnabled={inputHeight >= maxHeight}
          onContentSizeChange={handleContentSizeChange}
          style={[
            styles.input,
            {
              fontSize: screen.rf(15),
              lineHeight,
              minHeight,
              maxHeight,
            },
            disabled && styles.inputDisabled,
          ]}
          selectionColor={colors.primary[400]}
          textAlignVertical="top"
        />

        <View style={styles.bottomRow}>
          <View style={styles.leftIcons}>
            <Pressable
              onPress={disabled ? undefined : onPressPlus}
              style={({ pressed }) => [{ opacity: pressed && !disabled ? 0.6 : 1 }]}
            >
              <Feather
                name="plus"
                size={iconSize}
                color={disabled ? colors.neutral[300] : colors.neutral[500]}
              />
            </Pressable>
          </View>

          <View style={styles.rightIcons}>
            {value.length === 0 ? (
              <View style={[styles.sendCircle, styles.sendCircleInactive]}>
                {Platform.OS === 'ios' ? (
                  <SymbolView name="arrow.up" tintColor={colors.neutral[300]} size={iconSize - 4} />
                ) : (
                  <Ionicons name="arrow-up" size={iconSize - 4} color={colors.neutral[300]} />
                )}
              </View>
            ) : (
              <Pressable
                onPress={handleOnPress}
                disabled={disabled}
                style={({ pressed }) => [
                  styles.sendCircle,
                  styles.sendCircleActive,
                  { opacity: pressed ? 0.8 : 1 },
                ]}
              >
                {Platform.OS === 'ios' ? (
                  <SymbolView name="arrow.up" tintColor={colors.neutral[0]} size={iconSize - 4} />
                ) : (
                  <Ionicons name="arrow-up" size={iconSize - 4} color={colors.neutral[0]} />
                )}
              </Pressable>
            )}
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
  },

  container: {
    backgroundColor: colors.neutral[0],
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.neutral[200],
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 12,
    flexDirection: 'column',
    shadowColor: colors.neutral[900],
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },

  input: {
    color: colors.neutral[800],
    width: '100%',
    fontFamily: typography.fonts.regular,
  },

  inputDisabled: {
    color: colors.neutral[400],
  },

  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: 10,
  },

  leftIcons: {
    flexDirection: 'row',
    gap: 16,
    alignItems: 'center',
  },

  rightIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },

  sendCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },

  sendCircleActive: {
    backgroundColor: colors.primary[400],
  },

  sendCircleInactive: {
    backgroundColor: colors.neutral[100],
  },
});

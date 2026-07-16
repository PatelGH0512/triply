import type { StyleProp, TextStyle, ViewStyle } from "react-native";

export interface AIHeaderProps {
  destination: string;
  dateRange: string;
}

export interface TripChipOption {
  emoji: string;
  label: string;
  prompt: string;
}

interface IChipOption {
  text: string;
  icon: React.ReactNode;
  onPress?: () => void;
}

interface IChipGrid {
  options: IChipOption[];
  columns?: number;
  gap?: number;
  containerStyle?: StyleProp<ViewStyle>;
  chipStyle?: StyleProp<ViewStyle>;
  labelStyle?: StyleProp<TextStyle>;
  iconStyle?: StyleProp<ViewStyle>;
}

export type { IChipOption, IChipGrid };

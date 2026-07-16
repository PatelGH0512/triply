import { useWindowDimensions } from 'react-native';

type ScreenSize = 'nano' | 'compact' | 'medium' | 'expanded';

interface ResponsiveValues<T> {
  nano?: T;
  compact?: T;
  medium?: T;
  expanded?: T;
}

function getScreenSize(width: number): ScreenSize {
  if (width < 360) return 'nano';
  if (width < 480) return 'compact';
  if (width < 768) return 'medium';
  return 'expanded';
}

export function useResponsive() {
  const { width, height } = useWindowDimensions();
  const size = getScreenSize(width);
  const scale = width / 375;

  function rf(base: number): number {
    return Math.round(base * Math.min(scale, 1.15));
  }

  function rv<T>(values: ResponsiveValues<T>): T {
    return (values[size] ??
      values.compact ??
      values.medium ??
      values.expanded ??
      values.nano) as T;
  }

  return { rf, rv, width, height, size };
}

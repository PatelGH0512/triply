import { StyleSheet } from 'react-native';
import { Canvas, Rect, Turbulence } from '@shopify/react-native-skia';
import { useWindowDimensions } from 'react-native';

interface GrainOverlayProps {
  opacity?: number;
  frequency?: number;
  octaves?: number;
}

export default function GrainOverlay({
  opacity = 0.07,
  frequency = 0.65,
  octaves = 4,
}: GrainOverlayProps) {
  const { width, height } = useWindowDimensions();

  return (
    <Canvas style={[StyleSheet.absoluteFill, { opacity }]} pointerEvents="none">
      <Rect x={0} y={0} width={width} height={height}>
        <Turbulence
          freqX={frequency}
          freqY={frequency}
          octaves={octaves}
          seed={2}
          fractalNoise
        />
      </Rect>
    </Canvas>
  );
}

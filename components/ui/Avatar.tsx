import { View, Text, Image, StyleSheet } from 'react-native';

const AVATAR_COLORS = [
  '#FF6B6B', '#06D6A0', '#118AB2', '#FFD166',
  '#9B59B6', '#E67E22', '#2ECC71', '#E74C3C',
];

function getColorFromName(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

interface AvatarProps {
  uri?: string | null;
  name?: string | null;
  size?: number;
}

export default function Avatar({ uri, name = '', size = 36 }: AvatarProps) {
  const initials = (name ?? '')
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');
  const bg = getColorFromName(name ?? '');
  const fontSize = size * 0.38;

  if (uri) {
    return (
      <Image
        source={{ uri }}
        style={[styles.base, { width: size, height: size, borderRadius: size / 2 }]}
      />
    );
  }

  return (
    <View
      style={[
        styles.base,
        styles.fallback,
        { width: size, height: size, borderRadius: size / 2, backgroundColor: bg },
      ]}
    >
      <Text style={[styles.initials, { fontSize }]}>{initials || '?'}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: { overflow: 'hidden' },
  fallback: { alignItems: 'center', justifyContent: 'center' },
  initials: { color: '#fff', fontWeight: '700' },
});

import { View, Text, StyleSheet } from 'react-native';
import Avatar from '@/components/ui/Avatar';
import { TripMemberWithUser } from '@/types';
import { colors, typography } from '@/constants/tokens';

interface MemberAvatarStackProps {
  members: TripMemberWithUser[];
  max?: number;
  size?: number;
}

export default function MemberAvatarStack({ members, max = 4, size = 28 }: MemberAvatarStackProps) {
  const visible = members.slice(0, max);
  const overflow = members.length - max;
  const overlap = size * 0.35;

  return (
    <View style={styles.row}>
      {visible.map((member, i) => (
        <View
          key={member.id}
          style={[
            {
              marginLeft: i === 0 ? 0 : -overlap,
              zIndex: visible.length - i,
            },
          ]}
        >
          <Avatar uri={member.users?.avatar_url} name={member.users?.full_name ?? ''} size={size} />
        </View>
      ))}
      {overflow > 0 && (
        <View
          style={[
            styles.overflow,
            { width: size, height: size, borderRadius: size / 2, marginLeft: -overlap },
          ]}
        >
          <Text style={[styles.overflowText, { fontSize: size * 0.35 }]}>+{overflow}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  overflow: {
    backgroundColor: colors.neutral[200],
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: colors.neutral[0],
  },
  overflowText: {
    color: colors.neutral[600],
    fontFamily: typography.fonts.bold,
  },
});

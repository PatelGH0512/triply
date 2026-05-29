import { View, Text, StyleSheet } from 'react-native';
import Avatar from '@/components/ui/Avatar';
import { TripMemberWithUser } from '@/types';
import Colors from '@/constants/colors';

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
            styles.avatarWrap,
            {
              marginLeft: i === 0 ? 0 : -overlap,
              zIndex: visible.length - i,
              borderRadius: size / 2,
            },
          ]}
        >
          <Avatar
            uri={member.users?.avatar_url}
            name={member.users?.full_name ?? ''}
            size={size}
          />
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
  avatarWrap: { borderWidth: 2, borderColor: Colors.neutral.white },
  overflow: {
    backgroundColor: Colors.neutral.border,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.neutral.white,
  },
  overflowText: { color: Colors.text.secondary, fontWeight: '700' },
});

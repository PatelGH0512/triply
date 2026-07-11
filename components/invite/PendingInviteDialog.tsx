import { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import dayjs from 'dayjs';
import Avatar from '@/components/ui/Avatar';
import MemberAvatarStack from '@/components/trip/MemberAvatarStack';
import { usePendingInvites, useAcceptInvite, useDeclineInvite } from '@/hooks/useInvites';
import { useAuthStore } from '@/store/authStore';
import Colors from '@/constants/colors';

export default function PendingInviteDialog() {
  const router = useRouter();
  const { user, session } = useAuthStore();
  const email = user?.email ?? session?.user?.email ?? null;
  const userId = session?.user?.id ?? '';

  const { data: invites = [] } = usePendingInvites(email);
  const { mutateAsync: acceptInvite, isPending: isAccepting } = useAcceptInvite();
  const { mutateAsync: declineInvite, isPending: isDeclining } = useDeclineInvite();

  const [index, setIndex] = useState(0);

  const invite = invites[index];
  if (!invite) return null;

  const trip = invite.trip;
  const inviter = invite.inviter;
  const destinations = trip?.trip_destinations ?? [];
  const members = trip?.trip_members ?? [];

  const dateRange =
    trip?.start_date && trip?.end_date
      ? `${dayjs(trip.start_date).format('MMM D')} – ${dayjs(trip.end_date).format('MMM D, YYYY')}`
      : null;
  const destinationNames = destinations.map((d) => d.name).join(', ');

  const advance = () => {
    if (index < invites.length - 1) {
      setIndex((i) => i + 1);
    } else {
      setIndex(0);
    }
  };

  const handleJoin = async () => {
    const result = await acceptInvite({ inviteId: invite.id, userId });
    if (result.success && result.tripId) {
      advance();
      router.push(`/trip/${result.tripId}` as any);
    } else if (result.error === 'already_member' && result.tripId) {
      advance();
      router.push(`/trip/${result.tripId}` as any);
    } else {
      advance();
    }
  };

  const handleDiscard = async () => {
    await declineInvite({ inviteId: invite.id });
    advance();
  };

  const busy = isAccepting || isDeclining;

  return (
    <Modal transparent visible animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.card}>
          <View style={styles.inviterRow}>
            <Avatar uri={inviter?.avatar_url ?? null} name={inviter?.full_name ?? ''} size={44} />
            <View style={styles.inviterInfo}>
              <Text style={styles.inviterLabel}>Trip invitation</Text>
              <Text style={styles.inviterName}>
                {inviter?.full_name ?? 'Someone'} invited you
              </Text>
            </View>
          </View>

          <Text style={styles.headline}>
            Join <Text style={styles.tripName}>{trip?.name}</Text>
          </Text>

          {destinationNames ? (
            <View style={styles.detailRow}>
              <Text style={styles.detailIcon}>📍</Text>
              <Text style={styles.detailText}>{destinationNames}</Text>
            </View>
          ) : null}

          {dateRange ? (
            <View style={styles.detailRow}>
              <Text style={styles.detailIcon}>📅</Text>
              <Text style={styles.detailText}>{dateRange}</Text>
            </View>
          ) : null}

          {members.length > 0 && (
            <View style={styles.membersRow}>
              <MemberAvatarStack members={members} max={5} size={30} />
              <Text style={styles.membersLabel}>
                {members.length} member{members.length !== 1 ? 's' : ''} going
              </Text>
            </View>
          )}

          {invites.length > 1 && (
            <Text style={styles.counter}>
              {index + 1} of {invites.length} invitations
            </Text>
          )}

          <TouchableOpacity
            style={[styles.joinBtn, busy && styles.btnDisabled]}
            onPress={handleJoin}
            disabled={busy}
          >
            {isAccepting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.joinBtnText}>Join Trip</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.discardBtn}
            onPress={handleDiscard}
            disabled={busy}
          >
            <Text style={styles.discardBtnText}>Discard</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: Colors.neutral.white,
    borderRadius: 20,
    padding: 24,
    gap: 14,
  },
  inviterRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  inviterInfo: { gap: 2, flex: 1 },
  inviterLabel: {
    fontSize: 11,
    color: Colors.text.tertiary,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  inviterName: { fontSize: 16, fontWeight: '700', color: Colors.text.primary },
  headline: { fontSize: 24, fontWeight: '800', color: Colors.text.primary, lineHeight: 30 },
  tripName: { color: Colors.primary.coral },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  detailIcon: { fontSize: 15 },
  detailText: { fontSize: 15, color: Colors.text.secondary, flex: 1 },
  membersRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 2 },
  membersLabel: { fontSize: 13, color: Colors.text.secondary },
  counter: { fontSize: 12, color: Colors.text.tertiary, textAlign: 'center', marginTop: 2 },
  joinBtn: {
    height: 52,
    backgroundColor: Colors.primary.coral,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
  },
  btnDisabled: { opacity: 0.6 },
  joinBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  discardBtn: { alignItems: 'center', paddingVertical: 10 },
  discardBtnText: { fontSize: 15, color: Colors.text.secondary, fontWeight: '600' },
});

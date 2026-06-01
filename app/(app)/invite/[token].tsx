import { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as SecureStore from 'expo-secure-store';
import dayjs from 'dayjs';
import Avatar from '@/components/ui/Avatar';
import MemberAvatarStack from '@/components/trip/MemberAvatarStack';
import { useInviteByToken, useResolveInvite } from '@/hooks/useInvites';
import { useAuthStore } from '@/store/authStore';
import { INVITE_TOKEN_KEY } from '@/lib/api/invites';
import { InviteStatus } from '@/constants/enums';
import Colors from '@/constants/colors';

export default function InviteLandingScreen() {
  const { token } = useLocalSearchParams<{ token: string }>();
  const router = useRouter();
  const { session } = useAuthStore();
  const userId = session?.user?.id ?? null;

  const { data: invite, isLoading } = useInviteByToken(token);
  const { mutateAsync: resolveInvite, isPending: isResolving } = useResolveInvite();

  const [resolveError, setResolveError] = useState<string | null>(null);
  const [joined, setJoined] = useState(false);

  const handleJoin = async () => {
    setResolveError(null);

    if (!userId) {
      await SecureStore.setItemAsync(INVITE_TOKEN_KEY, token);
      router.replace('/(auth)/login');
      return;
    }

    const result = await resolveInvite({ token, userId });

    if (result.success && result.tripId) {
      setJoined(true);
      router.replace(`/trip/${result.tripId}` as any);
    } else if (result.error === 'already_member') {
      router.replace(`/trip/${invite?.trip_id ?? ''}` as any);
    } else {
      setResolveError(result.error ?? 'Something went wrong.');
    }
  };

  const handleDecline = async () => {
    router.replace('/(app)/home');
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator size="large" color={Colors.primary.coral} />
      </SafeAreaView>
    );
  }

  if (!invite) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.content}>
          <Text style={styles.errorIcon}>🔗</Text>
          <Text style={styles.errorTitle}>Invalid invite</Text>
          <Text style={styles.errorBody}>
            This invite link is not valid or has already been used.
          </Text>
          <TouchableOpacity style={styles.primaryBtn} onPress={() => router.replace('/(app)/home')}>
            <Text style={styles.primaryBtnText}>Go to Home</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const isExpired =
    invite.status === InviteStatus.Expired ||
    (invite.expires_at != null && dayjs(invite.expires_at).isBefore(dayjs()));

  const isAlreadyAccepted = invite.status === InviteStatus.Accepted;

  if (isExpired) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.content}>
          <Text style={styles.errorIcon}>⏰</Text>
          <Text style={styles.errorTitle}>This invite has expired</Text>
          <Text style={styles.errorBody}>
            Ask {invite.inviter?.full_name ?? 'the trip organizer'} to send a new invite.
          </Text>
          <TouchableOpacity style={styles.primaryBtn} onPress={() => router.replace('/(app)/home')}>
            <Text style={styles.primaryBtnText}>Go to Home</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (isAlreadyAccepted) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.content}>
          <Text style={styles.errorIcon}>✅</Text>
          <Text style={styles.errorTitle}>You're already in this trip</Text>
          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={() => router.replace(`/trip/${invite.trip_id}` as any)}
          >
            <Text style={styles.primaryBtnText}>Go to Trip</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const trip = invite.trip;
  const inviter = invite.inviter;
  const destinations = trip?.trip_destinations ?? [];
  const members = trip?.trip_members ?? [];

  const dateRange =
    trip?.start_date && trip?.end_date
      ? `${dayjs(trip.start_date).format('MMM D')} – ${dayjs(trip.end_date).format('MMM D, YYYY')}`
      : null;

  const destinationNames = destinations.map((d) => d.name).join(', ');

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.content}>
        <View style={styles.inviterRow}>
          <Avatar uri={inviter?.avatar_url ?? null} name={inviter?.full_name ?? ''} size={44} />
          <View style={styles.inviterInfo}>
            <Text style={styles.inviterLabel}>Invited by</Text>
            <Text style={styles.inviterName}>{inviter?.full_name ?? 'Someone'}</Text>
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
            <MemberAvatarStack members={members} max={5} size={32} />
            <Text style={styles.membersLabel}>
              {members.length} member{members.length !== 1 ? 's' : ''} going
            </Text>
          </View>
        )}

        {resolveError && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorBannerText}>
              {resolveError === 'expired'
                ? 'This invite has expired.'
                : resolveError === 'already_member'
                  ? "You're already in this trip."
                  : 'Something went wrong. Please try again.'}
            </Text>
          </View>
        )}

        <TouchableOpacity
          style={[styles.primaryBtn, isResolving && styles.btnDisabled]}
          onPress={handleJoin}
          disabled={isResolving}
        >
          {isResolving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.primaryBtnText}>Join Trip</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity style={styles.declineBtn} onPress={handleDecline}>
          <Text style={styles.declineBtnText}>Decline</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.neutral.background },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.neutral.background,
  },
  content: {
    flex: 1,
    padding: 28,
    justifyContent: 'center',
    gap: 16,
  },
  inviterRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8 },
  inviterInfo: { gap: 2 },
  inviterLabel: { fontSize: 12, color: Colors.text.tertiary, fontWeight: '500' },
  inviterName: { fontSize: 16, fontWeight: '700', color: Colors.text.primary },
  headline: { fontSize: 28, fontWeight: '800', color: Colors.text.primary, lineHeight: 34 },
  tripName: { color: Colors.primary.coral },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  detailIcon: { fontSize: 16 },
  detailText: { fontSize: 15, color: Colors.text.secondary },
  membersRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  membersLabel: { fontSize: 13, color: Colors.text.secondary },
  errorBanner: {
    backgroundColor: Colors.status.errorLight,
    borderRadius: 10,
    padding: 12,
  },
  errorBannerText: { fontSize: 14, color: Colors.status.error },
  primaryBtn: {
    height: 52,
    backgroundColor: Colors.primary.coral,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  btnDisabled: { opacity: 0.6 },
  primaryBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  declineBtn: { alignItems: 'center', paddingVertical: 12 },
  declineBtnText: { fontSize: 15, color: Colors.text.secondary },
  errorIcon: { fontSize: 52, textAlign: 'center', marginBottom: 8 },
  errorTitle: { fontSize: 22, fontWeight: '700', color: Colors.text.primary, textAlign: 'center' },
  errorBody: { fontSize: 15, color: Colors.text.secondary, textAlign: 'center', lineHeight: 22 },
});

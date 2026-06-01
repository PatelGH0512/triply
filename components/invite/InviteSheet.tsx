import { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Modal,
} from 'react-native';
import BottomSheet, { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { Ionicons } from '@expo/vector-icons';
import dayjs from 'dayjs';
import Avatar from '@/components/ui/Avatar';
import InviteeRow, { InviteeStatus } from '@/components/invite/InviteeRow';
import { useInvites, useCreateInvite, useResendInvite } from '@/hooks/useInvites';
import { useTripContext } from '@/lib/context/TripContext';
import { useAuthStore } from '@/store/authStore';
import { getTripMembers, transferAdmin } from '@/lib/api/trips';
import { TripMember } from '@/types';
import { MemberRole, InviteStatus } from '@/constants/enums';
import { InviteContactType } from '@/lib/api/invites';
import Colors from '@/constants/colors';

interface InviteeEntry {
  id: string;
  value: string;
  status: InviteeStatus;
}

interface InviteSheetProps {
  sheetRef: React.RefObject<BottomSheet | null>;
}

function detectType(val: string): InviteContactType {
  return val.includes('@') ? 'email' : 'sms';
}

function isValidContact(val: string): boolean {
  const emailReg = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const phoneReg = /^\+?[\d\s\-()]{7,}$/;
  return emailReg.test(val) || phoneReg.test(val.replace(/\s/g, ''));
}

function expiresInHours(expiresAt: string | null): string {
  if (!expiresAt) return '';
  const diff = dayjs(expiresAt).diff(dayjs(), 'hour');
  if (diff <= 0) return 'expired';
  return `${diff}h`;
}

export default function InviteSheet({ sheetRef }: InviteSheetProps) {
  const { trip, isAdmin } = useTripContext();
  const { user } = useAuthStore();

  const [invitees, setInvitees] = useState<InviteeEntry[]>([
    { id: '1', value: '', status: 'idle' },
  ]);
  const [isSending, setIsSending] = useState(false);
  const [members, setMembers] = useState<TripMember[]>([]);
  const [membersLoaded, setMembersLoaded] = useState(false);
  const [transferTargetId, setTransferTargetId] = useState<string | null>(null);
  const [transferConfirm, setTransferConfirm] = useState(false);

  const { data: invites = [] } = useInvites(trip.id);
  const { mutateAsync: createInvite } = useCreateInvite(trip.id);
  const { mutateAsync: resendInvite } = useResendInvite(trip.id);

  const handleOpen = useCallback(async () => {
    if (!membersLoaded) {
      const fetched = await getTripMembers(trip.id);
      setMembers(fetched);
      setMembersLoaded(true);
    }
  }, [membersLoaded, trip.id]);

  const handleClose = useCallback(() => {
    sheetRef.current?.close();
    setTimeout(() => {
      setInvitees([{ id: '1', value: '', status: 'idle' }]);
      setMembersLoaded(false);
    }, 300);
  }, []);

  const addRow = () => {
    setInvitees((prev) => [...prev, { id: String(Date.now()), value: '', status: 'idle' }]);
  };

  const removeRow = (id: string) => {
    setInvitees((prev) => prev.filter((r) => r.id !== id));
  };

  const updateRow = (id: string, value: string) => {
    setInvitees((prev) => prev.map((r) => (r.id === id ? { ...r, value, status: 'idle' } : r)));
  };

  const setRowStatus = (id: string, status: InviteeStatus) => {
    setInvitees((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));
  };

  const handleSendInvites = async () => {
    const filledRows = invitees.filter((r) => r.value.trim().length > 0);
    if (filledRows.length === 0) return;

    const invalidRows = filledRows.filter((r) => !isValidContact(r.value.trim()));
    if (invalidRows.length > 0) {
      Alert.alert('Invalid contact', 'Please check the phone or email format and try again.');
      return;
    }

    setIsSending(true);

    await Promise.all(
      filledRows.map(async (row) => {
        setRowStatus(row.id, 'sending');
        try {
          const contact = row.value.trim();
          const type = detectType(contact);
          const result = await createInvite({ contact, type });
          setRowStatus(row.id, result ? 'sent' : 'failed');
        } catch {
          setRowStatus(row.id, 'failed');
        }
      }),
    );

    setIsSending(false);
  };

  const handleTransferAdmin = async () => {
    if (!transferTargetId || !user) return;
    setTransferConfirm(false);
    const ok = await transferAdmin(trip.id, user.id, transferTargetId);
    if (!ok) {
      Alert.alert('Error', 'Failed to transfer admin. Please try again.');
    } else {
      handleClose();
    }
    setTransferTargetId(null);
  };

  const handleResend = async (inviteId: string) => {
    await resendInvite({
      inviteId,
      inviterName: user?.full_name ?? 'Someone',
      tripName: trip.name,
    });
  };

  const pendingInvites = invites.filter((inv) => inv.status === InviteStatus.Pending);

  return (
    <>
      <BottomSheet
        ref={sheetRef}
        index={-1}
        snapPoints={['80%']}
        enablePanDownToClose
        onClose={handleClose}
        onChange={(idx) => {
          if (idx >= 0) handleOpen();
        }}
        backgroundStyle={styles.sheetBg}
        handleIndicatorStyle={styles.handle}
      >
        <BottomSheetScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="always"
        >
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>Invite to {trip.name}</Text>
            <TouchableOpacity onPress={handleClose}>
              <Ionicons name="close" size={22} color={Colors.text.secondary} />
            </TouchableOpacity>
          </View>

          <Text style={styles.sectionLabel}>Current Members</Text>
          {members.map((member) => {
            const isMe = member.user_id === user?.id;
            const memberUser = (member as any).users ?? member.user;
            return (
              <View key={member.id} style={styles.memberRow}>
                <Avatar
                  uri={memberUser?.avatar_url ?? null}
                  name={memberUser?.full_name ?? ''}
                  size={36}
                />
                <View style={styles.memberInfo}>
                  <Text style={styles.memberName}>
                    {memberUser?.full_name ?? 'Unknown'}
                    {isMe ? ' (you)' : ''}
                  </Text>
                </View>
                <View
                  style={[
                    styles.roleBadge,
                    member.role === MemberRole.Admin && styles.roleBadgeAdmin,
                  ]}
                >
                  <Text
                    style={[
                      styles.roleText,
                      member.role === MemberRole.Admin && styles.roleTextAdmin,
                    ]}
                  >
                    {member.role === MemberRole.Admin ? 'Admin' : 'Member'}
                  </Text>
                </View>
                {isAdmin && !isMe && member.role !== MemberRole.Admin && (
                  <TouchableOpacity
                    style={styles.makeAdminBtn}
                    onPress={() => {
                      setTransferTargetId(member.user_id);
                      setTransferConfirm(true);
                    }}
                  >
                    <Text style={styles.makeAdminText}>Make Admin</Text>
                  </TouchableOpacity>
                )}
              </View>
            );
          })}

          <Text style={[styles.sectionLabel, { marginTop: 20 }]}>Invite New Members</Text>
          <View style={styles.inviteeList}>
            {invitees.map((row, idx) => (
              <InviteeRow
                key={row.id}
                value={row.value}
                onChange={(v) => updateRow(row.id, v)}
                onRemove={() => removeRow(row.id)}
                status={row.status}
                showRemove={invitees.length > 1}
              />
            ))}
          </View>

          <TouchableOpacity style={styles.addAnotherBtn} onPress={addRow}>
            <Text style={styles.addAnotherText}>+ Add another</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.sendBtn, isSending && styles.sendBtnDisabled]}
            onPress={handleSendInvites}
            disabled={isSending}
          >
            {isSending ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.sendBtnText}>Send Invites</Text>
            )}
          </TouchableOpacity>

          {pendingInvites.length > 0 && (
            <>
              <Text style={[styles.sectionLabel, { marginTop: 24 }]}>Pending Invites</Text>
              {pendingInvites.map((inv) => {
                const contact = inv.invited_email ?? inv.invited_phone ?? '—';
                const hoursLeft = expiresInHours(inv.expires_at);
                const isExpired = hoursLeft === 'expired';
                return (
                  <View key={inv.id} style={styles.pendingRow}>
                    <Ionicons
                      name={inv.invited_email ? 'mail-outline' : 'call-outline'}
                      size={16}
                      color={Colors.text.tertiary}
                    />
                    <View style={styles.pendingInfo}>
                      <Text style={styles.pendingContact} numberOfLines={1}>
                        {contact}
                      </Text>
                      <Text style={[styles.pendingStatus, isExpired && styles.pendingExpired]}>
                        {isExpired ? 'Expired' : `Pending · expires in ${hoursLeft}`}
                      </Text>
                    </View>
                    {isExpired && (
                      <TouchableOpacity
                        onPress={() => handleResend(inv.id)}
                        style={styles.resendBtn}
                      >
                        <Text style={styles.resendText}>Resend</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                );
              })}
            </>
          )}
        </BottomSheetScrollView>
      </BottomSheet>

      <Modal
        transparent
        visible={transferConfirm}
        animationType="fade"
        onRequestClose={() => setTransferConfirm(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Transfer Admin?</Text>
            <Text style={styles.modalBody}>You will lose admin privileges for this trip.</Text>
            <View style={styles.modalBtns}>
              <TouchableOpacity
                style={styles.modalCancel}
                onPress={() => {
                  setTransferConfirm(false);
                  setTransferTargetId(null);
                }}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalConfirm} onPress={handleTransferAdmin}>
                <Text style={styles.modalConfirmText}>Transfer</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  sheetBg: {
    backgroundColor: Colors.neutral.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  handle: { backgroundColor: Colors.neutral.border, width: 40 },
  content: { padding: 24, paddingBottom: 60 },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  sheetTitle: { fontSize: 20, fontWeight: '700', color: Colors.text.primary },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.text.tertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 12,
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral.borderLight,
  },
  memberInfo: { flex: 1 },
  memberName: { fontSize: 15, fontWeight: '500', color: Colors.text.primary },
  roleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    backgroundColor: Colors.neutral.border,
  },
  roleBadgeAdmin: { backgroundColor: Colors.primary.coralFaded },
  roleText: { fontSize: 11, fontWeight: '600', color: Colors.text.tertiary },
  roleTextAdmin: { color: Colors.primary.coral },
  makeAdminBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.neutral.border,
  },
  makeAdminText: { fontSize: 12, color: Colors.text.secondary, fontWeight: '500' },
  inviteeList: { gap: 10 },
  addAnotherBtn: { paddingVertical: 10, marginTop: 4 },
  addAnotherText: { fontSize: 14, color: Colors.primary.coral, fontWeight: '600' },
  sendBtn: {
    height: 52,
    backgroundColor: Colors.primary.coral,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },
  sendBtnDisabled: { opacity: 0.6 },
  sendBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  pendingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral.borderLight,
  },
  pendingInfo: { flex: 1 },
  pendingContact: { fontSize: 14, color: Colors.text.primary, fontWeight: '500' },
  pendingStatus: { fontSize: 12, color: Colors.text.tertiary, marginTop: 2 },
  pendingExpired: { color: Colors.status.error },
  resendBtn: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 10,
    backgroundColor: Colors.primary.coralFaded,
  },
  resendText: { fontSize: 12, color: Colors.primary.coral, fontWeight: '600' },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  modalBox: {
    backgroundColor: Colors.neutral.white,
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 320,
    gap: 12,
  },
  modalTitle: { fontSize: 18, fontWeight: '700', color: Colors.text.primary },
  modalBody: { fontSize: 14, color: Colors.text.secondary, lineHeight: 20 },
  modalBtns: { flexDirection: 'row', gap: 10, marginTop: 4 },
  modalCancel: {
    flex: 1,
    height: 44,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: Colors.neutral.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCancelText: { fontSize: 15, color: Colors.text.secondary, fontWeight: '600' },
  modalConfirm: {
    flex: 1,
    height: 44,
    borderRadius: 10,
    backgroundColor: Colors.primary.coral,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalConfirmText: { fontSize: 15, color: '#fff', fontWeight: '700' },
});

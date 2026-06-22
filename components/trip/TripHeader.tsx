import { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTripContext } from '@/lib/context/TripContext';
import Colors from '@/constants/colors';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { supabase } from '@/lib/supabase';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/store/authStore';
import { useTripStore } from '@/store/tripStore';

interface TripHeaderProps {
  onAddMembers: () => void;
  showActions?: boolean;
}

export default function TripHeader({ onAddMembers, showActions = true }: TripHeaderProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { trip, isAdmin } = useTripContext();
  const { user } = useAuthStore();
  const { removeTrip } = useTripStore();
  const queryClient = useQueryClient();

  const [menuVisible, setMenuVisible] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [transferConfirm, setTransferConfirm] = useState(false);

  const handleDelete = async () => {
    setDeleteConfirm(false);
    if (isAdmin) {
      await supabase.from('trips').delete().eq('id', trip.id);
    } else {
      await supabase.from('trip_members').delete().eq('trip_id', trip.id).eq('user_id', user?.id);
    }
    removeTrip(trip.id);
    queryClient.invalidateQueries({ queryKey: ['trips'] });
    router.push('/(app)/home');
  };

  const handleTransferAdmin = () => {
    setTransferConfirm(false);
    Alert.alert('Transfer Admin', 'Transfer admin feature coming soon.');
  };

  return (
    <>
      <View style={[styles.container, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.push('/(app)/home')}>
          <Ionicons name="arrow-back" size={22} color={Colors.text.primary} />
        </TouchableOpacity>

        <Text style={styles.tripName} numberOfLines={1} ellipsizeMode="tail">
          {trip.name}
        </Text>

        {showActions && (
          <View style={styles.rightRow}>
            <TouchableOpacity style={styles.iconBtn} onPress={onAddMembers}>
              <Ionicons name="person-add-outline" size={20} color={Colors.primary.coral} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconBtn} onPress={() => setMenuVisible(true)}>
              <Ionicons name="ellipsis-horizontal" size={20} color={Colors.text.secondary} />
            </TouchableOpacity>
          </View>
        )}
      </View>

      <Modal
        transparent
        visible={menuVisible}
        animationType="fade"
        onRequestClose={() => setMenuVisible(false)}
      >
        <TouchableOpacity
          style={styles.menuOverlay}
          activeOpacity={1}
          onPress={() => setMenuVisible(false)}
        >
          <View style={[styles.menuBox, { top: insets.top + 56, right: 16 }]}>
            {isAdmin && (
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => {
                  setMenuVisible(false);
                  setTransferConfirm(true);
                }}
              >
                <Ionicons name="swap-horizontal-outline" size={16} color={Colors.text.primary} />
                <Text style={styles.menuItemText}>Transfer Admin</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                setMenuVisible(false);
                setDeleteConfirm(true);
              }}
            >
              <Ionicons name="trash-outline" size={16} color={Colors.status.error} />
              <Text style={[styles.menuItemText, styles.menuItemDanger]}>
                {isAdmin ? 'Delete Trip' : 'Leave Trip'}
              </Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      <ConfirmDialog
        visible={deleteConfirm}
        title={isAdmin ? 'Delete Trip?' : 'Leave Trip?'}
        message={
          isAdmin
            ? 'This will permanently delete the trip for everyone. This cannot be undone.'
            : 'This will remove you from the trip. This cannot be undone.'
        }
        confirmText={isAdmin ? 'Delete' : 'Leave'}
        destructive
        onConfirm={handleDelete}
        onCancel={() => setDeleteConfirm(false)}
      />

      <ConfirmDialog
        visible={transferConfirm}
        title="Transfer Admin?"
        message="You will no longer be the admin of this trip."
        confirmText="Transfer"
        onConfirm={handleTransferAdmin}
        onCancel={() => setTransferConfirm(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: Colors.neutral.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral.border,
    gap: 10,
  },
  backBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tripName: {
    flex: 1,
    fontSize: 17,
    fontWeight: '700',
    color: Colors.text.primary,
  },
  rightRow: {
    flexDirection: 'row',
    gap: 4,
  },
  iconBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
  },
  menuOverlay: {
    flex: 1,
  },
  menuBox: {
    position: 'absolute',
    backgroundColor: Colors.neutral.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.neutral.border,
    minWidth: 180,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 8,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral.borderLight,
  },
  menuItemText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.text.primary,
  },
  menuItemDanger: {
    color: Colors.status.error,
  },
});

import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import BottomSheet, { BottomSheetFlatList } from '@gorhom/bottom-sheet';
import { Ionicons } from '@expo/vector-icons';
import { PackingListItem } from '@/types';
import { usePackingItems, usePackingChecks, useAddPackingItem, useToggleCheck } from '@/hooks/usePackingList';
import { useAuthStore } from '@/store/authStore';
import Colors from '@/constants/colors';

interface PackingListSheetProps {
  sheetRef: React.RefObject<BottomSheet | null>;
  tripId: string;
}

export default function PackingListSheet({ sheetRef, tripId }: PackingListSheetProps) {
  const { user } = useAuthStore();
  const userId = user?.id ?? '';

  const { data: items = [], isLoading: itemsLoading } = usePackingItems(tripId);
  const { data: checks = [] } = usePackingChecks(tripId, userId);
  const { mutate: addItem, isPending: isAdding } = useAddPackingItem(tripId);
  const { mutate: toggleCheck } = useToggleCheck(tripId, userId);

  const [newItemText, setNewItemText] = useState('');

  const checkedIds = new Set(checks.map((c) => c.item_id));

  const handleAdd = () => {
    const name = newItemText.trim();
    if (!name) return;
    addItem(name);
    setNewItemText('');
  };

  const handleToggle = (item: PackingListItem) => {
    toggleCheck({ itemId: item.id, isChecked: checkedIds.has(item.id) });
  };

  const renderItem = ({ item }: { item: PackingListItem }) => {
    const isChecked = checkedIds.has(item.id);
    return (
      <TouchableOpacity
        style={styles.itemRow}
        onPress={() => handleToggle(item)}
        activeOpacity={0.75}
      >
        <View style={[styles.checkbox, isChecked && styles.checkboxChecked]}>
          {isChecked && <Ionicons name="checkmark" size={14} color={Colors.neutral.white} />}
        </View>
        <View style={styles.itemMeta}>
          <Text style={[styles.itemName, isChecked && styles.itemNameChecked]}>
            {item.name}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <BottomSheet
      ref={sheetRef}
      index={-1}
      snapPoints={['70%']}
      enablePanDownToClose
      keyboardBehavior="interactive"
      keyboardBlurBehavior="restore"
      backgroundStyle={styles.sheetBg}
      handleIndicatorStyle={styles.handle}
    >
      <View style={styles.inner}>
        <View style={styles.sheetHeader}>
          <Text style={styles.sheetTitle}>Packing List</Text>
          <Text style={styles.sheetSub}>
            {items.length} item{items.length !== 1 ? 's' : ''}
          </Text>
        </View>

        <BottomSheetFlatList
          data={items}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            itemsLoading ? (
              <ActivityIndicator style={styles.loader} color={Colors.primary.coral} />
            ) : (
              <View style={styles.emptyState}>
                <Ionicons
                  name="bag-outline"
                  size={36}
                  color={Colors.neutral.placeholder}
                />
                <Text style={styles.emptyText}>Nothing packed yet.</Text>
                <Text style={styles.emptySubText}>Add items below.</Text>
              </View>
            )
          }
        />

        <View style={styles.addRow}>
          <TextInput
            style={styles.addInput}
            placeholder="Add an item..."
            placeholderTextColor={Colors.neutral.placeholder}
            value={newItemText}
            onChangeText={setNewItemText}
            onSubmitEditing={handleAdd}
            returnKeyType="done"
          />
          <TouchableOpacity
            style={[styles.addBtn, (!newItemText.trim() || isAdding) && styles.addBtnDisabled]}
            onPress={handleAdd}
            disabled={!newItemText.trim() || isAdding}
          >
            {isAdding ? (
              <ActivityIndicator size="small" color={Colors.neutral.white} />
            ) : (
              <Ionicons name="add" size={22} color={Colors.neutral.white} />
            )}
          </TouchableOpacity>
        </View>
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  sheetBg: {
    backgroundColor: Colors.neutral.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  handle: { backgroundColor: Colors.neutral.border, width: 40 },
  inner: { flex: 1 },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral.borderLight,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text.primary,
  },
  sheetSub: {
    fontSize: 13,
    color: Colors.text.tertiary,
  },
  listContent: { padding: 16, gap: 6, paddingBottom: 80 },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: Colors.neutral.white,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.neutral.border,
    padding: 12,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: Colors.neutral.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.neutral.white,
  },
  checkboxChecked: {
    backgroundColor: Colors.primary.coral,
    borderColor: Colors.primary.coral,
  },
  itemMeta: { flex: 1 },
  itemName: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.text.primary,
  },
  itemNameChecked: {
    textDecorationLine: 'line-through',
    color: Colors.text.tertiary,
  },
  loader: { marginTop: 40 },
  emptyState: {
    alignItems: 'center',
    paddingTop: 48,
    gap: 6,
  },
  emptyText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text.secondary,
    marginTop: 8,
  },
  emptySubText: {
    fontSize: 13,
    color: Colors.text.tertiary,
  },
  addRow: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    gap: 10,
    padding: 16,
    backgroundColor: Colors.neutral.white,
    borderTopWidth: 1,
    borderTopColor: Colors.neutral.border,
  },
  addInput: {
    flex: 1,
    height: 46,
    borderWidth: 1.5,
    borderColor: Colors.neutral.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    fontSize: 15,
    color: Colors.text.primary,
    backgroundColor: Colors.neutral.background,
  },
  addBtn: {
    width: 46,
    height: 46,
    borderRadius: 12,
    backgroundColor: Colors.primary.coral,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addBtnDisabled: {
    opacity: 0.5,
  },
});

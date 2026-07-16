import { forwardRef, useState, useEffect, useCallback, useRef } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import BottomSheet, { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { BottomSheetBackdrop, BottomSheetBackdropProps } from '@gorhom/bottom-sheet';
import CategoryIcon, { CATEGORY_META } from './CategoryIcon';
import SplitSelector from './SplitSelector';
import Avatar from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Expense, User } from '@/types';
import { ExpenseCategory } from '@/constants/enums';
import { colors, radius, shadows, spacing, typography } from '@/constants/tokens';
import { CreateExpenseInput, UpdateExpenseInput } from '@/lib/api/expenses';
import { SplitType } from '@/lib/utils/splitCalculator';

interface ExpenseSheetProps {
  members: Pick<User, 'id' | 'full_name' | 'avatar_url'>[];
  currentUserId: string;
  tripId: string;
  defaultCurrency?: string;
  editingExpense?: Expense | null;
  resetKey?: number;
  onSubmitCreate: (input: CreateExpenseInput) => void;
  onSubmitUpdate: (input: UpdateExpenseInput) => void;
  onClose: () => void;
  isLoading?: boolean;
}

const CATEGORIES = Object.values(ExpenseCategory);
const SPLIT_TYPES: { key: SplitType; label: string }[] = [
  { key: 'equal', label: 'Equally' },
  { key: 'percentage', label: 'By %' },
  { key: 'custom', label: 'Custom' },
];

function fmt(amount: number) {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export const ExpenseSheet = forwardRef<BottomSheet, ExpenseSheetProps>(function ExpenseSheet(
  {
    members,
    currentUserId,
    tripId,
    defaultCurrency = 'USD',
    editingExpense,
    resetKey,
    onSubmitCreate,
    onSubmitUpdate,
    onClose,
    isLoading = false,
  },
  ref,
) {
  const allMemberIds = members.map((m) => m.id);
  const isEditing = !!editingExpense;

  const [amountStr, setAmountStr] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<ExpenseCategory>(ExpenseCategory.Food);
  const [paidBy, setPaidBy] = useState(currentUserId);
  const [selectedMembers, setSelectedMembers] = useState<string[]>(allMemberIds);
  const [splitType, setSplitType] = useState<SplitType>('equal');
  const [splitValues, setSplitValues] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<string[]>([]);

  useEffect(() => {
    if (editingExpense) {
      setAmountStr(editingExpense.amount.toFixed(2));
      setDescription(editingExpense.title);
      setCategory(editingExpense.category);
      setPaidBy(editingExpense.paid_by);
      const splitMemberIds =
        editingExpense.splits
          ?.filter((s) => s.user_id !== editingExpense.paid_by || s.amount === 0)
          .map((s) => s.user_id) ?? allMemberIds;
      setSelectedMembers(splitMemberIds.length > 0 ? splitMemberIds : allMemberIds);
      setSplitType('equal');
      setSplitValues({});
      setErrors([]);
    } else {
      resetForm();
    }
  }, [editingExpense, resetKey]);

  function resetForm() {
    setAmountStr('');
    setDescription('');
    setCategory(ExpenseCategory.Food);
    setPaidBy(currentUserId);
    setSelectedMembers(allMemberIds);
    setSplitType('equal');
    setSplitValues({});
    setErrors([]);
  }

  const totalAmount = parseFloat(amountStr) || 0;

  function toggleMember(userId: string) {
    setSelectedMembers((prev) => {
      if (prev.includes(userId)) {
        if (prev.length === 1) return prev;
        return prev.filter((id) => id !== userId);
      }
      return [...prev, userId];
    });
  }

  function updateSplitValue(userId: string, val: string) {
    setSplitValues((prev) => ({ ...prev, [userId]: val }));
  }

  const pctTotal = selectedMembers.reduce(
    (sum, uid) => sum + (parseFloat(splitValues[uid] ?? '0') || 0),
    0,
  );

  const customTotal = selectedMembers.reduce(
    (sum, uid) => sum + (parseFloat(splitValues[uid] ?? '0') || 0),
    0,
  );

  const remaining = Math.round((totalAmount - customTotal) * 100) / 100;
  const pctRemaining = Math.round((100 - pctTotal) * 10) / 10;

  function validate(): boolean {
    const errs: string[] = [];
    if (totalAmount <= 0) errs.push('Enter a valid amount.');
    if (!description.trim()) errs.push('Description is required.');
    if (selectedMembers.length === 0) errs.push('Select at least one person to split with.');
    if (splitType === 'percentage' && Math.abs(pctTotal - 100) > 0.1) {
      errs.push(`Percentages must total 100% (currently ${pctTotal.toFixed(1)}%).`);
    }
    if (splitType === 'custom' && Math.abs(remaining) > 0.01) {
      errs.push(`Custom amounts must total ${fmt(totalAmount)} (${fmt(remaining)} remaining).`);
    }
    setErrors(errs);
    return errs.length === 0;
  }

  function buildValues(): Record<string, number> {
    const vals: Record<string, number> = {};
    for (const uid of selectedMembers) {
      vals[uid] = parseFloat(splitValues[uid] ?? '0') || 0;
    }
    return vals;
  }

  function handleSubmit() {
    if (!validate()) return;
    const values = buildValues();
    const allSplitMembers = Array.from(new Set([...selectedMembers, paidBy]));

    if (isEditing && editingExpense) {
      onSubmitUpdate({
        expenseId: editingExpense.id,
        activityId: editingExpense.activity_id,
        paidBy,
        title: description.trim(),
        amount: totalAmount,
        currency: defaultCurrency,
        category,
        members: allSplitMembers,
        splitType,
        values,
      });
    } else {
      onSubmitCreate({
        tripId,
        paidBy,
        title: description.trim(),
        amount: totalAmount,
        currency: defaultCurrency,
        category,
        members: allSplitMembers,
        splitType,
        values,
      });
    }
  }

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} opacity={0.35} />
    ),
    [],
  );

  const equalShare = selectedMembers.length > 0 ? totalAmount / selectedMembers.length : 0;
  const insets = useSafeAreaInsets();

  return (
    <BottomSheet
      ref={ref}
      index={-1}
      snapPoints={['92%']}
      enablePanDownToClose
      onClose={onClose}
      backdropComponent={renderBackdrop}
      handleIndicatorStyle={styles.handle}
      backgroundStyle={styles.sheetBg}
      keyboardBehavior="interactive"
      keyboardBlurBehavior="restore"
    >
      <BottomSheetScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 90 }]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{isEditing ? 'Edit Expense' : 'Add Expense'}</Text>
          <TouchableOpacity onPress={onClose} hitSlop={12} style={styles.closeBtn}>
            <Text style={styles.closeText}>✕</Text>
          </TouchableOpacity>
        </View>

        {/* Amount */}
        <View style={styles.amountWrap}>
          <Text style={styles.currencySymbol}>$</Text>
          <TextInput
            style={styles.amountInput}
            value={amountStr}
            onChangeText={setAmountStr}
            placeholder="0.00"
            placeholderTextColor={colors.neutral[300]}
            keyboardType="decimal-pad"
            returnKeyType="done"
          />
        </View>

        {/* Description */}
        <View style={styles.section}>
          <Text style={styles.label}>Description</Text>
          <TextInput
            style={styles.textInput}
            value={description}
            onChangeText={setDescription}
            placeholder="e.g. Nobu dinner, Grab to airport"
            placeholderTextColor={colors.neutral[400]}
            returnKeyType="done"
          />
        </View>

        {/* Category */}
        <View style={styles.section}>
          <Text style={styles.label}>Category</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryRow}
          >
            {CATEGORIES.map((cat) => {
              const meta = CATEGORY_META[cat];
              const isActive = category === cat;
              return (
                <TouchableOpacity
                  key={cat}
                  style={[
                    styles.categoryPill,
                    isActive && { backgroundColor: meta.bg, borderColor: meta.color },
                  ]}
                  onPress={() => setCategory(cat)}
                  activeOpacity={0.75}
                >
                  <Text style={styles.categoryEmoji}>{meta.emoji}</Text>
                  <Text
                    style={[
                      styles.categoryLabel,
                      isActive && { color: meta.color, fontFamily: typography.fonts.semibold },
                    ]}
                  >
                    {cat.charAt(0).toUpperCase() + cat.slice(1)}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Paid by */}
        <View style={styles.section}>
          <Text style={styles.label}>Paid by</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.paidByRow}
          >
            {members.map((member) => {
              const isActive = paidBy === member.id;
              return (
                <TouchableOpacity
                  key={member.id}
                  style={[styles.paidByChip, isActive && styles.paidByChipActive]}
                  onPress={() => setPaidBy(member.id)}
                  activeOpacity={0.75}
                >
                  <Avatar uri={member.avatar_url} name={member.full_name} size="sm" />
                  <Text
                    style={[styles.paidByName, isActive && styles.paidByNameActive]}
                    numberOfLines={1}
                  >
                    {member.id === currentUserId ? 'You' : member.full_name.split(' ')[0]}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Split between */}
        <View style={styles.section}>
          <SplitSelector members={members} selected={selectedMembers} onToggle={toggleMember} />
        </View>

        {/* Split type */}
        <View style={styles.section}>
          <Text style={styles.label}>Split type</Text>
          <View style={styles.segmented}>
            {SPLIT_TYPES.map((st) => (
              <TouchableOpacity
                key={st.key}
                style={[styles.segment, splitType === st.key && styles.segmentActive]}
                onPress={() => setSplitType(st.key)}
                activeOpacity={0.8}
              >
                <Text
                  style={[styles.segmentText, splitType === st.key && styles.segmentTextActive]}
                >
                  {st.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Per-person breakdown */}
          {splitType === 'equal' && totalAmount > 0 && selectedMembers.length > 0 && (
            <View style={styles.preview}>
              {selectedMembers.map((uid) => {
                const member = members.find((m) => m.id === uid);
                return (
                  <View key={uid} style={styles.previewRow}>
                    <Text style={styles.previewName}>
                      {uid === currentUserId ? 'You' : (member?.full_name.split(' ')[0] ?? uid)}
                    </Text>
                    <Text style={styles.previewAmount}>${fmt(equalShare)}</Text>
                  </View>
                );
              })}
            </View>
          )}

          {splitType === 'percentage' && (
            <View style={styles.preview}>
              {selectedMembers.map((uid) => {
                const member = members.find((m) => m.id === uid);
                const pct = parseFloat(splitValues[uid] ?? '0') || 0;
                const dollarAmt = totalAmount > 0 ? (pct / 100) * totalAmount : 0;
                return (
                  <View key={uid} style={styles.previewRow}>
                    <Text style={styles.previewName}>
                      {uid === currentUserId ? 'You' : (member?.full_name.split(' ')[0] ?? uid)}
                    </Text>
                    <TextInput
                      style={styles.splitInput}
                      value={splitValues[uid] ?? ''}
                      onChangeText={(v) => updateSplitValue(uid, v)}
                      placeholder="0"
                      placeholderTextColor={colors.neutral[400]}
                      keyboardType="decimal-pad"
                      returnKeyType="done"
                    />
                    <Text style={styles.splitUnit}>%</Text>
                    {totalAmount > 0 && <Text style={styles.previewAmount}>${fmt(dollarAmt)}</Text>}
                  </View>
                );
              })}
              <Text
                style={[
                  styles.totalIndicator,
                  Math.abs(pctRemaining) < 0.1 ? styles.totalOk : styles.totalWarn,
                ]}
              >
                {Math.abs(pctRemaining) < 0.1
                  ? '✓ 100%'
                  : `${pctRemaining > 0 ? '+' : ''}${pctRemaining.toFixed(1)}% remaining`}
              </Text>
            </View>
          )}

          {splitType === 'custom' && (
            <View style={styles.preview}>
              {selectedMembers.map((uid) => {
                const member = members.find((m) => m.id === uid);
                return (
                  <View key={uid} style={styles.previewRow}>
                    <Text style={styles.previewName}>
                      {uid === currentUserId ? 'You' : (member?.full_name.split(' ')[0] ?? uid)}
                    </Text>
                    <Text style={styles.splitUnit}>$</Text>
                    <TextInput
                      style={styles.splitInput}
                      value={splitValues[uid] ?? ''}
                      onChangeText={(v) => updateSplitValue(uid, v)}
                      placeholder="0.00"
                      placeholderTextColor={colors.neutral[400]}
                      keyboardType="decimal-pad"
                      returnKeyType="done"
                    />
                  </View>
                );
              })}
              <Text
                style={[
                  styles.totalIndicator,
                  Math.abs(remaining) < 0.01 ? styles.totalOk : styles.totalWarn,
                ]}
              >
                {Math.abs(remaining) < 0.01
                  ? '✓ Fully allocated'
                  : `$${fmt(Math.abs(remaining))} ${remaining > 0 ? 'remaining' : 'over'}`}
              </Text>
            </View>
          )}
        </View>

        {/* Errors */}
        {errors.length > 0 && (
          <View style={styles.errorBox}>
            {errors.map((e, i) => (
              <Text key={i} style={styles.errorText}>
                · {e}
              </Text>
            ))}
          </View>
        )}

        {/* Submit */}
        <Button onPress={handleSubmit} loading={isLoading} style={styles.submitBtn}>
          {isEditing ? 'Save Changes' : 'Add Expense'}
        </Button>
      </BottomSheetScrollView>
    </BottomSheet>
  );
});

const styles = StyleSheet.create({
  sheetBg: {
    backgroundColor: 'rgba(250, 249, 247, 0.98)',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
  },
  handle: {
    width: 36,
    height: 4,
    backgroundColor: colors.neutral[300],
    borderRadius: radius.full,
  },
  content: {
    padding: spacing[5],
    paddingTop: spacing[2],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[4],
    position: 'relative',
  },
  headerTitle: {
    fontSize: typography.sizes.md,
    fontFamily: typography.fonts.semibold,
    color: colors.neutral[800],
  },
  closeBtn: {
    position: 'absolute',
    right: 0,
    width: 28,
    height: 28,
    borderRadius: radius.full,
    backgroundColor: colors.neutral[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeText: {
    fontSize: 12,
    color: colors.neutral[500],
    fontFamily: typography.fonts.medium,
  },
  amountWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[5],
    gap: 4,
  },
  currencySymbol: {
    fontSize: typography.sizes.xxl,
    fontFamily: typography.fonts.bold,
    color: colors.neutral[400],
    lineHeight: 48,
  },
  amountInput: {
    fontSize: 48,
    fontFamily: typography.fonts.bold,
    color: colors.neutral[900],
    minWidth: 120,
    textAlign: 'center',
    padding: 0,
  },
  section: {
    marginBottom: spacing[4],
    gap: spacing[2],
  },
  label: {
    fontSize: typography.sizes.sm,
    fontFamily: typography.fonts.medium,
    color: colors.neutral[600],
  },
  textInput: {
    backgroundColor: colors.neutral[100],
    borderRadius: radius.md,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    fontSize: typography.sizes.base,
    fontFamily: typography.fonts.regular,
    color: colors.neutral[800],
    borderWidth: 1,
    borderColor: colors.neutral[200],
  },
  categoryRow: {
    flexDirection: 'row',
    gap: spacing[2],
    paddingBottom: 4,
  },
  categoryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.full,
    backgroundColor: colors.neutral[100],
    borderWidth: 1.5,
    borderColor: colors.neutral[200],
  },
  categoryEmoji: {
    fontSize: 14,
  },
  categoryLabel: {
    fontSize: typography.sizes.xs,
    fontFamily: typography.fonts.medium,
    color: colors.neutral[500],
  },
  paidByRow: {
    flexDirection: 'row',
    gap: spacing[2],
    paddingBottom: 4,
  },
  paidByChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.full,
    backgroundColor: colors.neutral[100],
    borderWidth: 1.5,
    borderColor: colors.neutral[200],
  },
  paidByChipActive: {
    backgroundColor: colors.primary[50],
    borderColor: colors.primary[400],
  },
  paidByName: {
    fontSize: typography.sizes.xs,
    fontFamily: typography.fonts.medium,
    color: colors.neutral[500],
    maxWidth: 72,
  },
  paidByNameActive: {
    color: colors.primary[500],
    fontFamily: typography.fonts.semibold,
  },
  segmented: {
    flexDirection: 'row',
    backgroundColor: colors.neutral[100],
    borderRadius: radius.md,
    padding: 3,
    gap: 2,
  },
  segment: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: radius.sm,
    alignItems: 'center',
  },
  segmentActive: {
    backgroundColor: colors.neutral[0],
    ...shadows.sm,
  },
  segmentText: {
    fontSize: typography.sizes.sm,
    fontFamily: typography.fonts.medium,
    color: colors.neutral[500],
  },
  segmentTextActive: {
    color: colors.neutral[800],
    fontFamily: typography.fonts.semibold,
  },
  preview: {
    gap: spacing[2],
    marginTop: spacing[2],
    backgroundColor: colors.neutral[50],
    borderRadius: radius.md,
    padding: spacing[3],
  },
  previewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  previewName: {
    flex: 1,
    fontSize: typography.sizes.sm,
    fontFamily: typography.fonts.medium,
    color: colors.neutral[700],
  },
  previewAmount: {
    fontSize: typography.sizes.sm,
    fontFamily: typography.fonts.semibold,
    color: colors.neutral[700],
    minWidth: 64,
    textAlign: 'right',
  },
  splitInput: {
    backgroundColor: colors.neutral[0],
    borderRadius: radius.sm,
    paddingHorizontal: spacing[2],
    paddingVertical: 4,
    fontSize: typography.sizes.sm,
    fontFamily: typography.fonts.medium,
    color: colors.neutral[800],
    borderWidth: 1,
    borderColor: colors.neutral[200],
    minWidth: 64,
    textAlign: 'center',
  },
  splitUnit: {
    fontSize: typography.sizes.sm,
    fontFamily: typography.fonts.medium,
    color: colors.neutral[400],
  },
  totalIndicator: {
    fontSize: typography.sizes.xs,
    fontFamily: typography.fonts.semibold,
    textAlign: 'right',
    marginTop: 4,
  },
  totalOk: {
    color: colors.success,
  },
  totalWarn: {
    color: colors.warning,
  },
  errorBox: {
    backgroundColor: '#FDE8EB',
    borderRadius: radius.md,
    padding: spacing[3],
    marginBottom: spacing[3],
    gap: 4,
  },
  errorText: {
    fontSize: typography.sizes.sm,
    fontFamily: typography.fonts.medium,
    color: colors.error,
    lineHeight: 18,
  },
  submitBtn: {
    marginTop: spacing[2],
  },
});

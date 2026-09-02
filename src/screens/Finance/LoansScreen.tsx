import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { AppColors } from '../theme/AppColors';
import { FinanceService, LoanRecord } from '../../services/FinanceService.ts';
function formatDMY(d: Date): string {
  return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
}

function formatRupee(n: number): string {
  return `₹${Math.round(n).toString()}`;
}

export default function LoansScreen() {
  const navigation = useNavigation<any>();
  const [loans, setLoans] = useState<LoanRecord[]>([]);
  const [remainingByLoan, setRemainingByLoan] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  const load = useCallback(async (isRefresh = false) => {
    isRefresh ? setRefreshing(true) : setLoading(true);
    setError(null);
    try {
      const loanList = await FinanceService.getLoans();
      const remaining: Record<string, number> = {};
      for (const loan of loanList) {
        const emis = await FinanceService.getEmisForLoan(loan.id);
        remaining[loan.id] = emis
          .filter((e) => e.status !== 'PAID')
          .reduce((sum, e) => sum + e.amount, 0);
      }
      setLoans(loanList);
      setRemainingByLoan(remaining);
    } catch (e: any) {
      setError(`Failed to load loans: ${e?.message ?? e}`);
    } finally {
      isRefresh ? setRefreshing(false) : setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  return (
    <View style={styles.screen}>
      <View style={styles.appBar}>
        <Text style={styles.appBarTitle}>Loans</Text>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={AppColors.primary} />
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : loans.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyText}>No loans added yet</Text>
        </View>
      ) : (
        <FlatList
          data={loans}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={AppColors.primary} />}
          renderItem={({ item }) => {
            const remaining = remainingByLoan[item.id] ?? 0;
            return (
              <TouchableOpacity
                activeOpacity={0.7}
                style={styles.card}
                onPress={() => navigation.navigate('Emi', { loanId: item.id, loanName: item.name })}
              >
                <View style={styles.cardHeader}>
                  <View style={styles.cardIconBox}>
                    <MaterialCommunityIcons name="bank-outline" color={AppColors.primary} size={20} />
                  </View>
                  <Text style={styles.cardTitle}>{item.name}</Text>
                </View>
                <View style={styles.statRow}>
                  <StatTile label="Loan amount" value={formatRupee(item.loanAmount)} />
                  <StatTile label="Interest" value={`${item.interestRate}%`} />
                </View>
                <View style={styles.statRow}>
                  <StatTile label="Duration" value={`${item.durationMonths} months`} />
                  <StatTile label="Remaining" value={formatRupee(remaining)} highlight />
                </View>
              </TouchableOpacity>
            );
          }}
        />
      )}

      <TouchableOpacity style={styles.fab} onPress={() => setSheetOpen(true)} activeOpacity={0.85}>
        <MaterialCommunityIcons name="plus" color="#fff" size={20} />
        <Text style={styles.fabText}>Add Loan</Text>
      </TouchableOpacity>

      <AddLoanSheet
        visible={sheetOpen}
        onClose={() => setSheetOpen(false)}
        onSaved={() => {
          setSheetOpen(false);
          load();
        }}
      />
    </View>
  );
}

function StatTile({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <View style={{ flex: 1 }}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={[styles.statValue, highlight && { color: AppColors.warning }]}>{value}</Text>
    </View>
  );
}

function AddLoanSheet({
  visible,
  onClose,
  onSaved,
}: {
  visible: boolean;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [rate, setRate] = useState('');
  const [duration, setDuration] = useState('');
  const [startDate, setStartDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [saving, setSaving] = useState(false);

  const reset = () => {
    setName('');
    setAmount('');
    setRate('');
    setDuration('');
    setStartDate(new Date());
    setSaving(false);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleSave = async () => {
    const amountNum = parseFloat(amount);
    const rateNum = parseFloat(rate) || 0;
    const durationNum = parseInt(duration, 10);

    if (!name.trim() || Number.isNaN(amountNum) || Number.isNaN(durationNum)) {
      Alert.alert('Please fill all required fields');
      return;
    }

    setSaving(true);
    try {
      await FinanceService.addLoan({
        name: name.trim(),
        loanAmount: amountNum,
        interestRate: rateNum,
        startDate,
        durationMonths: durationNum,
      });
      reset();
      onSaved();
    } catch (e: any) {
      setSaving(false);
      Alert.alert('Failed', String(e?.message ?? e));
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={handleClose}>
      <View style={styles.modalOverlay}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.sheet}
        >
          <ScrollView contentContainerStyle={{ paddingBottom: 24 }} keyboardShouldPersistTaps="handled">
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>Add loan</Text>

            <TextInput
              style={styles.input}
              placeholder="Loan name (e.g. SBI Business Loan)"
              placeholderTextColor={AppColors.textMuted}
              value={name}
              onChangeText={setName}
            />
            <TextInput
              style={styles.input}
              placeholder="Loan amount"
              placeholderTextColor={AppColors.textMuted}
              keyboardType="numeric"
              value={amount}
              onChangeText={setAmount}
            />
            <TextInput
              style={styles.input}
              placeholder="Interest rate (%)"
              placeholderTextColor={AppColors.textMuted}
              keyboardType="numeric"
              value={rate}
              onChangeText={setRate}
            />
            <TextInput
              style={styles.input}
              placeholder="Duration (months)"
              placeholderTextColor={AppColors.textMuted}
              keyboardType="numeric"
              value={duration}
              onChangeText={setDuration}
            />

            <TouchableOpacity style={styles.dateRow} onPress={() => setShowDatePicker(true)}>
              <MaterialCommunityIcons name="calendar-outline" color={AppColors.textMuted} size={18} />
              <Text style={styles.dateRowText}>Start date: {formatDMY(startDate)}</Text>
            </TouchableOpacity>

            {showDatePicker && (
              <DateTimePicker
                value={startDate}
                mode="date"
                display={Platform.OS === 'ios' ? 'inline' : 'default'}
                onChange={(_, picked) => {
                  setShowDatePicker(Platform.OS === 'ios');
                  if (picked) setStartDate(picked);
                }}
              />
            )}

            <TouchableOpacity style={styles.saveBtn} disabled={saving} onPress={handleSave}>
              {saving ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.saveBtnText}>Add loan & generate EMIs</Text>
              )}
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: AppColors.background },
  appBar: {
    height: 56,
    justifyContent: 'center',
    paddingHorizontal: 16,
    backgroundColor: AppColors.surface,
    borderBottomWidth: 1,
    borderBottomColor: AppColors.border,
  },
  appBarTitle: { color: AppColors.textPrimary, fontSize: 18, fontWeight: '700' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  errorText: { color: AppColors.danger, fontSize: 12.5 },
  emptyText: { color: AppColors.textSecondary, fontSize: 13 },
  listContent: { padding: 16, paddingTop: 18, paddingBottom: 100 },
  card: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: AppColors.border,
    backgroundColor: AppColors.surface,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center' },
  cardIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: AppColors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  cardTitle: { color: AppColors.textPrimary, fontSize: 15, fontWeight: '700', flex: 1 },
  statRow: { flexDirection: 'row', marginTop: 12 },
  statLabel: { color: AppColors.textMuted, fontSize: 11 },
  statValue: { color: AppColors.textPrimary, fontSize: 13, fontWeight: '700', marginTop: 2 },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 20,
    height: 48,
    paddingHorizontal: 18,
    borderRadius: 24,
    backgroundColor: AppColors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 3,
  },
  fabText: { color: '#fff', fontSize: 14, fontWeight: '700', marginLeft: 6 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: AppColors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 16,
    maxHeight: '85%',
  },
  sheetHandle: {
    width: 36,
    height: 4,
    borderRadius: 4,
    backgroundColor: AppColors.border,
    alignSelf: 'center',
    marginBottom: 16,
  },
  sheetTitle: { color: AppColors.textPrimary, fontSize: 16, fontWeight: '700', marginBottom: 16 },
  input: {
    borderWidth: 1,
    borderColor: AppColors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: AppColors.textPrimary,
    fontSize: 14,
    marginBottom: 12,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: AppColors.border,
    borderRadius: 12,
    padding: 14,
  },
  dateRowText: { color: AppColors.textPrimary, fontSize: 14, marginLeft: 10 },
  saveBtn: {
    height: 48,
    borderRadius: 12,
    backgroundColor: AppColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  saveBtnText: { color: '#fff', fontSize: 14, fontWeight: '600' },
});
import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, RefreshControl } from 'react-native';
import Icon from '@react-native-vector-icons/material-icons';
import { useNavigation } from '@react-navigation/native';

import { SalesService, SaleRecord } from '../../services/SalesService';
import { AppColors } from '../theme/AppColors';

const service = new SalesService();

export default function PaymentsScreen() {
  const navigation = useNavigation<any>();
  const [sales, setSales] = useState<SaleRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [onlyDue, setOnlyDue] = useState(true);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try { setSales(await service.getAllSales()); }
    catch (e: any) { setError(`Failed to load payments: ${e.message ?? e}`); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = useMemo(() => onlyDue ? sales.filter((s) => s.total - s.paidAmount > 0) : sales, [sales, onlyDue]);
  const totalDue = useMemo(() => sales.reduce((sum, s) => sum + Math.max(0, s.total - s.paidAmount), 0), [sales]);

  return (
    <View style={styles.flex}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={{ marginTop: 29 }}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Icon name="chevron-left" color={AppColors.primary} size={30} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { marginTop: 29 }]}>Payments</Text>
        <View style={{ width: 22 }} />
      </View>
      <ScrollView contentContainerStyle={styles.content} refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}>
        <View style={styles.gradientCard}>
          <Text style={styles.gradientLabel}>Total outstanding</Text>
          <Text style={styles.gradientValue}>₹{totalDue.toFixed(0)}</Text>
        </View>

        <View style={styles.chipRow}>
          <TouchableOpacity style={[styles.chip, onlyDue && styles.chipSelected]} onPress={() => setOnlyDue(true)}>
            <Text style={[styles.chipText, onlyDue && styles.chipTextSelected]}>Due only</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.chip, !onlyDue && styles.chipSelected]} onPress={() => setOnlyDue(false)}>
            <Text style={[styles.chipText, !onlyDue && styles.chipTextSelected]}>All invoices</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <ActivityIndicator color={AppColors.primary} style={{ marginTop: 40 }} />
        ) : error ? (
          <View style={{ marginTop: 40, alignItems: 'center' }}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity onPress={load}><Text style={styles.retryText}>Retry</Text></TouchableOpacity>
          </View>
        ) : filtered.length === 0 ? (
          <Text style={styles.emptyText}>No outstanding payments 🎉</Text>
        ) : filtered.map((s) => {
          const remaining = Math.max(0, s.total - s.paidAmount);
          return (
            <View key={s.id} style={styles.card}>
              <View style={{ flex: 1 }}>
                <Text style={styles.customerName}>{s.customerName ?? 'Unknown'}</Text>
                <Text style={styles.invoiceText}>Invoice: {s.invoiceNumber}</Text>
                <View style={styles.amountsRow}>
                  <Text style={styles.amountMuted}>Total: ₹{s.total.toFixed(0)}</Text>
                  <Text style={styles.amountPaid}>Paid: ₹{s.paidAmount.toFixed(0)}</Text>
                </View>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={[styles.remaining, { color: remaining > 0 ? AppColors.danger : AppColors.success }]}>₹{remaining.toFixed(0)}</Text>
                {remaining > 0 && (
                  <TouchableOpacity
                    style={styles.recordChip}
                    onPress={async () => { navigation.navigate('PaymentsRecord', { sale: s, onRecorded: load }); }}
                  >
                    <Text style={styles.recordChipText}>Record</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: AppColors.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, backgroundColor: AppColors.surface, borderBottomWidth: 1, borderColor: AppColors.border },
  headerTitle: { fontSize: 18, fontWeight: '700', color: AppColors.textPrimary },
  content: { padding: 16, paddingBottom: 24 },
  gradientCard: { backgroundColor: AppColors.primary, borderRadius: 18, padding: 16 },
  gradientLabel: { color: '#ffffffd9', fontSize: 12 },
  gradientValue: { color: '#fff', fontSize: 24, fontWeight: '800', marginTop: 4 },
  chipRow: { flexDirection: 'row', gap: 8, marginTop: 16 },
  chip: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: 20, backgroundColor: AppColors.surface, borderWidth: 1, borderColor: AppColors.border },
  chipSelected: { backgroundColor: AppColors.primary, borderColor: AppColors.primary },
  chipText: { color: AppColors.textSecondary, fontSize: 12.5, fontWeight: '600' },
  chipTextSelected: { color: '#fff' },
  errorText: { color: AppColors.danger, fontSize: 12.5, textAlign: 'center' },
  retryText: { color: AppColors.primary, marginTop: 10, textAlign: 'center' },
  emptyText: { color: AppColors.textSecondary, fontSize: 13, textAlign: 'center', marginTop: 40 },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: AppColors.surface, borderRadius: 14, borderWidth: 1, borderColor: AppColors.border, padding: 13, marginTop: 16 },
  customerName: { color: AppColors.textPrimary, fontSize: 13.5, fontWeight: '700' },
  invoiceText: { color: AppColors.textSecondary, fontSize: 12, marginTop: 2 },
  amountsRow: { flexDirection: 'row', gap: 10, marginTop: 4 },
  amountMuted: { color: AppColors.textMuted, fontSize: 11 },
  amountPaid: { color: AppColors.success, fontSize: 11 },
  remaining: { fontSize: 14, fontWeight: '800' },
  recordChip: { backgroundColor: AppColors.primarySoft, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4, marginTop: 4 },
  recordChipText: { color: AppColors.primary, fontSize: 11, fontWeight: '700' },
});
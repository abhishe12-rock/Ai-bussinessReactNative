import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList, ScrollView, ActivityIndicator, RefreshControl } from 'react-native';
import Icon from '@react-native-vector-icons/material-icons';
import { useNavigation } from '@react-navigation/native';

import { SalesService, SaleRecord } from '../../services/SalesService';
import { AppColors } from '../theme/AppColors';

const service = new SalesService();
type DateFilter = 'all' | 'today' | 'week' | 'month';

function statusColor(status: string) {
  if (status === 'Paid') return AppColors.success;
  if (status === 'Partial') return AppColors.warning;
  return AppColors.danger;
}
function statusBg(status: string) {
  if (status === 'Paid') return AppColors.successSoft;
  if (status === 'Partial') return AppColors.warningSoft;
  return AppColors.dangerSoft;
}

export default function SalesHistoryScreen() {
  const navigation = useNavigation<any>();
  const [sales, setSales] = useState<SaleRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateFilter, setDateFilter] = useState<DateFilter>('all');
  const [statusFilter, setStatusFilter] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try { setSales(await service.getAllSales()); }
    catch (e: any) { setError(`Failed to load sales: ${e.message ?? e}`); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = useMemo(() => {
    let list = sales;
    const now = new Date();

    if (dateFilter === 'today') {
      list = list.filter((s) => s.createdAt.toDateString() === now.toDateString());
    } else if (dateFilter === 'week') {
      const weekAgo = new Date(now.getTime() - 7 * 86400000);
      list = list.filter((s) => s.createdAt > weekAgo);
    } else if (dateFilter === 'month') {
      list = list.filter((s) => s.createdAt.getFullYear() === now.getFullYear() && s.createdAt.getMonth() === now.getMonth());
    }

    if (statusFilter) list = list.filter((s) => s.paymentStatus === statusFilter);
    return list;
  }, [sales, dateFilter, statusFilter]);

  return (
    <View style={styles.flex}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backBtn}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Icon name="chevron-left" color={AppColors.primary} size={30} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Sales history</Text>
        </View>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterBar} contentContainerStyle={{ paddingHorizontal: 16, gap: 8, alignItems: 'center' }}>
        <Chip label="All" selected={dateFilter === 'all'} onPress={() => setDateFilter('all')} />
        <Chip label="Today" selected={dateFilter === 'today'} onPress={() => setDateFilter('today')} />
        <Chip label="This week" selected={dateFilter === 'week'} onPress={() => setDateFilter('week')} />
        <Chip label="This month" selected={dateFilter === 'month'} onPress={() => setDateFilter('month')} />
        <View style={styles.filterDivider} />
        <Chip label="Paid" selected={statusFilter === 'Paid'} onPress={() => setStatusFilter(statusFilter === 'Paid' ? null : 'Paid')} />
        <Chip label="Partial" selected={statusFilter === 'Partial'} onPress={() => setStatusFilter(statusFilter === 'Partial' ? null : 'Partial')} />
        <Chip label="Pending" selected={statusFilter === 'Pending'} onPress={() => setStatusFilter(statusFilter === 'Pending' ? null : 'Pending')} />
      </ScrollView>

      {loading ? (
        <View style={styles.centerFill}><ActivityIndicator color={AppColors.primary} /></View>
      ) : error ? (
        <View style={styles.centerFill}>
          <Icon name="error-outline" color={AppColors.danger} size={32} />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={load}><Text style={styles.retryText}>Retry</Text></TouchableOpacity>
        </View>
      ) : filtered.length === 0 ? (
        <View style={styles.centerFill}><Text style={styles.emptyText}>No sales found</Text></View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16, paddingBottom: 24 }}
          ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('SaleInvoice', { sale: item })}>
              <View style={{ flex: 1 }}>
                <View style={styles.cardTopRow}>
                  <Text style={styles.cardInvoice}>{item.invoiceNumber}</Text>
                  <View style={[styles.statusPill, { backgroundColor: statusBg(item.paymentStatus) }]}>
                    <Text style={[styles.statusText, { color: statusColor(item.paymentStatus) }]}>{item.paymentStatus}</Text>
                  </View>
                </View>
                <Text style={styles.cardCustomer}>{item.customerName ?? 'Unknown'}</Text>
                <Text style={styles.cardMethod}>{item.paymentMethod}</Text>
              </View>
              <Text style={styles.cardTotal}>₹{item.total.toFixed(0)}</Text>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}

function Chip({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity style={[styles.chip, selected && styles.chipSelected]} onPress={onPress}>
      <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: AppColors.background },
  header: {
    paddingHorizontal: 16, paddingTop: 50, paddingBottom: 14,
    backgroundColor: AppColors.surface, borderBottomWidth: 1, borderColor: AppColors.border,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  backBtn: {
    marginLeft: -6,
  },
  headerTitle: { fontSize: 17, fontWeight: '700', color: AppColors.textPrimary, letterSpacing: -0.3 },
  filterBar: { flexGrow: 0, paddingVertical: 10 },
  filterDivider: { width: 1, height: 24, backgroundColor: AppColors.border },
  centerFill: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 },
  errorText: { color: AppColors.textSecondary, fontSize: 12.5, textAlign: 'center', marginTop: 10 },
  retryText: { color: AppColors.primary, marginTop: 10 },
  emptyText: { color: AppColors.textSecondary, fontSize: 13 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, backgroundColor: AppColors.surface, borderWidth: 1, borderColor: AppColors.border },
  chipSelected: { backgroundColor: AppColors.primary, borderColor: AppColors.primary },
  chipText: { color: AppColors.textSecondary, fontSize: 12.5, fontWeight: '600' },
  chipTextSelected: { color: '#fff' },
  card: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: AppColors.surface,
    borderRadius: 12, borderWidth: 1, borderColor: AppColors.border, padding: 12,
    shadowColor: AppColors.textPrimary, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.02, shadowRadius: 4, elevation: 1,
  },
  cardTopRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cardInvoice: { color: AppColors.textPrimary, fontSize: 13.5, fontWeight: '700' },
  statusPill: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  statusText: { fontSize: 10, fontWeight: '700' },
  cardCustomer: { color: AppColors.textSecondary, fontSize: 12, marginTop: 4 },
  cardMethod: { color: AppColors.textMuted, fontSize: 11, marginTop: 2 },
  cardTotal: { color: AppColors.textPrimary, fontSize: 14.5, fontWeight: '700' },
});
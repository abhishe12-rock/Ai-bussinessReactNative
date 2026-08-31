import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, FlatList, ActivityIndicator, RefreshControl } from 'react-native';
import Icon from '@react-native-vector-icons/material-icons';
import { useNavigation } from '@react-navigation/native';

import { SalesService, SaleRecord } from '../../services/SalesService';
import { AppColors } from '../theme/AppColors';

const service = new SalesService();

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

export default function InvoicesScreen() {
  const navigation = useNavigation<any>();
  const [sales, setSales] = useState<SaleRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try { setSales(await service.getAllSales()); }
    catch (e: any) { setError(`Failed to load invoices: ${e.message ?? e}`); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = useMemo(() => sales.filter((s) =>
    s.invoiceNumber.toLowerCase().includes(query.toLowerCase()) ||
    (s.customerName ?? '').toLowerCase().includes(query.toLowerCase())
  ), [sales, query]);

  return (
    <View style={styles.flex}>
      <View style={styles.header}>
  <TouchableOpacity 
    onPress={() => navigation.goBack()}
    style={{ marginTop: 29 }}
  >
    <Icon name="arrow-back" color={AppColors.textPrimary} size={22} />
  </TouchableOpacity>
  <Text style={[styles.headerTitle, { marginTop: 29 }]}>Invoices</Text>
  <View style={{ width: 22 }} />
</View>

      <View style={styles.searchWrap}>
        <View style={styles.searchBox}>
          <Icon name="search" color={AppColors.textMuted} size={20} />
          <TextInput style={styles.searchInput} placeholder="Search invoice or customer" placeholderTextColor={AppColors.textMuted} value={query} onChangeText={setQuery} />
        </View>
      </View>

      {loading ? (
        <View style={styles.centerFill}><ActivityIndicator color={AppColors.primary} /></View>
      ) : error ? (
        <View style={styles.centerFill}>
          <Icon name="error-outline" color={AppColors.danger} size={32} />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={load}><Text style={styles.retryText}>Retry</Text></TouchableOpacity>
        </View>
      ) : filtered.length === 0 ? (
        <View style={styles.centerFill}><Text style={styles.emptyText}>No invoices yet</Text></View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16, paddingBottom: 24 }}
          ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('SaleInvoice', { sale: item })}>
              <View style={styles.cardIcon}><Icon name="receipt-long" color={AppColors.info} size={19} /></View>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardInvoice}>{item.invoiceNumber}</Text>
                <Text style={styles.cardCustomer}>{item.customerName ?? 'Unknown'}</Text>
                <Text style={styles.cardDate}>{item.createdAt.toLocaleDateString()}</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.cardTotal}>₹{item.total.toFixed(0)}</Text>
                <View style={[styles.statusPill, { backgroundColor: statusBg(item.paymentStatus) }]}>
                  <Text style={[styles.statusText, { color: statusColor(item.paymentStatus) }]}>{item.paymentStatus}</Text>
                </View>
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: AppColors.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, backgroundColor: AppColors.surface, borderBottomWidth: 1, borderColor: AppColors.border },
  headerTitle: { fontSize: 18, fontWeight: '700', color: AppColors.textPrimary },
  searchWrap: { padding: 16, paddingBottom: 8 },
  searchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: AppColors.surface, borderRadius: 12, borderWidth: 1, borderColor: AppColors.border, paddingHorizontal: 14 },
  searchInput: { flex: 1, paddingVertical: 12, marginLeft: 8, color: AppColors.textPrimary },
  centerFill: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 },
  errorText: { color: AppColors.textSecondary, fontSize: 12.5, textAlign: 'center', marginTop: 10 },
  retryText: { color: AppColors.primary, marginTop: 10 },
  emptyText: { color: AppColors.textSecondary, fontSize: 13 },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: AppColors.surface, borderRadius: 14, borderWidth: 1, borderColor: AppColors.border, padding: 13 },
  cardIcon: { width: 40, height: 40, borderRadius: 11, backgroundColor: AppColors.infoSoft, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  cardInvoice: { color: AppColors.textPrimary, fontSize: 13.5, fontWeight: '700' },
  cardCustomer: { color: AppColors.textSecondary, fontSize: 12, marginTop: 2 },
  cardDate: { color: AppColors.textMuted, fontSize: 11, marginTop: 2 },
  cardTotal: { color: AppColors.textPrimary, fontSize: 13.5, fontWeight: '700' },
  statusPill: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 20, marginTop: 4 },
  statusText: { fontSize: 10, fontWeight: '700' },
});
import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, FlatList, ScrollView, ActivityIndicator, RefreshControl } from 'react-native';
import Icon from '@react-native-vector-icons/material-icons';
import { useNavigation, useRoute } from '@react-navigation/native';

import { PurchaseService, PurchaseRecord } from '../../services/PurchaseService';
import { AppColors } from '../theme/AppColors';

const service = new PurchaseService();

function statusColor(status: string) {
  if (status === 'Received') return AppColors.success;
  if (status === 'Partially Received') return AppColors.warning;
  return AppColors.textSecondary;
}
function statusBg(status: string) {
  if (status === 'Received') return AppColors.successSoft;
  if (status === 'Partially Received') return AppColors.warningSoft;
  return AppColors.surfaceSoft;
}

export default function PurchaseOrdersScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const onChanged: (() => void) | undefined = route.params?.onChanged;

  const [purchases, setPurchases] = useState<PurchaseRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try { setPurchases(await service.getAllPurchases()); }
    catch (e: any) { setError(`Failed to load purchase orders: ${e.message ?? e}`); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = useMemo(() => {
    let list = purchases.filter((p) =>
      p.purchaseNumber.toLowerCase().includes(query.toLowerCase()) ||
      (p.supplierName ?? '').toLowerCase().includes(query.toLowerCase())
    );
    if (statusFilter) list = list.filter((p) => p.status === statusFilter);
    return list;
  }, [purchases, query, statusFilter]);

  const refreshAll = () => { load(); onChanged?.(); };

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
        <Text style={[styles.headerTitle, { marginTop: 29 }]}>Purchase orders</Text>
        <View style={{ width: 22 }} />
      </View>
      <View style={styles.searchWrap}>
        <View style={styles.searchBox}>
          <Icon name="search" color={AppColors.textMuted} size={20} />
          <TextInput style={styles.searchInput} placeholder="Search PO / Supplier" placeholderTextColor={AppColors.textMuted} value={query} onChangeText={setQuery} />
        </View>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipBar} contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}>
        <Chip label="All" selected={statusFilter === null} onPress={() => setStatusFilter(null)} />
        <Chip label="Pending" selected={statusFilter === 'Pending'} onPress={() => setStatusFilter('Pending')} />
        <Chip label="Partially Received" selected={statusFilter === 'Partially Received'} onPress={() => setStatusFilter('Partially Received')} />
        <Chip label="Received" selected={statusFilter === 'Received'} onPress={() => setStatusFilter('Received')} />
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
        <View style={styles.centerFill}><Text style={styles.emptyText}>No purchase orders found</Text></View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16, paddingBottom: 24 }}
          ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.card}
              onPress={async () => { navigation.navigate('PurchaseDetails', { purchase: item, onChanged: refreshAll }); }}
            >
              <View style={{ flex: 1 }}>
                <Text style={styles.cardNumber}>{item.purchaseNumber}</Text>
                <Text style={styles.cardSupplier}>{item.supplierName ?? 'Unknown supplier'}</Text>
                <Text style={styles.cardDate}>{item.purchaseDate.toLocaleDateString()}</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.cardTotal}>₹{item.total.toFixed(0)}</Text>
                <View style={[styles.statusPill, { backgroundColor: statusBg(item.status) }]}>
                  <Text style={[styles.statusText, { color: statusColor(item.status) }]}>{item.status}</Text>
                </View>
              </View>
              <Icon name="chevron-right" color={AppColors.textMuted} size={20} />
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
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, backgroundColor: AppColors.surface, borderBottomWidth: 1, borderColor: AppColors.border },
  headerTitle: { fontSize: 18, fontWeight: '700', color: AppColors.textPrimary },
  searchWrap: { padding: 16, paddingBottom: 8 },
  searchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: AppColors.surface, borderRadius: 12, borderWidth: 1, borderColor: AppColors.border, paddingHorizontal: 14 },
  searchInput: { flex: 1, paddingVertical: 12, marginLeft: 8, color: AppColors.textPrimary },
  chipBar: { flexGrow: 0, paddingBottom: 8 },
  centerFill: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 },
  errorText: { color: AppColors.textSecondary, fontSize: 12.5, textAlign: 'center', marginTop: 10 },
  retryText: { color: AppColors.primary, marginTop: 10 },
  emptyText: { color: AppColors.textSecondary, fontSize: 13 },
  chip: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: 20, backgroundColor: AppColors.surface, borderWidth: 1, borderColor: AppColors.border },
  chipSelected: { backgroundColor: AppColors.primary, borderColor: AppColors.primary },
  chipText: { color: AppColors.textSecondary, fontSize: 12.5, fontWeight: '600' },
  chipTextSelected: { color: '#fff' },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: AppColors.surface, borderRadius: 14, borderWidth: 1, borderColor: AppColors.border, padding: 13, gap: 6 },
  cardNumber: { color: AppColors.textPrimary, fontSize: 13.5, fontWeight: '700' },
  cardSupplier: { color: AppColors.textSecondary, fontSize: 12, marginTop: 3 },
  cardDate: { color: AppColors.textMuted, fontSize: 11, marginTop: 2 },
  cardTotal: { color: AppColors.textPrimary, fontSize: 13.5, fontWeight: '700' },
  statusPill: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 20, marginTop: 4 },
  statusText: { fontSize: 10, fontWeight: '700' },
});
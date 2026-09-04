import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList, ActivityIndicator, RefreshControl } from 'react-native';
import Icon from '@react-native-vector-icons/material-icons';
import { useNavigation } from '@react-navigation/native';

import { SupplierService, SupplierRecord } from '../../services/SupplierService';
import { AppColors } from '../theme/AppColors';

const service = new SupplierService();

export default function SuppliersScreen() {
  const navigation = useNavigation<any>();
  const [suppliers, setSuppliers] = useState<SupplierRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setSuppliers(await service.getSuppliers());
    } catch (e: any) {
      setError(`Failed to load suppliers: ${e.message ?? e}`);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

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
          <Text style={styles.headerTitle}>Suppliers</Text>
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
      ) : suppliers.length === 0 ? (
        <View style={styles.centerFill}>
          <View style={styles.emptyIconWrap}><Icon name="local-shipping" color={AppColors.info} size={28} /></View>
          <Text style={styles.emptyTitle}>No suppliers yet</Text>
          <Text style={styles.emptySubtitle}>Tap "Add supplier" to create your first one</Text>
        </View>
      ) : (
        <FlatList
          data={suppliers}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16, paddingBottom: 150 }}
          ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.card}
              onPress={() => navigation.navigate('EditSupplier', { supplier: item, onSaved: load })}
            >
              <View style={styles.cardTopRow}>
                <View style={styles.avatar}><Icon name="local-shipping" color={AppColors.info} size={20} /></View>
                <Text style={styles.cardName}>{item.name}</Text>
                <Icon name="chevron-right" color={AppColors.textMuted} size={20} />
              </View>
              {(item.phone || item.address || item.gstNumber) && <View style={styles.divider} />}
              {item.phone && <DetailRow icon="call" value={item.phone} />}
              {item.address && <DetailRow icon="location-on" value={item.address} />}
              {item.gstNumber && <DetailRow icon="receipt-long" value={`GST: ${item.gstNumber}`} />}
            </TouchableOpacity>
          )}
        />
      )}

      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('AddSupplier', { onSaved: load })}
      >
        <Icon name="add" color="#fff" size={20} />
        <Text style={styles.fabText}>Add supplier</Text>
      </TouchableOpacity>
    </View>
  );
}

function DetailRow({ icon, value }: { icon: any; value: string }) {
  return (
    <View style={styles.detailRow}>
      <Icon name={icon} color={AppColors.textMuted} size={15} />
      <Text style={styles.detailText}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: AppColors.background },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingTop: 50, paddingBottom: 14,
    backgroundColor: AppColors.surface, borderBottomWidth: 1, borderColor: AppColors.border,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  backBtn: { marginLeft: -6 },
  headerTitle: { fontSize: 17, fontWeight: '700', color: AppColors.textPrimary, letterSpacing: -0.3 },
  centerFill: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 },
  errorText: { color: AppColors.textSecondary, fontSize: 12.5, textAlign: 'center', marginTop: 10 },
  retryText: { color: AppColors.primary, marginTop: 10 },
  emptyIconWrap: { width: 64, height: 64, borderRadius: 32, backgroundColor: AppColors.infoSoft, alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  emptyTitle: { color: AppColors.textPrimary, fontSize: 14.5, fontWeight: '600' },
  emptySubtitle: { color: AppColors.textSecondary, fontSize: 12.5, marginTop: 4, textAlign: 'center' },
  card: {
    backgroundColor: AppColors.surface, borderRadius: 18, borderWidth: 1, borderColor: AppColors.border, padding: 16,
    shadowColor: '#000000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.35, shadowRadius: 8, elevation: 3,
  },
  cardTopRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: { width: 44, height: 44, borderRadius: 13, backgroundColor: AppColors.infoSoft, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: `${AppColors.info}35` },
  cardName: { flex: 1, color: AppColors.textPrimary, fontSize: 14.5, fontWeight: '700' },
  divider: { height: 1, backgroundColor: AppColors.border, marginVertical: 10 },
  detailRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginTop: 6 },
  detailText: { flex: 1, color: AppColors.textSecondary, fontSize: 12.5, lineHeight: 17 },
  fab: {
    position: 'absolute', right: 16, bottom: 84, flexDirection: 'row', alignItems: 'center',
    backgroundColor: AppColors.primary, borderRadius: 16, paddingVertical: 13, paddingHorizontal: 20, gap: 8,
    shadowColor: AppColors.primary, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.45, shadowRadius: 14, elevation: 6,
  },
  fabText: { color: '#fff', fontWeight: '700', fontSize: 14 },
});
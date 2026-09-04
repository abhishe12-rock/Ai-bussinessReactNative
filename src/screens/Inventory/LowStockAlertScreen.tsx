import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, RefreshControl } from 'react-native';
import Icon from '@react-native-vector-icons/material-icons';
import { useNavigation } from '@react-navigation/native';

import { ProductService, ProductRecord } from '../../services/ProductService';
import { AppColors } from '../theme/AppColors';

const service = new ProductService();

export default function LowStockAlertScreen() {
  const navigation = useNavigation<any>();
  const [items, setItems] = useState<ProductRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setItems(await service.getLowStockProducts());
    } catch (e: any) {
      setError(`Failed to load low stock items: ${e.message ?? e}`);
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
          <Text style={styles.headerTitle}>Low Stock Alerts</Text>
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
      ) : items.length === 0 ? (
        <View style={styles.centerFill}>
          <View style={styles.emptyIconWrap}><Icon name="check-circle-outline" color={AppColors.success} size={28} /></View>
          <Text style={styles.emptyTitle}>All stocked up</Text>
          <Text style={styles.emptySubtitle}>No products are running low right now</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content} refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}>
          <View style={styles.banner}>
            <View style={styles.bannerIcon}><Icon name="warning-amber" color={AppColors.danger} size={19} /></View>
            <Text style={styles.bannerText}>{items.length} products are running low. Please reorder.</Text>
          </View>

          {items.map((item) => (
            <View key={item.id} style={styles.itemCard}>
              <View style={styles.itemIcon}><Icon name="error-outline" color={AppColors.danger} size={20} /></View>
              <View style={{ flex: 1 }}>
                <Text style={styles.itemName}>{item.name}</Text>
                <Text style={styles.itemSub}>{item.brandName ?? '—'} · Min stock {item.minimumStock}</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.itemQty}>{item.quantity} left</Text>
                <View style={styles.reorderPill}><Text style={styles.reorderText}>Reorder</Text></View>
              </View>
            </View>
          ))}
        </ScrollView>
      )}
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
  emptyIconWrap: { width: 60, height: 60, borderRadius: 30, backgroundColor: AppColors.successSoft, alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  emptyTitle: { color: AppColors.textPrimary, fontSize: 14.5, fontWeight: '600' },
  emptySubtitle: { color: AppColors.textSecondary, fontSize: 12.5, marginTop: 4 },
  content: { padding: 16, paddingBottom: 32 },
  banner: {
    flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: AppColors.surface,
    borderRadius: 12, borderWidth: 1, borderColor: AppColors.danger + '59', padding: 12, marginBottom: 14,
    shadowColor: AppColors.textPrimary, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.02, shadowRadius: 4, elevation: 1,
  },
  bannerIcon: { width: 36, height: 36, borderRadius: 10, backgroundColor: AppColors.dangerSoft, alignItems: 'center', justifyContent: 'center' },
  bannerText: { flex: 1, color: AppColors.textPrimary, fontSize: 13, fontWeight: '600' },
  itemCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: AppColors.surface,
    borderRadius: 12, borderWidth: 1, borderColor: AppColors.border, padding: 12, marginBottom: 8,
    shadowColor: AppColors.textPrimary, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.02, shadowRadius: 4, elevation: 1,
  },
  itemIcon: { width: 38, height: 38, borderRadius: 10, backgroundColor: AppColors.dangerSoft, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  itemName: { color: AppColors.textPrimary, fontSize: 13.5, fontWeight: '700' },
  itemSub: { color: AppColors.textSecondary, fontSize: 11.5, marginTop: 2 },
  itemQty: { color: AppColors.danger, fontSize: 13, fontWeight: '800' },
  reorderPill: { backgroundColor: AppColors.primarySoft, borderRadius: 6, paddingHorizontal: 10, paddingVertical: 4, marginTop: 4 },
  reorderText: { color: AppColors.primary, fontSize: 11, fontWeight: '700' },
});
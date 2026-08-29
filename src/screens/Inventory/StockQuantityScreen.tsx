import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, RefreshControl } from 'react-native';
import Icon from '@react-native-vector-icons/material-icons';
import { useNavigation } from '@react-navigation/native';

import { ProductService, ProductRecord } from '../../services/ProductService';
import { AppColors } from '../theme/AppColors';

const service = new ProductService();

export default function StockQuantityScreen() {
  const navigation = useNavigation<any>();
  const [products, setProducts] = useState<ProductRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setProducts(await service.getProducts());
    } catch (e: any) {
      setError(`Failed to load stock: ${e.message ?? e}`);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <View style={styles.flex}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" color={AppColors.textPrimary} size={22} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Stock quantity</Text>
        <View style={{ width: 22 }} />
      </View>

      {loading ? (
        <View style={styles.centerFill}><ActivityIndicator color={AppColors.primary} /></View>
      ) : error ? (
        <View style={styles.centerFill}>
          <Icon name="error-outline" color={AppColors.danger} size={32} />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={load}><Text style={styles.retryText}>Retry</Text></TouchableOpacity>
        </View>
      ) : products.length === 0 ? (
        <View style={styles.centerFill}><Text style={styles.emptyText}>No products yet</Text></View>
      ) : (
        <ScrollView contentContainerStyle={styles.content} refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}>
          <View style={styles.noticeBox}>
            <Icon name="sync" color={AppColors.success} size={18} />
            <Text style={styles.noticeText}>Stock updates automatically after every sale</Text>
          </View>

          {products.map((p) => {
            const low = p.quantity < p.minimumStock;
            return (
              <View key={p.id} style={styles.itemCard}>
                <View style={styles.itemIcon}><Icon name="smartphone" color={AppColors.primary} size={20} /></View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.itemName}>{p.name}</Text>
                  <Text style={styles.itemSub}>{p.brandName ?? '—'}</Text>
                </View>
                <View style={[styles.qtyPill, { backgroundColor: low ? AppColors.dangerSoft : AppColors.successSoft }]}>
                  <Text style={[styles.qtyText, { color: low ? AppColors.danger : AppColors.success }]}>{p.quantity} units</Text>
                </View>
              </View>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: AppColors.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, backgroundColor: AppColors.surface, borderBottomWidth: 1, borderColor: AppColors.border },
  headerTitle: { fontSize: 18, fontWeight: '700', color: AppColors.textPrimary },
  centerFill: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 },
  errorText: { color: AppColors.textSecondary, fontSize: 12.5, textAlign: 'center', marginTop: 10 },
  retryText: { color: AppColors.primary, marginTop: 10 },
  emptyText: { color: AppColors.textSecondary, fontSize: 13 },
  content: { padding: 16, paddingBottom: 24 },
  noticeBox: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: AppColors.successSoft, borderRadius: 12, padding: 12, marginBottom: 16 },
  noticeText: { flex: 1, color: AppColors.success, fontSize: 12.5, fontWeight: '600' },
  itemCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: AppColors.surface, borderRadius: 14, borderWidth: 1, borderColor: AppColors.border, padding: 13, marginBottom: 10 },
  itemIcon: { width: 40, height: 40, borderRadius: 11, backgroundColor: AppColors.primarySoft, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  itemName: { color: AppColors.textPrimary, fontSize: 13.5, fontWeight: '700' },
  itemSub: { color: AppColors.textSecondary, fontSize: 12, marginTop: 2 },
  qtyPill: { borderRadius: 10, paddingHorizontal: 10, paddingVertical: 6 },
  qtyText: { fontSize: 12.5, fontWeight: '700' },
});
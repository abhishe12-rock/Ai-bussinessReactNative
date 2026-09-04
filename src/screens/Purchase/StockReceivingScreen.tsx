import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, Alert } from 'react-native';
import Icon from '@react-native-vector-icons/material-icons';
import { useNavigation, useRoute } from '@react-navigation/native';

import { PurchaseService, PurchaseRecord, PurchaseItemRecord, purchaseItemPending } from '../../services/PurchaseService';
import { ProductService } from '../../services/ProductService';
import { AppColors } from '../theme/AppColors';

const purchaseService = new PurchaseService();
const productService = new ProductService();

export default function StockReceivingScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const purchase: PurchaseRecord = route.params.purchase;
  const onReceived: (() => void) | undefined = route.params?.onReceived;

  const [items, setItems] = useState<PurchaseItemRecord[]>([]);
  const [receiveNow, setReceiveNow] = useState<Record<string, number>>({});
  const [currentStock, setCurrentStock] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [purchaseItems, products] = await Promise.all([purchaseService.getPurchaseItems(purchase.id), productService.getProducts()]);
      const stockMap: Record<string, number> = {};
      products.forEach((p) => { stockMap[p.id] = p.quantity; });

      const pendingItems = purchaseItems.filter((i) => purchaseItemPending(i) > 0);
      const initial: Record<string, number> = {};
      pendingItems.forEach((i) => { initial[i.id] = purchaseItemPending(i); });

      setItems(pendingItems);
      setCurrentStock(stockMap);
      setReceiveNow(initial);
    } catch (e: any) {
      Alert.alert('Failed to load', String(e.message ?? e));
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const confirmReceiving = async () => {
    const toReceive = Object.entries(receiveNow).filter(([, v]) => v > 0);
    if (toReceive.length === 0) {
      Alert.alert('Enter a quantity to receive for at least one item');
      return;
    }
    setProcessing(true);
    try {
      for (const [purchaseItemId, qty] of toReceive) {
        await purchaseService.receiveStock({ purchaseItemId, receiveQuantity: qty });
      }
      onReceived?.();
      navigation.goBack();
    } catch (e: any) {
      setProcessing(false);
      Alert.alert(String(e.message ?? e));
    }
  };

  if (loading) return <View style={styles.centerFill}><ActivityIndicator color={AppColors.primary} /></View>;

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
          <Text style={styles.headerTitle}>Receive Stock</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.poCard}>
          <Text style={styles.poNumber}>{purchase.purchaseNumber}</Text>
          <Text style={styles.poSupplier} numberOfLines={1}>{purchase.supplierName ?? ''}</Text>
        </View>

        {items.length === 0 ? (
          <Text style={styles.emptyText}>All items already received</Text>
        ) : items.map((item) => {
          const receiving = receiveNow[item.id] ?? 0;
          const stock = item.productId ? (currentStock[item.productId] ?? 0) : 0;
          const afterStock = stock + receiving;
          const pending = purchaseItemPending(item);

          return (
            <View key={item.id} style={styles.itemCard}>
              <Text style={styles.itemName}>{item.productName}</Text>
              <View style={styles.miniStatsRow}>
                <MiniStat label="Ordered" value={`${item.quantity}`} />
                <MiniStat label="Already received" value={`${item.receivedQuantity}`} />
                <MiniStat label="Pending" value={`${pending}`} color={AppColors.warning} />
              </View>

              <Text style={styles.receiveLabel}>Receive now</Text>
              <View style={styles.receiveRow}>
                <TouchableOpacity onPress={() => setReceiveNow((prev) => ({ ...prev, [item.id]: Math.max(0, (prev[item.id] ?? 0) - 1) }))}>
                  <Icon name="remove-circle-outline" color={AppColors.textMuted} size={24} />
                </TouchableOpacity>
                <TextInput
                  style={styles.receiveInput}
                  keyboardType="numeric"
                  value={String(receiving)}
                  onChangeText={(v) => {
                    const n = Math.max(0, Math.min(pending, parseInt(v, 10) || 0));
                    setReceiveNow((prev) => ({ ...prev, [item.id]: n }));
                  }}
                />
                <TouchableOpacity onPress={() => setReceiveNow((prev) => ({ ...prev, [item.id]: Math.min(pending, (prev[item.id] ?? 0) + 1) }))}>
                  <Icon name="add-circle-outline" color={AppColors.primary} size={24} />
                </TouchableOpacity>
              </View>

              {item.productId && (
                <View style={styles.miniStatsRow}>
                  <MiniStat label="Current inventory" value={`${stock}`} />
                  <MiniStat label="After receiving" value={`${afterStock}`} color={AppColors.success} />
                </View>
              )}
            </View>
          );
        })}
      </ScrollView>

      {items.length > 0 && (
        <View style={styles.footer}>
          <TouchableOpacity style={[styles.confirmButton, processing && { opacity: 0.6 }]} onPress={confirmReceiving} disabled={processing}>
            {processing ? <ActivityIndicator color="#fff" /> : <Text style={styles.confirmButtonText}>Confirm receiving</Text>}
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

function MiniStat({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <View style={{ flex: 1 }}>
      <Text style={styles.miniStatLabel}>{label}</Text>
      <Text style={[styles.miniStatValue, color && { color }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: AppColors.background },
  centerFill: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: AppColors.background },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingTop: 50, paddingBottom: 14,
    backgroundColor: AppColors.surface, borderBottomWidth: 1, borderColor: AppColors.border,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  backBtn: { marginLeft: -6 },
  headerTitle: { fontSize: 17, fontWeight: '700', color: AppColors.textPrimary, letterSpacing: -0.3 },
  content: { padding: 16, paddingBottom: 24 },
  poCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: AppColors.surface,
    borderRadius: 18, borderWidth: 1, borderColor: AppColors.border, padding: 16, gap: 10,
    shadowColor: '#000000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.35, shadowRadius: 8, elevation: 3,
  },
  poNumber: { color: AppColors.textPrimary, fontSize: 14, fontWeight: '700' },
  poSupplier: { flex: 1, color: AppColors.textSecondary, fontSize: 12.5 },
  emptyText: { color: AppColors.textSecondary, fontSize: 13, textAlign: 'center', marginTop: 30 },
  itemCard: {
    backgroundColor: AppColors.surface, borderRadius: 18, borderWidth: 1, borderColor: AppColors.border, padding: 16, marginTop: 14,
    shadowColor: '#000000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.35, shadowRadius: 8, elevation: 3,
  },
  itemName: { color: AppColors.textPrimary, fontSize: 14.5, fontWeight: '700' },
  miniStatsRow: { flexDirection: 'row', gap: 10, marginTop: 10 },
  miniStatLabel: { color: AppColors.textMuted, fontSize: 10.5 },
  miniStatValue: { color: AppColors.textPrimary, fontSize: 14, fontWeight: '700', marginTop: 2 },
  receiveLabel: { color: AppColors.textSecondary, fontSize: 12, fontWeight: '600', marginTop: 12, marginBottom: 8 },
  receiveRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  receiveInput: {
    flex: 1, textAlign: 'center', backgroundColor: AppColors.surfaceInput, borderRadius: 12,
    borderWidth: 1, borderColor: AppColors.border,
    color: AppColors.textPrimary, fontSize: 16, fontWeight: '700', paddingVertical: 10,
  },
  footer: { paddingHorizontal: 16, paddingTop: 14, paddingBottom: 48, backgroundColor: AppColors.surface, borderTopWidth: 1, borderColor: AppColors.border },
  confirmButton: { backgroundColor: AppColors.primary, borderRadius: 14, height: 48, alignItems: 'center', justifyContent: 'center', shadowColor: AppColors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.45, shadowRadius: 12, elevation: 5 },
  confirmButtonText: { color: '#fff', fontSize: 14.5, fontWeight: '700' },
});
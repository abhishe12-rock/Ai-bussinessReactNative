import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, FlatList, ActivityIndicator, RefreshControl, Alert, Modal, Pressable } from 'react-native';
import Icon from '@react-native-vector-icons/material-icons';
import { useNavigation } from '@react-navigation/native';

import { ProductService, ProductRecord } from '../../services/ProductService';
import { AppColors } from '../theme/AppColors';

const service = new ProductService();

export default function ProductsScreen() {
  const navigation = useNavigation<any>();
  const [products, setProducts] = useState<ProductRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [activeProduct, setActiveProduct] = useState<ProductRecord | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setProducts(await service.getProducts());
    } catch (e: any) {
      setError(`Failed to load products: ${e.message ?? e}`);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = useMemo(
    () => products.filter((p) => p.name.toLowerCase().includes(query.toLowerCase())),
    [products, query],
  );

  const confirmDelete = (product: ProductRecord) => {
    Alert.alert('Delete product?', `${product.name} will be permanently removed from inventory.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: async () => {
          try { await service.deleteProduct(product.id); load(); }
          catch (e: any) { Alert.alert('Delete failed', String(e.message ?? e)); }
        }
      },
    ]);
  };

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
          <Text style={styles.headerTitle}>Products</Text>
        </View>
        <TouchableOpacity
          onPress={() => navigation.navigate('LowStockAlert')}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Icon name="warning" color={AppColors.warning} size={22} />
        </TouchableOpacity>
      </View>

      <View style={styles.searchWrap}>
        <View style={styles.searchBox}>
          <Icon name="search" color={AppColors.textMuted} size={20} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search products..."
            placeholderTextColor={AppColors.textMuted}
            value={query}
            onChangeText={setQuery}
          />
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
        <View style={styles.centerFill}><Text style={styles.emptyText}>No products found</Text></View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16, paddingBottom: 150 }}
          ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
          renderItem={({ item }) => {
            const low = item.quantity < item.minimumStock;
            return (
              <View style={styles.card}>
                <View style={styles.avatar}><Icon name="smartphone" color={AppColors.primary} size={22} /></View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardName}>{item.name}</Text>
                  <Text style={styles.cardSub}>{item.brandName ?? '—'} · {item.categoryName ?? '—'}</Text>
                  <View style={styles.priceRow}>
                    <Text style={styles.priceText}>₹{item.sellingPrice.toFixed(0)}</Text>
                    <View style={[styles.stockPill, { backgroundColor: low ? AppColors.dangerSoft : AppColors.successSoft }]}>
                      <Text style={[styles.stockText, { color: low ? AppColors.danger : AppColors.success }]}>Stock: {item.quantity}</Text>
                    </View>
                  </View>
                </View>
                <TouchableOpacity
                  onPress={() => setActiveProduct(item)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  style={styles.moreBtn}
                >
                  <Icon name="more-vert" color={AppColors.textMuted} size={20} />
                </TouchableOpacity>
              </View>
            );
          }}
        />
      )}

      <TouchableOpacity style={styles.fab} onPress={() => navigation.navigate('AddProduct', { onSaved: load })}>
        <Icon name="add" color="#fff" size={20} />
        <Text style={styles.fabText}>Add product</Text>
      </TouchableOpacity>

      {/* PRODUCT ACTIONS SHEET */}
      <Modal visible={!!activeProduct} transparent animationType="slide" onRequestClose={() => setActiveProduct(null)}>
        <Pressable style={styles.sheetBackdrop} onPress={() => setActiveProduct(null)}>
          <View style={styles.sheet}>
            <View style={styles.sheetHandle} />
            {activeProduct && (
              <>
                <View style={styles.sheetHeaderRow}>
                  <View style={styles.sheetAvatar}>
                    <Icon name="smartphone" color={AppColors.primary} size={22} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.sheetProductName} numberOfLines={1}>{activeProduct.name}</Text>
                    <Text style={styles.sheetProductSub}>
                      {activeProduct.brandName ?? '—'} · {activeProduct.categoryName ?? '—'} · ₹{activeProduct.sellingPrice.toFixed(0)}
                    </Text>
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.actionRow}
                  onPress={() => {
                    const p = activeProduct;
                    setActiveProduct(null);
                    navigation.navigate('ProductDetails', { product: p });
                  }}
                >
                  <View style={[styles.actionIconWrap, { backgroundColor: `${AppColors.primary}14` }]}>
                    <Icon name="visibility" color={AppColors.primary} size={18} />
                  </View>
                  <Text style={styles.actionText}>View product details</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.actionRow}
                  onPress={() => {
                    const p = activeProduct;
                    setActiveProduct(null);
                    navigation.navigate('EditProduct', { product: p, onSaved: load });
                  }}
                >
                  <View style={[styles.actionIconWrap, { backgroundColor: `${AppColors.primary}14` }]}>
                    <Icon name="edit" color={AppColors.primary} size={18} />
                  </View>
                  <Text style={styles.actionText}>Edit product</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.actionRow}
                  onPress={() => {
                    const p = activeProduct;
                    setActiveProduct(null);
                    confirmDelete(p);
                  }}
                >
                  <View style={[styles.actionIconWrap, { backgroundColor: `${AppColors.danger}14` }]}>
                    <Icon name="delete-outline" color={AppColors.danger} size={18} />
                  </View>
                  <Text style={[styles.actionText, { color: AppColors.danger }]}>Delete product</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.cancelBtn} onPress={() => setActiveProduct(null)}>
                  <Text style={styles.cancelText}>Cancel</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </Pressable>
      </Modal>
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
  searchWrap: { padding: 16, paddingBottom: 8 },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: AppColors.surface,
    borderRadius: 12,
    borderWidth: 1.2,
    borderColor: AppColors.border,
    paddingHorizontal: 14,
    height: 48,
    shadowColor: AppColors.primary,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  searchInput: { flex: 1, paddingVertical: 11, marginLeft: 8, color: AppColors.textPrimary, fontSize: 14, fontWeight: '500' },
  centerFill: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 },
  errorText: { color: AppColors.textSecondary, fontSize: 12.5, textAlign: 'center', marginTop: 10 },
  retryText: { color: AppColors.primary, marginTop: 10, fontWeight: '700' },
  emptyText: { color: AppColors.textSecondary, fontSize: 13.5 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: AppColors.surface,
    borderRadius: 16,
    borderWidth: 1.2,
    borderColor: AppColors.border,
    padding: 14,
    shadowColor: AppColors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: AppColors.primarySoft,
    borderWidth: 1,
    borderColor: `${AppColors.primary}25`,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  cardName: { color: AppColors.textPrimary, fontSize: 14, fontWeight: '700' },
  cardSub: { color: AppColors.textSecondary, fontSize: 12, marginTop: 2 },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  priceText: { color: AppColors.textPrimary, fontSize: 14, fontWeight: '800' },
  stockPill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  stockText: { fontSize: 11, fontWeight: '700' },
  moreBtn: { width: 34, height: 34, borderRadius: 10, backgroundColor: AppColors.surfaceSoft, alignItems: 'center', justifyContent: 'center' },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 84,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: AppColors.primary,
    borderRadius: 14,
    paddingVertical: 13,
    paddingHorizontal: 20,
    gap: 7,
    shadowColor: AppColors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28,
    shadowRadius: 10,
    elevation: 4,
  },
  fabText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  sheetBackdrop: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.45)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: AppColors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 10,
    paddingBottom: 40,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: AppColors.border,
  },
  sheetHandle: { width: 36, height: 4, borderRadius: 2, backgroundColor: AppColors.border, alignSelf: 'center', marginBottom: 14 },
  sheetHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingBottom: 14,
    marginBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: AppColors.border,
  },
  sheetAvatar: {
    width: 42,
    height: 42,
    borderRadius: 10,
    backgroundColor: AppColors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetProductName: { color: AppColors.textPrimary, fontSize: 14.5, fontWeight: '700' },
  sheetProductSub: { color: AppColors.textSecondary, fontSize: 12, marginTop: 2 },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 13,
  },
  actionIconWrap: { width: 34, height: 34, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  actionText: { color: AppColors.textPrimary, fontSize: 14, fontWeight: '500' },
  cancelBtn: { marginTop: 8, paddingVertical: 12, alignItems: 'center' },
  cancelText: { color: AppColors.textSecondary, fontSize: 13.5, fontWeight: '600' },
});
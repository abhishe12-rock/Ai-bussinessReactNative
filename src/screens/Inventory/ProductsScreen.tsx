import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, FlatList, ActivityIndicator, RefreshControl, Alert } from 'react-native';
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
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);

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
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={{ marginTop: 29 }}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Icon name="chevron-left" color={AppColors.primary} size={30} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { marginTop: 29 }]}>Products</Text>
        <View style={{ width: 22 }} />
      </View>

      <View style={styles.searchWrap}>
        <View style={styles.searchBox}>
          <Icon name="search" color={AppColors.textMuted} size={20} />
          <TextInput style={styles.searchInput} placeholder="Search products" placeholderTextColor={AppColors.textMuted} value={query} onChangeText={setQuery} />
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
          contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
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
                <TouchableOpacity onPress={() => setMenuOpenId(menuOpenId === item.id ? null : item.id)}>
                  <Icon name="more-vert" color={AppColors.textMuted} size={20} />
                </TouchableOpacity>
                {menuOpenId === item.id && (
                  <View style={styles.menu}>
                    <TouchableOpacity style={styles.menuItem} onPress={() => { setMenuOpenId(null); navigation.navigate('ProductDetails', { product: item }); }}>
                      <Icon name="visibility" color={AppColors.textSecondary} size={16} /><Text style={styles.menuText}>View</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.menuItem} onPress={() => { setMenuOpenId(null); navigation.navigate('EditProduct', { product: item, onSaved: load }); }}>
                      <Icon name="edit" color={AppColors.textSecondary} size={16} /><Text style={styles.menuText}>Edit</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.menuItem} onPress={() => { setMenuOpenId(null); confirmDelete(item); }}>
                      <Icon name="delete-outline" color={AppColors.danger} size={16} /><Text style={[styles.menuText, { color: AppColors.danger }]}>Delete</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            );
          }}
        />
      )}

      <TouchableOpacity style={styles.fab} onPress={() => navigation.navigate('AddProduct', { onSaved: load })}>
        <Icon name="add" color="#fff" size={20} />
        <Text style={styles.fabText}>Add product</Text>
      </TouchableOpacity>
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
  avatar: { width: 44, height: 44, borderRadius: 12, backgroundColor: AppColors.primarySoft, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  cardName: { color: AppColors.textPrimary, fontSize: 14, fontWeight: '700' },
  cardSub: { color: AppColors.textSecondary, fontSize: 12, marginTop: 2 },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  priceText: { color: AppColors.textPrimary, fontSize: 13, fontWeight: '700' },
  stockPill: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 20 },
  stockText: { fontSize: 10.5, fontWeight: '700' },
  menu: { position: 'absolute', right: 0, top: 40, backgroundColor: AppColors.surface, borderRadius: 12, borderWidth: 1, borderColor: AppColors.border, elevation: 4, zIndex: 10, width: 130 },
  menuItem: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingVertical: 10 },
  menuText: { color: AppColors.textPrimary, fontSize: 13 },
  fab: { position: 'absolute', right: 16, bottom: 20, flexDirection: 'row', alignItems: 'center', backgroundColor: AppColors.primary, borderRadius: 28, paddingVertical: 14, paddingHorizontal: 18, gap: 8, elevation: 4 },
  fabText: { color: '#fff', fontWeight: '600', fontSize: 14 },
});
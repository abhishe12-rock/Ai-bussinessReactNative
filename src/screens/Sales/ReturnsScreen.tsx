import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, FlatList, ActivityIndicator, RefreshControl, Modal, Pressable, Alert } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import Icon from '@react-native-vector-icons/material-icons';
import { useNavigation } from '@react-navigation/native';

import { SalesService, SaleRecord, SaleItemRecord } from '../../services/SalesService';
import { AppColors } from '../theme/AppColors';

const service = new SalesService();

export default function ReturnsScreen() {
  const navigation = useNavigation<any>();
  const [sales, setSales] = useState<SaleRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [sheetSale, setSheetSale] = useState<SaleRecord | null>(null);
  const [sheetItems, setSheetItems] = useState<SaleItemRecord[]>([]);

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

  const openReturnFlow = async (sale: SaleRecord) => {
    try {
      const items = await service.getSaleItems(sale.id);
      if (items.length === 0) return;
      setSheetItems(items);
      setSheetSale(sale);
    } catch (e: any) {
      Alert.alert('Failed to load items', String(e.message ?? e));
    }
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
          <Text style={styles.headerTitle}>Returns</Text>
        </View>
      </View>

      <View style={styles.searchWrap}>
        <View style={styles.searchBox}>
          <Icon name="search" color={AppColors.textMuted} size={20} />
          <TextInput style={styles.searchInput} placeholder="Search invoice to return" placeholderTextColor={AppColors.textMuted} value={query} onChangeText={setQuery} />
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
        <View style={styles.centerFill}><Text style={styles.emptyText}>No invoices found</Text></View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16, paddingBottom: 24 }}
          ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.card} onPress={() => openReturnFlow(item)}>
              <View style={styles.cardIcon}><Icon name="replay" color={AppColors.danger} size={19} /></View>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardInvoice}>{item.invoiceNumber}</Text>
                <Text style={styles.cardCustomer}>{item.customerName ?? 'Unknown'}</Text>
              </View>
              <Text style={styles.cardTotal}>₹{item.total.toFixed(0)}</Text>
              <Icon name="chevron-right" color={AppColors.textMuted} size={20} />
            </TouchableOpacity>
          )}
        />
      )}

      {sheetSale && (
        <ReturnSheet
          sale={sheetSale}
          items={sheetItems}
          onClose={() => setSheetSale(null)}
          onDone={() => { setSheetSale(null); load(); }}
        />
      )}
    </View>
  );
}

function ReturnSheet({ sale, items, onClose, onDone }: {
  sale: SaleRecord; items: SaleItemRecord[]; onClose: () => void; onDone: () => void;
}) {
  const [selectedItem, setSelectedItem] = useState<SaleItemRecord>(items[0]);
  const [returnQty, setReturnQty] = useState(1);
  const [returnable, setReturnable] = useState<number | null>(null);
  const [loadingReturnable, setLoadingReturnable] = useState(true);
  const [reason, setReason] = useState('Customer return');
  const [processing, setProcessing] = useState(false);

  const loadReturnable = async (item: SaleItemRecord) => {
    setLoadingReturnable(true);
    try {
      const qty = await service.getReturnableQuantity(item.id, item.quantity);
      setReturnable(qty);
      setReturnQty(qty > 0 ? 1 : 0);
    } catch {
      setReturnable(item.quantity);
    } finally {
      setLoadingReturnable(false);
    }
  };

  useEffect(() => { loadReturnable(selectedItem); }, []);

  const process = async () => {
    if (!selectedItem || returnQty <= 0) return;
    setProcessing(true);
    try {
      await service.processReturn({ saleId: sale.id, saleItemId: selectedItem.id, returnQty, reason: reason.trim() || 'Customer return' });
      Alert.alert('Return processed — stock updated');
      onDone();
    } catch (e: any) {
      setProcessing(false);
      Alert.alert(String(e.message ?? e));
    }
  };

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.sheetBackdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={() => { }}>
          <View style={styles.sheetHandle} />
          <Text style={styles.sheetTitle}>Return from {sale.invoiceNumber}</Text>

          <Text style={styles.fieldLabel}>Select product</Text>
          <View style={styles.pickerBox}>
            <Picker
              selectedValue={selectedItem.id}
              onValueChange={(id) => {
                const item = items.find((i) => i.id === id)!;
                setSelectedItem(item);
                loadReturnable(item);
              }}
            >
              {items.map((i) => <Picker.Item key={i.id} label={`${i.productName} (sold ${i.quantity})`} value={i.id} />)}
            </Picker>
          </View>

          {loadingReturnable ? (
            <ActivityIndicator color={AppColors.primary} size="small" style={{ alignSelf: 'flex-start', marginTop: 6 }} />
          ) : (
            <Text style={[styles.returnableText, { color: (returnable ?? 0) > 0 ? AppColors.textSecondary : AppColors.danger }]}>
              {(returnable ?? 0) > 0 ? `Available to return: ${returnable}` : 'Already fully returned'}
            </Text>
          )}

          <Text style={styles.fieldLabel}>Return quantity</Text>
          <View style={styles.qtyRow}>
            <TouchableOpacity onPress={() => setReturnQty((q) => Math.max(1, q - 1))}>
              <Icon name="remove-circle-outline" color={AppColors.textMuted} size={24} />
            </TouchableOpacity>
            <Text style={styles.qtyText}>{returnQty}</Text>
            <TouchableOpacity onPress={() => setReturnQty((q) => (returnable != null && q < returnable ? q + 1 : q))}>
              <Icon name="add-circle-outline" color={AppColors.primary} size={24} />
            </TouchableOpacity>
          </View>

          <Text style={styles.fieldLabel}>Reason</Text>
          <View style={styles.reasonBox}>
            <TextInput style={styles.reasonInput} value={reason} onChangeText={setReason} />
          </View>

          <TouchableOpacity
            style={[styles.processButton, (processing || (returnable ?? 0) <= 0) && { opacity: 0.5 }]}
            onPress={process}
            disabled={processing || (returnable ?? 0) <= 0}
          >
            {processing ? <ActivityIndicator color="#fff" /> : <Text style={styles.processButtonText}>Process return</Text>}
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
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
  searchWrap: { padding: 16, paddingBottom: 8 },
  searchBox: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: AppColors.surface,
    borderRadius: 10, borderWidth: 1, borderColor: AppColors.border, paddingHorizontal: 12,
  },
  searchInput: { flex: 1, paddingVertical: 11, marginLeft: 8, color: AppColors.textPrimary, fontSize: 13.5 },
  centerFill: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 },
  errorText: { color: AppColors.textSecondary, fontSize: 12.5, textAlign: 'center', marginTop: 10 },
  retryText: { color: AppColors.primary, marginTop: 10, fontWeight: '600' },
  emptyText: { color: AppColors.textSecondary, fontSize: 13 },
  card: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: AppColors.surface,
    borderRadius: 12, borderWidth: 1, borderColor: AppColors.border, padding: 12, gap: 6,
    shadowColor: AppColors.textPrimary, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.02, shadowRadius: 4, elevation: 1,
  },
  cardIcon: { width: 38, height: 38, borderRadius: 10, backgroundColor: AppColors.dangerSoft, alignItems: 'center', justifyContent: 'center', marginRight: 6 },
  cardInvoice: { color: AppColors.textPrimary, fontSize: 13.5, fontWeight: '700' },
  cardCustomer: { color: AppColors.textSecondary, fontSize: 12, marginTop: 2 },
  cardTotal: { color: AppColors.textPrimary, fontSize: 13.5, fontWeight: '700' },
  sheetBackdrop: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.4)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: AppColors.surface, borderTopLeftRadius: 18, borderTopRightRadius: 18, padding: 16, paddingBottom: 24 },
  sheetHandle: { width: 36, height: 4, borderRadius: 4, backgroundColor: AppColors.border, alignSelf: 'center', marginBottom: 14 },
  sheetTitle: { color: AppColors.textPrimary, fontSize: 15, fontWeight: '700', marginBottom: 16 },
  fieldLabel: { color: AppColors.textSecondary, fontSize: 12, fontWeight: '600', marginBottom: 6, marginTop: 10, textTransform: 'uppercase', letterSpacing: 0.4 },
  pickerBox: { backgroundColor: AppColors.background, borderRadius: 10, borderWidth: 1, borderColor: AppColors.border },
  returnableText: { fontSize: 12, fontWeight: '600', marginTop: 6 },
  qtyRow: { flexDirection: 'row', alignItems: 'center', gap: 16, marginTop: 4 },
  qtyText: { color: AppColors.textPrimary, fontSize: 16, fontWeight: '700' },
  reasonBox: { backgroundColor: AppColors.background, borderRadius: 10, borderWidth: 1, borderColor: AppColors.border, paddingHorizontal: 12 },
  reasonInput: { paddingVertical: 12, color: AppColors.textPrimary, fontSize: 13.5 },
  processButton: {
    backgroundColor: AppColors.danger, borderRadius: 10, height: 46,
    alignItems: 'center', justifyContent: 'center', marginTop: 20,
    shadowColor: AppColors.danger, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 3,
  },
  processButtonText: { color: '#fff', fontSize: 14, fontWeight: '700' },
});
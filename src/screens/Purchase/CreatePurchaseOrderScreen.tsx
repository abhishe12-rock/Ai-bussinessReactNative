import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Modal, Pressable, FlatList, ActivityIndicator, Alert, Platform } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import Icon from '@react-native-vector-icons/material-icons';
import { useNavigation, useRoute } from '@react-navigation/native';

import { SupplierService, SupplierRecord } from '../../services/SupplierService';
import { ProductService, ProductRecord } from '../../services/ProductService';
import { PurchaseService, PurchaseCartItem } from '../../services/PurchaseService';
import { AppColors } from '../theme/AppColors';

const supplierService = new SupplierService();
const productService = new ProductService();
const purchaseService = new PurchaseService();

type CartLine = { productId?: string | null; name: string; price: number; quantity: number };
type PaymentMethod = 'Cash' | 'UPI' | 'Card' | 'Bank Transfer';
const PAYMENT_METHODS: PaymentMethod[] = ['Cash', 'UPI', 'Card', 'Bank Transfer'];

export default function CreatePurchaseOrderScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const onSaved: (() => void) | undefined = route.params?.onSaved;

  const [selectedSupplier, setSelectedSupplier] = useState<SupplierRecord | null>(null);
  const [purchaseDate, setPurchaseDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<CartLine[]>([]);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [taxAmount, setTaxAmount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Cash');
  const [paid, setPaid] = useState('');
  const [creating, setCreating] = useState(false);

  const [supplierSheetOpen, setSupplierSheetOpen] = useState(false);
  const [productSheetOpen, setProductSheetOpen] = useState(false);
  const [suppliers, setSuppliers] = useState<SupplierRecord[]>([]);
  const [products, setProducts] = useState<ProductRecord[]>([]);
  const [supplierError, setSupplierError] = useState<string | null>(null);
  const [productError, setProductError] = useState<string | null>(null);

  const [priceDialogIdx, setPriceDialogIdx] = useState<number | null>(null);
  const [priceInput, setPriceInput] = useState('');
  const [amountDialog, setAmountDialog] = useState<'discount' | 'tax' | null>(null);
  const [amountInput, setAmountInput] = useState('');

  const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const total = Math.max(0, subtotal - discountAmount + taxAmount);
  const paidNum = parseFloat(paid) || 0;

  const openSupplierSheet = async () => {
    setSupplierError(null);
    try { setSuppliers(await supplierService.getSuppliers()); }
    catch (e: any) { setSupplierError(String(e.message ?? e)); }
    setSupplierSheetOpen(true);
  };

  const openProductSheet = async () => {
    setProductError(null);
    try { setProducts(await productService.getProducts()); }
    catch (e: any) { setProductError(String(e.message ?? e)); }
    setProductSheetOpen(true);
  };

  const addProduct = (p: ProductRecord) => {
    setItems((prev) => {
      const idx = prev.findIndex((i) => i.productId === p.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx].quantity++;
        return next;
      }
      return [...prev, { productId: p.id, name: p.name, price: p.purchasePrice, quantity: 1 }];
    });
    setProductSheetOpen(false);
  };

  const create = async () => {
    if (!selectedSupplier || items.length === 0) {
      Alert.alert('Select a supplier and add at least one product');
      return;
    }
    setCreating(true);
    try {
      const cartItems: PurchaseCartItem[] = items.map((i) => ({ productId: i.productId, productName: i.name, purchasePrice: i.price, quantity: i.quantity }));
      await purchaseService.createPurchaseOrder({
        supplierId: selectedSupplier.id, purchaseDate, notes: notes.trim() || null,
        items: cartItems, subtotal, discountAmount, taxAmount, total,
        paymentMethod, paidAmount: paidNum,
      });
      onSaved?.();
      navigation.goBack();
    } catch (e: any) {
      setCreating(false);
      Alert.alert('Failed to create PO', String(e.message ?? e));
    }
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
        <Text style={[styles.headerTitle, { marginTop: 29 }]}>Create purchase order</Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Label text="Supplier" />
        <TouchableOpacity style={styles.selectCard} onPress={openSupplierSheet}>
          <View style={styles.selectIcon}><Icon name="local-shipping" color={AppColors.info} size={19} /></View>
          <Text style={[styles.selectText, !selectedSupplier && styles.selectPlaceholder]}>{selectedSupplier?.name ?? 'Select supplier *'}</Text>
          <Icon name="chevron-right" color={AppColors.textMuted} size={20} />
        </TouchableOpacity>

        <Label text="Purchase date" />
        <TouchableOpacity style={styles.dateRow} onPress={() => setShowDatePicker(true)}>
          <Icon name="calendar-today" color={AppColors.textMuted} size={18} />
          <Text style={styles.dateText}>{purchaseDate.toLocaleDateString()}</Text>
        </TouchableOpacity>
        {showDatePicker && (
          <DateTimePicker value={purchaseDate} mode="date" onChange={(_, date) => { setShowDatePicker(Platform.OS === 'ios'); if (date) setPurchaseDate(date); }} />
        )}

        <View style={styles.fieldBox}>
          <TextInput style={styles.fieldInput} placeholder="Notes (optional)" placeholderTextColor={AppColors.textMuted} value={notes} onChangeText={setNotes} />
        </View>

        <View style={styles.stepRow}>
          <Label text="Products" />
          <TouchableOpacity style={styles.addLink} onPress={openProductSheet}>
            <Icon name="add" color={AppColors.primary} size={16} />
            <Text style={styles.addLinkText}>Add product</Text>
          </TouchableOpacity>
        </View>

        {items.length === 0 ? (
          <View style={styles.emptyItems}><Text style={styles.emptyItemsText}>No products added yet</Text></View>
        ) : (
          <View style={styles.itemsCard}>
            {items.map((item, i) => (
              <View key={i} style={[styles.itemBlock, i !== items.length - 1 && styles.itemBlockBorder]}>
                <View style={styles.itemTopRow}>
                  <Text style={styles.itemName}>{item.name}</Text>
                  <TouchableOpacity onPress={() => setItems((prev) => prev.filter((_, idx) => idx !== i))}>
                    <Icon name="close" color={AppColors.danger} size={18} />
                  </TouchableOpacity>
                </View>
                <View style={styles.itemBottomRow}>
                  <TouchableOpacity style={styles.priceLink} onPress={() => { setPriceDialogIdx(i); setPriceInput(String(item.price)); }}>
                    <Text style={styles.priceLinkText}>₹{item.price.toFixed(0)}</Text>
                    <Icon name="edit" color={AppColors.primary} size={12} />
                  </TouchableOpacity>
                  <View style={{ flex: 1 }} />
                  <TouchableOpacity onPress={() => setItems((prev) => prev.map((it, idx) => idx === i && it.quantity > 1 ? { ...it, quantity: it.quantity - 1 } : it))}>
                    <Icon name="remove-circle-outline" color={AppColors.textMuted} size={20} />
                  </TouchableOpacity>
                  <Text style={styles.itemQty}>{item.quantity}</Text>
                  <TouchableOpacity onPress={() => setItems((prev) => prev.map((it, idx) => idx === i ? { ...it, quantity: it.quantity + 1 } : it))}>
                    <Icon name="add-circle-outline" color={AppColors.primary} size={20} />
                  </TouchableOpacity>
                  <Text style={styles.itemTotal}>₹{(item.price * item.quantity).toFixed(0)}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        <View style={styles.summaryCard}>
          <SummaryLine label="Subtotal" value={`₹${subtotal.toFixed(0)}`} />
          <TouchableOpacity onPress={() => { setAmountDialog('discount'); setAmountInput(discountAmount > 0 ? String(discountAmount) : ''); }}>
            <SummaryLine label="Discount" value={`- ₹${discountAmount.toFixed(0)}`} color={AppColors.danger} editable />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => { setAmountDialog('tax'); setAmountInput(taxAmount > 0 ? String(taxAmount) : ''); }}>
            <SummaryLine label="Tax" value={`+ ₹${taxAmount.toFixed(0)}`} color={AppColors.info} editable />
          </TouchableOpacity>
          <View style={styles.divider} />
          <SummaryLine label="Total" value={`₹${total.toFixed(0)}`} isTotal />
        </View>

        <Label text="Payment" />
        <View style={styles.chipRow}>
          {PAYMENT_METHODS.map((m) => {
            const selected = paymentMethod === m;
            return (
              <TouchableOpacity key={m} style={[styles.chip, selected && styles.chipSelected]} onPress={() => setPaymentMethod(m)}>
                <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{m}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.fieldBox}>
          <Icon name="currency-rupee" color={AppColors.textMuted} size={20} />
          <TextInput style={styles.fieldInput} placeholder="Paid amount" placeholderTextColor={AppColors.textMuted} value={paid} onChangeText={setPaid} keyboardType="numeric" />
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={[styles.createButton, creating && { opacity: 0.6 }]} onPress={create} disabled={creating}>
          {creating ? <ActivityIndicator color="#fff" /> : <Text style={styles.createButtonText}>Create purchase order · ₹{total.toFixed(0)}</Text>}
        </TouchableOpacity>
      </View>

      {/* Supplier sheet */}
      <Modal visible={supplierSheetOpen} transparent animationType="slide" onRequestClose={() => setSupplierSheetOpen(false)}>
        <Pressable style={styles.sheetBackdrop} onPress={() => setSupplierSheetOpen(false)}>
          <View style={styles.sheet}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>Select supplier</Text>
            {supplierError ? (
              <Text style={styles.sheetError}>Failed to load: {supplierError}</Text>
            ) : suppliers.length === 0 ? (
              <Text style={styles.sheetEmpty}>No suppliers yet. Add one from Inventory → Suppliers first.</Text>
            ) : (
              <FlatList
                data={suppliers} keyExtractor={(item) => item.id} style={{ maxHeight: 400 }}
                renderItem={({ item }) => (
                  <TouchableOpacity style={styles.listTile} onPress={() => { setSelectedSupplier(item); setSupplierSheetOpen(false); }}>
                    <Icon name="local-shipping" color={AppColors.textSecondary} size={20} />
                    <Text style={styles.listTileTitle}>{item.name}</Text>
                  </TouchableOpacity>
                )}
              />
            )}
          </View>
        </Pressable>
      </Modal>

      {/* Product sheet */}
      <Modal visible={productSheetOpen} transparent animationType="slide" onRequestClose={() => setProductSheetOpen(false)}>
        <Pressable style={styles.sheetBackdrop} onPress={() => setProductSheetOpen(false)}>
          <View style={styles.sheet}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>Select product</Text>
            {productError ? (
              <Text style={styles.sheetError}>Failed to load: {productError}</Text>
            ) : products.length === 0 ? (
              <Text style={styles.sheetEmpty}>No products yet.</Text>
            ) : (
              <FlatList
                data={products} keyExtractor={(item) => item.id} style={{ maxHeight: 400 }}
                renderItem={({ item }) => (
                  <TouchableOpacity style={styles.listTile} onPress={() => addProduct(item)}>
                    <View style={styles.productIcon}><Icon name="smartphone" color={AppColors.primary} size={18} /></View>
                    <View style={{ marginLeft: 12 }}>
                      <Text style={styles.listTileTitle}>{item.name}</Text>
                      <Text style={styles.listTileSub}>Current stock: {item.quantity}</Text>
                    </View>
                  </TouchableOpacity>
                )}
              />
            )}
          </View>
        </Pressable>
      </Modal>

      {/* Price dialog */}
      <Modal visible={priceDialogIdx !== null} transparent animationType="fade" onRequestClose={() => setPriceDialogIdx(null)}>
        <View style={styles.dialogBackdrop}>
          <View style={styles.dialog}>
            <Text style={styles.dialogTitle}>Purchase price</Text>
            <TextInput style={styles.dialogInput} keyboardType="numeric" value={priceInput} onChangeText={setPriceInput} />
            <View style={styles.dialogActions}>
              <TouchableOpacity onPress={() => setPriceDialogIdx(null)}><Text style={styles.dialogCancel}>Cancel</Text></TouchableOpacity>
              <TouchableOpacity onPress={() => {
                if (priceDialogIdx !== null) {
                  const val = parseFloat(priceInput);
                  setItems((prev) => prev.map((it, idx) => idx === priceDialogIdx ? { ...it, price: isNaN(val) ? it.price : val } : it));
                }
                setPriceDialogIdx(null);
              }}><Text style={styles.dialogSave}>Save</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Discount/Tax dialog */}
      <Modal visible={amountDialog !== null} transparent animationType="fade" onRequestClose={() => setAmountDialog(null)}>
        <View style={styles.dialogBackdrop}>
          <View style={styles.dialog}>
            <Text style={styles.dialogTitle}>{amountDialog === 'discount' ? 'Discount' : 'Tax'}</Text>
            <TextInput style={styles.dialogInput} keyboardType="numeric" value={amountInput} onChangeText={setAmountInput} />
            <View style={styles.dialogActions}>
              <TouchableOpacity onPress={() => setAmountDialog(null)}><Text style={styles.dialogCancel}>Cancel</Text></TouchableOpacity>
              <TouchableOpacity onPress={() => {
                const val = parseFloat(amountInput) || 0;
                if (amountDialog === 'discount') setDiscountAmount(val);
                else setTaxAmount(val);
                setAmountDialog(null);
              }}><Text style={styles.dialogSave}>Apply</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function Label({ text }: { text: string }) {
  return <Text style={styles.label}>{text}</Text>;
}

function SummaryLine({ label, value, color, isTotal, editable }: { label: string; value: string; color?: string; isTotal?: boolean; editable?: boolean }) {
  return (
    <View style={styles.summaryLine}>
      <Text style={[styles.summaryLabel, isTotal && styles.summaryLabelTotal]}>{label}</Text>
      {editable && <Icon name="edit" color={AppColors.textMuted} size={13} style={{ marginLeft: 4 }} />}
      <View style={{ flex: 1 }} />
      <Text style={[styles.summaryValue, { color: color ?? (isTotal ? AppColors.primary : AppColors.textPrimary) }, isTotal && styles.summaryValueTotal]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: AppColors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, backgroundColor: AppColors.surface, borderBottomWidth: 1, borderColor: AppColors.border },
  headerTitle: { fontSize: 17, fontWeight: '700', color: AppColors.textPrimary },
  content: { padding: 16, paddingBottom: 24 },
  label: { color: AppColors.textPrimary, fontSize: 14, fontWeight: '700', marginTop: 12, marginBottom: 8 },
  selectCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: AppColors.surface, borderRadius: 14, borderWidth: 1, borderColor: AppColors.border, padding: 14, gap: 12 },
  selectIcon: { width: 38, height: 38, borderRadius: 11, backgroundColor: AppColors.infoSoft, alignItems: 'center', justifyContent: 'center' },
  selectText: { flex: 1, color: AppColors.textPrimary, fontSize: 14, fontWeight: '600' },
  selectPlaceholder: { color: AppColors.textMuted },
  dateRow: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: AppColors.surface, borderRadius: 12, borderWidth: 1, borderColor: AppColors.border, padding: 14 },
  dateText: { color: AppColors.textPrimary, fontSize: 14 },
  fieldBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: AppColors.surface, borderRadius: 12, borderWidth: 1, borderColor: AppColors.border, paddingHorizontal: 14, marginTop: 16 },
  fieldInput: { flex: 1, paddingVertical: 14, marginLeft: 10, color: AppColors.textPrimary, fontSize: 14 },
  stepRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  addLink: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  addLinkText: { color: AppColors.primary, fontSize: 12.5, fontWeight: '600' },
  emptyItems: { backgroundColor: AppColors.surface, borderRadius: 14, borderWidth: 1, borderColor: AppColors.border, padding: 20, alignItems: 'center' },
  emptyItemsText: { color: AppColors.textMuted, fontSize: 12.5 },
  itemsCard: { backgroundColor: AppColors.surface, borderRadius: 14, borderWidth: 1, borderColor: AppColors.border },
  itemBlock: { paddingHorizontal: 14, paddingVertical: 11 },
  itemBlockBorder: { borderBottomWidth: 1, borderColor: AppColors.border },
  itemTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  itemName: { flex: 1, color: AppColors.textPrimary, fontSize: 13.5, fontWeight: '600' },
  itemBottomRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8, gap: 4 },
  priceLink: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  priceLinkText: { color: AppColors.primary, fontSize: 13, fontWeight: '700' },
  itemQty: { color: AppColors.textPrimary, fontSize: 13, fontWeight: '600', marginHorizontal: 4 },
  itemTotal: { color: AppColors.textPrimary, fontSize: 13.5, fontWeight: '700', marginLeft: 10 },
  summaryCard: { backgroundColor: AppColors.surface, borderRadius: 14, borderWidth: 1, borderColor: AppColors.border, padding: 14, marginTop: 22 },
  summaryLine: { flexDirection: 'row', alignItems: 'center', paddingVertical: 5 },
  summaryLabel: { color: AppColors.textSecondary, fontSize: 13 },
  summaryLabelTotal: { color: AppColors.textPrimary, fontSize: 14.5, fontWeight: '700' },
  summaryValue: { fontSize: 13, fontWeight: '700' },
  summaryValueTotal: { fontSize: 17 },
  divider: { height: 1, backgroundColor: AppColors.border, marginVertical: 10 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: 20, backgroundColor: AppColors.surface, borderWidth: 1, borderColor: AppColors.border },
  chipSelected: { backgroundColor: AppColors.primary, borderColor: AppColors.primary },
  chipText: { color: AppColors.textSecondary, fontSize: 12.5, fontWeight: '600' },
  chipTextSelected: { color: '#fff' },
  footer: { padding: 16, backgroundColor: AppColors.surface, borderTopWidth: 1, borderColor: AppColors.border },
  createButton: { backgroundColor: AppColors.primary, borderRadius: 14, height: 52, alignItems: 'center', justifyContent: 'center' },
  createButtonText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  sheetBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: AppColors.surface, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 16, paddingBottom: 24 },
  sheetHandle: { width: 36, height: 4, borderRadius: 4, backgroundColor: AppColors.border, alignSelf: 'center', marginBottom: 14 },
  sheetTitle: { color: AppColors.textPrimary, fontSize: 15, fontWeight: '700', marginBottom: 10 },
  sheetError: { color: AppColors.danger, fontSize: 12.5, padding: 16 },
  sheetEmpty: { color: AppColors.textSecondary, fontSize: 12.5, padding: 16 },
  listTile: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10 },
  listTileTitle: { color: AppColors.textPrimary, fontSize: 14, marginLeft: 12 },
  listTileSub: { color: AppColors.textSecondary, fontSize: 12, marginTop: 2 },
  productIcon: { width: 38, height: 38, borderRadius: 10, backgroundColor: AppColors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  dialogBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', alignItems: 'center', justifyContent: 'center' },
  dialog: { backgroundColor: AppColors.surface, borderRadius: 16, padding: 20, width: '85%' },
  dialogTitle: { color: AppColors.textPrimary, fontSize: 16, fontWeight: '700', marginBottom: 14 },
  dialogInput: { borderWidth: 1, borderColor: AppColors.border, borderRadius: 10, padding: 12, color: AppColors.textPrimary },
  dialogActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 20, marginTop: 16 },
  dialogCancel: { color: AppColors.textSecondary, fontSize: 14 },
  dialogSave: { color: AppColors.primary, fontWeight: '700', fontSize: 14 },
});
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Modal, Pressable, FlatList, Alert, ActivityIndicator } from 'react-native';
import Icon from '@react-native-vector-icons/material-icons';
import { useNavigation, useRoute } from '@react-navigation/native';

import { CustomerService, CustomerRecord } from '../../services/CustomerService';
import { ProductService, ProductRecord } from '../../services/ProductService';
import { SalesService, SaleCartItem } from '../../services/SalesService';
import { AppColors } from '../theme/AppColors';

const customerService = new CustomerService();
const productService = new ProductService();
const salesService = new SalesService();

type CartLine = { productId?: string | null; name: string; price: number; stock?: number | null; quantity: number };
type PaymentMethod = 'Cash' | 'UPI' | 'Card' | 'Bank Transfer' | 'EMI';
const PAYMENT_METHODS: PaymentMethod[] = ['Cash', 'UPI', 'Card', 'Bank Transfer', 'EMI'];

export default function NewSaleScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const onSaved: (() => void) | undefined = route.params?.onSaved;

  const [selectedCustomer, setSelectedCustomer] = useState<CustomerRecord | null>(null);
  const [items, setItems] = useState<CartLine[]>([]);
  const [discountPercent, setDiscountPercent] = useState(0);
  const [taxPercent, setTaxPercent] = useState(18);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Cash');
  const [paid, setPaid] = useState('');
  const [completing, setCompleting] = useState(false);

  const [customerSheetOpen, setCustomerSheetOpen] = useState(false);
  const [productSheetOpen, setProductSheetOpen] = useState(false);
  const [customers, setCustomers] = useState<CustomerRecord[]>([]);
  const [products, setProducts] = useState<ProductRecord[]>([]);
  const [customerError, setCustomerError] = useState<string | null>(null);
  const [productError, setProductError] = useState<string | null>(null);
  const [discountDialogOpen, setDiscountDialogOpen] = useState(false);
  const [taxDialogOpen, setTaxDialogOpen] = useState(false);
  const [discountInput, setDiscountInput] = useState('');
  const [taxInput, setTaxInput] = useState('18');
  const [successOpen, setSuccessOpen] = useState(false);

  const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const discountAmount = subtotal * (discountPercent / 100);
  const afterDiscount = subtotal - discountAmount;
  const tax = afterDiscount * (taxPercent / 100);
  const grandTotal = afterDiscount + tax;
  const paidNum = parseFloat(paid) || 0;
  const remaining = Math.max(0, grandTotal - paidNum);

  const openCustomerSheet = async () => {
    setCustomerError(null);
    try { setCustomers(await customerService.getCustomers()); }
    catch (e: any) { setCustomerError(String(e.message ?? e)); }
    setCustomerSheetOpen(true);
  };

  const openProductSheet = async () => {
    setProductError(null);
    try { setProducts(await productService.getProducts()); }
    catch (e: any) { setProductError(String(e.message ?? e)); }
    setProductSheetOpen(true);
  };

  const addProduct = (p: ProductRecord) => {
    setItems((prev) => {
      const existingIdx = prev.findIndex((i) => i.productId === p.id);
      if (existingIdx >= 0) {
        const next = [...prev];
        if (next[existingIdx].quantity < p.quantity) next[existingIdx].quantity++;
        return next;
      }
      return [...prev, { productId: p.id, name: p.name, price: p.sellingPrice, stock: p.quantity, quantity: 1 }];
    });
    setProductSheetOpen(false);
  };

  const incrementQty = (i: number) => {
    const item = items[i];
    if (item.stock != null && item.quantity >= item.stock) {
      Alert.alert('Cannot exceed available stock');
      return;
    }
    setItems((prev) => prev.map((it, idx) => idx === i ? { ...it, quantity: it.quantity + 1 } : it));
  };

  const decrementQty = (i: number) => {
    setItems((prev) => {
      const item = prev[i];
      if (item.quantity > 1) return prev.map((it, idx) => idx === i ? { ...it, quantity: it.quantity - 1 } : it);
      return prev.filter((_, idx) => idx !== i);
    });
  };

  const completeSale = async () => {
    if (!selectedCustomer || items.length === 0) {
      Alert.alert('Select a customer and add at least one product');
      return;
    }
    setCompleting(true);
    try {
      const cartItems: SaleCartItem[] = items.map((i) => ({ productId: i.productId, productName: i.name, price: i.price, quantity: i.quantity }));
      await salesService.completeSale({
        customerId: selectedCustomer.id, items: cartItems, subtotal,
        discountPercent, discountAmount, taxPercent, taxAmount: tax,
        total: grandTotal, paymentMethod, paidAmount: paidNum,
      });
      setCompleting(false);
      setSuccessOpen(true);
    } catch (e: any) {
      setCompleting(false);
      Alert.alert('Failed to complete sale', String(e.message ?? e));
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
          <Text style={styles.headerTitle}>New sale</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <StepLabel title="Customer" />
        <TouchableOpacity style={styles.selectCard} onPress={openCustomerSheet}>
          <View style={styles.selectIcon}><Icon name={selectedCustomer ? 'person' : 'person-search'} color={AppColors.primary} size={19} /></View>
          {selectedCustomer ? (
            <View style={{ flex: 1 }}>
              <Text style={styles.selectedName}>{selectedCustomer.name}</Text>
              <Text style={styles.selectedSub}>{selectedCustomer.phone}</Text>
            </View>
          ) : (
            <Text style={styles.selectPlaceholder}>Select customer</Text>
          )}
          <Icon name="chevron-right" color={AppColors.textMuted} size={20} />
        </TouchableOpacity>

        <View style={styles.stepRow}>
          <StepLabel title="Products" />
          <TouchableOpacity style={styles.addLink} onPress={openProductSheet}>
            <Icon name="add" color={AppColors.primary} size={16} />
            <Text style={styles.addLinkText}>Add</Text>
          </TouchableOpacity>
        </View>

        {items.length === 0 ? (
          <View style={styles.emptyProducts}><Text style={styles.emptyProductsText}>No products added yet</Text></View>
        ) : (
          <View style={styles.itemsCard}>
            {items.map((item, i) => (
              <View key={i} style={[styles.itemRow, i !== items.length - 1 && styles.itemRowBorder]}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.itemName}>{item.name}</Text>
                  <Text style={styles.itemMeta}>₹{item.price.toFixed(0)} × {item.quantity}</Text>
                </View>
                <TouchableOpacity onPress={() => decrementQty(i)}><Icon name="remove-circle-outline" color={AppColors.textMuted} size={20} /></TouchableOpacity>
                <Text style={styles.itemQty}>{item.quantity}</Text>
                <TouchableOpacity onPress={() => incrementQty(i)}><Icon name="add-circle-outline" color={AppColors.primary} size={20} /></TouchableOpacity>
                <Text style={styles.itemTotal}>₹{(item.price * item.quantity).toFixed(0)}</Text>
              </View>
            ))}
          </View>
        )}

        <StepLabel title="Discount & tax" />
        <View style={styles.summaryCard}>
          <SummaryLine label="Subtotal" value={`₹${subtotal.toFixed(0)}`} />
          <TouchableOpacity onPress={() => { setDiscountInput(discountPercent > 0 ? String(discountPercent) : ''); setDiscountDialogOpen(true); }}>
            <SummaryLine label={`Discount (${discountPercent.toFixed(0)}%)`} value={`- ₹${discountAmount.toFixed(0)}`} color={AppColors.danger} editable />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => { setTaxInput(String(taxPercent)); setTaxDialogOpen(true); }}>
            <SummaryLine label={`Tax (${taxPercent.toFixed(0)}%)`} value={`+ ₹${tax.toFixed(0)}`} color={AppColors.info} editable />
          </TouchableOpacity>
          <View style={styles.divider} />
          <SummaryLine label="Total" value={`₹${grandTotal.toFixed(0)}`} isTotal />
        </View>

        <StepLabel title="Payment" />
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
        {paid.length > 0 && (
          <Text style={[styles.remainingText, { color: remaining > 0 ? AppColors.danger : AppColors.success }]}>
            {remaining > 0 ? `Remaining: ₹${remaining.toFixed(0)}` : 'Fully paid'}
          </Text>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={[styles.completeButton, completing && { opacity: 0.6 }]} onPress={completeSale} disabled={completing}>
          {completing ? <ActivityIndicator color="#fff" /> : <Text style={styles.completeButtonText}>Complete sale · ₹{grandTotal.toFixed(0)}</Text>}
        </TouchableOpacity>
      </View>

      {/* Customer sheet */}
      <Modal visible={customerSheetOpen} transparent animationType="slide" onRequestClose={() => setCustomerSheetOpen(false)}>
        <Pressable style={styles.sheetBackdrop} onPress={() => setCustomerSheetOpen(false)}>
          <View style={styles.sheet}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>Select customer</Text>
            {customerError ? (
              <Text style={styles.sheetError}>Failed to load customers: {customerError}</Text>
            ) : customers.length === 0 ? (
              <Text style={styles.sheetEmpty}>No customers yet. Add one from the Customers screen first.</Text>
            ) : (
              <FlatList
                data={customers}
                keyExtractor={(item) => item.id}
                style={{ maxHeight: 400 }}
                renderItem={({ item }) => (
                  <TouchableOpacity style={styles.listTile} onPress={() => { setSelectedCustomer(item); setCustomerSheetOpen(false); }}>
                    <Icon name="person-outline" color={AppColors.textSecondary} size={20} />
                    <View style={{ marginLeft: 12 }}>
                      <Text style={styles.listTileTitle}>{item.name}</Text>
                      <Text style={styles.listTileSub}>{item.phone}</Text>
                    </View>
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
            <Text style={styles.sheetTitle}>Search product</Text>
            {productError ? (
              <Text style={styles.sheetError}>Failed to load products: {productError}</Text>
            ) : products.length === 0 ? (
              <Text style={styles.sheetEmpty}>No products yet. Add one from the Products screen first.</Text>
            ) : (
              <FlatList
                data={products}
                keyExtractor={(item) => item.id}
                style={{ maxHeight: 400 }}
                renderItem={({ item }) => {
                  const outOfStock = item.quantity <= 0;
                  return (
                    <TouchableOpacity style={styles.listTile} onPress={() => !outOfStock && addProduct(item)} disabled={outOfStock}>
                      <View style={[styles.productIcon, { backgroundColor: outOfStock ? AppColors.border : AppColors.primarySoft }]}>
                        <Icon name="smartphone" color={outOfStock ? AppColors.textMuted : AppColors.primary} size={18} />
                      </View>
                      <View style={{ marginLeft: 12 }}>
                        <Text style={styles.listTileTitle}>{item.name}</Text>
                        <Text style={[styles.listTileSub, outOfStock && { color: AppColors.danger }]}>
                          {outOfStock ? 'Out of stock' : `₹${item.sellingPrice.toFixed(0)} · Stock: ${item.quantity}`}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                }}
              />
            )}
          </View>
        </Pressable>
      </Modal>

      {/* Discount dialog */}
      <Modal visible={discountDialogOpen} transparent animationType="fade" onRequestClose={() => setDiscountDialogOpen(false)}>
        <View style={styles.dialogBackdrop}>
          <View style={styles.dialog}>
            <Text style={styles.dialogTitle}>Discount</Text>
            <TextInput style={styles.dialogInput} placeholder="Discount percentage" placeholderTextColor={AppColors.textMuted} keyboardType="numeric" value={discountInput} onChangeText={setDiscountInput} />
            <View style={styles.dialogActions}>
              <TouchableOpacity onPress={() => setDiscountDialogOpen(false)}><Text style={styles.dialogCancel}>Cancel</Text></TouchableOpacity>
              <TouchableOpacity onPress={() => { setDiscountPercent(parseFloat(discountInput) || 0); setDiscountDialogOpen(false); }}><Text style={styles.dialogApply}>Apply</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Tax dialog */}
      <Modal visible={taxDialogOpen} transparent animationType="fade" onRequestClose={() => setTaxDialogOpen(false)}>
        <View style={styles.dialogBackdrop}>
          <View style={styles.dialog}>
            <Text style={styles.dialogTitle}>Tax rate</Text>
            <TextInput style={styles.dialogInput} placeholder="GST / tax percentage" placeholderTextColor={AppColors.textMuted} keyboardType="numeric" value={taxInput} onChangeText={setTaxInput} />
            <View style={styles.dialogActions}>
              <TouchableOpacity onPress={() => setTaxDialogOpen(false)}><Text style={styles.dialogCancel}>Cancel</Text></TouchableOpacity>
              <TouchableOpacity onPress={() => { setTaxPercent(parseFloat(taxInput) || 0); setTaxDialogOpen(false); }}><Text style={styles.dialogApply}>Apply</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Success sheet */}
      <Modal visible={successOpen} transparent animationType="slide" onRequestClose={() => setSuccessOpen(false)}>
        <View style={styles.sheetBackdrop}>
          <View style={[styles.sheet, { alignItems: 'center' }]}>
            <View style={styles.successIcon}><Icon name="check" color={AppColors.success} size={32} /></View>
            <Text style={styles.successTitle}>Sale completed successfully</Text>
            <Text style={styles.successSub}>₹{grandTotal.toFixed(0)} · {selectedCustomer?.name}</Text>
            <TouchableOpacity
              style={styles.doneButton}
              onPress={() => { setSuccessOpen(false); onSaved?.(); navigation.goBack(); }}
            >
              <Text style={styles.doneButtonText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function StepLabel({ title }: { title: string }) {
  return <Text style={styles.stepLabel}>{title}</Text>;
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
  content: { padding: 16, paddingBottom: 32 },
  stepLabel: { color: AppColors.textPrimary, fontSize: 13.5, fontWeight: '700', marginTop: 12, marginBottom: 8, letterSpacing: -0.2 },
  stepRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  addLink: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  addLinkText: { color: AppColors.primary, fontSize: 12.5, fontWeight: '700' },
  selectCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: AppColors.surface,
    borderRadius: 12, borderWidth: 1, borderColor: AppColors.border, padding: 12, gap: 12,
    shadowColor: AppColors.textPrimary, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.02, shadowRadius: 4, elevation: 1,
  },
  selectIcon: { width: 36, height: 36, borderRadius: 10, backgroundColor: AppColors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  selectPlaceholder: { flex: 1, color: AppColors.textMuted, fontSize: 13.5, fontWeight: '500' },
  selectedName: { color: AppColors.textPrimary, fontSize: 13.5, fontWeight: '700' },
  selectedSub: { color: AppColors.textSecondary, fontSize: 11.5, marginTop: 1 },
  emptyProducts: { backgroundColor: AppColors.surface, borderRadius: 12, borderWidth: 1, borderColor: AppColors.border, padding: 18, alignItems: 'center' },
  emptyProductsText: { color: AppColors.textMuted, fontSize: 12.5 },
  itemsCard: {
    backgroundColor: AppColors.surface, borderRadius: 12, borderWidth: 1, borderColor: AppColors.border,
    shadowColor: AppColors.textPrimary, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.02, shadowRadius: 4, elevation: 1,
  },
  itemRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 10, gap: 8 },
  itemRowBorder: { borderBottomWidth: 1, borderColor: AppColors.border },
  itemName: { color: AppColors.textPrimary, fontSize: 13, fontWeight: '600' },
  itemMeta: { color: AppColors.textSecondary, fontSize: 11.5, marginTop: 1 },
  itemQty: { color: AppColors.textPrimary, fontSize: 13, fontWeight: '600', marginHorizontal: 4 },
  itemTotal: { color: AppColors.textPrimary, fontSize: 13.5, fontWeight: '700', marginLeft: 6 },
  summaryCard: {
    backgroundColor: AppColors.surface, borderRadius: 12, borderWidth: 1, borderColor: AppColors.border, padding: 14,
    shadowColor: AppColors.textPrimary, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.02, shadowRadius: 4, elevation: 1,
  },
  summaryLine: { flexDirection: 'row', alignItems: 'center', paddingVertical: 5 },
  summaryLabel: { color: AppColors.textSecondary, fontSize: 13 },
  summaryLabelTotal: { color: AppColors.textPrimary, fontSize: 14, fontWeight: '700' },
  summaryValue: { fontSize: 13, fontWeight: '700' },
  summaryValueTotal: { fontSize: 17 },
  divider: { height: 1, backgroundColor: AppColors.border, marginVertical: 10 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 13, paddingVertical: 8, borderRadius: 8, backgroundColor: AppColors.surface, borderWidth: 1, borderColor: AppColors.border },
  chipSelected: { backgroundColor: AppColors.primary, borderColor: AppColors.primary },
  chipText: { color: AppColors.textSecondary, fontSize: 12, fontWeight: '600' },
  chipTextSelected: { color: '#fff' },
  fieldBox: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: AppColors.surface,
    borderRadius: 10, borderWidth: 1, borderColor: AppColors.border, paddingHorizontal: 12, marginTop: 12,
  },
  fieldInput: { flex: 1, paddingVertical: 12, marginLeft: 8, color: AppColors.textPrimary, fontSize: 13.5 },
  remainingText: { fontSize: 12, fontWeight: '600', marginTop: 8 },
  footer: { paddingHorizontal: 16, paddingTop: 14, paddingBottom: 48, backgroundColor: AppColors.surface, borderTopWidth: 1, borderColor: AppColors.border },
  completeButton: { backgroundColor: AppColors.primary, borderRadius: 12, height: 48, alignItems: 'center', justifyContent: 'center' },
  completeButtonText: { color: '#fff', fontSize: 14.5, fontWeight: '700' },
  sheetBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: AppColors.surface, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 16, paddingBottom: 40 },
  sheetHandle: { width: 36, height: 4, borderRadius: 4, backgroundColor: AppColors.border, alignSelf: 'center', marginBottom: 14 },
  sheetTitle: { color: AppColors.textPrimary, fontSize: 15, fontWeight: '700', marginBottom: 10 },
  sheetError: { color: AppColors.danger, fontSize: 12.5, padding: 16 },
  sheetEmpty: { color: AppColors.textSecondary, fontSize: 12.5, padding: 16 },
  listTile: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10 },
  listTileTitle: { color: AppColors.textPrimary, fontSize: 14 },
  listTileSub: { color: AppColors.textSecondary, fontSize: 12, marginTop: 2 },
  productIcon: { width: 38, height: 38, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  dialogBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', alignItems: 'center', justifyContent: 'center' },
  dialog: { backgroundColor: AppColors.surface, borderRadius: 16, padding: 20, width: '85%' },
  dialogTitle: { color: AppColors.textPrimary, fontSize: 16, fontWeight: '700', marginBottom: 14 },
  dialogInput: { borderWidth: 1, borderColor: AppColors.border, borderRadius: 10, padding: 12, color: AppColors.textPrimary },
  dialogActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 20, marginTop: 16 },
  dialogCancel: { color: AppColors.textSecondary, fontSize: 14 },
  dialogApply: { color: AppColors.primary, fontWeight: '700', fontSize: 14 },
  successIcon: { width: 64, height: 64, borderRadius: 32, backgroundColor: AppColors.successSoft, alignItems: 'center', justifyContent: 'center' },
  successTitle: { color: AppColors.textPrimary, fontSize: 16, fontWeight: '700', marginTop: 16 },
  successSub: { color: AppColors.textSecondary, fontSize: 13, marginTop: 4 },
  doneButton: { backgroundColor: AppColors.primary, borderRadius: 12, height: 46, alignItems: 'center', justifyContent: 'center', width: '100%', marginTop: 20 },
  doneButtonText: { color: '#fff', fontSize: 14, fontWeight: '600' },
});
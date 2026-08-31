import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, Alert, Modal, BackHandler } from 'react-native';
import Icon from '@react-native-vector-icons/material-icons';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';

import { OrderService, OrderRecord, OrderItemRecord, OrderStatus, orderStatusToString, orderRemaining } from '../../services/OrderService';
import { AppColors } from '../theme/AppColors';

const service = new OrderService();

function statusColor(status: OrderStatus) {
  switch (status) {
    case 'pending': return AppColors.warning;
    case 'processing': return AppColors.info;
    case 'delivered': return AppColors.success;
    case 'cancelled': return AppColors.danger;
  }
}
function statusBg(status: OrderStatus) {
  switch (status) {
    case 'pending': return AppColors.warningSoft;
    case 'processing': return AppColors.infoSoft;
    case 'delivered': return AppColors.successSoft;
    case 'cancelled': return AppColors.dangerSoft;
  }
}

export default function OrderDetailsScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const order: OrderRecord = route.params.order;
  const onChanged: (() => void) | undefined = route.params?.onChanged;

  const [items, setItems] = useState<OrderItemRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [status, setStatus] = useState<OrderStatus>(order.status);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [reason, setReason] = useState('Customer cancelled the order');

  const load = async () => {
    setLoading(true);
    try { setItems(await service.getOrderItems(order.id)); }
    catch (e: any) { Alert.alert('Failed to load', String(e.message ?? e)); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  // Notify caller of changed status when leaving, mirroring the
  // Flutter WillPopScope(onWillPop -> Navigator.pop(context, changed)).
  const goBackWithResult = () => {
    if (status !== order.status) onChanged?.();
    navigation.goBack();
  };

  useFocusEffect(
    React.useCallback(() => {
      const onBackPress = () => {
        goBackWithResult();
        return true;
      };
      const sub = BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => sub.remove();
    }, [status])
  );

  const updateStatus = async (newStatus: OrderStatus, cancelReason?: string) => {
    setUpdating(true);
    try {
      await service.updateOrderStatus({ orderId: order.id, newStatus, reason: cancelReason });
      setStatus(newStatus);
    } catch (e: any) {
      Alert.alert(String(e.message ?? e));
    } finally {
      setUpdating(false);
    }
  };

  const confirmCancel = () => {
    setCancelDialogOpen(false);
    updateStatus('cancelled', reason.trim());
  };

  const remaining = orderRemaining(order);

  if (loading) return <View style={styles.centerFill}><ActivityIndicator color={AppColors.primary} /></View>;

  return (
    <View style={styles.flex}>
      <View style={styles.header}>
        <TouchableOpacity onPress={goBackWithResult}>
          <Icon name="arrow-back" color={AppColors.textPrimary} size={22} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{order.orderNumber}</Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={[styles.statusChip, { backgroundColor: statusBg(status) }]}>
          <View style={[styles.statusDot, { backgroundColor: statusColor(status) }]} />
          <Text style={[styles.statusChipText, { color: statusColor(status) }]}>{orderStatusToString(status)}</Text>
        </View>

        <Text style={styles.sectionLabel}>Customer</Text>
        <View style={styles.customerCard}>
          <View style={styles.customerIcon}><Icon name="person-outline" color={AppColors.primary} size={19} /></View>
          <View>
            <Text style={styles.customerName}>{order.customerName ?? 'Unknown'}</Text>
            {order.customerPhone ? <Text style={styles.customerPhone}>📞 {order.customerPhone}</Text> : null}
          </View>
        </View>

        {order.deliveryAddress ? (
          <>
            <Text style={styles.sectionLabel}>Delivery address</Text>
            <View style={styles.addressCard}>
              <Icon name="location-on" color={AppColors.textMuted} size={18} />
              <Text style={styles.addressText}>
                {[order.deliveryAddress, order.deliveryCity, order.deliveryState].filter(Boolean).join('\n')}
              </Text>
            </View>
          </>
        ) : null}

        <Text style={styles.sectionLabel}>Order items</Text>
        <View style={styles.itemsCard}>
          {items.map((item, i) => (
            <View key={item.id} style={[styles.itemRow, i !== items.length - 1 && styles.itemRowBorder]}>
              <View style={{ flex: 1 }}>
                <Text style={styles.itemName}>{item.productName}</Text>
                <Text style={styles.itemMeta}>₹{item.price.toFixed(0)} × {item.quantity}</Text>
              </View>
              <Text style={styles.itemTotal}>₹{item.total.toFixed(0)}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.sectionLabel}>Order summary</Text>
        <View style={styles.summaryCard}>
          <Row label="Subtotal" value={`₹${order.subtotal.toFixed(0)}`} />
          <Row label="Discount" value={`- ₹${order.discountAmount.toFixed(0)}`} />
          <Row label="Tax" value={`+ ₹${order.taxAmount.toFixed(0)}`} />
          <View style={styles.divider} />
          <Row label="Total" value={`₹${order.total.toFixed(0)}`} isTotal />
        </View>

        <Text style={styles.sectionLabel}>Payment</Text>
        <View style={styles.summaryCard}>
          <Row label="Method" value={order.paymentMethod} />
          <Row label="Status" value={order.paymentStatus} color={order.paymentStatus === 'Paid' ? AppColors.success : AppColors.warning} />
          <Row label="Paid" value={`₹${order.paidAmount.toFixed(0)}`} />
          {remaining > 0 && <Row label="Remaining" value={`₹${remaining.toFixed(0)}`} color={AppColors.danger} />}
        </View>

        <Text style={styles.sectionLabel}>Order timeline</Text>
        {status === 'cancelled' ? (
          <View style={styles.cancelledBox}>
            <Icon name="cancel" color={AppColors.danger} size={20} />
            <View style={{ flex: 1 }}>
              <Text style={styles.cancelledTitle}>Order cancelled</Text>
              {order.cancellationReason ? <Text style={styles.cancelledReason}>{order.cancellationReason}</Text> : null}
            </View>
          </View>
        ) : (
          <Timeline currentStatus={status} />
        )}

        {status === 'pending' && (
          <>
            <TouchableOpacity style={styles.primaryButton} onPress={() => updateStatus('processing')} disabled={updating}>
              {updating ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryButtonText}>Accept order</Text>}
            </TouchableOpacity>
            <TouchableOpacity style={styles.dangerOutlineButton} onPress={() => setCancelDialogOpen(true)} disabled={updating}>
              <Text style={styles.dangerOutlineText}>Cancel order</Text>
            </TouchableOpacity>
          </>
        )}
        {status === 'processing' && (
          <>
            <TouchableOpacity style={styles.primaryButton} onPress={() => updateStatus('delivered')} disabled={updating}>
              {updating ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryButtonText}>Mark as delivered</Text>}
            </TouchableOpacity>
            <TouchableOpacity style={styles.dangerOutlineButton} onPress={() => setCancelDialogOpen(true)} disabled={updating}>
              <Text style={styles.dangerOutlineText}>Cancel order</Text>
            </TouchableOpacity>
          </>
        )}
        {status === 'delivered' && (
          <View style={styles.deliveredBox}>
            <Icon name="check-circle-outline" color={AppColors.success} size={20} />
            <Text style={styles.deliveredText}>Order delivered · Completed</Text>
          </View>
        )}
      </ScrollView>

      <Modal visible={cancelDialogOpen} transparent animationType="fade" onRequestClose={() => setCancelDialogOpen(false)}>
        <View style={styles.dialogBackdrop}>
          <View style={styles.dialog}>
            <Text style={styles.dialogTitle}>Cancel order?</Text>
            <TextInput style={styles.dialogInput} value={reason} onChangeText={setReason} />
            <View style={styles.dialogActions}>
              <TouchableOpacity onPress={() => setCancelDialogOpen(false)}><Text style={styles.dialogBack}>Back</Text></TouchableOpacity>
              <TouchableOpacity onPress={confirmCancel}><Text style={styles.dialogCancelOrder}>Cancel order</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function Timeline({ currentStatus }: { currentStatus: OrderStatus }) {
  const steps = ['Order Placed', 'Pending', 'Processing', 'Delivered'];
  let activeIndex: number;
  switch (currentStatus) {
    case 'pending': activeIndex = 1; break;
    case 'processing': activeIndex = 2; break;
    case 'delivered': activeIndex = 3; break;
    default: activeIndex = 0;
  }

  return (
    <View>
      {steps.map((label, i) => {
        const done = i <= activeIndex;
        const isLast = i === steps.length - 1;
        return (
          <View key={label} style={styles.timelineRow}>
            <View style={styles.timelineDotCol}>
              <View style={[styles.timelineDot, done ? styles.timelineDotDone : styles.timelineDotPending]}>
                {done && <Icon name="check" color="#fff" size={13} />}
              </View>
              {!isLast && <View style={[styles.timelineLine, { backgroundColor: i < activeIndex ? AppColors.success + '66' : AppColors.border }]} />}
            </View>
            <View style={{ flex: 1, paddingBottom: isLast ? 0 : 18 }}>
              <Text style={[styles.timelineLabel, { color: done ? AppColors.textPrimary : AppColors.textSecondary, fontWeight: done ? '700' : '500' }]}>{label}</Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}

function Row({ label, value, isTotal, color }: { label: string; value: string; isTotal?: boolean; color?: string }) {
  return (
    <View style={styles.row}>
      <Text style={[styles.rowLabel, isTotal && styles.rowLabelTotal]}>{label}</Text>
      <View style={{ flex: 1 }} />
      <Text style={[styles.rowValue, { color: color ?? AppColors.textPrimary }, isTotal && { fontSize: 16 }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: AppColors.background },
  centerFill: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: AppColors.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, backgroundColor: AppColors.surface, borderBottomWidth: 1, borderColor: AppColors.border },
  headerTitle: { fontSize: 17, fontWeight: '700', color: AppColors.textPrimary },
  content: { padding: 16, paddingBottom: 24 },
  statusChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20, alignSelf: 'flex-start' },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusChipText: { fontSize: 12, fontWeight: '700' },
  sectionLabel: { color: AppColors.textSecondary, fontSize: 13, fontWeight: '600', marginTop: 18, marginBottom: 8 },
  customerCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: AppColors.surface, borderRadius: 14, borderWidth: 1, borderColor: AppColors.border, padding: 14, gap: 12 },
  customerIcon: { width: 38, height: 38, borderRadius: 11, backgroundColor: AppColors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  customerName: { color: AppColors.textPrimary, fontSize: 14, fontWeight: '700' },
  customerPhone: { color: AppColors.textSecondary, fontSize: 12.5, marginTop: 2 },
  addressCard: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, backgroundColor: AppColors.surface, borderRadius: 14, borderWidth: 1, borderColor: AppColors.border, padding: 14 },
  addressText: { flex: 1, color: AppColors.textPrimary, fontSize: 13, lineHeight: 18 },
  itemsCard: { backgroundColor: AppColors.surface, borderRadius: 16, borderWidth: 1, borderColor: AppColors.border },
  itemRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 12 },
  itemRowBorder: { borderBottomWidth: 1, borderColor: AppColors.border },
  itemName: { color: AppColors.textPrimary, fontSize: 13.5, fontWeight: '600' },
  itemMeta: { color: AppColors.textSecondary, fontSize: 12, marginTop: 2 },
  itemTotal: { color: AppColors.textPrimary, fontSize: 13.5, fontWeight: '700' },
  summaryCard: { backgroundColor: AppColors.surface, borderRadius: 16, borderWidth: 1, borderColor: AppColors.border, padding: 14 },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 4 },
  rowLabel: { color: AppColors.textSecondary, fontSize: 13 },
  rowLabelTotal: { color: AppColors.textPrimary, fontSize: 14.5, fontWeight: '700' },
  rowValue: { fontSize: 13, fontWeight: '700' },
  divider: { height: 1, backgroundColor: AppColors.border, marginVertical: 10 },
  cancelledBox: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, backgroundColor: AppColors.dangerSoft, borderRadius: 14, padding: 14 },
  cancelledTitle: { color: AppColors.danger, fontSize: 13.5, fontWeight: '700' },
  cancelledReason: { color: AppColors.danger, fontSize: 12, marginTop: 2 },
  timelineRow: { flexDirection: 'row', alignItems: 'flex-start' },
  timelineDotCol: { alignItems: 'center', marginRight: 12 },
  timelineDot: { width: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center', borderWidth: 2 },
  timelineDotDone: { backgroundColor: AppColors.success, borderColor: AppColors.success },
  timelineDotPending: { backgroundColor: AppColors.surfaceSoft, borderColor: AppColors.border },
  timelineLine: { width: 2, flex: 1, minHeight: 18 },
  timelineLabel: { fontSize: 13 },
  primaryButton: { backgroundColor: AppColors.primary, borderRadius: 12, height: 48, alignItems: 'center', justifyContent: 'center', marginTop: 22 },
  primaryButtonText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  dangerOutlineButton: { borderWidth: 1, borderColor: AppColors.danger, borderRadius: 12, height: 46, alignItems: 'center', justifyContent: 'center', marginTop: 10 },
  dangerOutlineText: { color: AppColors.danger, fontSize: 14, fontWeight: '600' },
  deliveredBox: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: AppColors.successSoft, borderRadius: 14, padding: 14, marginTop: 22 },
  deliveredText: { color: AppColors.success, fontSize: 13.5, fontWeight: '700' },
  dialogBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', alignItems: 'center', justifyContent: 'center' },
  dialog: { backgroundColor: AppColors.surface, borderRadius: 16, padding: 20, width: '85%' },
  dialogTitle: { color: AppColors.textPrimary, fontSize: 16, fontWeight: '700', marginBottom: 14 },
  dialogInput: { borderWidth: 1, borderColor: AppColors.border, borderRadius: 10, padding: 12, color: AppColors.textPrimary, fontSize: 13.5 },
  dialogActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 20, marginTop: 16 },
  dialogBack: { color: AppColors.textSecondary, fontSize: 14 },
  dialogCancelOrder: { color: AppColors.danger, fontWeight: '700', fontSize: 14 },
});
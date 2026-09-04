import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import Icon from '@react-native-vector-icons/material-icons';
import { useNavigation, useRoute } from '@react-navigation/native';

import { AppColors } from '../theme/AppColors';

type Params = {
  invoiceNo: string; product: string; date: string; price: number; paymentStatus: string;
};

export default function InvoiceDetailsScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { invoiceNo, product, date, price, paymentStatus } = route.params as Params;

  const qty = 1;
  const discount = price * 0.02;
  const gst = (price - discount) * 0.18;
  const total = price - discount + gst;

  return (
    <View style={styles.flex}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Icon name="chevron-left" color={AppColors.primary} size={30} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{invoiceNo}</Text>
        <TouchableOpacity
          style={styles.headerActionBtn}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Icon name="share" color={AppColors.textSecondary} size={18} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.card}>
          <View style={styles.productIcon}>
            <Icon name="shopping-bag" color={AppColors.primary} size={20} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.productName}>{product}</Text>
            <Text style={styles.productDate}>{date}</Text>
          </View>
          <View style={styles.statusPill}>
            <Text style={styles.statusText}>{paymentStatus}</Text>
          </View>
        </View>

        <Text style={styles.sectionLabel}>Order summary</Text>
        <View style={styles.infoCard}>
          <Row label="Quantity" value={`${qty}`} />
          <Row label="Price" value={`₹${price.toFixed(0)}`} />
          <Row label="Discount" value={`- ₹${discount.toFixed(0)}`} />
          <Row label="GST (18%)" value={`+ ₹${gst.toFixed(0)}`} />
          <Row label="Total" value={`₹${total.toFixed(0)}`} isTotal isLast />
        </View>

        <Text style={styles.sectionLabel}>Details</Text>
        <View style={styles.infoCard}>
          <InfoRow icon="receipt-long" label="Invoice" value={invoiceNo} />
          <InfoRow icon="payments" label="Payment" value={paymentStatus} />
          <InfoRow icon="verified" label="Warranty" value="1 year" isLast />
        </View>
      </ScrollView>
    </View>
  );
}

function Row({ label, value, isTotal, isLast }: { label: string; value: string; isTotal?: boolean; isLast?: boolean }) {
  return (
    <View style={[styles.row, !isLast && styles.rowBorder]}>
      <Text style={[styles.rowLabel, isTotal && { color: AppColors.textPrimary, fontWeight: '700' }]}>{label}</Text>
      <View style={{ flex: 1 }} />
      <Text style={[styles.rowValue, isTotal && { fontSize: 15, color: AppColors.primary }]}>{value}</Text>
    </View>
  );
}

function InfoRow({ icon, label, value, isLast }: { icon: any; label: string; value: string; isLast?: boolean }) {
  return (
    <View style={[styles.infoRow, !isLast && styles.rowBorder]}>
      <Icon name={icon} color={AppColors.textMuted} size={18} />
      <Text style={styles.rowLabel}>{label}</Text>
      <View style={{ flex: 1 }} />
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: AppColors.background },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 14,
    backgroundColor: AppColors.surface,
    borderBottomWidth: 1,
    borderColor: AppColors.border,
  },
  headerTitle: { fontSize: 17, fontWeight: '700', color: AppColors.textPrimary, letterSpacing: -0.3 },
  headerActionBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: AppColors.surfaceSoft,
    borderWidth: 1,
    borderColor: AppColors.border,
  },
  content: { padding: 16, paddingBottom: 24 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: AppColors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: AppColors.border,
    padding: 14,
    shadowColor: AppColors.textPrimary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  productIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: AppColors.primarySoft,
    borderWidth: 1,
    borderColor: `${AppColors.primary}20`,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  productName: { color: AppColors.textPrimary, fontSize: 14.5, fontWeight: '700' },
  productDate: { color: AppColors.textSecondary, fontSize: 12, marginTop: 2 },
  statusPill: { backgroundColor: AppColors.successSoft, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  statusText: { color: AppColors.success, fontSize: 10.5, fontWeight: '700' },
  sectionLabel: { color: AppColors.textSecondary, fontSize: 11.5, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.6, marginTop: 20, marginBottom: 8 },
  infoCard: {
    backgroundColor: AppColors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: AppColors.border,
    shadowColor: AppColors.textPrimary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 12 },
  rowBorder: { borderBottomWidth: 1, borderColor: AppColors.border },
  rowLabel: { color: AppColors.textSecondary, fontSize: 13 },
  rowValue: { color: AppColors.textPrimary, fontSize: 13, fontWeight: '700' },
  infoRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 12, gap: 10 },
});
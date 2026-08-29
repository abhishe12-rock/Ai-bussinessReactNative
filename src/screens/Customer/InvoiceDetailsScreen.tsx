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
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" color={AppColors.textPrimary} size={22} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{invoiceNo}</Text>
        <TouchableOpacity>
          <Icon name="share" color={AppColors.textSecondary} size={20} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.card}>
          <View style={styles.productIcon}>
            <Icon name="shopping-bag" color={AppColors.primary} size={21} />
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
      <Text style={[styles.rowValue, isTotal && { fontSize: 15 }]}>{value}</Text>
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
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 16, backgroundColor: AppColors.surface, borderBottomWidth: 1, borderColor: AppColors.border,
  },
  headerTitle: { fontSize: 17, fontWeight: '700', color: AppColors.textPrimary },
  content: { padding: 16, paddingBottom: 24 },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: AppColors.surface, borderRadius: 16, borderWidth: 1, borderColor: AppColors.border, padding: 14 },
  productIcon: { width: 44, height: 44, borderRadius: 12, backgroundColor: AppColors.primarySoft, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  productName: { color: AppColors.textPrimary, fontSize: 15, fontWeight: '700' },
  productDate: { color: AppColors.textSecondary, fontSize: 12, marginTop: 2 },
  statusPill: { backgroundColor: AppColors.successSoft, paddingHorizontal: 9, paddingVertical: 4, borderRadius: 20 },
  statusText: { color: AppColors.success, fontSize: 10.5, fontWeight: '700' },
  sectionLabel: { color: AppColors.textSecondary, fontSize: 13, fontWeight: '600', marginTop: 20, marginBottom: 10 },
  infoCard: { backgroundColor: AppColors.surface, borderRadius: 16, borderWidth: 1, borderColor: AppColors.border },
  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 12 },
  rowBorder: { borderBottomWidth: 1, borderColor: AppColors.border },
  rowLabel: { color: AppColors.textSecondary, fontSize: 13 },
  rowValue: { color: AppColors.textPrimary, fontSize: 13, fontWeight: '700' },
  infoRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 13, gap: 12 },
});
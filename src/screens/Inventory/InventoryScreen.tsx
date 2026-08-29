import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import Icon from '@react-native-vector-icons/material-icons';
import { useNavigation } from '@react-navigation/native';

import { AppColors } from '../theme/AppColors';

const TOTAL_PRODUCTS = 248;
const LOW_STOCK_COUNT = 7;

export default function InventoryHomeScreen() {
  const navigation = useNavigation<any>();

  return (
    <View style={styles.flex}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Inventory</Text>
        <Text style={styles.headerSubtitle}>Products, stock and suppliers</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.statsRow}>
          <StatCard label="Total products" value={`${TOTAL_PRODUCTS}`} bg={AppColors.primarySoft} fg={AppColors.primary} />
          <StatCard label="Low stock" value={`${LOW_STOCK_COUNT} items`} bg={AppColors.dangerSoft} fg={AppColors.danger} />
        </View>

        <TouchableOpacity style={styles.lowStockBanner} onPress={() => navigation.navigate('LowStockAlert')}>
          <View style={styles.bannerIcon}>
            <Icon name="warning-amber" color={AppColors.danger} size={19} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.bannerTitle}>{LOW_STOCK_COUNT} products running low</Text>
            <Text style={styles.bannerSubtitle}>Restock before you run out</Text>
          </View>
          <Icon name="chevron-right" color={AppColors.textMuted} size={20} />
        </TouchableOpacity>

        <Text style={styles.sectionLabel}>Manage</Text>
        <View style={styles.grid}>
          <MenuCard icon="inventory-2" label="Products" color={AppColors.info} bg={AppColors.infoSoft} onPress={() => navigation.navigate('Products')} />
          <MenuCard icon="category" label="Categories" color={AppColors.success} bg={AppColors.successSoft} onPress={() => navigation.navigate('Categories')} />
          <MenuCard icon="local-offer" label="Brands" color={AppColors.danger} bg={AppColors.dangerSoft} onPress={() => navigation.navigate('Brands')} />
          <MenuCard icon="stacked-bar-chart" label="Stock" color={AppColors.warning} bg={AppColors.warningSoft} onPress={() => navigation.navigate('StockQuantity')} />
          <MenuCard icon="qr-code-scanner" label="Barcode" color={AppColors.primary} bg={AppColors.primarySoft} onPress={() => navigation.navigate('BarcodeScanner')} />
          <MenuCard icon="qr-code-2" label="QR code" color={AppColors.teal} bg={AppColors.tealSoft} onPress={() => navigation.navigate('QrCodeScanner')} />
          <MenuCard icon="local-shipping" label="Suppliers" color={AppColors.info} bg={AppColors.infoSoft} onPress={() => navigation.navigate('Suppliers')} />
          <MenuCard icon="error-outline" label="Low stock alerts" color={AppColors.danger} bg={AppColors.dangerSoft} onPress={() => navigation.navigate('LowStockAlert')} />
        </View>
      </ScrollView>
    </View>
  );
}

function StatCard({ label, value, bg, fg }: { label: string; value: string; bg: string; fg: string }) {
  return (
    <View style={[styles.statCard, { backgroundColor: bg }]}>
      <Text style={[styles.statLabel, { color: fg }]}>{label}</Text>
      <Text style={[styles.statValue, { color: fg }]}>{value}</Text>
    </View>
  );
}

function MenuCard({ icon, label, color, bg, onPress }: { icon: any; label: string; color: string; bg: string; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.menuCard} onPress={onPress}>
      <View style={[styles.menuIconWrap, { backgroundColor: bg }]}>
        <Icon name={icon} color={color} size={20} />
      </View>
      <Text style={styles.menuLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: AppColors.background },
  header: { padding: 16, paddingTop: 50, backgroundColor: AppColors.surface, borderBottomWidth: 1, borderColor: AppColors.border },
  headerTitle: { fontSize: 18, fontWeight: '700', color: AppColors.textPrimary },
  headerSubtitle: { fontSize: 12.5, color: AppColors.textSecondary, marginTop: 2 },
  content: { padding: 16, paddingBottom: 24 },
  statsRow: { flexDirection: 'row', gap: 10 },
  statCard: { flex: 1, borderRadius: 16, padding: 14 },
  statLabel: { fontSize: 11.5, fontWeight: '500', opacity: 0.85 },
  statValue: { fontSize: 21, fontWeight: '800', marginTop: 6 },
  lowStockBanner: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: AppColors.surface, borderRadius: 14,
    borderWidth: 1, borderColor: AppColors.danger + '59', padding: 13, marginTop: 16, gap: 12,
  },
  bannerIcon: { width: 36, height: 36, borderRadius: 10, backgroundColor: AppColors.dangerSoft, alignItems: 'center', justifyContent: 'center' },
  bannerTitle: { color: AppColors.textPrimary, fontSize: 13.5, fontWeight: '700' },
  bannerSubtitle: { color: AppColors.textSecondary, fontSize: 12, marginTop: 2 },
  sectionLabel: { color: AppColors.textSecondary, fontSize: 13, fontWeight: '600', marginTop: 22, marginBottom: 10 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  menuCard: {
    width: '47%', backgroundColor: AppColors.surface, borderRadius: 16, borderWidth: 1, borderColor: AppColors.border,
    padding: 14, justifyContent: 'center', minHeight: 100,
  },
  menuIconWrap: { width: 38, height: 38, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  menuLabel: { color: AppColors.textPrimary, fontSize: 13.5, fontWeight: '700', marginTop: 12 },
});
import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import Icon from '@react-native-vector-icons/material-icons';
import { useNavigation } from '@react-navigation/native';

import { AppColors, AppShadows, AppRadius } from '../theme/AppColors';
import {
  FadeInUp,
  FloatingGeometricOrb,
  SpringTouch,
  PulsingGlow,
} from '../theme/Animations';

const TOTAL_PRODUCTS = 248;
const LOW_STOCK_COUNT = 7;
const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function InventoryHomeScreen() {
  const navigation = useNavigation<any>();

  return (
    <View style={styles.flex}>
      {/* Background ambient orbs */}
      <FloatingGeometricOrb
        size={220}
        top={-50}
        right={-50}
        color="rgba(91, 77, 248, 0.08)"
        duration={5500}
        floatDistance={12}
      />
      <FloatingGeometricOrb
        size={150}
        bottom={30}
        left={-40}
        color="rgba(14, 165, 233, 0.06)"
        duration={4500}
        floatDistance={10}
      />

      {/* HEADER */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <SpringTouch
            onPress={() => navigation.goBack()}
            activeScale={0.88}
            style={styles.backBtn}
          >
            <Icon name="arrow-back-ios" color={AppColors.textPrimary} size={20} />
          </SpringTouch>
          <View>
            <Text style={styles.headerTitle} numberOfLines={1}>
              Inventory
            </Text>
            <Text style={styles.headerSubtitle} numberOfLines={1}>
              Products, stock and suppliers
            </Text>
          </View>
        </View>

        <SpringTouch
          onPress={() => navigation.navigate('BarcodeScanner')}
          activeScale={0.88}
        >
          <View style={styles.actionHeaderBtn}>
            <Icon name="qr-code-scanner" size={20} color={AppColors.textPrimary} />
          </View>
        </SpringTouch>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* STATS ROW */}
        <FadeInUp delay={40} duration={450}>
          <View style={styles.statsRow}>
            <StatCard
              icon="inventory-2"
              label="Total Products"
              value={`${TOTAL_PRODUCTS}`}
              bg="#EEECFE"
              fg="#5B4DF8"
            />
            <StatCard
              icon="trending-down"
              label="Low Stock"
              value={`${LOW_STOCK_COUNT} items`}
              bg="#FEF2F2"
              fg="#EF4444"
            />
          </View>
        </FadeInUp>

        {/* LOW STOCK BANNER */}
        <FadeInUp delay={80} duration={450}>
          <SpringTouch
            style={{ width: '100%' }}
            activeScale={0.98}
            onPress={() => navigation.navigate('LowStockAlert')}
          >
            <View style={styles.lowStockBanner}>
              <View style={styles.bannerIcon}>
                <Icon name="warning-amber" color="#EF4444" size={20} />
              </View>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={styles.bannerTitle}>
                    {LOW_STOCK_COUNT} products running low
                  </Text>
                  <PulsingGlow size={6} glowRadius={12} color="#EF4444" />
                </View>
                <Text style={styles.bannerSubtitle}>Restock before you run out</Text>
              </View>
              <Icon name="chevron-right" color={AppColors.textMuted} size={22} />
            </View>
          </SpringTouch>
        </FadeInUp>

        {/* MANAGE MODULES GRID */}
        <Text style={styles.sectionLabel}>Manage Modules</Text>
        <View style={styles.grid}>
          <MenuCard
            index={0}
            icon="inventory-2"
            label="Products"
            color="#3B82F6"
            bg="#EFF6FF"
            onPress={() => navigation.navigate('Products')}
          />
          <MenuCard
            index={1}
            icon="category"
            label="Categories"
            color="#10B981"
            bg="#ECFDF5"
            onPress={() => navigation.navigate('Categories')}
          />
          <MenuCard
            index={2}
            icon="local-offer"
            label="Brands"
            color="#EF4444"
            bg="#FEF2F2"
            onPress={() => navigation.navigate('Brands')}
          />
          <MenuCard
            index={3}
            icon="stacked-bar-chart"
            label="Stock Quantity"
            color="#F59E0B"
            bg="#FFFBEB"
            onPress={() => navigation.navigate('StockQuantity')}
          />
          <MenuCard
            index={4}
            icon="qr-code-scanner"
            label="Barcode"
            color="#5B4DF8"
            bg="#EEECFE"
            onPress={() => navigation.navigate('BarcodeScanner')}
          />
          <MenuCard
            index={5}
            icon="qr-code-2"
            label="QR Code"
            color="#0EA5E9"
            bg="#F0F9FF"
            onPress={() => navigation.navigate('QrCodeScanner')}
          />
          <MenuCard
            index={6}
            icon="local-shipping"
            label="Suppliers"
            color="#6366F1"
            bg="#EEF2FF"
            onPress={() => navigation.navigate('Suppliers')}
          />
          <MenuCard
            index={7}
            icon="error-outline"
            label="Low Stock Alerts"
            color="#F97316"
            bg="#FFF7ED"
            onPress={() => navigation.navigate('LowStockAlert')}
          />
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>
    </View>
  );
}

function StatCard({
  icon,
  label,
  value,
  bg,
  fg,
}: {
  icon: any;
  label: string;
  value: string;
  bg: string;
  fg: string;
}) {
  return (
    <View style={styles.statCard}>
      <View style={styles.statTopRow}>
        <Text style={styles.statLabel}>{label}</Text>
        <View style={[styles.statIconBadge, { backgroundColor: bg }]}>
          <Icon name={icon} color={fg} size={18} />
        </View>
      </View>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );
}

function MenuCard({
  index = 0,
  icon,
  label,
  color,
  bg,
  onPress,
}: {
  index?: number;
  icon: any;
  label: string;
  color: string;
  bg: string;
  onPress: () => void;
}) {
  return (
    <FadeInUp
      delay={80 + index * 30}
      distance={10}
      style={styles.menuCardWrapper}
    >
      <SpringTouch
        style={{ width: '100%' }}
        activeScale={0.97}
        onPress={onPress}
      >
        <View style={styles.menuCard}>
          <View style={[styles.menuIconWrap, { backgroundColor: bg }]}>
            <Icon name={icon} color={color} size={22} />
          </View>
          <Text style={styles.menuLabel}>{label}</Text>
          <Icon
            name="chevron-right"
            color={AppColors.textMuted}
            size={18}
            style={styles.menuChevron}
          />
        </View>
      </SpringTouch>
    </FadeInUp>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: AppColors.background,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 52,
    paddingBottom: 14,
    backgroundColor: AppColors.background,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  backBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: AppColors.textPrimary,
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 12,
    color: AppColors.textSecondary,
    marginTop: 1,
    fontWeight: '500',
  },
  actionHeaderBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: AppColors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: AppColors.border,
    ...AppShadows.subtle,
  },

  content: {
    paddingHorizontal: 16,
    paddingTop: 6,
  },

  /* STATS ROW */
  statsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: AppColors.surface,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: AppColors.border,
    ...AppShadows.subtle,
  },
  statTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statLabel: {
    fontSize: 11.5,
    fontWeight: '600',
    color: AppColors.textSecondary,
  },
  statIconBadge: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '800',
    color: AppColors.textPrimary,
    marginTop: 8,
    letterSpacing: -0.4,
  },

  /* LOW STOCK BANNER */
  lowStockBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: AppColors.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#FEE2E2',
    padding: 14,
    marginTop: 14,
    gap: 12,
    ...AppShadows.card,
  },
  bannerIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#FEF2F2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerTitle: {
    color: AppColors.textPrimary,
    fontSize: 14,
    fontWeight: '700',
  },
  bannerSubtitle: {
    color: AppColors.textSecondary,
    fontSize: 12,
    marginTop: 2,
    fontWeight: '500',
  },

  sectionLabel: {
    color: AppColors.textSecondary,
    fontSize: 12,
    fontWeight: '800',
    marginTop: 22,
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },

  /* GRID */
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -5,
  },
  menuCardWrapper: {
    width: (SCREEN_WIDTH - 42) / 2,
    marginHorizontal: 5,
    marginBottom: 10,
  },
  menuCard: {
    width: '100%',
    backgroundColor: AppColors.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: AppColors.border,
    padding: 16,
    minHeight: 104,
    justifyContent: 'center',
    position: 'relative',
    ...AppShadows.card,
  },
  menuIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuLabel: {
    color: AppColors.textPrimary,
    fontSize: 14,
    fontWeight: '700',
    marginTop: 12,
    letterSpacing: -0.2,
  },
  menuChevron: {
    position: 'absolute',
    right: 14,
    top: 18,
  },
});
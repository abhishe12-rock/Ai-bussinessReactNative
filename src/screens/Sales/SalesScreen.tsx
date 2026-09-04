import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Dimensions,
} from 'react-native';
import Icon from '@react-native-vector-icons/material-icons';
import { useNavigation } from '@react-navigation/native';
import Svg, { Defs, LinearGradient as SvgLinearGradient, Stop, Rect } from 'react-native-svg';

import { SalesService, SaleRecord } from '../../services/SalesService';
import { AppColors, AppShadows, AppRadius } from '../theme/AppColors';
import { FadeInUp, FloatingGeometricOrb, SpringTouch } from '../theme/Animations';

const service = new SalesService();
const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function SalesHomeScreen() {
  const navigation = useNavigation<any>();
  const [sales, setSales] = useState<SaleRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setSales(await service.getAllSales());
    } catch {
      // stats show fallback on failure
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const today = new Date();
  const todaysTotal = service.sumTotalForDate(sales, today);
  const todaysCount = service.countForDate(sales, today);

  return (
    <View style={styles.flex}>
      {/* HEADER */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backBtn}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Icon name="arrow-back-ios" color={AppColors.textPrimary} size={20} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Sales</Text>
        </View>

        <TouchableOpacity
          style={styles.actionHeaderBtn}
          onPress={() => navigation.navigate('Invoices')}
          activeOpacity={0.7}
        >
          <Icon name="receipt-long" size={20} color={AppColors.textPrimary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={load}
            tintColor={AppColors.primary}
          />
        }
      >
        {/* NEW SALE HERO CARD */}
        <FadeInUp delay={50} duration={500}>
          <SpringTouch
            style={{ width: '100%' }}
            activeScale={0.98}
            onPress={() => {
              navigation.navigate('NewSale', { onSaved: load });
            }}
          >
            <View style={styles.newSaleCard}>
              <Svg style={StyleSheet.absoluteFill} width="100%" height="100%" pointerEvents="none">
                <Defs>
                  <SvgLinearGradient id="saleGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <Stop offset="0%" stopColor="#5B4DF8" />
                    <Stop offset="100%" stopColor="#7C3AED" />
                  </SvgLinearGradient>
                </Defs>
                <Rect width="100%" height="100%" fill="url(#saleGrad)" />
              </Svg>

              {/* Floating Geometric Orbs */}
              <FloatingGeometricOrb
                size={110}
                top={-25}
                right={-20}
                color="rgba(255, 255, 255, 0.12)"
                duration={4200}
                floatDistance={8}
              />
              <FloatingGeometricOrb
                size={70}
                bottom={-20}
                right={60}
                color="rgba(255, 255, 255, 0.08)"
                duration={5000}
                floatDistance={6}
              />

              <View style={styles.newSaleInner}>
                <Text style={styles.newSaleLabel}>START A TRANSACTION</Text>
                <Text style={styles.newSaleTitle}>New Sale</Text>
                <View style={styles.createChip}>
                  <Icon name="add" color="#FFFFFF" size={18} />
                  <Text style={styles.createChipText}>Create Sale</Text>
                </View>
              </View>
            </View>
          </SpringTouch>
        </FadeInUp>

        {/* STATS ROW */}
        <FadeInUp delay={100} duration={450}>
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <View style={[styles.statIconWrap, { backgroundColor: '#ECFDF5' }]}>
                <Icon name="payments" size={18} color="#10B981" />
              </View>
              <Text style={styles.statLabel}>Today's Sales</Text>
              <Text style={styles.statValue}>
                {loading ? '—' : `₹${todaysTotal.toLocaleString('en-IN')}`}
              </Text>
            </View>

            <View style={styles.statCard}>
              <View style={[styles.statIconWrap, { backgroundColor: '#EEECFE' }]}>
                <Icon name="receipt" size={18} color="#5B4DF8" />
              </View>
              <Text style={styles.statLabel}>Invoices Today</Text>
              <Text style={styles.statValue}>{loading ? '—' : `${todaysCount}`}</Text>
            </View>
          </View>
        </FadeInUp>

        {/* MANAGE SECTION */}
        <Text style={styles.sectionLabel}>Manage</Text>

        <MenuRow
          icon="receipt-long"
          iconColor="#3B82F6"
          iconBg="#EFF6FF"
          title="Invoices"
          subtitle="View & manage all invoices"
          onPress={() => navigation.navigate('Invoices')}
        />

        <MenuRow
          icon="history"
          iconColor="#10B981"
          iconBg="#ECFDF5"
          title="Sales History"
          subtitle="Past transactions & records"
          onPress={() => navigation.navigate('SalesHistory')}
        />

        <MenuRow
          icon="replay"
          iconColor="#EF4444"
          iconBg="#FEF2F2"
          title="Returns"
          subtitle="Refunds & item exchanges"
          onPress={() => navigation.navigate('Returns')}
        />

        <MenuRow
          icon="account-balance-wallet"
          iconColor="#F59E0B"
          iconBg="#FFFBEB"
          title="Payments"
          subtitle="Track collections & dues"
          onPress={() => navigation.navigate('Payments')}
        />

        <View style={{ height: 32 }} />
      </ScrollView>
    </View>
  );
}

function MenuRow({
  icon,
  iconColor,
  iconBg,
  title,
  subtitle,
  onPress,
}: {
  icon: any;
  iconColor: string;
  iconBg: string;
  title: string;
  subtitle: string;
  onPress: () => void;
}) {
  return (
    <SpringTouch style={{ width: '100%' }} activeScale={0.98} onPress={onPress}>
      <View style={styles.menuRow}>
        <View style={[styles.menuIcon, { backgroundColor: iconBg }]}>
          <Icon name={icon} color={iconColor} size={22} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.menuTitle}>{title}</Text>
          <Text style={styles.menuSubtitle}>{subtitle}</Text>
        </View>
        <Icon name="chevron-right" color={AppColors.textMuted} size={22} />
      </View>
    </SpringTouch>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: AppColors.background,
  },

  /* HEADER */
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

  /* NEW SALE HERO CARD */
  newSaleCard: {
    borderRadius: 22,
    overflow: 'hidden',
    position: 'relative',
    padding: 20,
    marginBottom: 16,
    backgroundColor: '#5B4DF8',
    ...AppShadows.glow,
  },
  saleDecoCircle: {
    position: 'absolute',
    right: -20,
    top: -20,
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  newSaleInner: {
    position: 'relative',
    zIndex: 2,
  },
  newSaleLabel: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  newSaleTitle: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '800',
    marginTop: 4,
    letterSpacing: -0.5,
  },
  createChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 9,
    alignSelf: 'flex-start',
    marginTop: 14,
  },
  createChipText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },

  /* STATS ROW */
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: AppColors.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: AppColors.border,
    padding: 16,
    ...AppShadows.subtle,
  },
  statIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  statLabel: {
    color: AppColors.textSecondary,
    fontSize: 11.5,
    fontWeight: '600',
  },
  statValue: {
    color: AppColors.textPrimary,
    fontSize: 18,
    fontWeight: '800',
    marginTop: 4,
    letterSpacing: -0.3,
  },

  /* SECTION */
  sectionLabel: {
    color: AppColors.textSecondary,
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 10,
  },

  /* MENU ROW */
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: AppColors.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: AppColors.border,
    padding: 14,
    marginBottom: 10,
    gap: 12,
    ...AppShadows.card,
  },
  menuIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuTitle: {
    color: AppColors.textPrimary,
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  menuSubtitle: {
    color: AppColors.textSecondary,
    fontSize: 12,
    marginTop: 2,
    fontWeight: '500',
  },
});
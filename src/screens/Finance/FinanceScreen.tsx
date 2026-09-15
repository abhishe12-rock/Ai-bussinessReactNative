import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { AppColors } from '../theme/AppColors';
import { FinanceService, TransactionRecord } from '../../services/FinanceService.ts';
import Icon from '@react-native-vector-icons/material-icons';
import {
  FadeInUp,
  FloatingGeometricOrb,
  SpringTouch,
  ScaleIn,
} from '../theme/Animations';

function formatDMY(d: Date): string {
  return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
}

function formatRupee(n: number): string {
  return `₹${Math.round(n).toString()}`;
}

export default function FinanceHomeScreen() {
  const navigation = useNavigation<any>();
  const [summary, setSummary] = useState({ income: 0, expenses: 0, net: 0 });
  const [recent, setRecent] = useState<TransactionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (isRefresh = false) => {
    isRefresh ? setRefreshing(true) : setLoading(true);
    setError(null);
    try {
      const [s, txns] = await Promise.all([
        FinanceService.getMonthSummary(),
        FinanceService.getTransactions(),
      ]);
      setSummary(s);
      setRecent(txns.slice(0, 6));
    } catch (e: any) {
      setError(`Failed to load finance data: ${e?.message ?? e}`);
    } finally {
      isRefresh ? setRefreshing(false) : setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const menuItems: {
    icon: string;
    label: string;
    subtitle: string;
    color: string;
    bg: string;
    screen: string;
  }[] = [
      { icon: 'arrow-top-right', label: 'Expenses', subtitle: 'Track expenditures', color: AppColors.danger, bg: AppColors.dangerSoft, screen: 'Expenses' },
      { icon: 'arrow-bottom-left', label: 'Income', subtitle: 'Revenue & inflows', color: AppColors.success, bg: AppColors.successSoft, screen: 'Income' },
      { icon: 'bank-outline', label: 'Loans', subtitle: 'Borrowings & debt', color: AppColors.primary, bg: AppColors.primarySoft, screen: 'Loans' },
      { icon: 'credit-card-outline', label: 'EMI', subtitle: 'Monthly installments', color: AppColors.info, bg: AppColors.infoSoft, screen: 'Emi' },
      { icon: 'book-open-outline', label: 'Ledger', subtitle: 'Customer & vendor', color: AppColors.warning, bg: AppColors.warningSoft, screen: 'Ledger' },
      { icon: 'receipt', label: 'Transactions', subtitle: 'Audit & history', color: AppColors.teal, bg: AppColors.tealSoft, screen: 'Transactions' },
    ];

  return (
    <View style={styles.screen}>
      <FloatingGeometricOrb
        size={220}
        top={-50}
        right={-50}
        color="rgba(91, 77, 248, 0.08)"
        duration={5500}
        floatDistance={12}
      />
      <FloatingGeometricOrb
        size={160}
        bottom={50}
        left={-40}
        color="rgba(16, 185, 129, 0.06)"
        duration={4500}
        floatDistance={10}
      />

      <View style={styles.appBar}>
        <View style={styles.headerLeft}>
          <SpringTouch
            onPress={() => navigation.goBack()}
            activeScale={0.88}
            style={styles.backBtn}
          >
            <Icon name="chevron-left" color={AppColors.primary} size={30} />
          </SpringTouch>
          <View>
            <Text style={styles.appBarTitle}>Finance</Text>
            <Text style={styles.appBarSubtitle}>Loans, expenses and ledger</Text>
          </View>
        </View>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={AppColors.primary} />
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={AppColors.primary} />}
        >
          <FadeInUp delay={60} duration={480}>
            <BalanceCard net={summary.net} />
          </FadeInUp>

          <View style={styles.statsRow}>
            <ScaleIn delay={120} style={{ flex: 1 }}>
              <StatCard
                label="Income"
                value={formatRupee(summary.income)}
                icon="arrow-bottom-left"
                color={AppColors.success}
                bg={AppColors.successSoft}
                onPress={() => navigation.navigate('Income')}
              />
            </ScaleIn>
            <View style={{ width: 12 }} />
            <ScaleIn delay={180} style={{ flex: 1 }}>
              <StatCard
                label="Expenses"
                value={formatRupee(summary.expenses)}
                icon="arrow-top-right"
                color={AppColors.danger}
                bg={AppColors.dangerSoft}
                onPress={() => navigation.navigate('Expenses')}
              />
            </ScaleIn>
          </View>

          <FadeInUp delay={220} distance={10}>
            <Text style={styles.sectionLabel}>Manage</Text>
          </FadeInUp>
          <View style={styles.grid}>
            {menuItems.map((item, index) => (
              <ScaleIn key={item.screen} delay={240 + index * 30} style={styles.menuCardWrapper}>
                <MenuCard
                  icon={item.icon}
                  label={item.label}
                  subtitle={item.subtitle}
                  color={item.color}
                  bg={item.bg}
                  onPress={() => navigation.navigate(item.screen)}
                />
              </ScaleIn>
            ))}
          </View>

          <FadeInUp delay={320} distance={10}>
            <Text style={styles.sectionLabel}>Recent transactions</Text>
          </FadeInUp>
          {recent.length === 0 ? (
            <Text style={styles.emptyText}>No transactions yet</Text>
          ) : (
            recent.map((t, index) => (
              <FadeInUp key={t.id} delay={340 + index * 40} distance={12}>
                <TxnRow
                  title={`${t.referenceName ?? t.sourceType} · ${t.description ?? ''}`}
                  date={formatDMY(t.createdAt)}
                  amount={`${t.type === 'INCOME' ? '+' : '-'}${formatRupee(t.amount)}`}
                  credit={t.type === 'INCOME'}
                />
              </FadeInUp>
            ))
          )}
        </ScrollView>
      )}
    </View>
  );
}

function BalanceCard({ net }: { net: number }) {
  return (
    <View style={styles.balanceCard}>
      <View style={styles.balanceCircle} />
      <Text style={styles.balanceLabel}>Net balance (this month)</Text>
      <Text style={styles.balanceValue}>{formatRupee(net)}</Text>
    </View>
  );
}

function StatCard({
  label,
  value,
  icon,
  color,
  bg,
  onPress,
}: {
  label: string;
  value: string;
  icon: string;
  color: string;
  bg: string;
  onPress?: () => void;
}) {
  const inner = (
    <View style={[styles.statCard, { backgroundColor: bg }]}>
      <View style={styles.statCardHeader}>
        <View style={[styles.statIconWrap, { backgroundColor: 'rgba(255, 255, 255, 0.75)' }]}>
          <MaterialCommunityIcons name={icon} color={color} size={15} />
        </View>
        <Text style={[styles.statCardLabel, { color }]}>{label}</Text>
        {onPress && (
          <MaterialCommunityIcons
            name="chevron-right"
            color={color}
            size={16}
            style={styles.statChevron}
          />
        )}
      </View>
      <Text style={[styles.statCardValue, { color }]}>{value}</Text>
    </View>
  );

  if (onPress) {
    return (
      <SpringTouch activeScale={0.96} onPress={onPress} style={{ width: '100%' }}>
        {inner}
      </SpringTouch>
    );
  }
  return inner;
}

function MenuCard({
  icon,
  label,
  subtitle,
  color,
  bg,
  onPress,
}: {
  icon: string;
  label: string;
  subtitle: string;
  color: string;
  bg: string;
  onPress: () => void;
}) {
  return (
    <SpringTouch activeScale={0.95} onPress={onPress} style={{ width: '100%' }}>
      <View style={styles.menuCard}>
        <View style={styles.menuCardTop}>
          <View style={[styles.menuIconBox, { backgroundColor: bg }]}>
            <MaterialCommunityIcons name={icon} color={color} size={22} />
          </View>
          <MaterialCommunityIcons name="chevron-right" color={AppColors.textMuted} size={18} />
        </View>
        <View style={styles.menuCardBottom}>
          <Text style={styles.menuLabel} numberOfLines={1}>
            {label}
          </Text>
          <Text style={styles.menuSubtitle} numberOfLines={1}>
            {subtitle}
          </Text>
        </View>
      </View>
    </SpringTouch>
  );
}

function TxnRow({
  title,
  date,
  amount,
  credit,
}: {
  title: string;
  date: string;
  amount: string;
  credit: boolean;
}) {
  const color = credit ? AppColors.success : AppColors.danger;
  const bg = credit ? AppColors.successSoft : AppColors.dangerSoft;

  return (
    <View style={styles.txnRow}>
      <View style={[styles.txnIconBox, { backgroundColor: bg }]}>
        <MaterialCommunityIcons name={credit ? 'arrow-bottom-left' : 'arrow-top-right'} color={color} size={16} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.txnTitle} numberOfLines={1}>
          {title}
        </Text>
        <Text style={styles.txnDate}>{date}</Text>
      </View>
      <Text style={[styles.txnAmount, { color }]}>{amount}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: AppColors.background },
  appBar: {
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 14,
    backgroundColor: AppColors.surface,
    borderBottomWidth: 1,
    borderBottomColor: AppColors.border,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  backBtn: {
    marginLeft: -6,
  },
  appBarTitle: {
    color: AppColors.textPrimary,
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  appBarSubtitle: {
    color: AppColors.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  errorText: { color: AppColors.danger, fontSize: 12.5, fontWeight: '500' },
  content: { padding: 16, paddingTop: 18, paddingBottom: 32 },
  balanceCard: {
    padding: 22,
    borderRadius: 22,
    backgroundColor: AppColors.primary,
    overflow: 'hidden',
    shadowColor: AppColors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 16,
    elevation: 6,
  },
  balanceCircle: {
    position: 'absolute',
    right: -20,
    top: -20,
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  balanceLabel: { color: 'rgba(255,255,255,0.85)', fontSize: 11.5, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.6 },
  balanceValue: { color: '#fff', fontSize: 28, fontWeight: '800', marginTop: 6, letterSpacing: -0.6 },
  statsRow: { flexDirection: 'row', marginTop: 12 },
  statCard: {
    padding: 14,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: AppColors.border,
    width: '100%',
  },
  statCardHeader: { flexDirection: 'row', alignItems: 'center' },
  statIconWrap: {
    width: 26,
    height: 26,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statChevron: {
    marginLeft: 'auto',
  },
  statCardLabel: { fontSize: 11, fontWeight: '700', marginLeft: 6, textTransform: 'uppercase', letterSpacing: 0.5 },
  statCardValue: { fontSize: 19, fontWeight: '800', marginTop: 8, letterSpacing: -0.4 },
  sectionLabel: { color: AppColors.textSecondary, fontSize: 12, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.7, marginTop: 24, marginBottom: 12 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  menuCardWrapper: {
    width: '48.5%',
    marginBottom: 12,
  },
  menuCard: {
    width: '100%',
    backgroundColor: AppColors.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: AppColors.border,
    padding: 14,
    minHeight: 112,
    justifyContent: 'space-between',
    shadowColor: '#1E1B4B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  menuCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  menuIconBox: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  menuCardBottom: {
    marginTop: 12,
  },
  menuLabel: { color: AppColors.textPrimary, fontSize: 14.5, fontWeight: '700', letterSpacing: -0.2 },
  menuSubtitle: { color: AppColors.textSecondary, fontSize: 11.5, fontWeight: '500', marginTop: 2 },
  emptyText: { color: AppColors.textSecondary, fontSize: 13, marginTop: 10 },
  txnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: AppColors.border,
    backgroundColor: AppColors.surface,
    marginBottom: 8,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 2,
  },
  txnIconBox: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  txnTitle: { color: AppColors.textPrimary, fontSize: 13.5, fontWeight: '700' },
  txnDate: { color: AppColors.textMuted, fontSize: 11.5, marginTop: 2 },
  txnAmount: { fontSize: 14, fontWeight: '800' },
});
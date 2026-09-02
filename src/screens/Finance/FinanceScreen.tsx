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
    color: string;
    bg: string;
    screen: string;
  }[] = [
    { icon: 'bank-outline', label: 'Loans', color: AppColors.primary, bg: AppColors.primarySoft, screen: 'Loans' },
    { icon: 'credit-card-outline', label: 'EMI', color: AppColors.info, bg: AppColors.infoSoft, screen: 'Emi' },
    { icon: 'arrow-top-right', label: 'Expenses', color: AppColors.danger, bg: AppColors.dangerSoft, screen: 'Expenses' },
    { icon: 'arrow-bottom-left', label: 'Income', color: AppColors.success, bg: AppColors.successSoft, screen: 'Income' },
    { icon: 'book-open-outline', label: 'Ledger', color: AppColors.warning, bg: AppColors.warningSoft, screen: 'Ledger' },
    { icon: 'receipt', label: 'Transactions', color: AppColors.teal, bg: AppColors.tealSoft, screen: 'Transactions' },
  ];

  return (
    <View style={styles.screen}>
      <View style={styles.appBar}>
        <Text style={styles.appBarTitle}>Finance</Text>
        <Text style={styles.appBarSubtitle}>Loans, expenses and ledger</Text>
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
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={AppColors.primary} />}
        >
          <BalanceCard net={summary.net} />

          <View style={styles.statsRow}>
            <StatCard
              label="Income"
              value={formatRupee(summary.income)}
              icon="arrow-bottom-left"
              color={AppColors.success}
              bg={AppColors.successSoft}
            />
            <View style={{ width: 10 }} />
            <StatCard
              label="Expenses"
              value={formatRupee(summary.expenses)}
              icon="arrow-top-right"
              color={AppColors.danger}
              bg={AppColors.dangerSoft}
            />
          </View>

          <Text style={styles.sectionLabel}>Manage</Text>
          <View style={styles.grid}>
            {menuItems.map((item) => (
              <MenuCard
                key={item.screen}
                icon={item.icon}
                label={item.label}
                color={item.color}
                bg={item.bg}
                onPress={() => navigation.navigate(item.screen)}
              />
            ))}
          </View>

          <Text style={styles.sectionLabel}>Recent transactions</Text>
          {recent.length === 0 ? (
            <Text style={styles.emptyText}>No transactions yet</Text>
          ) : (
            recent.map((t) => (
              <TxnRow
                key={t.id}
                title={`${t.referenceName ?? t.sourceType} · ${t.description ?? ''}`}
                date={formatDMY(t.createdAt)}
                amount={`${t.type === 'INCOME' ? '+' : '-'}${formatRupee(t.amount)}`}
                credit={t.type === 'INCOME'}
              />
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
}: {
  label: string;
  value: string;
  icon: string;
  color: string;
  bg: string;
}) {
  return (
    <View style={[styles.statCard, { backgroundColor: bg, flex: 1 }]}>
      <View style={styles.statCardHeader}>
        <MaterialCommunityIcons name={icon} color={color} size={15} />
        <Text style={[styles.statCardLabel, { color }]}>{label}</Text>
      </View>
      <Text style={[styles.statCardValue, { color }]}>{value}</Text>
    </View>
  );
}

function MenuCard({
  icon,
  label,
  color,
  bg,
  onPress,
}: {
  icon: string;
  label: string;
  color: string;
  bg: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity activeOpacity={0.7} style={styles.menuCard} onPress={onPress}>
      <View style={[styles.menuIconBox, { backgroundColor: bg }]}>
        <MaterialCommunityIcons name={icon} color={color} size={20} />
      </View>
      <Text style={styles.menuLabel}>{label}</Text>
    </TouchableOpacity>
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
    height: 64,
    justifyContent: 'center',
    paddingHorizontal: 16,
    backgroundColor: AppColors.surface,
    borderBottomWidth: 1,
    borderBottomColor: AppColors.border,
  },
  appBarTitle: { color: AppColors.textPrimary, fontSize: 18, fontWeight: '700' },
  appBarSubtitle: { color: AppColors.textSecondary, fontSize: 12.5, marginTop: 2 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  errorText: { color: AppColors.danger, fontSize: 12.5 },
  content: { padding: 16, paddingTop: 18, paddingBottom: 24 },
  balanceCard: {
    padding: 18,
    borderRadius: 18,
    backgroundColor: AppColors.primary,
    overflow: 'hidden',
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
  balanceLabel: { color: 'rgba(255,255,255,0.85)', fontSize: 12 },
  balanceValue: { color: '#fff', fontSize: 24, fontWeight: '800', marginTop: 4 },
  statsRow: { flexDirection: 'row', marginTop: 16 },
  statCard: { padding: 13, borderRadius: 14 },
  statCardHeader: { flexDirection: 'row', alignItems: 'center' },
  statCardLabel: { fontSize: 11.5, fontWeight: '500', marginLeft: 5, opacity: 0.85 },
  statCardValue: { fontSize: 17, fontWeight: '800', marginTop: 6 },
  sectionLabel: { color: AppColors.textSecondary, fontSize: 13, fontWeight: '600', marginTop: 22, marginBottom: 10 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  menuCard: {
    width: '48%',
    aspectRatio: 1.35,
    backgroundColor: AppColors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: AppColors.border,
    padding: 14,
    justifyContent: 'center',
    marginBottom: 12,
  },
  menuIconBox: { width: 38, height: 38, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  menuLabel: { color: AppColors.textPrimary, fontSize: 13.5, fontWeight: '700', marginTop: 12 },
  emptyText: { color: AppColors.textSecondary, fontSize: 13, marginTop: 10 },
  txnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 13,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: AppColors.border,
    backgroundColor: AppColors.surface,
    marginBottom: 10,
  },
  txnIconBox: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  txnTitle: { color: AppColors.textPrimary, fontSize: 13, fontWeight: '600' },
  txnDate: { color: AppColors.textMuted, fontSize: 11, marginTop: 2 },
  txnAmount: { fontSize: 13.5, fontWeight: '700' },
});
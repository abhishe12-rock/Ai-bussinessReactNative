import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { AppColors } from '../theme/AppColors';
import { FinanceService, TransactionRecord } from '../../services/FinanceService.ts';
import Icon from '@react-native-vector-icons/material-icons';

const DATE_FILTER_OPTIONS = ['Today', 'Yesterday', 'This Week', 'This Month'];

function startDateFor(filter: string): Date | undefined {
  const now = new Date();
  switch (filter) {
    case 'Today':
      return new Date(now.getFullYear(), now.getMonth(), now.getDate());
    case 'Yesterday': {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      d.setDate(d.getDate() - 1);
      return d;
    }
    case 'This Week': {
      const jsDay = now.getDay();
      const isoWeekday = jsDay === 0 ? 7 : jsDay;
      const d = new Date(now);
      d.setDate(d.getDate() - (isoWeekday - 1));
      return d;
    }
    case 'This Month':
      return new Date(now.getFullYear(), now.getMonth(), 1);
    default:
      return undefined;
  }
}

function dayLabel(d: Date): string {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const that = new Date(d.getFullYear(), d.getMonth(), d.getDate());

  if (that.getTime() === today.getTime()) return 'TODAY';

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  if (that.getTime() === yesterday.getTime()) return 'YESTERDAY';

  return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
}

function formatRupee(n: number): string {
  return `₹${Math.round(n).toString()}`;
}

const TYPE_OPTIONS = ['All', 'INCOME', 'EXPENSE'];

export default function TransactionsScreen() {
  const navigation = useNavigation<any>();
  const [transactions, setTransactions] = useState<TransactionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dateFilter, setDateFilter] = useState('This Month');
  const [typeFilter, setTypeFilter] = useState('All');

  const load = useCallback(
    async (df: string, tf: string, isRefresh = false) => {
      isRefresh ? setRefreshing(true) : setLoading(true);
      setError(null);
      try {
        const data = await FinanceService.getTransactions({ from: startDateFor(df), typeFilter: tf });
        setTransactions(data);
      } catch (e: any) {
        setError(`Failed to load transactions: ${e?.message ?? e}`);
      } finally {
        isRefresh ? setRefreshing(false) : setLoading(false);
      }
    },
    [],
  );

  useFocusEffect(
    useCallback(() => {
      load(dateFilter, typeFilter);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [dateFilter, typeFilter]),
  );

  const grouped = useMemo(() => {
    const map = new Map<string, TransactionRecord[]>();
    for (const t of transactions) {
      const label = dayLabel(t.createdAt);
      if (!map.has(label)) map.set(label, []);
      map.get(label)!.push(t);
    }
    return Array.from(map.entries());
  }, [transactions]);

  return (
    <View style={styles.screen}>
      <View style={styles.appBar}>
        <View style={styles.headerLeft}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backBtn}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Icon name="chevron-left" color={AppColors.primary} size={30} />
          </TouchableOpacity>
          <Text style={styles.appBarTitle}>Transactions</Text>
        </View>
      </View>

      <View style={styles.chipRow}>
        <FlatList
          horizontal
          data={DATE_FILTER_OPTIONS as unknown as string[]}
          keyExtractor={(o) => o}
          showsHorizontalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={{ width: 8 }} />}
          renderItem={({ item }) => (
            <Chip label={item} selected={dateFilter === item} onPress={() => setDateFilter(item)} />
          )}
        />
      </View>

      <View style={styles.chipRow}>
        <FlatList
          horizontal
          data={TYPE_OPTIONS}
          keyExtractor={(o) => o}
          showsHorizontalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={{ width: 8 }} />}
          renderItem={({ item }) => (
            <Chip
              label={item === 'All' ? 'All' : item === 'INCOME' ? 'Income' : 'Expense'}
              selected={typeFilter === item}
              dark
              onPress={() => setTypeFilter(item)}
            />
          )}
        />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={AppColors.primary} />
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : transactions.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyText}>No transactions for this filter</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(dateFilter, typeFilter, true)} tintColor={AppColors.primary} />}
        >
          {grouped.map(([label, items]) => (
            <View key={label} style={{ marginBottom: 16 }}>
              <Text style={styles.groupLabel}>{label}</Text>
              {items.map((t) => {
                const credit = t.type === 'INCOME';
                const color = credit ? AppColors.success : AppColors.danger;
                const bg = credit ? AppColors.successSoft : AppColors.dangerSoft;
                return (
                  <View key={t.id} style={styles.row}>
                    <View style={[styles.iconBox, { backgroundColor: bg }]}>
                      <MaterialCommunityIcons name={credit ? 'arrow-bottom-left' : 'arrow-top-right'} color={color} size={16} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.rowTitle} numberOfLines={1}>
                        {t.referenceName ?? t.sourceType}
                      </Text>
                      {t.description ? <Text style={styles.rowDescription}>{t.description}</Text> : null}
                    </View>
                    <Text style={[styles.rowAmount, { color }]}>
                      {credit ? '+' : '-'}
                      {formatRupee(t.amount)}
                    </Text>
                  </View>
                );
              })}
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

function Chip({
  label,
  selected,
  onPress,
  dark,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
  dark?: boolean;
}) {
  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      style={[
        styles.chip,
        selected && { backgroundColor: dark ? AppColors.textPrimary : AppColors.primary, borderColor: dark ? AppColors.textPrimary : AppColors.primary },
      ]}
    >
      <Text style={[styles.chipLabel, selected && { color: '#fff' }]}>{label}</Text>
    </TouchableOpacity>
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
    flexDirection: 'row',
    alignItems: 'center',
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
  chipRow: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 6, height: 34 + 18 },
  chip: {
    height: 32,
    paddingHorizontal: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: AppColors.border,
    backgroundColor: AppColors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipLabel: { fontSize: 12, fontWeight: '600', color: AppColors.textSecondary },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  errorText: { color: AppColors.danger, fontSize: 12.5, fontWeight: '500' },
  emptyText: { color: AppColors.textSecondary, fontSize: 13 },
  listContent: { padding: 16, paddingBottom: 32 },
  groupLabel: { color: AppColors.textSecondary, fontSize: 11, fontWeight: '700', letterSpacing: 0.6, marginBottom: 8, textTransform: 'uppercase' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: AppColors.border,
    backgroundColor: AppColors.surface,
    marginBottom: 8,
    shadowColor: AppColors.textPrimary,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 4,
    elevation: 1,
  },
  iconBox: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  rowTitle: { color: AppColors.textPrimary, fontSize: 13, fontWeight: '600' },
  rowDescription: { color: AppColors.textMuted, fontSize: 11, marginTop: 2 },
  rowAmount: { fontSize: 13.5, fontWeight: '700' },
});
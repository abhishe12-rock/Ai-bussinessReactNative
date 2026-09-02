import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { AppColors } from '../theme/AppColors';
import { FinanceService, IncomeRecord } from '../../services/FinanceService.ts';

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

function formatDMY(d: Date): string {
  return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
}

function formatRupee(n: number): string {
  return `₹${Math.round(n).toString()}`;
}

export default function IncomeScreen() {
  const [income, setIncome] = useState<IncomeRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dateFilter, setDateFilter] = useState('This Month');

  const load = useCallback(async (filter: string, isRefresh = false) => {
    isRefresh ? setRefreshing(true) : setLoading(true);
    setError(null);
    try {
      const data = await FinanceService.getIncome(startDateFor(filter));
      setIncome(data);
    } catch (e: any) {
      setError(`Failed to load income: ${e?.message ?? e}`);
    } finally {
      isRefresh ? setRefreshing(false) : setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load(dateFilter);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [dateFilter]),
  );

  const total = income.reduce((sum, i) => sum + i.amount, 0);

  return (
    <View style={styles.screen}>
      <View style={styles.appBar}>
        <Text style={styles.appBarTitle}>Income</Text>
      </View>

      <View style={styles.chipRow}>
        <FlatList
          horizontal
          data={DATE_FILTER_OPTIONS as unknown as string[]}
          keyExtractor={(o) => o}
          showsHorizontalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={{ width: 8 }} />}
          renderItem={({ item }) => (
            <Chip
              label={item}
              selected={dateFilter === item}
              onPress={() => setDateFilter(item)}
            />
          )}
        />
      </View>

      <View style={styles.totalCard}>
        <Text style={styles.totalLabel}>Total Income</Text>
        <Text style={styles.totalValue}>{formatRupee(total)}</Text>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={AppColors.primary} />
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : income.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyText}>No income recorded for this period</Text>
        </View>
      ) : (
        <FlatList
          data={income}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(dateFilter, true)} tintColor={AppColors.primary} />}
          renderItem={({ item }) => (
            <View style={styles.row}>
              <View style={styles.iconBox}>
                <MaterialCommunityIcons name="arrow-bottom-left" color={AppColors.success} size={16} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.rowTitle}>{item.referenceName ?? item.sourceType}</Text>
                {item.description ? <Text style={styles.rowDescription}>{item.description}</Text> : null}
                <Text style={styles.rowDate}>{formatDMY(item.createdAt)}</Text>
              </View>
              <Text style={styles.rowAmount}>+{formatRupee(item.amount)}</Text>
            </View>
          )}
        />
      )}
    </View>
  );
}

function Chip({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      style={[styles.chip, selected && { backgroundColor: AppColors.primary, borderColor: AppColors.primary }]}
    >
      <Text style={[styles.chipLabel, selected && { color: '#fff' }]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: AppColors.background },
  appBar: {
    height: 56,
    justifyContent: 'center',
    paddingHorizontal: 16,
    backgroundColor: AppColors.surface,
    borderBottomWidth: 1,
    borderBottomColor: AppColors.border,
  },
  appBarTitle: { color: AppColors.textPrimary, fontSize: 18, fontWeight: '700' },
  chipRow: { paddingHorizontal: 16, paddingTop: 14, paddingBottom: 8, height: 34 + 22 },
  chip: {
    height: 34,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: AppColors.border,
    backgroundColor: AppColors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipLabel: { fontSize: 12, fontWeight: '600', color: AppColors.textSecondary },
  totalCard: {
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 14,
    borderRadius: 14,
    backgroundColor: AppColors.successSoft,
  },
  totalLabel: { color: AppColors.success, fontSize: 12 },
  totalValue: { color: AppColors.success, fontSize: 22, fontWeight: '800', marginTop: 4 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  errorText: { color: AppColors.danger, fontSize: 12.5 },
  emptyText: { color: AppColors.textSecondary, fontSize: 13 },
  listContent: { paddingHorizontal: 16, paddingBottom: 24 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 13,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: AppColors.border,
    backgroundColor: AppColors.surface,
  },
  iconBox: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: AppColors.successSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  rowTitle: { color: AppColors.textPrimary, fontSize: 13.5, fontWeight: '700' },
  rowDescription: { color: AppColors.textSecondary, fontSize: 12, marginTop: 1 },
  rowDate: { color: AppColors.textMuted, fontSize: 11, marginTop: 1 },
  rowAmount: { color: AppColors.success, fontSize: 14, fontWeight: '700' },
});
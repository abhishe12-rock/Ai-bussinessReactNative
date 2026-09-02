import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { useFocusEffect, useRoute } from '@react-navigation/native';
import { AppColors } from '../theme/AppColors';
import { EmiRecord, FinanceService } from '../../services/FinanceService.ts';
function formatDMY(d: Date): string {
  return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
}

function formatRupee(n: number): string {
  return `₹${Math.round(n).toString()}`;
}

const STATUS_OPTIONS = ['All', 'PENDING', 'PAID', 'OVERDUE'];

type EmiScreenParams = { loanId?: string; loanName?: string } | undefined;

export default function EmiScreen() {
  const route = useRoute();
  const { loanId, loanName } = (route.params as EmiScreenParams) ?? {};

  const [emis, setEmis] = useState<EmiRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState('All');
  const [markingPaid, setMarkingPaid] = useState<Set<string>>(new Set());

  const load = useCallback(
    async (filter: string, isRefresh = false) => {
      isRefresh ? setRefreshing(true) : setLoading(true);
      setError(null);
      try {
        const data = loanId
          ? await FinanceService.getEmisForLoan(loanId)
          : await FinanceService.getAllEmis(filter);
        setEmis(data);
      } catch (e: any) {
        setError(`Failed to load EMIs: ${e?.message ?? e}`);
      } finally {
        isRefresh ? setRefreshing(false) : setLoading(false);
      }
    },
    [loanId],
  );

  useFocusEffect(
    useCallback(() => {
      load(statusFilter);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [loanId, statusFilter]),
  );

  const filtered = useMemo(() => {
    if (!loanId) return emis; // already filtered server-side
    if (statusFilter === 'All') return emis;
    return emis.filter((e) => e.status === statusFilter);
  }, [emis, loanId, statusFilter]);

  const markPaid = async (emi: EmiRecord) => {
    setMarkingPaid((prev) => new Set(prev).add(emi.id));
    try {
      await FinanceService.markEmiPaid(emi.id);
      await load(statusFilter);
    } catch (e) {
      // swallow — UI stays as-is, could add a toast library here
    } finally {
      setMarkingPaid((prev) => {
        const next = new Set(prev);
        next.delete(emi.id);
        return next;
      });
    }
  };

  const statusColor = (status: string) => {
    switch (status) {
      case 'PAID':
        return AppColors.success;
      case 'OVERDUE':
        return AppColors.danger;
      default:
        return AppColors.warning;
    }
  };

  const statusBg = (status: string) => {
    switch (status) {
      case 'PAID':
        return AppColors.successSoft;
      case 'OVERDUE':
        return AppColors.dangerSoft;
      default:
        return AppColors.warningSoft;
    }
  };

  return (
    <View style={styles.screen}>
      <View style={styles.appBar}>
        <Text style={styles.appBarTitle}>{loanName ?? 'EMI'}</Text>
      </View>

      <View style={styles.chipRow}>
        <FlatList
          horizontal
          data={STATUS_OPTIONS}
          keyExtractor={(o) => o}
          showsHorizontalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={{ width: 8 }} />}
          renderItem={({ item }) => (
            <Chip
              label={item}
              selected={statusFilter === item}
              onPress={() => {
                setStatusFilter(item);
                if (!loanId) load(item);
              }}
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
      ) : filtered.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyText}>No EMIs match this filter</Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(statusFilter, true)} tintColor={AppColors.primary} />}
          renderItem={({ item }) => {
            const marking = markingPaid.has(item.id);
            return (
              <View style={styles.row}>
                <View style={{ flex: 1 }}>
                  {!loanId && item.loanName ? <Text style={styles.rowLoanName}>{item.loanName}</Text> : null}
                  <Text style={styles.rowDate}>{formatDMY(item.dueDate)}</Text>
                  <Text style={styles.rowAmount}>{formatRupee(item.amount)}</Text>
                </View>
                <View style={[styles.statusPill, { backgroundColor: statusBg(item.status) }]}>
                  <Text style={[styles.statusPillText, { color: statusColor(item.status) }]}>{item.status}</Text>
                </View>
                {item.status !== 'PAID' && (
                  <TouchableOpacity
                    style={styles.markPaidBtn}
                    disabled={marking}
                    onPress={() => markPaid(item)}
                  >
                    {marking ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <Text style={styles.markPaidText}>Mark Paid</Text>
                    )}
                  </TouchableOpacity>
                )}
              </View>
            );
          }}
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
  rowLoanName: { color: AppColors.textSecondary, fontSize: 11.5 },
  rowDate: { color: AppColors.textPrimary, fontSize: 13.5, fontWeight: '700' },
  rowAmount: { color: AppColors.textSecondary, fontSize: 12 },
  statusPill: { paddingHorizontal: 9, paddingVertical: 4, borderRadius: 20 },
  statusPillText: { fontSize: 10.5, fontWeight: '700' },
  markPaidBtn: {
    height: 34,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: AppColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
  },
  markPaidText: { color: '#fff', fontSize: 11.5, fontWeight: '700' },
});
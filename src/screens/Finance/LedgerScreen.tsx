import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ScrollView, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { AppColors } from '../theme/AppColors';
import { CustomerService, CustomerRecord } from '../../services/CustomerService.ts';
import { SupplierService, SupplierRecord } from '../../services/SupplierService.ts';
import { ExpenseRecord, FinanceService, IncomeRecord } from '../../services/FinanceService.ts';
import Icon from '@react-native-vector-icons/material-icons';

function formatDMY(d: Date): string {
  return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
}

function formatRupee(n: number): string {
  return `₹${Math.round(n).toString()}`;
}

export default function LedgerScreen() {
  const navigation = useNavigation<any>();
  const [tab, setTab] = useState<0 | 1>(0); // 0 = customers, 1 = suppliers
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerRecord | null>(null);
  const [selectedSupplier, setSelectedSupplier] = useState<SupplierRecord | null>(null);

  if (selectedCustomer) {
    return (
      <CustomerLedgerDetail customer={selectedCustomer} onBack={() => setSelectedCustomer(null)} />
    );
  }
  if (selectedSupplier) {
    return (
      <SupplierLedgerDetail supplier={selectedSupplier} onBack={() => setSelectedSupplier(null)} />
    );
  }

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
          <Text style={styles.appBarTitle}>Ledger</Text>
        </View>
        <View style={styles.tabRow}>
          <TabButton label="Customers" selected={tab === 0} onPress={() => setTab(0)} />
          <View style={{ width: 10 }} />
          <TabButton label="Suppliers" selected={tab === 1} onPress={() => setTab(1)} />
        </View>
      </View>

      {tab === 0 ? (
        <CustomerLedgerList onSelect={setSelectedCustomer} />
      ) : (
        <SupplierLedgerList onSelect={setSelectedSupplier} />
      )}
    </View>
  );
}

function TabButton({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      style={[styles.tabButton, selected && { backgroundColor: AppColors.primary, borderColor: AppColors.primary }]}
    >
      <Text style={[styles.tabButtonText, selected && { color: '#fff' }]}>{label}</Text>
    </TouchableOpacity>
  );
}

function CustomerLedgerList({ onSelect }: { onSelect: (c: CustomerRecord) => void }) {
  const [customers, setCustomers] = useState<CustomerRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const customerService = new CustomerService();
      const data = await customerService.getCustomers(); setCustomers(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={AppColors.primary} />
      </View>
    );
  }
  if (customers.length === 0) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyText}>No customers yet</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={customers}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.listContent}
      ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
      renderItem={({ item }) => (
        <TouchableOpacity style={styles.listRow} activeOpacity={0.7} onPress={() => onSelect(item)}>
          <Text style={styles.listRowText}>{item.name}</Text>
          <MaterialCommunityIcons name="chevron-right" color={AppColors.textMuted} size={22} />
        </TouchableOpacity>
      )}
    />
  );
}

function SupplierLedgerList({ onSelect }: { onSelect: (s: SupplierRecord) => void }) {
  const [suppliers, setSuppliers] = useState<SupplierRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const supplierService = new SupplierService();
      const data = await supplierService.getSuppliers(); setSuppliers(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={AppColors.primary} />
      </View>
    );
  }
  if (suppliers.length === 0) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyText}>No suppliers yet</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={suppliers}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.listContent}
      ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
      renderItem={({ item }) => (
        <TouchableOpacity style={styles.listRow} activeOpacity={0.7} onPress={() => onSelect(item)}>
          <Text style={styles.listRowText}>{item.name}</Text>
          <MaterialCommunityIcons name="chevron-right" color={AppColors.textMuted} size={22} />
        </TouchableOpacity>
      )}
    />
  );
}

function CustomerLedgerDetail({ customer, onBack }: { customer: CustomerRecord; onBack: () => void }) {
  const [entries, setEntries] = useState<IncomeRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await FinanceService.getLedgerForCustomer(customer.id);
      setEntries(data);
    } finally {
      setLoading(false);
    }
  }, [customer.id]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const total = entries.reduce((sum, e) => sum + e.amount, 0);

  return (
    <View style={styles.screen}>
      <View style={styles.detailAppBar}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <MaterialCommunityIcons name="chevron-left" color={AppColors.primary} size={30} />
        </TouchableOpacity>
        <Text style={styles.detailAppBarTitle}>{customer.name}</Text>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={AppColors.primary} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          <View style={[styles.totalCard, { backgroundColor: AppColors.successSoft }]}>
            <Text style={[styles.totalLabel, { color: AppColors.success }]}>Total received</Text>
            <Text style={[styles.totalValue, { color: AppColors.success }]}>{formatRupee(total)}</Text>
          </View>

          {entries.length === 0 ? (
            <Text style={styles.emptyText}>No transactions with this customer yet</Text>
          ) : (
            entries.map((e) => (
              <View key={e.id} style={styles.row}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.rowTitle}>{e.description ?? e.sourceType}</Text>
                  <Text style={styles.rowDate}>{formatDMY(e.createdAt)}</Text>
                </View>
                <Text style={[styles.rowAmount, { color: AppColors.success }]}>+{formatRupee(e.amount)}</Text>
              </View>
            ))
          )}
        </ScrollView>
      )}
    </View>
  );
}

function SupplierLedgerDetail({ supplier, onBack }: { supplier: SupplierRecord; onBack: () => void }) {
  const [entries, setEntries] = useState<ExpenseRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await FinanceService.getLedgerForSupplier(supplier.id);
      setEntries(data);
    } finally {
      setLoading(false);
    }
  }, [supplier.id]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const total = entries.reduce((sum, e) => sum + e.amount, 0);

  return (
    <View style={styles.screen}>
      <View style={styles.detailAppBar}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <MaterialCommunityIcons name="chevron-left" color={AppColors.primary} size={30} />
        </TouchableOpacity>
        <Text style={styles.detailAppBarTitle}>{supplier.name}</Text>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={AppColors.primary} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          <View style={[styles.totalCard, { backgroundColor: AppColors.dangerSoft }]}>
            <Text style={[styles.totalLabel, { color: AppColors.danger }]}>Total paid</Text>
            <Text style={[styles.totalValue, { color: AppColors.danger }]}>{formatRupee(total)}</Text>
          </View>

          {entries.length === 0 ? (
            <Text style={styles.emptyText}>No transactions with this supplier yet</Text>
          ) : (
            entries.map((e) => (
              <View key={e.id} style={styles.row}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.rowTitle}>{e.description ?? e.category}</Text>
                  <Text style={styles.rowDate}>{formatDMY(e.createdAt)}</Text>
                </View>
                <Text style={[styles.rowAmount, { color: AppColors.danger }]}>-{formatRupee(e.amount)}</Text>
              </View>
            ))
          )}
        </ScrollView>
      )}
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
  tabRow: { flexDirection: 'row', marginTop: 10, marginBottom: 8 },
  tabButton: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: AppColors.border,
    backgroundColor: AppColors.surface,
    alignItems: 'center',
  },
  tabButtonText: { color: AppColors.textSecondary, fontSize: 13, fontWeight: '600' },
  detailAppBar: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    backgroundColor: AppColors.surface,
    borderBottomWidth: 1,
    borderBottomColor: AppColors.border,
  },
  detailAppBarTitle: { color: AppColors.textPrimary, fontSize: 17, fontWeight: '700', letterSpacing: -0.3 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyText: { color: AppColors.textSecondary, fontSize: 13, marginTop: 10 },
  listContent: { padding: 16 },
  listRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 13,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: AppColors.border,
    backgroundColor: AppColors.surface,
    shadowColor: AppColors.textPrimary,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 4,
    elevation: 1,
  },
  listRowText: { flex: 1, color: AppColors.textPrimary, fontSize: 13.5, fontWeight: '600' },
  content: { padding: 16, paddingTop: 18, paddingBottom: 32 },
  totalCard: {
    padding: 14,
    borderRadius: 12,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: `${AppColors.border}80`,
  },
  totalLabel: { fontSize: 11, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.4 },
  totalValue: { fontSize: 22, fontWeight: '800', marginTop: 5, letterSpacing: -0.5 },
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
  rowTitle: { color: AppColors.textPrimary, fontSize: 13.5, fontWeight: '600' },
  rowDate: { color: AppColors.textMuted, fontSize: 11, marginTop: 2 },
  rowAmount: { fontSize: 13.5, fontWeight: '700' },
});
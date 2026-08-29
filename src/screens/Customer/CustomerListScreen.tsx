import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet,
  ActivityIndicator, RefreshControl, Alert, Modal, Pressable,
} from 'react-native';
import Icon from '@react-native-vector-icons/material-icons';
import { useNavigation } from '@react-navigation/native';

import { CustomerService, CustomerRecord } from '../../services/CustomerService';
import { AppColors } from '../theme/AppColors';

type SortBy = 'name' | 'city';

const service = new CustomerService();

export default function CustomerListScreen() {
  const navigation = useNavigation<any>();

  const [customers, setCustomers] = useState<CustomerRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortBy>('name');
  const [sortSheetOpen, setSortSheetOpen] = useState(false);

  const loadCustomers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await service.getCustomers();
      setCustomers(data);
    } catch (e: any) {
      setError(`Failed to load customers: ${e.message ?? e}`);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCustomers();
  }, [loadCustomers]);

  const filtered = useMemo(() => {
    let list = customers.filter(
      (c) =>
        c.name.toLowerCase().includes(query.toLowerCase()) ||
        c.phone.includes(query),
    );
    if (sortBy === 'name') list = [...list].sort((a, b) => a.name.localeCompare(b.name));
    if (sortBy === 'city') list = [...list].sort((a, b) => (a.city ?? '').localeCompare(b.city ?? ''));
    return list;
  }, [customers, query, sortBy]);

  const confirmDelete = (customer: CustomerRecord) => {
    Alert.alert('Delete customer?', `Are you sure you want to delete ${customer.name}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await service.deleteCustomer(customer.id);
            loadCustomers();
          } catch (e: any) {
            Alert.alert('Delete failed', String(e.message ?? e));
          }
        },
      },
    ]);
  };

  const renderBody = () => {
    if (loading) {
      return (
        <View style={styles.centerFill}>
          <ActivityIndicator color={AppColors.primary} />
        </View>
      );
    }
    if (error) {
      return (
        <View style={styles.centerFill}>
          <Icon name="error-outline" color={AppColors.danger} size={32} />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={loadCustomers}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      );
    }
    if (filtered.length === 0) {
      return (
        <View style={styles.centerFill}>
          <View style={styles.emptyIconWrap}>
            <Icon name="people-outline" color={AppColors.primary} size={28} />
          </View>
          <Text style={styles.emptyTitle}>No customers yet</Text>
          <Text style={styles.emptySubtitle}>Tap "Add customer" to create your first one</Text>
        </View>
      );
    }
    return (
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={loadCustomers} />}
        renderItem={({ item }) => (
          <CustomerCard
            customer={item}
            onPress={() => navigation.navigate('CustomerDetails', { customer: item })}
            onEdit={async () => {
              navigation.navigate('EditCustomer', { customer: item, onSaved: loadCustomers });
            }}
            onDelete={() => confirmDelete(item)}
          />
        )}
      />
    );
  };

  return (
    <View style={styles.flex}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Customers</Text>
        <TouchableOpacity onPress={() => setSortSheetOpen(true)}>
          <Icon name="sort" color={AppColors.textSecondary} size={22} />
        </TouchableOpacity>
      </View>

      <View style={styles.searchWrap}>
        <View style={styles.searchBox}>
          <Icon name="search" color={AppColors.textMuted} size={20} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name / mobile"
            placeholderTextColor={AppColors.textMuted}
            value={query}
            onChangeText={setQuery}
          />
        </View>
        <Text style={styles.countText}>{loading ? 'Loading...' : `${filtered.length} customers`}</Text>
      </View>

      {renderBody()}

      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('AddCustomer', { onSaved: loadCustomers })}
      >
        <Icon name="person-add-alt-1" color="#fff" size={20} />
        <Text style={styles.fabText}>Add customer</Text>
      </TouchableOpacity>

      <Modal visible={sortSheetOpen} transparent animationType="slide" onRequestClose={() => setSortSheetOpen(false)}>
        <Pressable style={styles.sheetBackdrop} onPress={() => setSortSheetOpen(false)}>
          <View style={styles.sheet}>
            <View style={styles.sheetHandle} />
            <SortTile label="Name (A-Z)" selected={sortBy === 'name'} onPress={() => { setSortBy('name'); setSortSheetOpen(false); }} />
            <SortTile label="City" selected={sortBy === 'city'} onPress={() => { setSortBy('city'); setSortSheetOpen(false); }} />
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

function SortTile({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.sortTile} onPress={onPress}>
      <Text style={[styles.sortTileText, selected && { color: AppColors.primary, fontWeight: '700' }]}>{label}</Text>
      {selected && <Icon name="check" color={AppColors.primary} size={18} />}
    </TouchableOpacity>
  );
}

function CustomerCard({
  customer, onPress, onEdit, onDelete,
}: {
  customer: CustomerRecord; onPress: () => void; onEdit: () => void; onDelete: () => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const initials = customer.name.trim()
    ? customer.name.trim().split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()
    : '?';

  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{initials}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.cardName}>{customer.name}</Text>
        <Text style={styles.cardSub}>Phone: {customer.phone}</Text>
{customer.city ? <Text style={styles.cardMuted}>City: {customer.city}</Text> : null}
      </View>
      <View>
        <TouchableOpacity onPress={() => setMenuOpen((v) => !v)}>
          <Icon name="more-vert" color={AppColors.textMuted} size={20} />
        </TouchableOpacity>
        {menuOpen && (
          <View style={styles.menu}>
            <TouchableOpacity style={styles.menuItem} onPress={() => { setMenuOpen(false); onEdit(); }}>
              <Icon name="edit" color={AppColors.textSecondary} size={16} />
              <Text style={styles.menuText}>Edit</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuItem} onPress={() => { setMenuOpen(false); onDelete(); }}>
              <Icon name="delete-outline" color={AppColors.danger} size={16} />
              <Text style={[styles.menuText, { color: AppColors.danger }]}>Delete</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: AppColors.background },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 16, backgroundColor: AppColors.surface, borderBottomWidth: 1, borderColor: AppColors.border,
  },
  headerTitle: { fontSize: 18, fontWeight: '600', color: AppColors.textPrimary },
  searchWrap: { paddingHorizontal: 16, paddingTop: 14, paddingBottom: 8 },
  searchBox: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: AppColors.surface,
    borderRadius: 12, borderWidth: 1, borderColor: AppColors.border, paddingHorizontal: 14,
  },
  searchInput: { flex: 1, paddingVertical: 12, marginLeft: 8, color: AppColors.textPrimary },
  countText: { color: AppColors.textSecondary, fontSize: 12.5, marginTop: 6 },
  centerFill: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 },
  errorText: { color: AppColors.textSecondary, fontSize: 12.5, textAlign: 'center', marginTop: 10 },
  retryText: { color: AppColors.primary, marginTop: 10 },
  emptyIconWrap: { width: 64, height: 64, borderRadius: 32, backgroundColor: AppColors.primarySoft, alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  emptyTitle: { color: AppColors.textPrimary, fontSize: 14.5, fontWeight: '600' },
  emptySubtitle: { color: AppColors.textSecondary, fontSize: 12.5, marginTop: 4, textAlign: 'center' },
  card: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: AppColors.surface,
    borderRadius: 14, borderWidth: 1, borderColor: AppColors.border, padding: 14,
  },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: AppColors.primarySoft, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  avatarText: { color: AppColors.primary, fontWeight: '600', fontSize: 14 },
  cardName: { color: AppColors.textPrimary, fontSize: 14.5, fontWeight: '600' },
  cardSub: { color: AppColors.textSecondary, fontSize: 12.5, marginTop: 3 },
  cardMuted: { color: AppColors.textMuted, fontSize: 11.5, marginTop: 2 },
  menu: {
    position: 'absolute', right: 0, top: 24, backgroundColor: AppColors.surface,
    borderRadius: 12, borderWidth: 1, borderColor: AppColors.border, elevation: 4, zIndex: 10, width: 130,
  },
  menuItem: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingVertical: 10 },
  menuText: { color: AppColors.textPrimary, fontSize: 13 },
  fab: {
    position: 'absolute', right: 16, bottom: 20, flexDirection: 'row', alignItems: 'center',
    backgroundColor: AppColors.primary, borderRadius: 28, paddingVertical: 14, paddingHorizontal: 18, gap: 8, elevation: 4,
  },
  fabText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  sheetBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: AppColors.surface, borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingVertical: 10 },
  sheetHandle: { width: 36, height: 4, borderRadius: 4, backgroundColor: AppColors.border, alignSelf: 'center', marginBottom: 14 },
  sortTile: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 14 },
  sortTileText: { color: AppColors.textPrimary, fontSize: 14, fontWeight: '500' },
});
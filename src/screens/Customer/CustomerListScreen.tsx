import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Modal,
  Pressable,
} from 'react-native';
import Icon from '@react-native-vector-icons/material-icons';
import { useNavigation } from '@react-navigation/native';

import { CustomerService, CustomerRecord } from '../../services/CustomerService';
import { AppColors } from '../theme/AppColors';
import { FadeInUp, SpringTouch } from '../theme/Animations';

type SortBy = 'name' | 'city';
type FilterStatus = 'All' | 'Active' | 'Inactive';

const service = new CustomerService();

const PASTEL_PALETTES = [
  { bg: '#FEE2E2', text: '#EF4444' }, // Red/Pink (Rajesh Enterprises)
  { bg: '#E0E7FF', text: '#4F46E5' }, // Blue (Sharma Traders)
  { bg: '#FEF3C7', text: '#D97706' }, // Amber (Vijay Stores)
  { bg: '#EDE9FE', text: '#7C3AED' }, // Purple (Karthik Solutions)
  { bg: '#FCE7F3', text: '#DB2777' }, // Pink (Balaji Traders)
  { bg: '#D1FAE5', text: '#059669' }, // Emerald
];

function getPastelColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash + name.charCodeAt(i)) % PASTEL_PALETTES.length;
  }
  return PASTEL_PALETTES[hash];
}

export default function CustomerListScreen() {
  const navigation = useNavigation<any>();

  const [customers, setCustomers] = useState<CustomerRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [filterTab, setFilterTab] = useState<FilterStatus>('All');
  const [sortBy, setSortBy] = useState<SortBy>('name');
  const [sortSheetOpen, setSortSheetOpen] = useState(false);

  // Active customer for action sheet (Edit/Delete)
  const [activeCustomer, setActiveCustomer] = useState<CustomerRecord | null>(null);

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
        c.phone.includes(query) ||
        (c.email && c.email.toLowerCase().includes(query.toLowerCase())),
    );

    if (filterTab === 'Active') {
      list = list.filter((c) => (c as any).status !== 'inactive');
    } else if (filterTab === 'Inactive') {
      list = list.filter((c) => (c as any).status === 'inactive');
    }

    if (sortBy === 'name') list = [...list].sort((a, b) => a.name.localeCompare(b.name));
    if (sortBy === 'city') list = [...list].sort((a, b) => (a.city ?? '').localeCompare(b.city ?? ''));
    return list;
  }, [customers, query, filterTab, sortBy]);

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
          <ActivityIndicator color={AppColors.primary} size="large" />
        </View>
      );
    }
    if (error) {
      return (
        <View style={styles.centerFill}>
          <Icon name="error-outline" color={AppColors.danger} size={36} />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={loadCustomers} style={styles.retryBtn}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      );
    }
    if (filtered.length === 0) {
      return (
        <View style={styles.centerFill}>
          <View style={styles.emptyIconWrap}>
            <Icon name="people-outline" color={AppColors.primary} size={32} />
          </View>
          <Text style={styles.emptyTitle}>No customers found</Text>
          <Text style={styles.emptySubtitle}>Tap (+) on top right to add a customer</Text>
        </View>
      );
    }
    return (
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 6, paddingBottom: 28 }}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={loadCustomers} tintColor={AppColors.primary} />}
        renderItem={({ item, index }) => (
          <CustomerCard
            customer={item}
            index={index}
            onPress={() => navigation.navigate('CustomerDetails', { customer: item })}
            onLongPress={() => setActiveCustomer(item)}
          />
        )}
      />
    );
  };

  return (
    <View style={styles.flex}>
      {/* TOP HEADER */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Icon name="chevron-left" color={AppColors.textPrimary} size={28} />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Customers</Text>

        <View style={styles.headerRight}>
          <TouchableOpacity
            onPress={() => setSortSheetOpen(true)}
            style={styles.headerIconBtn}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Icon name="search" color={AppColors.textPrimary} size={22} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => navigation.navigate('AddCustomer', { onSaved: loadCustomers })}
            style={styles.headerAddBtn}
            activeOpacity={0.8}
          >
            <Icon name="add" color="#FFFFFF" size={18} />
          </TouchableOpacity>
        </View>
      </View>

      {/* SEARCH BAR WITH FILTER SLIDER */}
      <View style={styles.searchRow}>
        <View style={styles.searchBox}>
          <Icon name="search" color={AppColors.textMuted} size={20} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search customers..."
            placeholderTextColor={AppColors.textMuted}
            value={query}
            onChangeText={setQuery}
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Icon name="close" color={AppColors.textMuted} size={18} />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity
          onPress={() => setSortSheetOpen(true)}
          style={styles.filterBtn}
          activeOpacity={0.7}
        >
          <Icon name="tune" color={AppColors.textSecondary} size={20} />
        </TouchableOpacity>
      </View>

      {/* SEGMENTED FILTER TABS */}
      <View style={styles.tabRow}>
        {(['All', 'Active', 'Inactive'] as FilterStatus[]).map((tab) => {
          const isSelected = filterTab === tab;
          return (
            <TouchableOpacity
              key={tab}
              onPress={() => setFilterTab(tab)}
              style={[styles.filterTab, isSelected && styles.filterTabActive]}
              activeOpacity={0.8}
            >
              <Text style={[styles.filterTabText, isSelected && styles.filterTabTextActive]}>
                {tab}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* BODY LIST */}
      {renderBody()}

      {/* SORT SHEET */}
      <Modal visible={sortSheetOpen} transparent animationType="slide" onRequestClose={() => setSortSheetOpen(false)}>
        <Pressable style={styles.sheetBackdrop} onPress={() => setSortSheetOpen(false)}>
          <View style={styles.sheet}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>Sort by</Text>
            <SortTile label="Name (A-Z)" selected={sortBy === 'name'} onPress={() => { setSortBy('name'); setSortSheetOpen(false); }} />
            <SortTile label="City" selected={sortBy === 'city'} onPress={() => { setSortBy('city'); setSortSheetOpen(false); }} />
          </View>
        </Pressable>
      </Modal>

      {/* CUSTOMER ACTIONS SHEET */}
      <Modal
        visible={!!activeCustomer}
        transparent
        animationType="fade"
        onRequestClose={() => setActiveCustomer(null)}
      >
        <Pressable style={styles.sheetBackdrop} onPress={() => setActiveCustomer(null)}>
          <View style={styles.sheet}>
            <View style={styles.sheetHandle} />
            {activeCustomer && (
              <>
                <View style={styles.sheetHeaderRow}>
                  <View style={[styles.avatarCircle, { backgroundColor: getPastelColor(activeCustomer.name).bg }]}>
                    <Text style={[styles.avatarText, { color: getPastelColor(activeCustomer.name).text }]}>
                      {activeCustomer.name.trim().charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.sheetCustomerName} numberOfLines={1}>{activeCustomer.name}</Text>
                    <Text style={styles.sheetCustomerSub}>{activeCustomer.phone}</Text>
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.actionRow}
                  onPress={() => {
                    const c = activeCustomer;
                    setActiveCustomer(null);
                    navigation.navigate('EditCustomer', { customer: c, onSaved: loadCustomers });
                  }}
                >
                  <View style={[styles.actionIconWrap, { backgroundColor: `${AppColors.primary}14` }]}>
                    <Icon name="edit" color={AppColors.primary} size={18} />
                  </View>
                  <Text style={styles.actionText}>Edit customer</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.actionRow}
                  onPress={() => {
                    const c = activeCustomer;
                    setActiveCustomer(null);
                    confirmDelete(c);
                  }}
                >
                  <View style={[styles.actionIconWrap, { backgroundColor: `${AppColors.danger}14` }]}>
                    <Icon name="delete-outline" color={AppColors.danger} size={18} />
                  </View>
                  <Text style={[styles.actionText, { color: AppColors.danger }]}>Delete customer</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.cancelBtn} onPress={() => setActiveCustomer(null)}>
                  <Text style={styles.cancelText}>Cancel</Text>
                </TouchableOpacity>
              </>
            )}
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
  customer,
  index,
  onPress,
  onLongPress,
}: {
  customer: CustomerRecord;
  index: number;
  onPress: () => void;
  onLongPress: () => void;
}) {
  const pastel = getPastelColor(customer.name);
  const firstLetter = customer.name.trim().charAt(0).toUpperCase() || 'C';

  return (
    <FadeInUp delay={Math.min(index * 35, 350)} distance={12}>
      <SpringTouch
        style={{ width: '100%' }}
        activeScale={0.98}
        onPress={onPress}
      >
        <View style={styles.card}>
          {/* Circular letter avatar */}
          <View style={[styles.avatarCircle, { backgroundColor: pastel.bg }]}>
            <Text style={[styles.avatarText, { color: pastel.text }]}>{firstLetter}</Text>
          </View>

          {/* Info Column */}
          <View style={styles.cardBody}>
            <Text style={styles.cardName} numberOfLines={1}>{customer.name}</Text>
            <View style={styles.cardInfoRow}>
              <Icon name="call" size={13} color={AppColors.textMuted} />
              <Text style={styles.cardPhone}>{customer.phone}</Text>
            </View>
            {customer.city ? (
              <View style={styles.cardInfoRow}>
                <Icon name="place" size={13} color={AppColors.textMuted} />
                <Text style={styles.cardCity}>{customer.city}</Text>
              </View>
            ) : customer.email ? (
              <View style={styles.cardInfoRow}>
                <Icon name="mail-outline" size={13} color={AppColors.textMuted} />
                <Text style={styles.cardEmail}>{customer.email}</Text>
              </View>
            ) : null}
          </View>

          {/* Action More Button */}
          <TouchableOpacity
            onPress={onLongPress}
            style={styles.moreBtn}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Icon name="more-vert" size={22} color={AppColors.textMuted} />
          </TouchableOpacity>
        </View>
      </SpringTouch>
    </FadeInUp>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: AppColors.background },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 52,
    paddingBottom: 12,
    paddingHorizontal: 16,
    backgroundColor: AppColors.background,
  },
  backBtn: {
    padding: 4,
    marginLeft: -4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: AppColors.textPrimary,
    letterSpacing: -0.3,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerIconBtn: {
    padding: 4,
  },
  headerAddBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: AppColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: AppColors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },

  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    gap: 10,
    marginTop: 4,
    marginBottom: 10,
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: AppColors.border,
    paddingHorizontal: 14,
    height: 46,
    shadowColor: '#1E1B4B',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 10,
    marginLeft: 8,
    color: AppColors.textPrimary,
    fontSize: 13.5,
    fontWeight: '500',
  },
  filterBtn: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: AppColors.border,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#1E1B4B',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },

  tabRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
    gap: 10,
  },
  filterTab: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: AppColors.border,
  },
  filterTabActive: {
    backgroundColor: AppColors.primary,
    borderColor: AppColors.primary,
  },
  filterTabText: {
    fontSize: 13,
    fontWeight: '600',
    color: AppColors.textSecondary,
  },
  filterTabTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },

  centerFill: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 },
  errorText: { color: AppColors.danger, fontSize: 13, textAlign: 'center', marginTop: 10, fontWeight: '500' },
  retryBtn: { marginTop: 12, paddingHorizontal: 20, paddingVertical: 8, backgroundColor: AppColors.surfaceSoft, borderRadius: 12 },
  retryText: { color: AppColors.primary, fontWeight: '700', fontSize: 13 },
  emptyIconWrap: { width: 64, height: 64, borderRadius: 20, backgroundColor: AppColors.primarySoft, alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  emptyTitle: { color: AppColors.textPrimary, fontSize: 16, fontWeight: '800' },
  emptySubtitle: { color: AppColors.textSecondary, fontSize: 13, marginTop: 4, textAlign: 'center' },

  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: AppColors.border,
    paddingVertical: 14,
    paddingHorizontal: 14,
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 1.5,
  },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 17,
    fontWeight: '800',
  },
  cardBody: {
    flex: 1,
  },
  cardName: {
    color: AppColors.textPrimary,
    fontSize: 14.5,
    fontWeight: '700',
    marginBottom: 2,
    letterSpacing: -0.2,
  },
  cardEmail: {
    color: AppColors.textSecondary,
    fontSize: 12,
    marginBottom: 2,
  },
  cardPhone: {
    color: AppColors.textMuted,
    fontSize: 12,
    fontWeight: '500',
  },
  cardInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  cardCity: {
    color: AppColors.textSecondary,
    fontSize: 12,
    fontWeight: '500',
  },
  moreBtn: {
    padding: 6,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusPill: {
    paddingHorizontal: 9,
    paddingVertical: 3.5,
    borderRadius: 12,
  },
  statusPillActive: {
    backgroundColor: AppColors.successSoft,
  },
  statusPillInactive: {
    backgroundColor: AppColors.warningSoft,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  statusTextActive: {
    color: AppColors.success,
  },
  statusTextInactive: {
    color: AppColors.warning,
  },

  sheetBackdrop: { flex: 1, backgroundColor: 'rgba(30, 27, 75, 0.45)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 10,
    paddingBottom: 40,
    paddingHorizontal: 8,
  },
  sheetHandle: { width: 36, height: 4, borderRadius: 2, backgroundColor: AppColors.border, alignSelf: 'center', marginBottom: 12 },
  sheetTitle: { color: AppColors.textSecondary, fontSize: 11.5, fontWeight: '700', paddingHorizontal: 14, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.6 },

  sortTile: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 18, paddingVertical: 13 },
  sortTileText: { color: AppColors.textPrimary, fontSize: 13.5, fontWeight: '500' },

  sheetHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingBottom: 14,
    marginBottom: 6,
    borderBottomWidth: 1,
    borderColor: AppColors.border,
  },
  sheetCustomerName: { color: AppColors.textPrimary, fontSize: 14.5, fontWeight: '700' },
  sheetCustomerSub: { color: AppColors.textSecondary, fontSize: 12, marginTop: 1 },

  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  actionIconWrap: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  actionText: { color: AppColors.textPrimary, fontSize: 13.5, fontWeight: '500' },

  cancelBtn: { marginTop: 10, paddingVertical: 12, alignItems: 'center', backgroundColor: AppColors.surfaceSoft, borderRadius: 14, marginHorizontal: 14 },
  cancelText: { color: AppColors.textSecondary, fontSize: 13.5, fontWeight: '600' },
});
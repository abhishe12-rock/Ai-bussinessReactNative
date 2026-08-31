// // import React, { useEffect, useState, useCallback, useMemo } from 'react';
// // import {
// //   View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet,
// //   ActivityIndicator, RefreshControl, Alert, Modal, Pressable,
// // } from 'react-native';
// // import Icon from '@react-native-vector-icons/material-icons';
// // import { useNavigation } from '@react-navigation/native';

// // import { CustomerService, CustomerRecord } from '../../services/CustomerService';
// // import { AppColors } from '../theme/AppColors';

// // type SortBy = 'name' | 'city';

// // const service = new CustomerService();

// // export default function CustomerListScreen() {
// //   const navigation = useNavigation<any>();

// //   const [customers, setCustomers] = useState<CustomerRecord[]>([]);
// //   const [loading, setLoading] = useState(true);
// //   const [error, setError] = useState<string | null>(null);
// //   const [query, setQuery] = useState('');
// //   const [sortBy, setSortBy] = useState<SortBy>('name');
// //   const [sortSheetOpen, setSortSheetOpen] = useState(false);

// //   const loadCustomers = useCallback(async () => {
// //     setLoading(true);
// //     setError(null);
// //     try {
// //       const data = await service.getCustomers();
// //       setCustomers(data);
// //     } catch (e: any) {
// //       setError(`Failed to load customers: ${e.message ?? e}`);
// //     } finally {
// //       setLoading(false);
// //     }
// //   }, []);

// //   useEffect(() => {
// //     loadCustomers();
// //   }, [loadCustomers]);

// //   const filtered = useMemo(() => {
// //     let list = customers.filter(
// //       (c) =>
// //         c.name.toLowerCase().includes(query.toLowerCase()) ||
// //         c.phone.includes(query),
// //     );
// //     if (sortBy === 'name') list = [...list].sort((a, b) => a.name.localeCompare(b.name));
// //     if (sortBy === 'city') list = [...list].sort((a, b) => (a.city ?? '').localeCompare(b.city ?? ''));
// //     return list;
// //   }, [customers, query, sortBy]);

// //   const confirmDelete = (customer: CustomerRecord) => {
// //     Alert.alert('Delete customer?', `Are you sure you want to delete ${customer.name}?`, [
// //       { text: 'Cancel', style: 'cancel' },
// //       {
// //         text: 'Delete',
// //         style: 'destructive',
// //         onPress: async () => {
// //           try {
// //             await service.deleteCustomer(customer.id);
// //             loadCustomers();
// //           } catch (e: any) {
// //             Alert.alert('Delete failed', String(e.message ?? e));
// //           }
// //         },
// //       },
// //     ]);
// //   };

// //   const renderBody = () => {
// //     if (loading) {
// //       return (
// //         <View style={styles.centerFill}>
// //           <ActivityIndicator color={AppColors.primary} />
// //         </View>
// //       );
// //     }
// //     if (error) {
// //       return (
// //         <View style={styles.centerFill}>
// //           <Icon name="error-outline" color={AppColors.danger} size={32} />
// //           <Text style={styles.errorText}>{error}</Text>
// //           <TouchableOpacity onPress={loadCustomers}>
// //             <Text style={styles.retryText}>Retry</Text>
// //           </TouchableOpacity>
// //         </View>
// //       );
// //     }
// //     if (filtered.length === 0) {
// //       return (
// //         <View style={styles.centerFill}>
// //           <View style={styles.emptyIconWrap}>
// //             <Icon name="people-outline" color={AppColors.primary} size={28} />
// //           </View>
// //           <Text style={styles.emptyTitle}>No customers yet</Text>
// //           <Text style={styles.emptySubtitle}>Tap "Add customer" to create your first one</Text>
// //         </View>
// //       );
// //     }
// //     return (
// //       <FlatList
// //         data={filtered}
// //         keyExtractor={(item) => item.id}
// //         contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
// //         ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
// //         refreshControl={<RefreshControl refreshing={loading} onRefresh={loadCustomers} />}
// //         renderItem={({ item }) => (
// //           <CustomerCard
// //             customer={item}
// //             onPress={() => navigation.navigate('CustomerDetails', { customer: item })}
// //             onEdit={async () => {
// //               navigation.navigate('EditCustomer', { customer: item, onSaved: loadCustomers });
// //             }}
// //             onDelete={() => confirmDelete(item)}
// //           />
// //         )}
// //       />
// //     );
// //   };

// //   return (
// //     <View style={styles.flex}>
// //       <View style={styles.header}>
// //         <Text style={styles.headerTitle}>Customers</Text>
// //         <TouchableOpacity onPress={() => setSortSheetOpen(true)}>
// //           <Icon name="sort" color={AppColors.textSecondary} size={22} />
// //         </TouchableOpacity>
// //       </View>

// //       <View style={styles.searchWrap}>
// //         <View style={styles.searchBox}>
// //           <Icon name="search" color={AppColors.textMuted} size={20} />
// //           <TextInput
// //             style={styles.searchInput}
// //             placeholder="Search by name / mobile"
// //             placeholderTextColor={AppColors.textMuted}
// //             value={query}
// //             onChangeText={setQuery}
// //           />
// //         </View>
// //         <Text style={styles.countText}>{loading ? 'Loading...' : `${filtered.length} customers`}</Text>
// //       </View>

// //       {renderBody()}

// //       <TouchableOpacity
// //         style={styles.fab}
// //         onPress={() => navigation.navigate('AddCustomer', { onSaved: loadCustomers })}
// //       >
// //         <Icon name="person-add-alt-1" color="#fff" size={20} />
// //         <Text style={styles.fabText}>Add customer</Text>
// //       </TouchableOpacity>

// //       <Modal visible={sortSheetOpen} transparent animationType="slide" onRequestClose={() => setSortSheetOpen(false)}>
// //         <Pressable style={styles.sheetBackdrop} onPress={() => setSortSheetOpen(false)}>
// //           <View style={styles.sheet}>
// //             <View style={styles.sheetHandle} />
// //             <SortTile label="Name (A-Z)" selected={sortBy === 'name'} onPress={() => { setSortBy('name'); setSortSheetOpen(false); }} />
// //             <SortTile label="City" selected={sortBy === 'city'} onPress={() => { setSortBy('city'); setSortSheetOpen(false); }} />
// //           </View>
// //         </Pressable>
// //       </Modal>
// //     </View>
// //   );
// // }

// // function SortTile({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
// //   return (
// //     <TouchableOpacity style={styles.sortTile} onPress={onPress}>
// //       <Text style={[styles.sortTileText, selected && { color: AppColors.primary, fontWeight: '700' }]}>{label}</Text>
// //       {selected && <Icon name="check" color={AppColors.primary} size={18} />}
// //     </TouchableOpacity>
// //   );
// // }

// // function CustomerCard({
// //   customer, onPress, onEdit, onDelete,
// // }: {
// //   customer: CustomerRecord; onPress: () => void; onEdit: () => void; onDelete: () => void;
// // }) {
// //   const [menuOpen, setMenuOpen] = useState(false);
// //   const initials = customer.name.trim()
// //     ? customer.name.trim().split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()
// //     : '?';

// //   return (
// //     <TouchableOpacity style={styles.card} onPress={onPress}>
// //       <View style={styles.avatar}>
// //         <Text style={styles.avatarText}>{initials}</Text>
// //       </View>
// //       <View style={{ flex: 1 }}>
// //         <Text style={styles.cardName}>{customer.name}</Text>
// //         <Text style={styles.cardSub}>Phone: {customer.phone}</Text>
// // {customer.city ? <Text style={styles.cardMuted}>City: {customer.city}</Text> : null}
// //       </View>
// //       <View>
// //         <TouchableOpacity onPress={() => setMenuOpen((v) => !v)}>
// //           <Icon name="more-vert" color={AppColors.textMuted} size={20} />
// //         </TouchableOpacity>
// //         {menuOpen && (
// //           <View style={styles.menu}>
// //             <TouchableOpacity style={styles.menuItem} onPress={() => { setMenuOpen(false); onEdit(); }}>
// //               <Icon name="edit" color={AppColors.textSecondary} size={16} />
// //               <Text style={styles.menuText}>Edit</Text>
// //             </TouchableOpacity>
// //             <TouchableOpacity style={styles.menuItem} onPress={() => { setMenuOpen(false); onDelete(); }}>
// //               <Icon name="delete-outline" color={AppColors.danger} size={16} />
// //               <Text style={[styles.menuText, { color: AppColors.danger }]}>Delete</Text>
// //             </TouchableOpacity>
// //           </View>
// //         )}
// //       </View>
// //     </TouchableOpacity>
// //   );
// // }

// // const styles = StyleSheet.create({
// //   flex: { flex: 1, backgroundColor: AppColors.background },
// //   header: {
// //     flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
// //     padding: 16, backgroundColor: AppColors.surface, borderBottomWidth: 1, borderColor: AppColors.border,
// //   },
// //   headerTitle: { fontSize: 18, fontWeight: '600', color: AppColors.textPrimary },
// //   searchWrap: { paddingHorizontal: 16, paddingTop: 14, paddingBottom: 8 },
// //   searchBox: {
// //     flexDirection: 'row', alignItems: 'center', backgroundColor: AppColors.surface,
// //     borderRadius: 12, borderWidth: 1, borderColor: AppColors.border, paddingHorizontal: 14,
// //   },
// //   searchInput: { flex: 1, paddingVertical: 12, marginLeft: 8, color: AppColors.textPrimary },
// //   countText: { color: AppColors.textSecondary, fontSize: 12.5, marginTop: 6 },
// //   centerFill: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 },
// //   errorText: { color: AppColors.textSecondary, fontSize: 12.5, textAlign: 'center', marginTop: 10 },
// //   retryText: { color: AppColors.primary, marginTop: 10 },
// //   emptyIconWrap: { width: 64, height: 64, borderRadius: 32, backgroundColor: AppColors.primarySoft, alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
// //   emptyTitle: { color: AppColors.textPrimary, fontSize: 14.5, fontWeight: '600' },
// //   emptySubtitle: { color: AppColors.textSecondary, fontSize: 12.5, marginTop: 4, textAlign: 'center' },
// //   card: {
// //     flexDirection: 'row', alignItems: 'center', backgroundColor: AppColors.surface,
// //     borderRadius: 14, borderWidth: 1, borderColor: AppColors.border, padding: 14,
// //   },
// //   avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: AppColors.primarySoft, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
// //   avatarText: { color: AppColors.primary, fontWeight: '600', fontSize: 14 },
// //   cardName: { color: AppColors.textPrimary, fontSize: 14.5, fontWeight: '600' },
// //   cardSub: { color: AppColors.textSecondary, fontSize: 12.5, marginTop: 3 },
// //   cardMuted: { color: AppColors.textMuted, fontSize: 11.5, marginTop: 2 },
// //   menu: {
// //     position: 'absolute', right: 0, top: 24, backgroundColor: AppColors.surface,
// //     borderRadius: 12, borderWidth: 1, borderColor: AppColors.border, elevation: 4, zIndex: 10, width: 130,
// //   },
// //   menuItem: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingVertical: 10 },
// //   menuText: { color: AppColors.textPrimary, fontSize: 13 },
// //   fab: {
// //     position: 'absolute', right: 16, bottom: 20, flexDirection: 'row', alignItems: 'center',
// //     backgroundColor: AppColors.primary, borderRadius: 28, paddingVertical: 14, paddingHorizontal: 18, gap: 8, elevation: 4,
// //   },
// //   fabText: { color: '#fff', fontWeight: '600', fontSize: 14 },
// //   sheetBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
// //   sheet: { backgroundColor: AppColors.surface, borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingVertical: 10 },
// //   sheetHandle: { width: 36, height: 4, borderRadius: 4, backgroundColor: AppColors.border, alignSelf: 'center', marginBottom: 14 },
// //   sortTile: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 14 },
// //   sortTileText: { color: AppColors.textPrimary, fontSize: 14, fontWeight: '500' },
// // });
// // import React, { useEffect, useState, useCallback, useMemo } from 'react';
// // import {
// //   View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet,
// //   ActivityIndicator, RefreshControl, Alert, Modal, Pressable,
// // } from 'react-native';
// // import Icon from '@react-native-vector-icons/material-icons';
// // import { useNavigation } from '@react-navigation/native';

// // import { CustomerService, CustomerRecord } from '../../services/CustomerService';
// // import { AppColors } from '../theme/AppColors';

// // type SortBy = 'name' | 'city';

// // const service = new CustomerService();

// // export default function CustomerListScreen() {
// //   const navigation = useNavigation<any>();

// //   const [customers, setCustomers] = useState<CustomerRecord[]>([]);
// //   const [loading, setLoading] = useState(true);
// //   const [error, setError] = useState<string | null>(null);
// //   const [query, setQuery] = useState('');
// //   const [sortBy, setSortBy] = useState<SortBy>('name');
// //   const [sortSheetOpen, setSortSheetOpen] = useState(false);

// //   const loadCustomers = useCallback(async () => {
// //     setLoading(true);
// //     setError(null);
// //     try {
// //       const data = await service.getCustomers();
// //       setCustomers(data);
// //     } catch (e: any) {
// //       setError(`Failed to load customers: ${e.message ?? e}`);
// //     } finally {
// //       setLoading(false);
// //     }
// //   }, []);

// //   useEffect(() => {
// //     loadCustomers();
// //   }, [loadCustomers]);

// //   const filtered = useMemo(() => {
// //     let list = customers.filter(
// //       (c) =>
// //         c.name.toLowerCase().includes(query.toLowerCase()) ||
// //         c.phone.includes(query),
// //     );
// //     if (sortBy === 'name') list = [...list].sort((a, b) => a.name.localeCompare(b.name));
// //     if (sortBy === 'city') list = [...list].sort((a, b) => (a.city ?? '').localeCompare(b.city ?? ''));
// //     return list;
// //   }, [customers, query, sortBy]);

// //   const confirmDelete = (customer: CustomerRecord) => {
// //     Alert.alert('Delete customer?', `Are you sure you want to delete ${customer.name}?`, [
// //       { text: 'Cancel', style: 'cancel' },
// //       {
// //         text: 'Delete',
// //         style: 'destructive',
// //         onPress: async () => {
// //           try {
// //             await service.deleteCustomer(customer.id);
// //             loadCustomers();
// //           } catch (e: any) {
// //             Alert.alert('Delete failed', String(e.message ?? e));
// //           }
// //         },
// //       },
// //     ]);
// //   };

// //   const renderBody = () => {
// //     if (loading) {
// //       return (
// //         <View style={styles.centerFill}>
// //           <ActivityIndicator color={AppColors.primary} />
// //         </View>
// //       );
// //     }
// //     if (error) {
// //       return (
// //         <View style={styles.centerFill}>
// //           <Icon name="error-outline" color={AppColors.danger} size={32} />
// //           <Text style={styles.errorText}>{error}</Text>
// //           <TouchableOpacity onPress={loadCustomers}>
// //             <Text style={styles.retryText}>Retry</Text>
// //           </TouchableOpacity>
// //         </View>
// //       );
// //     }
// //     if (filtered.length === 0) {
// //       return (
// //         <View style={styles.centerFill}>
// //           <View style={styles.emptyIconWrap}>
// //             <Icon name="people-outline" color={AppColors.primary} size={28} />
// //           </View>
// //           <Text style={styles.emptyTitle}>No customers yet</Text>
// //           <Text style={styles.emptySubtitle}>Tap "Add customer" to create your first one</Text>
// //         </View>
// //       );
// //     }
// //     return (
// //       <FlatList
// //         data={filtered}
// //         keyExtractor={(item) => item.id}
// //         contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
// //         ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
// //         refreshControl={<RefreshControl refreshing={loading} onRefresh={loadCustomers} />}
// //         renderItem={({ item }) => (
// //           <CustomerCard
// //             customer={item}
// //             onPress={() => navigation.navigate('CustomerDetails', { customer: item })}
// //             onEdit={async () => {
// //               navigation.navigate('EditCustomer', { customer: item, onSaved: loadCustomers });
// //             }}
// //             onDelete={() => confirmDelete(item)}
// //           />
// //         )}
// //       />
// //     );
// //   };

// //   return (
// //     <View style={styles.flex}>
// //       {/* HEADER WITH BACK BUTTON */}
// //       <View style={styles.header}>
// //         <View style={styles.headerLeft}>
// //           <TouchableOpacity
// //             onPress={() => navigation.goBack()}
// //             style={[styles.backBtn, { marginTop: 35 }]}  // ← Back button down
// //           >
// //             <Icon name="arrow-back" color={AppColors.textPrimary} size={24} />
// //           </TouchableOpacity>
// //           <Text style={[styles.headerTitle, { marginTop: 35 }]}>Customers</Text>  {/* ← Title down */}
// //         </View>
// //         <TouchableOpacity
// //           onPress={() => setSortSheetOpen(true)}
// //           style={{ marginTop: 35 }}  // ← Sort icon down
// //         >
// //           <Icon name="sort" color={AppColors.textSecondary} size={22} />
// //         </TouchableOpacity>
// //       </View>

// //       <View style={styles.searchWrap}>
// //         <View style={styles.searchBox}>
// //           <Icon name="search" color={AppColors.textMuted} size={20} />
// //           <TextInput
// //             style={styles.searchInput}
// //             placeholder="Search by name / mobile"
// //             placeholderTextColor={AppColors.textMuted}
// //             value={query}
// //             onChangeText={setQuery}
// //           />
// //         </View>
// //         <Text style={styles.countText}>{loading ? 'Loading...' : `${filtered.length} customers`}</Text>
// //       </View>

// //       {renderBody()}

// //       <TouchableOpacity
// //         style={styles.fab}
// //         onPress={() => navigation.navigate('AddCustomer', { onSaved: loadCustomers })}
// //       >
// //         <Icon name="person-add-alt-1" color="#fff" size={20} />
// //         <Text style={styles.fabText}>Add customer</Text>
// //       </TouchableOpacity>

// //       <Modal visible={sortSheetOpen} transparent animationType="slide" onRequestClose={() => setSortSheetOpen(false)}>
// //         <Pressable style={styles.sheetBackdrop} onPress={() => setSortSheetOpen(false)}>
// //           <View style={styles.sheet}>
// //             <View style={styles.sheetHandle} />
// //             <SortTile label="Name (A-Z)" selected={sortBy === 'name'} onPress={() => { setSortBy('name'); setSortSheetOpen(false); }} />
// //             <SortTile label="City" selected={sortBy === 'city'} onPress={() => { setSortBy('city'); setSortSheetOpen(false); }} />
// //           </View>
// //         </Pressable>
// //       </Modal>
// //     </View>
// //   );
// // }

// // function SortTile({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
// //   return (
// //     <TouchableOpacity style={styles.sortTile} onPress={onPress}>
// //       <Text style={[styles.sortTileText, selected && { color: AppColors.primary, fontWeight: '700' }]}>{label}</Text>
// //       {selected && <Icon name="check" color={AppColors.primary} size={18} />}
// //     </TouchableOpacity>
// //   );
// // }

// // function CustomerCard({
// //   customer, onPress, onEdit, onDelete,
// // }: {
// //   customer: CustomerRecord; onPress: () => void; onEdit: () => void; onDelete: () => void;
// // }) {
// //   const [menuOpen, setMenuOpen] = useState(false);
// //   const initials = customer.name.trim()
// //     ? customer.name.trim().split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()
// //     : '?';

// //   return (
// //     <TouchableOpacity style={styles.card} onPress={onPress}>
// //       <View style={styles.avatar}>
// //         <Text style={styles.avatarText}>{initials}</Text>
// //       </View>
// //       <View style={{ flex: 1 }}>
// //         <Text style={styles.cardName}>{customer.name}</Text>
// //         <Text style={styles.cardSub}>Phone: {customer.phone}</Text>
// //         {customer.city ? <Text style={styles.cardMuted}>City: {customer.city}</Text> : null}
// //       </View>
// //       <View>
// //         <TouchableOpacity onPress={() => setMenuOpen((v) => !v)}>
// //           <Icon name="more-vert" color={AppColors.textMuted} size={20} />
// //         </TouchableOpacity>
// //         {menuOpen && (
// //           <View style={styles.menu}>
// //             <TouchableOpacity style={styles.menuItem} onPress={() => { setMenuOpen(false); onEdit(); }}>
// //               <Icon name="edit" color={AppColors.textSecondary} size={16} />
// //               <Text style={styles.menuText}>Edit</Text>
// //             </TouchableOpacity>
// //             <TouchableOpacity style={styles.menuItem} onPress={() => { setMenuOpen(false); onDelete(); }}>
// //               <Icon name="delete-outline" color={AppColors.danger} size={16} />
// //               <Text style={[styles.menuText, { color: AppColors.danger }]}>Delete</Text>
// //             </TouchableOpacity>
// //           </View>
// //         )}
// //       </View>
// //     </TouchableOpacity>
// //   );
// // }

// // const styles = StyleSheet.create({
// //   flex: { flex: 1, backgroundColor: AppColors.background },

// //   header: {
// //     flexDirection: 'row',
// //     justifyContent: 'space-between',
// //     alignItems: 'center',
// //     padding: 16,
// //     backgroundColor: AppColors.surface,
// //     borderBottomWidth: 1,
// //     borderColor: AppColors.border,
// //   },

// //   headerLeft: {
// //     flexDirection: 'row',
// //     alignItems: 'center',
// //     gap: 8,
// //   },

// //   backBtn: {
// //     padding: 4,
// //   },

// //   headerTitle: {
// //     fontSize: 18,
// //     fontWeight: '600',
// //     color: AppColors.textPrimary,
// //   },

// //   searchWrap: { paddingHorizontal: 16, paddingTop: 14, paddingBottom: 8 },
// //   searchBox: {
// //     flexDirection: 'row', alignItems: 'center', backgroundColor: AppColors.surface,
// //     borderRadius: 12, borderWidth: 1, borderColor: AppColors.border, paddingHorizontal: 14,
// //   },
// //   searchInput: { flex: 1, paddingVertical: 12, marginLeft: 8, color: AppColors.textPrimary },
// //   countText: { color: AppColors.textSecondary, fontSize: 12.5, marginTop: 6 },
// //   centerFill: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 },
// //   errorText: { color: AppColors.textSecondary, fontSize: 12.5, textAlign: 'center', marginTop: 10 },
// //   retryText: { color: AppColors.primary, marginTop: 10 },
// //   emptyIconWrap: { width: 64, height: 64, borderRadius: 32, backgroundColor: AppColors.primarySoft, alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
// //   emptyTitle: { color: AppColors.textPrimary, fontSize: 14.5, fontWeight: '600' },
// //   emptySubtitle: { color: AppColors.textSecondary, fontSize: 12.5, marginTop: 4, textAlign: 'center' },
// //   card: {
// //     flexDirection: 'row', alignItems: 'center', backgroundColor: AppColors.surface,
// //     borderRadius: 14, borderWidth: 1, borderColor: AppColors.border, padding: 14,
// //   },
// //   avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: AppColors.primarySoft, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
// //   avatarText: { color: AppColors.primary, fontWeight: '600', fontSize: 14 },
// //   cardName: { color: AppColors.textPrimary, fontSize: 14.5, fontWeight: '600' },
// //   cardSub: { color: AppColors.textSecondary, fontSize: 12.5, marginTop: 3 },
// //   cardMuted: { color: AppColors.textMuted, fontSize: 11.5, marginTop: 2 },
// //   menu: {
// //     position: 'absolute', right: 0, top: 24, backgroundColor: AppColors.surface,
// //     borderRadius: 12, borderWidth: 1, borderColor: AppColors.border, elevation: 4, zIndex: 10, width: 130,
// //   },
// //   menuItem: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingVertical: 10 },
// //   menuText: { color: AppColors.textPrimary, fontSize: 13 },
// //   fab: {
// //     position: 'absolute', right: 16, bottom: 0, flexDirection: 'row', alignItems: 'center',
// //     backgroundColor: AppColors.primary, borderRadius: 28, paddingVertical: 14, paddingHorizontal: 18, gap: 8, elevation: 4,
// //   },
// //   fabText: { color: '#fff', fontWeight: '600', fontSize: 14 },
// //   sheetBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
// //   sheet: { backgroundColor: AppColors.surface, borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingVertical: 10 },
// //   sheetHandle: { width: 36, height: 4, borderRadius: 4, backgroundColor: AppColors.border, alignSelf: 'center', marginBottom: 14 },
// //   sortTile: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 14 },
// //   sortTileText: { color: AppColors.textPrimary, fontSize: 14, fontWeight: '500' },
// // });

// import React, { useEffect, useState, useCallback, useMemo } from 'react';
// import {
//   View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet,
//   ActivityIndicator, RefreshControl, Alert, Modal, Pressable,
// } from 'react-native';
// import Icon from '@react-native-vector-icons/material-icons';
// import { useNavigation } from '@react-navigation/native';

// import { CustomerService, CustomerRecord } from '../../services/CustomerService';
// import { AppColors } from '../theme/AppColors';

// type SortBy = 'name' | 'city';

// const service = new CustomerService();

// export default function CustomerListScreen() {
//   const navigation = useNavigation<any>();

//   const [customers, setCustomers] = useState<CustomerRecord[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState<string | null>(null);
//   const [query, setQuery] = useState('');
//   const [sortBy, setSortBy] = useState<SortBy>('name');
//   const [sortSheetOpen, setSortSheetOpen] = useState(false);

//   // Which customer's action sheet (Edit/Delete) is open
//   const [activeCustomer, setActiveCustomer] = useState<CustomerRecord | null>(null);

//   const loadCustomers = useCallback(async () => {
//     setLoading(true);
//     setError(null);
//     try {
//       const data = await service.getCustomers();
//       setCustomers(data);
//     } catch (e: any) {
//       setError(`Failed to load customers: ${e.message ?? e}`);
//     } finally {
//       setLoading(false);
//     }
//   }, []);

//   useEffect(() => {
//     loadCustomers();
//   }, [loadCustomers]);

//   const filtered = useMemo(() => {
//     let list = customers.filter(
//       (c) =>
//         c.name.toLowerCase().includes(query.toLowerCase()) ||
//         c.phone.includes(query),
//     );
//     if (sortBy === 'name') list = [...list].sort((a, b) => a.name.localeCompare(b.name));
//     if (sortBy === 'city') list = [...list].sort((a, b) => (a.city ?? '').localeCompare(b.city ?? ''));
//     return list;
//   }, [customers, query, sortBy]);

//   const confirmDelete = (customer: CustomerRecord) => {
//     Alert.alert('Delete customer?', `Are you sure you want to delete ${customer.name}?`, [
//       { text: 'Cancel', style: 'cancel' },
//       {
//         text: 'Delete',
//         style: 'destructive',
//         onPress: async () => {
//           try {
//             await service.deleteCustomer(customer.id);
//             loadCustomers();
//           } catch (e: any) {
//             Alert.alert('Delete failed', String(e.message ?? e));
//           }
//         },
//       },
//     ]);
//   };

//   const renderBody = () => {
//     if (loading) {
//       return (
//         <View style={styles.centerFill}>
//           <ActivityIndicator color={AppColors.primary} />
//         </View>
//       );
//     }
//     if (error) {
//       return (
//         <View style={styles.centerFill}>
//           <Icon name="error-outline" color={AppColors.danger} size={32} />
//           <Text style={styles.errorText}>{error}</Text>
//           <TouchableOpacity onPress={loadCustomers}>
//             <Text style={styles.retryText}>Retry</Text>
//           </TouchableOpacity>
//         </View>
//       );
//     }
//     if (filtered.length === 0) {
//       return (
//         <View style={styles.centerFill}>
//           <View style={styles.emptyIconWrap}>
//             <Icon name="people-outline" color={AppColors.primary} size={28} />
//           </View>
//           <Text style={styles.emptyTitle}>No customers yet</Text>
//           <Text style={styles.emptySubtitle}>Tap "Add customer" to create your first one</Text>
//         </View>
//       );
//     }
//     return (
//       <FlatList
//         data={filtered}
//         keyExtractor={(item) => item.id}
//         contentContainerStyle={{ padding: 16, paddingBottom: 120 }}
//         ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
//         refreshControl={<RefreshControl refreshing={loading} onRefresh={loadCustomers} />}
//         renderItem={({ item }) => (
//           <CustomerCard
//             customer={item}
//             onPress={() => navigation.navigate('CustomerDetails', { customer: item })}
//             onMorePress={() => setActiveCustomer(item)}
//           />
//         )}
//       />
//     );
//   };

//   return (
//     <View style={styles.flex}>
//       {/* HEADER */}
//       <View style={styles.header}>
//         <View style={styles.headerLeft}>
//           <TouchableOpacity
//             onPress={() => navigation.goBack()}
//             style={styles.backBtn}
//             hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
//           >
//             <Icon name="chevron-left" color={AppColors.primary} size={30} />
//             {/* <Text style={styles.backLabel}>Back</Text> */}
//           </TouchableOpacity>
//         </View>
//         <Text style={styles.headerTitle}>Customers</Text>
//         <TouchableOpacity onPress={() => setSortSheetOpen(true)} style={styles.sortBtn}>
//           <Icon name="sort" color={AppColors.textSecondary} size={20} />
//         </TouchableOpacity>
//       </View>

//       <View style={styles.searchWrap}>
//         <View style={styles.searchBox}>
//           <Icon name="search" color={AppColors.textMuted} size={20} />
//           <TextInput
//             style={styles.searchInput}
//             placeholder="Search by name / mobile"
//             placeholderTextColor={AppColors.textMuted}
//             value={query}
//             onChangeText={setQuery}
//           />
//           {query.length > 0 && (
//             <TouchableOpacity onPress={() => setQuery('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
//               <Icon name="close" color={AppColors.textMuted} size={18} />
//             </TouchableOpacity>
//           )}
//         </View>
//         <Text style={styles.countText}>{loading ? 'Loading...' : `${filtered.length} customers`}</Text>
//       </View>

//       {renderBody()}

//       {/* ADD CUSTOMER */}
//       <TouchableOpacity
//         style={styles.fab}
//         activeOpacity={0.85}
//         onPress={() => navigation.navigate('AddCustomer', { onSaved: loadCustomers })}
//       >
//         <Icon name="person-add-alt-1" color="#fff" size={18} />
//         <Text style={styles.fabText}>Add customer</Text>
//       </TouchableOpacity>

//       {/* SORT SHEET */}
//       <Modal visible={sortSheetOpen} transparent animationType="slide" onRequestClose={() => setSortSheetOpen(false)}>
//         <Pressable style={styles.sheetBackdrop} onPress={() => setSortSheetOpen(false)}>
//           <View style={styles.sheet}>
//             <View style={styles.sheetHandle} />
//             <Text style={styles.sheetTitle}>Sort by</Text>
//             <SortTile label="Name (A-Z)" selected={sortBy === 'name'} onPress={() => { setSortBy('name'); setSortSheetOpen(false); }} />
//             <SortTile label="City" selected={sortBy === 'city'} onPress={() => { setSortBy('city'); setSortSheetOpen(false); }} />
//           </View>
//         </Pressable>
//       </Modal>

//       {/* CUSTOMER ACTIONS SHEET */}
//       <Modal
//         visible={!!activeCustomer}
//         transparent
//         animationType="fade"
//         onRequestClose={() => setActiveCustomer(null)}
//       >
//         <Pressable style={styles.sheetBackdrop} onPress={() => setActiveCustomer(null)}>
//           <View style={styles.sheet}>
//             <View style={styles.sheetHandle} />
//             {activeCustomer && (
//               <>
//                 <View style={styles.sheetHeaderRow}>
//                   <View style={styles.sheetAvatar}>
//                     <Text style={styles.sheetAvatarText}>{getInitials(activeCustomer.name)}</Text>
//                   </View>
//                   <View style={{ flex: 1 }}>
//                     <Text style={styles.sheetCustomerName} numberOfLines={1}>{activeCustomer.name}</Text>
//                     <Text style={styles.sheetCustomerSub}>{activeCustomer.phone}</Text>
//                   </View>
//                 </View>

//                 <TouchableOpacity
//                   style={styles.actionRow}
//                   onPress={() => {
//                     const c = activeCustomer;
//                     setActiveCustomer(null);
//                     navigation.navigate('EditCustomer', { customer: c, onSaved: loadCustomers });
//                   }}
//                 >
//                   <View style={[styles.actionIconWrap, { backgroundColor: `${AppColors.primary}14` }]}>
//                     <Icon name="edit" color={AppColors.primary} size={18} />
//                   </View>
//                   <Text style={styles.actionText}>Edit customer</Text>
//                 </TouchableOpacity>

//                 <TouchableOpacity
//                   style={styles.actionRow}
//                   onPress={() => {
//                     const c = activeCustomer;
//                     setActiveCustomer(null);
//                     confirmDelete(c);
//                   }}
//                 >
//                   <View style={[styles.actionIconWrap, { backgroundColor: `${AppColors.danger}14` }]}>
//                     <Icon name="delete-outline" color={AppColors.danger} size={18} />
//                   </View>
//                   <Text style={[styles.actionText, { color: AppColors.danger }]}>Delete customer</Text>
//                 </TouchableOpacity>

//                 <TouchableOpacity style={styles.cancelBtn} onPress={() => setActiveCustomer(null)}>
//                   <Text style={styles.cancelText}>Cancel</Text>
//                 </TouchableOpacity>
//               </>
//             )}
//           </View>
//         </Pressable>
//       </Modal>
//     </View>
//   );
// }

// function getInitials(name: string) {
//   return name.trim()
//     ? name.trim().split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()
//     : '?';
// }

// function SortTile({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
//   return (
//     <TouchableOpacity style={styles.sortTile} onPress={onPress}>
//       <Text style={[styles.sortTileText, selected && { color: AppColors.primary, fontWeight: '700' }]}>{label}</Text>
//       {selected && <Icon name="check" color={AppColors.primary} size={18} />}
//     </TouchableOpacity>
//   );
// }

// function CustomerCard({
//   customer, onPress, onMorePress,
// }: {
//   customer: CustomerRecord; onPress: () => void; onMorePress: () => void;
// }) {
//   return (
//     <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.8}>
//       <View style={styles.avatar}>
//         <Text style={styles.avatarText}>{getInitials(customer.name)}</Text>
//       </View>
//       <View style={{ flex: 1 }}>
//         <Text style={styles.cardName} numberOfLines={1}>{customer.name}</Text>
//         <View style={styles.cardRow}>
//           <Icon name="call" color={AppColors.textMuted} size={13} />
//           <Text style={styles.cardSub}>{customer.phone}</Text>
//         </View>
//         {customer.city ? (
//           <View style={styles.cardRow}>
//             <Icon name="place" color={AppColors.textMuted} size={13} />
//             <Text style={styles.cardMuted}>{customer.city}</Text>
//           </View>
//         ) : null}
//       </View>
//       <TouchableOpacity
//         onPress={onMorePress}
//         hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
//         style={styles.moreBtn}
//       >
//         <Icon name="more-vert" color={AppColors.textMuted} size={20} />
//       </TouchableOpacity>
//     </TouchableOpacity>
//   );
// }

// const styles = StyleSheet.create({
//   flex: { flex: 1, backgroundColor: AppColors.background },

//   header: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     paddingTop: 48,
//     paddingBottom: 14,
//     paddingHorizontal: 12,
//     backgroundColor: AppColors.surface,
//     borderBottomWidth: 1,
//     borderColor: AppColors.border,
//   },
//   headerLeft: { flexDirection: 'row', alignItems: 'center', width: 90 },
//   backBtn: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     marginLeft: -8, // offsets chevron's built-in padding so it lines up with the screen edge
//   },
//   backLabel: {
//     color: AppColors.primary,
//     fontSize: 17,
//     marginLeft: -4, // tight gap between chevron and label, iOS-style
//   },
//   sortBtn: {
//     width: 36, height: 36, borderRadius: 18,
//     alignItems: 'center', justifyContent: 'center',
//     backgroundColor: `${AppColors.textSecondary}0D`,
//   },
//   headerTitle: {
//     position: 'absolute',
//     left: 0,
//     right: 0,
//     textAlign: 'center',
//     fontSize: 17,
//     fontWeight: '600',
//     color: AppColors.textPrimary,
//   },

//   searchWrap: { paddingHorizontal: 16, paddingTop: 14, paddingBottom: 8 },
//   searchBox: {
//     flexDirection: 'row', alignItems: 'center', backgroundColor: AppColors.surface,
//     borderRadius: 12, borderWidth: 1, borderColor: AppColors.border, paddingHorizontal: 14,
//   },
//   searchInput: { flex: 1, paddingVertical: 12, marginLeft: 8, color: AppColors.textPrimary },
//   countText: { color: AppColors.textSecondary, fontSize: 12.5, marginTop: 6 },

//   centerFill: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 },
//   errorText: { color: AppColors.textSecondary, fontSize: 12.5, textAlign: 'center', marginTop: 10 },
//   retryText: { color: AppColors.primary, marginTop: 10, fontWeight: '600' },
//   emptyIconWrap: { width: 64, height: 64, borderRadius: 32, backgroundColor: AppColors.primarySoft, alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
//   emptyTitle: { color: AppColors.textPrimary, fontSize: 14.5, fontWeight: '600' },
//   emptySubtitle: { color: AppColors.textSecondary, fontSize: 12.5, marginTop: 4, textAlign: 'center' },

//   card: {
//     flexDirection: 'row', alignItems: 'center', backgroundColor: AppColors.surface,
//     borderRadius: 14, borderWidth: 1, borderColor: AppColors.border, padding: 14,
//     shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, shadowOffset: { width: 0, height: 2 },
//     elevation: 1,
//   },
//   avatar: { width: 46, height: 46, borderRadius: 23, backgroundColor: AppColors.primarySoft, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
//   avatarText: { color: AppColors.primary, fontWeight: '700', fontSize: 14 },
//   cardName: { color: AppColors.textPrimary, fontSize: 14.5, fontWeight: '600', marginBottom: 4 },
//   cardRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 1 },
//   cardSub: { color: AppColors.textSecondary, fontSize: 12.5 },
//   cardMuted: { color: AppColors.textMuted, fontSize: 11.5 },
//   moreBtn: {
//     width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginLeft: 6,
//   },

//   fab: {
//     position: 'absolute',
//     right: 16,
//     bottom: 24,
//     flexDirection: 'row',
//     alignItems: 'center',
//     backgroundColor: AppColors.primary,
//     borderRadius: 28,
//     paddingVertical: 14,
//     paddingHorizontal: 20,
//     gap: 8,
//     shadowColor: '#000',
//     shadowOpacity: 0.2,
//     shadowRadius: 8,
//     shadowOffset: { width: 0, height: 4 },
//     elevation: 6,
//   },
//   fabText: { color: '#fff', fontWeight: '700', fontSize: 14 },

//   sheetBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
//   sheet: {
//     backgroundColor: AppColors.surface,
//     borderTopLeftRadius: 22,
//     borderTopRightRadius: 22,
//     paddingTop: 10,
//     paddingBottom: 28,
//     paddingHorizontal: 8,
//   },
//   sheetHandle: { width: 40, height: 4, borderRadius: 4, backgroundColor: AppColors.border, alignSelf: 'center', marginBottom: 12 },
//   sheetTitle: { color: AppColors.textSecondary, fontSize: 12.5, fontWeight: '600', paddingHorizontal: 14, marginBottom: 4, textTransform: 'uppercase' },

//   sortTile: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 14 },
//   sortTileText: { color: AppColors.textPrimary, fontSize: 14, fontWeight: '500' },

//   sheetHeaderRow: {
//     flexDirection: 'row', alignItems: 'center', gap: 12,
//     paddingHorizontal: 16, paddingBottom: 16, marginBottom: 6,
//     borderBottomWidth: 1, borderColor: AppColors.border,
//   },
//   sheetAvatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: AppColors.primarySoft, alignItems: 'center', justifyContent: 'center' },
//   sheetAvatarText: { color: AppColors.primary, fontWeight: '700', fontSize: 14 },
//   sheetCustomerName: { color: AppColors.textPrimary, fontSize: 15, fontWeight: '700' },
//   sheetCustomerSub: { color: AppColors.textSecondary, fontSize: 12.5, marginTop: 2 },

//   actionRow: {
//     flexDirection: 'row', alignItems: 'center', gap: 14,
//     paddingHorizontal: 16, paddingVertical: 13,
//   },
//   actionIconWrap: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
//   actionText: { color: AppColors.textPrimary, fontSize: 14.5, fontWeight: '600' },

//   cancelBtn: { marginTop: 8, paddingVertical: 14, alignItems: 'center' },
//   cancelText: { color: AppColors.textSecondary, fontSize: 14, fontWeight: '600' },
// });
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

  // Which customer's action sheet (Edit/Delete) is open
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
        contentContainerStyle={{ padding: 16, paddingBottom: 120 }}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={loadCustomers} />}
        renderItem={({ item }) => (
          <CustomerCard
            customer={item}
            onPress={() => navigation.navigate('CustomerDetails', { customer: item })}
            onMorePress={() => setActiveCustomer(item)}
          />
        )}
      />
    );
  };

  return (
    <View style={styles.flex}>
      {/* HEADER — back button + title inline, no absolute positioning */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backBtn}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Icon name="chevron-left" color={AppColors.primary} size={30} />
            {/* <Text style={styles.backLabel}>Back</Text> */}
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Customers</Text>
        </View>
        <TouchableOpacity onPress={() => setSortSheetOpen(true)} style={styles.sortBtn}>
          <Icon name="sort" color={AppColors.textSecondary} size={20} />
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
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Icon name="close" color={AppColors.textMuted} size={18} />
            </TouchableOpacity>
          )}
        </View>
        <Text style={styles.countText}>{loading ? 'Loading...' : `${filtered.length} customers`}</Text>
      </View>

      {renderBody()}

      {/* ADD CUSTOMER */}
      <TouchableOpacity
        style={styles.fab}
        activeOpacity={0.85}
        onPress={() => navigation.navigate('AddCustomer', { onSaved: loadCustomers })}
      >
        <Icon name="person-add-alt-1" color="#fff" size={18} />
        <Text style={styles.fabText}>Add customer</Text>
      </TouchableOpacity>

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
                  <View style={styles.sheetAvatar}>
                    <Text style={styles.sheetAvatarText}>{getInitials(activeCustomer.name)}</Text>
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

function getInitials(name: string) {
  return name.trim()
    ? name.trim().split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()
    : '?';
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
  customer, onPress, onMorePress,
}: {
  customer: CustomerRecord; onPress: () => void; onMorePress: () => void;
}) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.8}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{getInitials(customer.name)}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.cardName} numberOfLines={1}>{customer.name}</Text>
        <View style={styles.cardRow}>
          <Icon name="call" color={AppColors.textMuted} size={13} />
          <Text style={styles.cardSub}>{customer.phone}</Text>
        </View>
        {customer.city ? (
          <View style={styles.cardRow}>
            <Icon name="place" color={AppColors.textMuted} size={13} />
            <Text style={styles.cardMuted}>{customer.city}</Text>
          </View>
        ) : null}
      </View>
      <TouchableOpacity
        onPress={onMorePress}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        style={styles.moreBtn}
      >
        <Icon name="more-vert" color={AppColors.textMuted} size={20} />
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: AppColors.background },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 48,
    paddingBottom: 14,
    paddingHorizontal: 12,
    backgroundColor: AppColors.surface,
    borderBottomWidth: 1,
    borderColor: AppColors.border,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: -8, // offsets chevron's built-in padding so it lines up with the screen edge
  },
  backLabel: {
    color: AppColors.primary,
    fontSize: 17,
    marginLeft: -4, // tight gap between chevron and label, iOS-style
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: AppColors.textPrimary,
  },
  sortBtn: {
    width: 36, height: 36, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: `${AppColors.textSecondary}0D`,
  },

  searchWrap: { paddingHorizontal: 16, paddingTop: 14, paddingBottom: 8 },
  searchBox: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: AppColors.surface,
    borderRadius: 12, borderWidth: 1, borderColor: AppColors.border, paddingHorizontal: 14,
  },
  searchInput: { flex: 1, paddingVertical: 12, marginLeft: 8, color: AppColors.textPrimary },
  countText: { color: AppColors.textSecondary, fontSize: 12.5, marginTop: 6 },

  centerFill: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 },
  errorText: { color: AppColors.textSecondary, fontSize: 12.5, textAlign: 'center', marginTop: 10 },
  retryText: { color: AppColors.primary, marginTop: 10, fontWeight: '600' },
  emptyIconWrap: { width: 64, height: 64, borderRadius: 32, backgroundColor: AppColors.primarySoft, alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  emptyTitle: { color: AppColors.textPrimary, fontSize: 14.5, fontWeight: '600' },
  emptySubtitle: { color: AppColors.textSecondary, fontSize: 12.5, marginTop: 4, textAlign: 'center' },

  card: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: AppColors.surface,
    borderRadius: 14, borderWidth: 1, borderColor: AppColors.border, padding: 14,
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  avatar: { width: 46, height: 46, borderRadius: 23, backgroundColor: AppColors.primarySoft, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  avatarText: { color: AppColors.primary, fontWeight: '700', fontSize: 14 },
  cardName: { color: AppColors.textPrimary, fontSize: 14.5, fontWeight: '600', marginBottom: 4 },
  cardRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 1 },
  cardSub: { color: AppColors.textSecondary, fontSize: 12.5 },
  cardMuted: { color: AppColors.textMuted, fontSize: 11.5 },
  moreBtn: {
    width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginLeft: 6,
  },

  fab: {
    position: 'absolute',
    right: 16,
    bottom: 24,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: AppColors.primary,
    borderRadius: 28,
    paddingVertical: 14,
    paddingHorizontal: 20,
    gap: 8,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  fabText: { color: '#fff', fontWeight: '700', fontSize: 14 },

  sheetBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: AppColors.surface,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    paddingTop: 10,
    paddingBottom: 28,
    paddingHorizontal: 8,
  },
  sheetHandle: { width: 40, height: 4, borderRadius: 4, backgroundColor: AppColors.border, alignSelf: 'center', marginBottom: 12 },
  sheetTitle: { color: AppColors.textSecondary, fontSize: 12.5, fontWeight: '600', paddingHorizontal: 14, marginBottom: 4, textTransform: 'uppercase' },

  sortTile: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 14 },
  sortTileText: { color: AppColors.textPrimary, fontSize: 14, fontWeight: '500' },

  sheetHeaderRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 16, paddingBottom: 16, marginBottom: 6,
    borderBottomWidth: 1, borderColor: AppColors.border,
  },
  sheetAvatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: AppColors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  sheetAvatarText: { color: AppColors.primary, fontWeight: '700', fontSize: 14 },
  sheetCustomerName: { color: AppColors.textPrimary, fontSize: 15, fontWeight: '700' },
  sheetCustomerSub: { color: AppColors.textSecondary, fontSize: 12.5, marginTop: 2 },

  actionRow: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    paddingHorizontal: 16, paddingVertical: 13,
  },
  actionIconWrap: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  actionText: { color: AppColors.textPrimary, fontSize: 14.5, fontWeight: '600' },

  cancelBtn: { marginTop: 8, paddingVertical: 14, alignItems: 'center' },
  cancelText: { color: AppColors.textSecondary, fontSize: 14, fontWeight: '600' },
});
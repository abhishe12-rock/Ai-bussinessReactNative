// // import React, { useEffect, useState, useCallback } from 'react';
// // import { View, Text, TouchableOpacity, StyleSheet, ScrollView, RefreshControl } from 'react-native';
// // import Icon from '@react-native-vector-icons/material-icons';
// // import { useNavigation } from '@react-navigation/native';

// // import { SalesService, SaleRecord } from '../../services/SalesService';
// // import { AppColors } from '../theme/AppColors';

// // const service = new SalesService();

// // export default function SalesHomeScreen() {
// //   const navigation = useNavigation<any>();
// //   const [sales, setSales] = useState<SaleRecord[]>([]);
// //   const [loading, setLoading] = useState(true);

// //   const load = useCallback(async () => {
// //     setLoading(true);
// //     try { setSales(await service.getAllSales()); }
// //     catch { /* stats just show zero on failure */ }
// //     finally { setLoading(false); }
// //   }, []);

// //   useEffect(() => { load(); }, [load]);

// //   const today = new Date();
// //   const todaysTotal = service.sumTotalForDate(sales, today);
// //   const todaysCount = service.countForDate(sales, today);

// //   return (
// //     <View style={styles.flex}>
// //       <View style={styles.header}>
// //         <Text style={styles.headerTitle}>Sales</Text>
// //         <Text style={styles.headerSubtitle}>Invoices, history and payments</Text>
// //       </View>

// //       <ScrollView contentContainerStyle={styles.content} refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}>
// //         <TouchableOpacity style={styles.newSaleCard} onPress={async () => { navigation.navigate('NewSale', { onSaved: load }); }}>
// //           <Text style={styles.newSaleLabel}>Start a transaction</Text>
// //           <Text style={styles.newSaleTitle}>New sale</Text>
// //           <View style={styles.createChip}>
// //             <Icon name="add" color="#fff" size={17} />
// //             <Text style={styles.createChipText}>Create sale</Text>
// //           </View>
// //         </TouchableOpacity>

// //         <View style={styles.statsRow}>
// //           <StatCard label="Today's sales" value={loading ? '—' : `₹${todaysTotal.toFixed(0)}`} />
// //           <StatCard label="Invoices today" value={loading ? '—' : `${todaysCount}`} />
// //         </View>

// //         <Text style={styles.sectionLabel}>Manage</Text>
// //         <MenuRow icon="receipt-long" iconColor={AppColors.info} iconBg={AppColors.infoSoft} title="Invoices" subtitle="View & manage all invoices" onPress={() => navigation.navigate('Invoices')} />
// //         <MenuRow icon="history" iconColor={AppColors.success} iconBg={AppColors.successSoft} title="Sales history" subtitle="Past transactions" onPress={() => navigation.navigate('SalesHistory')} />
// //         <MenuRow icon="replay" iconColor={AppColors.danger} iconBg={AppColors.dangerSoft} title="Returns" subtitle="Refunds & exchanges" onPress={() => navigation.navigate('Returns')} />
// //         <MenuRow icon="account-balance-wallet" iconColor={AppColors.warning} iconBg={AppColors.warningSoft} title="Payments" subtitle="Track collections" onPress={() => navigation.navigate('Payments')} />
// //       </ScrollView>
// //     </View>
// //   );
// // }

// // function StatCard({ label, value }: { label: string; value: string }) {
// //   return (
// //     <View style={styles.statCard}>
// //       <Text style={styles.statLabel}>{label}</Text>
// //       <Text style={styles.statValue}>{value}</Text>
// //     </View>
// //   );
// // }

// // function MenuRow({ icon, iconColor, iconBg, title, subtitle, onPress }: {
// //   icon: any; iconColor: string; iconBg: string; title: string; subtitle: string; onPress: () => void;
// // }) {
// //   return (
// //     <TouchableOpacity style={styles.menuRow} onPress={onPress}>
// //       <View style={[styles.menuIcon, { backgroundColor: iconBg }]}><Icon name={icon} color={iconColor} size={18} /></View>
// //       <View style={{ flex: 1 }}>
// //         <Text style={styles.menuTitle}>{title}</Text>
// //         <Text style={styles.menuSubtitle}>{subtitle}</Text>
// //       </View>
// //       <Icon name="chevron-right" color={AppColors.textMuted} size={20} />
// //     </TouchableOpacity>
// //   );
// // }

// // const styles = StyleSheet.create({
// //   flex: { flex: 1, backgroundColor: AppColors.background },
// //   header: { padding: 16, paddingTop: 50, backgroundColor: AppColors.surface, borderBottomWidth: 1, borderColor: AppColors.border },
// //   headerTitle: { fontSize: 18, fontWeight: '700', color: AppColors.textPrimary },
// //   headerSubtitle: { fontSize: 12.5, color: AppColors.textSecondary, marginTop: 2 },
// //   content: { padding: 16, paddingBottom: 24 },
// //   newSaleCard: { backgroundColor: AppColors.primary, borderRadius: 18, padding: 18 },
// //   newSaleLabel: { color: '#ffffffd9', fontSize: 12 },
// //   newSaleTitle: { color: '#fff', fontSize: 19, fontWeight: '700', marginTop: 4 },
// //   createChip: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#ffffff29', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 9, alignSelf: 'flex-start', marginTop: 14 },
// //   createChipText: { color: '#fff', fontSize: 12.5, fontWeight: '600' },
// //   statsRow: { flexDirection: 'row', gap: 10, marginTop: 16 },
// //   statCard: { flex: 1, backgroundColor: AppColors.surface, borderRadius: 14, borderWidth: 1, borderColor: AppColors.border, padding: 13 },
// //   statLabel: { color: AppColors.textSecondary, fontSize: 11 },
// //   statValue: { color: AppColors.textPrimary, fontSize: 18, fontWeight: '700', marginTop: 5 },
// //   sectionLabel: { color: AppColors.textSecondary, fontSize: 13, fontWeight: '600', marginTop: 22, marginBottom: 10 },
// //   menuRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: AppColors.surface, borderRadius: 14, borderWidth: 1, borderColor: AppColors.border, padding: 13, marginBottom: 10, gap: 12 },
// //   menuIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
// //   menuTitle: { color: AppColors.textPrimary, fontSize: 13.5, fontWeight: '700' },
// //   menuSubtitle: { color: AppColors.textSecondary, fontSize: 11.5, marginTop: 2 },
// // });

// import React, { useEffect, useState, useCallback } from 'react';
// import { View, Text, TouchableOpacity, StyleSheet, ScrollView, RefreshControl } from 'react-native';
// import Icon from '@react-native-vector-icons/material-icons';
// import { useNavigation } from '@react-navigation/native';

// import { SalesService, SaleRecord } from '../../services/SalesService';
// import { AppColors } from '../theme/AppColors';

// const service = new SalesService();

// export default function SalesHomeScreen() {
//   const navigation = useNavigation<any>();
//   const [sales, setSales] = useState<SaleRecord[]>([]);
//   const [loading, setLoading] = useState(true);

//   const load = useCallback(async () => {
//     setLoading(true);
//     try { setSales(await service.getAllSales()); }
//     catch { /* stats just show zero on failure */ }
//     finally { setLoading(false); }
//   }, []);

//   useEffect(() => { load(); }, [load]);

//   const today = new Date();
//   const todaysTotal = service.sumTotalForDate(sales, today);
//   const todaysCount = service.countForDate(sales, today);

//   return (
//     <View style={styles.flex}>
//       <View style={styles.header}>
//         <View style={styles.headerLeft}>
//           <TouchableOpacity 
//             onPress={() => navigation.goBack()}
//             style={styles.backBtn}
//           >
//             <Icon name="arrow-back" color={AppColors.textPrimary} size={22} />
//           </TouchableOpacity>
//           <View style={styles.headerTextContainer}>
//             <Text style={styles.headerTitle}>Sales</Text>
//             <Text style={styles.headerSubtitle}>Invoices, history and payments</Text>
//           </View>
//         </View>
//       </View>

//       <ScrollView contentContainerStyle={styles.content} refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}>
//         <TouchableOpacity style={styles.newSaleCard} onPress={async () => { navigation.navigate('NewSale', { onSaved: load }); }}>
//           <Text style={styles.newSaleLabel}>Start a transaction</Text>
//           <Text style={styles.newSaleTitle}>New sale</Text>
//           <View style={styles.createChip}>
//             <Icon name="add" color="#fff" size={17} />
//             <Text style={styles.createChipText}>Create sale</Text>
//           </View>
//         </TouchableOpacity>

//         <View style={styles.statsRow}>
//           <StatCard label="Today's sales" value={loading ? '—' : `₹${todaysTotal.toFixed(0)}`} />
//           <StatCard label="Invoices today" value={loading ? '—' : `${todaysCount}`} />
//         </View>

//         <Text style={styles.sectionLabel}>Manage</Text>
//         <MenuRow icon="receipt-long" iconColor={AppColors.info} iconBg={AppColors.infoSoft} title="Invoices" subtitle="View & manage all invoices" onPress={() => navigation.navigate('Invoices')} />
//         <MenuRow icon="history" iconColor={AppColors.success} iconBg={AppColors.successSoft} title="Sales history" subtitle="Past transactions" onPress={() => navigation.navigate('SalesHistory')} />
//         <MenuRow icon="replay" iconColor={AppColors.danger} iconBg={AppColors.dangerSoft} title="Returns" subtitle="Refunds & exchanges" onPress={() => navigation.navigate('Returns')} />
//         <MenuRow icon="account-balance-wallet" iconColor={AppColors.warning} iconBg={AppColors.warningSoft} title="Payments" subtitle="Track collections" onPress={() => navigation.navigate('Payments')} />
//       </ScrollView>
//     </View>
//   );
// }

// function StatCard({ label, value }: { label: string; value: string }) {
//   return (
//     <View style={styles.statCard}>
//       <Text style={styles.statLabel}>{label}</Text>
//       <Text style={styles.statValue}>{value}</Text>
//     </View>
//   );
// }

// function MenuRow({ icon, iconColor, iconBg, title, subtitle, onPress }: {
//   icon: any; iconColor: string; iconBg: string; title: string; subtitle: string; onPress: () => void;
// }) {
//   return (
//     <TouchableOpacity style={styles.menuRow} onPress={onPress}>
//       <View style={[styles.menuIcon, { backgroundColor: iconBg }]}><Icon name={icon} color={iconColor} size={18} /></View>
//       <View style={{ flex: 1 }}>
//         <Text style={styles.menuTitle}>{title}</Text>
//         <Text style={styles.menuSubtitle}>{subtitle}</Text>
//       </View>
//       <Icon name="chevron-right" color={AppColors.textMuted} size={20} />
//     </TouchableOpacity>
//   );
// }

// const styles = StyleSheet.create({
//   flex: { flex: 1, backgroundColor: AppColors.background },
//   header: { 
//     padding: 16, 
//     paddingTop: 50, 
//     backgroundColor: AppColors.surface, 
//     borderBottomWidth: 1, 
//     borderColor: AppColors.border,
//   },
//   headerLeft: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     gap: 12,
//   },
//   headerTextContainer: {
//     flex: 1,
//   },
//   backBtn: {
//     padding: 4,
//   },
//   headerTitle: { 
//     fontSize: 18, 
//     fontWeight: '700', 
//     color: AppColors.textPrimary 
//   },
//   headerSubtitle: { 
//     fontSize: 12.5, 
//     color: AppColors.textSecondary, 
//     marginTop: 2 
//   },
//   content: { padding: 16, paddingBottom: 24 },
//   newSaleCard: { backgroundColor: AppColors.primary, borderRadius: 18, padding: 18 },
//   newSaleLabel: { color: '#ffffffd9', fontSize: 12 },
//   newSaleTitle: { color: '#fff', fontSize: 19, fontWeight: '700', marginTop: 4 },
//   createChip: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#ffffff29', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 9, alignSelf: 'flex-start', marginTop: 14 },
//   createChipText: { color: '#fff', fontSize: 12.5, fontWeight: '600' },
//   statsRow: { flexDirection: 'row', gap: 10, marginTop: 16 },
//   statCard: { flex: 1, backgroundColor: AppColors.surface, borderRadius: 14, borderWidth: 1, borderColor: AppColors.border, padding: 13 },
//   statLabel: { color: AppColors.textSecondary, fontSize: 11 },
//   statValue: { color: AppColors.textPrimary, fontSize: 18, fontWeight: '700', marginTop: 5 },
//   sectionLabel: { color: AppColors.textSecondary, fontSize: 13, fontWeight: '600', marginTop: 22, marginBottom: 10 },
//   menuRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: AppColors.surface, borderRadius: 14, borderWidth: 1, borderColor: AppColors.border, padding: 13, marginBottom: 10, gap: 12 },
//   menuIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
//   menuTitle: { color: AppColors.textPrimary, fontSize: 13.5, fontWeight: '700' },
//   menuSubtitle: { color: AppColors.textSecondary, fontSize: 11.5, marginTop: 2 },
// });

import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import Icon from '@react-native-vector-icons/material-icons';
import { useNavigation } from '@react-navigation/native';

import { SalesService, SaleRecord } from '../../services/SalesService';
import { AppColors } from '../theme/AppColors';

const service = new SalesService();

export default function SalesHomeScreen() {
  const navigation = useNavigation<any>();
  const [sales, setSales] = useState<SaleRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try { setSales(await service.getAllSales()); }
    catch { /* stats just show zero on failure */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const today = new Date();
  const todaysTotal = service.sumTotalForDate(sales, today);
  const todaysCount = service.countForDate(sales, today);

  return (
    <View style={styles.flex}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backBtn}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Icon name="chevron-left" color={AppColors.primary} size={30} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Sales</Text>
        </View>
        
      </View>

      <ScrollView contentContainerStyle={styles.content} refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}>
        <TouchableOpacity style={styles.newSaleCard} onPress={async () => { navigation.navigate('NewSale', { onSaved: load }); }}>
          <Text style={styles.newSaleLabel}>Start a transaction</Text>
          <Text style={styles.newSaleTitle}>New sale</Text>
          <View style={styles.createChip}>
            <Icon name="add" color="#fff" size={17} />
            <Text style={styles.createChipText}>Create sale</Text>
          </View>
        </TouchableOpacity>

        <View style={styles.statsRow}>
          <StatCard label="Today's sales" value={loading ? '—' : `₹${todaysTotal.toFixed(0)}`} />
          <StatCard label="Invoices today" value={loading ? '—' : `${todaysCount}`} />
        </View>

        <Text style={styles.sectionLabel}>Manage</Text>
        <MenuRow icon="receipt-long" iconColor={AppColors.info} iconBg={AppColors.infoSoft} title="Invoices" subtitle="View & manage all invoices" onPress={() => navigation.navigate('Invoices')} />
        <MenuRow icon="history" iconColor={AppColors.success} iconBg={AppColors.successSoft} title="Sales history" subtitle="Past transactions" onPress={() => navigation.navigate('SalesHistory')} />
        <MenuRow icon="replay" iconColor={AppColors.danger} iconBg={AppColors.dangerSoft} title="Returns" subtitle="Refunds & exchanges" onPress={() => navigation.navigate('Returns')} />
        <MenuRow icon="account-balance-wallet" iconColor={AppColors.warning} iconBg={AppColors.warningSoft} title="Payments" subtitle="Track collections" onPress={() => navigation.navigate('Payments')} />
      </ScrollView>
    </View>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );
}

function MenuRow({ icon, iconColor, iconBg, title, subtitle, onPress }: {
  icon: any; iconColor: string; iconBg: string; title: string; subtitle: string; onPress: () => void;
}) {
  return (
    <TouchableOpacity style={styles.menuRow} onPress={onPress}>
      <View style={[styles.menuIcon, { backgroundColor: iconBg }]}><Icon name={icon} color={iconColor} size={18} /></View>
      <View style={{ flex: 1 }}>
        <Text style={styles.menuTitle}>{title}</Text>
        <Text style={styles.menuSubtitle}>{subtitle}</Text>
      </View>
      <Icon name="chevron-right" color={AppColors.textMuted} size={20} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: AppColors.background },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingTop: 50,
    backgroundColor: AppColors.surface,
    borderBottomWidth: 1,
    borderColor: AppColors.border,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  backBtn: {
    padding: 4,
  },
  headerIcon: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: AppColors.textPrimary,
  },
  content: { padding: 16, paddingBottom: 24 },
  newSaleCard: { backgroundColor: AppColors.primary, borderRadius: 18, padding: 18 },
  newSaleLabel: { color: '#ffffffd9', fontSize: 12 },
  newSaleTitle: { color: '#fff', fontSize: 19, fontWeight: '700', marginTop: 4 },
  createChip: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#ffffff29', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 9, alignSelf: 'flex-start', marginTop: 14 },
  createChipText: { color: '#fff', fontSize: 12.5, fontWeight: '600' },
  statsRow: { flexDirection: 'row', gap: 10, marginTop: 16 },
  statCard: { flex: 1, backgroundColor: AppColors.surface, borderRadius: 14, borderWidth: 1, borderColor: AppColors.border, padding: 13 },
  statLabel: { color: AppColors.textSecondary, fontSize: 11 },
  statValue: { color: AppColors.textPrimary, fontSize: 18, fontWeight: '700', marginTop: 5 },
  sectionLabel: { color: AppColors.textSecondary, fontSize: 13, fontWeight: '600', marginTop: 22, marginBottom: 10 },
  menuRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: AppColors.surface, borderRadius: 14, borderWidth: 1, borderColor: AppColors.border, padding: 13, marginBottom: 10, gap: 12 },
  menuIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  menuTitle: { color: AppColors.textPrimary, fontSize: 13.5, fontWeight: '700' },
  menuSubtitle: { color: AppColors.textSecondary, fontSize: 11.5, marginTop: 2 },
});
// import React, { useEffect, useState, useCallback, useMemo } from 'react';
// import { View, Text, TextInput, TouchableOpacity, StyleSheet, FlatList, ActivityIndicator, RefreshControl } from 'react-native';
// import Icon from '@react-native-vector-icons/material-icons';
// import { useNavigation } from '@react-navigation/native';

// import { EmployeeService, EmployeeRecord } from '../../services/EmployeeService';
// import { AppColors } from '../theme/AppColors';

// const service = new EmployeeService();

// function statusColor(status: string) {
//   switch (status) {
//     case 'ACTIVE': return AppColors.success;
//     case 'ON_LEAVE': return AppColors.warning;
//     case 'SUSPENDED': return AppColors.danger;
//     default: return AppColors.textMuted;
//   }
// }
// function statusBg(status: string) {
//   switch (status) {
//     case 'ACTIVE': return AppColors.successSoft;
//     case 'ON_LEAVE': return AppColors.warningSoft;
//     case 'SUSPENDED': return AppColors.dangerSoft;
//     default: return AppColors.surfaceSoft;
//   }
// }

// export default function EmployeeListScreen() {
//   const navigation = useNavigation<any>();
//   const [employees, setEmployees] = useState<EmployeeRecord[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState<string | null>(null);
//   const [query, setQuery] = useState('');

//   const load = useCallback(async () => {
//     setLoading(true);
//     setError(null);
//     try {
//       setEmployees(await service.getEmployees());
//     } catch (e: any) {
//       setError(`Failed to load employees: ${e.message ?? e}`);
//     } finally {
//       setLoading(false);
//     }
//   }, []);

//   useEffect(() => { load(); }, [load]);

//   const filtered = useMemo(
//     () => employees.filter((e) =>
//       e.fullName.toLowerCase().includes(query.toLowerCase()) ||
//       e.employeeCode.toLowerCase().includes(query.toLowerCase())),
//     [employees, query],
//   );

//   return (
//     <View style={styles.flex}>
//       <View style={styles.header}>
//         <View>
//           <Text style={styles.headerTitle}>Employees</Text>
//           <Text style={styles.headerSubtitle}>Manage workforce, roles and access</Text>
//         </View>
//         <View style={styles.headerActions}>
//           <TouchableOpacity style={styles.headerIcon} onPress={() => navigation.navigate('Attendance')}>
//             <Icon name="fingerprint" color={AppColors.textSecondary} size={20} />
//           </TouchableOpacity>
//           <TouchableOpacity style={styles.headerIcon} onPress={() => navigation.navigate('Leave')}>
//             <Icon name="event-available" color={AppColors.textSecondary} size={20} />
//           </TouchableOpacity>
//           <TouchableOpacity style={styles.headerIcon} onPress={() => navigation.navigate('ActivityLog')}>
//             <Icon name="history" color={AppColors.textSecondary} size={20} />
//           </TouchableOpacity>
//         </View>
//       </View>

//       <View style={styles.searchWrap}>
//         <View style={styles.searchBox}>
//           <Icon name="search" color={AppColors.textMuted} size={20} />
//           <TextInput style={styles.searchInput} placeholder="Search name or employee ID" placeholderTextColor={AppColors.textMuted} value={query} onChangeText={setQuery} />
//         </View>
//       </View>

//       {loading ? (
//         <View style={styles.centerFill}><ActivityIndicator color={AppColors.primary} /></View>
//       ) : error ? (
//         <View style={styles.centerFill}>
//           <Icon name="error-outline" color={AppColors.danger} size={32} />
//           <Text style={styles.errorText}>{error}</Text>
//           <TouchableOpacity onPress={load}><Text style={styles.retryText}>Retry</Text></TouchableOpacity>
//         </View>
//       ) : filtered.length === 0 ? (
//         <View style={styles.centerFill}><Text style={styles.emptyText}>No employees yet</Text></View>
//       ) : (
//         <FlatList
//           data={filtered}
//           keyExtractor={(item) => item.id}
//           contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
//           ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
//           refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
//           renderItem={({ item }) => {
//             const initials = item.fullName.trim().split(' ').map((s) => s[0] ?? '').slice(0, 2).join('').toUpperCase();
//             return (
//               <TouchableOpacity
//                 style={styles.card}
//                 onPress={async () => { navigation.navigate('EmployeeDetails', { employee: item }); }}
//               >
//                 <View style={styles.avatar}><Text style={styles.avatarText}>{initials}</Text></View>
//                 <View style={{ flex: 1 }}>
//                   <Text style={styles.cardName}>{item.fullName}</Text>
//                   <Text style={styles.cardSub}>{item.employeeCode} · {item.designation ?? '—'}</Text>
//                   {item.departmentName ? <Text style={styles.cardMuted}>{item.departmentName}</Text> : null}
//                 </View>
//                 <View style={[styles.statusPill, { backgroundColor: statusBg(item.status) }]}>
//                   <Text style={[styles.statusText, { color: statusColor(item.status) }]}>{item.status.replace('_', ' ')}</Text>
//                 </View>
//               </TouchableOpacity>
//             );
//           }}
//         />
//       )}

//       <TouchableOpacity style={styles.fab} onPress={() => navigation.navigate('AddEmployee', { onSaved: load })}>
//         <Icon name="person-add-alt-1" color="#fff" size={20} />
//         <Text style={styles.fabText}>Add employee</Text>
//       </TouchableOpacity>
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   flex: { flex: 1, backgroundColor: AppColors.background },
//   header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, backgroundColor: AppColors.surface, borderBottomWidth: 1, borderColor: AppColors.border },
//   headerTitle: { fontSize: 18, fontWeight: '700', color: AppColors.textPrimary },
//   headerSubtitle: { fontSize: 12.5, color: AppColors.textSecondary, marginTop: 2 },
//   headerActions: { flexDirection: 'row', gap: 14 },
//   headerIcon: {},
//   searchWrap: { padding: 16, paddingBottom: 8 },
//   searchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: AppColors.surface, borderRadius: 12, borderWidth: 1, borderColor: AppColors.border, paddingHorizontal: 14 },
//   searchInput: { flex: 1, paddingVertical: 12, marginLeft: 8, color: AppColors.textPrimary },
//   centerFill: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 },
//   errorText: { color: AppColors.textSecondary, fontSize: 12.5, textAlign: 'center', marginTop: 10 },
//   retryText: { color: AppColors.primary, marginTop: 10 },
//   emptyText: { color: AppColors.textSecondary, fontSize: 13 },
//   card: { flexDirection: 'row', alignItems: 'center', backgroundColor: AppColors.surface, borderRadius: 14, borderWidth: 1, borderColor: AppColors.border, padding: 14 },
//   avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: AppColors.primarySoft, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
//   avatarText: { color: AppColors.primary, fontWeight: '600', fontSize: 14 },
//   cardName: { color: AppColors.textPrimary, fontSize: 14.5, fontWeight: '600' },
//   cardSub: { color: AppColors.textSecondary, fontSize: 12.5, marginTop: 3 },
//   cardMuted: { color: AppColors.textMuted, fontSize: 11.5, marginTop: 2 },
//   statusPill: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 20 },
//   statusText: { fontSize: 10, fontWeight: '700' },
//   fab: { position: 'absolute', right: 16, bottom: 20, flexDirection: 'row', alignItems: 'center', backgroundColor: AppColors.primary, borderRadius: 28, paddingVertical: 14, paddingHorizontal: 18, gap: 8, elevation: 4 },
//   fabText: { color: '#fff', fontWeight: '600', fontSize: 14 },
// });
import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, FlatList, ActivityIndicator, RefreshControl } from 'react-native';
import Icon from '@react-native-vector-icons/material-icons';
import { useNavigation } from '@react-navigation/native';

import { EmployeeService, EmployeeRecord } from '../../services/EmployeeService';
import { AppColors } from '../theme/AppColors';

const service = new EmployeeService();

function statusColor(status: string) {
  switch (status) {
    case 'ACTIVE': return AppColors.success;
    case 'ON_LEAVE': return AppColors.warning;
    case 'SUSPENDED': return AppColors.danger;
    default: return AppColors.textMuted;
  }
}
function statusBg(status: string) {
  switch (status) {
    case 'ACTIVE': return AppColors.successSoft;
    case 'ON_LEAVE': return AppColors.warningSoft;
    case 'SUSPENDED': return AppColors.dangerSoft;
    default: return AppColors.surfaceSoft;
  }
}

export default function EmployeeListScreen() {
  const navigation = useNavigation<any>();
  const [employees, setEmployees] = useState<EmployeeRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setEmployees(await service.getEmployees());
    } catch (e: any) {
      setError(`Failed to load employees: ${e.message ?? e}`);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = useMemo(
    () => employees.filter((e) =>
      e.fullName.toLowerCase().includes(query.toLowerCase()) ||
      e.employeeCode.toLowerCase().includes(query.toLowerCase())),
    [employees, query],
  );

  return (
    <View style={styles.flex}>
      <View style={styles.header}>
  <View style={[styles.headerLeft, { marginTop: 29 }]}>
    <TouchableOpacity 
      onPress={() => navigation.goBack()}
      style={styles.backBtn}
    >
      <Icon name="arrow-back" color={AppColors.textPrimary} size={22} />
    </TouchableOpacity>
    <View>
      <Text style={styles.headerTitle}>Employees</Text>
      <Text style={styles.headerSubtitle}>Manage workforce, roles and access</Text>
    </View>
  </View>
  <View style={[styles.headerActions, { marginTop: 29 }]}>
    <TouchableOpacity style={styles.headerIcon} onPress={() => navigation.navigate('Attendance')}>
      <Icon name="fingerprint" color={AppColors.textSecondary} size={20} />
    </TouchableOpacity>
    <TouchableOpacity style={styles.headerIcon} onPress={() => navigation.navigate('Leave')}>
      <Icon name="event-available" color={AppColors.textSecondary} size={20} />
    </TouchableOpacity>
    <TouchableOpacity style={styles.headerIcon} onPress={() => navigation.navigate('ActivityLog')}>
      <Icon name="history" color={AppColors.textSecondary} size={20} />
    </TouchableOpacity>
  </View>
</View>

      <View style={styles.searchWrap}>
        <View style={styles.searchBox}>
          <Icon name="search" color={AppColors.textMuted} size={20} />
          <TextInput style={styles.searchInput} placeholder="Search name or employee ID" placeholderTextColor={AppColors.textMuted} value={query} onChangeText={setQuery} />
        </View>
      </View>

      {loading ? (
        <View style={styles.centerFill}><ActivityIndicator color={AppColors.primary} /></View>
      ) : error ? (
        <View style={styles.centerFill}>
          <Icon name="error-outline" color={AppColors.danger} size={32} />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={load}><Text style={styles.retryText}>Retry</Text></TouchableOpacity>
        </View>
      ) : filtered.length === 0 ? (
        <View style={styles.centerFill}><Text style={styles.emptyText}>No employees yet</Text></View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
          ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
          renderItem={({ item }) => {
            const initials = item.fullName.trim().split(' ').map((s) => s[0] ?? '').slice(0, 2).join('').toUpperCase();
            return (
              <TouchableOpacity
                style={styles.card}
                onPress={async () => { navigation.navigate('EmployeeDetails', { employee: item }); }}
              >
                <View style={styles.avatar}><Text style={styles.avatarText}>{initials}</Text></View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardName}>{item.fullName}</Text>
                  <Text style={styles.cardSub}>{item.employeeCode} · {item.designation ?? '—'}</Text>
                  {item.departmentName ? <Text style={styles.cardMuted}>{item.departmentName}</Text> : null}
                </View>
                <View style={[styles.statusPill, { backgroundColor: statusBg(item.status) }]}>
                  <Text style={[styles.statusText, { color: statusColor(item.status) }]}>{item.status.replace('_', ' ')}</Text>
                </View>
              </TouchableOpacity>
            );
          }}
        />
      )}

      <TouchableOpacity style={styles.fab} onPress={() => navigation.navigate('AddEmployee', { onSaved: load })}>
        <Icon name="person-add-alt-1" color="#fff" size={20} />
        <Text style={styles.fabText}>Add employee</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: AppColors.background },
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    padding: 16, 
    backgroundColor: AppColors.surface, 
    borderBottomWidth: 1, 
    borderColor: AppColors.border 
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backBtn: {
    padding: 4,
  },
  headerTitle: { 
    fontSize: 18, 
    fontWeight: '700', 
    color: AppColors.textPrimary 
  },
  headerSubtitle: { 
    fontSize: 12.5, 
    color: AppColors.textSecondary, 
    marginTop: 2 
  },
  headerActions: { flexDirection: 'row', gap: 14 },
  headerIcon: {},
  searchWrap: { padding: 16, paddingBottom: 8 },
  searchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: AppColors.surface, borderRadius: 12, borderWidth: 1, borderColor: AppColors.border, paddingHorizontal: 14 },
  searchInput: { flex: 1, paddingVertical: 12, marginLeft: 8, color: AppColors.textPrimary },
  centerFill: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 },
  errorText: { color: AppColors.textSecondary, fontSize: 12.5, textAlign: 'center', marginTop: 10 },
  retryText: { color: AppColors.primary, marginTop: 10 },
  emptyText: { color: AppColors.textSecondary, fontSize: 13 },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: AppColors.surface, borderRadius: 14, borderWidth: 1, borderColor: AppColors.border, padding: 14 },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: AppColors.primarySoft, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  avatarText: { color: AppColors.primary, fontWeight: '600', fontSize: 14 },
  cardName: { color: AppColors.textPrimary, fontSize: 14.5, fontWeight: '600' },
  cardSub: { color: AppColors.textSecondary, fontSize: 12.5, marginTop: 3 },
  cardMuted: { color: AppColors.textMuted, fontSize: 11.5, marginTop: 2 },
  statusPill: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 20 },
  statusText: { fontSize: 10, fontWeight: '700' },
  fab: { position: 'absolute', right: 20, bottom: 70, flexDirection: 'row', alignItems: 'center', backgroundColor: AppColors.primary, borderRadius: 28, paddingVertical: 14, paddingHorizontal: 18, gap: 8, elevation: 4 },
  fabText: { color: '#fff', fontWeight: '600', fontSize: 14 },
});
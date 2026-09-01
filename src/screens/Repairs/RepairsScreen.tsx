import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, FlatList, ActivityIndicator, RefreshControl, Modal, Alert } from 'react-native';
import Icon from '@react-native-vector-icons/material-icons';
import { useNavigation } from '@react-navigation/native';

import { RepairService, RepairRecord } from '../../services/RepairService';
import { AppColors } from '../theme/AppColors';

const service = new RepairService();

const statusOptions = ['All', 'PENDING', 'IN_PROGRESS', 'COMPLETED', 'REJECTED'];
const statusLabel = (s: string) => s.replace(/_/g, ' ');

function statusColor(status: string) {
  switch (status) {
    case 'IN_PROGRESS': return AppColors.warning;
    case 'COMPLETED': return AppColors.success;
    case 'REJECTED': return AppColors.danger;
    default: return AppColors.info;
  }
}
function statusBg(status: string) {
  switch (status) {
    case 'IN_PROGRESS': return AppColors.warningSoft;
    case 'COMPLETED': return AppColors.successSoft;
    case 'REJECTED': return AppColors.dangerSoft;
    default: return AppColors.infoSoft;
  }
}

export default function RepairsScreen() {
  const navigation = useNavigation<any>();
  const [tabIndex, setTabIndex] = useState(0);
  const [offline, setOffline] = useState<RepairRecord[]>([]);
  const [online, setOnline] = useState<RepairRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [rejectDialogFor, setRejectDialogFor] = useState<RepairRecord | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const off = await service.getOfflineRepairs();
      const on = await service.getOnlineRepairs();
      setOffline(off);
      setOnline(on);
    } catch (e: any) {
      setError('Failed to load repairs: ' + String(e.message ?? e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const advanceStatus = async (r: RepairRecord) => {
    let next: string;
    if (r.status === 'PENDING') next = 'IN_PROGRESS';
    else if (r.status === 'IN_PROGRESS') next = 'COMPLETED';
    else return;

    try {
      await service.updateRepairStatus(r.id, next);
      load();
    } catch (e: any) {
      Alert.alert('Failed: ' + String(e.message ?? e));
    }
  };

  const acceptOnline = async (r: RepairRecord, technicianId: string) => {
    try {
      await service.acceptOnlineRepair({ repairId: r.id, assignedTo: technicianId });
      load();
    } catch (e: any) {
      Alert.alert('Failed: ' + String(e.message ?? e));
    }
  };

  const openRejectDialog = (r: RepairRecord) => {
    setRejectReason('');
    setRejectDialogFor(r);
  };

  const confirmReject = async () => {
    if (!rejectDialogFor || !rejectReason.trim()) return;
    const r = rejectDialogFor;
    setRejectDialogFor(null);
    try {
      await service.rejectOnlineRepair({ repairId: r.id, reason: rejectReason.trim() });
      load();
    } catch (e: any) {
      Alert.alert('Failed: ' + String(e.message ?? e));
    }
  };

  const filter = (list: RepairRecord[]) => {
    return list.filter((r) => {
      const q = query.toLowerCase();
      const matchesQuery = !q ||
        r.customerName.toLowerCase().includes(q) ||
        r.repairNumber.toLowerCase().includes(q) ||
        (r.customerPhone ?? '').includes(q) ||
        r.device.toLowerCase().includes(q) ||
        r.problemDescription.toLowerCase().includes(q);
      const matchesStatus = statusFilter === 'All' || r.status === statusFilter;
      return matchesQuery && matchesStatus;
    });
  };

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
          <Text style={styles.headerTitle}>Repairs</Text>
        </View>
      </View>

      <View style={styles.tabBar}>
        <TouchableOpacity style={styles.tabItem} onPress={() => setTabIndex(0)}>
          <Text style={[styles.tabText, tabIndex === 0 && styles.tabTextActive]}>OFFLINE REPAIR</Text>
          {tabIndex === 0 && <View style={styles.tabIndicator} />}
        </TouchableOpacity>
        <TouchableOpacity style={styles.tabItem} onPress={() => setTabIndex(1)}>
          <Text style={[styles.tabText, tabIndex === 1 && styles.tabTextActive]}>ONLINE REPAIR</Text>
          {tabIndex === 1 && <View style={styles.tabIndicator} />}
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.centerFill}><ActivityIndicator color={AppColors.primary} /></View>
      ) : error ? (
        <View style={styles.centerFill}><Text style={{ color: AppColors.danger, fontSize: 12.5 }}>{error}</Text></View>
      ) : (
        <>
          <View style={styles.searchWrap}>
            <View style={styles.searchBox}>
              <Icon name="search" color={AppColors.textMuted} size={20} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search repairs..."
                placeholderTextColor={AppColors.textMuted}
                value={query}
                onChangeText={setQuery}
              />
            </View>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipBar} contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}>
            {statusOptions.map((option) => {
              const selected = statusFilter === option;
              return (
                <TouchableOpacity key={option} style={[styles.chip, selected && styles.chipSelected]} onPress={() => setStatusFilter(option)}>
                  <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{statusLabel(option)}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {tabIndex === 0 ? (
            <RepairList list={filter(offline)} isOnline={false} onRefresh={load} onAdvance={advanceStatus} onAccept={acceptOnline} onReject={openRejectDialog} />
          ) : (
            <RepairList list={filter(online)} isOnline={true} onRefresh={load} onAdvance={advanceStatus} onAccept={acceptOnline} onReject={openRejectDialog} />
          )}
        </>
      )}

      {tabIndex === 0 && (
        <TouchableOpacity
          style={styles.fab}
          onPress={async () => {
            navigation.navigate('CreateRepair');
          }}
        >
          <Icon name="add" color="#fff" size={20} />
          <Text style={styles.fabText}>New repair</Text>
        </TouchableOpacity>
      )}

      <Modal visible={rejectDialogFor !== null} transparent animationType="fade" onRequestClose={() => setRejectDialogFor(null)}>
        <View style={styles.dialogBackdrop}>
          <View style={styles.dialog}>
            <Text style={styles.dialogTitle}>Reject repair</Text>
            <TextInput
              style={[styles.dialogInput, { height: 80, textAlignVertical: 'top' }]}
              placeholder="Reason for rejection"
              placeholderTextColor={AppColors.textMuted}
              multiline
              value={rejectReason}
              onChangeText={setRejectReason}
            />
            <View style={styles.dialogActions}>
              <TouchableOpacity onPress={() => setRejectDialogFor(null)}><Text style={styles.dialogCancel}>Cancel</Text></TouchableOpacity>
              <TouchableOpacity onPress={confirmReject}><Text style={styles.dialogReject}>Reject Repair</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function RepairList({ list, isOnline, onRefresh, onAdvance, onAccept, onReject }: {
  list: RepairRecord[];
  isOnline: boolean;
  onRefresh: () => void;
  onAdvance: (r: RepairRecord) => void;
  onAccept: (r: RepairRecord, techId: string) => void;
  onReject: (r: RepairRecord) => void;
}) {
  if (list.length === 0) {
    return (
      <View style={styles.centerFill}>
        <Text style={styles.emptyText}>
          {isOnline ? 'No online repairs yet — will appear once customers can book from the app' : 'No repairs match this filter'}
        </Text>
      </View>
    );
  }

  return (
    <FlatList
      data={list}
      keyExtractor={(item) => item.id}
      contentContainerStyle={{ padding: 16, paddingBottom: 24 }}
      ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
      refreshControl={<RefreshControl refreshing={false} onRefresh={onRefresh} />}
      renderItem={({ item: r }) => (
        <View style={styles.card}>
          <View style={styles.cardTopRow}>
            <Text style={styles.repairNumber}>{r.repairNumber}</Text>
            <View style={{ flex: 1 }} />
            <View style={[styles.statusPill, { backgroundColor: statusBg(r.status) }]}>
              <Text style={[styles.statusText, { color: statusColor(r.status) }]}>{statusLabel(r.status)}</Text>
            </View>
          </View>
          <Text style={styles.customerName}>{r.customerName}</Text>
          <Text style={styles.cardLine}>📱 {r.device}</Text>
          <Text style={styles.cardLine}>🔧 {r.problemDescription}</Text>
          {r.address ? <Text style={styles.cardMuted}>📍 {r.address}</Text> : null}
          <Text style={styles.cardMuted}>
            {r.createdAt.toLocaleDateString()} · {r.createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
          {r.assignedToName ? <Text style={styles.assignedText}>👷 {r.assignedToName}</Text> : null}
          {r.rejectionReason ? <Text style={styles.reasonText}>Reason: {r.rejectionReason}</Text> : null}

          {isOnline && r.status === 'PENDING' && !r.assignedTo ? (
            <OnlineActionButtons onAccept={(techId) => onAccept(r, techId)} onReject={() => onReject(r)} />
          ) : !isOnline && (r.status === 'PENDING' || r.status === 'IN_PROGRESS') ? (
            <TouchableOpacity style={styles.advanceButton} onPress={() => onAdvance(r)}>
              <Text style={styles.advanceButtonText}>{r.status === 'PENDING' ? 'Start Repair' : 'Mark Completed'}</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      )}
    />
  );
}

// Small widget that loads the technician list for the Accept dropdown
function OnlineActionButtons({ onAccept, onReject }: {
  onAccept: (technicianId: string) => void;
  onReject: () => void;
}) {
  const showTechnicianPicker = () => {
    // Deferred: technician picking dialog reuses EmployeeService.getEmployees()
    // Implemented in CreateRepairScreen's technician dropdown pattern —
    // wire the same picker here if/when online bookings start arriving.
    Alert.alert('Assign a technician to accept this repair');
  };

  return (
    <View style={styles.actionsRow}>
      <TouchableOpacity style={styles.rejectButton} onPress={onReject}>
        <Text style={styles.rejectButtonText}>REJECT</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.acceptButton} onPress={showTechnicianPicker}>
        <Text style={styles.acceptButtonText}>ACCEPT</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: AppColors.background },
  centerFill: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 },
  header: { padding: 16, paddingTop: 50, backgroundColor: AppColors.surface },
  headerTitle: { fontSize: 18, fontWeight: '700', color: AppColors.textPrimary },
  tabBar: { flexDirection: 'row', backgroundColor: AppColors.surface, borderBottomWidth: 1, borderColor: AppColors.border },
  tabItem: { flex: 1, alignItems: 'center', paddingVertical: 12 },
  tabText: { color: AppColors.textSecondary, fontSize: 13, fontWeight: '700' },
  tabTextActive: { color: AppColors.primary },
  tabIndicator: { height: 2, backgroundColor: AppColors.primary, marginTop: 8, width: '60%', borderRadius: 1 },
  searchWrap: { padding: 16, paddingBottom: 8 },
  searchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: AppColors.surface, borderRadius: 12, borderWidth: 1, borderColor: AppColors.border, paddingHorizontal: 14 },
  searchInput: { flex: 1, paddingVertical: 12, marginLeft: 8, color: AppColors.textPrimary },
  chipBar: { flexGrow: 0, paddingBottom: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: AppColors.surface, borderWidth: 1, borderColor: AppColors.border },
  chipSelected: { backgroundColor: AppColors.primary, borderColor: AppColors.primary },
  chipText: { fontSize: 12, color: AppColors.textSecondary, fontWeight: '600' },
  chipTextSelected: { color: '#fff' },
  emptyText: { color: AppColors.textSecondary, fontSize: 13, textAlign: 'center' },
  card: { backgroundColor: AppColors.surface, borderRadius: 16, borderWidth: 1, borderColor: AppColors.border, padding: 14 },
  cardTopRow: { flexDirection: 'row', alignItems: 'center' },
  repairNumber: { color: AppColors.textPrimary, fontSize: 14, fontWeight: '700' },
  statusPill: { paddingHorizontal: 9, paddingVertical: 4, borderRadius: 20 },
  statusText: { fontSize: 10.5, fontWeight: '700' },
  customerName: { color: AppColors.textPrimary, fontSize: 15, fontWeight: '700', marginTop: 4 },
  cardLine: { color: AppColors.textSecondary, fontSize: 13, marginTop: 8 },
  cardMuted: { color: AppColors.textMuted, fontSize: 12, marginTop: 6 },
  assignedText: { color: AppColors.textSecondary, fontSize: 12, fontWeight: '600', marginTop: 4 },
  reasonText: { color: AppColors.danger, fontSize: 12, marginTop: 6 },
  actionsRow: { flexDirection: 'row', gap: 10, marginTop: 12 },
  rejectButton: { flex: 1, borderWidth: 1, borderColor: AppColors.danger, borderRadius: 10, height: 38, alignItems: 'center', justifyContent: 'center' },
  rejectButtonText: { color: AppColors.danger, fontSize: 12.5, fontWeight: '700' },
  acceptButton: { flex: 1, backgroundColor: AppColors.primary, borderRadius: 10, height: 38, alignItems: 'center', justifyContent: 'center' },
  acceptButtonText: { color: '#fff', fontSize: 12.5, fontWeight: '700' },
  advanceButton: { backgroundColor: AppColors.primary, borderRadius: 10, height: 38, alignItems: 'center', justifyContent: 'center', marginTop: 12 },
  advanceButtonText: { color: '#fff', fontSize: 12.5, fontWeight: '700' },
  fab: { position: 'absolute', right: 16, bottom: 20, flexDirection: 'row', alignItems: 'center', backgroundColor: AppColors.primary, borderRadius: 28, paddingVertical: 14, paddingHorizontal: 18, gap: 8, elevation: 4 },
  fabText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  dialogBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', alignItems: 'center', justifyContent: 'center' },
  dialog: { backgroundColor: AppColors.surface, borderRadius: 16, padding: 20, width: '85%' },
  dialogTitle: { color: AppColors.textPrimary, fontSize: 16, fontWeight: '700', marginBottom: 14 },
  dialogInput: { borderWidth: 1, borderColor: AppColors.border, borderRadius: 10, padding: 12, color: AppColors.textPrimary },
  dialogActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 20, marginTop: 16 },
  dialogCancel: { color: AppColors.textSecondary, fontSize: 14 },
  dialogReject: { color: AppColors.danger, fontWeight: '700', fontSize: 14 },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  backBtn: {
    padding: 4,
  },
});
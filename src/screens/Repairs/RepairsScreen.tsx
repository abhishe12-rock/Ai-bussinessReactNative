import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  Modal,
  Alert,
} from 'react-native';
import Icon from '@react-native-vector-icons/material-icons';
import { useNavigation } from '@react-navigation/native';
import { RepairService, RepairRecord } from '../../services/RepairService';
import { AppColors, AppShadows, AppRadius } from '../theme/AppColors';
import { FadeInUp, SpringTouch } from '../theme/Animations';

const service = new RepairService();

const statusOptions = ['All', 'PENDING', 'IN_PROGRESS', 'COMPLETED', 'REJECTED'];
const statusLabel = (s: string) => s.replace(/_/g, ' ');

function statusColor(status: string) {
  switch (status) {
    case 'IN_PROGRESS':
      return AppColors.warning;
    case 'COMPLETED':
      return AppColors.success;
    case 'REJECTED':
      return AppColors.danger;
    default:
      return AppColors.info;
  }
}

function statusBg(status: string) {
  switch (status) {
    case 'IN_PROGRESS':
      return '#FFFBEB';
    case 'COMPLETED':
      return '#ECFDF5';
    case 'REJECTED':
      return '#FEF2F2';
    default:
      return '#EFF6FF';
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
  const [completeDialogFor, setCompleteDialogFor] = useState<RepairRecord | null>(null);
  const [completeCost, setCompleteCost] = useState('');

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

  useEffect(() => {
    load();
  }, []);

  const startRepair = async (r: RepairRecord) => {
    try {
      await service.updateRepairStatus(r.id, 'IN_PROGRESS');
      load();
    } catch (e: any) {
      Alert.alert('Failed: ' + String(e.message ?? e));
    }
  };

  const openCompleteDialog = (r: RepairRecord) => {
    setCompleteCost('');
    setCompleteDialogFor(r);
  };

  const confirmComplete = async () => {
    if (!completeDialogFor) return;
    const value = parseFloat(completeCost.trim());
    if (isNaN(value) || value <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid amount greater than 0');
      return;
    }
    const r = completeDialogFor;
    setCompleteDialogFor(null);
    try {
      await service.completeRepair({ repairId: r.id, cost: value });
      Alert.alert('Success', `Repair completed — ₹${value.toFixed(0)} recorded as income`);
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
      const matchesQuery =
        !q ||
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
      {/* HEADER */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backBtn}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Icon name="arrow-back-ios" color={AppColors.textPrimary} size={20} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Repairs</Text>
        </View>

        <View style={styles.headerRight}>
          <TouchableOpacity
            style={styles.addCircleBtn}
            onPress={() => navigation.navigate('CreateRepair')}
            activeOpacity={0.8}
          >
            <Icon name="add" size={22} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>

      {/* OFFLINE / ONLINE SEGMENTED TABS */}
      <View style={styles.modeTabsWrap}>
        <View style={styles.modeTabs}>
          <TouchableOpacity
            style={[styles.modeTab, tabIndex === 0 && styles.modeTabActive]}
            onPress={() => setTabIndex(0)}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.modeTabText,
                tabIndex === 0 && styles.modeTabTextActive,
              ]}
            >
              Offline Repairs
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.modeTab, tabIndex === 1 && styles.modeTabActive]}
            onPress={() => setTabIndex(1)}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.modeTabText,
                tabIndex === 1 && styles.modeTabTextActive,
              ]}
            >
              Online Bookings
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* SEARCH BAR */}
      <View style={styles.searchWrap}>
        <View style={styles.searchBox}>
          <Icon name="search" color={AppColors.textMuted} size={20} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search repairs by customer, device or ticket..."
            placeholderTextColor={AppColors.textMuted}
            value={query}
            onChangeText={setQuery}
          />
          {query.length > 0 ? (
            <TouchableOpacity onPress={() => setQuery('')}>
              <Icon name="close" size={18} color={AppColors.textMuted} />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity onPress={() => { }}>
              <Icon name="tune" size={20} color={AppColors.primary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* STATUS FILTER CHIPS */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.chipBar}
        contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
      >
        {statusOptions.map((option) => {
          const selected = statusFilter === option;
          return (
            <SpringTouch
              key={option}
              activeScale={0.95}
              onPress={() => setStatusFilter(option)}
            >
              <View style={[styles.chip, selected && styles.chipSelected]}>
                <Text
                  style={[
                    styles.chipText,
                    selected && styles.chipTextSelected,
                  ]}
                >
                  {statusLabel(option)}
                </Text>
              </View>
            </SpringTouch>
          );
        })}
      </ScrollView>

      {loading ? (
        <View style={styles.centerFill}>
          <ActivityIndicator color={AppColors.primary} />
          <Text style={styles.emptySubtitle}>Loading repairs...</Text>
        </View>
      ) : error ? (
        <View style={styles.centerFill}>
          <Text style={{ color: AppColors.danger, fontSize: 13 }}>{error}</Text>
        </View>
      ) : (
        <RepairList
          list={filter(tabIndex === 0 ? offline : online)}
          isOnline={tabIndex === 1}
          onRefresh={load}
          onStartRepair={startRepair}
          onCompleteRepair={openCompleteDialog}
          onAccept={acceptOnline}
          onReject={openRejectDialog}
        />
      )}

      {/* REJECT MODAL */}
      <Modal
        visible={rejectDialogFor !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setRejectDialogFor(null)}
      >
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
              <TouchableOpacity
                onPress={() => setRejectDialogFor(null)}
                style={styles.dialogCancelBtn}
              >
                <Text style={styles.dialogCancel}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={confirmReject}
                style={styles.dialogRejectBtn}
              >
                <Text style={styles.dialogReject}>Reject Repair</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* COMPLETE REPAIR MODAL */}
      <Modal
        visible={completeDialogFor !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setCompleteDialogFor(null)}
      >
        <View style={styles.dialogBackdrop}>
          <View style={styles.dialog}>
            <Text style={styles.dialogTitle}>Complete repair</Text>
            <Text style={styles.dialogSubtitle}>
              Enter the final repair cost. This amount will be recorded as Income once completed.
            </Text>
            <View style={styles.dialogCostInputWrapper}>
              <Text style={styles.dialogCurrencyPrefix}>₹</Text>
              <TextInput
                style={styles.dialogCostInput}
                placeholder="Final cost"
                placeholderTextColor={AppColors.textMuted}
                keyboardType="numeric"
                autoFocus
                value={completeCost}
                onChangeText={setCompleteCost}
              />
            </View>
            <View style={styles.dialogActions}>
              <TouchableOpacity
                onPress={() => setCompleteDialogFor(null)}
                style={styles.dialogCancelBtn}
              >
                <Text style={styles.dialogCancel}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={confirmComplete}
                style={styles.dialogCompleteBtn}
              >
                <Text style={styles.dialogComplete}>Mark Completed</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function RepairList({
  list,
  isOnline,
  onRefresh,
  onStartRepair,
  onCompleteRepair,
  onAccept,
  onReject,
}: {
  list: RepairRecord[];
  isOnline: boolean;
  onRefresh: () => void;
  onStartRepair: (r: RepairRecord) => void;
  onCompleteRepair: (r: RepairRecord) => void;
  onAccept: (r: RepairRecord, techId: string) => void;
  onReject: (r: RepairRecord) => void;
}) {
  if (list.length === 0) {
    return (
      <View style={styles.centerFill}>
        <View style={styles.emptyIconCircle}>
          <Icon name="build" size={32} color={AppColors.textMuted} />
        </View>
        <Text style={styles.emptyTitle}>No repairs found</Text>
        <Text style={styles.emptySubtitle}>
          {isOnline
            ? 'No online repairs yet — will appear once customers book.'
            : 'No repairs match this filter.'}
        </Text>
      </View>
    );
  }

  return (
    <FlatList
      data={list}
      keyExtractor={(item) => item.id}
      contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 6, paddingBottom: 24 }}
      ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
      refreshControl={<RefreshControl refreshing={false} onRefresh={onRefresh} />}
      renderItem={({ item: r, index }) => (
        <FadeInUp delay={Math.min(index * 35, 300)} distance={12}>
          <View style={styles.card}>
            <View style={styles.cardTopRow}>
              <View style={styles.ticketWrap}>
                <Icon name="build" size={16} color={AppColors.primary} />
                <Text style={styles.repairNumber}>#{r.repairNumber}</Text>
              </View>
              <View style={[styles.statusPill, { backgroundColor: statusBg(r.status) }]}>
                <Text style={[styles.statusText, { color: statusColor(r.status) }]}>
                  {statusLabel(r.status)}
                </Text>
              </View>
            </View>

            <Text style={styles.customerName}>{r.customerName}</Text>

            <View style={styles.deviceRow}>
              <Icon name="smartphone" size={16} color={AppColors.textSecondary} />
              <Text style={styles.deviceText}>{r.device}</Text>
            </View>

            <View style={styles.problemRow}>
              <Icon name="error-outline" size={16} color={AppColors.textMuted} />
              <Text style={styles.problemText}>{r.problemDescription}</Text>
            </View>

            {r.address ? (
              <View style={styles.addressRow}>
                <Icon name="location-on" size={15} color={AppColors.textMuted} />
                <Text style={styles.cardMuted}>{r.address}</Text>
              </View>
            ) : null}

            <View style={styles.cardFooterRow}>
              <Text style={styles.cardDate}>
                {new Date(r.createdAt).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'short',
                })}{' '}
                ·{' '}
                {new Date(r.createdAt).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </Text>
              {r.assignedToName ? (
                <View style={styles.assignedBadge}>
                  <Icon name="person" size={12} color={AppColors.primary} />
                  <Text style={styles.assignedText}>{r.assignedToName}</Text>
                </View>
              ) : null}
            </View>

            {r.rejectionReason ? (
              <Text style={styles.reasonText}>Reason: {r.rejectionReason}</Text>
            ) : null}

            {isOnline && r.status === 'PENDING' && !r.assignedTo ? (
              <OnlineActionButtons
                onAccept={(techId) => onAccept(r, techId)}
                onReject={() => onReject(r)}
              />
            ) : !isOnline && r.status === 'PENDING' ? (
              <SpringTouch
                style={{ width: '100%' }}
                activeScale={0.97}
                onPress={() => onStartRepair(r)}
              >
                <View style={styles.advanceButton}>
                  <Text style={styles.advanceButtonText}>Start Repair</Text>
                </View>
              </SpringTouch>
            ) : !isOnline && r.status === 'IN_PROGRESS' ? (
              <SpringTouch
                style={{ width: '100%' }}
                activeScale={0.97}
                onPress={() => onCompleteRepair(r)}
              >
                <View style={styles.advanceButton}>
                  <Text style={styles.advanceButtonText}>Mark Completed</Text>
                </View>
              </SpringTouch>
            ) : null}
          </View>
        </FadeInUp>
      )}
    />
  );
}

function OnlineActionButtons({
  onAccept,
  onReject,
}: {
  onAccept: (technicianId: string) => void;
  onReject: () => void;
}) {
  const showTechnicianPicker = () => {
    Alert.alert('Assign a technician to accept this repair');
  };

  return (
    <View style={styles.actionsRow}>
      <TouchableOpacity
        style={styles.rejectButton}
        onPress={onReject}
        activeOpacity={0.7}
      >
        <Text style={styles.rejectButtonText}>Reject</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.acceptButton}
        onPress={showTechnicianPicker}
        activeOpacity={0.8}
      >
        <Text style={styles.acceptButtonText}>Accept</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: AppColors.background,
  },
  centerFill: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingTop: 40,
  },

  /* HEADER */
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 52,
    paddingBottom: 14,
    backgroundColor: AppColors.background,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  backBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: AppColors.textPrimary,
    letterSpacing: -0.5,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  addCircleBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: AppColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...AppShadows.glow,
  },

  /* OFFLINE / ONLINE SEGMENTED TABS */
  modeTabsWrap: {
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  modeTabs: {
    flexDirection: 'row',
    backgroundColor: AppColors.surface,
    borderRadius: 24,
    padding: 4,
    borderWidth: 1,
    borderColor: AppColors.border,
    ...AppShadows.subtle,
  },
  modeTab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
  },
  modeTabActive: {
    backgroundColor: AppColors.primary,
    ...AppShadows.glow,
  },
  modeTabText: {
    fontSize: 13,
    fontWeight: '600',
    color: AppColors.textSecondary,
  },
  modeTabTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },

  /* SEARCH BAR */
  searchWrap: {
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: AppColors.surface,
    borderRadius: 24,
    paddingHorizontal: 16,
    height: 46,
    borderWidth: 1,
    borderColor: AppColors.border,
    ...AppShadows.subtle,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 14,
    color: AppColors.textPrimary,
    fontWeight: '500',
  },

  /* CHIPS */
  chipBar: {
    flexGrow: 0,
    marginBottom: 10,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: AppColors.surface,
    borderWidth: 1,
    borderColor: AppColors.border,
    ...AppShadows.subtle,
  },
  chipSelected: {
    backgroundColor: AppColors.primary,
    borderColor: AppColors.primary,
    ...AppShadows.glow,
  },
  chipText: {
    fontSize: 12,
    color: AppColors.textSecondary,
    fontWeight: '600',
  },
  chipTextSelected: {
    color: '#FFFFFF',
    fontWeight: '700',
  },

  /* CARD */
  card: {
    backgroundColor: AppColors.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: AppColors.border,
    padding: 16,
    ...AppShadows.card,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  ticketWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  repairNumber: {
    color: AppColors.primary,
    fontSize: 13.5,
    fontWeight: '700',
  },
  statusPill: {
    paddingHorizontal: 9,
    paddingVertical: 3.5,
    borderRadius: 10,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  customerName: {
    color: AppColors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.3,
    marginBottom: 6,
  },
  deviceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  deviceText: {
    color: AppColors.textPrimary,
    fontSize: 13.5,
    fontWeight: '600',
  },
  problemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  problemText: {
    color: AppColors.textSecondary,
    fontSize: 12.5,
    flex: 1,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 6,
  },
  cardMuted: {
    color: AppColors.textMuted,
    fontSize: 12,
  },
  cardFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: AppColors.borderSubtle,
  },
  cardDate: {
    color: AppColors.textMuted,
    fontSize: 11.5,
    fontWeight: '500',
  },
  assignedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#EEECFE',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  assignedText: {
    color: AppColors.primary,
    fontSize: 11,
    fontWeight: '700',
  },
  reasonText: {
    color: AppColors.danger,
    fontSize: 12,
    marginTop: 6,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
  },
  rejectButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: AppColors.danger,
    backgroundColor: '#FEF2F2',
    borderRadius: 14,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rejectButtonText: {
    color: AppColors.danger,
    fontSize: 13,
    fontWeight: '700',
  },
  acceptButton: {
    flex: 1,
    backgroundColor: AppColors.primary,
    borderRadius: 14,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    ...AppShadows.glow,
  },
  acceptButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  advanceButton: {
    backgroundColor: AppColors.primary,
    borderRadius: 14,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    ...AppShadows.glow,
  },
  advanceButtonText: {
    color: '#FFFFFF',
    fontSize: 13.5,
    fontWeight: '700',
  },

  /* EMPTY STATE */
  emptyIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: AppColors.surfaceSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: AppColors.textPrimary,
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 13,
    color: AppColors.textSecondary,
    textAlign: 'center',
    marginTop: 4,
  },

  /* DIALOG */
  dialogBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dialog: {
    backgroundColor: AppColors.surface,
    borderRadius: 22,
    padding: 22,
    width: '85%',
    borderWidth: 1,
    borderColor: AppColors.border,
    ...AppShadows.card,
  },
  dialogTitle: {
    color: AppColors.textPrimary,
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 14,
  },
  dialogInput: {
    borderWidth: 1,
    borderColor: AppColors.border,
    borderRadius: 14,
    padding: 12,
    color: AppColors.textPrimary,
    backgroundColor: AppColors.surfaceSoft,
    fontSize: 13.5,
  },
  dialogActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 16,
  },
  dialogCancelBtn: {
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  dialogCancel: {
    color: AppColors.textSecondary,
    fontSize: 14,
    fontWeight: '600',
  },
  dialogRejectBtn: {
    backgroundColor: '#FEF2F2',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 12,
  },
  dialogReject: {
    color: AppColors.danger,
    fontWeight: '700',
    fontSize: 14,
  },
  dialogSubtitle: {
    color: AppColors.textSecondary,
    fontSize: 12.5,
    marginBottom: 14,
    lineHeight: 18,
  },
  dialogCostInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: AppColors.border,
    borderRadius: 14,
    paddingHorizontal: 14,
    backgroundColor: AppColors.surfaceSoft,
  },
  dialogCurrencyPrefix: {
    fontSize: 16,
    fontWeight: '700',
    color: AppColors.textPrimary,
    marginRight: 6,
  },
  dialogCostInput: {
    flex: 1,
    paddingVertical: 12,
    color: AppColors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
  },
  dialogCompleteBtn: {
    backgroundColor: AppColors.primary,
    paddingVertical: 9,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  dialogComplete: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
});
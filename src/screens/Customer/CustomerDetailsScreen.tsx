import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import Icon from '@react-native-vector-icons/material-icons';
import { useNavigation, useRoute } from '@react-navigation/native';

import { CustomerRecord } from '../../services/CustomerService';
import { RepairService, RepairRecord } from '../../services/RepairService';
import { AppColors } from '../theme/AppColors';

const TABS = ['Overview', 'Purchases', 'Repairs', 'EMI', 'Ledger', 'Documents'];

export default function CustomerDetailsScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const customer: CustomerRecord = route.params.customer;
  const [activeTab, setActiveTab] = useState(0);

  const initials = customer.name.trim()
    ? customer.name.trim().split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()
    : '?';

  return (
    <View style={styles.flex}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" color={AppColors.textPrimary} size={22} />
        </TouchableOpacity>
        <View style={styles.headerActions}>
          <TouchableOpacity style={{ marginRight: 16 }}>
            <Icon name="call" color={AppColors.primary} size={20} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('EditCustomer', { customer })}>
            <Icon name="edit" color={AppColors.textSecondary} size={20} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.profileRow}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.name}>{customer.name}</Text>
          <Text style={styles.sub}>📱 {customer.phone}</Text>
          {customer.city ? <Text style={styles.sub}>📍 {customer.city}</Text> : null}
        </View>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabBar}>
        {TABS.map((tab, i) => (
          <TouchableOpacity key={tab} style={styles.tabItem} onPress={() => setActiveTab(i)}>
            <Text style={[styles.tabText, activeTab === i && styles.tabTextActive]}>{tab}</Text>
            {activeTab === i && <View style={styles.tabIndicator} />}
          </TouchableOpacity>
        ))}
      </ScrollView>

      <View style={{ flex: 1 }}>
        {activeTab === 0 && <OverviewTab customer={customer} />}
        {activeTab === 1 && <ComingSoonTab icon="shopping-bag" title="Purchase history" message="This will show once the sales table is connected" />}
        {activeTab === 2 && <CustomerRepairsTab customer={customer} />}
        {activeTab === 3 && <ComingSoonTab icon="credit-card" title="EMI details" message="This will show once the EMI table is connected" />}
        {activeTab === 4 && <ComingSoonTab icon="receipt-long" title="Customer ledger" message="This will show once the ledger table is connected" />}
        {activeTab === 5 && <ComingSoonTab icon="folder" title="Documents" message="This will show once document storage is connected" />}
      </View>
    </View>
  );
}

function OverviewTab({ customer }: { customer: CustomerRecord }) {
  return (
    <ScrollView contentContainerStyle={styles.tabContent}>
      <Text style={styles.sectionLabel}>Contact info</Text>
      <View style={styles.infoCard}>
        <InfoRow icon="call" label="Mobile" value={customer.phone} />
        {customer.alternatePhone && <InfoRow icon="phone-forwarded" label="Alternate" value={customer.alternatePhone} />}
        {customer.email && <InfoRow icon="mail-outline" label="Email" value={customer.email} />}
        {customer.address && <InfoRow icon="location-on" label="Address" value={customer.address} />}
        {customer.city && <InfoRow icon="location-city" label="City" value={customer.city} />}
        <InfoRow icon="receipt-long" label="GST" value={customer.gstNumber ?? 'Not provided'} isLast />
      </View>

      <View style={styles.noticeBox}>
        <Icon name="info-outline" color={AppColors.info} size={18} />
        <Text style={styles.noticeText}>Purchase, EMI and ledger totals will appear here once those modules are connected.</Text>
      </View>
    </ScrollView>
  );
}

function CustomerRepairsTab({ customer }: { customer: CustomerRecord }) {
  const [repairs, setRepairs] = useState<RepairRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const service = new RepairService();
      const data = await service.getRepairsForCustomer(customer.id);
      setRepairs(data);
    } catch (e: any) {
      setError(`Failed to load repairs: ${e.message ?? e}`);
    } finally {
      setLoading(false);
    }
  };

  const statusColor = (status: string) => {
    switch (status) {
      case 'IN_PROGRESS': return AppColors.warning;
      case 'COMPLETED': return AppColors.success;
      case 'REJECTED': return AppColors.danger;
      default: return AppColors.info;
    }
  };
  const statusBg = (status: string) => {
    switch (status) {
      case 'IN_PROGRESS': return AppColors.warningSoft;
      case 'COMPLETED': return AppColors.successSoft;
      case 'REJECTED': return AppColors.dangerSoft;
      default: return AppColors.infoSoft;
    }
  };

  if (loading) return <View style={styles.centerFill}><ActivityIndicator color={AppColors.primary} /></View>;
  if (error) return <View style={styles.centerFill}><Text style={{ color: AppColors.danger, fontSize: 12.5 }}>{error}</Text></View>;
  if (repairs.length === 0) {
    return (
      <View style={styles.centerFill}>
        <Text style={{ color: AppColors.textSecondary, fontSize: 13, textAlign: 'center', paddingHorizontal: 32 }}>
          No repair tickets for this customer yet
        </Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.tabContent}>
      {repairs.map((r) => (
        <View key={r.id} style={styles.repairCard}>
          <View style={styles.repairTopRow}>
            <Text style={styles.repairNumber}>{r.repairNumber}</Text>
            <View style={[styles.statusPill, { backgroundColor: statusBg(r.status) }]}>
              <Text style={[styles.statusText, { color: statusColor(r.status) }]}>{r.status.replace('_', ' ')}</Text>
            </View>
          </View>
          <Text style={styles.repairLine}>📱 {r.device}</Text>
          <Text style={styles.repairLine}>🔧 {r.problemDescription}</Text>
          <Text style={styles.repairDate}>{r.createdAt.toLocaleDateString()}</Text>
          {r.assignedToName && <Text style={styles.repairTech}>👷 {r.assignedToName}</Text>}
        </View>
      ))}
    </ScrollView>
  );
}

function ComingSoonTab({ icon, title, message }: { icon: any; title: string; message: string }) {
  return (
    <View style={styles.centerFill}>
      <View style={styles.comingSoonIcon}>
        <Icon name={icon} color={AppColors.primary} size={26} />
      </View>
      <Text style={styles.comingSoonTitle}>{title}</Text>
      <Text style={styles.comingSoonMessage}>{message}</Text>
    </View>
  );
}

function InfoRow({ icon, label, value, isLast }: { icon: any; label: string; value: string; isLast?: boolean }) {
  return (
    <View style={[styles.infoRow, !isLast && styles.infoRowBorder]}>
      <Icon name={icon} color={AppColors.textMuted} size={18} />
      <Text style={styles.infoLabel}>{label}</Text>
      <View style={{ flex: 1 }} />
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: AppColors.background },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 16, paddingTop: 50, backgroundColor: AppColors.surface,
  },
  headerActions: { flexDirection: 'row', alignItems: 'center' },
  profileRow: { flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: AppColors.surface },
  avatar: { width: 52, height: 52, borderRadius: 26, backgroundColor: AppColors.primarySoft, alignItems: 'center', justifyContent: 'center', marginRight: 14 },
  avatarText: { color: AppColors.primary, fontWeight: '700', fontSize: 16 },
  name: { color: AppColors.textPrimary, fontSize: 17, fontWeight: '600' },
  sub: { color: AppColors.textSecondary, fontSize: 12.5, marginTop: 2 },
  tabBar: { backgroundColor: AppColors.surface, borderBottomWidth: 1, borderColor: AppColors.border, flexGrow: 0 },
  tabItem: { paddingHorizontal: 16, paddingVertical: 12 },
  tabText: { color: AppColors.textSecondary, fontSize: 12.5, fontWeight: '500' },
  tabTextActive: { color: AppColors.primary, fontWeight: '600' },
  tabIndicator: { height: 2, backgroundColor: AppColors.primary, marginTop: 8, borderRadius: 1 },
  tabContent: { padding: 16, paddingBottom: 24 },
  sectionLabel: { color: AppColors.textSecondary, fontSize: 13, fontWeight: '600', marginBottom: 10 },
  infoCard: { backgroundColor: AppColors.surface, borderRadius: 16, borderWidth: 1, borderColor: AppColors.border },
  infoRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 13, gap: 12 },
  infoRowBorder: { borderBottomWidth: 1, borderColor: AppColors.border },
  infoLabel: { color: AppColors.textSecondary, fontSize: 13 },
  infoValue: { color: AppColors.textPrimary, fontSize: 13, fontWeight: '600' },
  noticeBox: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, backgroundColor: AppColors.infoSoft, borderRadius: 12, padding: 12, marginTop: 20 },
  noticeText: { flex: 1, color: AppColors.info, fontSize: 12, fontWeight: '500' },
  centerFill: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 },
  comingSoonIcon: { width: 60, height: 60, borderRadius: 30, backgroundColor: AppColors.primarySoft, alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  comingSoonTitle: { color: AppColors.textPrimary, fontSize: 14.5, fontWeight: '700' },
  comingSoonMessage: { color: AppColors.textSecondary, fontSize: 12.5, marginTop: 6, textAlign: 'center' },
  repairCard: { backgroundColor: AppColors.surface, borderRadius: 16, borderWidth: 1, borderColor: AppColors.border, padding: 14, marginBottom: 12 },
  repairTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  repairNumber: { color: AppColors.textPrimary, fontSize: 14, fontWeight: '700' },
  statusPill: { paddingHorizontal: 9, paddingVertical: 4, borderRadius: 20 },
  statusText: { fontSize: 10.5, fontWeight: '700' },
  repairLine: { color: AppColors.textSecondary, fontSize: 13, marginTop: 6 },
  repairDate: { color: AppColors.textMuted, fontSize: 11.5, marginTop: 6 },
  repairTech: { color: AppColors.textSecondary, fontSize: 12, fontWeight: '600', marginTop: 4 },
});
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Linking,
  Alert,
} from 'react-native';
import Icon from '@react-native-vector-icons/material-icons';
import { useNavigation, useRoute } from '@react-navigation/native';

import { CustomerRecord } from '../../services/CustomerService';
import { RepairService, RepairRecord } from '../../services/RepairService';
import { AppColors, AppShadows } from '../theme/AppColors';
import { FadeInUp, SpringTouch } from '../theme/Animations';

const TABS = ['Overview', 'Purchases', 'Repairs', 'EMI', 'Ledger', 'Documents'];

const PASTEL_PALETTES = [
  { bg: '#FEE2E2', text: '#EF4444' }, // Red/Pink
  { bg: '#E0E7FF', text: '#4F46E5' }, // Blue
  { bg: '#FEF3C7', text: '#D97706' }, // Amber
  { bg: '#EDE9FE', text: '#7C3AED' }, // Purple
  { bg: '#FCE7F3', text: '#DB2777' }, // Pink
  { bg: '#D1FAE5', text: '#059669' }, // Emerald
];

function getPastelColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash + name.charCodeAt(i)) % PASTEL_PALETTES.length;
  }
  return PASTEL_PALETTES[hash];
}

export default function CustomerDetailsScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const customer: CustomerRecord = route.params.customer;
  const [activeTab, setActiveTab] = useState(0);

  const initials = customer.name.trim()
    ? customer.name.trim().split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()
    : '?';

  const pastel = getPastelColor(customer.name);

  const handleCall = () => {
    if (!customer.phone) {
      Alert.alert('No Phone', 'No phone number is available for this customer.');
      return;
    }
    Linking.openURL(`tel:${customer.phone}`).catch(() => {
      Alert.alert('Error', 'Unable to place call.');
    });
  };

  return (
    <View style={styles.flex}>
      {/* TOP HEADER */}
      <View style={styles.header}>
        <SpringTouch
          onPress={() => navigation.goBack()}
          activeScale={0.92}
          style={styles.backBtn}
        >
          <Icon name="arrow-back" color={AppColors.textPrimary} size={24} />
        </SpringTouch>

        <Text style={styles.headerTitle}>Customer Details</Text>

        <View style={styles.headerActions}>
          <SpringTouch
            style={styles.headerActionBtn}
            onPress={handleCall}
            activeScale={0.92}
          >
            <Icon name="call" color={AppColors.primary} size={20} />
          </SpringTouch>
          <SpringTouch
            style={styles.headerActionBtn}
            onPress={() => navigation.navigate('EditCustomer', { customer })}
            activeScale={0.92}
          >
            <Icon name="edit" color={AppColors.textSecondary} size={20} />
          </SpringTouch>
        </View>
      </View>

      {/* PROFILE ROW */}
      <FadeInUp delay={30}>
        <View style={styles.profileRow}>
          <View style={[styles.avatar, { backgroundColor: pastel.bg }]}>
            <Text style={[styles.avatarText, { color: pastel.text }]}>{initials}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.name} numberOfLines={1}>{customer.name}</Text>
            <View style={styles.subRow}>
              <Icon name="call" color={AppColors.textMuted} size={14} />
              <Text style={styles.sub}>{customer.phone}</Text>
            </View>
            {customer.city ? (
              <View style={styles.subRow}>
                <Icon name="place" color={AppColors.textMuted} size={14} />
                <Text style={styles.sub}>{customer.city}</Text>
              </View>
            ) : null}
          </View>
        </View>
      </FadeInUp>

      {/* HORIZONTAL TAB BAR */}
      <View style={styles.tabBarContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabBarScroll}
        >
          {TABS.map((tab, i) => (
            <SpringTouch
              key={tab}
              style={[styles.tabItem, activeTab === i && styles.tabItemActive]}
              onPress={() => setActiveTab(i)}
              activeScale={0.96}
            >
              <Text style={[styles.tabText, activeTab === i && styles.tabTextActive]}>
                {tab}
              </Text>
              {activeTab === i && <View style={styles.tabIndicator} />}
            </SpringTouch>
          ))}
        </ScrollView>
      </View>

      {/* TAB CONTENT */}
      <View style={{ flex: 1 }}>
        {activeTab === 0 && <OverviewTab customer={customer} />}
        {activeTab === 1 && (
          <ComingSoonTab
            icon="shopping-bag"
            title="Purchase History"
            message="This will show once the sales table is connected"
          />
        )}
        {activeTab === 2 && <CustomerRepairsTab customer={customer} />}
        {activeTab === 3 && (
          <ComingSoonTab
            icon="credit-card"
            title="EMI Details"
            message="This will show once the EMI table is connected"
          />
        )}
        {activeTab === 4 && (
          <ComingSoonTab
            icon="receipt-long"
            title="Customer Ledger"
            message="This will show once the ledger table is connected"
          />
        )}
        {activeTab === 5 && (
          <ComingSoonTab
            icon="folder"
            title="Documents"
            message="This will show once document storage is connected"
          />
        )}
      </View>
    </View>
  );
}

function OverviewTab({ customer }: { customer: CustomerRecord }) {
  return (
    <ScrollView contentContainerStyle={styles.tabContent} showsVerticalScrollIndicator={false}>
      <FadeInUp delay={40}>
        <Text style={styles.sectionLabel}>Contact Information</Text>
        <View style={styles.infoCard}>
          <InfoRow icon="call" label="Mobile" value={customer.phone} />
          {customer.alternatePhone ? (
            <InfoRow icon="phone-forwarded" label="Alternate" value={customer.alternatePhone} />
          ) : null}
          {customer.email ? (
            <InfoRow icon="mail-outline" label="Email" value={customer.email} />
          ) : null}
          {customer.address ? (
            <InfoRow icon="location-on" label="Address" value={customer.address} />
          ) : null}
          {customer.city ? (
            <InfoRow icon="location-city" label="City" value={customer.city} />
          ) : null}
          <InfoRow
            icon="receipt-long"
            label="GST Number"
            value={customer.gstNumber ?? 'Not provided'}
            isLast
          />
        </View>
      </FadeInUp>

      <FadeInUp delay={100}>
        <View style={styles.noticeBox}>
          <View style={styles.noticeIconWrap}>
            <Icon name="info-outline" color={AppColors.primary} size={18} />
          </View>
          <Text style={styles.noticeText}>
            Purchase, EMI and ledger totals will automatically appear here once records are created.
          </Text>
        </View>
      </FadeInUp>
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
      default: return AppColors.primary;
    }
  };

  const statusBg = (status: string) => {
    switch (status) {
      case 'IN_PROGRESS': return AppColors.warningSoft;
      case 'COMPLETED': return AppColors.successSoft;
      case 'REJECTED': return AppColors.dangerSoft;
      default: return AppColors.primarySoft;
    }
  };

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
        <Text style={{ color: AppColors.danger, fontSize: 13, textAlign: 'center' }}>{error}</Text>
      </View>
    );
  }

  if (repairs.length === 0) {
    return (
      <View style={styles.centerFill}>
        <View style={styles.emptyIconWrap}>
          <Icon name="build" color={AppColors.textMuted} size={32} />
        </View>
        <Text style={styles.emptyTitle}>No repairs found</Text>
        <Text style={styles.emptySubtitle}>No repair tickets recorded for this customer yet.</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.tabContent} showsVerticalScrollIndicator={false}>
      {repairs.map((r, idx) => (
        <FadeInUp key={r.id} delay={idx * 45}>
          <SpringTouch activeScale={0.97}>
            <View style={styles.repairCard}>
              <View style={styles.repairTopRow}>
                <Text style={styles.repairNumber}>{r.repairNumber}</Text>
                <View style={[styles.statusPill, { backgroundColor: statusBg(r.status) }]}>
                  <Text style={[styles.statusText, { color: statusColor(r.status) }]}>
                    {r.status.replace('_', ' ')}
                  </Text>
                </View>
              </View>
              <View style={styles.repairLineRow}>
                <Icon name="devices" color={AppColors.textMuted} size={15} />
                <Text style={styles.repairLine}>{r.device}</Text>
              </View>
              <View style={styles.repairLineRow}>
                <Icon name="warning" color={AppColors.warning} size={15} />
                <Text style={styles.repairLine}>{r.problemDescription}</Text>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, paddingTop: 8, borderTopWidth: 1, borderColor: AppColors.border }}>
                <Text style={styles.repairDate}>{new Date(r.createdAt).toLocaleDateString()}</Text>
                {r.assignedToName && <Text style={styles.repairTech}>Tech: {r.assignedToName}</Text>}
              </View>
            </View>
          </SpringTouch>
        </FadeInUp>
      ))}
    </ScrollView>
  );
}

function ComingSoonTab({ icon, title, message }: { icon: any; title: string; message: string }) {
  return (
    <View style={styles.centerFill}>
      <View style={styles.comingSoonIcon}>
        <Icon name={icon} color={AppColors.primary} size={28} />
      </View>
      <Text style={styles.comingSoonTitle}>{title}</Text>
      <Text style={styles.comingSoonMessage}>{message}</Text>
    </View>
  );
}

function InfoRow({
  icon,
  label,
  value,
  isLast,
}: {
  icon: any;
  label: string;
  value: string;
  isLast?: boolean;
}) {
  return (
    <View style={[styles.infoRow, !isLast && styles.infoRowBorder]}>
      <View style={styles.infoIconWrap}>
        <Icon name={icon} color={AppColors.primary} size={16} />
      </View>
      <Text style={styles.infoLabel}>{label}</Text>
      <View style={{ flex: 1 }} />
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: AppColors.background,
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
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: AppColors.textPrimary,
    letterSpacing: -0.3,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerActionBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: AppColors.border,
    ...AppShadows.subtle,
  },

  /* PROFILE ROW */
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 16,
    marginHorizontal: 16,
    marginBottom: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: AppColors.border,
    ...AppShadows.card,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  avatarText: {
    fontWeight: '800',
    fontSize: 18,
  },
  name: {
    color: AppColors.textPrimary,
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  subRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 3,
  },
  sub: {
    color: AppColors.textSecondary,
    fontSize: 12.5,
    fontWeight: '500',
  },

  /* TAB BAR */
  tabBarContainer: {
    backgroundColor: AppColors.background,
    borderBottomWidth: 1,
    borderColor: AppColors.border,
  },
  tabBarScroll: {
    paddingHorizontal: 12,
  },
  tabItem: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    alignItems: 'center',
    position: 'relative',
  },
  tabItemActive: {},
  tabText: {
    color: AppColors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
  },
  tabTextActive: {
    color: AppColors.primary,
    fontWeight: '700',
  },
  tabIndicator: {
    position: 'absolute',
    bottom: 0,
    left: 14,
    right: 14,
    height: 3,
    backgroundColor: AppColors.primary,
    borderTopLeftRadius: 3,
    borderTopRightRadius: 3,
  },

  /* CONTENT */
  tabContent: {
    padding: 16,
    paddingBottom: 32,
  },
  sectionLabel: {
    color: AppColors.textSecondary,
    fontSize: 11.5,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 10,
    marginLeft: 4,
  },
  infoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: AppColors.border,
    ...AppShadows.card,
    overflow: 'hidden',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  infoRowBorder: {
    borderBottomWidth: 1,
    borderColor: AppColors.border,
  },
  infoIconWrap: {
    width: 30,
    height: 30,
    borderRadius: 9,
    backgroundColor: AppColors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoLabel: {
    color: AppColors.textSecondary,
    fontSize: 13,
    fontWeight: '500',
  },
  infoValue: {
    color: AppColors.textPrimary,
    fontSize: 13.5,
    fontWeight: '700',
  },
  noticeBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: AppColors.primarySoft,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: `${AppColors.primary}20`,
    padding: 14,
    marginTop: 18,
  },
  noticeIconWrap: {
    marginTop: 2,
  },
  noticeText: {
    flex: 1,
    color: AppColors.textPrimary,
    fontSize: 12.5,
    fontWeight: '500',
    lineHeight: 18,
  },

  /* EMPTY & PLACEHOLDER */
  centerFill: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  comingSoonIcon: {
    width: 60,
    height: 60,
    borderRadius: 20,
    backgroundColor: AppColors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  comingSoonTitle: {
    color: AppColors.textPrimary,
    fontSize: 16,
    fontWeight: '800',
  },
  comingSoonMessage: {
    color: AppColors.textSecondary,
    fontSize: 13,
    marginTop: 6,
    textAlign: 'center',
    lineHeight: 18,
  },
  emptyIconWrap: {
    width: 60,
    height: 60,
    borderRadius: 20,
    backgroundColor: AppColors.surfaceSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  emptyTitle: {
    color: AppColors.textPrimary,
    fontSize: 16,
    fontWeight: '800',
  },
  emptySubtitle: {
    color: AppColors.textSecondary,
    fontSize: 13,
    marginTop: 4,
    textAlign: 'center',
  },

  /* REPAIR CARD */
  repairCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: AppColors.border,
    padding: 16,
    marginBottom: 12,
    ...AppShadows.card,
  },
  repairTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  repairNumber: {
    color: AppColors.textPrimary,
    fontSize: 14,
    fontWeight: '800',
  },
  statusPill: {
    paddingHorizontal: 9,
    paddingVertical: 3.5,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  repairLineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  repairLine: {
    color: AppColors.textSecondary,
    fontSize: 13,
    fontWeight: '500',
  },
  repairDate: {
    color: AppColors.textMuted,
    fontSize: 11.5,
  },
  repairTech: {
    color: AppColors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
});
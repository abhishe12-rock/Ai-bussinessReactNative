import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import Icon from '@react-native-vector-icons/material-icons';
import { useNavigation, useRoute } from '@react-navigation/native';

import { AppColors } from '../theme/AppColors';

type Params = {
  repairId: string; device: string; problem: string; status: string;
  cost: number; createdDate: string; completedDate?: string;
};

export default function RepairDetailsScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { repairId, device, problem, status, cost, createdDate, completedDate } = route.params as Params;
  const done = status === 'Completed';

  return (
    <View style={styles.flex}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" color={AppColors.textPrimary} size={22} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{repairId}</Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.card}>
          <View style={styles.deviceIcon}>
            <Icon name="build" color={AppColors.teal} size={21} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.deviceName}>{device}</Text>
            <Text style={styles.problemText}>{problem}</Text>
          </View>
          <View style={[styles.statusPill, { backgroundColor: done ? AppColors.successSoft : AppColors.warningSoft }]}>
            <Text style={[styles.statusText, { color: done ? AppColors.success : AppColors.warning }]}>{status}</Text>
          </View>
        </View>

        <View style={styles.statsRow}>
          <StatBox label="Repair cost" value={`₹${cost.toFixed(0)}`} color={AppColors.primary} bg={AppColors.primarySoft} />
          <StatBox label="Status" value={status} color={done ? AppColors.success : AppColors.warning} bg={done ? AppColors.successSoft : AppColors.warningSoft} />
        </View>

        <Text style={styles.sectionLabel}>Repair timeline</Text>
        <TimelineStep title="Received" subtitle={createdDate} isDone />
        <TimelineStep title="In progress" subtitle="Diagnosed & repair started" isDone />
        <TimelineStep title="Completed" subtitle={completedDate ?? 'Pending'} isDone={done} isLast />
      </ScrollView>
    </View>
  );
}

function StatBox({ label, value, color, bg }: { label: string; value: string; color: string; bg: string }) {
  return (
    <View style={[styles.statBox, { backgroundColor: bg }]}>
      <Text style={[styles.statLabel, { color }]}>{label}</Text>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
    </View>
  );
}

function TimelineStep({ title, subtitle, isDone, isLast }: { title: string; subtitle: string; isDone: boolean; isLast?: boolean }) {
  return (
    <View style={styles.timelineRow}>
      <View style={styles.timelineDotCol}>
        <View style={[styles.dot, isDone ? styles.dotDone : styles.dotPending]}>
          {isDone && <Icon name="check" color="#fff" size={14} />}
        </View>
        {!isLast && <View style={[styles.timelineLine, { backgroundColor: isDone ? AppColors.success + '66' : AppColors.border }]} />}
      </View>
      <View style={{ flex: 1, paddingBottom: isLast ? 0 : 22 }}>
        <Text style={[styles.timelineTitle, { color: isDone ? AppColors.textPrimary : AppColors.textSecondary }]}>{title}</Text>
        <Text style={styles.timelineSubtitle}>{subtitle}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: AppColors.background },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 16, backgroundColor: AppColors.surface, borderBottomWidth: 1, borderColor: AppColors.border,
  },
  headerTitle: { fontSize: 17, fontWeight: '700', color: AppColors.textPrimary },
  content: { padding: 16, paddingBottom: 24 },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: AppColors.surface, borderRadius: 16, borderWidth: 1, borderColor: AppColors.border, padding: 14 },
  deviceIcon: { width: 44, height: 44, borderRadius: 12, backgroundColor: AppColors.tealSoft, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  deviceName: { color: AppColors.textPrimary, fontSize: 15, fontWeight: '700' },
  problemText: { color: AppColors.textSecondary, fontSize: 12, marginTop: 2 },
  statusPill: { paddingHorizontal: 9, paddingVertical: 4, borderRadius: 20 },
  statusText: { fontSize: 10.5, fontWeight: '700' },
  statsRow: { flexDirection: 'row', gap: 10, marginTop: 20 },
  statBox: { flex: 1, borderRadius: 14, padding: 13 },
  statLabel: { fontSize: 11, opacity: 0.85 },
  statValue: { fontSize: 15, fontWeight: '800', marginTop: 5 },
  sectionLabel: { color: AppColors.textSecondary, fontSize: 13, fontWeight: '600', marginTop: 20, marginBottom: 12 },
  timelineRow: { flexDirection: 'row', alignItems: 'flex-start' },
  timelineDotCol: { alignItems: 'center', marginRight: 12 },
  dot: { width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center', borderWidth: 2 },
  dotDone: { backgroundColor: AppColors.success, borderColor: AppColors.success },
  dotPending: { backgroundColor: AppColors.surfaceSoft, borderColor: AppColors.border },
  timelineLine: { width: 2, flex: 1, minHeight: 22 },
  timelineTitle: { fontSize: 13.5, fontWeight: '700' },
  timelineSubtitle: { color: AppColors.textSecondary, fontSize: 12, marginTop: 2 },
});
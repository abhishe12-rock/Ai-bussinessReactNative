import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import Icon from '@react-native-vector-icons/material-icons';
import { useNavigation, useRoute } from '@react-navigation/native';

import { AppColors } from '../theme/AppColors';

type Params = {
  loanAmount: number; monthlyEmi: number; paidCount: number;
  pendingCount: number; nextDueDate: string; outstanding: number;
};

const MONTHS = ['March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December', 'January', 'February'];

export default function EmiPaymentHistoryScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { loanAmount, monthlyEmi, paidCount, pendingCount, nextDueDate, outstanding } = route.params as Params;

  const total = paidCount + pendingCount;
  const schedule = Array.from({ length: total }, (_, i) => ({
    month: MONTHS[i % 12],
    amount: monthlyEmi,
    status: i < paidCount ? 'Paid' : 'Pending',
  }));

  return (
    <View style={styles.flex}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Icon name="chevron-left" color={AppColors.primary} size={30} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>EMI Schedule</Text>
        <View style={{ width: 30 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.gradientCard}>
          <Text style={styles.loanText}>Total Facility: ₹{loanAmount.toFixed(0)}</Text>
          <Text style={styles.emiText}>Monthly EMI: ₹{monthlyEmi.toFixed(0)}</Text>
          <View style={styles.glassRow}>
            <GlassStat label="Paid Installments" value={`${paidCount}`} />
            <GlassStat label="Pending Installments" value={`${pendingCount}`} />
          </View>
        </View>

        <View style={styles.statsRow}>
          <StatBox label="Next due date" value={nextDueDate} color={AppColors.warning} bg={AppColors.warningSoft} />
          <StatBox label="Outstanding" value={`₹${outstanding.toFixed(0)}`} color={AppColors.danger} bg={AppColors.dangerSoft} />
        </View>

        <Text style={styles.sectionLabel}>Payment schedule & history</Text>
        <View style={styles.infoCard}>
          {schedule.map((m, i) => {
            const paid = m.status === 'Paid';
            return (
              <View key={i} style={[styles.row, i !== schedule.length - 1 && styles.rowBorder]}>
                <Text style={styles.monthText}>{m.month}</Text>
                <View style={{ flex: 1 }} />
                <Text style={styles.amountText}>₹{m.amount.toFixed(0)}</Text>
                <View style={[styles.statusPill, { backgroundColor: paid ? AppColors.successSoft : AppColors.dangerSoft }]}>
                  <Text style={[styles.statusText, { color: paid ? AppColors.success : AppColors.danger }]}>{m.status}</Text>
                </View>
              </View>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

function GlassStat({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ flex: 1 }}>
      <Text style={styles.glassLabel}>{label}</Text>
      <Text style={styles.glassValue}>{value}</Text>
    </View>
  );
}

function StatBox({ label, value, color, bg }: { label: string; value: string; color: string; bg: string }) {
  return (
    <View style={[styles.statBox, { backgroundColor: bg, borderColor: `${color}20` }]}>
      <Text style={[styles.statLabel, { color }]}>{label}</Text>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: AppColors.background },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 14,
    backgroundColor: AppColors.surface,
    borderBottomWidth: 1,
    borderColor: AppColors.border,
  },
  headerTitle: { fontSize: 17, fontWeight: '700', color: AppColors.textPrimary, letterSpacing: -0.3 },
  content: { padding: 16, paddingBottom: 24 },
  gradientCard: {
    backgroundColor: AppColors.primary,
    borderRadius: 14,
    padding: 18,
    shadowColor: AppColors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4,
  },
  loanText: { color: '#fff', fontSize: 15, fontWeight: '700', letterSpacing: -0.2 },
  emiText: { color: 'rgba(255, 255, 255, 0.85)', fontSize: 12.5, marginTop: 4 },
  glassRow: { flexDirection: 'row', marginTop: 16, gap: 12 },
  glassLabel: { color: 'rgba(255, 255, 255, 0.8)', fontSize: 11, fontWeight: '500' },
  glassValue: { color: '#fff', fontSize: 18, fontWeight: '800', marginTop: 2, letterSpacing: -0.3 },
  statsRow: { flexDirection: 'row', gap: 10, marginTop: 14 },
  statBox: { flex: 1, borderRadius: 12, borderWidth: 1, padding: 12 },
  statLabel: { fontSize: 11, fontWeight: '600' },
  statValue: { fontSize: 15, fontWeight: '800', marginTop: 4, letterSpacing: -0.3 },
  sectionLabel: { color: AppColors.textSecondary, fontSize: 11.5, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.6, marginTop: 22, marginBottom: 10 },
  infoCard: {
    backgroundColor: AppColors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: AppColors.border,
    shadowColor: AppColors.textPrimary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 12, gap: 10 },
  rowBorder: { borderBottomWidth: 1, borderColor: AppColors.border },
  monthText: { color: AppColors.textPrimary, fontSize: 13, fontWeight: '600' },
  amountText: { color: AppColors.textSecondary, fontSize: 13, fontWeight: '500' },
  statusPill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  statusText: { fontSize: 10.5, fontWeight: '700' },
});
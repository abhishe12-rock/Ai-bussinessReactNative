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
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" color={AppColors.textPrimary} size={22} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>EMI details</Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.gradientCard}>
          <Text style={styles.loanText}>Loan amount: ₹{loanAmount.toFixed(0)}</Text>
          <Text style={styles.emiText}>EMI: ₹{monthlyEmi.toFixed(0)}/month</Text>
          <View style={styles.glassRow}>
            <GlassStat label="Paid" value={`${paidCount}`} />
            <GlassStat label="Pending" value={`${pendingCount}`} />
          </View>
        </View>

        <View style={styles.statsRow}>
          <StatBox label="Next due date" value={nextDueDate} color={AppColors.warning} bg={AppColors.warningSoft} />
          <StatBox label="Outstanding" value={`₹${outstanding.toFixed(0)}`} color={AppColors.danger} bg={AppColors.dangerSoft} />
        </View>

        <Text style={styles.sectionLabel}>Payment history</Text>
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
    <View style={[styles.statBox, { backgroundColor: bg }]}>
      <Text style={[styles.statLabel, { color }]}>{label}</Text>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
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
  gradientCard: { backgroundColor: AppColors.primary, borderRadius: 18, padding: 16 },
  loanText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  emiText: { color: '#ffffffd9', fontSize: 12.5, marginTop: 4 },
  glassRow: { flexDirection: 'row', marginTop: 14 },
  glassLabel: { color: '#ffffffcc', fontSize: 11 },
  glassValue: { color: '#fff', fontSize: 18, fontWeight: '800', marginTop: 2 },
  statsRow: { flexDirection: 'row', gap: 10, marginTop: 16 },
  statBox: { flex: 1, borderRadius: 14, padding: 13 },
  statLabel: { fontSize: 11, opacity: 0.85 },
  statValue: { fontSize: 15, fontWeight: '800', marginTop: 5 },
  sectionLabel: { color: AppColors.textSecondary, fontSize: 13, fontWeight: '600', marginTop: 22, marginBottom: 10 },
  infoCard: { backgroundColor: AppColors.surface, borderRadius: 16, borderWidth: 1, borderColor: AppColors.border },
  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 13, gap: 10 },
  rowBorder: { borderBottomWidth: 1, borderColor: AppColors.border },
  monthText: { color: AppColors.textPrimary, fontSize: 13.5, fontWeight: '600' },
  amountText: { color: AppColors.textSecondary, fontSize: 13 },
  statusPill: { paddingHorizontal: 9, paddingVertical: 4, borderRadius: 20 },
  statusText: { fontSize: 10.5, fontWeight: '700' },
});
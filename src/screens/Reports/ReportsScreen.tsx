import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Dimensions,
} from 'react-native';
import Icon from '@react-native-vector-icons/material-icons';
import { useNavigation } from '@react-navigation/native';
import Svg, {
  Defs,
  LinearGradient as SvgLinearGradient,
  Stop,
  Rect,
  Line,
  Path,
  Circle,
} from 'react-native-svg';

import { AppColors, AppShadows, AppRadius } from '../theme/AppColors';
import { BottomNavBar } from '../../components/BottomNavBar';
import { FadeInUp, FloatingGeometricOrb, SpringTouch } from '../theme/Animations';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type ReportTab = 'Overview' | 'Sales' | 'Expenses' | 'Taxes';

export default function ReportsScreen() {
  const navigation = useNavigation<any>();
  const [activeTab, setActiveTab] = useState<ReportTab>('Overview');
  const [selectedRange, setSelectedRange] = useState('This Month');

  const chartWidth = Math.min(SCREEN_WIDTH - 64, 380);
  const chartHeight = 120;

  const handleExport = (type: 'PDF' | 'Excel') => {
    Alert.alert(
      `Export ${type}`,
      `Financial ${type} report for ${selectedRange} has been generated and queued for download.`,
      [{ text: 'OK' }],
    );
  };

  return (
    <View style={styles.flex}>
      {/* Background ambient orbs */}
      <FloatingGeometricOrb
        size={220}
        top={-50}
        right={-50}
        color="rgba(91, 77, 248, 0.08)"
        duration={5500}
        floatDistance={12}
      />
      <FloatingGeometricOrb
        size={150}
        bottom={100}
        left={-40}
        color="rgba(16, 185, 129, 0.06)"
        duration={4500}
        floatDistance={10}
      />

      {/* HEADER */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <SpringTouch
            onPress={() => navigation.goBack()}
            activeScale={0.88}
            style={styles.backBtn}
          >
            <Icon name="arrow-back-ios" color={AppColors.textPrimary} size={20} />
          </SpringTouch>
          <Text style={styles.headerTitle}>Reports & Analytics</Text>
        </View>

        <View style={styles.headerRight}>
          <SpringTouch
            onPress={() => {
              Alert.alert('Select Period', '', [
                { text: 'This Week', onPress: () => setSelectedRange('This Week') },
                { text: 'This Month', onPress: () => setSelectedRange('This Month') },
                { text: 'This Quarter', onPress: () => setSelectedRange('This Quarter') },
                { text: 'This Year', onPress: () => setSelectedRange('This Year') },
              ]);
            }}
            activeScale={0.92}
          >
            <View style={styles.rangeBtn}>
              <Text style={styles.rangeBtnText}>{selectedRange}</Text>
              <Icon name="keyboard-arrow-down" size={16} color={AppColors.textSecondary} />
            </View>
          </SpringTouch>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* SEGMENTED TABS */}
        <View style={styles.tabsContainer}>
          {(['Overview', 'Sales', 'Expenses', 'Taxes'] as ReportTab[]).map((tab) => {
            const isActive = activeTab === tab;
            return (
              <SpringTouch
                key={tab}
                onPress={() => setActiveTab(tab)}
                style={[styles.tabButton, isActive && styles.tabButtonActive]}
                activeScale={0.96}
              >
                <Text
                  style={[
                    styles.tabButtonText,
                    isActive && styles.tabButtonTextActive,
                  ]}
                >
                  {tab}
                </Text>
              </SpringTouch>
            );
          })}
        </View>

        {/* HERO CARD: NET PROFIT BANNER */}
        <FadeInUp delay={40}>
          <View style={styles.heroBanner}>
            <Svg style={StyleSheet.absoluteFill} width="100%" height="100%">
              <Defs>
                <SvgLinearGradient id="repGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <Stop offset="0%" stopColor="#5B4DF8" />
                  <Stop offset="100%" stopColor="#7C3AED" />
                </SvgLinearGradient>
              </Defs>
              <Rect width="100%" height="100%" fill="url(#repGrad)" />
            </Svg>

            {/* Geometric Floating Orbs */}
            <FloatingGeometricOrb
              size={130}
              top={-35}
              right={-25}
              color="rgba(255, 255, 255, 0.12)"
              duration={4600}
              floatDistance={10}
            />
            <FloatingGeometricOrb
              size={75}
              bottom={-25}
              left={-10}
              color="rgba(255, 255, 255, 0.08)"
              duration={3800}
              floatDistance={7}
            />

            <View style={styles.heroInner}>
              <View style={styles.heroTopRow}>
                <Text style={styles.heroLabel}>NET BUSINESS PROFIT</Text>
                <View style={styles.deltaPill}>
                  <Icon name="trending-up" size={14} color="#10B981" />
                  <Text style={styles.deltaText}>+14.8%</Text>
                </View>
              </View>

              <Text style={styles.heroAmount}>₹1,88,660</Text>
              <Text style={styles.heroSub}>
                Compared to previous {selectedRange.toLowerCase()} period
              </Text>
            </View>
          </View>
        </FadeInUp>

        {/* 2x2 STATS BREAKDOWN GRID */}
        <View style={styles.statsGrid}>
          <FadeInUp delay={100} style={styles.statCardContainer}>
            <SpringTouch style={styles.statCard} activeScale={0.96}>
              <View style={[styles.statIconWrap, { backgroundColor: '#ECFDF5' }]}>
                <Icon name="payments" size={18} color="#10B981" />
              </View>
              <Text style={styles.statCardLabel}>Gross Revenue</Text>
              <Text style={styles.statCardValue}>₹2,45,000</Text>
              <Text style={[styles.statCardSub, { color: '#10B981' }]}>+12.5% vs avg</Text>
            </SpringTouch>
          </FadeInUp>

          <FadeInUp delay={150} style={styles.statCardContainer}>
            <SpringTouch style={styles.statCard} activeScale={0.96}>
              <View style={[styles.statIconWrap, { backgroundColor: '#FEF2F2' }]}>
                <Icon name="receipt-long" size={18} color="#EF4444" />
              </View>
              <Text style={styles.statCardLabel}>Total Expenses</Text>
              <Text style={styles.statCardValue}>₹56,340</Text>
              <Text style={[styles.statCardSub, { color: '#EF4444' }]}>+3.2% vs avg</Text>
            </SpringTouch>
          </FadeInUp>

          <FadeInUp delay={200} style={styles.statCardContainer}>
            <SpringTouch style={styles.statCard} activeScale={0.96}>
              <View style={[styles.statIconWrap, { backgroundColor: '#EFF6FF' }]}>
                <Icon name="description" size={18} color="#3B82F6" />
              </View>
              <Text style={styles.statCardLabel}>Invoices Cleared</Text>
              <Text style={styles.statCardValue}>245</Text>
              <Text style={[styles.statCardSub, { color: '#3B82F6' }]}>98% settlement</Text>
            </SpringTouch>
          </FadeInUp>

          <FadeInUp delay={250} style={styles.statCardContainer}>
            <SpringTouch style={styles.statCard} activeScale={0.96}>
              <View style={[styles.statIconWrap, { backgroundColor: '#FFFBEB' }]}>
                <Icon name="account-balance" size={18} color="#F59E0B" />
              </View>
              <Text style={styles.statCardLabel}>Tax Liability</Text>
              <Text style={styles.statCardValue}>₹12,450</Text>
              <Text style={[styles.statCardSub, { color: '#F59E0B' }]}>GST Computed</Text>
            </SpringTouch>
          </FadeInUp>
        </View>

        {/* REVENUE DYNAMICS CHART CARD */}
        <FadeInUp delay={280}>
          <View style={styles.chartCard}>
            <View style={styles.chartHeaderRow}>
              <Text style={styles.chartTitle}>Revenue Dynamics</Text>
              <Text style={styles.chartLegend}>6 Months Trend</Text>
            </View>

            {/* SVG Smooth Curve with Grid */}
            <Svg width={chartWidth} height={chartHeight} style={styles.svgChart}>
              <Defs>
                <SvgLinearGradient id="repAreaGrad" x1="0%" y1="0%" x2="0%" y2="1">
                  <Stop offset="0%" stopColor="#5B4DF8" stopOpacity="0.22" />
                  <Stop offset="100%" stopColor="#5B4DF8" stopOpacity="0.0" />
                </SvgLinearGradient>
              </Defs>

              {/* Guide lines */}
              <Line x1="0" y1="25" x2={chartWidth} y2="25" stroke="#F1F5F9" strokeWidth="1" strokeDasharray="4 4" />
              <Line x1="0" y1="65" x2={chartWidth} y2="65" stroke="#F1F5F9" strokeWidth="1" strokeDasharray="4 4" />
              <Line x1="0" y1="105" x2={chartWidth} y2="105" stroke="#F1F5F9" strokeWidth="1" />

              {/* Area Fill */}
              <Path
                d={`M 0 90 C ${chartWidth * 0.2} 80, ${chartWidth * 0.35} 50, ${chartWidth * 0.5} 60 C ${chartWidth * 0.65} 70, ${chartWidth * 0.8} 20, ${chartWidth} 30 L ${chartWidth} 105 L 0 105 Z`}
                fill="url(#repAreaGrad)"
              />

              {/* Line Curve */}
              <Path
                d={`M 0 90 C ${chartWidth * 0.2} 80, ${chartWidth * 0.35} 50, ${chartWidth * 0.5} 60 C ${chartWidth * 0.65} 70, ${chartWidth * 0.8} 20, ${chartWidth} 30`}
                stroke="#5B4DF8"
                strokeWidth="3"
                fill="none"
                strokeLinecap="round"
              />

              <Circle cx={chartWidth * 0.8} cy="20" r="5" fill="#FFFFFF" stroke="#5B4DF8" strokeWidth="3" />
            </Svg>

            <View style={styles.chartLabelsRow}>
              {['May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct'].map((month, i) => (
                <Text
                  key={month}
                  style={[
                    styles.chartMonthText,
                    i === 5 && styles.chartMonthTextActive,
                  ]}
                >
                  {month}
                </Text>
              ))}
            </View>
          </View>
        </FadeInUp>

        {/* EXPORT ACTION BUTTONS */}
        <FadeInUp delay={340}>
          <View style={styles.exportSection}>
            <Text style={styles.exportSectionTitle}>Statements & Downloads</Text>
            <View style={styles.exportButtonsRow}>
              <SpringTouch
                style={styles.exportBtnWrapper}
                onPress={() => handleExport('PDF')}
                activeScale={0.97}
              >
                <View style={styles.exportBtn}>
                  <View style={[styles.exportIconBox, { backgroundColor: '#FEF2F2' }]}>
                    <Icon name="picture-as-pdf" size={20} color="#EF4444" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.exportBtnTitle}>Download PDF</Text>
                    <Text style={styles.exportBtnSub}>Formatted for printing</Text>
                  </View>
                  <Icon name="file-download" size={20} color={AppColors.textMuted} />
                </View>
              </SpringTouch>

              <SpringTouch
                style={styles.exportBtnWrapper}
                onPress={() => handleExport('Excel')}
                activeScale={0.97}
              >
                <View style={styles.exportBtn}>
                  <View style={[styles.exportIconBox, { backgroundColor: '#ECFDF5' }]}>
                    <Icon name="table-chart" size={20} color="#10B981" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.exportBtnTitle}>Export Excel</Text>
                    <Text style={styles.exportBtnSub}>Raw rows with formulas</Text>
                  </View>
                  <Icon name="file-download" size={20} color={AppColors.textMuted} />
                </View>
              </SpringTouch>
            </View>
          </View>
        </FadeInUp>

        <View style={{ height: 90 }} />
      </ScrollView>

      {/* FLOATING BOTTOM NAVIGATION BAR */}
      <BottomNavBar activeTab="Reports" />
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
  rangeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: AppColors.surface,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: AppColors.border,
    ...AppShadows.subtle,
  },
  rangeBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: AppColors.textSecondary,
  },

  /* CONTENT */
  content: {
    paddingHorizontal: 16,
    paddingTop: 4,
  },

  /* SEGMENTED TABS */
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: AppColors.surface,
    borderRadius: 24,
    padding: 4,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: AppColors.border,
    ...AppShadows.subtle,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
  },
  tabButtonActive: {
    backgroundColor: AppColors.primary,
    ...AppShadows.glow,
  },
  tabButtonText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: AppColors.textSecondary,
  },
  tabButtonTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },

  /* HERO BANNER */
  heroBanner: {
    borderRadius: 22,
    overflow: 'hidden',
    position: 'relative',
    padding: 20,
    marginBottom: 16,
    backgroundColor: '#5B4DF8',
    ...AppShadows.glow,
  },
  decoCircle1: {
    position: 'absolute',
    right: -25,
    top: -30,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
  },
  decoCircle2: {
    position: 'absolute',
    right: 60,
    bottom: -30,
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  heroInner: {
    position: 'relative',
    zIndex: 2,
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  heroLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: 'rgba(255, 255, 255, 0.85)',
    letterSpacing: 0.6,
  },
  deltaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  deltaText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#10B981',
  },
  heroAmount: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.8,
    marginBottom: 4,
  },
  heroSub: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '500',
  },

  /* 2x2 STATS GRID */
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -5,
    marginBottom: 16,
  },
  statCardContainer: {
    width: (SCREEN_WIDTH - 42) / 2,
    marginHorizontal: 5,
    marginBottom: 10,
  },
  statCard: {
    width: '100%',
    backgroundColor: AppColors.surface,
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: AppColors.border,
    ...AppShadows.subtle,
  },
  statIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  statCardLabel: {
    fontSize: 11.5,
    fontWeight: '600',
    color: AppColors.textSecondary,
    marginBottom: 2,
  },
  statCardValue: {
    fontSize: 18,
    fontWeight: '800',
    color: AppColors.textPrimary,
    letterSpacing: -0.3,
    marginBottom: 2,
  },
  statCardSub: {
    fontSize: 10.5,
    fontWeight: '700',
  },

  /* CHART CARD */
  chartCard: {
    backgroundColor: AppColors.surface,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: AppColors.border,
    marginBottom: 20,
    ...AppShadows.card,
  },
  chartHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  chartTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: AppColors.textPrimary,
    letterSpacing: -0.3,
  },
  chartLegend: {
    fontSize: 11.5,
    fontWeight: '600',
    color: AppColors.primary,
  },
  svgChart: {
    alignSelf: 'center',
    marginTop: 6,
  },
  chartLabelsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    marginTop: 8,
  },
  chartMonthText: {
    fontSize: 11.5,
    fontWeight: '500',
    color: AppColors.textMuted,
  },
  chartMonthTextActive: {
    color: AppColors.primary,
    fontWeight: '700',
  },

  /* EXPORT SECTION */
  exportSection: {
    marginBottom: 10,
  },
  exportSectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: AppColors.textPrimary,
    letterSpacing: -0.3,
    marginBottom: 10,
  },
  exportButtonsRow: {
    gap: 10,
  },
  exportBtnWrapper: {
    width: '100%',
  },
  exportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: AppColors.surface,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: AppColors.border,
    ...AppShadows.subtle,
  },
  exportIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  exportBtnTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: AppColors.textPrimary,
    marginBottom: 2,
  },
  exportBtnSub: {
    fontSize: 11.5,
    fontWeight: '500',
    color: AppColors.textMuted,
  },
});

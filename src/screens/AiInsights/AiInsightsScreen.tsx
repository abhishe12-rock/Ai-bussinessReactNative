import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ScrollView, Platform, ActivityIndicator } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { DrawerActions, useNavigation } from '@react-navigation/native';
import { AppColors } from '../theme/AppColors';
import { AiService } from '../../services/AiService';

export interface InsightData {
  id: string;
  title: string;
  preview: string;
  type: 'critical' | 'warning' | 'attention' | 'positive';
  actionLabel: string;
  targetScreen: string;
  icon: string;
  color: string;
  bg: string;
}

type Timeframe = 'Today' | 'This Week' | 'This Month';

export default function AiInsightsScreen() {
  const navigation = useNavigation<any>();
  const [insights, setInsights] = useState<InsightData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [timeframe, setTimeframe] = useState<Timeframe>('This Month');

  useEffect(() => {
    fetchInsights(timeframe);
  }, [timeframe]);

  const fetchInsights = async (tf: Timeframe = timeframe) => {
    setIsLoading(true);
    try {
      const businessContext = await AiService.getBusinessContext();
      const response = await AiService.promptGemini(
        `You are an AI Business Analyst. Based on the store's LIVE business data context for the period "${tf}", generate an array of exactly 4 insight objects.
        Return ONLY valid JSON. No markdown code blocks.
        Format:
        [
          {
            "id": "1",
            "title": "String (Short headline)",
            "preview": "String (1-2 sentences with exact numbers from context)",
            "type": "critical" | "warning" | "attention" | "positive",
            "actionLabel": "String (e.g. 'View Customers', 'View Inventory', 'View Sales', 'View Repairs', 'Analyze Expenses')",
            "targetScreen": "CustomerList" | "LowStockAlert" | "Invoices" | "RepairsHome" | "FinanceHome" | "Products"
          }
        ]`,
        `Timeframe: ${tf}\nContext:\n${businessContext}\nGenerate insights based strictly on this live business context.`,
        true
      );
      
      let parsed: any[] = [];
      try {
        parsed = JSON.parse(response);
      } catch (e) {
        // Safe regex extract if needed
        const match = response.match(/\[[\s\S]*\]/);
        if (match) parsed = JSON.parse(match[0]);
      }

      if (Array.isArray(parsed)) {
        const mappedInsights: InsightData[] = parsed.map((item: any, idx: number) => {
          let icon = 'lightbulb-outline';
          let color = '#3B82F6';
          let bg = '#EFF6FF';

          switch (item.type) {
            case 'critical':
              icon = 'alert-circle-outline'; color = '#EF4444'; bg = '#FEF2F2'; break;
            case 'warning':
              icon = 'alert-outline'; color = '#F59E0B'; bg = '#FFFBEB'; break;
            case 'attention':
              icon = 'information-outline'; color = '#3B82F6'; bg = '#EFF6FF'; break;
            case 'positive':
              icon = 'trending-up'; color = '#10B981'; bg = '#ECFDF5'; break;
          }

          return {
            id: item.id || idx.toString(),
            title: item.title || 'Business Insight',
            preview: item.preview || '',
            type: item.type || 'attention',
            actionLabel: item.actionLabel || 'View Details',
            targetScreen: item.targetScreen || 'Dashboard',
            icon,
            color,
            bg,
          };
        });

        setInsights(mappedInsights);
      }
    } catch (err: any) {
      console.warn('AiInsights error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAction = (screen: string) => {
    try {
      if (screen && navigation.navigate) {
        navigation.navigate(screen);
      }
    } catch (e) {
      console.log('Navigation fallback:', e);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={() => navigation.dispatch(DrawerActions.openDrawer())} style={styles.menuButton}>
            <MaterialCommunityIcons name="menu" size={24} color={AppColors.textPrimary} />
          </TouchableOpacity>
          <View style={styles.headerTextCol}>
            <Text style={styles.headerTitle}>AI Insights</Text>
            <Text style={styles.headerSubtitle}>Live business analysis & alerts</Text>
          </View>
        </View>
        <TouchableOpacity onPress={() => fetchInsights(timeframe)} style={styles.refreshBtn}>
          <MaterialCommunityIcons name="refresh" size={24} color={AppColors.textPrimary} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <HeaderCard />

        {/* Timeframe Filter Tabs */}
        <View style={styles.timeframeTabsRow}>
          {(['Today', 'This Week', 'This Month'] as Timeframe[]).map((tf) => (
            <TouchableOpacity
              key={tf}
              style={[styles.timeframeTab, timeframe === tf && styles.timeframeTabActive]}
              onPress={() => setTimeframe(tf)}
            >
              <Text style={[styles.timeframeTabText, timeframe === tf && styles.timeframeTabTextActive]}>
                {tf}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {isLoading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator color={AppColors.primary} size="large" />
            <Text style={styles.loadingText}>Analyzing live business data for {timeframe}...</Text>
          </View>
        ) : insights.length === 0 ? (
          <View style={styles.loadingBox}>
            <MaterialCommunityIcons name="lightbulb-outline" size={36} color="#9CA3AF" />
            <Text style={styles.emptyText}>No insights available. Check back after recording transactions.</Text>
          </View>
        ) : (
          insights.map((item) => (
            <View key={item.id} style={styles.cardWrapper}>
              <InsightCard data={item} onAction={() => handleAction(item.targetScreen)} />
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const HeaderCard = () => (
  <View style={styles.headerCardContainer}>
    <View style={styles.headerCardInner}>
      <View style={styles.headerCardIconBox}>
        <MaterialCommunityIcons name="auto-fix" color="#FFFFFF" size={22} />
      </View>
      <View style={styles.headerCardContent}>
        <Text style={styles.headerCardTitle}>Live Business Intelligence</Text>
        <Text style={styles.headerCardSubtitle}>AI continuously monitors your sales, stock, repairs & finances</Text>
      </View>
    </View>
  </View>
);

const InsightCard = ({ data, onAction }: { data: InsightData; onAction: () => void }) => {
  const getTypeBadge = (type: InsightData['type']) => {
    switch (type) {
      case 'critical': return { label: 'CRITICAL', color: '#EF4444', bg: '#FEF2F2' };
      case 'warning': return { label: 'WARNING', color: '#F59E0B', bg: '#FFFBEB' };
      case 'attention': return { label: 'ATTENTION', color: '#3B82F6', bg: '#EFF6FF' };
      case 'positive': return { label: 'POSITIVE', color: '#10B981', bg: '#ECFDF5' };
    }
  };

  const badge = getTypeBadge(data.type);

  return (
    <View style={styles.insightCard}>
      <View style={styles.cardTopRow}>
        <View style={[styles.insightIconBox, { backgroundColor: data.bg }]}>
          <MaterialCommunityIcons name={data.icon} color={data.color} size={22} />
        </View>
        <View style={styles.insightHeaderCol}>
          <View style={styles.badgeRow}>
            <View style={[styles.typeBadge, { backgroundColor: badge.bg }]}>
              <Text style={[styles.typeBadgeText, { color: badge.color }]}>{badge.label}</Text>
            </View>
          </View>
          <Text style={styles.insightTitle}>{data.title}</Text>
        </View>
      </View>

      <Text style={styles.insightPreview}>{data.preview}</Text>

      <TouchableOpacity style={styles.actionBtn} onPress={onAction}>
        <Text style={styles.actionBtnText}>{data.actionLabel}</Text>
        <MaterialCommunityIcons name="arrow-right" color={AppColors.primary} size={16} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: AppColors.background, paddingTop: Platform.OS === 'android' ? 24 : 0 },
  header: { backgroundColor: AppColors.surface, paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: AppColors.border, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', height: 64 },
  headerLeft: { flexDirection: 'row', alignItems: 'center' },
  menuButton: { marginRight: 16 },
  refreshBtn: { padding: 4 },
  headerTextCol: { justifyContent: 'center' },
  headerTitle: { color: AppColors.textPrimary, fontSize: 18, fontWeight: '700' },
  headerSubtitle: { color: AppColors.textSecondary, fontSize: 12.5, marginTop: 2 },
  scrollContent: { padding: 16, paddingBottom: 32 },

  headerCardContainer: { backgroundColor: '#5B4DF8', borderRadius: 16, shadowColor: '#5B4DF8', shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.22, shadowRadius: 14, elevation: 8, marginBottom: 16 },
  headerCardInner: { flexDirection: 'row', padding: 16, alignItems: 'center' },
  headerCardIconBox: { width: 42, height: 42, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center', marginRight: 13 },
  headerCardContent: { flex: 1, justifyContent: 'center' },
  headerCardTitle: { color: '#FFFFFF', fontSize: 14, fontWeight: '700', marginBottom: 2 },
  headerCardSubtitle: { color: 'rgba(255,255,255,0.88)', fontSize: 12, lineHeight: 16 },

  timeframeTabsRow: { flexDirection: 'row', backgroundColor: '#F3F4F6', borderRadius: 12, padding: 4, marginBottom: 18 },
  timeframeTab: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 10 },
  timeframeTabActive: { backgroundColor: AppColors.surface, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 2, elevation: 2 },
  timeframeTabText: { fontSize: 13, fontWeight: '600', color: AppColors.textSecondary },
  timeframeTabTextActive: { color: AppColors.primary, fontWeight: '700' },

  loadingBox: { padding: 40, alignItems: 'center', justifyContent: 'center' },
  loadingText: { marginTop: 14, color: AppColors.textSecondary, fontWeight: '500', fontSize: 13.5, textAlign: 'center' },
  emptyText: { marginTop: 12, color: AppColors.textSecondary, fontSize: 13.5, textAlign: 'center' },

  cardWrapper: { marginBottom: 14 },
  insightCard: { backgroundColor: AppColors.surface, borderRadius: 16, borderWidth: 1, borderColor: AppColors.border, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 8, elevation: 2 },
  cardTopRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 10 },
  insightIconBox: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  insightHeaderCol: { flex: 1, justifyContent: 'center' },
  badgeRow: { flexDirection: 'row', marginBottom: 4 },
  typeBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  typeBadgeText: { fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
  insightTitle: { color: AppColors.textPrimary, fontSize: 15, fontWeight: '700' },
  insightPreview: { color: AppColors.textSecondary, fontSize: 13.5, lineHeight: 19, marginBottom: 14 },

  actionBtn: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', backgroundColor: AppColors.primarySoft, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 8 },
  actionBtnText: { color: AppColors.primary, fontSize: 13, fontWeight: '700', marginRight: 6 },
});

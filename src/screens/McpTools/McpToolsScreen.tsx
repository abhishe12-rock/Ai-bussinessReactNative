import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ScrollView, Platform, Switch } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { DrawerActions, useNavigation } from '@react-navigation/native';
import { AppColors } from '../theme/AppColors';

interface ToolAction {
  id: string;
  name: string;
  description: string;
  permission: 'allowed' | 'approval' | 'admin';
  enabled: boolean;
}

interface ToolCategory {
  title: string;
  icon: string;
  actions: ToolAction[];
}

const initialCategories: ToolCategory[] = [
  {
    title: 'Inventory Tools',
    icon: 'package-variant-closed',
    actions: [
      { id: 'inv_1', name: 'get_inventory', description: 'View current product stock levels and catalog items', permission: 'allowed', enabled: true },
      { id: 'inv_2', name: 'check_low_stock', description: 'Query items with stock below minimum threshold', permission: 'allowed', enabled: true },
      { id: 'inv_3', name: 'get_product_details', description: 'Fetch barcodes, IMEIs, warranty, and pricing', permission: 'allowed', enabled: true },
      { id: 'inv_4', name: 'create_purchase_request', description: 'Prepare and create purchase orders for restocking', permission: 'approval', enabled: true },
    ]
  },
  {
    title: 'Sales & Invoices Tools',
    icon: 'point-of-sale',
    actions: [
      { id: 'sal_1', name: 'get_sales_history', description: 'Fetch historical sales invoices and totals', permission: 'allowed', enabled: true },
      { id: 'sal_2', name: 'get_best_sellers', description: 'Calculate top-selling products and quantities sold', permission: 'allowed', enabled: true },
      { id: 'sal_3', name: 'get_unpaid_invoices', description: 'Retrieve pending customer receivables and dues', permission: 'allowed', enabled: true },
    ]
  },
  {
    title: 'Customer Directory Tools',
    icon: 'account-group-outline',
    actions: [
      { id: 'cus_1', name: 'get_customer_profile', description: 'View customer contact details and purchase history', permission: 'allowed', enabled: true },
      { id: 'cus_2', name: 'get_customer_balance', description: 'Calculate outstanding balance for a customer', permission: 'allowed', enabled: true },
      { id: 'cus_3', name: 'delete_customer', description: 'Delete customer records permanently from database', permission: 'admin', enabled: false },
    ]
  },
  {
    title: 'Finance & Ledger Tools',
    icon: 'bank-outline',
    actions: [
      { id: 'fin_1', name: 'get_income_and_expenses', description: 'Review monthly cash flow, revenues, and expenses', permission: 'allowed', enabled: true },
      { id: 'fin_2', name: 'get_loan_emis', description: 'Check upcoming loan EMI obligations and due dates', permission: 'allowed', enabled: true },
      { id: 'fin_3', name: 'create_expense_entry', description: 'Record business expense transactions', permission: 'approval', enabled: true },
      { id: 'fin_4', name: 'delete_transaction', description: 'Delete income or expense records from database', permission: 'admin', enabled: false },
    ]
  },
  {
    title: 'Repair Service Tools',
    icon: 'wrench-outline',
    actions: [
      { id: 'rep_1', name: 'get_repairs_summary', description: 'View pending, in-progress, and completed repair tickets', permission: 'allowed', enabled: true },
      { id: 'rep_2', name: 'get_device_problem_details', description: 'Inspect repair problem descriptions and assigned technicians', permission: 'allowed', enabled: true },
    ]
  },
];

export default function McpToolsScreen() {
  const navigation = useNavigation<any>();
  const [categories, setCategories] = useState<ToolCategory[]>(initialCategories);

  const totalTools = categories.reduce((sum, c) => sum + c.actions.length, 0);
  const activeTools = categories.reduce((sum, c) => sum + c.actions.filter(a => a.enabled).length, 0);

  const toggleTool = (catIndex: number, actionId: string) => {
    const newCats = [...categories];
    const cat = newCats[catIndex];
    const actionIndex = cat.actions.findIndex(a => a.id === actionId);
    if (actionIndex > -1) {
      cat.actions[actionIndex].enabled = !cat.actions[actionIndex].enabled;
    }
    setCategories(newCats);
  };

  const getPermissionBadge = (perm: ToolAction['permission']) => {
    switch (perm) {
      case 'allowed':
        return { label: 'Allowed', color: '#10B981', bg: '#ECFDF5', icon: 'check-circle' };
      case 'approval':
        return { label: 'Requires Approval', color: '#F59E0B', bg: '#FFFBEB', icon: 'shield-alert-outline' };
      case 'admin':
        return { label: 'Admin Only', color: '#EF4444', bg: '#FEF2F2', icon: 'lock-outline' };
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.dispatch(DrawerActions.openDrawer())} style={styles.menuButton}>
          <MaterialCommunityIcons name="menu" size={24} color={AppColors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerTextCol}>
          <Text style={styles.headerTitle}>MCP Tools</Text>
          <Text style={styles.headerSubtitle}>Model Context Protocol & Capabilities</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.statusCard}>
          <View style={styles.statusHeaderRow}>
            <View style={styles.statusDot} />
            <Text style={styles.statusTitle}>MCP Toolbox Active</Text>
            <View style={styles.activeCountBadge}>
              <Text style={styles.activeCountText}>{activeTools}/{totalTools} Tools Enabled</Text>
            </View>
          </View>
          <Text style={styles.statusDescription}>
            These controlled tools determine what database operations your AI Assistant and AI Agents are authorized to inspect or execute.
          </Text>
        </View>

        {categories.map((cat, catIdx) => (
          <View key={cat.title} style={styles.categoryBlock}>
            <View style={styles.categoryHeader}>
              <MaterialCommunityIcons name={cat.icon} color={AppColors.primary} size={18} style={{ marginRight: 6 }} />
              <Text style={styles.categoryTitle}>{cat.title}</Text>
            </View>
            <View style={styles.actionsCard}>
              {cat.actions.map((action, idx) => {
                const badge = getPermissionBadge(action.permission);
                return (
                  <View 
                    key={action.id} 
                    style={[styles.actionRow, idx < cat.actions.length - 1 && styles.actionRowBorder]}
                  >
                    <View style={styles.actionInfo}>
                      <View style={styles.actionNameRow}>
                        <Text style={[styles.actionName, !action.enabled && styles.actionDisabled]}>
                          {action.name}()
                        </Text>
                        <View style={[styles.permBadge, { backgroundColor: badge.bg }]}>
                          <Text style={[styles.permBadgeText, { color: badge.color }]}>{badge.label}</Text>
                        </View>
                      </View>
                      <Text style={styles.actionDescText} numberOfLines={2}>{action.description}</Text>
                    </View>
                    <Switch 
                      value={action.enabled} 
                      onValueChange={() => toggleTool(catIdx, action.id)}
                      trackColor={{ false: '#E5E7EB', true: '#10B981' }}
                      thumbColor={Platform.OS === 'android' ? '#FFF' : undefined}
                    />
                  </View>
                );
              })}
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: AppColors.background, paddingTop: Platform.OS === 'android' ? 24 : 0 },
  header: { backgroundColor: AppColors.surface, paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: AppColors.border, flexDirection: 'row', alignItems: 'center', height: 64 },
  menuButton: { marginRight: 16 },
  headerTextCol: { justifyContent: 'center' },
  headerTitle: { color: AppColors.textPrimary, fontSize: 18, fontWeight: '700' },
  headerSubtitle: { color: AppColors.textSecondary, fontSize: 12.5, marginTop: 2 },
  scrollContent: { padding: 16, paddingBottom: 32 },

  statusCard: { backgroundColor: '#EEECFE', padding: 14, borderRadius: 16, marginBottom: 20 },
  statusHeaderRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  statusDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#10B981', marginRight: 8 },
  statusTitle: { fontSize: 14, fontWeight: '700', color: AppColors.primary, flex: 1 },
  activeCountBadge: { backgroundColor: '#FFF', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  activeCountText: { fontSize: 11.5, fontWeight: '700', color: AppColors.primary },
  statusDescription: { fontSize: 12, color: AppColors.textSecondary, lineHeight: 17, marginTop: 2 },

  categoryBlock: { marginBottom: 20 },
  categoryHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8, paddingHorizontal: 2 },
  categoryTitle: { fontSize: 13, fontWeight: '700', color: AppColors.textPrimary, textTransform: 'uppercase', letterSpacing: 0.5 },

  actionsCard: { backgroundColor: AppColors.surface, borderRadius: 16, borderWidth: 1, borderColor: AppColors.border, overflow: 'hidden' },
  actionRow: { flexDirection: 'row', alignItems: 'center', padding: 14 },
  actionRowBorder: { borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  actionInfo: { flex: 1, marginRight: 12 },
  actionNameRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', marginBottom: 3 },
  actionName: { fontSize: 13.5, fontWeight: '700', color: '#1E293B', fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', marginRight: 8 },
  actionDisabled: { opacity: 0.4 },
  permBadge: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6 },
  permBadgeText: { fontSize: 10, fontWeight: '800' },
  actionDescText: { fontSize: 12, color: AppColors.textSecondary, lineHeight: 16 },
});

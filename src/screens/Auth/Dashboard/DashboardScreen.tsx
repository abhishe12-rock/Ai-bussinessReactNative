import React, { useMemo } from 'react';
import {
View,
Text,
ScrollView,
StyleSheet,
TouchableOpacity,
FlatList,
Alert,
} from 'react-native';
import {
useNavigation,
useRoute,
DrawerActions,
} from '@react-navigation/native';
import Icon, {
type MaterialIconsIconName,
} from '@react-native-vector-icons/material-icons';
import { supabase } from '../../../lib/supabase';
import { AppColors } from '../../theme/AppColors';

type Params = {
allowedModules?: Record<string, boolean>;
employeeName?: string;
employeeId?: string;
};

/* ============================================================
DASHBOARD STATS
============================================================ */

type StatItem = {
title: string;
value: string;
delta: string;
icon: MaterialIconsIconName;
color: string;
deltaPositive?: boolean;
};

const STATS: StatItem[] = [
{
title: "Today's Sales",
value: '$12,480',
delta: '+8.2%',
icon: 'point-of-sale',
color: AppColors.primary,
},
{
title: 'Revenue',
value: '$248,900',
delta: '+12.4%',
icon: 'payments',
color: AppColors.success,
},
{
title: 'Total Customers',
value: '3,214',
delta: '+3.1%',
icon: 'groups',
color: AppColors.info,
},
{
title: 'Products',
value: '842',
delta: '+1.0%',
icon: 'inventory-2',
color: AppColors.teal,
},
{
title: 'Low Stock',
value: '17',
delta: '-2',
deltaPositive: false,
icon: 'warning-amber',
color: AppColors.warning,
},
{
title: 'Pending Orders',
value: '54',
delta: '+6',
deltaPositive: false,
icon: 'shopping-bag',
color: AppColors.danger,
},
{
title: 'Pending Repairs',
value: '9',
delta: '-1',
icon: 'build',
color: AppColors.warning,
},
{
title: 'Employees',
value: '128',
delta: '+2',
icon: 'badge',
color: AppColors.primary,
},
];

/* ============================================================
QUICK ACTIONS
============================================================ */

type QuickActionItem = {
label: string;
icon: MaterialIconsIconName;
color: string;
};

const QUICK_ACTIONS: QuickActionItem[] = [
{
label: 'Add Customer',
icon: 'person-add-alt-1',
color: AppColors.primary,
},
{
label: 'Add Product',
icon: 'add-box',
color: AppColors.teal,
},
{
label: 'Create Invoice',
icon: 'receipt-long',
color: AppColors.success,
},
{
label: 'Upload Document',
icon: 'upload-file',
color: AppColors.info,
},
{
label: 'Ask AI',
icon: 'auto-awesome',
color: AppColors.primary,
},
{
label: 'Generate Report',
icon: 'bar-chart',
color: AppColors.warning,
},
];

/* ============================================================
DRAWER ITEMS
============================================================ */

export type DrawerItemDef = {
icon: MaterialIconsIconName;
title: string;
screen: string;
moduleKey?: string;
alwaysShow?: boolean;
adminOnly?: boolean;
};

export const DRAWER_ITEMS: DrawerItemDef[] = [
{
icon: 'dashboard',
title: 'Dashboard',
screen: 'Dashboard',
alwaysShow: true,
},
{
icon: 'auto-awesome',
title: 'AI Assistant',
screen: 'AiAssistant',
moduleKey: 'AI Assistant',
},
{
icon: 'people',
title: 'Customers',
screen: 'CustomerList',
moduleKey: 'Customers',
},
{
icon: 'inventory-2',
title: 'Inventory',
screen: 'Inventory',
moduleKey: 'Inventory',
},
{
icon: 'point-of-sale',
title: 'Sales',
screen: 'Sales',
moduleKey: 'Sales',
},
{
icon: 'shopping-cart',
title: 'Purchase',
screen: 'Purchase',
moduleKey: 'Purchase',
},
{
icon: 'shopping-bag',
title: 'Orders',
screen: 'Orders',
moduleKey: 'Orders',
},
{
icon: 'person',
title: 'Employees',
screen: 'EmployeeList',
moduleKey: 'Employees',
},
{
icon: 'build',
title: 'Repairs',
screen: 'Repairs',
moduleKey: 'Repairs',
},
{
icon: 'attach-money',
title: 'Finance',
screen: 'Finance',
moduleKey: 'Finance',
},
{
icon: 'bar-chart',
title: 'Reports',
screen: 'Reports',
moduleKey: 'Reports',
},
{
icon: 'folder',
title: 'Document Center',
screen: 'Documents',
moduleKey: 'Documents',
},
{
icon: 'smart-toy',
title: 'AI Agents',
screen: 'AiAgents',
moduleKey: 'AI Agents',
},
{
icon: 'admin-panel-settings',
title: 'Admin',
screen: 'Admin',
adminOnly: true,
},
{
icon: 'payments',
title: 'Calculate Payroll',
screen: 'PayrollCalculation',
adminOnly: true,
},
{
icon: 'receipt-long',
title: 'Payroll',
screen: 'PayrollView',
adminOnly: true,
},
{
icon: 'fingerprint',
title: 'My Attendance',
screen: 'MyAttendance',
alwaysShow: true,
},
{
icon: 'event-available',
title: 'My Leave',
screen: 'RequestLeave',
alwaysShow: true,
},
{
icon: 'history',
title: 'My Activity',
screen: 'MyActivity',
alwaysShow: true,
},
];

/* ============================================================
FILTER DRAWER ITEMS
============================================================ */

export function getVisibleDrawerItems(
allowedModules?: Record<string, boolean>,
): DrawerItemDef[] {
return DRAWER_ITEMS.filter((item) => {
if (item.alwaysShow) {
return true;
}


if (!allowedModules) {
  return true;
}

if (item.adminOnly) {
  return false;
}

return allowedModules[item.moduleKey ?? ''] === true;


});
}

/* ============================================================
DASHBOARD SCREEN
============================================================ */

export default function DashboardScreen() {
const navigation = useNavigation<any>();
const route = useRoute();

const { allowedModules, employeeName } =
(route.params as Params) ?? {};

const visibleItems = useMemo(
() => getVisibleDrawerItems(allowedModules),
[allowedModules],
);

/* ============================================================
LOGOUT
============================================================ */

const handleLogout = () => {
Alert.alert(
'Logout',
'Are you sure you want to logout?',
[
{
text: 'Cancel',
style: 'cancel',
},
{
text: 'Logout',
style: 'destructive',
onPress: async () => {
await supabase.auth.signOut();


        navigation.reset({
          index: 0,
          routes: [{ name: 'Login' }],
        });
      },
    },
  ],
);


};

/* ============================================================
UI
============================================================ */

return ( <ScrollView
   style={styles.flex}
   contentContainerStyle={styles.contentContainer}
 >
{/* HEADER */} <View style={styles.header}>
<TouchableOpacity
onPress={() =>
navigation.dispatch(DrawerActions.openDrawer())
}
style={styles.iconBtn}
> <Icon
         name="menu"
         size={22}
         color={AppColors.textSecondary}
       /> </TouchableOpacity>


    <Text style={styles.headerTitle}>
      {employeeName ?? 'AI Business'}
    </Text>

    <TouchableOpacity
      onPress={handleLogout}
      style={styles.iconBtn}
    >
      <Icon
        name="logout"
        size={20}
        color={AppColors.textSecondary}
      />
    </TouchableOpacity>
  </View>

  {/* EMPTY MODULE MESSAGE */}
  {visibleItems.length <= 1 && allowedModules && (
    <Text style={styles.emptyNote}>
      No modules assigned yet. Ask your admin for access.
    </Text>
  )}

  {/* OVERVIEW */}
  <Text style={styles.sectionTitle}>
    Overview
  </Text>

  <View style={styles.statGrid}>
    {STATS.map((item) => (
      <View
        key={item.title}
        style={styles.statCard}
      >
        <View style={styles.statTopRow}>
          <View
            style={[
              styles.statIconWrap,
              {
                backgroundColor:
                  item.color + '22',
              },
            ]}
          >
            <Icon
              name={item.icon}
              size={18}
              color={item.color}
            />
          </View>

          <View
            style={[
              styles.deltaPill,
              {
                backgroundColor:
                  item.deltaPositive === false
                    ? AppColors.dangerSoft
                    : AppColors.successSoft,
              },
            ]}
          >
            <Text
              style={[
                styles.deltaText,
                {
                  color:
                    item.deltaPositive === false
                      ? AppColors.danger
                      : AppColors.success,
                },
              ]}
            >
              {item.delta}
            </Text>
          </View>
        </View>

        <Text style={styles.statValue}>
          {item.value}
        </Text>

        <Text style={styles.statLabel}>
          {item.title}
        </Text>
      </View>
    ))}
  </View>

  {/* QUICK ACTIONS */}
  <Text style={styles.sectionTitle}>
    Quick Actions
  </Text>

  <FlatList
    horizontal
    data={QUICK_ACTIONS}
    keyExtractor={(item) => item.label}
    showsHorizontalScrollIndicator={false}
    contentContainerStyle={styles.quickList}
    renderItem={({ item }) => (
      <TouchableOpacity
        style={styles.quickAction}
        onPress={() =>
          Alert.alert(item.label)
        }
      >
        <View
          style={[
            styles.statIconWrap,
            {
              backgroundColor:
                item.color + '22',
            },
          ]}
        >
          <Icon
            name={item.icon}
            size={20}
            color={item.color}
          />
        </View>

        <Text style={styles.quickActionLabel}>
          {item.label}
        </Text>
      </TouchableOpacity>
    )}
    ItemSeparatorComponent={() => (
      <View style={styles.separator} />
    )}
  />
</ScrollView>


);
}

/* ============================================================
STYLES
============================================================ */

const styles = StyleSheet.create({
flex: {
flex: 1,
backgroundColor: AppColors.background,
},

contentContainer: {
paddingBottom: 32,
},

header: {
flexDirection: 'row',
alignItems: 'center',
justifyContent: 'space-between',
padding: 16,
backgroundColor: AppColors.surface,
borderBottomWidth: 1,
borderColor: AppColors.border,
},

iconBtn: {
width: 40,
height: 40,
borderRadius: 12,
backgroundColor: AppColors.surfaceSoft,
alignItems: 'center',
justifyContent: 'center',
},

headerTitle: {
fontSize: 18,
fontWeight: '700',
color: AppColors.textPrimary,
},

emptyNote: {
textAlign: 'center',
color: AppColors.textSecondary,
padding: 16,
fontSize: 13,
},

sectionTitle: {
fontSize: 15,
fontWeight: '700',
color: AppColors.textPrimary,
marginHorizontal: 16,
marginTop: 20,
marginBottom: 12,
},

statGrid: {
flexDirection: 'row',
flexWrap: 'wrap',
paddingHorizontal: 12,
gap: 12,
},

statCard: {
width: '46%',
margin: 4,
backgroundColor: AppColors.surface,
borderRadius: 18,
borderWidth: 1,
borderColor: AppColors.border,
padding: 16,
},

statTopRow: {
flexDirection: 'row',
justifyContent: 'space-between',
alignItems: 'center',
},

statIconWrap: {
width: 38,
height: 38,
borderRadius: 11,
alignItems: 'center',
justifyContent: 'center',
},

deltaPill: {
paddingHorizontal: 8,
paddingVertical: 4,
borderRadius: 20,
},

deltaText: {
fontSize: 11,
fontWeight: '700',
},

statValue: {
fontSize: 20,
fontWeight: '800',
color: AppColors.textPrimary,
marginTop: 12,
},

statLabel: {
fontSize: 12.5,
color: AppColors.textSecondary,
marginTop: 2,
},

quickList: {
paddingVertical: 4,
},

quickAction: {
width: 108,
height: 96,
backgroundColor: AppColors.surface,
borderRadius: 16,
borderWidth: 1,
borderColor: AppColors.border,
alignItems: 'center',
justifyContent: 'center',
marginLeft: 16,
},

quickActionLabel: {
fontSize: 11.5,
fontWeight: '600',
color: AppColors.textPrimary,
marginTop: 8,
textAlign: 'center',
},

separator: {
width: 12,
},
});

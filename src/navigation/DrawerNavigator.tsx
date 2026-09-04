
import React from 'react';
import { View, Text, Dimensions, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import {
  createDrawerNavigator,
  DrawerContentComponentProps,
  DrawerContentScrollView,
} from '@react-navigation/drawer';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useRoute, useNavigation } from '@react-navigation/native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Svg, { Defs, LinearGradient as SvgLinearGradient, Stop, Rect } from 'react-native-svg';
import { supabase } from '../lib/supabase';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import DashboardScreen, { getVisibleDrawerItems, DrawerItemDef } from '../screens/Auth/Dashboard/DashboardScreen';
import { AppColors } from '../screens/theme/AppColors';
import { FloatingGeometricOrb, SpringTouch } from '../screens/theme/Animations';

// Import all customer screens
import CustomerListScreen from '../screens/Customer/CustomerListScreen';
import CustomerDetailsScreen from '../screens/Customer/CustomerDetailsScreen';
import AddCustomerScreen from '../screens/Customer/AddCustomerScreen';
import EditCustomerScreen from '../screens/Customer/EditCustomerScreen';
import InvoiceDetailsScreen from '../screens/Customer/InvoiceDetailsScreen';
import RepairDetailsScreen from '../screens/Customer/RepairDetailsScreen';
import EmiPaymentHistoryScreen from '../screens/Customer/EmiPaymentHistoryScreen';

import InventoryHomeScreen from '../screens/Inventory/InventoryScreen';
import ProductsScreen from '../screens/Inventory/ProductsScreen';
import AddProductScreen from '../screens/Inventory/AddProductScreen';
import EditProductScreen from '../screens/Inventory/EditProductScreen';
import ProductDetailsScreen from '../screens/Inventory/ProductDetailsScreen';
import CategoriesScreen from '../screens/Inventory/CategoriesScreen';
import BrandsScreen from '../screens/Inventory/BrandsScreen';
import SuppliersScreen from '../screens/Inventory/SuppliersScreen';
import AddSupplierScreen from '../screens/Inventory/AddSupplierScreen';
import EditSupplierScreen from '../screens/Inventory/EditSupplierScreen';
import SupplierPurchaseHistoryScreen from '../screens/Inventory/SupplierPurchaseHistoryScreen';
import LowStockAlertScreen from '../screens/Inventory/LowStockAlertScreen';
import StockQuantityScreen from '../screens/Inventory/StockQuantityScreen';
import BarcodeScannerScreen from '../screens/Inventory/BarcodeScannerScreen';
import QrCodeScannerScreen from '../screens/Inventory/QrCodeScannerScreen';

import EmployeeListScreen from '../screens/Employee/EmployeeListScreen';
import AddEmployeeScreen from '../screens/Employee/AddEmployeeScreen';
import EmployeeDetailsScreen from '../screens/Employee/EmployeeDetailsScreen';
import AttendanceScreen from '../screens/Employee/AttendanceScreen';
import LeaveScreen from '../screens/Employee/LeaveScreen';
import ActivityLogScreen from '../screens/Employee/ActivityLogScreen';
import ManageAccessScreen from '../screens/Employee/ManageAccessScreen';
import RolesScreen from '../screens/Employee/RolesScreen';
import MyAttendanceScreen from '../screens/Employee/MyAttendanceScreen';
import MyActivityScreen from '../screens/Employee/MyActivityScreen';
import RequestLeaveScreen from '../screens/Employee/RequestLeaveScreen';
import PayrollCalculationScreen from '../screens/Employee/PayrollCalculationScreen';
import PayrollScreen from '../screens/Employee/PayrollScreen';

import SalesHomeScreen from '../screens/Sales/SalesScreen';
import NewSaleScreen from '../screens/Sales/NewSaleScreen';
import InvoicesScreen from '../screens/Sales/InvoicesScreen';
import SaleInvoiceScreen from '../screens/Sales/SaleInvoiceScreen';
import PaymentsRecordScreen from '../screens/Sales/PayemntsRecordScreen';
import PaymentsScreen from '../screens/Sales/PaymentsScreeen';
import ReturnsScreen from '../screens/Sales/ReturnsScreen';
import SalesHistoryScreen from '../screens/Sales/SalesHistroryScreen';

import PurchaseHomeScreen from '../screens/Purchase/PurchaseScreen';
import CreatePurchaseOrderScreen from '../screens/Purchase/CreatePurchaseOrderScreen';
import PurchaseOrdersScreen from '../screens/Purchase/PurchaseOrdersScreen';
import PurchaseDetailsScreen from '../screens/Purchase/PurchaseDetailsScreen';
import StockReceivingScreen from '../screens/Purchase/StockReceivingScreen';
import PurchaseHistoryScreen from '../screens/Purchase/PurchaseHistoryScreen';

import OrdersScreen from '../screens/Orders/OrdersScreen';
import OrderDetailsScreen from '../screens/Orders/OrderDetailsScreen';

import RepairsScreen from '../screens/Repairs/RepairsScreen';
import CreateRepairScreen from '../screens/Repairs/CreateRepairScreen';


import FinanceHomeScreen from '../screens/Finance/FinanceScreen';
import IncomeScreen from '../screens/Finance/IncomeScreen ';
import ExpensesScreen from '../screens/Finance/ExpensesScreen';
import LoansScreen from '../screens/Finance/LoansScreen';
import EmiScreen from '../screens/Finance/EmiScreen';
import LedgerScreen from '../screens/Finance/LedgerScreen';


import TransactionsScreen from '../screens/Finance/TransactionsScreen';
import ReportsScreen from '../screens/Reports/ReportsScreen';

function Stub({ name }: { name: string }) {
  const navigation = useNavigation<any>();
  return (
    <View style={stubStyles.container}>
      <View style={stubStyles.card}>
        <View style={stubStyles.iconBox}>
          <MaterialCommunityIcons name="auto-fix" size={32} color={AppColors.primary} />
        </View>
        <Text style={stubStyles.title}>{name}</Text>
        <Text style={stubStyles.subtitle}>
          This AI enterprise feature is currently scheduled for the next platform release.
        </Text>
        <TouchableOpacity
          style={stubStyles.button}
          onPress={() => navigation.navigate('Dashboard')}
          activeOpacity={0.8}
        >
          <Text style={stubStyles.buttonText}>Back to Dashboard</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// Customer Stack Navigator
const CustomerStack = createNativeStackNavigator();
function CustomerStackNavigator() {
  return (
    <CustomerStack.Navigator screenOptions={{ headerShown: false }}>
      <CustomerStack.Screen name="CustomerListHome" component={CustomerListScreen} />
      <CustomerStack.Screen name="CustomerDetails" component={CustomerDetailsScreen} />
      <CustomerStack.Screen name="AddCustomer" component={AddCustomerScreen} />
      <CustomerStack.Screen name="EditCustomer" component={EditCustomerScreen} />
      <CustomerStack.Screen name="InvoiceDetails" component={InvoiceDetailsScreen} />
      <CustomerStack.Screen name="RepairDetails" component={RepairDetailsScreen} />
      <CustomerStack.Screen name="EmiPaymentHistory" component={EmiPaymentHistoryScreen} />
    </CustomerStack.Navigator>
  );
}

const InventoryStack = createNativeStackNavigator();
function InventoryStackNavigator() {
  return (
    <InventoryStack.Navigator screenOptions={{ headerShown: false }}>
      <InventoryStack.Screen name="InventoryHome" component={InventoryHomeScreen} />
      <InventoryStack.Screen name="Products" component={ProductsScreen} />
      <InventoryStack.Screen name="AddProduct" component={AddProductScreen} />
      <InventoryStack.Screen name="EditProduct" component={EditProductScreen} />
      <InventoryStack.Screen name="ProductDetails" component={ProductDetailsScreen} />
      <InventoryStack.Screen name="Categories" component={CategoriesScreen} />
      <InventoryStack.Screen name="Brands" component={BrandsScreen} />
      <InventoryStack.Screen name="Suppliers" component={SuppliersScreen} />
      <InventoryStack.Screen name="AddSupplier" component={AddSupplierScreen} />
      <InventoryStack.Screen name="EditSupplier" component={EditSupplierScreen} />
      <InventoryStack.Screen name="SupplierPurchaseHistory" component={SupplierPurchaseHistoryScreen} />
      <InventoryStack.Screen name="LowStockAlert" component={LowStockAlertScreen} />
      <InventoryStack.Screen name="StockQuantity" component={StockQuantityScreen} />
      <InventoryStack.Screen name="BarcodeScanner" component={BarcodeScannerScreen} />
      <InventoryStack.Screen name="QrCodeScanner" component={QrCodeScannerScreen} />
    </InventoryStack.Navigator>
  );
}

const EmployeeStack = createNativeStackNavigator();
function EmployeeStackNavigator() {
  return (
    <EmployeeStack.Navigator screenOptions={{ headerShown: false }}>
      <EmployeeStack.Screen name="EmployeeListHome" component={EmployeeListScreen} />
      <EmployeeStack.Screen name="AddEmployee" component={AddEmployeeScreen} />
      <EmployeeStack.Screen name="EmployeeDetails" component={EmployeeDetailsScreen} />
      <EmployeeStack.Screen name="Attendance" component={AttendanceScreen} />
      <EmployeeStack.Screen name="Leave" component={LeaveScreen} />
      <EmployeeStack.Screen name="ActivityLog" component={ActivityLogScreen} />
      <EmployeeStack.Screen name="ManageAccess" component={ManageAccessScreen} />
      <EmployeeStack.Screen name="Roles" component={RolesScreen} />
    </EmployeeStack.Navigator>
  );
}

const SalesStack = createNativeStackNavigator();
function SalesStackNavigator() {
  return (
    <SalesStack.Navigator screenOptions={{ headerShown: false }}>
      <SalesStack.Screen name="SalesHome" component={SalesHomeScreen} />
      <SalesStack.Screen name="NewSale" component={NewSaleScreen} />
      <SalesStack.Screen name="Invoices" component={InvoicesScreen} />
      <SalesStack.Screen name="SaleInvoice" component={SaleInvoiceScreen} />
      <SalesStack.Screen name="PaymentsRecord" component={PaymentsRecordScreen} />
      <SalesStack.Screen name="Payments" component={PaymentsScreen} />
      <SalesStack.Screen name="Returns" component={ReturnsScreen} />
      <SalesStack.Screen name="SalesHistory" component={SalesHistoryScreen} />
    </SalesStack.Navigator>
  );
}

const PurchaseStack = createNativeStackNavigator();
function PurchaseStackNavigator() {
  return (
    <PurchaseStack.Navigator screenOptions={{ headerShown: false }}>
      <PurchaseStack.Screen name="PurchaseHome" component={PurchaseHomeScreen} />
      <PurchaseStack.Screen name="CreatePurchaseOrder" component={CreatePurchaseOrderScreen} />
      <PurchaseStack.Screen name="PurchaseOrders" component={PurchaseOrdersScreen} />
      <PurchaseStack.Screen name="PurchaseDetails" component={PurchaseDetailsScreen} />
      <PurchaseStack.Screen name="StockReceiving" component={StockReceivingScreen} />
      <PurchaseStack.Screen name="PurchaseHistory" component={PurchaseHistoryScreen} />
    </PurchaseStack.Navigator>
  );
}

const OrdersStack = createNativeStackNavigator();
function OrdersStackNavigator() {
  return (
    <OrdersStack.Navigator screenOptions={{ headerShown: false }}>
      <OrdersStack.Screen name="OrdersHome" component={OrdersScreen} />
      <OrdersStack.Screen name="OrderDetails" component={OrderDetailsScreen} />
    </OrdersStack.Navigator>
  );
}


const RepairsStack = createNativeStackNavigator();

function RepairsStackNavigator() {
  return (
    <RepairsStack.Navigator screenOptions={{ headerShown: false }}>
      <RepairsStack.Screen name="RepairsHome" component={RepairsScreen} />
      <RepairsStack.Screen name="CreateRepair" component={CreateRepairScreen} />
    </RepairsStack.Navigator>
  );
}

const FinanceStack = createNativeStackNavigator();
function FinanceStackNavigator() {
  return (
    <FinanceStack.Navigator screenOptions={{ headerShown: false }}>
      <FinanceStack.Screen name="FinanceHome" component={FinanceHomeScreen} />
      <FinanceStack.Screen name="Income" component={IncomeScreen} />
      <FinanceStack.Screen name="Expenses" component={ExpensesScreen} />
      <FinanceStack.Screen name="Loans" component={LoansScreen} />
      <FinanceStack.Screen name="Emi" component={EmiScreen} />
      <FinanceStack.Screen name="Ledger" component={LedgerScreen} />

      <FinanceStack.Screen name="Transactions" component={TransactionsScreen} />
    </FinanceStack.Navigator>
  );
}


const SCREEN_COMPONENTS: Record<string, React.ComponentType> = {
  Dashboard: DashboardScreen,
  AiAssistant: () => <Stub name="AI Assistant" />,
  CustomerList: CustomerStackNavigator,
  Inventory: InventoryStackNavigator,
  Sales: SalesStackNavigator,
  Purchase: PurchaseStackNavigator,
  Orders: OrdersStackNavigator,
  EmployeeList: EmployeeStackNavigator,
  Repairs: RepairsStackNavigator,   // ← changed from () => <Stub name="Repairs" />
  Finance: FinanceStackNavigator,   // ← changed from () => <Stub name="Finance" />
  Reports: ReportsScreen,
  Documents: () => <Stub name="Document Center" />,
  AiAgents: () => <Stub name="AI Agents" />,
  Admin: () => <Stub name="Admin" />,
  PayrollCalculation: PayrollCalculationScreen,
  PayrollView: PayrollScreen,
  MyAttendance: MyAttendanceScreen,
  RequestLeave: RequestLeaveScreen,
  MyActivity: MyActivityScreen,
};

// One icon per module — falls back to a generic icon if a screen key isn't listed here.
const SCREEN_ICONS: Record<string, string> = {
  Dashboard: 'view-dashboard-outline',
  AiAssistant: 'robot-outline',
  CustomerList: 'account-group-outline',
  Inventory: 'archive-outline',
  Sales: 'cart-outline',
  Purchase: 'truck-outline',
  Orders: 'clipboard-list-outline',
  EmployeeList: 'account-tie-outline',
  Repairs: 'wrench-outline',
  Finance: 'cash-multiple',
  Reports: 'chart-bar',
  Documents: 'file-document-outline',
  AiAgents: 'chip',
  Admin: 'shield-account-outline',
  PayrollCalculation: 'calculator-variant-outline',
  PayrollView: 'currency-usd',
  MyAttendance: 'calendar-check-outline',
  RequestLeave: 'calendar-remove-outline',
  MyActivity: 'history',
};

const DEFAULT_ICON = 'apps';

const Drawer = createDrawerNavigator();
const { width: SCREEN_WIDTH } = Dimensions.get('window');

const MODULE_COLORS: Record<string, { bg: string; color: string }> = {
  Dashboard: { bg: '#EEECFE', color: '#5B4DF8' },
  CustomerList: { bg: '#EFF6FF', color: '#3B82F6' },
  Sales: { bg: '#ECFDF5', color: '#10B981' },
  Purchase: { bg: '#FFF7ED', color: '#F97316' },
  Orders: { bg: '#F5F3FF', color: '#8B5CF6' },
  Inventory: { bg: '#F0F9FF', color: '#0EA5E9' },
  Repairs: { bg: '#FFFBEB', color: '#F59E0B' },
  Finance: { bg: '#FEF3C7', color: '#D97706' },
  Reports: { bg: '#FFF1F2', color: '#F43F5E' },
  EmployeeList: { bg: '#EEF2FF', color: '#6366F1' },
  PayrollCalculation: { bg: '#EEF2FF', color: '#6366F1' },
  PayrollView: { bg: '#EEF2FF', color: '#6366F1' },
  Admin: { bg: '#F1F5F9', color: '#64748B' },
  Documents: { bg: '#F0FDF4', color: '#16A34A' },
  AiAssistant: { bg: '#F5F3FF', color: '#8B5CF6' },
  AiAgents: { bg: '#F5F3FF', color: '#8B5CF6' },
};

const MAIN_MODULE_KEYS = [
  'CustomerList',
  'Sales',
  'Purchase',
  'Orders',
  'Inventory',
  'Repairs',
  'EmployeeList',
  'PayrollCalculation',
  'PayrollView',
];

function CustomDrawerContent(props: DrawerContentComponentProps & { parentRoute?: any }) {
  const insets = useSafeAreaInsets();
  const params = (props.parentRoute?.params as any) ?? {};
  const [employeeName, setEmployeeName] = React.useState<string>(
    params.employeeName && params.employeeName !== 'Employee' ? params.employeeName : 'Abhishek'
  );

  React.useEffect(() => {
    if (params.employeeName && params.employeeName !== 'Employee') {
      setEmployeeName(params.employeeName);
    } else {
      supabase.auth.getUser().then(({ data: { user } }) => {
        if (user?.user_metadata?.full_name) {
          setEmployeeName(user.user_metadata.full_name);
        }
      });
    }
  }, [params.employeeName]);

  const { state, navigation, descriptors } = props;

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              await supabase.auth.signOut();
            } catch (e) {
              console.warn('Logout signOut error:', e);
            }
            const rootNav = navigation.getParent() ?? navigation;
            rootNav.reset({
              index: 0,
              routes: [{ name: 'Login' as never }],
            });
          },
        },
      ],
    );
  };

  const dashboardRoute = state.routes.find((r) => r.name === 'Dashboard');
  const mainRoutes = state.routes.filter((r) => MAIN_MODULE_KEYS.includes(r.name));
  const otherRoutes = state.routes.filter(
    (r) => r.name !== 'Dashboard' && !MAIN_MODULE_KEYS.includes(r.name),
  );

  const renderDrawerItem = (r: typeof state.routes[0]) => {
    const routeIndex = state.routes.findIndex((item) => item.key === r.key);
    const { options } = descriptors[r.key];
    const label = (options.title ?? r.name) as string;
    const isFocused = state.index === routeIndex;
    const iconName = SCREEN_ICONS[r.name] ?? DEFAULT_ICON;
    const itemTheme = MODULE_COLORS[r.name] ?? { bg: '#EEECFE', color: AppColors.primary };

    return (
      <SpringTouch
        key={r.key}
        style={{ width: '100%' }}
        activeScale={0.97}
        onPress={() => {
          const event = navigation.emit({ type: 'drawerItemPress', target: r.key, canPreventDefault: true });
          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(r.name);
          }
        }}
      >
        <View
          style={[
            styles.item,
            isFocused && styles.itemFocused,
          ]}
        >
          <View
            style={[
              styles.iconBox,
              { backgroundColor: isFocused ? AppColors.primary : itemTheme.bg },
            ]}
          >
            <MaterialCommunityIcons
              name={iconName}
              size={20}
              color={isFocused ? '#FFFFFF' : itemTheme.color}
            />
          </View>

          <Text
            numberOfLines={1}
            style={[
              styles.itemLabel,
              isFocused && styles.itemLabelFocused,
            ]}
          >
            {label}
          </Text>
        </View>
      </SpringTouch>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
      {/* HEADER: Royal Purple Gradient Banner */}
      <View
        style={[
          styles.header,
          { paddingTop: insets.top > 0 ? insets.top + 14 : 26 },
        ]}
      >
        <Svg
          style={StyleSheet.absoluteFill}
          width="100%"
          height="100%"
          pointerEvents="none"
        >
          <Defs>
            <SvgLinearGradient id="drawerHeaderGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%" stopColor="#5B4DF8" />
              <Stop offset="100%" stopColor="#7C3AED" />
            </SvgLinearGradient>
          </Defs>
          <Rect width="100%" height="100%" fill="url(#drawerHeaderGrad)" />
        </Svg>

        {/* Ambient Continuous Floating Geometric Orbs */}
        <FloatingGeometricOrb
          size={110}
          top={-25}
          right={-20}
          color="rgba(255, 255, 255, 0.12)"
          duration={4200}
          floatDistance={8}
        />
        <FloatingGeometricOrb
          size={70}
          bottom={-25}
          right={55}
          color="rgba(255, 255, 255, 0.08)"
          duration={5200}
          floatDistance={6}
        />

        <View style={styles.headerUserRow}>
          <View style={styles.avatar}>
            <Text style={styles.avatarLetter}>
              {(employeeName || 'A').charAt(0).toUpperCase()}
            </Text>
          </View>
          <View style={styles.headerUserInfo}>
            <Text style={styles.headerTitle} numberOfLines={1}>
              {employeeName || 'Abhishek'}
            </Text>
            <View style={styles.roleBadgeRow}>

              <Text style={styles.headerSubText}>AI Business Hub</Text>
            </View>
          </View>
        </View>
      </View>

      {/* MODULE LIST */}
      <DrawerContentScrollView
        {...props}
        style={{ paddingTop: 0 }}
        contentContainerStyle={[styles.listContent, { paddingTop: 8 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* DASHBOARD ITEM */}
        {dashboardRoute && renderDrawerItem(dashboardRoute)}

        {/* MAIN MODULES SECTION */}
        {mainRoutes.length > 0 && (
          <>
            <Text style={styles.sectionCaption}>MAIN MODULES</Text>
            {mainRoutes.map(renderDrawerItem)}
          </>
        )}

        {/* OTHERS SECTION */}
        {otherRoutes.length > 0 && (
          <>
            <Text style={styles.sectionCaption}>OTHERS</Text>
            {otherRoutes.map(renderDrawerItem)}
          </>
        )}
      </DrawerContentScrollView>

      {/* FOOTER: Premium Logout & App Version */}
      <View
        style={[
          styles.footer,
          { paddingBottom: Math.max(insets.bottom, 12) + 8 },
        ]}
      >
        <SpringTouch
          style={{ width: '100%' }}
          activeScale={0.98}
          onPress={handleLogout}
        >
          <View style={styles.logoutBtn}>
            <View style={styles.logoutLeft}>
              <View style={styles.logoutIconWrap}>
                <MaterialCommunityIcons name="logout" size={18} color="#EF4444" />
              </View>
              <View style={styles.logoutTextCol}>
                <Text style={styles.logoutTitle}>Logout</Text>
                <Text style={styles.logoutSubtitle}>Sign out of account</Text>
              </View>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={20} color="#F87171" />
          </View>
        </SpringTouch>

        <Text style={styles.footerVersionText}>AI Business Hub • v1.0.0</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: '#5B4DF8',
    paddingBottom: 20,
    paddingHorizontal: 18,
    position: 'relative',
    overflow: 'hidden',
  },
  headerDecoCircle1: {
    position: 'absolute',
    right: -20,
    top: -20,
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  headerDecoCircle2: {
    position: 'absolute',
    right: 55,
    bottom: -25,
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  headerUserRow: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
    zIndex: 2,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  avatarLetter: {
    fontSize: 22,
    fontWeight: '800',
    color: '#5B4DF8',
  },
  headerUserInfo: {
    flex: 1,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  roleBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  roleBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  roleBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  headerSubText: {
    fontSize: 11.5,
    color: 'rgba(255, 255, 255, 0.85)',
    fontWeight: '500',
  },
  listContent: {
    paddingTop: 12,
    paddingHorizontal: 12,
    paddingBottom: 20,
  },
  sectionCaption: {
    fontSize: 11,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 0.8,
    marginTop: 18,
    marginBottom: 8,
    marginLeft: 8,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    paddingVertical: 9,
    paddingHorizontal: 10,
    marginVertical: 2,
  },
  itemFocused: {
    backgroundColor: '#EEECFE',
  },
  iconBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemLabel: {
    marginLeft: 12,
    fontSize: 14,
    fontWeight: '600',
    color: AppColors.textPrimary,
    flexShrink: 1,
  },
  itemLabelFocused: {
    color: AppColors.primary,
    fontWeight: '800',
  },
  footer: {
    paddingTop: 12,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    backgroundColor: '#FFFFFF',
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FEE2E2',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 14,
  },
  logoutLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoutIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 11,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  logoutTextCol: {
    justifyContent: 'center',
  },
  logoutTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#EF4444',
    letterSpacing: -0.2,
  },
  logoutSubtitle: {
    fontSize: 11,
    fontWeight: '500',
    color: '#B91C1C',
    opacity: 0.75,
    marginTop: 1,
  },
  footerVersionText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 10,
    letterSpacing: 0.3,
  },
});

const stubStyles = StyleSheet.create({
  container: { flex: 1, backgroundColor: AppColors.background, alignItems: 'center', justifyContent: 'center', padding: 24 },
  card: {
    backgroundColor: AppColors.surface, borderRadius: 20, borderWidth: 1, borderColor: AppColors.border,
    padding: 28, alignItems: 'center', width: '100%', maxWidth: 360,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 12, elevation: 4,
  },
  iconBox: { width: 64, height: 64, borderRadius: 18, backgroundColor: AppColors.primarySoft, alignItems: 'center', justifyContent: 'center', marginBottom: 16, borderWidth: 1, borderColor: `${AppColors.primary}30` },
  title: { color: AppColors.textPrimary, fontSize: 18, fontWeight: '800', letterSpacing: -0.3, textAlign: 'center' },
  subtitle: { color: AppColors.textSecondary, fontSize: 13, lineHeight: 18, textAlign: 'center', marginTop: 8, marginBottom: 20 },
  button: { backgroundColor: AppColors.primary, borderRadius: 14, height: 46, paddingHorizontal: 20, alignItems: 'center', justifyContent: 'center', shadowColor: AppColors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.35, shadowRadius: 10, elevation: 4 },
  buttonText: { color: '#fff', fontSize: 14, fontWeight: '700' },
});

export default function DrawerNavigator({ route }: any) {
  const allowedModules = route?.params?.allowedModules as Record<string, boolean> | undefined;
  const visibleItems: DrawerItemDef[] = getVisibleDrawerItems(allowedModules);

  return (
    <Drawer.Navigator
      initialRouteName="Dashboard"
      drawerContent={(props) => <CustomDrawerContent {...props} parentRoute={route} />}
      screenOptions={{
        headerShown: false,
        drawerType: 'front',
        drawerStyle: {
          width: SCREEN_WIDTH * 0.75, // 75% of screen, not full-screen
          backgroundColor: AppColors.background,
        },
        overlayColor: 'rgba(0,0,0,0.4)',
      }}
    >
      {visibleItems.map((item) => (
        <Drawer.Screen
          key={item.screen}
          name={item.screen}
          component={SCREEN_COMPONENTS[item.screen] ?? (() => <Stub name={item.title} />)}
          options={{ title: item.title }}
          initialParams={route?.params}
        />
      ))}
    </Drawer.Navigator>
  );
}
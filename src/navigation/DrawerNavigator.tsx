// import React from 'react';
// import { View, Text } from 'react-native';
// import { createDrawerNavigator, DrawerContentComponentProps, DrawerContentScrollView, DrawerItemList } from '@react-navigation/drawer';
// import { createNativeStackNavigator } from '@react-navigation/native-stack';
// import { useRoute } from '@react-navigation/native';

// import DashboardScreen, { getVisibleDrawerItems, DrawerItemDef } from '../screens/Auth/Dashboard/DashboardScreen';
// import { AppColors } from '../screens/theme/AppColors';

// // Import all customer screens
// import CustomerListScreen from '../screens/Customer/CustomerListScreen';
// import CustomerDetailsScreen from '../screens/Customer/CustomerDetailsScreen';
// import AddCustomerScreen from '../screens/Customer/AddCustomerScreen';
// import EditCustomerScreen from '../screens/Customer/EditCustomerScreen';
// import InvoiceDetailsScreen from '../screens/Customer/InvoiceDetailsScreen';
// import RepairDetailsScreen from '../screens/Customer/RepairDetailsScreen';
// import EmiPaymentHistoryScreen from '../screens/Customer/EmiPaymentHistoryScreen';


// import InventoryHomeScreen from '../screens/Inventory/InventoryScreen';
// import ProductsScreen from '../screens/Inventory/ProductsScreen';
// import AddProductScreen from '../screens/Inventory/AddProductScreen';
// import EditProductScreen from '../screens/Inventory/EditProductScreen';
// import ProductDetailsScreen from '../screens/Inventory/ProductDetailsScreen';
// import CategoriesScreen from '../screens/Inventory/CategoriesScreen';
// import BrandsScreen from '../screens/Inventory/BrandsScreen';
// import SuppliersScreen from '../screens/Inventory/SuppliersScreen';
// import AddSupplierScreen from '../screens/Inventory/AddSupplierScreen';
// import EditSupplierScreen from '../screens/Inventory/EditSupplierScreen';
// import SupplierPurchaseHistoryScreen from '../screens/Inventory/SupplierPurchaseHistoryScreen';
// import LowStockAlertScreen from '../screens/Inventory/LowStockAlertScreen';
// import StockQuantityScreen from '../screens/Inventory/StockQuantityScreen';
// import BarcodeScannerScreen from '../screens/Inventory/BarcodeScannerScreen';
// import QrCodeScannerScreen from '../screens/Inventory/QrCodeScannerScreen';


// import EmployeeListScreen from '../screens/Employee/EmployeeListScreen';
// import AddEmployeeScreen from '../screens/Employee/AddEmployeeScreen';
// import EmployeeDetailsScreen from '../screens/Employee/EmployeeDetailsScreen';
// import AttendanceScreen from '../screens/Employee/AttendanceScreen';
// import LeaveScreen from '../screens/Employee/LeaveScreen';
// import ActivityLogScreen from '../screens/Employee/ActivityLogScreen';
// import ManageAccessScreen from '../screens/Employee/ManageAccessScreen';
// import RolesScreen from '../screens/Employee/RolesScreen';
// import MyAttendanceScreen from '../screens/Employee/MyAttendanceScreen';
// import MyActivityScreen from '../screens/Employee/MyActivityScreen';
// import RequestLeaveScreen from '../screens/Employee/RequestLeaveScreen';
// import PayrollCalculationScreen from '../screens/Employee/PayrollCalculationScreen';
// import PayrollScreen from '../screens/Employee/PayrollScreen';


// import SalesHomeScreen from '../screens/Sales/SalesScreen';
// import NewSaleScreen from '../screens/Sales/NewSaleScreen';
// import InvoicesScreen from '../screens/Sales/InvoicesScreen';
// import SaleInvoiceScreen from '../screens/Sales/SaleInvoiceScreen';
// import PaymentsRecordScreen from '../screens/Sales/PayemntsRecordScreen';
// import PaymentsScreen from '../screens/Sales/PaymentsScreeen';
// import ReturnsScreen from '../screens/Sales/ReturnsScreen';
// import SalesHistoryScreen from '../screens/Sales/SalesHistroryScreen';


// import PurchaseHomeScreen from '../screens/Purchase/PurchaseScreen';
// import CreatePurchaseOrderScreen from '../screens/Purchase/CreatePurchaseOrderScreen';
// import PurchaseOrdersScreen from '../screens/Purchase/PurchaseOrdersScreen';
// import PurchaseDetailsScreen from '../screens/Purchase/PurchaseDetailsScreen';
// import StockReceivingScreen from '../screens/Purchase/StockReceivingScreen';
// import PurchaseHistoryScreen from '../screens/Purchase/PurchaseHistoryScreen';


// import OrdersScreen from '../screens/Orders/OrdersScreen';
// import OrderDetailsScreen from '../screens/Orders/OrderDetailsScreen';

// function Stub({ name }: { name: string }) {
//   return (
//     <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: AppColors.background }}>
//       <Text style={{ color: AppColors.textSecondary }}>{name} — not converted yet</Text>
//     </View>
//   );
// }

// // Customer Stack Navigator
// const CustomerStack = createNativeStackNavigator();

// function CustomerStackNavigator() {
//   return (
//     <CustomerStack.Navigator screenOptions={{ headerShown: false }}>
//       <CustomerStack.Screen name="CustomerListHome" component={CustomerListScreen} />
//       <CustomerStack.Screen name="CustomerDetails" component={CustomerDetailsScreen} />
//       <CustomerStack.Screen name="AddCustomer" component={AddCustomerScreen} />
//       <CustomerStack.Screen name="EditCustomer" component={EditCustomerScreen} />
//       <CustomerStack.Screen name="InvoiceDetails" component={InvoiceDetailsScreen} />
//       <CustomerStack.Screen name="RepairDetails" component={RepairDetailsScreen} />
//       <CustomerStack.Screen name="EmiPaymentHistory" component={EmiPaymentHistoryScreen} />
//     </CustomerStack.Navigator>
//   );
// }

// const InventoryStack = createNativeStackNavigator();

// function InventoryStackNavigator() {
//   return (
//     <InventoryStack.Navigator screenOptions={{ headerShown: false }}>
//       <InventoryStack.Screen name="InventoryHome" component={InventoryHomeScreen} />
//       <InventoryStack.Screen name="Products" component={ProductsScreen} />
//       <InventoryStack.Screen name="AddProduct" component={AddProductScreen} />
//       <InventoryStack.Screen name="EditProduct" component={EditProductScreen} />
//       <InventoryStack.Screen name="ProductDetails" component={ProductDetailsScreen} />
//       <InventoryStack.Screen name="Categories" component={CategoriesScreen} />
//       <InventoryStack.Screen name="Brands" component={BrandsScreen} />
//       <InventoryStack.Screen name="Suppliers" component={SuppliersScreen} />
//       <InventoryStack.Screen name="AddSupplier" component={AddSupplierScreen} />
//       <InventoryStack.Screen name="EditSupplier" component={EditSupplierScreen} />
//       <InventoryStack.Screen name="SupplierPurchaseHistory" component={SupplierPurchaseHistoryScreen} />
//       <InventoryStack.Screen name="LowStockAlert" component={LowStockAlertScreen} />
//       <InventoryStack.Screen name="StockQuantity" component={StockQuantityScreen} />
//       <InventoryStack.Screen name="BarcodeScanner" component={BarcodeScannerScreen} />
//       <InventoryStack.Screen name="QrCodeScanner" component={QrCodeScannerScreen} />
//     </InventoryStack.Navigator>
//   );
// }

// const EmployeeStack = createNativeStackNavigator();

// function EmployeeStackNavigator() {
//   return (
//     <EmployeeStack.Navigator screenOptions={{ headerShown: false }}>
//       <EmployeeStack.Screen name="EmployeeListHome" component={EmployeeListScreen} />
//       <EmployeeStack.Screen name="AddEmployee" component={AddEmployeeScreen} />
//       <EmployeeStack.Screen name="EmployeeDetails" component={EmployeeDetailsScreen} />
//       <EmployeeStack.Screen name="Attendance" component={AttendanceScreen} />
//       <EmployeeStack.Screen name="Leave" component={LeaveScreen} />
//       <EmployeeStack.Screen name="ActivityLog" component={ActivityLogScreen} />
//       <EmployeeStack.Screen name="ManageAccess" component={ManageAccessScreen} />
//       <EmployeeStack.Screen name="Roles" component={RolesScreen} />
//     </EmployeeStack.Navigator>
//   );
// }


// const SalesStack = createNativeStackNavigator();

// function SalesStackNavigator() {
//   return (
//     <SalesStack.Navigator screenOptions={{ headerShown: false }}>
//       <SalesStack.Screen name="SalesHome" component={SalesHomeScreen} />
//       <SalesStack.Screen name="NewSale" component={NewSaleScreen} />
//       <SalesStack.Screen name="Invoices" component={InvoicesScreen} />
//       <SalesStack.Screen name="SaleInvoice" component={SaleInvoiceScreen} />
//       <SalesStack.Screen name="PaymentsRecord" component={PaymentsRecordScreen} />
//       <SalesStack.Screen name="Payments" component={PaymentsScreen} />
//       <SalesStack.Screen name="Returns" component={ReturnsScreen} />
//       <SalesStack.Screen name="SalesHistory" component={SalesHistoryScreen} />
//     </SalesStack.Navigator>
//   );
// }


// const PurchaseStack = createNativeStackNavigator();

// function PurchaseStackNavigator() {
//   return (
//     <PurchaseStack.Navigator screenOptions={{ headerShown: false }}>
//       <PurchaseStack.Screen name="PurchaseHome" component={PurchaseHomeScreen} />
//       <PurchaseStack.Screen name="CreatePurchaseOrder" component={CreatePurchaseOrderScreen} />
//       <PurchaseStack.Screen name="PurchaseOrders" component={PurchaseOrdersScreen} />
//       <PurchaseStack.Screen name="PurchaseDetails" component={PurchaseDetailsScreen} />
//       <PurchaseStack.Screen name="StockReceiving" component={StockReceivingScreen} />
//       <PurchaseStack.Screen name="PurchaseHistory" component={PurchaseHistoryScreen} />
//     </PurchaseStack.Navigator>
//   );
// }

// const OrdersStack = createNativeStackNavigator();

// function OrdersStackNavigator() {
//   return (
//     <OrdersStack.Navigator screenOptions={{ headerShown: false }}>
//       <OrdersStack.Screen name="OrdersHome" component={OrdersScreen} />
//       <OrdersStack.Screen name="OrderDetails" component={OrderDetailsScreen} />
//     </OrdersStack.Navigator>
//   );
// }
// const SCREEN_COMPONENTS: Record<string, React.ComponentType> = {
//   Dashboard: DashboardScreen,
//   AiAssistant: () => <Stub name="AI Assistant" />,
//   CustomerList: CustomerStackNavigator,
//   Inventory: InventoryStackNavigator,   // ← changed from the Stub
//   Sales: SalesStackNavigator,   // ← changed from the Stub
//   Purchase: PurchaseStackNavigator,   // ← changed from the Stub
//   Orders: OrdersStackNavigator,   // ← changed from the Stub
//   EmployeeList: EmployeeStackNavigator,           // ← changed
//   Repairs: () => <Stub name="Repairs" />,
//   Finance: () => <Stub name="Finance" />,
//   Reports: () => <Stub name="Reports" />,
//   Documents: () => <Stub name="Document Center" />,
//   AiAgents: () => <Stub name="AI Agents" />,
//   Admin: () => <Stub name="Admin" />,
//   PayrollCalculation: PayrollCalculationScreen,   // ← changed
//   PayrollView: PayrollScreen,                     // ← changed
//   MyAttendance: MyAttendanceScreen,               // ← changed
//   RequestLeave: RequestLeaveScreen,               // ← changed
//   MyActivity: MyActivityScreen,                   // ← changed
// };

// const Drawer = createDrawerNavigator();

// function CustomDrawerContent(props: DrawerContentComponentProps) {
//   const route = useRoute();
//   const params = (route.params as any) ?? {};
//   const employeeName = params.employeeName as string | undefined;

//   return (
//     <DrawerContentScrollView {...props}>
//       <View style={{ padding: 20, backgroundColor: AppColors.primary, marginBottom: 8 }}>
//         <Text style={{ color: '#fff', fontSize: 18, fontWeight: '700' }}>{employeeName ?? 'Enterprise AI'}</Text>
//         <Text style={{ color: '#ffffffaa', fontSize: 12 }}>{employeeName ? 'Employee access' : 'Business Assistant'}</Text>
//       </View>
//       <DrawerItemList {...props} />
//     </DrawerContentScrollView>
//   );
// }

// export default function DrawerNavigator({ route }: any) {
//   const allowedModules = route?.params?.allowedModules as Record<string, boolean> | undefined;
//   const visibleItems: DrawerItemDef[] = getVisibleDrawerItems(allowedModules);

//   return (
//     <Drawer.Navigator
//       initialRouteName="Dashboard"
//       drawerContent={(props) => <CustomDrawerContent {...props} />}
//       screenOptions={{ headerShown: false }}
//     >
//       {visibleItems.map((item) => (
//         <Drawer.Screen
//           key={item.screen}
//           name={item.screen}
//           component={SCREEN_COMPONENTS[item.screen] ?? (() => <Stub name={item.title} />)}
//           options={{ title: item.title }}
//           initialParams={route?.params}
//         />
//       ))}
//     </Drawer.Navigator>
//   );
// }
import React from 'react';
import { View, Text, Dimensions, TouchableOpacity, StyleSheet } from 'react-native';
import {
  createDrawerNavigator,
  DrawerContentComponentProps,
  DrawerContentScrollView,
} from '@react-navigation/drawer';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useRoute } from '@react-navigation/native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import DashboardScreen, { getVisibleDrawerItems, DrawerItemDef } from '../screens/Auth/Dashboard/DashboardScreen';
import { AppColors } from '../screens/theme/AppColors';

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

function Stub({ name }: { name: string }) {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: AppColors.background }}>
      <Text style={{ color: AppColors.textSecondary }}>{name} — not converted yet</Text>
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

const SCREEN_COMPONENTS: Record<string, React.ComponentType> = {
  Dashboard: DashboardScreen,
  AiAssistant: () => <Stub name="AI Assistant" />,
  CustomerList: CustomerStackNavigator,
  Inventory: InventoryStackNavigator,
  Sales: SalesStackNavigator,
  Purchase: PurchaseStackNavigator,
  Orders: OrdersStackNavigator,
  EmployeeList: EmployeeStackNavigator,
  Repairs: () => <Stub name="Repairs" />,
  Finance: () => <Stub name="Finance" />,
  Reports: () => <Stub name="Reports" />,
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
const SCREEN_ICONS: Record<string, keyof typeof MaterialCommunityIcons.glyphMap> = {
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

const DEFAULT_ICON: keyof typeof MaterialCommunityIcons.glyphMap = 'apps';

const Drawer = createDrawerNavigator();
const { width: SCREEN_WIDTH } = Dimensions.get('window');

function CustomDrawerContent(props: DrawerContentComponentProps) {
  const route = useRoute();
  const params = (route.params as any) ?? {};
  const employeeName = params.employeeName as string | undefined;
  const { state, navigation, descriptors } = props;

  return (
    <View style={{ flex: 1, backgroundColor: AppColors.background }}>
      {/* Header — themed off AppColors.primary */}
      <View style={styles.header}>
        <View style={styles.avatar}>
          <MaterialCommunityIcons
            name={employeeName ? 'account' : 'domain'}
            size={26}
            color={AppColors.white ?? '#fff'}
          />
        </View>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {employeeName ?? 'Enterprise AI'}
        </Text>
        <Text style={styles.headerSubtitle}>
          {employeeName ? 'Employee access' : 'Business Assistant'}
        </Text>
      </View>

      {/* Module list — icon box + spacing + module name */}
      <DrawerContentScrollView {...props} contentContainerStyle={styles.listContent}>
        {state.routes.map((r, index) => {
          const { options } = descriptors[r.key];
          const label = (options.title ?? r.name) as string;
          const isFocused = state.index === index;
          const iconName = SCREEN_ICONS[r.name] ?? DEFAULT_ICON;

          return (
            <TouchableOpacity
              key={r.key}
              activeOpacity={0.7}
              onPress={() => {
                const event = navigation.emit({ type: 'drawerItemPress', target: r.key, canPreventDefault: true });
                if (!isFocused && !event.defaultPrevented) {
                  navigation.navigate(r.name);
                }
              }}
              style={[
                styles.item,
                isFocused && { backgroundColor: `${AppColors.primary}1A` },
              ]}
            >
              <View
                style={[
                  styles.iconBox,
                  { backgroundColor: isFocused ? AppColors.primary : `${AppColors.primary}14` },
                ]}
              >
                <MaterialCommunityIcons
                  name={iconName}
                  size={20}
                  color={isFocused ? (AppColors.white ?? '#fff') : AppColors.primary}
                />
              </View>
              <Text
                numberOfLines={1}
                style={[
                  styles.itemLabel,
                  { color: isFocused ? AppColors.primary : AppColors.textPrimary ?? AppColors.textSecondary },
                  isFocused && { fontWeight: '700' },
                ]}
              >
                {label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </DrawerContentScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>v1.0.0</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingTop: 48,
    paddingBottom: 20,
    paddingHorizontal: 20,
    backgroundColor: AppColors.primary,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: `${AppColors.white ?? '#fff'}33`,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  headerTitle: {
    color: AppColors.white ?? '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  headerSubtitle: {
    color: `${AppColors.white ?? '#fff'}aa`,
    fontSize: 12,
    marginTop: 2,
  },
  listContent: {
    paddingTop: 8,
    paddingHorizontal: 10,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 10,
    marginVertical: 2,
  },
  iconBox: {
    width: 34,
    height: 34,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemLabel: {
    marginLeft: 14, // the "space" between icon and module name
    fontSize: 14,
    flexShrink: 1,
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: `${AppColors.textSecondary ?? '#999'}22`,
  },
  footerText: {
    fontSize: 11,
    color: AppColors.textSecondary ?? '#999',
    textAlign: 'center',
  },
});

export default function DrawerNavigator({ route }: any) {
  const allowedModules = route?.params?.allowedModules as Record<string, boolean> | undefined;
  const visibleItems: DrawerItemDef[] = getVisibleDrawerItems(allowedModules);

  return (
    <Drawer.Navigator
      initialRouteName="Dashboard"
      drawerContent={(props) => <CustomDrawerContent {...props} />}
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
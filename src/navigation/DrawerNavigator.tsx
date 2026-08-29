import React from 'react';
import { View, Text } from 'react-native';
import { createDrawerNavigator, DrawerContentComponentProps, DrawerContentScrollView, DrawerItemList } from '@react-navigation/drawer';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useRoute } from '@react-navigation/native';

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

const SCREEN_COMPONENTS: Record<string, React.ComponentType> = {
  Dashboard: DashboardScreen,
  AiAssistant: () => <Stub name="AI Assistant" />,
  CustomerList: CustomerStackNavigator,
  Inventory: InventoryStackNavigator,   // ← changed from the Stub
  Sales: () => <Stub name="Sales" />,
  Purchase: () => <Stub name="Purchase" />,
  Orders: () => <Stub name="Orders" />,
  EmployeeList: () => <Stub name="Employees" />,
  Repairs: () => <Stub name="Repairs" />,
  Finance: () => <Stub name="Finance" />,
  Reports: () => <Stub name="Reports" />,
  Documents: () => <Stub name="Document Center" />,
  AiAgents: () => <Stub name="AI Agents" />,
  Admin: () => <Stub name="Admin" />,
  PayrollCalculation: () => <Stub name="Calculate Payroll" />,
  PayrollView: () => <Stub name="Payroll" />,
  MyAttendance: () => <Stub name="My Attendance" />,
  RequestLeave: () => <Stub name="My Leave" />,
  MyActivity: () => <Stub name="My Activity" />,
};

const Drawer = createDrawerNavigator();

function CustomDrawerContent(props: DrawerContentComponentProps) {
  const route = useRoute();
  const params = (route.params as any) ?? {};
  const employeeName = params.employeeName as string | undefined;

  return (
    <DrawerContentScrollView {...props}>
      <View style={{ padding: 20, backgroundColor: AppColors.primary, marginBottom: 8 }}>
        <Text style={{ color: '#fff', fontSize: 18, fontWeight: '700' }}>{employeeName ?? 'Enterprise AI'}</Text>
        <Text style={{ color: '#ffffffaa', fontSize: 12 }}>{employeeName ? 'Employee access' : 'Business Assistant'}</Text>
      </View>
      <DrawerItemList {...props} />
    </DrawerContentScrollView>
  );
}

export default function DrawerNavigator({ route }: any) {
  const allowedModules = route?.params?.allowedModules as Record<string, boolean> | undefined;
  const visibleItems: DrawerItemDef[] = getVisibleDrawerItems(allowedModules);

  return (
    <Drawer.Navigator
      initialRouteName="Dashboard"
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={{ headerShown: false }}
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
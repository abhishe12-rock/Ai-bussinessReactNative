import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import Icon from '@react-native-vector-icons/material-icons';
import { useNavigation, DrawerActions } from '@react-navigation/native';
import { AppColors } from '../screens/theme/AppColors';

type ActiveTab = 'Home' | 'Customers' | 'Sales' | 'Purchases' | 'Orders' | 'Inventory' | 'Repairs' | 'Payroll' | 'Reports' | 'More';

interface BottomNavBarProps {
  activeTab: ActiveTab;
  onCenterPress?: () => void;
}

export const BottomNavBar: React.FC<BottomNavBarProps> = ({ activeTab, onCenterPress }) => {
  const navigation = useNavigation<any>();

  const handleTabPress = (tab: ActiveTab) => {
    if (tab === 'Home') {
      navigation.navigate('Dashboard');
    } else if (tab === 'Customers') {
      navigation.navigate('CustomerList');
    } else if (tab === 'Reports') {
      navigation.navigate('Reports');
    } else if (tab === 'More') {
      navigation.dispatch(DrawerActions.openDrawer());
    }
  };

  const isHome = activeTab === 'Home';
  const isModule = activeTab !== 'Home' && activeTab !== 'Reports' && activeTab !== 'More';
  const isReports = activeTab === 'Reports';
  const isMore = activeTab === 'More';

  return (
    <View style={styles.container}>
      {/* Home tab */}
      <TouchableOpacity
        style={styles.tabItem}
        activeOpacity={0.7}
        onPress={() => handleTabPress('Home')}
      >
        <Icon
          name="home"
          size={24}
          color={isHome ? AppColors.primary : AppColors.textMuted}
        />
        <Text style={[styles.tabLabel, isHome && styles.tabLabelActive]}>Home</Text>
      </TouchableOpacity>

      {/* Module tab (Customers, Sales, etc.) */}
      <TouchableOpacity
        style={styles.tabItem}
        activeOpacity={0.7}
        onPress={() => handleTabPress(activeTab === 'Home' ? 'Customers' : activeTab)}
      >
        <Icon
          name={
            activeTab === 'Sales' ? 'point-of-sale' :
            activeTab === 'Orders' ? 'shopping-bag' :
            activeTab === 'Inventory' ? 'inventory-2' :
            activeTab === 'Repairs' ? 'build' :
            activeTab === 'Payroll' ? 'payments' :
            'groups'
          }
          size={24}
          color={isModule ? AppColors.primary : AppColors.textMuted}
        />
        <Text style={[styles.tabLabel, isModule && styles.tabLabelActive]}>
          {activeTab === 'Home' ? 'Customers' : activeTab}
        </Text>
      </TouchableOpacity>

      {/* Center Floating Purple (+) Button */}
      <View style={styles.centerButtonWrapper}>
        <TouchableOpacity
          style={styles.centerButton}
          activeOpacity={0.85}
          onPress={onCenterPress ?? (() => navigation.dispatch(DrawerActions.openDrawer()))}
        >
          <Icon name="add" size={28} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Reports tab */}
      <TouchableOpacity
        style={styles.tabItem}
        activeOpacity={0.7}
        onPress={() => handleTabPress('Reports')}
      >
        <Icon
          name="bar-chart"
          size={24}
          color={isReports ? AppColors.primary : AppColors.textMuted}
        />
        <Text style={[styles.tabLabel, isReports && styles.tabLabelActive]}>Reports</Text>
      </TouchableOpacity>

      {/* More tab */}
      <TouchableOpacity
        style={styles.tabItem}
        activeOpacity={0.7}
        onPress={() => handleTabPress('More')}
      >
        <Icon
          name="more-horiz"
          size={24}
          color={isMore ? AppColors.primary : AppColors.textMuted}
        />
        <Text style={[styles.tabLabel, isMore && styles.tabLabelActive]}>More</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 72,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 8,
    borderTopWidth: 1,
    borderTopColor: AppColors.border,
    shadowColor: '#1E1B4B',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 8,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
  },
  tabLabel: {
    fontSize: 10.5,
    fontWeight: '500',
    color: AppColors.textMuted,
    marginTop: 3,
  },
  tabLabelActive: {
    color: AppColors.primary,
    fontWeight: '700',
  },
  centerButtonWrapper: {
    top: -18,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  centerButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: AppColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: AppColors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
  },
});

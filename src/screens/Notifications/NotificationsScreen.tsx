import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  FlatList,
  Dimensions,
  StatusBar,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon, { type MaterialIconsIconName } from '@react-native-vector-icons/material-icons';
import { AppColors, AppRadius, AppShadows } from '../theme/AppColors';
import { FadeInUp, SpringTouch } from '../theme/Animations';

export type NotifType = 'orders' | 'repairs' | 'lowStock' | 'payments' | 'aiAlerts';

export interface NotificationItem {
  id: string;
  type: NotifType;
  title: string;
  message: string;
  time: string;
  unread: boolean;
  drawerScreen?: string;
  nestedScreen?: string;
}

interface TypeMeta {
  icon: MaterialIconsIconName;
  color: string;
  bg: string;
}

function getTypeMeta(type: NotifType): TypeMeta {
  switch (type) {
    case 'orders':
      return { icon: 'shopping-bag', color: '#0EA5E9', bg: '#E0F2FE' };
    case 'repairs':
      return { icon: 'build', color: '#0D9488', bg: '#CCFBF1' };
    case 'lowStock':
      return { icon: 'inventory-2', color: '#F59E0B', bg: '#FEF3C7' };
    case 'payments':
      return { icon: 'account-balance-wallet', color: '#10B981', bg: '#D1FAE5' };
    case 'aiAlerts':
      return { icon: 'auto-awesome', color: '#5B4DF8', bg: '#EEECFE' };
    default:
      return { icon: 'notifications', color: '#5B4DF8', bg: '#EEECFE' };
  }
}

const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: '1',
    type: 'orders',
    title: 'New order received',
    message: 'Order #OD-2041 from Ravi Kumar - ₹15,499',
    time: '5 min ago',
    unread: true,
    drawerScreen: 'Orders',
    nestedScreen: 'OrdersHome',
  },
  {
    id: '2',
    type: 'aiAlerts',
    title: 'AI Insight ready',
    message: 'Sales are trending 8% above forecast this week',
    time: '22 min ago',
    unread: true,
    drawerScreen: 'AiInsights',
  },
  {
    id: '3',
    type: 'lowStock',
    title: 'Low stock alert',
    message: 'Boat Airdopes 141 - only 3 units left',
    time: '1 hr ago',
    unread: true,
    drawerScreen: 'Inventory',
    nestedScreen: 'LowStockAlert',
  },
  {
    id: '4',
    type: 'repairs',
    title: 'Repair ready for pickup',
    message: 'RT-3018 - OnePlus 9 is ready for Ahmed Khan',
    time: '2 hr ago',
    unread: false,
    drawerScreen: 'Repairs',
    nestedScreen: 'RepairsHome',
  },
  {
    id: '5',
    type: 'payments',
    title: 'Payment received',
    message: '₹2,500 received from Ravi Kumar',
    time: '3 hr ago',
    unread: false,
    drawerScreen: 'Sales',
    nestedScreen: 'SalesHistory',
  },
  {
    id: '6',
    type: 'orders',
    title: 'Order delivered',
    message: 'Order #OD-2020 marked as delivered',
    time: 'Yesterday',
    unread: false,
    drawerScreen: 'Orders',
    nestedScreen: 'OrdersHome',
  },
  {
    id: '7',
    type: 'payments',
    title: 'EMI due reminder',
    message: 'Sunita Reddy has ₹5,400 EMI due in 2 days',
    time: 'Yesterday',
    unread: false,
    drawerScreen: 'Finance',
    nestedScreen: 'Emi',
  },
];

const FILTER_OPTIONS: { label: string; value: NotifType | null }[] = [
  { label: 'All', value: null },
  { label: 'Orders', value: 'orders' },
  { label: 'Repairs', value: 'repairs' },
  { label: 'Low stock', value: 'lowStock' },
  { label: 'Payments', value: 'payments' },
  { label: 'AI alerts', value: 'aiAlerts' },
];

export default function NotificationsScreen() {
  const navigation = useNavigation<any>();
  const [filter, setFilter] = useState<NotifType | null>(null);
  const [notifications, setNotifications] = useState<NotificationItem[]>(INITIAL_NOTIFICATIONS);

  const filteredNotifications = useMemo(() => {
    if (!filter) return notifications;
    return notifications.filter((n) => n.type === filter);
  }, [filter, notifications]);

  const unreadCount = useMemo(
    () => notifications.filter((n) => n.unread).length,
    [notifications]
  );

  const handleMarkAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })));
  };

  const handleNotificationPress = (notif: NotificationItem) => {
    // Mark this specific notification as read
    setNotifications((prev) =>
      prev.map((n) => (n.id === notif.id ? { ...n, unread: false } : n))
    );

    // Optional navigation to destination screen
    if (notif.drawerScreen) {
      try {
        if (notif.nestedScreen) {
          navigation.navigate(notif.drawerScreen, { screen: notif.nestedScreen });
        } else {
          navigation.navigate(notif.drawerScreen);
        }
      } catch (err) {
        console.warn('Notification navigation error:', err);
      }
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* APP BAR / HEADER */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
          >
            <Icon name="arrow-back" size={22} color={AppColors.textPrimary} />
          </TouchableOpacity>

          <View style={styles.headerTextGroup}>
            <Text style={styles.headerTitle}>Notifications</Text>
            <Text style={styles.headerSubtitle}>{unreadCount} unread</Text>
          </View>
        </View>

        {unreadCount > 0 && (
          <TouchableOpacity
            style={styles.markAllButton}
            onPress={handleMarkAllRead}
            activeOpacity={0.7}
          >
            <Text style={styles.markAllText}>Mark all read</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* FILTER CHIPS (HORIZONTAL SCROLL) */}
      <View style={styles.filterContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScroll}
        >
          {FILTER_OPTIONS.map((opt) => {
            const isSelected = filter === opt.value;
            return (
              <TouchableOpacity
                key={opt.label}
                activeOpacity={0.75}
                onPress={() => setFilter(opt.value)}
                style={[
                  styles.filterChip,
                  isSelected ? styles.filterChipActive : styles.filterChipInactive,
                ]}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    isSelected ? styles.filterChipTextActive : styles.filterChipTextInactive,
                  ]}
                >
                  {opt.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* NOTIFICATIONS LIST */}
      {filteredNotifications.length === 0 ? (
        <View style={styles.emptyState}>
          <View style={styles.emptyIconWrap}>
            <Icon name="notifications-none" size={44} color={AppColors.textMuted} />
          </View>
          <Text style={styles.emptyTitle}>No notifications</Text>
          <Text style={styles.emptySubtitle}>You're all caught up for this category.</Text>
        </View>
      ) : (
        <FlatList
          data={filteredNotifications}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          renderItem={({ item, index }) => {
            const meta = getTypeMeta(item.type);
            return (
              <FadeInUp delay={index * 40} style={{ width: '100%' }}>
                <SpringTouch
                  style={{ width: '100%' }}
                  onPress={() => handleNotificationPress(item)}
                >
                  <View
                    style={[
                      styles.notifCard,
                      item.unread ? styles.notifCardUnread : styles.notifCardRead,
                    ]}
                  >
                    <View
                      style={[
                        styles.notifIconBox,
                        { backgroundColor: meta.bg },
                      ]}
                    >
                      <Icon name={meta.icon} size={18} color={meta.color} />
                    </View>

                    <View style={styles.notifContent}>
                      <View style={styles.notifTitleRow}>
                        <Text style={styles.notifTitle} numberOfLines={1}>
                          {item.title}
                        </Text>
                        {item.unread && <View style={styles.unreadDot} />}
                      </View>

                      <Text style={styles.notifMessage} numberOfLines={2}>
                        {item.message}
                      </Text>

                      <Text style={styles.notifTime}>{item.time}</Text>
                    </View>
                  </View>
                </SpringTouch>
              </FadeInUp>
            );
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
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
    backgroundColor: AppColors.surface,
    borderBottomWidth: 1,
    borderColor: AppColors.border,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: AppColors.surfaceSoft,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: AppColors.border,
  },
  headerTextGroup: {
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: AppColors.textPrimary,
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: 12.5,
    fontWeight: '600',
    color: AppColors.textSecondary,
    marginTop: 1,
  },
  markAllButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 14,
    backgroundColor: AppColors.primarySoft,
  },
  markAllText: {
    color: AppColors.primary,
    fontSize: 12.5,
    fontWeight: '700',
  },

  /* FILTER CHIPS */
  filterContainer: {
    backgroundColor: AppColors.background,
    paddingVertical: 10,
  },
  filterScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterChipActive: {
    backgroundColor: AppColors.primary,
    borderColor: AppColors.primary,
    ...AppShadows.subtle,
  },
  filterChipInactive: {
    backgroundColor: AppColors.surface,
    borderColor: AppColors.border,
  },
  filterChipText: {
    fontSize: 12.5,
    fontWeight: '600',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  filterChipTextInactive: {
    color: AppColors.textSecondary,
  },

  /* LIST */
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 32,
    gap: 10,
  },
  notifCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 13,
    borderRadius: 16,
    borderWidth: 1,
    ...AppShadows.card,
  },
  notifCardUnread: {
    backgroundColor: '#FAF9FF',
    borderColor: 'rgba(91, 77, 248, 0.28)',
  },
  notifCardRead: {
    backgroundColor: AppColors.surface,
    borderColor: AppColors.border,
  },
  notifIconBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  notifContent: {
    flex: 1,
  },
  notifTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 3,
  },
  notifTitle: {
    fontSize: 13.5,
    fontWeight: '700',
    color: AppColors.textPrimary,
    flex: 1,
    letterSpacing: -0.2,
  },
  unreadDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: AppColors.primary,
    marginLeft: 6,
  },
  notifMessage: {
    fontSize: 12,
    color: AppColors.textSecondary,
    lineHeight: 17,
    marginBottom: 5,
  },
  notifTime: {
    fontSize: 11,
    fontWeight: '600',
    color: AppColors.textMuted,
  },

  /* EMPTY STATE */
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingBottom: 60,
  },
  emptyIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: AppColors.surfaceSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
    borderWidth: 1,
    borderColor: AppColors.border,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: AppColors.textPrimary,
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 13,
    color: AppColors.textMuted,
    textAlign: 'center',
  },
});

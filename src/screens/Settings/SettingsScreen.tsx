import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon, { type MaterialIconsIconName } from '@react-native-vector-icons/material-icons';
import { supabase } from '../../lib/supabase';
import { AppColors, AppShadows } from '../theme/AppColors';
import { FadeInUp, SpringTouch } from '../theme/Animations';

interface SettingsTileProps {
  icon: MaterialIconsIconName;
  label: string;
  color: string;
  bg: string;
  onPress: () => void;
  isLast?: boolean;
}

function SettingsTile({
  icon,
  label,
  color,
  bg,
  onPress,
  isLast = false,
}: SettingsTileProps) {
  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onPress}
      style={[styles.tileContainer, !isLast && styles.tileBorder]}
    >
      <View style={[styles.tileIconBox, { backgroundColor: bg }]}>
        <Icon name={icon} size={18} color={color} />
      </View>
      <Text style={styles.tileLabel}>{label}</Text>
      <Icon name="chevron-right" size={20} color={AppColors.textMuted} />
    </TouchableOpacity>
  );
}

function SettingsGroup({ children }: { children: React.ReactNode }) {
  return <View style={styles.groupCard}>{children}</View>;
}

function SectionLabel({ text }: { text: string }) {
  return <Text style={styles.sectionLabel}>{text.toUpperCase()}</Text>;
}

export default function SettingsScreen() {
  const navigation = useNavigation<any>();
  const [userName, setUserName] = useState('Abhishek');
  const [userEmail, setUserEmail] = useState('Owner · AI Business Hub');
  const [initials, setInitials] = useState('AB');
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        const fullName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'Abhishek';
        setUserName(fullName);
        const email = user.email ? `Owner · ${user.email}` : "Owner · Maamaa's Movers";
        setUserEmail(email);
        const parts = fullName.trim().split(' ');
        const inits = parts.length > 1
          ? (parts[0][0] + parts[1][0]).toUpperCase()
          : fullName.slice(0, 2).toUpperCase();
        setInitials(inits || 'AB');
      }
    }).catch((err) => {
      console.warn('Error fetching user for settings:', err);
    });
  }, []);

  const handleLogout = () => {
    Alert.alert(
      'Log Out',
      'Are you sure you want to log out of your account?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Log out',
          style: 'destructive',
          onPress: async () => {
            setLoggingOut(true);
            try {
              await supabase.auth.signOut();
            } catch (e) {
              console.warn('Logout signOut error:', e);
            } finally {
              setLoggingOut(false);
              // Safely reset navigation back to Login screen
              try {
                const rootNav = navigation.getParent()?.getParent() ?? navigation.getParent() ?? navigation;
                rootNav.reset({
                  index: 0,
                  routes: [{ name: 'Login' }],
                });
              } catch {
                try {
                  navigation.reset({
                    index: 0,
                    routes: [{ name: 'Login' }],
                  });
                } catch {
                  navigation.navigate('Login');
                }
              }
            }
          },
        },
      ]
    );
  };

  const handleFeaturePress = (featureName: string) => {
    Alert.alert(featureName, `${featureName} settings panel is active and managed by AI enterprise console.`);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* HEADER */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
          >
            <Icon name="arrow-back" size={22} color={AppColors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Settings</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* PROFILE HEADER CARD */}
        <FadeInUp delay={30}>
          <SpringTouch
            style={{ width: '100%' }}
            onPress={() => handleFeaturePress('User Profile')}
          >
            <View style={styles.profileCard}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{initials}</Text>
              </View>
              <View style={styles.profileInfo}>
                <Text style={styles.profileName}>{userName}</Text>
                <Text style={styles.profileRole} numberOfLines={1}>{userEmail}</Text>
              </View>
              <Icon name="chevron-right" size={20} color={AppColors.textMuted} />
            </View>
          </SpringTouch>
        </FadeInUp>

        {/* ACCOUNT SECTION */}
        <FadeInUp delay={60}>
          <SectionLabel text="Account" />
          <SettingsGroup>
            <SettingsTile
              icon="person-outline"
              label="Profile"
              color={AppColors.primary}
              bg="#EEECFE"
              onPress={() => handleFeaturePress('Profile')}
            />
            <SettingsTile
              icon="storefront"
              label="Business details"
              color="#0EA5E9"
              bg="#E0F2FE"
              onPress={() => handleFeaturePress('Business Details')}
            />
            <SettingsTile
              icon="workspace-premium"
              label="Subscription"
              color="#F59E0B"
              bg="#FEF3C7"
              isLast
              onPress={() => handleFeaturePress('Subscription')}
            />
          </SettingsGroup>
        </FadeInUp>

        {/* PREFERENCES SECTION */}
        <FadeInUp delay={90}>
          <SectionLabel text="Preferences" />
          <SettingsGroup>
            <SettingsTile
              icon="palette"
              label="Theme"
              color="#0D9488"
              bg="#CCFBF1"
              isLast
              onPress={() => handleFeaturePress('Theme Settings')}
            />
          </SettingsGroup>
        </FadeInUp>

        {/* SECURITY SECTION */}
        <FadeInUp delay={120}>
          <SectionLabel text="Security" />
          <SettingsGroup>
            <SettingsTile
              icon="shield"
              label="Security"
              color="#EF4444"
              bg="#FEE2E2"
              onPress={() => handleFeaturePress('Security & 2FA')}
            />
            <SettingsTile
              icon="vpn-key"
              label="API keys"
              color="#10B981"
              bg="#D1FAE5"
              isLast
              onPress={() => handleFeaturePress('API Keys & MCP Access')}
            />
          </SettingsGroup>
        </FadeInUp>

        {/* AI & AUTOMATION SECTION */}
        <FadeInUp delay={150}>
          <SectionLabel text="AI & automation" />
          <SettingsGroup>
            <SettingsTile
              icon="auto-awesome"
              label="AI settings"
              color={AppColors.primary}
              bg="#EEECFE"
              onPress={() => {
                try {
                  navigation.navigate('AiInsights');
                } catch {
                  handleFeaturePress('AI Settings');
                }
              }}
            />
            <SettingsTile
              icon="hub"
              label="MCP settings"
              color="#0EA5E9"
              bg="#E0F2FE"
              isLast
              onPress={() => {
                try {
                  navigation.navigate('McpTools');
                } catch {
                  handleFeaturePress('MCP Tools');
                }
              }}
            />
          </SettingsGroup>
        </FadeInUp>

        {/* LOG OUT BUTTON */}
        <FadeInUp delay={180}>
          <TouchableOpacity
            style={[styles.logoutButton, loggingOut && { opacity: 0.6 }]}
            onPress={handleLogout}
            disabled={loggingOut}
            activeOpacity={0.8}
          >
            {loggingOut ? (
              <ActivityIndicator size="small" color="#EF4444" />
            ) : (
              <View style={styles.logoutBtnRow}>
                <Icon name="logout" size={18} color="#EF4444" style={{ marginRight: 8 }} />
                <Text style={styles.logoutButtonText}>Log out</Text>
              </View>
            )}
          </TouchableOpacity>
        </FadeInUp>
      </ScrollView>
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
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: AppColors.textPrimary,
    letterSpacing: -0.3,
  },

  /* SCROLL VIEW */
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 36,
  },

  /* PROFILE CARD */
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: AppColors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: AppColors.border,
    ...AppShadows.card,
    marginBottom: 20,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#EEECFE',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 13,
  },
  avatarText: {
    fontSize: 17,
    fontWeight: '700',
    color: AppColors.primary,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 15.5,
    fontWeight: '700',
    color: AppColors.textPrimary,
  },
  profileRole: {
    fontSize: 12,
    color: AppColors.textSecondary,
    marginTop: 2,
  },

  /* SECTION LABEL */
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: AppColors.textMuted,
    letterSpacing: 0.4,
    marginBottom: 8,
    marginTop: 6,
  },

  /* SETTINGS GROUP CARD */
  groupCard: {
    backgroundColor: AppColors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: AppColors.border,
    overflow: 'hidden',
    marginBottom: 16,
    ...AppShadows.card,
  },

  /* TILE */
  tileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 13,
  },
  tileBorder: {
    borderBottomWidth: 1,
    borderBottomColor: AppColors.border,
  },
  tileIconBox: {
    width: 32,
    height: 32,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  tileLabel: {
    flex: 1,
    fontSize: 13.5,
    fontWeight: '600',
    color: AppColors.textPrimary,
  },

  /* LOGOUT BUTTON */
  logoutButton: {
    backgroundColor: '#FEE2E2',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  logoutBtnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutButtonText: {
    color: '#EF4444',
    fontSize: 14,
    fontWeight: '700',
  },
});

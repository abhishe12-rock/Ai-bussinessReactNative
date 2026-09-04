import React, { useEffect, useRef } from 'react';
import {
  Animated,
  TouchableOpacity,
  View,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  Pressable,
} from 'react-native';
import { AppColors, AppRadius, AppShadows } from './AppColors';

interface QuantumCardProps {
  children: React.ReactNode;
  style?: ViewStyle | ViewStyle[];
  onPress?: () => void;
  activeOpacity?: number;
  glowColor?: string;
  bordered?: boolean;
}

/**
 * QuantumCard with smooth micro-interaction press feedback (scale to 0.98 and spring back)
 */
export const QuantumCard: React.FC<QuantumCardProps> = ({
  children,
  style,
  onPress,
  glowColor,
  bordered = true,
}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.975,
      useNativeDriver: true,
      speed: 25,
      bounciness: 4,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      speed: 25,
      bounciness: 6,
    }).start();
  };

  const content = (
    <Animated.View
      style={[
        styles.card,
        bordered && styles.bordered,
        glowColor ? { shadowColor: glowColor, borderColor: `${glowColor}40` } : null,
        style,
        { transform: [{ scale: scaleAnim }] },
      ]}
    >
      {children}
    </Animated.View>
  );

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={{ width: '100%' }}
      >
        {content}
      </Pressable>
    );
  }

  return content;
};

/**
 * Animated pulsating live status dot for real-time engines
 */
export const PulseDot: React.FC<{
  color?: string;
  size?: number;
}> = ({ color = AppColors.success, size = 8 }) => {
  const pulseAnim = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.35,
          duration: 1000,
          useNativeDriver: true,
        }),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, [pulseAnim]);

  return (
    <View style={[styles.pulseContainer, { width: size + 8, height: size + 8 }]}>
      <Animated.View
        style={[
          styles.pulseHalo,
          {
            width: size + 8,
            height: size + 8,
            borderRadius: (size + 8) / 2,
            backgroundColor: color,
            opacity: pulseAnim,
          },
        ]}
      />
      <View
        style={[
          styles.pulseCore,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: color,
          },
        ]}
      />
    </View>
  );
};

/**
 * Colorful pulsing skeleton loader component
 */
export const SkeletonLoader: React.FC<{
  width: number | string;
  height: number;
  borderRadius?: number;
  style?: ViewStyle;
}> = ({ width, height, borderRadius = AppRadius.md, style }) => {
  const shimmerAnim = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 0.7,
          duration: 750,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerAnim, {
          toValue: 0.3,
          duration: 750,
          useNativeDriver: true,
        }),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, [shimmerAnim]);

  return (
    <Animated.View
      style={[
        {
          width: width as any,
          height,
          borderRadius,
          backgroundColor: AppColors.surfaceSoft,
          opacity: shimmerAnim,
        },
        style,
      ]}
    />
  );
};

/**
 * Badge pill with glowing translucent backdrop
 */
export const BadgePill: React.FC<{
  label: string;
  color?: string;
  bg?: string;
  icon?: React.ReactNode;
  style?: ViewStyle;
  textStyle?: TextStyle;
}> = ({ label, color = AppColors.primary, bg, icon, style, textStyle }) => {
  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: bg ?? `${color}18`,
          borderColor: `${color}35`,
        },
        style,
      ]}
    >
      {icon}
      <Text style={[styles.badgeText, { color }, textStyle]}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: AppColors.surface,
    borderRadius: AppRadius.lg,
    padding: 16,
    ...AppShadows.card,
  },
  bordered: {
    borderWidth: 1,
    borderColor: AppColors.border,
  },
  pulseContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  pulseHalo: {
    position: 'absolute',
  },
  pulseCore: {
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: AppRadius.full,
    borderWidth: 1,
    gap: 6,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
});

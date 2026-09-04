import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Easing,
  Pressable,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from 'react-native';
import { AppColors } from './AppColors';

/**
 * 1. FadeInUp: Smooth staggered entrance animation
 * Slides content up and fades it in gracefully.
 */
interface FadeInUpProps {
  children: React.ReactNode;
  delay?: number;
  duration?: number;
  distance?: number;
  style?: StyleProp<ViewStyle>;
}

export const FadeInUp: React.FC<FadeInUpProps> = ({
  children,
  delay = 0,
  duration = 450,
  distance = 18,
  style,
}) => {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(distance)).current;

  useEffect(() => {
    const timer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: 0,
          duration,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start();
    }, delay);

    return () => clearTimeout(timer);
  }, [delay, duration, distance, opacity, translateY]);

  return (
    <Animated.View
      style={[
        style,
        {
          opacity,
          transform: [{ translateY }],
        },
      ]}
    >
      {children}
    </Animated.View>
  );
};

/**
 * 2. FloatingGeometricOrb: Continuous geometric breathing & floating shape
 * Creates elegant ambient geometric movement inside hero cards and banners.
 */
interface FloatingGeometricOrbProps {
  size: number;
  color?: string;
  top?: number | string;
  left?: number | string;
  right?: number | string;
  bottom?: number | string;
  opacity?: number;
  duration?: number;
  floatDistance?: number;
  style?: StyleProp<ViewStyle>;
}

export const FloatingGeometricOrb: React.FC<FloatingGeometricOrbProps> = ({
  size,
  color = 'rgba(255, 255, 255, 0.1)',
  top,
  left,
  right,
  bottom,
  opacity = 1,
  duration = 4000,
  floatDistance = 8,
  style,
}) => {
  const translateY = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const floatLoop = Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(translateY, {
            toValue: -floatDistance,
            duration: duration / 2,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(scale, {
            toValue: 1.06,
            duration: duration / 2,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(translateY, {
            toValue: floatDistance * 0.4,
            duration: duration / 2,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(scale, {
            toValue: 0.96,
            duration: duration / 2,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
        ]),
      ]),
    );

    floatLoop.start();
    return () => floatLoop.stop();
  }, [duration, floatDistance, translateY, scale]);

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.orbBase,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color,
          opacity,
          top: top as any,
          left: left as any,
          right: right as any,
          bottom: bottom as any,
          transform: [{ translateY }, { scale }],
        },
        style,
      ]}
    />
  );
};

/**
 * 3. SpringTouch: Tactile spring compression on press
 * Gives tactile, physics-based micro-interactions to buttons and cards.
 */
interface SpringTouchProps {
  children: React.ReactNode;
  onPress?: () => void;
  activeScale?: number;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
  disabled?: boolean;
}

export const SpringTouch: React.FC<SpringTouchProps> = ({
  children,
  onPress,
  activeScale = 0.97,
  style,
  contentStyle,
  disabled = false,
}) => {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    if (disabled) return;
    Animated.spring(scale, {
      toValue: activeScale,
      useNativeDriver: true,
      speed: 30,
      bounciness: 4,
    }).start();
  };

  const handlePressOut = () => {
    if (disabled) return;
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 25,
      bounciness: 6,
    }).start();
  };

  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={style}
    >
      <Animated.View style={[contentStyle, { transform: [{ scale }] }]}>
        {children}
      </Animated.View>
    </Pressable>
  );
};

/**
 * 4. PulsingGlow: Radiating ambient halo for live status dots and indicators
 */
interface PulsingGlowProps {
  color?: string;
  size?: number;
  glowRadius?: number;
  duration?: number;
}

export const PulsingGlow: React.FC<PulsingGlowProps> = ({
  color = '#10B981',
  size = 8,
  glowRadius = 16,
  duration = 1600,
}) => {
  const pulseAnim = useRef(new Animated.Value(0.3)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    const pulseLoop = Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 0.9,
            duration: duration / 2,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 0.25,
            duration: duration / 2,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ]),
        Animated.sequence([
          Animated.timing(scaleAnim, {
            toValue: 1.35,
            duration: duration / 2,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(scaleAnim, {
            toValue: 0.9,
            duration: duration / 2,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ]),
      ]),
    );

    pulseLoop.start();
    return () => pulseLoop.stop();
  }, [duration, pulseAnim, scaleAnim]);

  return (
    <View style={[styles.glowContainer, { width: glowRadius, height: glowRadius }]}>
      <Animated.View
        style={[
          styles.glowHalo,
          {
            width: glowRadius,
            height: glowRadius,
            borderRadius: glowRadius / 2,
            backgroundColor: color,
            opacity: pulseAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      />
      <View
        style={[
          styles.glowDot,
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

const styles = StyleSheet.create({
  orbBase: {
    position: 'absolute',
  },
  glowContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  glowHalo: {
    position: 'absolute',
  },
  glowDot: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
});

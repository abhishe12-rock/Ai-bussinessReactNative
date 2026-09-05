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

/**
 * 5. ScaleIn: Physics-based spring bounce entrance
 * Pops in cards, icons, badges, and modals with snappy spring physics.
 */
interface ScaleInProps {
  children: React.ReactNode;
  delay?: number;
  initialScale?: number;
  bounciness?: number;
  speed?: number;
  style?: StyleProp<ViewStyle>;
}

export const ScaleIn: React.FC<ScaleInProps> = ({
  children,
  delay = 0,
  initialScale = 0.7,
  bounciness = 9,
  speed = 18,
  style,
}) => {
  const scale = useRef(new Animated.Value(initialScale)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const timer = setTimeout(() => {
      Animated.parallel([
        Animated.spring(scale, {
          toValue: 1,
          bounciness,
          speed,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 320,
          useNativeDriver: true,
        }),
      ]).start();
    }, delay);

    return () => clearTimeout(timer);
  }, [delay, initialScale, bounciness, speed, scale, opacity]);

  return (
    <Animated.View style={[style, { opacity, transform: [{ scale }] }]}>
      {children}
    </Animated.View>
  );
};

/**
 * 6. SlideIn: Directional entrance with cubic bezier easing
 */
interface SlideInProps {
  children: React.ReactNode;
  direction?: 'left' | 'right' | 'up' | 'down';
  delay?: number;
  duration?: number;
  distance?: number;
  style?: StyleProp<ViewStyle>;
}

export const SlideIn: React.FC<SlideInProps> = ({
  children,
  direction = 'left',
  delay = 0,
  duration = 420,
  distance = 32,
  style,
}) => {
  const opacity = useRef(new Animated.Value(0)).current;
  const initialOffset =
    direction === 'left'
      ? -distance
      : direction === 'right'
      ? distance
      : direction === 'up'
      ? -distance
      : distance;
  const offset = useRef(new Animated.Value(initialOffset)).current;

  useEffect(() => {
    const timer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(offset, {
          toValue: 0,
          duration,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start();
    }, delay);

    return () => clearTimeout(timer);
  }, [delay, duration, offset, opacity]);

  const transform =
    direction === 'left' || direction === 'right'
      ? [{ translateX: offset }]
      : [{ translateY: offset }];

  return (
    <Animated.View style={[style, { opacity, transform }]}>
      {children}
    </Animated.View>
  );
};

/**
 * 7. PulseRing: Ambient concentric expanding sonar radar ripples
 */
interface PulseRingProps {
  size?: number;
  color?: string;
  maxScale?: number;
  duration?: number;
}

export const PulseRing: React.FC<PulseRingProps> = ({
  size = 60,
  color = '#5B4DF8',
  maxScale = 2.2,
  duration = 2400,
}) => {
  const anim1 = useRef(new Animated.Value(0)).current;
  const anim2 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const createLoop = (anim: Animated.Value, delay: number) => {
      return Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(anim, {
            toValue: 1,
            duration,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(anim, {
            toValue: 0,
            duration: 0,
            useNativeDriver: true,
          }),
        ]),
      );
    };

    const loop1 = createLoop(anim1, 0);
    const loop2 = createLoop(anim2, duration / 2);

    loop1.start();
    loop2.start();

    return () => {
      loop1.stop();
      loop2.stop();
    };
  }, [anim1, anim2, duration]);

  const renderRing = (anim: Animated.Value, key: string) => {
    const scale = anim.interpolate({
      inputRange: [0, 1],
      outputRange: [0.95, maxScale],
    });
    const opacity = anim.interpolate({
      inputRange: [0, 0.35, 1],
      outputRange: [0.55, 0.25, 0],
    });

    return (
      <Animated.View
        key={key}
        pointerEvents="none"
        style={[
          styles.ring,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            borderColor: color,
            borderWidth: 1.5,
            opacity,
            transform: [{ scale }],
          },
        ]}
      />
    );
  };

  return (
    <View style={[styles.ringContainer, { width: size, height: size }]}>
      {renderRing(anim1, 'ring-1')}
      {renderRing(anim2, 'ring-2')}
    </View>
  );
};

/**
 * 8. BreathingView: Ambient organic scale breathing loop
 */
interface BreathingViewProps {
  children: React.ReactNode;
  duration?: number;
  minScale?: number;
  maxScale?: number;
  style?: StyleProp<ViewStyle>;
}

export const BreathingView: React.FC<BreathingViewProps> = ({
  children,
  duration = 3000,
  minScale = 0.97,
  maxScale = 1.03,
  style,
}) => {
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(scale, {
          toValue: maxScale,
          duration: duration / 2,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(scale, {
          toValue: minScale,
          duration: duration / 2,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [duration, minScale, maxScale, scale]);

  return (
    <Animated.View style={[style, { transform: [{ scale }] }]}>
      {children}
    </Animated.View>
  );
};

/**
 * 9. ShakeView: Haptic-like horizontal spring shake for form validation feedback
 */
interface ShakeViewProps {
  children: React.ReactNode;
  trigger?: any;
  amplitude?: number;
  style?: StyleProp<ViewStyle>;
}

export const ShakeView: React.FC<ShakeViewProps> = ({
  children,
  trigger,
  amplitude = 10,
  style,
}) => {
  const shakeX = useRef(new Animated.Value(0)).current;
  const isInitial = useRef(true);

  useEffect(() => {
    if (isInitial.current) {
      isInitial.current = false;
      return;
    }
    if (!trigger) return;

    shakeX.setValue(0);
    Animated.sequence([
      Animated.timing(shakeX, { toValue: -amplitude, duration: 55, useNativeDriver: true }),
      Animated.timing(shakeX, { toValue: amplitude, duration: 55, useNativeDriver: true }),
      Animated.timing(shakeX, { toValue: -amplitude * 0.65, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeX, { toValue: amplitude * 0.65, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeX, { toValue: -amplitude * 0.3, duration: 45, useNativeDriver: true }),
      Animated.timing(shakeX, { toValue: 0, duration: 45, useNativeDriver: true }),
    ]).start();
  }, [trigger, amplitude, shakeX]);

  return (
    <Animated.View style={[style, { transform: [{ translateX: shakeX }] }]}>
      {children}
    </Animated.View>
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
  ringContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ring: {
    position: 'absolute',
  },
});

import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  StatusBar,
  Dimensions,
} from 'react-native';
import Colors from '../theme/colors';

const { width, height } = Dimensions.get('window');

const SplashScreen = ({ onDone }) => {
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.88)).current;
  const subtitleOpacity = useRef(new Animated.Value(0)).current;
  const buttonOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      // Logo entrance
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.spring(scale, {
          toValue: 1,
          tension: 60,
          friction: 8,
          useNativeDriver: true,
        }),
      ]),
      // Tagline fade in
      Animated.timing(subtitleOpacity, {
        toValue: 1,
        duration: 500,
        delay: 200,
        useNativeDriver: true,
      }),
      // CTA fade in
      Animated.timing(buttonOpacity, {
        toValue: 1,
        duration: 400,
        delay: 300,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.bg} />

      {/* Subtle background glow */}
      <View style={styles.glow} />

      <View style={styles.centerContent}>
        {/* Logo */}
        <Animated.View style={{ opacity, transform: [{ scale }] }}>
          <Text style={styles.logo}>sidenote</Text>
          <View style={styles.logoUnderline} />
        </Animated.View>

        {/* Tagline */}
        <Animated.Text style={[styles.tagline, { opacity: subtitleOpacity }]}>
          your AI study partner
        </Animated.Text>
      </View>

      {/* CTA */}
      <Animated.View style={[styles.ctaContainer, { opacity: buttonOpacity }]}>
        <TouchableOpacity style={styles.ctaButton} onPress={onDone} activeOpacity={0.8}>
          <Text style={styles.ctaText}>Get started</Text>
        </TouchableOpacity>
        <Text style={styles.ctaSubtext}>Already have an account? <Text style={styles.ctaLink}>Sign in</Text></Text>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glow: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: Colors.yellow,
    opacity: 0.04,
    top: height * 0.25,
    alignSelf: 'center',
  },
  centerContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  logo: {
    color: Colors.textPrimary,
    fontSize: 48,
    fontWeight: '700',
    letterSpacing: -1.5,
    textAlign: 'center',
  },
  logoUnderline: {
    height: 3,
    backgroundColor: Colors.yellow,
    borderRadius: 2,
    marginTop: 4,
    width: '60%',
    alignSelf: 'flex-end',
  },
  tagline: {
    color: Colors.textMuted,
    fontSize: 15,
    letterSpacing: 0.3,
    marginTop: 4,
  },
  ctaContainer: {
    width: '100%',
    paddingHorizontal: 32,
    paddingBottom: 52,
    alignItems: 'center',
    gap: 16,
  },
  ctaButton: {
    width: '100%',
    backgroundColor: Colors.yellow,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  ctaText: {
    color: '#1C1C1E',
    fontWeight: '700',
    fontSize: 16,
    letterSpacing: 0.2,
  },
  ctaSubtext: {
    color: Colors.textMuted,
    fontSize: 13,
  },
  ctaLink: {
    color: Colors.yellow,
    fontWeight: '600',
  },
});

export default SplashScreen;

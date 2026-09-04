import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useFonts, Caveat_700Bold } from '@expo-google-fonts/caveat';
import Colors from '../theme/colors';

const SplashScreen = ({ navigation }) => {
  const [fontsLoaded] = useFonts({
    Caveat_700Bold,
  });

  const iconOpacity = useRef(new Animated.Value(0)).current;
  const iconScale = useRef(new Animated.Value(0.9)).current;
  const iconFlip = useRef(new Animated.Value(0)).current;
  const iconGlow = useRef(new Animated.Value(0)).current;
  
  const textWidth = useRef(new Animated.Value(0)).current;
  const buttonOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (fontsLoaded) {
      Animated.sequence([
        // 1. App Icon Entry: Fade + Scale up
        Animated.parallel([
          Animated.timing(iconOpacity, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.spring(iconScale, {
            toValue: 1.0,
            friction: 8,
            tension: 40,
            useNativeDriver: true,
          }),
        ]),

        // 2. Icon Micro-Animation: Pulse Glow + Subtle Flip
        Animated.parallel([
          // Soft glow pulse
          Animated.sequence([
            Animated.timing(iconGlow, {
              toValue: 1,
              duration: 400,
              useNativeDriver: true,
            }),
            Animated.timing(iconGlow, {
              toValue: 0.2, // leave a slight glow
              duration: 400,
              useNativeDriver: true,
            }),
          ]),
          // Subtle flip/wobble
          Animated.sequence([
            Animated.timing(iconFlip, {
              toValue: 1,
              duration: 300,
              useNativeDriver: true,
            }),
            Animated.timing(iconFlip, {
              toValue: 0,
              duration: 300,
              useNativeDriver: true,
            }),
          ]),
        ]),

        // 3. Brand Name: Handwritten stroke drawing (mask reveal)
        Animated.timing(textWidth, {
          toValue: 200,
          duration: 800,
          useNativeDriver: false,
        }),

        // 4. Final State: Delay then button fade in
        Animated.delay(800),
        Animated.timing(buttonOpacity, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [fontsLoaded, iconOpacity, iconScale, iconFlip, iconGlow, textWidth, buttonOpacity]);

  if (!fontsLoaded) {
    return (
      <View style={styles.fallbackContainer}>
         <StatusBar barStyle="light-content" backgroundColor="#0F0F10" />
      </View>
    );
  }

  const flipInterpolate = iconFlip.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '15deg'],
  });

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0F0F10" />
      
      <View style={styles.centerContent}>
        {/* Glow behind the icon */}
        <Animated.View style={[
          styles.glowBackground,
          { opacity: iconGlow, transform: [{ scale: iconScale }] }
        ]} />

        {/* Notebook Icon */}
        <Animated.View style={{ 
          opacity: iconOpacity,
          transform: [
            { scale: iconScale },
            { rotateY: flipInterpolate }
          ],
          marginBottom: 16,
        }}>
          <Feather name="book-open" size={48} color={Colors.yellow} />
        </Animated.View>

        {/* Handwritten Text */}
        <View style={styles.textWrapper}>
          <Animated.View style={[styles.maskView, { width: textWidth }]}>
            <Text style={styles.logoText}>sidenote</Text>
          </Animated.View>
        </View>
      </View>

      {/* Primary CTA */}
      <Animated.View style={[styles.ctaContainer, { opacity: buttonOpacity }]}>
        <TouchableOpacity 
          style={styles.ctaButton} 
          onPress={() => navigation.replace('AuthChoiceScreen')} 
          activeOpacity={0.8}
        >
          <Text style={styles.ctaText}>Get Started</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  fallbackContainer: {
    flex: 1,
    backgroundColor: '#0F0F10',
  },
  container: {
    flex: 1,
    backgroundColor: '#0F0F10',
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 60,
  },
  glowBackground: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.yellow,
    opacity: 0.15,
    top: -16, // Center behind the icon
    shadowColor: Colors.yellow,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 20,
    elevation: 10,
  },
  textWrapper: {
    width: 200,
    alignItems: 'flex-start',
    height: 70,
    justifyContent: 'center',
  },
  maskView: {
    overflow: 'hidden',
    height: 70,
    justifyContent: 'center',
  },
  logoText: {
    fontFamily: 'Caveat_700Bold',
    fontSize: 60,
    color: Colors.yellow,
    width: 200, 
    textAlign: 'center',
    includeFontPadding: false,
    textShadowColor: 'rgba(232, 212, 77, 0.4)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  ctaContainer: {
    width: '100%',
    paddingHorizontal: 32,
    paddingBottom: 60,
    alignItems: 'center',
  },
  ctaButton: {
    width: '100%',
    backgroundColor: Colors.yellow,
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
  },
  ctaText: {
    color: '#0F0F10',
    fontWeight: '700',
    fontSize: 18,
    letterSpacing: 0.3,
  },
});

export default SplashScreen;

import React, { useState, useEffect, useRef } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  StatusBar,
  Animated, 
  Easing, 
  ActivityIndicator, 
  BackHandler, 
  Platform 
} from 'react-native';
import { WebView } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS } from './src/theme/colors';

const STORAGE_KEY_SITE_URL = '@infinx_site_url';
const DEFAULT_SITE_URL = 'http://13.202.95.5:8000';

export default function App() {
  const [siteUrl, setSiteUrl] = useState(DEFAULT_SITE_URL);
  const [loading, setLoading] = useState(true);
  const [canGoBack, setCanGoBack] = useState(false);
  const [showSplash, setShowSplash] = useState(true);

  const webViewRef = useRef(null);

  // Animations
  const logoScale = useRef(new Animated.Value(0.5)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;
  const splashFade = useRef(new Animated.Value(1)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // 1. Read stored site URL
    AsyncStorage.getItem(STORAGE_KEY_SITE_URL).then((savedUrl) => {
      if (savedUrl) setSiteUrl(savedUrl);
    });

    // 2. Start Launch Splash Screen Animation Sequence
    Animated.parallel([
      Animated.timing(logoOpacity, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(logoScale, {
        toValue: 1,
        friction: 4,
        tension: 40,
        useNativeDriver: true,
      }),
      Animated.timing(textOpacity, {
        toValue: 1,
        duration: 1000,
        delay: 300,
        useNativeDriver: true,
      })
    ]).start();

    // Pulse animation loop for infinity logo
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.15,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();

    // 3. Fade out splash screen after 2.4 seconds
    const splashTimer = setTimeout(() => {
      Animated.timing(splashFade, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }).start(() => {
        setShowSplash(false);
      });
    }, 2400);

    return () => clearTimeout(splashTimer);
  }, []);

  // Handle hardware Android back button to navigate back in webview
  useEffect(() => {
    if (Platform.OS === 'android') {
      const onBackPress = () => {
        if (canGoBack && webViewRef.current) {
          webViewRef.current.goBack();
          return true;
        }
        return false;
      };
      const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => subscription.remove();
    }
  }, [canGoBack]);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent={true} />

      {/* Web View Container rendering exact site clean fullscreen */}
      <View style={styles.webContainer}>
        <WebView
          ref={webViewRef}
          source={{ uri: siteUrl }}
          style={styles.webview}
          originWhitelist={['*']}
          allowsInlineMediaPlayback={true}
          allowsFullscreenVideo={true}
          mediaPlaybackRequiresUserAction={false}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          allowFileAccess={true}
          allowUniversalAccessFromFileURLs={true}
          allowFileAccessFromFileURLs={true}
          scalesPageToFit={true}
          androidHardwareAccelerationDisabled={false}
          showsHorizontalScrollIndicator={false}
          showsVerticalScrollIndicator={false}
          onNavigationStateChange={(navState) => {
            setCanGoBack(navState.canGoBack);
          }}
          onLoadStart={() => setLoading(true)}
          onLoadEnd={() => setLoading(false)}
        />

        {/* Minimal Subtle Loading Bar */}
        {loading && !showSplash && (
          <View style={styles.miniLoadingBar}>
            <ActivityIndicator size="small" color={COLORS.primary} />
          </View>
        )}
      </View>

      {/* Animated Launch Splash Screen */}
      {showSplash && (
        <Animated.View style={[styles.splashContainer, { opacity: splashFade }]}>
          <Animated.View 
            style={[
              styles.logoBox, 
              { transform: [{ scale: Animated.multiply(logoScale, pulseAnim) }], opacity: logoOpacity }
            ]}
          >
            <View style={styles.glowRing} />
            <Ionicons name="infinite" size={72} color={COLORS.primary} />
          </Animated.View>

          <Animated.View style={[styles.textBox, { opacity: textOpacity }]}>
            <Text style={styles.splashTitle}>
              Infinx <Text style={styles.splashTitlePink}>Anime</Text>
            </Text>
            <Text style={styles.splashSubtitle}>WATCH ANIME & MOVIES ONLINE</Text>
          </Animated.View>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  webContainer: {
    flex: 1,
    position: 'relative',
    backgroundColor: '#000000',
  },
  webview: {
    flex: 1,
    backgroundColor: '#000000',
  },
  miniLoadingBar: {
    position: 'absolute',
    top: 10,
    right: 12,
    zIndex: 99,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    padding: 6,
    borderRadius: 20,
  },
  splashContainer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 999,
    gap: 20,
  },
  logoBox: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: 'rgba(255, 0, 85, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 0, 85, 0.4)',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 25,
    elevation: 12,
  },
  glowRing: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(255, 0, 85, 0.06)',
  },
  textBox: {
    alignItems: 'center',
    gap: 6,
  },
  splashTitle: {
    color: '#ffffff',
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  splashTitlePink: {
    color: COLORS.primary,
  },
  splashSubtitle: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 2,
  },
});

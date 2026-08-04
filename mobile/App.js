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
  Platform,
  Dimensions
} from 'react-native';
import { WebView } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ScreenOrientation from 'expo-screen-orientation';
import { COLORS } from './src/theme/colors';

const STORAGE_KEY_SITE_URL = '@infinx_site_url';
const DEFAULT_SITE_URL = 'http://13.202.95.5:8000';

export default function App() {
  const [siteUrl, setSiteUrl] = useState(DEFAULT_SITE_URL);
  const [loading, setLoading] = useState(true);
  const [canGoBack, setCanGoBack] = useState(false);
  const [showSplash, setShowSplash] = useState(true);
  const [progress, setProgress] = useState(0);

  const webViewRef = useRef(null);
  const progressAnim = useRef(new Animated.Value(0)).current;

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

    // 2. Start Launch Splash Screen Animation Sequence (Smoother)
    Animated.parallel([
      Animated.timing(logoOpacity, {
        toValue: 1,
        duration: 600,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.spring(logoScale, {
        toValue: 1,
        friction: 6,
        tension: 50,
        useNativeDriver: true,
      }),
      Animated.timing(textOpacity, {
        toValue: 1,
        duration: 800,
        delay: 200,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      })
    ]).start();

    // Pulse animation loop for infinity logo
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 1200,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1200,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    ).start();

    // 3. Fade out splash screen (Faster)
    const splashTimer = setTimeout(() => {
      Animated.timing(splashFade, {
        toValue: 0,
        duration: 400,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }).start(() => {
        setShowSplash(false);
      });
    }, 2000);

    return () => clearTimeout(splashTimer);
  }, []);

  // Progress Bar Animation
  useEffect(() => {
    if (loading) {
      Animated.timing(progressAnim, {
        toValue: progress,
        duration: 300,
        useNativeDriver: false,
      }).start();
    } else {
      Animated.timing(progressAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: false,
      }).start(() => {
        progressAnim.setValue(0);
      });
    }
  }, [progress, loading]);

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

  // Handle Fullscreen Rotation logic
  const onMessage = async (event) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'fullscreen') {
        if (data.isFullscreen) {
          await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);
        } else {
          await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
        }
      }
    } catch (e) {
      // Not our message
    }
  };

  const injectedJSBefore = `
    (function() {
      // 1. HARD SHIELD - Pre-declare conflicting variables BEFORE site scripts run
      window.fitScreenBtn = window.fitScreenBtn || null;

      // Prevent the site from blocking console or other vital APIs
      const originalDefineProperty = Object.defineProperty;
      window.defineProperty = originalDefineProperty;
    })();
    true;
  `;

  const injectedJS = `
    (function() {
      // 2. ACTIVE RECOVERY HEARTBEAT
      // Scan for video elements every second and force them to play if they hang
      setInterval(function() {
        const videos = document.querySelectorAll('video');
        videos.forEach(v => {
          if (v.paused && v.readyState >= 1) {
            v.play().catch(e => {});
          }
        });
      }, 1000);

      try {
        function emit(isFullscreen) {
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'fullscreen',
            isFullscreen: isFullscreen
          }));
        }

        document.addEventListener('fullscreenchange', function() {
          emit(!!document.fullscreenElement);
        });
        document.addEventListener('webkitfullscreenchange', function() {
          emit(!!document.webkitIsFullScreen);
        });
        document.addEventListener('mozfullscreenchange', function() {
          emit(!!document.mozFullScreen);
        });
        document.addEventListener('msfullscreenchange', function() {
          emit(!!document.msFullscreenElement);
        });
      } catch(e) {}
    })();
    true;
  `;

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
          databaseEnabled={true}
          cacheEnabled={true}
          cacheMode="LOAD_DEFAULT"
          mixedContentMode="always"
          thirdPartyCookiesEnabled={true}
          sharedCookiesEnabled={true}
          allowsBackgroundMediaPlayback={true}
          overScrollMode="never"
          androidLayerType="hardware"
          javaScriptCanOpenWindowsAutomatically={true}
          userAgent="Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Mobile Safari/537.36"
          allowFileAccess={true}
          allowUniversalAccessFromFileURLs={true}
          allowFileAccessFromFileURLs={true}
          scalesPageToFit={true}
          androidHardwareAccelerationDisabled={false}
          showsHorizontalScrollIndicator={false}
          showsVerticalScrollIndicator={false}
          pullToRefreshEnabled={true}
          injectedJavaScriptBeforeContentLoaded={injectedJSBefore}
          injectedJavaScript={injectedJS}
          onMessage={onMessage}
          onNavigationStateChange={(navState) => {
            setCanGoBack(navState.canGoBack);
          }}
          onRenderProcessGone={() => {
            console.log('WebView process crashed. Reloading...');
            webViewRef.current?.reload();
          }}
          onLoadProgress={({ nativeEvent }) => setProgress(nativeEvent.progress)}
          onLoadStart={() => setLoading(true)}
          onLoadEnd={() => setLoading(false)}
          onError={() => setLoading(false)}
          onHttpError={() => setLoading(false)}
        />

        {/* Improved Progress Loading Bar */}
        {loading && !showSplash && (
          <View style={styles.progressContainer}>
            <Animated.View
              style={[
                styles.progressBar,
                {
                  width: progressAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0%', '100%']
                  })
                }
              ]}
            />
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
  progressContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
    zIndex: 100,
    backgroundColor: 'transparent',
  },
  progressBar: {
    height: '100%',
    backgroundColor: COLORS.primary,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 5,
    elevation: 5,
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

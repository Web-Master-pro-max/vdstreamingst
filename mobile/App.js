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
  const [currentUri, setCurrentUri] = useState(DEFAULT_SITE_URL);
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
      if (savedUrl) {
        setSiteUrl(savedUrl);
        setCurrentUri(savedUrl);
      }
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

    // Safety fallback timer to hide progress bar if loading stalls
    const fallbackTimer = setTimeout(() => {
      setLoading(false);
    }, 3500);

    return () => {
      clearTimeout(splashTimer);
      clearTimeout(fallbackTimer);
    };
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
      // Silence parsing errors for non-app messages
    }
  };

  const injectedJSBefore = `
    (function() {
      try {
        localStorage.setItem('infinx_server_url', '${siteUrl}');
      } catch(e) {}
      
      try {
        var style = document.createElement('style');
        style.id = 'injected-header-fix';
        style.innerHTML = \`
          .site-header {
            padding-top: 0px !important;
            margin-top: 0px !important;
            height: 52px !important;
            min-height: 52px !important;
            max-height: 52px !important;
            box-sizing: border-box !important;
          }
          header {
            padding-top: 0px !important;
            margin-top: 0px !important;
            height: 54px !important;
            min-height: 54px !important;
            max-height: 54px !important;
            box-sizing: border-box !important;
          }
        \`;
        if (document.head) {
          document.head.appendChild(style);
        } else {
          document.addEventListener('DOMContentLoaded', function() {
            if (document.head) document.head.appendChild(style);
          });
        }
      } catch(e) {}

      window.fitScreenBtn = window.fitScreenBtn || null;
      const originalDefineProperty = Object.defineProperty;
      window.defineProperty = originalDefineProperty;
    })();
    true;
  `;

  const localBundleUri = Platform.OS === 'android' ? 'file:///android_asset/web/index.html' : siteUrl;

  const injectedJS = `
    (function() {
      // 2. ACTIVE RECOVERY & FULLSCREEN DETECTION
      let lastState = false;

      function emit(isFullscreen) {
        if (isFullscreen !== lastState) {
          lastState = isFullscreen;
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'fullscreen',
            isFullscreen: isFullscreen
          }));
        }
      }

      // Track all video elements (including those added dynamically)
      function attachVideoListeners() {
        const videos = document.querySelectorAll('video');
        videos.forEach(v => {
          if (!v._fsListenersAttached) {
            v.addEventListener('webkitbeginfullscreen', () => emit(true));
            v.addEventListener('webkitendfullscreen', () => emit(false));
            v._fsListenersAttached = true;
          }
        });
      }

      // Generic listeners
      document.addEventListener('fullscreenchange', () => emit(!!document.fullscreenElement));
      document.addEventListener('webkitfullscreenchange', () => emit(!!document.webkitIsFullScreen));

      // Continuous Heartbeat (Check every 1s)
      setInterval(function() {
        attachVideoListeners();

        // Final fallback check
        const isFS = !!(document.fullscreenElement || document.webkitFullscreenElement || document.querySelector('video:fullscreen'));
        emit(isFS);
      }, 1000);

    })();
    true;
  `;

  const handleWebViewError = (syntheticEvent) => {
    const { nativeEvent } = syntheticEvent;
    console.warn('WebView load error: ', nativeEvent);
    if (currentUri !== 'file:///android_asset/web/index.html' && Platform.OS === 'android') {
      setCurrentUri('file:///android_asset/web/index.html');
    } else if (currentUri !== DEFAULT_SITE_URL) {
      setCurrentUri(DEFAULT_SITE_URL);
    }
    setLoading(false);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000000" translucent={true} />

      {/* Web View Container rendering exact site clean fullscreen */}
      <View style={styles.webContainer}>
        <WebView
          ref={webViewRef}
          source={{ uri: currentUri }}
          injectedJavaScriptBeforeContentLoaded={injectedJSBefore}
          injectedJavaScript={injectedJS}
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
          renderToHardwareTextureAndroid={true}
          decelerationRate="normal"
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
          onError={handleWebViewError}
          onHttpError={handleWebViewError}
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
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 30) : 0,
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

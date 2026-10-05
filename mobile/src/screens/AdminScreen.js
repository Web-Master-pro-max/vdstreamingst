import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
  Platform,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../theme/colors';
import { getApiBaseUrl, getAuthSession } from '../services/api';

export const AdminScreen = ({ navigation }) => {
  const [adminUrl, setAdminUrl] = useState('');
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [canGoBack, setCanGoBack] = useState(false);
  const webViewRef = useRef(null);

  useEffect(() => {
    const init = async () => {
      const baseUrl = await getApiBaseUrl();
      const sess = await getAuthSession();
      setSession(sess);
      setAdminUrl(`${baseUrl}/admin.html`);
    };
    init();
  }, []);

  const handleBack = () => {
    if (canGoBack && webViewRef.current) {
      webViewRef.current.goBack();
    } else {
      navigation.goBack();
    }
  };

  const handleOpenBrowser = () => {
    if (adminUrl) {
      Linking.openURL(adminUrl).catch(() => {});
    }
  };

  // Mobile styles injected into the admin portal WebView
  const mobileStyles = `
    html {
      font-size: 85% !important;
      -webkit-text-size-adjust: 100% !important;
    }
    body {
      font-size: 1.35rem !important;
      overflow-x: hidden !important;
      width: 100% !important;
      max-width: 100vw !important;
    }
    header {
      height: 54px !important;
      padding: 0 14px !important;
    }
    header .btn-back {
      display: none !important;
    }
    header .logo {
      pointer-events: none !important;
      cursor: default !important;
    }
    .logo {
      font-size: 1.6rem !important;
    }
    .logo i {
      font-size: 2rem !important;
    }
    .btn-back {
      padding: 6px 12px !important;
      font-size: 1.15rem !important;
    }
    .admin-container {
      width: 100% !important;
      max-width: 100vw !important;
      margin: 8px auto !important;
      padding: 10px !important;
      display: flex !important;
      flex-direction: column !important;
      gap: 14px !important;
      box-sizing: border-box !important;
      overflow-x: hidden !important;
    }
    .sidebar {
      width: 100% !important;
      padding: 10px !important;
      border-radius: 12px !important;
      background: #141424 !important;
      border: 1px solid rgba(255, 255, 255, 0.08) !important;
      box-sizing: border-box !important;
    }
    .sidebar-title {
      display: none !important;
    }
    .sidebar-menu {
      display: grid !important;
      grid-template-columns: repeat(2, 1fr) !important;
      gap: 8px !important;
      padding: 0 !important;
    }
    .menu-item {
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      text-align: center !important;
      gap: 6px !important;
      padding: 10px 6px !important;
      font-size: 1.15rem !important;
      font-weight: 600 !important;
      border-radius: 8px !important;
      background: rgba(255, 255, 255, 0.05) !important;
      border: 1px solid rgba(255, 255, 255, 0.08) !important;
      color: #b0b0c0 !important;
    }
    .menu-item.active {
      background: var(--primary) !important;
      border-color: var(--primary) !important;
      color: #ffffff !important;
      box-shadow: 0 2px 10px rgba(255, 0, 85, 0.35) !important;
      border-left: 1px solid var(--primary) !important;
    }
    .main-content {
      min-width: 0 !important;
      width: 100% !important;
      max-width: 100% !important;
      overflow-x: hidden !important;
      box-sizing: border-box !important;
    }
    .stats-grid {
      display: grid !important;
      grid-template-columns: repeat(2, 1fr) !important;
      gap: 10px !important;
      margin-bottom: 16px !important;
    }
    .stat-card {
      padding: 12px 14px !important;
      border-radius: 10px !important;
    }
    .stat-card h4 {
      font-size: 1.05rem !important;
    }
    .stat-card p {
      font-size: 1.7rem !important;
    }
    .panel-header {
      display: flex !important;
      flex-direction: column !important;
      align-items: flex-start !important;
      gap: 10px !important;
      margin-bottom: 14px !important;
    }
    .panel-header > div:first-child {
      width: 100% !important;
    }
    .panel-header > div:last-child,
    .panel-header > button {
      width: 100% !important;
      display: flex !important;
      flex-wrap: wrap !important;
      gap: 8px !important;
    }
    .panel-header .btn-back,
    .panel-header .btn-submit {
      flex: 1 !important;
      justify-content: center !important;
      margin-top: 0 !important;
      padding: 9px 14px !important;
      font-size: 1.2rem !important;
    }
    .panel-title {
      font-size: 2rem !important;
      line-height: 1.3 !important;
    }
    .panel-desc {
      font-size: 1.2rem !important;
      line-height: 1.4 !important;
    }
    .card {
      padding: 14px !important;
      border-radius: 12px !important;
      margin-bottom: 16px !important;
      box-sizing: border-box !important;
    }
    .form-grid {
      grid-template-columns: 1fr !important;
      gap: 14px !important;
    }
    .form-group.full-width {
      grid-column: span 1 !important;
    }
    input, select, textarea {
      font-size: 1.35rem !important;
      padding: 11px 14px !important;
    }
    #bannerSettingsForm {
      display: flex !important;
      flex-direction: column !important;
      align-items: stretch !important;
      gap: 12px !important;
    }
    #bannerSettingsForm .btn-submit {
      width: 100% !important;
      justify-content: center !important;
    }
    .table-responsive {
      width: 100% !important;
      max-width: 100% !important;
      overflow-x: auto !important;
      -webkit-overflow-scrolling: touch !important;
      display: block !important;
      border-radius: 8px !important;
      background: rgba(10, 10, 18, 0.7) !important;
      border: 1px solid rgba(255, 255, 255, 0.08) !important;
      box-sizing: border-box !important;
      margin-top: 8px !important;
    }
    .table-responsive table {
      width: 100% !important;
      min-width: 680px !important;
      border-collapse: separate !important;
      border-spacing: 0 !important;
    }
    .table-responsive th {
      padding: 12px 14px !important;
      font-size: 1.15rem !important;
      white-space: nowrap !important;
      background: #171728 !important;
      position: sticky !important;
      top: 0 !important;
      z-index: 2 !important;
    }
    .table-responsive td {
      padding: 12px 14px !important;
      font-size: 1.3rem !important;
      vertical-align: middle !important;
      border-bottom: 1px solid rgba(255, 255, 255, 0.05) !important;
    }
    .table-responsive button,
    .table-responsive .btn-back {
      padding: 8px 14px !important;
      font-size: 1.15rem !important;
      min-height: 38px !important;
      border-radius: 6px !important;
      white-space: nowrap !important;
      display: inline-flex !important;
      align-items: center !important;
      justify-content: center !important;
      gap: 6px !important;
      font-weight: 600 !important;
    }
    .modal > .card {
      width: 94% !important;
      max-width: 94% !important;
      padding: 16px !important;
      max-height: 88vh !important;
      overflow-y: auto !important;
    }
  `;

  // Injected JS to ensure token and role are automatically active in the admin portal
  const injectedBeforeJS = `
    (function() {
      try {
        ${session?.token ? `localStorage.setItem('infinx_token', '${session.token}');` : ''}
        ${session?.user?.email ? `localStorage.setItem('infinx_user_email', '${session.user.email}');` : ''}
        localStorage.setItem('infinx_user_role', 'ADMIN');

        var meta = document.querySelector('meta[name="viewport"]');
        if (!meta) {
          meta = document.createElement('meta');
          meta.name = 'viewport';
          document.head.appendChild(meta);
        }
        meta.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, shrink-to-fit=no';

        var styleId = 'infinx-mobile-style-fix';
        var styleEl = document.getElementById(styleId);
        if (!styleEl) {
          styleEl = document.createElement('style');
          styleEl.id = styleId;
          document.head.appendChild(styleEl);
        }
        styleEl.textContent = ${JSON.stringify(mobileStyles)};
      } catch (e) {
        console.error('Failed to inject auth or mobile styles:', e);
      }
    })();
    true;
  `;

  const injectedAfterJS = `
    (function() {
      try {
        var meta = document.querySelector('meta[name="viewport"]');
        if (!meta) {
          meta = document.createElement('meta');
          meta.name = 'viewport';
          document.head.appendChild(meta);
        }
        meta.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, shrink-to-fit=no';

        var styleId = 'infinx-mobile-style-fix';
        var styleEl = document.getElementById(styleId);
        if (!styleEl) {
          styleEl = document.createElement('style');
          styleEl.id = styleId;
          document.head.appendChild(styleEl);
        }
        styleEl.textContent = ${JSON.stringify(mobileStyles)};

        // Add subtle swipe hint above table-responsive if not already present
        document.querySelectorAll('.table-responsive').forEach(function(el) {
          if (!el.previousElementSibling || !el.previousElementSibling.classList.contains('table-swipe-hint')) {
            var hint = document.createElement('div');
            hint.className = 'table-swipe-hint';
            hint.innerHTML = '<span style="display:inline-flex;align-items:center;gap:6px;font-size:11px;color:#00a8ff;font-weight:600;margin-bottom:6px;background:rgba(0,168,255,0.08);padding:4px 10px;border-radius:12px;border:1px solid rgba(0,168,255,0.2);"><i class="fas fa-arrows-left-right"></i> Scroll table horizontally for details & actions</span>';
            el.parentNode.insertBefore(hint, el);
          }
        });
      } catch (err) {
        console.error('Post-load style error:', err);
      }
    })();
    true;
  `;

  if (!adminUrl) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Initializing Admin Portal...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0a0a0f" />

      {/* Top App Bar */}
      <View style={styles.appBar}>
        <TouchableOpacity style={styles.iconBtn} onPress={handleBack} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>

        <View style={styles.titleContainer}>
          <View style={styles.shieldBadge}>
            <Ionicons name="shield-checkmark" size={14} color={COLORS.primary} />
            <Text style={styles.badgeText}>ADMIN</Text>
          </View>
          <Text style={styles.title}>Portal</Text>
        </View>

        <View style={styles.actionGroup}>
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={() => webViewRef.current?.reload()}
            activeOpacity={0.7}
          >
            <Ionicons name="reload" size={19} color="#fff" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.iconBtn}
            onPress={handleOpenBrowser}
            activeOpacity={0.7}
          >
            <Ionicons name="open-outline" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Embedded Admin Portal WebView */}
      <View style={styles.webviewWrapper}>
        <WebView
          ref={webViewRef}
          source={{ uri: adminUrl }}
          injectedJavaScriptBeforeContentLoaded={injectedBeforeJS}
          injectedJavaScript={injectedAfterJS}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          startInLoadingState={true}
          allowsInlineMediaPlayback={true}
          mediaPlaybackRequiresUserAction={false}
          scalesPageToFit={false}
          textZoom={100}
          showsHorizontalScrollIndicator={false}
          setBuiltInZoomControls={false}
          setDisplayZoomControls={false}
          overScrollMode="never"
          onNavigationStateChange={(navState) => setCanGoBack(navState.canGoBack)}
          onLoadStart={() => setLoading(true)}
          onLoadEnd={() => setLoading(false)}
          renderLoading={() => (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="large" color={COLORS.primary} />
              <Text style={styles.loadingText}>Loading Admin Dashboard...</Text>
            </View>
          )}
          style={styles.webview}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0f',
  },
  appBar: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    backgroundColor: '#101018',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  shieldBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 0, 85, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 0, 85, 0.3)',
    gap: 4,
  },
  badgeText: {
    color: COLORS.primary,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  title: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '800',
  },
  actionGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  webviewWrapper: {
    flex: 1,
    backgroundColor: '#0a0a0f',
  },
  webview: {
    flex: 1,
    backgroundColor: '#0a0a0f',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#0a0a0f',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#0a0a0f',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    zIndex: 10,
  },
  loadingText: {
    color: COLORS.textMuted,
    fontSize: 13,
    fontWeight: '600',
  },
});

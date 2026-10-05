import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Switch,
  SafeAreaView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../theme/colors';
import {
  getApiBaseUrl,
  setApiBaseUrl,
  apiService,
  getAuthSession,
  clearAuthSession,
} from '../services/api';

const SETTING_AUTOPLAY = '@infinx_setting_autoplay';
const SETTING_SKIP_INTRO = '@infinx_setting_skip_intro';
const SETTING_WIFI_ONLY = '@infinx_setting_wifi_only';
const SETTING_HW_ACCEL = '@infinx_setting_hw_accel';
const SETTING_STREAM_QUALITY = '@infinx_setting_stream_quality';
const SETTING_AUDIO_LANG = '@infinx_setting_audio_lang';
const SETTING_SUB_LANG = '@infinx_setting_sub_lang';
const SETTING_DOWNLOAD_QUALITY = '@infinx_setting_download_quality';

const QUALITY_OPTIONS = ['Auto', '1080p', '720p', '480p'];
const AUDIO_OPTIONS = ['Japanese', 'English Dub', 'Hindi Dub'];
const SUB_OPTIONS = ['English', 'Hindi', 'Off'];
const DOWNLOAD_OPTIONS = ['1080p High', '720p Standard', '480p Saver'];

export const SettingsScreen = ({ navigation }) => {
  // Account state
  const [user, setUser] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Playback toggles
  const [autoPlay, setAutoPlay] = useState(true);
  const [skipIntro, setSkipIntro] = useState(true);
  const [wifiOnly, setWifiOnly] = useState(false);
  const [hwAccel, setHwAccel] = useState(true);

  // Preferences
  const [streamQuality, setStreamQuality] = useState('Auto');
  const [audioLang, setAudioLang] = useState('Japanese');
  const [subLang, setSubLang] = useState('English');
  const [downloadQuality, setDownloadQuality] = useState('720p Standard');

  // Server & Cache
  const [apiUrl, setUrl] = useState('');
  const [testing, setTesting] = useState(false);
  const [status, setStatus] = useState(null);
  const [cacheSize, setCacheSize] = useState('28.4 MB');

  // Load all saved settings on mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const [
          savedUrl,
          sess,
          savedAutoplay,
          savedSkipIntro,
          savedWifiOnly,
          savedHwAccel,
          savedQuality,
          savedAudio,
          savedSub,
          savedDlQuality,
        ] = await Promise.all([
          getApiBaseUrl(),
          getAuthSession(),
          AsyncStorage.getItem(SETTING_AUTOPLAY),
          AsyncStorage.getItem(SETTING_SKIP_INTRO),
          AsyncStorage.getItem(SETTING_WIFI_ONLY),
          AsyncStorage.getItem(SETTING_HW_ACCEL),
          AsyncStorage.getItem(SETTING_STREAM_QUALITY),
          AsyncStorage.getItem(SETTING_AUDIO_LANG),
          AsyncStorage.getItem(SETTING_SUB_LANG),
          AsyncStorage.getItem(SETTING_DOWNLOAD_QUALITY),
        ]);

        setUrl(savedUrl);
        if (sess?.user && sess?.token) {
          setUser(sess.user);
          setIsLoggedIn(true);
        }

        if (savedAutoplay !== null) setAutoPlay(savedAutoplay === 'true');
        if (savedSkipIntro !== null) setSkipIntro(savedSkipIntro === 'true');
        if (savedWifiOnly !== null) setWifiOnly(savedWifiOnly === 'true');
        if (savedHwAccel !== null) setHwAccel(savedHwAccel === 'true');
        if (savedQuality) setStreamQuality(savedQuality);
        if (savedAudio) setAudioLang(savedAudio);
        if (savedSub) setSubLang(savedSub);
        if (savedDlQuality) setDownloadQuality(savedDlQuality);
      } catch (e) {
        console.warn('Error reading settings:', e);
      }
    };
    loadSettings();
  }, []);

  // Handlers for toggles
  const handleToggleAutoplay = async (val) => {
    setAutoPlay(val);
    await AsyncStorage.setItem(SETTING_AUTOPLAY, String(val)).catch(() => {});
  };

  const handleToggleSkipIntro = async (val) => {
    setSkipIntro(val);
    await AsyncStorage.setItem(SETTING_SKIP_INTRO, String(val)).catch(() => {});
  };

  const handleToggleWifiOnly = async (val) => {
    setWifiOnly(val);
    await AsyncStorage.setItem(SETTING_WIFI_ONLY, String(val)).catch(() => {});
  };

  const handleToggleHwAccel = async (val) => {
    setHwAccel(val);
    await AsyncStorage.setItem(SETTING_HW_ACCEL, String(val)).catch(() => {});
  };

  const handleSelectQuality = async (q) => {
    setStreamQuality(q);
    await AsyncStorage.setItem(SETTING_STREAM_QUALITY, q).catch(() => {});
  };

  const handleSelectAudio = async (a) => {
    setAudioLang(a);
    await AsyncStorage.setItem(SETTING_AUDIO_LANG, a).catch(() => {});
  };

  const handleSelectSub = async (s) => {
    setSubLang(s);
    await AsyncStorage.setItem(SETTING_SUB_LANG, s).catch(() => {});
  };

  const handleSelectDlQuality = async (dq) => {
    setDownloadQuality(dq);
    await AsyncStorage.setItem(SETTING_DOWNLOAD_QUALITY, dq).catch(() => {});
  };

  // Clear App Cache
  const handleClearCache = () => {
    Alert.alert(
      'Clear App Cache',
      'This will remove temporary video cache, prefetched posters, and offline temporary files.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear Cache',
          style: 'destructive',
          onPress: async () => {
            try {
              await AsyncStorage.removeItem('@infinx_cached_carousel');
              await AsyncStorage.removeItem('@infinx_cached_categories');
              setCacheSize('0.0 MB');
              Alert.alert('Cache Cleared', 'Application cache has been cleared successfully.');
            } catch (e) {
              Alert.alert('Error', 'Failed to clear cache.');
            }
          },
        },
      ]
    );
  };

  // Save and Test Server Connection
  const handleSaveUrl = async (customUrl) => {
    const targetUrl = customUrl || apiUrl;
    if (!targetUrl) return;
    setTesting(true);
    setStatus(null);
    try {
      const formatted = await setApiBaseUrl(targetUrl);
      setUrl(formatted);
      const start = Date.now();
      const shows = await apiService.getCarouselShows();
      const latency = Date.now() - start;
      setStatus({
        success: true,
        message: `Connected! Response in ${latency}ms (${shows.length} shows found)`,
      });
    } catch (e) {
      setStatus({ success: false, message: `Connection Error: ${e.message}` });
    } finally {
      setTesting(false);
    }
  };

  // Handle Logout
  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          await clearAuthSession();
          setUser(null);
          setIsLoggedIn(false);
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Top App Bar */}
      <View style={styles.appBar}>
        <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.goBack()} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.appBarTitle}>Settings</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        {/* 1. Account & Profile Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="person-circle-outline" size={20} color={COLORS.primary} />
            <Text style={styles.cardTitle}>Account & Session</Text>
          </View>

          <View style={styles.accountRow}>
            <View style={[styles.avatar, user?.role === 'ADMIN' && styles.adminAvatar]}>
              {user?.role === 'ADMIN' ? (
                <Ionicons name="shield-checkmark" size={22} color="#fff" />
              ) : (
                <Ionicons name="person" size={22} color={COLORS.primary} />
              )}
            </View>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={styles.accountName}>
                  {isLoggedIn ? user?.email || 'Member' : 'Guest Mode'}
                </Text>
                {user?.role === 'ADMIN' && (
                  <View style={styles.adminBadge}>
                    <Text style={styles.adminBadgeText}>ADMIN</Text>
                  </View>
                )}
              </View>
              <Text style={styles.accountSub}>
                {isLoggedIn
                  ? `User ID: #${user?.id || 1} • ${user?.role === 'ADMIN' ? 'Administrator' : 'Premium'}`
                  : 'Log in to sync your library across devices'}
              </Text>
            </View>
          </View>

          {/* Admin Control Center Link (Only shown for Admin users) */}
          {user?.role === 'ADMIN' && (
            <TouchableOpacity
              style={styles.adminBtn}
              onPress={() => navigation.navigate('Admin')}
              activeOpacity={0.8}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Ionicons name="shield-checkmark" size={18} color="#fff" />
                <Text style={styles.adminBtnText}>Launch Admin Management Portal</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#fff" />
            </TouchableOpacity>
          )}

          {isLoggedIn ? (
            <TouchableOpacity style={styles.signOutBtn} onPress={handleLogout} activeOpacity={0.7}>
              <Ionicons name="log-out-outline" size={16} color={COLORS.error} />
              <Text style={styles.signOutBtnText}>Sign Out of Infinx Anime</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.signInBtn}
              onPress={() => navigation.navigate('Library')}
              activeOpacity={0.8}
            >
              <Ionicons name="log-in-outline" size={16} color="#fff" />
              <Text style={styles.signInBtnText}>Sign In / Register</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* 2. Streaming & Playback */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="play-circle-outline" size={20} color={COLORS.primary} />
            <Text style={styles.cardTitle}>Streaming & Playback</Text>
          </View>

          <Text style={styles.subLabel}>Default Video Streaming Quality</Text>
          <View style={styles.pillRow}>
            {QUALITY_OPTIONS.map((q) => {
              const active = streamQuality === q;
              return (
                <TouchableOpacity
                  key={q}
                  style={[styles.pill, active && styles.activePill]}
                  onPress={() => handleSelectQuality(q)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.pillText, active && styles.activePillText]}>{q}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={styles.toggleRow}>
            <View style={{ flex: 1, paddingRight: 8 }}>
              <Text style={styles.toggleTitle}>Auto-Play Next Episode</Text>
              <Text style={styles.toggleDesc}>
                Automatically begins playing the next episode when current episode ends
              </Text>
            </View>
            <Switch
              value={autoPlay}
              onValueChange={handleToggleAutoplay}
              trackColor={{ false: '#262635', true: COLORS.primary }}
              thumbColor="#fff"
            />
          </View>

          <View style={styles.toggleRow}>
            <View style={{ flex: 1, paddingRight: 8 }}>
              <Text style={styles.toggleTitle}>Auto-Skip Opening & Ending</Text>
              <Text style={styles.toggleDesc}>Fast-forward past opening themes and recaps</Text>
            </View>
            <Switch
              value={skipIntro}
              onValueChange={handleToggleSkipIntro}
              trackColor={{ false: '#262635', true: COLORS.primary }}
              thumbColor="#fff"
            />
          </View>

          <View style={styles.toggleRow}>
            <View style={{ flex: 1, paddingRight: 8 }}>
              <Text style={styles.toggleTitle}>Stream on Wi-Fi Only</Text>
              <Text style={styles.toggleDesc}>Prevents video streaming on cellular mobile data</Text>
            </View>
            <Switch
              value={wifiOnly}
              onValueChange={handleToggleWifiOnly}
              trackColor={{ false: '#262635', true: COLORS.primary }}
              thumbColor="#fff"
            />
          </View>

          <View style={styles.toggleRow}>
            <View style={{ flex: 1, paddingRight: 8 }}>
              <Text style={styles.toggleTitle}>Hardware Acceleration</Text>
              <Text style={styles.toggleDesc}>Use GPU hardware decoding for smooth 60fps playback</Text>
            </View>
            <Switch
              value={hwAccel}
              onValueChange={handleToggleHwAccel}
              trackColor={{ false: '#262635', true: COLORS.primary }}
              thumbColor="#fff"
            />
          </View>
        </View>

        {/* 3. Audio & Subtitles */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="language-outline" size={20} color={COLORS.secondary} />
            <Text style={styles.cardTitle}>Audio & Subtitles</Text>
          </View>

          <Text style={styles.subLabel}>Preferred Audio Language</Text>
          <View style={styles.pillRow}>
            {AUDIO_OPTIONS.map((a) => {
              const active = audioLang === a;
              return (
                <TouchableOpacity
                  key={a}
                  style={[styles.pill, active && styles.activePill]}
                  onPress={() => handleSelectAudio(a)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.pillText, active && styles.activePillText]}>{a}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <Text style={[styles.subLabel, { marginTop: 14 }]}>Preferred Subtitle Language</Text>
          <View style={styles.pillRow}>
            {SUB_OPTIONS.map((s) => {
              const active = subLang === s;
              return (
                <TouchableOpacity
                  key={s}
                  style={[styles.pill, active && styles.activePill]}
                  onPress={() => handleSelectSub(s)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.pillText, active && styles.activePillText]}>{s}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* 4. Downloads & Offline */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="download-outline" size={20} color="#00f0ff" />
            <Text style={styles.cardTitle}>Downloads & Offline Storage</Text>
          </View>

          <Text style={styles.subLabel}>Download Video Quality</Text>
          <View style={styles.pillRow}>
            {DOWNLOAD_OPTIONS.map((dq) => {
              const active = downloadQuality === dq;
              return (
                <TouchableOpacity
                  key={dq}
                  style={[styles.pill, active && styles.activePill]}
                  onPress={() => handleSelectDlQuality(dq)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.pillText, active && styles.activePillText]}>{dq}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* 5. Storage & Cache */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="file-tray-full-outline" size={20} color="#ffaa00" />
            <Text style={styles.cardTitle}>Storage & Cache</Text>
          </View>

          <View style={styles.cacheRow}>
            <View>
              <Text style={styles.cacheLabel}>Cached Media & Posters</Text>
              <Text style={styles.cacheDesc}>Temporary images and stream manifests</Text>
            </View>
            <Text style={styles.cacheVal}>{cacheSize}</Text>
          </View>

          <TouchableOpacity
            style={styles.clearCacheBtn}
            onPress={handleClearCache}
            activeOpacity={0.8}
          >
            <Ionicons name="trash-outline" size={16} color="#fff" />
            <Text style={styles.clearCacheBtnText}>Clear Application Cache</Text>
          </TouchableOpacity>
        </View>


        {/* 7. About & Build Info */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="information-circle-outline" size={20} color={COLORS.textSecondary} />
            <Text style={styles.cardTitle}>About Infinx Anime</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>App Version</Text>
            <Text style={styles.infoVal}>v1.2.0 (Build 42)</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Player Engine</Text>
            <Text style={styles.infoVal}>ExoPlayer 2.19 / HLS Video</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Framework</Text>
            <Text style={styles.infoVal}>React Native 0.74 / Expo 51</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Theme</Text>
            <Text style={styles.infoVal}>Cyberpunk Neon Dark</Text>
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
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
  appBarTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '800',
  },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: {
    flex: 1,
  },
  content: {
    padding: 16,
    gap: 16,
  },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    padding: 16,
    gap: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cardTitle: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '800',
  },
  cardDesc: {
    color: COLORS.textMuted,
    fontSize: 12,
    lineHeight: 18,
  },
  accountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 6,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.surface,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  adminAvatar: {
    backgroundColor: COLORS.primary,
    borderColor: '#fff',
  },
  accountName: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: '700',
  },
  accountSub: {
    color: COLORS.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
  adminBadge: {
    backgroundColor: 'rgba(255, 0, 85, 0.2)',
    borderWidth: 1,
    borderColor: COLORS.primary,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  adminBadgeText: {
    color: COLORS.primary,
    fontSize: 9,
    fontWeight: '900',
  },
  adminBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  adminBtnText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '800',
  },
  signInBtn: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    paddingVertical: 10,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  signInBtnText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },
  signOutBtn: {
    backgroundColor: 'rgba(255, 51, 102, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 51, 102, 0.3)',
    paddingVertical: 10,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  signOutBtnText: {
    color: COLORS.error,
    fontSize: 13,
    fontWeight: '700',
  },
  subLabel: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 4,
  },
  pillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  pill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 16,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  activePill: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  pillText: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },
  activePillText: {
    color: '#fff',
    fontWeight: '800',
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderTopWidth: 0.5,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
  },
  toggleTitle: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: '700',
  },
  toggleDesc: {
    color: COLORS.textMuted,
    fontSize: 11,
    lineHeight: 16,
    marginTop: 2,
  },
  cacheRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cacheLabel: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: '700',
  },
  cacheDesc: {
    color: COLORS.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
  cacheVal: {
    color: COLORS.secondary,
    fontSize: 14,
    fontWeight: '800',
  },
  clearCacheBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.07)',
    borderRadius: 10,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  clearCacheBtnText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },
  presetRow: {
    flexDirection: 'row',
    gap: 8,
  },
  presetBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  presetText: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontWeight: '600',
  },
  input: {
    backgroundColor: COLORS.surface,
    borderColor: COLORS.cardBorder,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: COLORS.text,
    fontSize: 13,
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    borderRadius: 10,
    gap: 6,
  },
  saveBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '800',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
  },
  statusSuccess: {
    backgroundColor: 'rgba(0, 230, 118, 0.1)',
    borderColor: COLORS.success,
  },
  statusError: {
    backgroundColor: 'rgba(255, 51, 102, 0.1)',
    borderColor: COLORS.error,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
  statusSuccessText: {
    color: COLORS.success,
  },
  statusErrorText: {
    color: COLORS.error,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  infoLabel: {
    color: COLORS.textMuted,
    fontSize: 13,
  },
  infoVal: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: '700',
  },
});

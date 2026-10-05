import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  FlatList,
  Alert,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ShowCard } from '../components/ShowCard';
import { COLORS } from '../theme/colors';
import {
  apiService,
  getAuthSession,
  clearAuthSession,
  getStoredWatchlist,
  getStoredHistory,
} from '../services/api';

// Dedicated standalone AuthCard component to isolate input state
// and prevent parent FlatList header re-renders/unmounting while typing
const AuthCard = React.memo(({ onAuthSuccess }) => {
  const [authMode, setAuthMode] = useState('login'); // 'login' | 'register'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAuthSubmit = async () => {
    if (!email.trim() || !password) {
      Alert.alert('Required', 'Please enter your email address and password.');
      return;
    }

    setLoading(true);
    try {
      let data;
      if (authMode === 'login') {
        data = await apiService.loginUser(email.trim(), password);
      } else {
        data = await apiService.registerUser(email.trim(), password);
      }

      if (data?.user) {
        setEmail('');
        setPassword('');
        Alert.alert(
          'Success',
          `Welcome, ${data.user.email ? data.user.email.split('@')[0] : 'Otaku'}!`
        );
        if (onAuthSuccess) {
          onAuthSuccess(data.user);
        }
      }
    } catch (e) {
      Alert.alert(
        authMode === 'login' ? 'Login Failed' : 'Registration Failed',
        e.message || 'Authentication error. Please check your credentials.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.authCard}>
      <View style={styles.authHeader}>
        <Text style={styles.authTitle}>
          {authMode === 'login' ? 'Sign In to Infinx Anime' : 'Create an Account'}
        </Text>
        <TouchableOpacity
          onPress={() => setAuthMode((prev) => (prev === 'login' ? 'register' : 'login'))}
        >
          <Text style={styles.switchModeText}>
            {authMode === 'login' ? 'Need an account?' : 'Already registered?'}
          </Text>
        </TouchableOpacity>
      </View>

      <TextInput
        style={styles.input}
        placeholder="Email address"
        placeholderTextColor={COLORS.textMuted}
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="email-address"
        returnKeyType="next"
        blurOnSubmit={false}
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        placeholderTextColor={COLORS.textMuted}
        value={password}
        onChangeText={setPassword}
        autoCapitalize="none"
        autoCorrect={false}
        secureTextEntry
        returnKeyType="done"
        onSubmitEditing={handleAuthSubmit}
      />

      <TouchableOpacity
        style={styles.loginBtn}
        onPress={handleAuthSubmit}
        disabled={loading}
        activeOpacity={0.8}
      >
        {loading ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <Text style={styles.loginBtnText}>
            {authMode === 'login' ? 'Sign In' : 'Create Account'}
          </Text>
        )}
      </TouchableOpacity>
    </View>
  );
});

export const LibraryScreen = ({ navigation }) => {
  const [activeTab, setActiveTab] = useState('watchlist');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [watchlist, setWatchlist] = useState([]);
  const [history, setHistory] = useState([]);

  // 1. Restore auth session and saved user lists on mount
  const loadUserData = useCallback(async () => {
    try {
      const sess = await getAuthSession();
      if (sess?.user && sess?.token) {
        setUser(sess.user);
        setIsLoggedIn(true);
      } else {
        setUser(null);
        setIsLoggedIn(false);
      }

      const [storedWl, storedHist] = await Promise.all([
        getStoredWatchlist(),
        getStoredHistory(),
      ]);
      setWatchlist(Array.isArray(storedWl) ? storedWl : []);
      setHistory(Array.isArray(storedHist) ? storedHist : []);
    } catch (e) {
      console.warn('Error loading user data:', e);
    }
  }, []);

  useEffect(() => {
    loadUserData();
  }, [loadUserData]);

  // Refresh lists when screen is focused
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadUserData();
    });
    return unsubscribe;
  }, [navigation, loadUserData]);

  const handleAuthSuccess = useCallback((authedUser) => {
    setUser(authedUser);
    setIsLoggedIn(true);
    loadUserData();
  }, [loadUserData]);

  // Handle Logout
  const handleLogout = useCallback(() => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out of your account?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          await clearAuthSession();
          setIsLoggedIn(false);
          setUser(null);
        },
      },
    ]);
  }, []);

  const handleShowPress = useCallback((item) => {
    if (activeTab === 'history' && item.currentEpisode) {
      navigation.navigate('Player', {
        episodeId: item.currentEpisode.id,
        episode: item.currentEpisode,
        show: item,
        initialPositionMillis: item.positionMillis || 0,
      });
    } else {
      navigation.navigate('ShowDetail', { showId: item.id || item.showId, show: item });
    }
  }, [activeTab, navigation]);

  const currentList = activeTab === 'watchlist' ? watchlist : history;

  const renderHeader = useMemo(() => (
    <View>
      {/* User Profile Header */}
      <View style={styles.header}>
        <View style={[styles.avatar, user?.role === 'ADMIN' && styles.adminAvatar]}>
          {user?.role === 'ADMIN' ? (
            <Ionicons name="shield-checkmark" size={26} color="#fff" />
          ) : (
            <Ionicons name="person" size={26} color={COLORS.primary} />
          )}
        </View>

        <View style={styles.headerText}>
          <View style={styles.nameRow}>
            <Text style={styles.userName}>
              {isLoggedIn ? user?.name || user?.email?.split('@')[0] || 'Member' : 'Guest Otaku'}
            </Text>
            {user?.role === 'ADMIN' && (
              <View style={styles.adminBadge}>
                <Text style={styles.adminBadgeText}>ADMIN</Text>
              </View>
            )}
          </View>
          <Text style={styles.userStatus}>
            {isLoggedIn
              ? user?.email || (user?.role === 'ADMIN' ? 'System Administrator' : 'VIP Member')
              : 'Sign in to sync your watchlist & history'}
          </Text>
        </View>

        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={() => navigation.navigate('Settings')}
            activeOpacity={0.7}
          >
            <Ionicons name="settings-outline" size={20} color="#fff" />
          </TouchableOpacity>

          {isLoggedIn && (
            <TouchableOpacity
              style={[styles.iconBtn, styles.logoutBtn]}
              onPress={handleLogout}
              activeOpacity={0.7}
            >
              <Ionicons name="log-out-outline" size={20} color={COLORS.error} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Admin Panel Access Banner (Shows prominently when logged in as ADMIN) */}
      {isLoggedIn && user?.role === 'ADMIN' && (
        <TouchableOpacity
          style={styles.adminPortalCard}
          onPress={() => navigation.navigate('Admin')}
          activeOpacity={0.85}
        >
          <View style={styles.adminPortalLeft}>
            <View style={styles.adminIconBox}>
              <Ionicons name="shield-checkmark" size={24} color="#fff" />
            </View>
            <View>
              <View style={styles.adminAccessPill}>
                <Text style={styles.adminAccessText}>ADMINISTRATOR ACCESS</Text>
              </View>
              <Text style={styles.adminPortalTitle}>Admin Management Portal</Text>
              <Text style={styles.adminPortalSub}>Upload videos, manage shows & monitor tasks</Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={22} color={COLORS.primary} />
        </TouchableOpacity>
      )}

      {/* Auth Card (Shown only when NOT logged in) */}
      {!isLoggedIn && (
        <AuthCard onAuthSuccess={handleAuthSuccess} />
      )}

      {/* Watchlist & History Tabs */}
      <View style={styles.tabRow}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'watchlist' && styles.activeTab]}
          onPress={() => setActiveTab('watchlist')}
          activeOpacity={0.7}
        >
          <Ionicons
            name="bookmark"
            size={14}
            color={activeTab === 'watchlist' ? '#fff' : COLORS.textMuted}
          />
          <Text style={[styles.tabText, activeTab === 'watchlist' && styles.activeTabText]}>
            My Watchlist ({watchlist.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'history' && styles.activeTab]}
          onPress={() => setActiveTab('history')}
          activeOpacity={0.7}
        >
          <Ionicons
            name="time-outline"
            size={15}
            color={activeTab === 'history' ? '#fff' : COLORS.textMuted}
          />
          <Text style={[styles.tabText, activeTab === 'history' && styles.activeTabText]}>
            Continue Watching ({history.length})
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  ), [isLoggedIn, user, activeTab, watchlist.length, history.length, handleAuthSuccess, navigation, handleLogout]);

  const renderEmptyState = useMemo(() => (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIconCircle}>
        <Ionicons
          name={activeTab === 'watchlist' ? 'bookmark-outline' : 'play-circle-outline'}
          size={42}
          color={COLORS.textSecondary}
        />
      </View>
      <Text style={styles.emptyTitle}>
        {activeTab === 'watchlist' ? 'Your Watchlist is Empty' : 'No Watch History Yet'}
      </Text>
      <Text style={styles.emptySubtitle}>
        {activeTab === 'watchlist'
          ? 'Browse titles and tap the bookmark icon to keep track of shows you want to watch.'
          : 'Shows and episodes you start watching will automatically appear here so you can resume.'}
      </Text>
      <TouchableOpacity
        style={styles.exploreBtn}
        onPress={() => navigation.navigate('Explore')}
        activeOpacity={0.8}
      >
        <Ionicons name="compass-outline" size={16} color="#fff" />
        <Text style={styles.exploreBtnText}>Explore Shows</Text>
      </TouchableOpacity>
    </View>
  ), [activeTab, navigation]);

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={currentList}
        keyExtractor={(item, index) => (item?.id ? item.id.toString() : index.toString())}
        numColumns={2}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmptyState}
        keyboardShouldPersistTaps="handled"
        columnWrapperStyle={currentList.length > 0 ? styles.columnWrapper : undefined}
        contentContainerStyle={styles.contentContainer}
        renderItem={({ item }) => (
          <ShowCard show={item} onPress={handleShowPress} width={160} height={230} />
        )}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  contentContainer: {
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 18,
    gap: 14,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.cardBorder,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: COLORS.card,
    borderWidth: 2,
    borderColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  adminAvatar: {
    backgroundColor: COLORS.primary,
    borderColor: '#fff',
  },
  headerText: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  userName: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: '800',
  },
  adminBadge: {
    backgroundColor: 'rgba(255, 0, 85, 0.2)',
    borderWidth: 1,
    borderColor: COLORS.primary,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  adminBadgeText: {
    color: COLORS.primary,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  userStatus: {
    color: COLORS.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutBtn: {
    borderColor: 'rgba(255, 51, 102, 0.3)',
    backgroundColor: 'rgba(255, 51, 102, 0.1)',
  },
  adminPortalCard: {
    marginHorizontal: 16,
    marginTop: 14,
    padding: 14,
    backgroundColor: '#120d18',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    elevation: 4,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  adminPortalLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  adminIconBox: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  adminAccessPill: {
    backgroundColor: 'rgba(255, 0, 85, 0.25)',
    alignSelf: 'flex-start',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginBottom: 2,
  },
  adminAccessText: {
    color: COLORS.primary,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  adminPortalTitle: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '800',
  },
  adminPortalSub: {
    color: COLORS.textMuted,
    fontSize: 11,
    marginTop: 1,
  },
  authCard: {
    margin: 16,
    padding: 16,
    backgroundColor: COLORS.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    gap: 10,
  },
  authHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  authTitle: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: '800',
  },
  switchModeText: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: '700',
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
  loginBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 4,
  },
  loginBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '800',
  },
  tabRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginVertical: 14,
    gap: 10,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: COLORS.surface,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    gap: 6,
  },
  activeTab: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  tabText: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontWeight: '700',
  },
  activeTabText: {
    color: '#fff',
    fontWeight: '800',
  },
  columnWrapper: {
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    paddingHorizontal: 32,
    gap: 10,
  },
  emptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.card,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    marginBottom: 6,
  },
  emptyTitle: {
    color: COLORS.text,
    fontSize: 17,
    fontWeight: '800',
  },
  emptySubtitle: {
    color: COLORS.textMuted,
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 19,
  },
  exploreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 20,
    marginTop: 8,
  },
  exploreBtnText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '800',
  },
});

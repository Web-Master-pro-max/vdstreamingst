import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  TextInput, 
  FlatList, 
  Alert 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ShowCard } from '../components/ShowCard';
import { COLORS } from '../theme/colors';
import { apiService, DEMO_CAROUSEL } from '../services/api';

export const LibraryScreen = ({ navigation }) => {
  const [activeTab, setActiveTab] = useState('watchlist');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [watchlist, setWatchlist] = useState(DEMO_CAROUSEL);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter email and password.');
      return;
    }
    setLoading(true);
    try {
      const data = await apiService.loginUser(email, password);
      setUser(data.user);
      setIsLoggedIn(true);
      Alert.alert('Success', `Welcome back, ${data.user.name || 'Otaku'}!`);
    } catch (e) {
      Alert.alert('Login Failed', e.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  const handleShowPress = (show) => {
    navigation.navigate('ShowDetail', { showId: show.id, show });
  };

  return (
    <View style={styles.container}>
      {/* Top Banner */}
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Ionicons name="person" size={28} color={COLORS.primary} />
        </View>

        <View style={styles.headerText}>
          <Text style={styles.userName}>
            {isLoggedIn ? user?.name || 'Anime Fan' : 'Guest Otaku'}
          </Text>
          <Text style={styles.userStatus}>
            {isLoggedIn ? 'VIP Premium Member' : 'Sign in to sync watchlist across devices'}
          </Text>
        </View>
      </View>

      {!isLoggedIn && (
        <View style={styles.authCard}>
          <Text style={styles.authTitle}>Login to Infinx Anime</Text>
          <TextInput
            style={styles.input}
            placeholder="Email address"
            placeholderTextColor={COLORS.textMuted}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />
          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor={COLORS.textMuted}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
          <TouchableOpacity style={styles.loginBtn} onPress={handleLogin}>
            <Text style={styles.loginBtnText}>{loading ? 'Logging in...' : 'Sign In'}</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Tabs */}
      <View style={styles.tabRow}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'watchlist' && styles.activeTab]}
          onPress={() => setActiveTab('watchlist')}
        >
          <Text style={[styles.tabText, activeTab === 'watchlist' && styles.activeTabText]}>
            My Watchlist ({watchlist.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.tab, activeTab === 'history' && styles.activeTab]}
          onPress={() => setActiveTab('history')}
        >
          <Text style={[styles.tabText, activeTab === 'history' && styles.activeTabText]}>
            Continue Watching
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <FlatList
        data={watchlist}
        numColumns={2}
        keyExtractor={(item) => item.id.toString()}
        columnWrapperStyle={styles.columnWrapper}
        contentContainerStyle={styles.gridContent}
        renderItem={({ item }) => (
          <ShowCard 
            show={item} 
            onPress={handleShowPress} 
            width={160}
            height={230}
          />
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
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
  headerText: {
    flex: 1,
  },
  userName: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: '800',
  },
  userStatus: {
    color: COLORS.textMuted,
    fontSize: 12,
    marginTop: 2,
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
  authTitle: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 4,
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
    marginVertical: 12,
    gap: 10,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
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
  gridContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  columnWrapper: {
    justifyContent: 'space-between',
    marginBottom: 16,
  },
});

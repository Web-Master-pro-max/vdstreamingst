import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  ScrollView, 
  Alert, 
  ActivityIndicator 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../theme/colors';
import { getApiBaseUrl, setApiBaseUrl, apiService } from '../services/api';

export const SettingsScreen = () => {
  const [apiUrl, setUrl] = useState('');
  const [testing, setTesting] = useState(false);
  const [status, setStatus] = useState(null);

  useEffect(() => {
    getApiBaseUrl().then(setUrl);
  }, []);

  const handleSave = async () => {
    if (!apiUrl) return;
    setTesting(true);
    setStatus(null);
    try {
      await setApiBaseUrl(apiUrl);
      const shows = await apiService.getCarouselShows();
      setStatus({ success: true, message: `Connected! Loaded ${shows.length} shows.` });
    } catch (e) {
      setStatus({ success: false, message: `Connection Error: ${e.message}` });
    } finally {
      setTesting(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.heading}>App Settings</Text>

      {/* Backend API Configuration */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Ionicons name="server-outline" size={20} color={COLORS.primary} />
          <Text style={styles.cardTitle}>Backend API Endpoint</Text>
        </View>

        <Text style={styles.cardDesc}>
          Set the HTTP server URL for Infinx Anime backend (e.g. http://10.0.2.2:5000 for Android emulator or your EC2/Vercel server domain).
        </Text>

        <TextInput
          style={styles.input}
          value={apiUrl}
          onChangeText={setUrl}
          placeholder="http://10.0.2.2:5000"
          placeholderTextColor={COLORS.textMuted}
          autoCapitalize="none"
          autoCorrect={false}
        />

        <TouchableOpacity 
          style={styles.saveBtn} 
          onPress={handleSave}
          disabled={testing}
        >
          {testing ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Ionicons name="checkmark-circle-outline" size={18} color="#fff" />
              <Text style={styles.saveBtnText}>Save & Test Connection</Text>
            </>
          )}
        </TouchableOpacity>

        {status && (
          <View style={[styles.statusBadge, status.success ? styles.statusSuccess : styles.statusError]}>
            <Ionicons 
              name={status.success ? "checkmark-circle" : "alert-circle"} 
              size={16} 
              color={status.success ? COLORS.success : COLORS.error} 
            />
            <Text style={[styles.statusText, status.success ? styles.statusSuccessText : styles.statusErrorText]}>
              {status.message}
            </Text>
          </View>
        )}
      </View>

      {/* App Info Card */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Ionicons name="information-circle-outline" size={20} color={COLORS.secondary} />
          <Text style={styles.cardTitle}>About Infinx Anime Mobile</Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>App Version</Text>
          <Text style={styles.infoVal}>v1.0.0 (Expo SDK 51)</Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Video Streaming</Text>
          <Text style={styles.infoVal}>HLS Adaptive & MP4</Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Theme</Text>
          <Text style={styles.infoVal}>Neon Dark Matrix</Text>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    padding: 16,
    gap: 16,
  },
  heading: {
    color: COLORS.text,
    fontSize: 24,
    fontWeight: '900',
    marginBottom: 4,
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
  input: {
    backgroundColor: COLORS.surface,
    borderColor: COLORS.cardBorder,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: COLORS.text,
    fontSize: 13,
    fontFamily: 'Platform',
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
    paddingVertical: 6,
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(255,255,255,0.05)',
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

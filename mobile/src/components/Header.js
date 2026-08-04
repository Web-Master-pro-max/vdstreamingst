import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../theme/colors';

export const Header = ({ onSearchPress, onProfilePress }) => {
  return (
    <View style={styles.header}>
      <View style={styles.logoContainer}>
        <Text style={styles.logoTextMain}>Infinx </Text>
        <Text style={styles.logoTextSub}>Anime</Text>
        <View style={styles.logoDot} />
      </View>

      <View style={styles.actions}>
        {onSearchPress && (
          <TouchableOpacity style={styles.iconBtn} onPress={onSearchPress} activeOpacity={0.7}>
            <Ionicons name="search" size={20} color={COLORS.text} />
          </TouchableOpacity>
        )}
        {onProfilePress && (
          <TouchableOpacity style={styles.iconBtn} onPress={onProfilePress} activeOpacity={0.7}>
            <Ionicons name="person-circle-outline" size={24} color={COLORS.primary} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.cardBorder,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoTextMain: {
    fontSize: 22,
    fontWeight: '900',
    color: COLORS.text,
    letterSpacing: -0.5,
  },
  logoTextSub: {
    fontSize: 22,
    fontWeight: '900',
    color: COLORS.primary,
    letterSpacing: -0.5,
  },
  logoDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.secondary,
    marginLeft: 4,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: COLORS.card,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
});

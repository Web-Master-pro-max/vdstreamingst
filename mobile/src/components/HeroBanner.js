import React from 'react';
import { View, Text, ImageBackground, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, GRADIENTS } from '../theme/colors';

export const HeroBanner = ({ show, onPlayPress, onDetailPress }) => {
  if (!show) return null;

  const rating = show.rating ? parseFloat(show.rating).toFixed(1) : '4.9';
  const bannerUrl = show.bannerUrl || show.posterUrl || 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=1200';

  return (
    <View style={styles.container}>
      <ImageBackground 
        source={{ uri: bannerUrl }} 
        style={styles.imageBackground}
        resizeMode="cover"
      >
        <LinearGradient 
          colors={GRADIENTS.heroOverlay} 
          style={styles.gradient}
        >
          <View style={styles.content}>
            {/* Badges */}
            <View style={styles.badgeRow}>
              <View style={styles.featuredBadge}>
                <Ionicons name="sparkles" size={12} color="#fff" />
                <Text style={styles.featuredBadgeText}>FEATURED</Text>
              </View>
              <View style={styles.hdBadge}>
                <Text style={styles.hdText}>ULTRA HD</Text>
              </View>
              <View style={styles.ratingBadge}>
                <Ionicons name="star" size={12} color={COLORS.ratingGold} />
                <Text style={styles.ratingText}>{rating}</Text>
              </View>
            </View>

            {/* Title */}
            <Text style={styles.title} numberOfLines={2}>
              {show.title}
            </Text>

            {/* Description */}
            <Text style={styles.description} numberOfLines={2}>
              {show.description}
            </Text>

            {/* Buttons */}
            <View style={styles.buttonRow}>
              <TouchableOpacity 
                style={styles.playButton} 
                onPress={() => onPlayPress && onPlayPress(show)}
                activeOpacity={0.8}
              >
                <Ionicons name="play" size={18} color="#fff" />
                <Text style={styles.playButtonText}>WATCH NOW</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.infoButton} 
                onPress={() => onDetailPress && onDetailPress(show)}
                activeOpacity={0.8}
              >
                <Ionicons name="information-circle-outline" size={20} color="#fff" />
                <Text style={styles.infoButtonText}>DETAILS</Text>
              </TouchableOpacity>
            </View>
          </View>
        </LinearGradient>
      </ImageBackground>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 320,
    width: '100%',
    overflow: 'hidden',
  },
  imageBackground: {
    width: '100%',
    height: '100%',
  },
  gradient: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: 20,
  },
  content: {
    gap: 8,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  featuredBadge: {
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    gap: 4,
  },
  featuredBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  hdBadge: {
    backgroundColor: 'rgba(0, 240, 255, 0.2)',
    borderColor: COLORS.secondary,
    borderWidth: 1,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  hdText: {
    color: COLORS.secondary,
    fontSize: 9,
    fontWeight: '800',
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
  },
  ratingText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
  title: {
    color: COLORS.text,
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  description: {
    color: COLORS.textMuted,
    fontSize: 12,
    lineHeight: 16,
  },
  buttonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 6,
  },
  playButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6,
    elevation: 6,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.6,
    shadowRadius: 10,
  },
  playButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  infoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderColor: COLORS.cardBorder,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6,
  },
  infoButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },
});

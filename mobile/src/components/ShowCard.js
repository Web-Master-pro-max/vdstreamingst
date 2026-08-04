import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../theme/colors';

export const ShowCard = ({ show, onPress, width = 140, height = 200 }) => {
  const rating = show.rating ? parseFloat(show.rating).toFixed(1) : '4.8';
  const categoryName = show.categories?.[0]?.category?.name || 'Anime';
  const posterUrl = show.posterUrl || show.bannerUrl || 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=800';

  return (
    <TouchableOpacity 
      style={[styles.container, { width }]} 
      onPress={() => onPress && onPress(show)} 
      activeOpacity={0.8}
    >
      <View style={[styles.imageWrapper, { height }]}>
        <Image 
          source={{ uri: posterUrl }} 
          style={styles.image} 
          resizeMode="cover"
        />
        
        {/* Rating Badge */}
        <View style={styles.ratingBadge}>
          <Ionicons name="star" size={11} color={COLORS.ratingGold} />
          <Text style={styles.ratingText}>{rating}</Text>
        </View>

        {/* Play Icon Hover Overlay */}
        <View style={styles.playOverlay}>
          <View style={styles.playBtn}>
            <Ionicons name="play" size={18} color="#fff" />
          </View>
        </View>
      </View>

      <Text style={styles.title} numberOfLines={1}>
        {show.title}
      </Text>
      
      <View style={styles.metaRow}>
        <Text style={styles.category}>{categoryName}</Text>
        {show.year && <Text style={styles.year}>{show.year}</Text>}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    marginRight: 14,
  },
  imageWrapper: {
    width: '100%',
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: COLORS.card,
    position: 'relative',
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  ratingBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
    gap: 3,
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  ratingText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
  playOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  playBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    paddingLeft: 2,
    elevation: 4,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
  },
  title: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: '700',
    marginTop: 8,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 2,
  },
  category: {
    color: COLORS.textMuted,
    fontSize: 11,
  },
  year: {
    color: COLORS.secondary,
    fontSize: 11,
    fontWeight: '600',
  },
});

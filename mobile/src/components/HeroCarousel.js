import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  useWindowDimensions,
  Image,
  Platform,
} from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, GRADIENTS } from '../theme/colors';
import { getShowBannerMedia } from '../services/api';

export const HeroCarousel = ({ shows = [], onPlayPress, onDetailPress }) => {
  const { width: windowWidth } = useWindowDimensions();
  const [activeIndex, setActiveIndex] = useState(0);
  const [isTouching, setIsTouching] = useState(false);
  const flatListRef = useRef(null);
  const autoPlayTimerRef = useRef(null);

  const safeShows = Array.isArray(shows) && shows.length > 0 ? shows : [];

  // Stop auto play
  const stopAutoPlay = useCallback(() => {
    if (autoPlayTimerRef.current) {
      clearInterval(autoPlayTimerRef.current);
      autoPlayTimerRef.current = null;
    }
  }, []);

  // Start auto play
  const startAutoPlay = useCallback(() => {
    stopAutoPlay();
    if (safeShows.length <= 1 || isTouching) return;

    autoPlayTimerRef.current = setInterval(() => {
      setActiveIndex((prev) => {
        const next = (prev + 1) % safeShows.length;
        if (flatListRef.current) {
          flatListRef.current.scrollToIndex({ index: next, animated: true });
        }
        return next;
      });
    }, 5500);
  }, [safeShows.length, isTouching, stopAutoPlay]);

  useEffect(() => {
    startAutoPlay();
    return () => stopAutoPlay();
  }, [startAutoPlay, stopAutoPlay]);

  // Handle scroll events
  const onMomentumScrollEnd = useCallback(
    (event) => {
      const offsetX = event.nativeEvent.contentOffset.x;
      const index = Math.round(offsetX / windowWidth);
      if (index >= 0 && index < safeShows.length) {
        setActiveIndex(index);
      }
    },
    [windowWidth, safeShows.length]
  );

  const scrollToIndex = (index) => {
    if (index >= 0 && index < safeShows.length && flatListRef.current) {
      stopAutoPlay();
      setActiveIndex(index);
      flatListRef.current.scrollToIndex({ index, animated: true });
      setTimeout(startAutoPlay, 2000);
    }
  };

  if (safeShows.length === 0) return null;

  const renderItem = ({ item, index }) => {
    const rating = item.rating ? parseFloat(item.rating).toFixed(1) : '4.9';
    const categoryName = item.categories?.[0]?.category?.name || item.badge || 'Featured';
    const { bannerUrl, posterUrl, isVideo } = getShowBannerMedia(item);
    const isCurrentActive = index === activeIndex;

    return (
      <View style={[styles.slide, { width: windowWidth }]}>
        {/* Base Poster Backdrop Layer (Always present so it's NEVER black!) */}
        <Image
          source={{ uri: posterUrl || bannerUrl }}
          style={StyleSheet.absoluteFillObject}
          resizeMode="cover"
        />

        {/* Cinematic Video Layer (when banner is an MP4) */}
        {isVideo && (
          <Video
            source={{ uri: bannerUrl }}
            style={StyleSheet.absoluteFillObject}
            resizeMode={ResizeMode.COVER}
            shouldPlay={isCurrentActive}
            isMuted={true}
            isLooping={true}
            useNativeControls={false}
          />
        )}

        {/* Non-Video High-Res Banner Layer (when banner is a JPG/PNG) */}
        {!isVideo && bannerUrl !== posterUrl && (
          <Image
            source={{ uri: bannerUrl }}
            style={StyleSheet.absoluteFillObject}
            resizeMode="cover"
          />
        )}

        {/* Gradient Scrim Overlay for ultra-legible typography */}
        <LinearGradient
          colors={['rgba(10, 10, 15, 0.1)', 'rgba(10, 10, 15, 0.45)', 'rgba(10, 10, 15, 0.9)', COLORS.background]}
          locations={[0, 0.4, 0.8, 1]}
          style={styles.gradient}
        >
          <View style={styles.content}>
            {/* Badges Row */}
            <View style={styles.badgeRow}>
              <View style={styles.featuredBadge}>
                <Ionicons name="sparkles" size={11} color="#fff" />
                <Text style={styles.featuredBadgeText}>FEATURED</Text>
              </View>

              <View style={styles.hdBadge}>
                <Text style={styles.hdText}>ULTRA HD</Text>
              </View>

              <View style={styles.ratingBadge}>
                <Ionicons name="star" size={11} color={COLORS.ratingGold} />
                <Text style={styles.ratingText}>{rating}</Text>
              </View>

              {categoryName && (
                <View style={styles.genreBadge}>
                  <Text style={styles.genreBadgeText}>{categoryName}</Text>
                </View>
              )}
            </View>

            {/* Show Title */}
            <Text style={styles.title} numberOfLines={2}>
              {item.title}
            </Text>

            {/* Show Description */}
            {item.description ? (
              <Text style={styles.description} numberOfLines={2}>
                {item.description}
              </Text>
            ) : null}

            {/* Actions Row */}
            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={styles.playButton}
                onPress={() => onPlayPress && onPlayPress(item)}
                activeOpacity={0.8}
              >
                <Ionicons name="play" size={18} color="#fff" />
                <Text style={styles.playButtonText}>WATCH NOW</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.infoButton}
                onPress={() => onDetailPress && onDetailPress(item)}
                activeOpacity={0.8}
              >
                <Ionicons name="information-circle-outline" size={20} color="#fff" />
                <Text style={styles.infoButtonText}>DETAILS</Text>
              </TouchableOpacity>
            </View>
          </View>
        </LinearGradient>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={safeShows}
        keyExtractor={(item, idx) => (item?.id ? item.id.toString() : idx.toString())}
        renderItem={renderItem}
        horizontal
        pagingEnabled
        nestedScrollEnabled={true}
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onMomentumScrollEnd}
        onScrollBeginDrag={() => {
          setIsTouching(true);
          stopAutoPlay();
        }}
        onScrollEndDrag={() => {
          setIsTouching(false);
          startAutoPlay();
        }}
        getItemLayout={(_, index) => ({
          length: windowWidth,
          offset: windowWidth * index,
          index,
        })}
        initialNumToRender={2}
        maxToRenderPerBatch={3}
        windowSize={3}
        removeClippedSubviews={Platform.OS === 'android'}
      />

      {/* Modern Interactive Pagination Indicators */}
      {safeShows.length > 1 && (
        <View style={styles.paginationContainer} pointerEvents="box-none">
          {safeShows.map((_, idx) => {
            const isActive = activeIndex === idx;
            return (
              <TouchableOpacity
                key={idx}
                onPress={() => scrollToIndex(idx)}
                activeOpacity={0.7}
                hitSlop={{ top: 12, bottom: 12, left: 6, right: 6 }}
              >
                <View style={[styles.dot, isActive ? styles.activeDot : styles.inactiveDot]} />
              </TouchableOpacity>
            );
          })}
        </View>
      )}
    </View>
  );
};

// Also export as HeroBanner for backwards compatibility
export const HeroBanner = ({ show, shows, onPlayPress, onDetailPress }) => {
  const showList = shows || (show ? [show] : []);
  return <HeroCarousel shows={showList} onPlayPress={onPlayPress} onDetailPress={onDetailPress} />;
};

const styles = StyleSheet.create({
  container: {
    height: 360,
    width: '100%',
    position: 'relative',
    backgroundColor: '#0a0a0f',
  },
  slide: {
    height: 360,
    position: 'relative',
    backgroundColor: '#0a0a0f',
  },
  gradient: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: 18,
    paddingBottom: 28,
  },
  content: {
    gap: 8,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  featuredBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    elevation: 3,
  },
  featuredBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  hdBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
  },
  hdText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 0.5,
    borderColor: 'rgba(255, 215, 0, 0.3)',
  },
  ratingText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
  genreBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  genreBadgeText: {
    color: COLORS.textMuted,
    fontSize: 10,
    fontWeight: '600',
  },
  title: {
    fontSize: 24,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: -0.4,
    lineHeight: 28,
    textShadowColor: 'rgba(0, 0, 0, 0.9)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },
  description: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.78)',
    lineHeight: 17,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  buttonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 4,
  },
  playButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 22,
    paddingVertical: 11,
    borderRadius: 22,
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
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    paddingHorizontal: 18,
    paddingVertical: 11,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  infoButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  paginationContainer: {
    position: 'absolute',
    bottom: 8,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    zIndex: 10,
  },
  dot: {
    height: 6,
    borderRadius: 3,
  },
  activeDot: {
    width: 22,
    backgroundColor: COLORS.primary,
    elevation: 4,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
  },
  inactiveDot: {
    width: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.35)',
  },
});

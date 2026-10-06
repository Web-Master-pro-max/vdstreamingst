import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Image,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { Header } from '../components/Header';
import { HeroCarousel } from '../components/HeroCarousel';
import { ShowCard } from '../components/ShowCard';
import { HomeScreenSkeleton } from '../components/HomeScreenSkeleton';
import { COLORS } from '../theme/colors';
import { apiService, formatMediaUrl, isVideoMedia, getAuthSession } from '../services/api';

const CACHE_KEY_CAROUSEL = '@infinx_cached_carousel';
const CACHE_KEY_CATEGORIES = '@infinx_cached_categories';

export const HomeScreen = ({ navigation }) => {
  const [carouselShows, setCarouselShows] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTag, setActiveTag] = useState('All');

  // Background image prefetcher for smooth stutter-free scrolling
  const prefetchShowImages = useCallback((showsList) => {
    if (!Array.isArray(showsList)) return;
    showsList.forEach((show) => {
      const poster = show.poster || show.posterUrl;
      const banner = show.banner || show.bannerUrl;
      if (poster && !isVideoMedia(poster)) {
        Image.prefetch(formatMediaUrl(poster)).catch(() => {});
      }
      if (banner && !isVideoMedia(banner)) {
        Image.prefetch(formatMediaUrl(banner)).catch(() => {});
      }
    });
  }, []);

  const loadData = useCallback(async (isRefresh = false) => {
    // 1. Instant Cache: Load stored data first so the app feels instant
    if (!isRefresh) {
      try {
        const [cachedHero, cachedCats] = await Promise.all([
          AsyncStorage.getItem(CACHE_KEY_CAROUSEL),
          AsyncStorage.getItem(CACHE_KEY_CATEGORIES),
        ]);
        if (cachedHero && cachedCats) {
          const parsedHero = JSON.parse(cachedHero);
          const parsedCats = JSON.parse(cachedCats);
          if (parsedHero.length > 0 && parsedCats.length > 0) {
            setCarouselShows(parsedHero);
            setCategories(parsedCats);
            setLoading(false);
            prefetchShowImages(parsedHero);
          }
        }
      } catch (cacheErr) {
        console.warn('Cache read warning:', cacheErr);
      }
    }

    // 2. Fetch fresh live data from EC2 backend
    try {
      const [heroData, catData] = await Promise.all([
        apiService.getCarouselShows(),
        apiService.getCategoriesWithShows(),
      ]);

      if (Array.isArray(heroData) && heroData.length > 0) {
        setCarouselShows(heroData);
        AsyncStorage.setItem(CACHE_KEY_CAROUSEL, JSON.stringify(heroData)).catch(() => {});
        prefetchShowImages(heroData);
      }

      if (Array.isArray(catData) && catData.length > 0) {
        setCategories(catData);
        AsyncStorage.setItem(CACHE_KEY_CATEGORIES, JSON.stringify(catData)).catch(() => {});
        catData.forEach((c) => prefetchShowImages(c.shows));
      }
    } catch (e) {
      console.warn('Error fetching homepage data:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [prefetchShowImages]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData(true);
  };

  const handleShowPress = (show) => {
    navigation.navigate('ShowDetail', { showId: show.id, show });
  };

  const handlePlayPress = async (show) => {
    const sess = await getAuthSession();
    if (!sess?.token) {
      Alert.alert(
        'Sign In Required',
        'You must sign up or sign in to watch anime shows. Sign up now to start streaming!',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Sign Up / Sign In', onPress: () => navigation.navigate('Library') },
        ]
      );
      return;
    }
    const ep = show.episodes?.[0];
    if (ep && ep.id) {
      navigation.navigate('Player', { episodeId: ep.id, episode: ep, show });
    } else {
      navigation.navigate('ShowDetail', { showId: show.id, show });
    }
  };

  // Dynamically extract available categories & genres so all pills are guaranteed relevant
  const availableTags = useMemo(() => {
    const list = ['All'];
    if (Array.isArray(categories)) {
      categories.forEach((cat) => {
        if (cat.name && !list.includes(cat.name)) {
          list.push(cat.name);
        }
      });
      categories.forEach((cat) => {
        (cat.shows || []).forEach((show) => {
          (show.categories || []).forEach((sc) => {
            const name = sc.category?.name;
            if (name && !list.includes(name)) {
              list.push(name);
            }
          });
        });
      });
    }
    return list;
  }, [categories]);

  const handleTagPress = (tag) => {
    setActiveTag((prev) => (prev === tag ? 'All' : tag));
  };

  // Filter categories by active pill tag
  const displayedCategories = useMemo(() => {
    if (activeTag === 'All') return categories;

    const tagLower = activeTag.toLowerCase();
    return categories
      .map((cat) => {
        const catMatches = cat.name.toLowerCase().includes(tagLower);
        const matchedShows = (cat.shows || []).filter((s) => {
          if (catMatches) return true;
          return (
            s.categories &&
            s.categories.some(
              (sc) =>
                sc.category?.name?.toLowerCase().includes(tagLower) ||
                sc.category?.slug?.toLowerCase().includes(tagLower)
            )
          );
        });

        return {
          ...cat,
          shows: matchedShows,
        };
      })
      .filter((cat) => cat.shows && cat.shows.length > 0);
  }, [categories, activeTag]);

  // Show modern Shimmer Skeleton if loading and no cached data is present
  if (loading && carouselShows.length === 0) {
    return <HomeScreenSkeleton />;
  }

  return (
    <View style={styles.container}>
      <Header
        onSearchPress={() => navigation.navigate('Explore')}
        onProfilePress={() => navigation.navigate('Library')}
      />

      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.primary}
            colors={[COLORS.primary]}
          />
        }
      >
        {/* Full Swipable Hero Carousel (All 5 Featured Shows with Auto-play) */}
        {carouselShows.length > 0 && (
          <HeroCarousel
            shows={carouselShows}
            onPlayPress={handlePlayPress}
            onDetailPress={handleShowPress}
          />
        )}

        {/* Dynamic Category Filter Pills Bar */}
        {availableTags.length > 1 && (
          <View style={styles.tagSection}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.tagScroll}
            >
              {availableTags.map((tag) => {
                const isActive = activeTag === tag;
                return (
                  <TouchableOpacity
                    key={tag}
                    style={[styles.tagPill, isActive && styles.activeTagPill]}
                    onPress={() => handleTagPress(tag)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.tagText, isActive && styles.activeTagText]}>
                      {tag}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        )}

        {/* Empty State when no shows match the filter */}
        {displayedCategories.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="film-outline" size={48} color={COLORS.textSecondary} />
            <Text style={styles.emptyTitle}>No Shows Found</Text>
            <Text style={styles.emptySubtitle}>
              No titles match "{activeTag}". Tap below to view all shows.
            </Text>
            <TouchableOpacity
              style={styles.emptyButton}
              onPress={() => setActiveTag('All')}
              activeOpacity={0.8}
            >
              <Text style={styles.emptyButtonText}>View All Shows</Text>
            </TouchableOpacity>
          </View>
        ) : (
          /* Categories Rail List */
          displayedCategories.map((cat) => {
            if (!cat.shows || cat.shows.length === 0) return null;
            return (
              <View key={cat.id} style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>{cat.name}</Text>
                  <TouchableOpacity
                    onPress={() => navigation.navigate('Explore', { category: cat.name })}
                  >
                    <Text style={styles.seeAllText}>See All ›</Text>
                  </TouchableOpacity>
                </View>

                <FlatList
                  data={cat.shows}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  keyExtractor={(item) => item.id.toString()}
                  renderItem={({ item }) => (
                    <ShowCard show={item} onPress={handleShowPress} />
                  )}
                  contentContainerStyle={styles.railContent}
                  initialNumToRender={4}
                  maxToRenderPerBatch={4}
                  windowSize={3}
                />
              </View>
            );
          })
        )}

        <View style={{ height: 36 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scroll: {
    flex: 1,
  },
  tagSection: {
    marginVertical: 14,
  },
  tagScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  tagPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  activeTagPill: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
    elevation: 4,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 6,
  },
  tagText: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },
  activeTagText: {
    color: '#fff',
    fontWeight: '800',
  },
  section: {
    marginTop: 18,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  sectionTitle: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  seeAllText: {
    color: COLORS.primary,
    fontSize: 13,
    fontWeight: '700',
  },
  railContent: {
    paddingLeft: 16,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    paddingHorizontal: 24,
  },
  emptyTitle: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: '700',
    marginTop: 12,
    marginBottom: 6,
  },
  emptySubtitle: {
    color: COLORS.textMuted,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 18,
  },
  emptyButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  emptyButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },
});

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
const CACHE_KEY_LUNAR_TRENDING = '@infinx_cached_lunar_trending';

export const HomeScreen = ({ navigation }) => {
  const [carouselShows, setCarouselShows] = useState([]);
  const [categories, setCategories] = useState([]);
  const [lunarTrending, setLunarTrending] = useState(null);
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
        const [cachedHero, cachedCats, cachedLunar] = await Promise.all([
          AsyncStorage.getItem(CACHE_KEY_CAROUSEL),
          AsyncStorage.getItem(CACHE_KEY_CATEGORIES),
          AsyncStorage.getItem(CACHE_KEY_LUNAR_TRENDING),
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
        if (cachedLunar) {
          setLunarTrending(JSON.parse(cachedLunar));
        }
      } catch (cacheErr) {
        console.warn('Cache read warning:', cacheErr);
      }
    }

    // 2. Fetch fresh live data from EC2 / Local backend
    try {
      const [heroData, catData, lunarData] = await Promise.all([
        apiService.getCarouselShows(),
        apiService.getCategoriesWithShows(),
        apiService.getLunarTrending(),
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

      if (lunarData && (lunarData.popularThisSeason || lunarData.trendingNow)) {
        setLunarTrending(lunarData);
        AsyncStorage.setItem(CACHE_KEY_LUNAR_TRENDING, JSON.stringify(lunarData)).catch(() => {});
        prefetchShowImages(lunarData.popularThisSeason || []);
        prefetchShowImages(lunarData.trendingNow || []);
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
    const isLunar = Boolean(show.isLunar || (show.id && String(show.id).startsWith('lunar-')));
    const navParams = {
      showId: show.id,
      show,
      isLunar,
      anilistId: show.anilistId,
    };
    if (typeof navigation.push === 'function') {
      navigation.push('ShowDetail', navParams);
    } else {
      navigation.navigate('ShowDetail', navParams);
    }
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
    const isLunar = Boolean(show.isLunar || (show.id && String(show.id).startsWith('lunar-')));
    const ep = show.episodes?.[0] || {
      id: isLunar ? `lunar-${show.anilistId}-1` : 'ep_1',
      episodeNumber: 1,
      title: 'Episode 1',
      isLunar,
      anilistId: show.anilistId,
    };
    navigation.navigate('Player', {
      episodeId: ep.id,
      episode: ep,
      show,
    });
  };

  // Map lunar anime entries into standard show cards
  const mapLunarList = useCallback((list) => {
    if (!Array.isArray(list)) return [];
    return list.map((a) => ({
      id: `lunar-${a.anilistId}`,
      anilistId: a.anilistId,
      isLunar: true,
      title: a.title,
      poster: a.poster,
      posterUrl: a.poster,
      banner: a.banner || a.poster,
      bannerUrl: a.banner || a.poster,
      rating: a.rating || 8.5,
      year: a.year || 2024,
      categories: (a.genres || ['Anime']).map((g) => ({ category: { name: g } })),
      episodes: [
        {
          id: `lunar-${a.anilistId}-1`,
          episodeNumber: 1,
          number: 1,
          title: 'Episode 1',
          thumbnail: a.poster,
          isLunar: true,
          anilistId: a.anilistId,
        },
      ],
    }));
  }, []);

  // Merge regular categories with Lunar Anime sections, prioritizing Anime at the very top
  const combinedCategories = useMemo(() => {
    const animeSections = [];
    if (lunarTrending) {
      const trend = mapLunarList(lunarTrending.trendingNow);
      if (trend.length > 0) {
        animeSections.push({
          id: 'cat_lunar_trending',
          name: 'Trending Anime (Seasonal)',
          slug: 'anime',
          isLunarCategory: true,
          shows: trend,
        });
      }
      const pop = mapLunarList(lunarTrending.popularThisSeason);
      if (pop.length > 0) {
        animeSections.push({
          id: 'cat_lunar_popular',
          name: 'Popular Anime This Season',
          slug: 'anime',
          isLunarCategory: true,
          shows: pop,
        });
      }
      const upcoming = mapLunarList(lunarTrending.upcomingNextSeason);
      if (upcoming.length > 0) {
        animeSections.push({
          id: 'cat_lunar_upcoming',
          name: 'Upcoming Anime Next Season',
          slug: 'anime',
          isLunarCategory: true,
          shows: upcoming,
        });
      }
    }

    // Sort other categories so Anime Series comes immediately after seasonal anime
    const otherCategories = [...(categories || [])].sort((a, b) => {
      const aIsAnime = (a.name || '').toLowerCase().includes('anime');
      const bIsAnime = (b.name || '').toLowerCase().includes('anime');
      if (aIsAnime && !bIsAnime) return -1;
      if (!aIsAnime && bIsAnime) return 1;
      return 0;
    });

    return [...animeSections, ...otherCategories];
  }, [categories, lunarTrending, mapLunarList]);

  // Dynamically extract available categories & genres so all pills are guaranteed relevant
  const availableTags = useMemo(() => {
    const list = ['All', 'Anime'];
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
    if (activeTag === 'All') return combinedCategories;

    const tagLower = activeTag.toLowerCase();
    if (tagLower === 'anime') {
      return combinedCategories.filter((c) => c.isLunarCategory || c.slug === 'anime' || c.name.toLowerCase().includes('anime'));
    }

    return combinedCategories
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
  }, [combinedCategories, activeTag]);

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

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ShowCard } from '../components/ShowCard';
import { COLORS } from '../theme/colors';
import { apiService } from '../services/api';

const ANIME_GENRES = [
  'All',
  'Action',
  'Adventure',
  'Fantasy',
  'Shounen',
  'Romance',
  'Sci-Fi',
  'Comedy',
  'Supernatural',
  'Mystery',
  'Slice of Life',
  'Horror',
];

const SHOW_GENRES = ['All', 'Action', 'Dark Fantasy', 'Supernatural', 'Shounen', 'Romance'];

export const ExploreScreen = ({ navigation, route }) => {
  const initialCat = route.params?.category || 'All';
  const isAnimeInitial =
    Boolean(route.params?.isAnimeTab) ||
    initialCat.toLowerCase().includes('anime') ||
    true; // Default to Anime catalog for rich experience

  const [activeTab, setActiveTab] = useState(isAnimeInitial ? 'anime' : 'shows'); // 'anime' | 'shows'
  const [query, setQuery] = useState('');
  const [selectedGenre, setSelectedGenre] = useState(initialCat.toLowerCase().includes('anime') ? 'All' : initialCat);
  const [shows, setShows] = useState([]);
  const [loading, setLoading] = useState(true);

  const genresList = activeTab === 'anime' ? ANIME_GENRES : SHOW_GENRES;

  const fetchShows = useCallback(async (searchQuery, genre, tab) => {
    setLoading(true);
    try {
      if (tab === 'anime') {
        let results = [];
        if (searchQuery.trim().length > 0) {
          const searchData = await apiService.searchLunarAnime(searchQuery.trim(), 24);
          results = Array.isArray(searchData) ? searchData : [];
        } else {
          const browseData = await apiService.browseLunarAnime({
            genre: genre !== 'All' ? genre : undefined,
            sort: 'TRENDING_DESC',
            limit: 28,
          });
          results = browseData?.media || [];
        }

        const mapped = results.map((item) => ({
          id: `lunar-${item.anilistId}`,
          anilistId: item.anilistId,
          isLunar: true,
          title: item.title,
          poster: item.poster,
          posterUrl: item.poster,
          banner: item.banner || item.poster,
          bannerUrl: item.banner || item.poster,
          rating: item.rating || 8.5,
          year: item.year || 2024,
          format: item.format,
          categories: (item.genres || ['Anime']).map((g) => ({ category: { name: g } })),
          episodes: [
            {
              id: `lunar-${item.anilistId}-1`,
              episodeNumber: 1,
              title: 'Episode 1',
              isLunar: true,
              anilistId: item.anilistId,
            },
          ],
        }));

        setShows(mapped);
      } else {
        if (searchQuery.trim().length > 0) {
          const results = await apiService.searchShows(searchQuery);
          setShows(results);
        } else {
          const carousel = await apiService.getCarouselShows();
          const filtered =
            genre === 'All'
              ? carousel
              : carousel.filter((s) =>
                (s.categories || []).some((c) =>
                  c.category?.name?.toLowerCase().includes(genre.toLowerCase())
                )
              );
          setShows(filtered.length > 0 ? filtered : carousel);
        }
      }
    } catch (e) {
      console.error('Error fetching explore shows:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchShows(query, selectedGenre, activeTab);
    }, 250);
    return () => clearTimeout(timer);
  }, [query, selectedGenre, activeTab, fetchShows]);

  const handleTabSwitch = (tab) => {
    if (tab === activeTab) return;
    setActiveTab(tab);
    setSelectedGenre('All');
  };

  const handleShowPress = (show) => {
    navigation.navigate('ShowDetail', {
      showId: show.id,
      show,
      isLunar: Boolean(show.isLunar),
      anilistId: show.anilistId,
    });
  };

  const cardWidth = Math.floor((Dimensions.get('window').width - 44) / 2);

  return (
    <View style={styles.container}>
      {/* Header Search Bar */}
      <View style={styles.header}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={18} color={COLORS.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder={
              activeTab === 'anime'
                ? 'Search anime series, movies...'
                : 'Search shows, movies, genres...'
            }
            placeholderTextColor={COLORS.textMuted}
            value={query}
            onChangeText={setQuery}
            autoCapitalize="none"
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery('')}>
              <Ionicons name="close-circle" size={18} color={COLORS.textMuted} />
            </TouchableOpacity>
          )}
        </View>

        {/* Tab Switcher: Anime Catalog vs Shows & Movies 
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'anime' && styles.tabButtonActive]}
            onPress={() => handleTabSwitch('anime')}
            activeOpacity={0.8}
          >
            <Ionicons
              name="sparkles"
              size={14}
              color={activeTab === 'anime' ? '#fff' : COLORS.textMuted}
            />
            <Text style={[styles.tabText, activeTab === 'anime' && styles.tabTextActive]}>
              Anime Catalog
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'shows' && styles.tabButtonActive]}
            onPress={() => handleTabSwitch('shows')}
            activeOpacity={0.8}
          >
            <Ionicons
              name="film-outline"
              size={14}
              color={activeTab === 'shows' ? '#fff' : COLORS.textMuted}
            />
            <Text style={[styles.tabText, activeTab === 'shows' && styles.tabTextActive]}>
              Shows & Movies
            </Text>
          </TouchableOpacity>
        </View>*/}
      </View>

      {/* Genre Filter Pills */}
      <View style={styles.genreRow}>
        <FlatList
          data={genresList}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => item}
          renderItem={({ item }) => {
            const active = selectedGenre === item;
            return (
              <TouchableOpacity
                style={[styles.genrePill, active && styles.activeGenrePill]}
                onPress={() => setSelectedGenre(item)}
                activeOpacity={0.7}
              >
                <Text style={[styles.genreText, active && styles.activeGenreText]}>
                  {item}
                </Text>
              </TouchableOpacity>
            );
          }}
          contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
        />
      </View>

      {/* Results Header */}
      <View style={styles.resultsHeader}>
        <Text style={styles.resultsTitle}>
          {query
            ? `Search Results for "${query}"`
            : activeTab === 'anime'
              ? `${selectedGenre === 'All' ? 'Trending' : selectedGenre} Anime`
              : 'Discover Titles'}
        </Text>
        <Text style={styles.resultsCount}>{shows.length} titles found</Text>
      </View>

      {/* Grid of Shows */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : shows.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="film-outline" size={48} color={COLORS.textMuted} />
          <Text style={styles.emptyText}>
            {query
              ? `No anime found matching "${query}"`
              : 'No titles found in this category'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={shows}
          numColumns={2}
          keyExtractor={(item) => item.id.toString()}
          columnWrapperStyle={styles.columnWrapper}
          contentContainerStyle={styles.gridContent}
          renderItem={({ item }) => (
            <ShowCard
              show={item}
              onPress={handleShowPress}
              width={cardWidth}
              height={cardWidth * 1.45}
            />
          )}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 6,
    gap: 10,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 46,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    color: COLORS.text,
    fontSize: 14,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 10,
    padding: 3,
    gap: 4,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 7,
    borderRadius: 8,
    gap: 6,
  },
  tabButtonActive: {
    backgroundColor: COLORS.primary,
  },
  tabText: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontWeight: '700',
  },
  tabTextActive: {
    color: '#fff',
    fontWeight: '800',
  },
  genreRow: {
    marginVertical: 6,
  },
  genrePill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  activeGenrePill: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  genreText: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },
  activeGenreText: {
    color: '#fff',
    fontWeight: '800',
  },
  resultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginVertical: 8,
  },
  resultsTitle: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: '800',
  },
  resultsCount: {
    color: COLORS.textMuted,
    fontSize: 12,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
    gap: 12,
  },
  emptyText: {
    color: COLORS.textMuted,
    fontSize: 14,
    textAlign: 'center',
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

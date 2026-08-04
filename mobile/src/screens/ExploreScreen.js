import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  ActivityIndicator 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ShowCard } from '../components/ShowCard';
import { COLORS } from '../theme/colors';
import { apiService } from '../services/api';

const GENRES = ['All', 'Action', 'Dark Fantasy', 'Supernatural', 'Shounen', 'Romance'];

export const ExploreScreen = ({ navigation, route }) => {
  const initialCat = route.params?.category || 'All';
  const [query, setQuery] = useState('');
  const [selectedGenre, setSelectedGenre] = useState(initialCat);
  const [shows, setShows] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchShows = async (searchQuery) => {
    setLoading(true);
    try {
      if (searchQuery.trim().length > 0) {
        const results = await apiService.searchShows(searchQuery);
        setShows(results);
      } else {
        const carousel = await apiService.getCarouselShows();
        setShows(carousel);
      }
    } catch (e) {
      console.error('Error fetching explore shows:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShows(query);
  }, [query]);

  const handleShowPress = (show) => {
    navigation.navigate('ShowDetail', { showId: show.id, show });
  };

  return (
    <View style={styles.container}>
      {/* Header Search Bar */}
      <View style={styles.header}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={18} color={COLORS.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search anime, movies, genres..."
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
      </View>

      {/* Genre Filter Pills */}
      <View style={styles.genreRow}>
        <FlatList
          data={GENRES}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => item}
          renderItem={({ item }) => {
            const active = selectedGenre === item;
            return (
              <TouchableOpacity
                style={[styles.genrePill, active && styles.activeGenrePill]}
                onPress={() => setSelectedGenre(item)}
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
          {query ? `Search Results for "${query}"` : 'Discover Anime'}
        </Text>
        <Text style={styles.resultsCount}>{shows.length} shows found</Text>
      </View>

      {/* Grid of Shows */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : shows.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="film-outline" size={48} color={COLORS.textMuted} />
          <Text style={styles.emptyText}>No shows found matching "{query}"</Text>
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
              width={160}
              height={230}
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
    paddingBottom: 8,
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
  genreRow: {
    marginVertical: 8,
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
    marginVertical: 10,
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

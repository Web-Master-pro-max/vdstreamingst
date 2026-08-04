import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  ActivityIndicator, 
  RefreshControl 
} from 'react-native';
import { Header } from '../components/Header';
import { HeroBanner } from '../components/HeroBanner';
import { ShowCard } from '../components/ShowCard';
import { COLORS } from '../theme/colors';
import { apiService } from '../services/api';

const CATEGORY_TAGS = ['All', 'Action', 'Dark Fantasy', 'Supernatural', 'Shounen', 'Romance'];

export const HomeScreen = ({ navigation }) => {
  const [carouselShows, setCarouselShows] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTag, setActiveTag] = useState('All');
  const [heroIndex, setHeroIndex] = useState(0);

  const loadData = async () => {
    try {
      const [heroData, catData] = await Promise.all([
        apiService.getCarouselShows(),
        apiService.getCategoriesWithShows()
      ]);
      setCarouselShows(heroData);
      setCategories(catData);
    } catch (e) {
      console.error('Error loading homepage data:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleShowPress = (show) => {
    navigation.navigate('ShowDetail', { showId: show.id, show });
  };

  const handlePlayPress = (show) => {
    const epId = show.episodes?.[0]?.id || 1;
    navigation.navigate('Player', { episodeId: epId, show });
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading Infinx Anime...</Text>
      </View>
    );
  }

  const currentHero = carouselShows[heroIndex] || carouselShows[0];

  return (
    <View style={styles.container}>
      <Header 
        onSearchPress={() => navigation.navigate('Explore')} 
        onProfilePress={() => navigation.navigate('Library')}
      />

      <ScrollView 
        style={styles.scroll}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh} 
            tintColor={COLORS.primary} 
          />
        }
      >
        {/* Featured Hero Banner */}
        {currentHero && (
          <HeroBanner 
            show={currentHero} 
            onPlayPress={handlePlayPress}
            onDetailPress={handleShowPress}
          />
        )}

        {/* Category Pills Bar */}
        <View style={styles.tagSection}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tagScroll}>
            {CATEGORY_TAGS.map((tag) => {
              const isActive = activeTag === tag;
              return (
                <TouchableOpacity
                  key={tag}
                  style={[styles.tagPill, isActive && styles.activeTagPill]}
                  onPress={() => setActiveTag(tag)}
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

        {/* Categories Rail List */}
        {categories.map((cat) => {
          if (!cat.shows || cat.shows.length === 0) return null;
          return (
            <View key={cat.id} style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>{cat.name}</Text>
                <TouchableOpacity onPress={() => navigation.navigate('Explore', { category: cat.name })}>
                  <Text style={styles.seeAllText}>See All ›</Text>
                </TouchableOpacity>
              </View>

              <FlatList 
                data={cat.shows}
                horizontal
                showsHorizontalScrollIndicator={false}
                keyExtractor={(item) => item.id.toString()}
                renderItem={({ item }) => (
                  <ShowCard 
                    show={item} 
                    onPress={handleShowPress} 
                  />
                )}
                contentContainerStyle={styles.railContent}
              />
            </View>
          );
        })}

        <View style={{ height: 30 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    gap: 12,
  },
  loadingText: {
    color: COLORS.textMuted,
    fontSize: 14,
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
    marginTop: 16,
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
});

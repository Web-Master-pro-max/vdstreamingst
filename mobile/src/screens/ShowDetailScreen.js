import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  Image, 
  ScrollView, 
  StyleSheet, 
  TouchableOpacity, 
  ActivityIndicator,
  Alert 
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, GRADIENTS } from '../theme/colors';
import { apiService } from '../services/api';

export const ShowDetailScreen = ({ route, navigation }) => {
  const { showId, show: initialShow } = route.params || {};
  const [show, setShow] = useState(initialShow || null);
  const [loading, setLoading] = useState(!initialShow);
  const [bookmarked, setBookmarked] = useState(false);

  useEffect(() => {
    const fetchDetails = async () => {
      if (!showId) return;
      try {
        const data = await apiService.getShowById(showId);
        setShow(data);
      } catch (e) {
        console.error('Error fetching show details:', e);
      } finally {
        setLoading(false);
      }
    };
    fetchDetails();
  }, [showId]);

  if (loading || !show) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  const rating = show.rating ? parseFloat(show.rating).toFixed(1) : '4.9';
  const bannerUrl = show.bannerUrl || show.posterUrl || 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=800';
  const episodes = show.episodes && show.episodes.length > 0 ? show.episodes : [
    { id: 101, episodeNumber: 1, title: 'Episode 1: Awakening', duration: '24m' },
    { id: 102, episodeNumber: 2, title: 'Episode 2: The Rising Storm', duration: '23m' },
    { id: 103, episodeNumber: 3, title: 'Episode 3: Unbreakable Bond', duration: '25m' },
  ];

  const handlePlayEpisode = (episode) => {
    navigation.navigate('Player', { episodeId: episode.id, episode, show });
  };

  const toggleBookmark = () => {
    setBookmarked(!bookmarked);
    Alert.alert(
      bookmarked ? 'Removed from Watchlist' : 'Added to Watchlist',
      bookmarked ? `"${show.title}" removed from your list.` : `"${show.title}" saved to your Watchlist.`
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scroll}>
        {/* Top Backdrop Header */}
        <View style={styles.backdropContainer}>
          <Image source={{ uri: bannerUrl }} style={styles.backdropImage} resizeMode="cover" />
          <LinearGradient colors={GRADIENTS.heroOverlay} style={styles.gradientOverlay}>
            <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
              <Ionicons name="chevron-back" size={24} color="#fff" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.bookmarkBtn} onPress={toggleBookmark}>
              <Ionicons 
                name={bookmarked ? "bookmark" : "bookmark-outline"} 
                size={22} 
                color={bookmarked ? COLORS.primary : "#fff"} 
              />
            </TouchableOpacity>
          </LinearGradient>
        </View>

        {/* Content Details */}
        <View style={styles.content}>
          <Text style={styles.title}>{show.title}</Text>

          {/* Badges Row */}
          <View style={styles.metaRow}>
            <View style={styles.ratingBadge}>
              <Ionicons name="star" size={13} color={COLORS.ratingGold} />
              <Text style={styles.ratingText}>{rating}</Text>
            </View>

            {show.year && <Text style={styles.metaText}>{show.year}</Text>}
            <Text style={styles.metaDot}>•</Text>
            <Text style={styles.metaText}>{episodes.length} Episodes</Text>
            <Text style={styles.metaDot}>•</Text>
            <View style={styles.hdBadge}><Text style={styles.hdText}>HD</Text></View>
          </View>

          {/* Genres Chips */}
          <View style={styles.genreRow}>
            {show.categories?.map((catObj, index) => (
              <View key={index} style={styles.genreChip}>
                <Text style={styles.genreChipText}>
                  {catObj.category?.name || 'Anime'}
                </Text>
              </View>
            ))}
          </View>

          {/* Main Action Play Button */}
          <TouchableOpacity 
            style={styles.mainPlayBtn}
            onPress={() => handlePlayEpisode(episodes[0])}
            activeOpacity={0.8}
          >
            <Ionicons name="play" size={22} color="#fff" />
            <Text style={styles.mainPlayText}>PLAY EPISODE 1</Text>
          </TouchableOpacity>

          {/* Description */}
          <Text style={styles.sectionHeading}>Synopsis</Text>
          <Text style={styles.description}>
            {show.description || "No synopsis available for this show."}
          </Text>

          {/* Episodes List */}
          <Text style={styles.sectionHeading}>Episodes ({episodes.length})</Text>
          <View style={styles.episodesList}>
            {episodes.map((ep) => (
              <TouchableOpacity 
                key={ep.id} 
                style={styles.episodeCard}
                onPress={() => handlePlayEpisode(ep)}
                activeOpacity={0.7}
              >
                <View style={styles.epNumBadge}>
                  <Text style={styles.epNumText}>EP {ep.episodeNumber}</Text>
                </View>

                <View style={styles.epInfo}>
                  <Text style={styles.epTitle} numberOfLines={1}>
                    {ep.title}
                  </Text>
                  <Text style={styles.epDuration}>{ep.duration || '24m'}</Text>
                </View>

                <View style={styles.epPlayBtn}>
                  <Ionicons name="play" size={16} color={COLORS.primary} />
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={{ height: 40 }} />
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
  },
  scroll: {
    flex: 1,
  },
  backdropContainer: {
    height: 280,
    width: '100%',
    position: 'relative',
  },
  backdropImage: {
    width: '100%',
    height: '100%',
  },
  gradientOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'space-between',
    padding: 16,
    paddingTop: 44,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bookmarkBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-end',
  },
  content: {
    paddingHorizontal: 18,
    marginTop: -20,
  },
  title: {
    color: COLORS.text,
    fontSize: 26,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(255,184,0,0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  ratingText: {
    color: COLORS.ratingGold,
    fontSize: 12,
    fontWeight: '800',
  },
  metaText: {
    color: COLORS.textMuted,
    fontSize: 12,
  },
  metaDot: {
    color: COLORS.textMuted,
  },
  hdBadge: {
    backgroundColor: 'rgba(0,240,255,0.15)',
    borderColor: COLORS.secondary,
    borderWidth: 0.8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  hdText: {
    color: COLORS.secondary,
    fontSize: 9,
    fontWeight: '800',
  },
  genreRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  genreChip: {
    backgroundColor: COLORS.card,
    borderColor: COLORS.cardBorder,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
  },
  genreChipText: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontWeight: '600',
  },
  mainPlayBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
    marginTop: 18,
    elevation: 6,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.6,
    shadowRadius: 10,
  },
  mainPlayText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  sectionHeading: {
    color: COLORS.text,
    fontSize: 17,
    fontWeight: '800',
    marginTop: 22,
    marginBottom: 8,
  },
  description: {
    color: COLORS.textMuted,
    fontSize: 13,
    lineHeight: 20,
  },
  episodesList: {
    gap: 10,
    marginTop: 6,
  },
  episodeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderColor: COLORS.cardBorder,
    borderWidth: 1,
    padding: 12,
    borderRadius: 12,
    gap: 12,
  },
  epNumBadge: {
    backgroundColor: 'rgba(255, 0, 85, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  epNumText: {
    color: COLORS.primary,
    fontSize: 11,
    fontWeight: '800',
  },
  epInfo: {
    flex: 1,
  },
  epTitle: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '700',
  },
  epDuration: {
    color: COLORS.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
  epPlayBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingLeft: 2,
  },
});

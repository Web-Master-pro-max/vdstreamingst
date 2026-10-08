import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  Image, 
  ScrollView, 
  StyleSheet, 
  TouchableOpacity, 
  ActivityIndicator,
  Alert,
  BackHandler
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, GRADIENTS } from '../theme/colors';
import {
  apiService,
  formatMediaUrl,
  getShowBannerMedia,
  isWatchlisted,
  toggleWatchlist,
  getAuthSession,
  getShowEpisodesProgress,
} from '../services/api';

const formatTime = (millis, totalMillis = 0) => {
  if (!millis || millis <= 0) return '0:00';
  const totalSeconds = Math.floor(millis / 1000);
  const hrs = Math.floor(totalSeconds / 3600);
  const mins = Math.floor((totalSeconds % 3600) / 60);
  const secs = totalSeconds % 60;
  if (hrs > 0 || totalMillis >= 3600000) {
    return `${hrs}:${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
  }
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
};

export const ShowDetailScreen = ({ route, navigation }) => {
  const { showId, show: initialShow } = route.params || {};
  const [show, setShow] = useState(initialShow || null);
  const [loading, setLoading] = useState(!initialShow);
  const [bookmarked, setBookmarked] = useState(false);
  const [progressData, setProgressData] = useState({ episodes: {}, lastWatched: null });

  useEffect(() => {
    const onBackPress = () => {
      if (navigation.canGoBack()) {
        navigation.goBack();
      } else {
        navigation.navigate('Home');
      }
      return true;
    };
    const sub = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => sub.remove();
  }, [navigation]);

  // Check initial bookmark / watchlist status
  useEffect(() => {
    const targetId = showId || initialShow?.id;
    if (targetId) {
      isWatchlisted(targetId).then(setBookmarked).catch(() => {});
    }
  }, [showId, initialShow?.id]);

  // Load episode progress on mount and every time screen gains focus
  useEffect(() => {
    const loadProgress = async () => {
      const targetId = showId || show?.id || initialShow?.id;
      if (targetId) {
        const data = await getShowEpisodesProgress(targetId);
        setProgressData(data);
      }
    };
    loadProgress();
    const unsubscribe = navigation.addListener('focus', loadProgress);
    return unsubscribe;
  }, [navigation, showId, show?.id, initialShow?.id]);

  useEffect(() => {
    const fetchDetails = async () => {
      if (!showId) return;
      try {
        const data = await apiService.getShowById(showId);
        setShow(data);
        if (data?.id) {
          const isBookmarked = await isWatchlisted(data.id);
          setBookmarked(isBookmarked);
          const prog = await getShowEpisodesProgress(data.id);
          setProgressData(prog);
        }
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
  const { bannerUrl, posterUrl, isVideo } = getShowBannerMedia(show);
  const backdropImageUri = isVideo ? (posterUrl || bannerUrl) : (bannerUrl || posterUrl);
  const episodes = show.episodes && show.episodes.length > 0 ? show.episodes : [
    { id: 101, episodeNumber: 1, title: 'Episode 1: Awakening', duration: '24m', videoUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8' },
    { id: 102, episodeNumber: 2, title: 'Episode 2: The Rising Storm', duration: '23m', videoUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8' },
    { id: 103, episodeNumber: 3, title: 'Episode 3: Unbreakable Bond', duration: '25m', videoUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8' },
  ];

  const handlePlayEpisode = async (episode, seekMillis = 0) => {
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
    navigation.navigate('Player', {
      episodeId: episode.id,
      episode,
      show,
      initialPositionMillis: seekMillis || 0,
    });
  };

  const toggleBookmark = async () => {
    if (!show) return;
    try {
      const res = await toggleWatchlist(show);
      setBookmarked(res.bookmarked);
      Alert.alert(
        res.bookmarked ? 'Added to Watchlist' : 'Removed from Watchlist',
        res.bookmarked ? `"${show.title}" saved to your Watchlist.` : `"${show.title}" removed from your list.`
      );
    } catch (e) {
      console.warn('Watchlist toggle error:', e);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scroll}>
        {/* Top Backdrop Header */}
        <View style={styles.backdropContainer}>
          <Image source={{ uri: backdropImageUri }} style={styles.backdropImage} resizeMode="cover" />
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
          {(() => {
            const episodesProgress = progressData.episodes || {};
            const lastWatched = progressData.lastWatched;

            const completedEpisodesCount = episodes.filter((ep) => {
              const epProg = episodesProgress[ep.id] || episodesProgress[`ep_${ep.episodeNumber}`];
              return epProg?.completed;
            }).length;

            const totalEpisodesCount = episodes.length;
            const remainingEpisodesCount = Math.max(0, totalEpisodesCount - completedEpisodesCount);
            const overallCompletionPercent = totalEpisodesCount > 0
              ? Math.round((completedEpisodesCount / totalEpisodesCount) * 100)
              : 0;

            let resumeEpisode = episodes[0];
            let resumeProgress = null;
            if (lastWatched) {
              const matched = episodes.find(e => e.id === lastWatched.episodeId || e.episodeNumber === lastWatched.episodeNumber);
              if (matched) {
                resumeEpisode = matched;
                resumeProgress = lastWatched;
              }
            }

            const hasResumeProgress = resumeProgress && resumeProgress.positionMillis > 1000 && !resumeProgress.completed;

            return (
              <>
                <TouchableOpacity 
                  style={styles.mainPlayBtn}
                  onPress={() => handlePlayEpisode(resumeEpisode, hasResumeProgress ? resumeProgress.positionMillis : 0)}
                  activeOpacity={0.8}
                >
                  <Ionicons name="play" size={22} color="#fff" />
                  <Text style={styles.mainPlayText}>
                    {hasResumeProgress
                      ? `RESUME EPISODE ${resumeEpisode.episodeNumber} (${formatTime(resumeProgress.positionMillis, resumeProgress.durationMillis)})`
                      : `PLAY EPISODE ${resumeEpisode.episodeNumber || 1}`}
                  </Text>
                </TouchableOpacity>

                {/* Requirement 5: Overall Series Progress Tracker Card */}
                <View style={styles.seriesProgressCard}>
                  <View style={styles.progressCardHeader}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Ionicons name="pie-chart-outline" size={16} color={COLORS.primary} />
                      <Text style={styles.progressCardTitle}>Watch Progress</Text>
                    </View>
                    <Text style={styles.progressCardPercent}>{overallCompletionPercent}% Completed</Text>
                  </View>

                  {/* Overall Progress Bar Track */}
                  <View style={styles.overallTrack}>
                    <View style={[styles.overallFill, { width: `${overallCompletionPercent}%` }]} />
                  </View>

                  {/* Detailed Stats Chips */}
                  <View style={styles.progressStatsRow}>
                    <View style={styles.statChip}>
                      <Ionicons name="checkmark-circle" size={14} color="#00ff88" />
                      <Text style={styles.statChipText}>
                        <Text style={styles.statChipBold}>{completedEpisodesCount}</Text> Completed
                      </Text>
                    </View>

                    <View style={styles.statChip}>
                      <Ionicons name="time-outline" size={14} color="#ffaa00" />
                      <Text style={styles.statChipText}>
                        <Text style={styles.statChipBold}>{remainingEpisodesCount}</Text> Left
                      </Text>
                    </View>

                    <View style={styles.statChip}>
                      <Ionicons name="layers-outline" size={14} color={COLORS.secondary} />
                      <Text style={styles.statChipText}>
                        <Text style={styles.statChipBold}>{totalEpisodesCount}</Text> Total
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Description */}
                <Text style={styles.sectionHeading}>Synopsis</Text>
                <Text style={styles.description}>
                  {show.description || "No synopsis available for this show."}
                </Text>

                {/* Episodes List Header */}
                <View style={styles.sectionHeaderRow}>
                  <Text style={styles.sectionHeading}>Episodes ({episodes.length})</Text>
                  <Text style={styles.sectionProgressSub}>
                    {completedEpisodesCount} Watched • {remainingEpisodesCount} Left
                  </Text>
                </View>

                {/* Episodes List */}
                <View style={styles.episodesList}>
                  {episodes.map((ep) => {
                    const epProg = episodesProgress[ep.id] || episodesProgress[`ep_${ep.episodeNumber}`];
                    const isCompleted = epProg?.completed;
                    const isInProgress = epProg && epProg.positionMillis > 1000 && !isCompleted;
                    const isCurrentResume = resumeEpisode && (resumeEpisode.id === ep.id || resumeEpisode.episodeNumber === ep.episodeNumber);

                    return (
                      <TouchableOpacity 
                        key={ep.id} 
                        style={[
                          styles.episodeCard,
                          isCurrentResume && styles.episodeCardCurrent,
                          isCompleted && styles.episodeCardCompleted,
                        ]}
                        onPress={() => handlePlayEpisode(ep, epProg?.positionMillis || 0)}
                        activeOpacity={0.7}
                      >
                        <View style={[
                          styles.epNumBadge,
                          isCurrentResume && styles.epNumBadgeCurrent,
                          isCompleted && styles.epNumBadgeCompleted,
                        ]}>
                          <Text style={[
                            styles.epNumText,
                            (isCurrentResume || isCompleted) && styles.epNumTextHighlight,
                          ]}>
                            EP {ep.episodeNumber}
                          </Text>
                        </View>

                        <View style={styles.epInfo}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                            <Text style={[styles.epTitle, isCurrentResume && styles.epTitleCurrent]} numberOfLines={1}>
                              {ep.title}
                            </Text>
                            {isCompleted && (
                              <View style={styles.completedBadge}>
                                <Ionicons name="checkmark-circle" size={11} color="#00ff88" />
                                <Text style={styles.completedBadgeText}>Watched</Text>
                              </View>
                            )}
                            {isInProgress && (
                              <View style={styles.inProgressBadge}>
                                <Text style={styles.inProgressBadgeText}>{epProg.progressPercent}%</Text>
                              </View>
                            )}
                          </View>

                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 3 }}>
                            <Text style={styles.epDuration}>{ep.duration || '24m'}</Text>
                            {isInProgress && (
                              <Text style={styles.epResumeTime}>
                                • Left at {formatTime(epProg.positionMillis, epProg.durationMillis)}
                              </Text>
                            )}
                          </View>

                          {/* Progress Fill Bar inside episode card */}
                          {(isInProgress || isCompleted) && (
                            <View style={styles.cardProgressTrack}>
                              <View
                                style={[
                                  styles.cardProgressFill,
                                  {
                                    width: `${isCompleted ? 100 : epProg.progressPercent}%`,
                                    backgroundColor: isCompleted ? '#00ff88' : COLORS.primary,
                                  }
                                ]}
                              />
                            </View>
                          )}
                        </View>

                        <View style={[
                          styles.epPlayBtn,
                          isCompleted && styles.epPlayBtnCompleted,
                          isCurrentResume && styles.epPlayBtnCurrent,
                        ]}>
                          <Ionicons
                            name={isCompleted ? "checkmark" : (isCurrentResume ? "play-circle" : "play")}
                            size={isCurrentResume ? 18 : 15}
                            color={isCompleted ? "#00ff88" : COLORS.primary}
                          />
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </>
            );
          })()}
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
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingLeft: 2,
  },
  epPlayBtnCompleted: {
    backgroundColor: 'rgba(0, 255, 136, 0.12)',
    paddingLeft: 0,
  },
  epPlayBtnCurrent: {
    backgroundColor: COLORS.primary,
    paddingLeft: 0,
  },

  /* Series Progress Card */
  seriesProgressCard: {
    backgroundColor: '#12121e',
    borderRadius: 14,
    padding: 14,
    marginTop: 18,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    gap: 10,
  },
  progressCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressCardTitle: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  progressCardPercent: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: '800',
  },
  overallTrack: {
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 3,
    overflow: 'hidden',
    width: '100%',
  },
  overallFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 3,
  },
  progressStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  statChipText: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontWeight: '600',
  },
  statChipBold: {
    color: '#fff',
    fontWeight: '800',
  },

  /* Section Header with sub stats */
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginTop: 22,
    marginBottom: 8,
  },
  sectionProgressSub: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },

  /* Episode Card States */
  episodeCardCurrent: {
    borderColor: COLORS.primary,
    backgroundColor: 'rgba(255, 0, 85, 0.06)',
  },
  episodeCardCompleted: {
    borderColor: 'rgba(0, 255, 136, 0.25)',
    backgroundColor: 'rgba(0, 255, 136, 0.03)',
  },
  epNumBadgeCurrent: {
    backgroundColor: COLORS.primary,
  },
  epNumBadgeCompleted: {
    backgroundColor: 'rgba(0, 255, 136, 0.15)',
  },
  epNumTextHighlight: {
    color: '#fff',
  },
  epTitleCurrent: {
    color: '#fff',
    fontWeight: '800',
  },
  completedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(0, 255, 136, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  completedBadgeText: {
    color: '#00ff88',
    fontSize: 10,
    fontWeight: '800',
  },
  inProgressBadge: {
    backgroundColor: 'rgba(255, 0, 85, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  inProgressBadgeText: {
    color: COLORS.primary,
    fontSize: 10,
    fontWeight: '800',
  },
  epResumeTime: {
    color: COLORS.primary,
    fontSize: 11,
    fontWeight: '600',
  },
  cardProgressTrack: {
    height: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 2,
    overflow: 'hidden',
    width: '100%',
    marginTop: 6,
  },
  cardProgressFill: {
    height: '100%',
    borderRadius: 2,
  },
});

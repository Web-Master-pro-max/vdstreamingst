import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ActivityIndicator, 
  Dimensions, 
  TouchableWithoutFeedback,
  Modal,
  ScrollView,
  Switch,
  Platform
} from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { COLORS } from '../theme/colors';
import { apiService, formatMediaUrl } from '../services/api';

const { width, height } = Dimensions.get('window');
const SAMPLE_STREAM = "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8";

export const PlayerScreen = ({ route, navigation }) => {
  const { episodeId, episode: initialEpisode, show: initialShow } = route.params || {};

  const [show, setShow] = useState(initialShow || null);
  const [episode, setEpisode] = useState(initialEpisode || null);
  const [episodesList, setEpisodesList] = useState(initialShow?.episodes || []);
  
  const [loading, setLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [playbackError, setPlaybackError] = useState(false);

  // Playback Stats
  const [positionMillis, setPositionMillis] = useState(0);
  const [durationMillis, setDurationMillis] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1.0);
  const [resizeMode, setResizeMode] = useState(ResizeMode.CONTAIN);
  const [autoNext, setAutoNext] = useState(true);

  // Modals
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [episodesVisible, setEpisodesVisible] = useState(false);
  const [activeStreamUrl, setActiveStreamUrl] = useState(null);

  const videoRef = useRef(null);
  const controlsTimeoutRef = useRef(null);

  // Sync active stream URL when episode updates
  useEffect(() => {
    if (episode) {
      const rawUrl = episode?.masterPlaylistUrl || episode?.videoUrl || episode?.streamUrl || SAMPLE_STREAM;
      setActiveStreamUrl(rawUrl);
      setPlaybackError(false);
    }
  }, [episode]);

  // Load episode and show metadata
  useEffect(() => {
    let isMounted = true;
    const loadData = async () => {
      setLoading(true);
      setPlaybackError(false);
      try {
        let currentEp = initialEpisode;
        if (episodeId && (!currentEp || !currentEp.videoUrl)) {
          const fetchedEp = await apiService.getEpisodeById(episodeId);
          if (fetchedEp) currentEp = fetchedEp;
        }
        if (isMounted && currentEp) setEpisode(currentEp);

        let parentShow = initialShow;
        const targetShowId = currentEp?.showId || initialShow?.id;
        if (targetShowId && (!parentShow || !parentShow.episodes)) {
          const fetchedShow = await apiService.getShowById(targetShowId);
          if (fetchedShow) parentShow = fetchedShow;
        }
        if (isMounted && parentShow) {
          setShow(parentShow);
          if (parentShow.episodes && parentShow.episodes.length > 0) {
            setEpisodesList(parentShow.episodes);
          }
        }
      } catch (err) {
        console.warn('Error loading player data:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadData();
    return () => { isMounted = false; };
  }, [episodeId]);

  // Controls Auto-Hide Timer
  const resetControlsTimeout = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    controlsTimeoutRef.current = setTimeout(() => {
      setShowControls(false);
    }, 4500);
  };

  useEffect(() => {
    resetControlsTimeout();
    return () => {
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    };
  }, []);

  // Update Status & Handle Auto Next
  const handlePlaybackStatusUpdate = (status) => {
    if (status.isLoaded) {
      setPositionMillis(status.positionMillis || 0);
      setDurationMillis(status.durationMillis || 0);
      setIsPlaying(status.isPlaying);

      if (status.didJustFinish && !status.isLooping) {
        if (autoNext && episodesList.length > 0) {
          playNextEpisode();
        }
      }
    } else if (status.error) {
      console.warn('Playback error:', status.error);
      setPlaybackError(true);
    }
  };

  // Play / Pause
  const togglePlayPause = async () => {
    resetControlsTimeout();
    if (!videoRef.current) return;
    if (isPlaying) {
      await videoRef.current.pauseAsync();
    } else {
      await videoRef.current.playAsync();
    }
  };

  // Mute / Unmute
  const toggleMute = async () => {
    resetControlsTimeout();
    if (!videoRef.current) return;
    await videoRef.current.setIsMutedAsync(!isMuted);
    setIsMuted(!isMuted);
  };

  // Seek ±10s
  const skipForward = async () => {
    resetControlsTimeout();
    if (!videoRef.current) return;
    const newPos = Math.min(positionMillis + 10000, durationMillis);
    await videoRef.current.setPositionAsync(newPos);
  };

  const skipBackward = async () => {
    resetControlsTimeout();
    if (!videoRef.current) return;
    const newPos = Math.max(positionMillis - 10000, 0);
    await videoRef.current.setPositionAsync(newPos);
  };

  // Progress Bar Touch Seek
  const handleSeekTouch = async (evt) => {
    resetControlsTimeout();
    if (!videoRef.current || durationMillis <= 0) return;
    const touchX = evt.nativeEvent.locationX;
    const barWidth = width - 110; // width inside bottomBar padding
    const clampedX = Math.max(0, Math.min(touchX, barWidth));
    const seekPercentage = clampedX / barWidth;
    const targetMillis = seekPercentage * durationMillis;
    await videoRef.current.setPositionAsync(targetMillis);
  };

  // Change Episode
  const playNextEpisode = () => {
    if (!episodesList || episodesList.length === 0) return;
    const currentIdx = episodesList.findIndex(e => e.id === episode?.id || e.episodeNumber === episode?.episodeNumber);
    if (currentIdx >= 0 && currentIdx < episodesList.length - 1) {
      const nextEp = episodesList[currentIdx + 1];
      setEpisode(nextEp);
    }
  };

  const playPrevEpisode = () => {
    if (!episodesList || episodesList.length === 0) return;
    const currentIdx = episodesList.findIndex(e => e.id === episode?.id || e.episodeNumber === episode?.episodeNumber);
    if (currentIdx > 0) {
      const prevEp = episodesList[currentIdx - 1];
      setEpisode(prevEp);
    }
  };

  // Playback Rate
  const changeSpeed = async (rate) => {
    setPlaybackRate(rate);
    if (videoRef.current) {
      await videoRef.current.setRateAsync(rate, true);
    }
  };

  // Cycle Screen Aspect Ratio / Resize Mode
  const cycleResizeMode = () => {
    resetControlsTimeout();
    if (resizeMode === ResizeMode.CONTAIN) {
      setResizeMode(ResizeMode.COVER);
    } else if (resizeMode === ResizeMode.COVER) {
      setResizeMode(ResizeMode.STRETCH);
    } else {
      setResizeMode(ResizeMode.CONTAIN);
    }
  };

  const formatTime = (millis) => {
    if (isNaN(millis) || millis < 0) return "0:00";
    const totalSeconds = Math.floor(millis / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  // Determine Stream URL
  const rawUrl = activeStreamUrl || episode?.masterPlaylistUrl || episode?.videoUrl || episode?.streamUrl || SAMPLE_STREAM;
  const streamUrl = formatMediaUrl(rawUrl);
  const showTitle = show?.title || episode?.show?.title || "Infinx Anime";
  const epTitle = episode?.title || `Episode ${episode?.episodeNumber || 1}`;

  const currentEpIndex = episodesList.findIndex(e => e.id === episode?.id || e.episodeNumber === episode?.episodeNumber);
  const hasNext = currentEpIndex >= 0 && currentEpIndex < episodesList.length - 1;
  const hasPrev = currentEpIndex > 0;

  return (
    <TouchableWithoutFeedback onPress={resetControlsTimeout}>
      <View style={styles.container}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.loadingText}>Loading Stream...</Text>
          </View>
        ) : (
          <View style={styles.playerWrapper}>
            <Video
              ref={videoRef}
              style={styles.video}
              source={{ 
                uri: streamUrl,
              }}
              useNativeControls={false}
              resizeMode={resizeMode}
              shouldPlay={true}
              isMuted={isMuted}
              rate={playbackRate}
              onPlaybackStatusUpdate={handlePlaybackStatusUpdate}
              onError={(err) => {
                console.warn('Video load error:', err);
                if (streamUrl && streamUrl.includes('master.m3u8') && !activeStreamUrl?.includes('video.m3u8')) {
                  console.log('Retrying with direct video variant: video.m3u8');
                  setActiveStreamUrl(streamUrl.replace('master.m3u8', 'video.m3u8'));
                } else {
                  setPlaybackError(true);
                }
              }}
            />

            {/* Error Fallback Overlay */}
            {playbackError && (
              <View style={styles.errorOverlay}>
                <Ionicons name="alert-circle-outline" size={54} color={COLORS.primary} />
                <Text style={styles.errorTitle}>Stream Connection Error</Text>
                <Text style={styles.errorDesc}>Could not load video source from server.</Text>
                <TouchableOpacity 
                  style={styles.retryBtn} 
                  onPress={() => {
                    setPlaybackError(false);
                    setActiveStreamUrl(SAMPLE_STREAM);
                  }}
                >
                  <Ionicons name="play-circle-outline" size={20} color="#fff" />
                  <Text style={styles.retryText}>Play Demo Stream</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Full Player Overlay Controls */}
            {showControls && (
              <View style={styles.overlay}>
                {/* Top Header Bar */}
                <View style={styles.topBar}>
                  <TouchableOpacity 
                    style={styles.iconBtn} 
                    onPress={() => navigation.goBack()}
                  >
                    <Ionicons name="chevron-back" size={26} color="#fff" />
                  </TouchableOpacity>

                  <View style={styles.titleWrapper}>
                    <Text style={styles.showTitle} numberOfLines={1}>{showTitle}</Text>
                    <Text style={styles.epTitle} numberOfLines={1}>{epTitle}</Text>
                  </View>

                  <TouchableOpacity 
                    style={styles.iconBtn} 
                    onPress={() => { setEpisodesVisible(true); resetControlsTimeout(); }}
                  >
                    <Ionicons name="list" size={22} color="#fff" />
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={styles.iconBtn} 
                    onPress={() => { setSettingsVisible(true); resetControlsTimeout(); }}
                  >
                    <Ionicons name="settings-sharp" size={22} color="#fff" />
                  </TouchableOpacity>
                </View>

                {/* Center Controls (Prev, Skip 10s, Play/Pause, Forward 10s, Next) */}
                <View style={styles.centerControls}>
                  <TouchableOpacity 
                    style={[styles.smallControlBtn, !hasPrev && styles.disabledBtn]} 
                    onPress={playPrevEpisode}
                    disabled={!hasPrev}
                  >
                    <Ionicons name="play-skip-back" size={24} color="#fff" />
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.controlBtn} onPress={skipBackward}>
                    <MaterialIcons name="replay-10" size={32} color="#fff" />
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.playPauseBtn} onPress={togglePlayPause}>
                    <Ionicons 
                      name={isPlaying ? "pause" : "play"} 
                      size={42} 
                      color="#fff" 
                    />
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.controlBtn} onPress={skipForward}>
                    <MaterialIcons name="forward-10" size={32} color="#fff" />
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={[styles.smallControlBtn, !hasNext && styles.disabledBtn]} 
                    onPress={playNextEpisode}
                    disabled={!hasNext}
                  >
                    <Ionicons name="play-skip-forward" size={24} color="#fff" />
                  </TouchableOpacity>
                </View>

                {/* Bottom Control Bar */}
                <View style={styles.bottomBar}>
                  <View style={styles.timeRow}>
                    <Text style={styles.timeText}>{formatTime(positionMillis)}</Text>
                    
                    {/* Scrub Progress Bar */}
                    <TouchableOpacity 
                      style={styles.progressBarBackground} 
                      activeOpacity={0.9} 
                      onPress={handleSeekTouch}
                    >
                      <View 
                        style={[
                          styles.progressBarFill, 
                          { width: `${durationMillis > 0 ? (positionMillis / durationMillis) * 100 : 0}%` }
                        ]} 
                      />
                    </TouchableOpacity>

                    <Text style={styles.timeText}>{formatTime(durationMillis)}</Text>
                  </View>

                  {/* Actions Row */}
                  <View style={styles.bottomActionsRow}>
                    <TouchableOpacity style={styles.actionIconButton} onPress={toggleMute}>
                      <Ionicons 
                        name={isMuted ? "volume-mute" : "volume-high"} 
                        size={20} 
                        color="#fff" 
                      />
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.actionIconButton} onPress={cycleResizeMode}>
                      <Ionicons 
                        name={resizeMode === ResizeMode.COVER ? "expand-outline" : "contract-outline"} 
                        size={20} 
                        color={resizeMode !== ResizeMode.CONTAIN ? COLORS.primary : "#fff"} 
                      />
                    </TouchableOpacity>

                    <TouchableOpacity 
                      style={styles.actionIconButton} 
                      onPress={() => setAutoNext(!autoNext)}
                    >
                      <Ionicons 
                        name="repeat" 
                        size={20} 
                        color={autoNext ? COLORS.primary : COLORS.textMuted} 
                      />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            )}

            {/* ====== SETTINGS MODAL ====== */}
            <Modal
              visible={settingsVisible}
              animationType="fade"
              transparent={true}
              onRequestClose={() => setSettingsVisible(false)}
            >
              <TouchableWithoutFeedback onPress={() => setSettingsVisible(false)}>
                <View style={styles.modalBackdrop}>
                  <TouchableWithoutFeedback>
                    <View style={styles.settingsModalContent}>
                      <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>Player Settings</Text>
                        <TouchableOpacity onPress={() => setSettingsVisible(false)}>
                          <Ionicons name="close" size={24} color="#fff" />
                        </TouchableOpacity>
                      </View>

                      {/* Speed Options */}
                      <Text style={styles.settingLabel}>Playback Speed</Text>
                      <View style={styles.optionsRow}>
                        {[0.5, 0.75, 1.0, 1.25, 1.5, 2.0].map(speed => (
                          <TouchableOpacity 
                            key={speed} 
                            style={[
                              styles.chipOption, 
                              playbackRate === speed && styles.chipOptionActive
                            ]}
                            onPress={() => changeSpeed(speed)}
                          >
                            <Text style={[
                              styles.chipText, 
                              playbackRate === speed && styles.chipTextActive
                            ]}>
                              {speed === 1.0 ? 'Normal' : `${speed}x`}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>

                      {/* Screen Aspect Ratio */}
                      <Text style={styles.settingLabel}>Aspect Ratio (Screen Fit)</Text>
                      <View style={styles.optionsRow}>
                        {[
                          { label: 'Fit (Contain)', mode: ResizeMode.CONTAIN },
                          { label: 'Fill (Cover)', mode: ResizeMode.COVER },
                          { label: 'Stretch', mode: ResizeMode.STRETCH }
                        ].map(item => (
                          <TouchableOpacity 
                            key={item.label} 
                            style={[
                              styles.chipOption, 
                              resizeMode === item.mode && styles.chipOptionActive
                            ]}
                            onPress={() => setResizeMode(item.mode)}
                          >
                            <Text style={[
                              styles.chipText, 
                              resizeMode === item.mode && styles.chipTextActive
                            ]}>
                              {item.label}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>

                      {/* Auto Next Switch */}
                      <View style={styles.switchRow}>
                        <Text style={styles.settingLabel}>Auto Play Next Episode</Text>
                        <Switch
                          value={autoNext}
                          onValueChange={setAutoNext}
                          trackColor={{ false: '#333', true: COLORS.primary }}
                          thumbColor="#fff"
                        />
                      </View>
                    </View>
                  </TouchableWithoutFeedback>
                </View>
              </TouchableWithoutFeedback>
            </Modal>

            {/* ====== EPISODES DRAWER MODAL ====== */}
            <Modal
              visible={episodesVisible}
              animationType="slide"
              transparent={true}
              onRequestClose={() => setEpisodesVisible(false)}
            >
              <TouchableWithoutFeedback onPress={() => setEpisodesVisible(false)}>
                <View style={styles.modalBackdrop}>
                  <TouchableWithoutFeedback>
                    <View style={styles.episodesModalContent}>
                      <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>Select Episode ({episodesList.length})</Text>
                        <TouchableOpacity onPress={() => setEpisodesVisible(false)}>
                          <Ionicons name="close" size={24} color="#fff" />
                        </TouchableOpacity>
                      </View>

                      <ScrollView style={styles.episodesScroll}>
                        {episodesList.map((ep) => {
                          const isActive = episode?.id === ep.id || episode?.episodeNumber === ep.episodeNumber;
                          return (
                            <TouchableOpacity 
                              key={ep.id || ep.episodeNumber} 
                              style={[styles.drawerEpCard, isActive && styles.drawerEpCardActive]}
                              onPress={() => {
                                setEpisode(ep);
                                setEpisodesVisible(false);
                              }}
                            >
                              <View style={[styles.drawerEpBadge, isActive && styles.drawerEpBadgeActive]}>
                                <Text style={[styles.drawerEpBadgeText, isActive && styles.drawerEpBadgeTextActive]}>
                                  EP {ep.episodeNumber}
                                </Text>
                              </View>
                              <View style={styles.drawerEpInfo}>
                                <Text style={[styles.drawerEpTitle, isActive && styles.drawerEpTitleActive]} numberOfLines={1}>
                                  {ep.title}
                                </Text>
                                <Text style={styles.drawerEpDur}>{ep.duration || '24m'}</Text>
                              </View>
                              {isActive ? (
                                <Ionicons name="volume-high" size={20} color={COLORS.primary} />
                              ) : (
                                <Ionicons name="play" size={16} color={COLORS.textMuted} />
                              )}
                            </TouchableOpacity>
                          );
                        })}
                      </ScrollView>
                    </View>
                  </TouchableWithoutFeedback>
                </View>
              </TouchableWithoutFeedback>
            </Modal>

          </View>
        )}
      </View>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    color: COLORS.textMuted,
    fontSize: 13,
  },
  playerWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  video: {
    width: width,
    height: height,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'space-between',
    paddingVertical: Platform.OS === 'ios' ? 44 : 24,
    paddingHorizontal: 18,
    zIndex: 10,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleWrapper: {
    flex: 1,
  },
  showTitle: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '800',
  },
  epTitle: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: '600',
  },
  centerControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
  },
  controlBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  smallControlBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabledBtn: {
    opacity: 0.35,
  },
  playPauseBtn: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingLeft: 3,
    elevation: 8,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.8,
    shadowRadius: 12,
  },
  bottomBar: {
    gap: 8,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  timeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },
  progressBarBackground: {
    flex: 1,
    height: 14,
    justifyContent: 'center',
  },
  progressBarFill: {
    height: 5,
    backgroundColor: COLORS.primary,
    borderRadius: 2.5,
  },
  bottomActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 14,
  },
  actionIconButton: {
    padding: 6,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },

  /* Error Overlay */
  errorOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(10,10,15,0.95)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 10,
    zIndex: 20,
  },
  errorTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '800',
  },
  errorDesc: {
    color: COLORS.textMuted,
    fontSize: 12,
    textAlign: 'center',
  },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
    marginTop: 10,
  },
  retryText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },

  /* Modal Backdrop & Shared Styles */
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'flex-end',
  },
  settingsModalContent: {
    backgroundColor: '#12121c',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    gap: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  episodesModalContent: {
    backgroundColor: '#12121c',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    height: height * 0.6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  modalTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
  },
  settingLabel: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  optionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chipOption: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  chipOptionActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  chipText: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },
  chipTextActive: {
    color: '#fff',
    fontWeight: '800',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
  },
  episodesScroll: {
    flex: 1,
    marginTop: 8,
  },
  drawerEpCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.03)',
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
    gap: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  drawerEpCardActive: {
    backgroundColor: 'rgba(255, 0, 85, 0.12)',
    borderColor: COLORS.primary,
  },
  drawerEpBadge: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  drawerEpBadgeActive: {
    backgroundColor: COLORS.primary,
  },
  drawerEpBadgeText: {
    color: COLORS.textMuted,
    fontSize: 10,
    fontWeight: '800',
  },
  drawerEpBadgeTextActive: {
    color: '#fff',
  },
  drawerEpInfo: {
    flex: 1,
  },
  drawerEpTitle: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  drawerEpTitleActive: {
    color: COLORS.primary,
    fontWeight: '800',
  },
  drawerEpDur: {
    color: COLORS.textMuted,
    fontSize: 10,
    marginTop: 2,
  },
});

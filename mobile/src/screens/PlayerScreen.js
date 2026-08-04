import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ActivityIndicator, 
  Dimensions, 
  TouchableWithoutFeedback 
} from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../theme/colors';
import { apiService } from '../services/api';

const SAMPLE_HLS_STREAM = "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4";

export const PlayerScreen = ({ route, navigation }) => {
  const { episodeId, episode: initialEpisode, show } = route.params || {};
  const [episode, setEpisode] = useState(initialEpisode || null);
  const [loading, setLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(true);
  const [showControls, setShowControls] = useState(true);
  const [positionMillis, setPositionMillis] = useState(0);
  const [durationMillis, setDurationMillis] = useState(0);
  const videoRef = useRef(null);
  const controlsTimeoutRef = useRef(null);

  useEffect(() => {
    const loadEpisode = async () => {
      if (episodeId) {
        try {
          const ep = await apiService.getEpisodeById(episodeId);
          setEpisode(ep);
        } catch (e) {
          console.error('Error fetching episode for player:', e);
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    };
    loadEpisode();
  }, [episodeId]);

  const resetControlsTimeout = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    controlsTimeoutRef.current = setTimeout(() => {
      setShowControls(false);
    }, 4000);
  };

  const handlePlaybackStatusUpdate = (status) => {
    if (status.isLoaded) {
      setPositionMillis(status.positionMillis || 0);
      setDurationMillis(status.durationMillis || 0);
      setIsPlaying(status.isPlaying);
    }
  };

  const togglePlayPause = async () => {
    resetControlsTimeout();
    if (!videoRef.current) return;
    if (isPlaying) {
      await videoRef.current.pauseAsync();
    } else {
      await videoRef.current.playAsync();
    }
  };

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

  const formatTime = (millis) => {
    const totalSeconds = Math.floor(millis / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  const streamUrl = episode?.masterPlaylistUrl || episode?.videoUrl || SAMPLE_HLS_STREAM;
  const showTitle = show?.title || episode?.show?.title || "Infinx Anime";
  const epTitle = episode?.title || `Episode ${episode?.episodeNumber || 1}`;

  return (
    <TouchableWithoutFeedback onPress={resetControlsTimeout}>
      <View style={styles.container}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.loadingText}>Preparing Stream...</Text>
          </View>
        ) : (
          <View style={styles.playerWrapper}>
            <Video
              ref={videoRef}
              style={styles.video}
              source={{ uri: streamUrl }}
              useNativeControls={false}
              resizeMode={ResizeMode.CONTAIN}
              shouldPlay={true}
              onPlaybackStatusUpdate={handlePlaybackStatusUpdate}
            />

            {/* Overlay Controls */}
            {showControls && (
              <View style={styles.overlay}>
                {/* Top Bar */}
                <View style={styles.topBar}>
                  <TouchableOpacity 
                    style={styles.backBtn} 
                    onPress={() => navigation.goBack()}
                  >
                    <Ionicons name="chevron-back" size={26} color="#fff" />
                  </TouchableOpacity>
                  <View style={styles.titleWrapper}>
                    <Text style={styles.showTitle} numberOfLines={1}>{showTitle}</Text>
                    <Text style={styles.epTitle} numberOfLines={1}>{epTitle}</Text>
                  </View>
                </View>

                {/* Center Skip/Play Controls */}
                <View style={styles.centerControls}>
                  <TouchableOpacity style={styles.controlBtn} onPress={skipBackward}>
                    <Ionicons name="replay-10" size={34} color="#fff" />
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.playPauseBtn} onPress={togglePlayPause}>
                    <Ionicons 
                      name={isPlaying ? "pause" : "play"} 
                      size={40} 
                      color="#fff" 
                    />
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.controlBtn} onPress={skipForward}>
                    <Ionicons name="forward-10" size={34} color="#fff" />
                  </TouchableOpacity>
                </View>

                {/* Bottom Bar */}
                <View style={styles.bottomBar}>
                  <View style={styles.timeRow}>
                    <Text style={styles.timeText}>{formatTime(positionMillis)}</Text>
                    <View style={styles.progressBarBackground}>
                      <View 
                        style={[
                          styles.progressBarFill, 
                          { width: `${durationMillis > 0 ? (positionMillis / durationMillis) * 100 : 0}%` }
                        ]} 
                      />
                    </View>
                    <Text style={styles.timeText}>{formatTime(durationMillis)}</Text>
                  </View>
                </View>
              </View>
            )}
          </View>
        )}
      </View>
    </TouchableWithoutFeedback>
  );
};

const { width, height } = Dimensions.get('window');

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
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'space-between',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backBtn: {
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
    fontSize: 16,
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
    gap: 36,
  },
  controlBtn: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  playPauseBtn: {
    width: 70,
    height: 70,
    borderRadius: 35,
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
    fontVariant: ['tabular-nums'],
  },
  progressBarBackground: {
    flex: 1,
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
  },
});

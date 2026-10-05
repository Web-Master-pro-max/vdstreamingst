import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, ScrollView, useWindowDimensions } from 'react-native';
import { COLORS } from '../theme/colors';

export const HomeScreenSkeleton = () => {
  const { width } = useWindowDimensions();
  const pulseAnim = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 0.75,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [pulseAnim]);

  return (
    <View style={styles.container}>
      {/* Header Skeleton */}
      <View style={styles.header}>
        <View style={styles.logoContainer}>
          <Animated.View style={[styles.headerLogo, { opacity: pulseAnim }]} />
          <Animated.View style={[styles.headerLogoSub, { opacity: pulseAnim }]} />
        </View>
        <View style={styles.headerIcons}>
          <Animated.View style={[styles.circleIcon, { opacity: pulseAnim }]} />
          <Animated.View style={[styles.circleIcon, { opacity: pulseAnim }]} />
        </View>
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Hero Banner Skeleton */}
        <View style={styles.heroBannerWrapper}>
          <Animated.View style={[styles.heroBanner, { opacity: pulseAnim }]}>
            <View style={styles.heroOverlay}>
              {/* Badges Row */}
              <View style={styles.badgeRow}>
                <View style={styles.badgePill} />
                <View style={styles.badgePillSmall} />
                <View style={styles.badgePillSmall} />
              </View>

              {/* Title Lines */}
              <View style={styles.titleLineLong} />
              <View style={styles.titleLineShort} />

              {/* Description Lines */}
              <View style={styles.descLineLong} />
              <View style={styles.descLineMedium} />

              {/* Action Buttons */}
              <View style={styles.buttonRow}>
                <View style={[styles.buttonPlaceholder, styles.primaryBtnPlaceholder]} />
                <View style={[styles.buttonPlaceholder, styles.secondaryBtnPlaceholder]} />
              </View>

              {/* Pagination Dots */}
              <View style={styles.dotsRow}>
                <View style={[styles.dot, styles.activeDot]} />
                <View style={styles.dot} />
                <View style={styles.dot} />
                <View style={styles.dot} />
                <View style={styles.dot} />
              </View>
            </View>
          </Animated.View>
        </View>

        {/* Category Pills Skeleton */}
        <View style={styles.tagSection}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tagScroll}>
            {[75, 90, 115, 95, 80].map((pillWidth, idx) => (
              <Animated.View
                key={idx}
                style={[styles.tagPill, { width: pillWidth, opacity: pulseAnim }]}
              />
            ))}
          </ScrollView>
        </View>

        {/* Rails Section 1 */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Animated.View style={[styles.sectionTitle, { opacity: pulseAnim }]} />
            <Animated.View style={[styles.seeAll, { opacity: pulseAnim }]} />
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.railContent}>
            {[1, 2, 3].map((item) => (
              <Animated.View key={item} style={[styles.cardContainer, { opacity: pulseAnim }]}>
                <View style={styles.cardImage} />
                <View style={styles.cardTitleLine} />
                <View style={styles.cardMetaLine} />
              </Animated.View>
            ))}
          </ScrollView>
        </View>

        {/* Rails Section 2 */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Animated.View style={[styles.sectionTitle, { width: 160, opacity: pulseAnim }]} />
            <Animated.View style={[styles.seeAll, { opacity: pulseAnim }]} />
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.railContent}>
            {[1, 2, 3].map((item) => (
              <Animated.View key={item} style={[styles.cardContainer, { opacity: pulseAnim }]}>
                <View style={styles.cardImage} />
                <View style={styles.cardTitleLine} />
                <View style={styles.cardMetaLine} />
              </Animated.View>
            ))}
          </ScrollView>
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
  header: {
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.cardBorder,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  headerLogo: {
    width: 65,
    height: 22,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
  },
  headerLogoSub: {
    width: 55,
    height: 22,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 0, 85, 0.25)',
  },
  headerIcons: {
    flexDirection: 'row',
    gap: 10,
  },
  circleIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  scroll: {
    flex: 1,
  },
  heroBannerWrapper: {
    width: '100%',
    height: 350,
    backgroundColor: '#101018',
  },
  heroBanner: {
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  heroOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: 20,
    gap: 10,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 8,
  },
  badgePill: {
    width: 80,
    height: 22,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 0, 85, 0.3)',
  },
  badgePillSmall: {
    width: 65,
    height: 22,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  titleLineLong: {
    width: '75%',
    height: 24,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  titleLineShort: {
    width: '50%',
    height: 24,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  descLineLong: {
    width: '90%',
    height: 14,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    marginTop: 2,
  },
  descLineMedium: {
    width: '65%',
    height: 14,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 4,
  },
  buttonPlaceholder: {
    width: 135,
    height: 44,
    borderRadius: 22,
  },
  primaryBtnPlaceholder: {
    backgroundColor: 'rgba(255, 0, 85, 0.35)',
  },
  secondaryBtnPlaceholder: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    marginTop: 10,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  activeDot: {
    width: 22,
    backgroundColor: 'rgba(255, 0, 85, 0.5)',
  },
  tagSection: {
    marginVertical: 14,
  },
  tagScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  tagPill: {
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },
  section: {
    marginTop: 18,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  sectionTitle: {
    width: 140,
    height: 20,
    borderRadius: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
  },
  seeAll: {
    width: 55,
    height: 16,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 0, 85, 0.2)',
  },
  railContent: {
    paddingLeft: 16,
    gap: 14,
  },
  cardContainer: {
    width: 140,
    gap: 8,
  },
  cardImage: {
    width: 140,
    height: 200,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  cardTitleLine: {
    width: 110,
    height: 14,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  cardMetaLine: {
    width: 60,
    height: 10,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },
});

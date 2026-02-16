import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Animated,
  Dimensions,
  Platform,
} from 'react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Search, Star, X, Mic } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Colors from '@/constants/colors';
import { SHOWS, GENRES } from '@/mocks/shows';
import { useApp } from '@/providers/AppProvider';
import { Show } from '@/types';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width * 0.7;
const SMALL_CARD_WIDTH = (width - 48 - 12) / 2;

export default function DiscoverScreen() {
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('All');
  const [matchVocalRange, setMatchVocalRange] = useState(false);
  const { isFavorite, toggleFavorite, settings } = useApp();

  const filteredShows = SHOWS.filter(show => {
    const matchesSearch = show.title.toLowerCase().includes(search.toLowerCase()) ||
      show.composer.toLowerCase().includes(search.toLowerCase());
    const matchesGenre = selectedGenre === 'All' || show.genre === selectedGenre;
    if (!matchesSearch || !matchesGenre) return false;
    if (matchVocalRange && settings.vocalRange) {
      return show.songs.some(s =>
        s.vocalRange.toLowerCase().includes(settings.vocalRange.toLowerCase()) ||
        s.vocalRange === 'Mixed'
      );
    }
    return true;
  });

  const featuredShows = SHOWS.slice(0, 4);
  const isSearching = search.length > 0;

  const handleShowPress = useCallback((showId: string) => {
    router.push({ pathname: '/show/[showId]', params: { showId } } as never);
  }, []);

  const renderFeaturedCard = useCallback((show: Show, index: number) => {
    return (
      <TouchableOpacity
        key={show.id}
        style={styles.featuredCard}
        onPress={() => handleShowPress(show.id)}
        activeOpacity={0.85}
        testID={`featured-show-${show.id}`}
      >
        <Image
          source={{ uri: show.imageUrl }}
          style={styles.featuredImage}
          contentFit="cover"
          transition={300}
        />
        <LinearGradient
          colors={['transparent', 'rgba(10,10,15,0.85)', 'rgba(10,10,15,0.98)']}
          style={styles.featuredGradient}
        >
          <View style={styles.featuredInfo}>
            <Text style={styles.featuredGenre}>{show.genre.toUpperCase()}</Text>
            <Text style={styles.featuredTitle}>{show.title}</Text>
            <Text style={styles.featuredComposer}>{show.composer} · {show.year}</Text>
          </View>
        </LinearGradient>
        <TouchableOpacity
          style={styles.favoriteBtn}
          onPress={() => toggleFavorite(show.id)}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Star
            size={18}
            color={isFavorite(show.id) ? Colors.dark.gold : Colors.dark.textMuted}
            fill={isFavorite(show.id) ? Colors.dark.gold : 'transparent'}
          />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  }, [handleShowPress, isFavorite, toggleFavorite]);

  const renderShowCard = useCallback((show: Show) => {
    const matchCount = settings.vocalRange
      ? show.songs.filter(s => s.vocalRange.toLowerCase().includes(settings.vocalRange.toLowerCase())).length
      : 0;

    return (
      <TouchableOpacity
        key={show.id}
        style={styles.showCard}
        onPress={() => handleShowPress(show.id)}
        activeOpacity={0.85}
        testID={`show-card-${show.id}`}
      >
        <Image
          source={{ uri: show.imageUrl }}
          style={styles.showCardImage}
          contentFit="cover"
          transition={200}
        />
        <LinearGradient
          colors={['transparent', 'rgba(10,10,15,0.9)']}
          style={styles.showCardGradient}
        >
          <Text style={styles.showCardTitle} numberOfLines={2}>{show.title}</Text>
          <Text style={styles.showCardSub} numberOfLines={1}>{show.composer}</Text>
          {matchVocalRange && matchCount > 0 && (
            <View style={styles.matchBadge}>
              <Mic size={10} color={Colors.dark.gold} />
              <Text style={styles.matchBadgeText}>{matchCount} match{matchCount > 1 ? 'es' : ''}</Text>
            </View>
          )}
        </LinearGradient>
      </TouchableOpacity>
    );
  }, [handleShowPress, matchVocalRange, settings.vocalRange]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Discover</Text>
        <Text style={styles.headerSubtitle}>Musical Theater</Text>
      </View>

      <View style={styles.searchContainer}>
        <Search size={18} color={Colors.dark.textMuted} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search shows, composers..."
          placeholderTextColor={Colors.dark.textMuted}
          value={search}
          onChangeText={setSearch}
          testID="search-input"
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <X size={18} color={Colors.dark.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.filterRow}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.genreContent}
        >
          {GENRES.map(genre => (
            <TouchableOpacity
              key={genre}
              style={[styles.genreChip, selectedGenre === genre && styles.genreChipActive]}
              onPress={() => setSelectedGenre(genre)}
              testID={`genre-${genre}`}
            >
              <Text style={[styles.genreText, selectedGenre === genre && styles.genreTextActive]}>
                {genre}
              </Text>
            </TouchableOpacity>
          ))}
          {settings.vocalRange ? (
            <TouchableOpacity
              style={[styles.genreChip, styles.vocalChip, matchVocalRange && styles.vocalChipActive]}
              onPress={() => setMatchVocalRange(!matchVocalRange)}
            >
              <Mic size={12} color={matchVocalRange ? Colors.dark.gold : Colors.dark.textSecondary} />
              <Text style={[styles.genreText, matchVocalRange && styles.vocalChipTextActive]}>
                {settings.vocalRange}
              </Text>
            </TouchableOpacity>
          ) : null}
        </ScrollView>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {!isSearching && selectedGenre === 'All' && !matchVocalRange && (
          <>
            <Text style={styles.sectionTitle}>Featured</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.featuredScroll}
              decelerationRate="fast"
              snapToInterval={CARD_WIDTH + 16}
            >
              {featuredShows.map((show, i) => renderFeaturedCard(show, i))}
            </ScrollView>
            <Text style={[styles.sectionTitle, { marginTop: 28 }]}>All Shows</Text>
          </>
        )}

        {filteredShows.length === 0 ? (
          <View style={styles.emptyState}>
            <Search size={48} color={Colors.dark.textMuted} />
            <Text style={styles.emptyTitle}>No shows found</Text>
            <Text style={styles.emptySubtitle}>
              {matchVocalRange ? 'No shows match your vocal range filter' : 'Try a different search term'}
            </Text>
          </View>
        ) : (
          <View style={styles.showGrid}>
            {filteredShows.map(show => renderShowCard(show))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.dark.background },
  header: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 4 },
  headerTitle: { fontSize: 32, fontWeight: '800' as const, color: Colors.dark.text, letterSpacing: -0.5 },
  headerSubtitle: { fontSize: 14, color: Colors.dark.gold, fontWeight: '600' as const, letterSpacing: 2, textTransform: 'uppercase' as const, marginTop: 2 },
  searchContainer: {
    flexDirection: 'row' as const, alignItems: 'center' as const, marginHorizontal: 20, marginTop: 16,
    backgroundColor: Colors.dark.surfaceLight, borderRadius: 14, paddingHorizontal: 14,
    paddingVertical: Platform.OS === 'ios' ? 12 : 4, borderWidth: 1, borderColor: Colors.dark.border,
  },
  searchInput: { flex: 1, marginLeft: 10, fontSize: 15, color: Colors.dark.text },
  filterRow: { marginTop: 16, maxHeight: 44 },
  genreContent: { paddingHorizontal: 20, gap: 8 },
  genreChip: {
    paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20,
    backgroundColor: Colors.dark.surfaceLight, borderWidth: 1, borderColor: Colors.dark.border,
  },
  genreChipActive: { backgroundColor: Colors.dark.goldDim, borderColor: Colors.dark.gold },
  genreText: { color: Colors.dark.textSecondary, fontSize: 13, fontWeight: '600' as const },
  genreTextActive: { color: Colors.dark.gold },
  vocalChip: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: 4 },
  vocalChipActive: { backgroundColor: Colors.dark.goldDim + '66', borderColor: Colors.dark.gold },
  vocalChipTextActive: { color: Colors.dark.gold },
  scrollContent: { paddingBottom: 30 },
  sectionTitle: { fontSize: 20, fontWeight: '700' as const, color: Colors.dark.text, paddingHorizontal: 20, marginTop: 20, marginBottom: 14 },
  featuredScroll: { paddingHorizontal: 20, gap: 16 },
  featuredCard: { width: CARD_WIDTH, height: 220, borderRadius: 16, overflow: 'hidden' as const, backgroundColor: Colors.dark.surface },
  featuredImage: { width: '100%', height: '100%' },
  featuredGradient: { position: 'absolute' as const, bottom: 0, left: 0, right: 0, height: '70%', justifyContent: 'flex-end' as const, padding: 16 },
  featuredInfo: {},
  featuredGenre: { fontSize: 10, fontWeight: '700' as const, color: Colors.dark.gold, letterSpacing: 1.5, marginBottom: 4 },
  featuredTitle: { fontSize: 22, fontWeight: '800' as const, color: Colors.dark.text, letterSpacing: -0.3 },
  featuredComposer: { fontSize: 13, color: Colors.dark.textSecondary, marginTop: 2 },
  favoriteBtn: {
    position: 'absolute' as const, top: 12, right: 12, width: 34, height: 34, borderRadius: 17,
    backgroundColor: 'rgba(10,10,15,0.6)', justifyContent: 'center' as const, alignItems: 'center' as const,
  },
  showGrid: { flexDirection: 'row' as const, flexWrap: 'wrap' as const, paddingHorizontal: 20, gap: 12 },
  showCard: { width: SMALL_CARD_WIDTH, height: SMALL_CARD_WIDTH * 1.3, borderRadius: 14, overflow: 'hidden' as const, backgroundColor: Colors.dark.surface },
  showCardImage: { width: '100%', height: '100%' },
  showCardGradient: { position: 'absolute' as const, bottom: 0, left: 0, right: 0, height: '60%', justifyContent: 'flex-end' as const, padding: 12 },
  showCardTitle: { fontSize: 15, fontWeight: '700' as const, color: Colors.dark.text },
  showCardSub: { fontSize: 11, color: Colors.dark.textSecondary, marginTop: 2 },
  matchBadge: {
    flexDirection: 'row' as const, alignItems: 'center' as const, gap: 3, marginTop: 4,
    backgroundColor: Colors.dark.goldDim + '44', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, alignSelf: 'flex-start' as const,
  },
  matchBadgeText: { fontSize: 9, color: Colors.dark.gold, fontWeight: '700' as const },
  emptyState: { alignItems: 'center' as const, justifyContent: 'center' as const, paddingTop: 60, gap: 8 },
  emptyTitle: { fontSize: 18, fontWeight: '600' as const, color: Colors.dark.text, marginTop: 8 },
  emptySubtitle: { fontSize: 14, color: Colors.dark.textMuted, textAlign: 'center' as const, paddingHorizontal: 40 },
});

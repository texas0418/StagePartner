import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Image } from 'expo-image';
import { useLocalSearchParams, router, Stack } from 'expo-router';
import { Star, Music, Users, Plus, CheckCircle } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Colors from '@/constants/colors';
import { getShowById } from '@/mocks/shows';
import { useApp } from '@/providers/AppProvider';
import { Song } from '@/types';

export default function ShowDetailScreen() {
  const { showId } = useLocalSearchParams<{ showId: string }>();
  const show = getShowById(showId ?? '');
  const { isFavorite, toggleFavorite, isInRepertoire, addToRepertoire } = useApp();

  const songsByAct = useMemo(() => {
    if (!show) return {};
    const grouped: Record<number, Song[]> = {};
    show.songs.forEach(song => {
      if (!grouped[song.act]) grouped[song.act] = [];
      grouped[song.act].push(song);
    });
    return grouped;
  }, [show]);

  if (!show) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Show not found</Text>
      </View>
    );
  }

  const handleAddToRepertoire = (song: Song) => {
    if (isInRepertoire(song.id)) {
      Alert.alert('Already Added', 'This song is already in your repertoire.');
      return;
    }
    addToRepertoire({
      id: Date.now().toString(),
      songId: song.id,
      showId: show.id,
      addedAt: new Date().toISOString(),
      notes: '',
      lyrics: '',
      practiceCount: 0,
      status: 'learning',
      tags: [],
    });
    Alert.alert('Added!', `"${song.title}" has been added to your repertoire.`);
  };

  const getSongTypeColor = (type: string) => {
    switch (type) {
      case 'solo': return Colors.dark.gold;
      case 'duet': return Colors.dark.burgundyLight;
      case 'ensemble': return Colors.dark.success;
      default: return Colors.dark.textMuted;
    }
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerTransparent: true, title: '' }} />
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.heroContainer}>
          <Image
            source={{ uri: show.imageUrl }}
            style={styles.heroImage}
            contentFit="cover"
          />
          <LinearGradient
            colors={['transparent', 'rgba(10,10,15,0.6)', Colors.dark.background]}
            style={styles.heroGradient}
          >
            <View style={styles.heroInfo}>
              <Text style={styles.heroGenre}>{show.genre.toUpperCase()} · {show.year}</Text>
              <Text style={styles.heroTitle}>{show.title}</Text>
              <Text style={styles.heroComposer}>
                Music by {show.composer}
                {show.lyricist !== show.composer ? `\nLyrics by ${show.lyricist}` : ''}
              </Text>
            </View>
          </LinearGradient>
          <TouchableOpacity
            style={styles.favButton}
            onPress={() => toggleFavorite(show.id)}
          >
            <Star
              size={22}
              color={isFavorite(show.id) ? Colors.dark.gold : Colors.dark.textMuted}
              fill={isFavorite(show.id) ? Colors.dark.gold : 'transparent'}
            />
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Music size={16} color={Colors.dark.gold} />
              <Text style={styles.statText}>{show.songs.length} Songs</Text>
            </View>
            <View style={styles.statItem}>
              <Users size={16} color={Colors.dark.burgundyLight} />
              <Text style={styles.statText}>{show.characters.length} Characters</Text>
            </View>
          </View>

          <Text style={styles.synopsis}>{show.synopsis}</Text>

          <Text style={styles.sectionTitle}>Characters</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.charactersScroll}
          >
            {show.characters.map((char, i) => (
              <View key={i} style={styles.characterCard}>
                <Text style={styles.characterName}>{char.name}</Text>
                <View style={styles.characterRangeBadge}>
                  <Text style={styles.characterRange}>{char.vocalRange}</Text>
                </View>
                <Text style={styles.characterDesc} numberOfLines={2}>{char.description}</Text>
              </View>
            ))}
          </ScrollView>

          {Object.entries(songsByAct).map(([act, songs]) => (
            <View key={act}>
              <Text style={styles.sectionTitle}>Act {act}</Text>
              {songs.map(song => (
                <TouchableOpacity
                  key={song.id}
                  style={styles.songRow}
                  onPress={() => router.push({ pathname: '/song/[songId]', params: { songId: song.id } } as never)}
                  activeOpacity={0.7}
                >
                  <View style={styles.songInfo}>
                    <View style={styles.songHeader}>
                      <Text style={styles.songTitle}>{song.title}</Text>
                      <View style={[styles.typeBadge, { backgroundColor: getSongTypeColor(song.type) + '22' }]}>
                        <Text style={[styles.typeText, { color: getSongTypeColor(song.type) }]}>
                          {song.type}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.songCharacter}>{song.character} · {song.vocalRange}</Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => handleAddToRepertoire(song)}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    style={styles.addBtn}
                  >
                    {isInRepertoire(song.id) ? (
                      <CheckCircle size={20} color={Colors.dark.success} />
                    ) : (
                      <Plus size={20} color={Colors.dark.gold} />
                    )}
                  </TouchableOpacity>
                </TouchableOpacity>
              ))}
            </View>
          ))}
        </View>
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.background,
  },
  errorText: {
    color: Colors.dark.textMuted,
    fontSize: 16,
    textAlign: 'center' as const,
    marginTop: 100,
  },
  heroContainer: {
    height: 300,
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroGradient: {
    position: 'absolute' as const,
    bottom: 0,
    left: 0,
    right: 0,
    height: '80%',
    justifyContent: 'flex-end' as const,
    padding: 20,
  },
  heroInfo: {},
  heroGenre: {
    fontSize: 11,
    fontWeight: '700' as const,
    color: Colors.dark.gold,
    letterSpacing: 1.5,
    marginBottom: 6,
  },
  heroTitle: {
    fontSize: 30,
    fontWeight: '800' as const,
    color: Colors.dark.text,
    letterSpacing: -0.5,
  },
  heroComposer: {
    fontSize: 14,
    color: Colors.dark.textSecondary,
    marginTop: 4,
    lineHeight: 20,
  },
  favButton: {
    position: 'absolute' as const,
    top: 100,
    right: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(10,10,15,0.7)',
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  content: {
    paddingHorizontal: 20,
  },
  statsRow: {
    flexDirection: 'row' as const,
    gap: 20,
    marginBottom: 16,
  },
  statItem: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 6,
  },
  statText: {
    fontSize: 13,
    color: Colors.dark.textSecondary,
    fontWeight: '500' as const,
  },
  synopsis: {
    fontSize: 14,
    color: Colors.dark.textSecondary,
    lineHeight: 22,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.dark.text,
    marginBottom: 12,
    marginTop: 4,
  },
  charactersScroll: {
    gap: 12,
    paddingBottom: 20,
  },
  characterCard: {
    width: 160,
    backgroundColor: Colors.dark.surface,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  characterName: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: Colors.dark.text,
    marginBottom: 6,
  },
  characterRangeBadge: {
    alignSelf: 'flex-start' as const,
    backgroundColor: Colors.dark.goldDim + '33',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    marginBottom: 6,
  },
  characterRange: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: Colors.dark.gold,
  },
  characterDesc: {
    fontSize: 12,
    color: Colors.dark.textMuted,
    lineHeight: 16,
  },
  songRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    paddingVertical: 14,
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.dark.border,
  },
  songInfo: {
    flex: 1,
  },
  songHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
    marginBottom: 4,
  },
  songTitle: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.dark.text,
    flex: 1,
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  typeText: {
    fontSize: 10,
    fontWeight: '700' as const,
    textTransform: 'uppercase' as const,
  },
  songCharacter: {
    fontSize: 13,
    color: Colors.dark.textMuted,
  },
  addBtn: {
    paddingLeft: 12,
  },
});

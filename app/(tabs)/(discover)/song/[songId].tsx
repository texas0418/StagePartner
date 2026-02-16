import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useLocalSearchParams, Stack } from 'expo-router';
import { Music, Mic, Layers, Plus, CheckCircle } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { getSongById } from '@/mocks/shows';
import { useApp } from '@/providers/AppProvider';

export default function SongDetailScreen() {
  const { songId } = useLocalSearchParams<{ songId: string }>();
  const result = getSongById(songId ?? '');
  const { isInRepertoire, addToRepertoire } = useApp();

  if (!result) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Song not found</Text>
      </View>
    );
  }

  const { song, show } = result;
  const inRepertoire = isInRepertoire(song.id);

  const handleAdd = () => {
    if (inRepertoire) {
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

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: song.title }} />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.headerCard}>
          <Text style={styles.showName}>{show.title}</Text>
          <Text style={styles.songTitle}>{song.title}</Text>
          <Text style={styles.characterName}>{song.character}</Text>
        </View>

        <View style={styles.detailsGrid}>
          <View style={styles.detailCard}>
            <Mic size={20} color={Colors.dark.gold} />
            <Text style={styles.detailLabel}>Vocal Range</Text>
            <Text style={styles.detailValue}>{song.vocalRange}</Text>
          </View>
          <View style={styles.detailCard}>
            <Music size={20} color={Colors.dark.burgundyLight} />
            <Text style={styles.detailLabel}>Type</Text>
            <Text style={styles.detailValue}>{song.type}</Text>
          </View>
          <View style={styles.detailCard}>
            <Layers size={20} color={Colors.dark.success} />
            <Text style={styles.detailLabel}>Act</Text>
            <Text style={styles.detailValue}>Act {song.act}</Text>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.addButton, inRepertoire && styles.addButtonDone]}
          onPress={handleAdd}
          activeOpacity={0.8}
        >
          {inRepertoire ? (
            <>
              <CheckCircle size={20} color={Colors.dark.success} />
              <Text style={[styles.addButtonText, { color: Colors.dark.success }]}>In Repertoire</Text>
            </>
          ) : (
            <>
              <Plus size={20} color={Colors.dark.background} />
              <Text style={styles.addButtonText}>Add to Repertoire</Text>
            </>
          )}
        </TouchableOpacity>

        <View style={styles.contextSection}>
          <Text style={styles.contextTitle}>About This Song</Text>
          <Text style={styles.contextText}>
            "{song.title}" is a {song.type} from {show.title} ({show.year}), 
            performed by {song.character}. It appears in Act {song.act} of the show.
            {song.type === 'solo' && ' This is a great audition piece for ' + song.vocalRange + ' voices.'}
            {song.type === 'duet' && ' This duet showcases beautiful harmonies and dramatic interplay.'}
          </Text>
        </View>
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
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  headerCard: {
    backgroundColor: Colors.dark.surface,
    borderRadius: 18,
    padding: 24,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    marginBottom: 20,
  },
  showName: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: Colors.dark.gold,
    letterSpacing: 1.5,
    textTransform: 'uppercase' as const,
    marginBottom: 8,
  },
  songTitle: {
    fontSize: 26,
    fontWeight: '800' as const,
    color: Colors.dark.text,
    letterSpacing: -0.3,
    marginBottom: 6,
  },
  characterName: {
    fontSize: 15,
    color: Colors.dark.textSecondary,
  },
  detailsGrid: {
    flexDirection: 'row' as const,
    gap: 10,
    marginBottom: 24,
  },
  detailCard: {
    flex: 1,
    backgroundColor: Colors.dark.surface,
    borderRadius: 14,
    padding: 14,
    alignItems: 'center' as const,
    gap: 6,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  detailLabel: {
    fontSize: 11,
    color: Colors.dark.textMuted,
    fontWeight: '500' as const,
  },
  detailValue: {
    fontSize: 13,
    color: Colors.dark.text,
    fontWeight: '700' as const,
    textAlign: 'center' as const,
  },
  addButton: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: 8,
    backgroundColor: Colors.dark.gold,
    borderRadius: 14,
    paddingVertical: 16,
    marginBottom: 24,
  },
  addButtonDone: {
    backgroundColor: Colors.dark.surface,
    borderWidth: 1,
    borderColor: Colors.dark.success + '44',
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.dark.background,
  },
  contextSection: {
    backgroundColor: Colors.dark.surface,
    borderRadius: 14,
    padding: 18,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  contextTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.dark.text,
    marginBottom: 8,
  },
  contextText: {
    fontSize: 14,
    color: Colors.dark.textSecondary,
    lineHeight: 22,
  },
});

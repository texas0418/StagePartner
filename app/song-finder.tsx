import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Dimensions,
} from 'react-native';
import { Stack, router } from 'expo-router';
import { ArrowLeft, Shuffle, Filter, Music, Mic, Zap, Heart, Theater, ChevronRight, RefreshCw } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Colors from '@/constants/colors';
import { SHOWS } from '@/mocks/shows';
import { useApp } from '@/providers/AppProvider';
import { Song, Show, VOCAL_RANGES } from '@/types';

type SongStyle = 'uptempo' | 'ballad' | 'comedic' | 'dramatic' | 'legit' | 'any';
type AuditionType = 'general' | 'contemporary' | 'classic' | 'belt' | 'legit' | 'any';

interface SongResult {
  song: Song;
  show: Show;
  matchScore: number;
  matchReasons: string[];
}

const STYLE_OPTIONS: { key: SongStyle; label: string; emoji: string }[] = [
  { key: 'any', label: 'Any Style', emoji: '🎭' },
  { key: 'uptempo', label: 'Uptempo', emoji: '⚡' },
  { key: 'ballad', label: 'Ballad', emoji: '💫' },
  { key: 'comedic', label: 'Comedic', emoji: '😂' },
  { key: 'dramatic', label: 'Dramatic', emoji: '🎪' },
];

const AUDITION_TYPE_OPTIONS: { key: AuditionType; label: string; emoji: string }[] = [
  { key: 'any', label: 'Any Type', emoji: '🎤' },
  { key: 'contemporary', label: 'Contemporary', emoji: '🆕' },
  { key: 'classic', label: 'Classic', emoji: '📜' },
  { key: 'belt', label: 'Belt/Mix', emoji: '🔥' },
  { key: 'legit', label: 'Legit', emoji: '🎵' },
  { key: 'general', label: 'General', emoji: '🌟' },
];

const SONG_STYLE_HINTS: Record<string, SongStyle[]> = {
  'ham-2': ['uptempo', 'dramatic'],
  'ham-3': ['uptempo'],
  'ham-4': ['uptempo', 'dramatic'],
  'ham-5': ['ballad', 'dramatic'],
  'ham-7': ['ballad', 'dramatic'],
  'wic-2': ['ballad', 'dramatic'],
  'wic-3': ['comedic', 'uptempo'],
  'wic-4': ['dramatic', 'uptempo'],
  'wic-5': ['ballad'],
  'wic-6': ['dramatic'],
  'pha-1': ['ballad', 'legit'],
  'pha-2': ['ballad', 'dramatic'],
  'pha-3': ['ballad'],
  'pha-5': ['ballad', 'dramatic'],
  'les-1': ['ballad', 'dramatic'],
  'les-2': ['ballad', 'dramatic'],
  'les-3': ['ballad', 'dramatic'],
  'les-4': ['ballad'],
  'chi-1': ['uptempo'],
  'chi-3': ['comedic', 'uptempo'],
  'chi-4': ['comedic', 'uptempo'],
  'ren-2': ['ballad', 'dramatic'],
  'ren-3': ['uptempo'],
  'deh-1': ['uptempo', 'dramatic'],
  'deh-3': ['ballad', 'dramatic'],
  'deh-4': ['ballad'],
  'swe-2': ['dramatic'],
  'swe-5': ['comedic', 'uptempo'],
  'swe-4': ['ballad'],
  'itw-2': ['uptempo'],
  'itw-3': ['ballad'],
  'itw-4': ['dramatic'],
  'com-2': ['ballad', 'dramatic'],
  'com-3': ['comedic', 'dramatic'],
  'com-4': ['comedic', 'uptempo'],
  'six-2': ['uptempo'],
  'six-3': ['comedic', 'uptempo'],
  'six-4': ['ballad'],
  'had-2': ['ballad', 'dramatic'],
  'had-3': ['ballad'],
  'had-5': ['ballad', 'dramatic'],
};

const BELT_SONGS = new Set([
  'wic-4', 'wic-6', 'wic-2', 'ham-2', 'ham-4', 'chi-1', 'chi-4',
  'ren-3', 'deh-1', 'six-2', 'six-3', 'itw-4', 'swe-2',
]);

const LEGIT_SONGS = new Set([
  'pha-1', 'pha-2', 'pha-3', 'pha-5', 'les-4', 'itw-3', 'swe-4',
  'wic-5', 'com-2', 'had-3',
]);

function getSongResults(
  vocalRange: string,
  style: SongStyle,
  auditionType: AuditionType,
  excludeSongIds: Set<string>,
): SongResult[] {
  const results: SongResult[] = [];

  for (const show of SHOWS) {
    for (const song of show.songs) {
      if (song.type === 'ensemble') continue;
      if (excludeSongIds.has(song.id)) continue;

      let score = 0;
      const reasons: string[] = [];

      if (vocalRange) {
        const songRange = song.vocalRange.toLowerCase();
        const userRange = vocalRange.toLowerCase();
        if (songRange.includes(userRange) || songRange === 'mixed') {
          score += 30;
          reasons.push('Matches your vocal range');
        } else if (songRange.includes(userRange.split('/')[0] ?? '')) {
          score += 15;
          reasons.push('Partial range match');
        }
      } else {
        score += 10;
      }

      if (style !== 'any') {
        const hints = SONG_STYLE_HINTS[song.id] ?? [];
        if (hints.includes(style)) {
          score += 25;
          reasons.push(`${style.charAt(0).toUpperCase() + style.slice(1)} style`);
        }
      } else {
        score += 5;
      }

      if (auditionType !== 'any') {
        if (auditionType === 'contemporary' && (show.genre === 'Contemporary' || show.genre === 'Rock')) {
          score += 20;
          reasons.push('Contemporary show');
        } else if (auditionType === 'classic' && (show.genre === 'Classic' || show.genre === 'Drama')) {
          score += 20;
          reasons.push('Classic show');
        } else if (auditionType === 'belt' && BELT_SONGS.has(song.id)) {
          score += 25;
          reasons.push('Great belt showcase');
        } else if (auditionType === 'legit' && LEGIT_SONGS.has(song.id)) {
          score += 25;
          reasons.push('Legit singing showcase');
        } else if (auditionType === 'general') {
          score += 10;
        }
      } else {
        score += 5;
      }

      if (song.type === 'solo') {
        score += 10;
        reasons.push('Solo');
      } else if (song.type === 'duet') {
        score += 3;
      }

      score += Math.random() * 8;

      if (score > 15) {
        results.push({ song, show, matchScore: score, matchReasons: reasons });
      }
    }
  }

  return results.sort((a, b) => b.matchScore - a.matchScore);
}

export default function SongFinderScreen() {
  const insets = useSafeAreaInsets();
  const { settings, isInRepertoire } = useApp();

  const [selectedRange, setSelectedRange] = useState<string>(settings.vocalRange || '');
  const [selectedStyle, setSelectedStyle] = useState<SongStyle>('any');
  const [selectedAuditionType, setSelectedAuditionType] = useState<AuditionType>('any');
  const [showResults, setShowResults] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const results = useMemo(() => {
    if (!showResults) return [];
    const exclude = new Set<string>();
    return getSongResults(selectedRange, selectedStyle, selectedAuditionType, exclude).slice(0, 12);
  }, [showResults, selectedRange, selectedStyle, selectedAuditionType, refreshKey]);

  const handleFind = useCallback(() => {
    setShowResults(true);
    setRefreshKey(k => k + 1);
  }, []);

  const handleShuffle = useCallback(() => {
    setRefreshKey(k => k + 1);
  }, []);

  const getScoreColor = (score: number) => {
    if (score >= 60) return Colors.dark.success;
    if (score >= 40) return Colors.dark.gold;
    return Colors.dark.textSecondary;
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft size={22} color={Colors.dark.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Song Finder</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {!showResults ? (
          <>
            <Text style={styles.heroEmoji}>🎯</Text>
            <Text style={styles.heroTitle}>What Should I Sing?</Text>
            <Text style={styles.heroSubtitle}>
              Tell us about your voice and what you need, and we'll recommend the perfect song.
            </Text>

            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Your Vocal Range</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
                {VOCAL_RANGES.map(range => (
                  <TouchableOpacity
                    key={range}
                    style={[styles.chip, selectedRange === range && styles.chipActive]}
                    onPress={() => setSelectedRange(selectedRange === range ? '' : range)}
                  >
                    <Text style={[styles.chipText, selectedRange === range && styles.chipTextActive]}>{range}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Song Style</Text>
              <View style={styles.optionGrid}>
                {STYLE_OPTIONS.map(opt => (
                  <TouchableOpacity
                    key={opt.key}
                    style={[styles.optionCard, selectedStyle === opt.key && styles.optionCardActive]}
                    onPress={() => setSelectedStyle(opt.key)}
                  >
                    <Text style={styles.optionEmoji}>{opt.emoji}</Text>
                    <Text style={[styles.optionLabel, selectedStyle === opt.key && styles.optionLabelActive]}>{opt.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Audition Type</Text>
              <View style={styles.optionGrid}>
                {AUDITION_TYPE_OPTIONS.map(opt => (
                  <TouchableOpacity
                    key={opt.key}
                    style={[styles.optionCard, selectedAuditionType === opt.key && styles.optionCardActive]}
                    onPress={() => setSelectedAuditionType(opt.key)}
                  >
                    <Text style={styles.optionEmoji}>{opt.emoji}</Text>
                    <Text style={[styles.optionLabel, selectedAuditionType === opt.key && styles.optionLabelActive]}>{opt.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <TouchableOpacity style={styles.findBtn} onPress={handleFind}>
              <Shuffle size={20} color={Colors.dark.background} />
              <Text style={styles.findBtnText}>Find My Song</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <View style={styles.resultsHeader}>
              <View>
                <Text style={styles.resultsTitle}>Recommendations</Text>
                <Text style={styles.resultsSubtitle}>
                  {selectedRange ? selectedRange : 'Any range'}
                  {selectedStyle !== 'any' ? ` · ${selectedStyle}` : ''}
                  {selectedAuditionType !== 'any' ? ` · ${selectedAuditionType}` : ''}
                </Text>
              </View>
              <View style={styles.resultsActions}>
                <TouchableOpacity style={styles.reshuffleBtn} onPress={handleShuffle}>
                  <RefreshCw size={16} color={Colors.dark.gold} />
                </TouchableOpacity>
                <TouchableOpacity style={styles.editFilterBtn} onPress={() => setShowResults(false)}>
                  <Filter size={16} color={Colors.dark.textSecondary} />
                </TouchableOpacity>
              </View>
            </View>

            {results.length === 0 ? (
              <View style={styles.emptyState}>
                <Music size={48} color={Colors.dark.textMuted} />
                <Text style={styles.emptyTitle}>No matches found</Text>
                <Text style={styles.emptySubtitle}>Try adjusting your filters</Text>
              </View>
            ) : (
              results.map((result, i) => {
                const inRep = isInRepertoire(result.song.id);
                const scoreColor = getScoreColor(result.matchScore);

                return (
                  <TouchableOpacity
                    key={`${result.song.id}-${refreshKey}`}
                    style={styles.resultCard}
                    onPress={() => router.push({ pathname: '/song/[songId]', params: { songId: result.song.id } } as never)}
                    activeOpacity={0.8}
                  >
                    <View style={styles.resultRank}>
                      <Text style={[styles.resultRankNum, { color: i < 3 ? Colors.dark.gold : Colors.dark.textMuted }]}>
                        {i + 1}
                      </Text>
                    </View>
                    <View style={styles.resultInfo}>
                      <View style={styles.resultTitleRow}>
                        <Text style={styles.resultSongTitle} numberOfLines={1}>{result.song.title}</Text>
                        {inRep && (
                          <View style={styles.inRepBadge}>
                            <Text style={styles.inRepText}>In Rep</Text>
                          </View>
                        )}
                      </View>
                      <Text style={styles.resultShowTitle} numberOfLines={1}>
                        {result.show.title} · {result.song.character}
                      </Text>
                      <View style={styles.resultMeta}>
                        <View style={[styles.scoreBadge, { backgroundColor: scoreColor + '22' }]}>
                          <Text style={[styles.scoreText, { color: scoreColor }]}>
                            {Math.round(result.matchScore)}% match
                          </Text>
                        </View>
                        <Text style={styles.resultRange}>{result.song.vocalRange}</Text>
                      </View>
                      {result.matchReasons.length > 0 && (
                        <View style={styles.reasonsRow}>
                          {result.matchReasons.slice(0, 3).map((reason, ri) => (
                            <View key={ri} style={styles.reasonChip}>
                              <Text style={styles.reasonText}>{reason}</Text>
                            </View>
                          ))}
                        </View>
                      )}
                    </View>
                    <ChevronRight size={18} color={Colors.dark.textMuted} />
                  </TouchableOpacity>
                );
              })
            )}

            <TouchableOpacity style={styles.backToFiltersBtn} onPress={() => setShowResults(false)}>
              <Filter size={16} color={Colors.dark.gold} />
              <Text style={styles.backToFiltersText}>Adjust Filters</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.dark.background },
  header: {
    flexDirection: 'row' as const, alignItems: 'center' as const,
    paddingHorizontal: 16, paddingBottom: 12, gap: 12,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.dark.surface,
    justifyContent: 'center' as const, alignItems: 'center' as const,
    borderWidth: 1, borderColor: Colors.dark.border,
  },
  headerTitle: { flex: 1, fontSize: 22, fontWeight: '800' as const, color: Colors.dark.text, textAlign: 'center' as const },
  scrollContent: { padding: 20, paddingBottom: 40 },
  heroEmoji: { fontSize: 48, textAlign: 'center' as const, marginBottom: 12 },
  heroTitle: { fontSize: 26, fontWeight: '800' as const, color: Colors.dark.text, textAlign: 'center' as const, letterSpacing: -0.3 },
  heroSubtitle: { fontSize: 14, color: Colors.dark.textSecondary, textAlign: 'center' as const, marginTop: 8, marginBottom: 28, lineHeight: 20, paddingHorizontal: 10 },
  section: { marginBottom: 24 },
  sectionLabel: { fontSize: 15, fontWeight: '700' as const, color: Colors.dark.text, marginBottom: 12 },
  chipRow: { gap: 8 },
  chip: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
    backgroundColor: Colors.dark.surfaceLight, borderWidth: 1, borderColor: Colors.dark.border,
  },
  chipActive: { backgroundColor: Colors.dark.goldDim, borderColor: Colors.dark.gold },
  chipText: { fontSize: 13, color: Colors.dark.textSecondary, fontWeight: '600' as const },
  chipTextActive: { color: Colors.dark.gold },
  optionGrid: { flexDirection: 'row' as const, flexWrap: 'wrap' as const, gap: 10 },
  optionCard: {
    width: '30%' as const, backgroundColor: Colors.dark.surface, borderRadius: 14,
    padding: 14, alignItems: 'center' as const, borderWidth: 1, borderColor: Colors.dark.border,
    flexGrow: 1, minWidth: 95,
  },
  optionCardActive: { backgroundColor: Colors.dark.goldDim + '44', borderColor: Colors.dark.gold },
  optionEmoji: { fontSize: 24, marginBottom: 6 },
  optionLabel: { fontSize: 12, fontWeight: '600' as const, color: Colors.dark.textSecondary, textAlign: 'center' as const },
  optionLabelActive: { color: Colors.dark.gold },
  findBtn: {
    flexDirection: 'row' as const, alignItems: 'center' as const, justifyContent: 'center' as const, gap: 10,
    backgroundColor: Colors.dark.gold, borderRadius: 16, paddingVertical: 18, marginTop: 8,
  },
  findBtnText: { fontSize: 17, fontWeight: '700' as const, color: Colors.dark.background },
  resultsHeader: {
    flexDirection: 'row' as const, justifyContent: 'space-between' as const,
    alignItems: 'center' as const, marginBottom: 20,
  },
  resultsTitle: { fontSize: 24, fontWeight: '800' as const, color: Colors.dark.text },
  resultsSubtitle: { fontSize: 13, color: Colors.dark.textMuted, marginTop: 2 },
  resultsActions: { flexDirection: 'row' as const, gap: 8 },
  reshuffleBtn: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.dark.surface,
    justifyContent: 'center' as const, alignItems: 'center' as const,
    borderWidth: 1, borderColor: Colors.dark.gold + '44',
  },
  editFilterBtn: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.dark.surface,
    justifyContent: 'center' as const, alignItems: 'center' as const,
    borderWidth: 1, borderColor: Colors.dark.border,
  },
  resultCard: {
    flexDirection: 'row' as const, alignItems: 'center' as const,
    backgroundColor: Colors.dark.surface, borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: Colors.dark.border, marginBottom: 10, gap: 12,
  },
  resultRank: {
    width: 32, height: 32, borderRadius: 16, backgroundColor: Colors.dark.surfaceLight,
    justifyContent: 'center' as const, alignItems: 'center' as const,
  },
  resultRankNum: { fontSize: 14, fontWeight: '800' as const },
  resultInfo: { flex: 1 },
  resultTitleRow: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: 8 },
  resultSongTitle: { fontSize: 15, fontWeight: '700' as const, color: Colors.dark.text, flex: 1 },
  inRepBadge: { backgroundColor: Colors.dark.success + '22', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  inRepText: { fontSize: 10, color: Colors.dark.success, fontWeight: '700' as const },
  resultShowTitle: { fontSize: 12, color: Colors.dark.textSecondary, marginTop: 2 },
  resultMeta: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: 8, marginTop: 6 },
  scoreBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  scoreText: { fontSize: 11, fontWeight: '700' as const },
  resultRange: { fontSize: 11, color: Colors.dark.textMuted },
  reasonsRow: { flexDirection: 'row' as const, flexWrap: 'wrap' as const, gap: 4, marginTop: 6 },
  reasonChip: { backgroundColor: Colors.dark.surfaceLight, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  reasonText: { fontSize: 10, color: Colors.dark.textMuted },
  emptyState: { alignItems: 'center' as const, paddingTop: 60, gap: 8 },
  emptyTitle: { fontSize: 18, fontWeight: '600' as const, color: Colors.dark.text, marginTop: 8 },
  emptySubtitle: { fontSize: 14, color: Colors.dark.textMuted },
  backToFiltersBtn: {
    flexDirection: 'row' as const, alignItems: 'center' as const, justifyContent: 'center' as const, gap: 8,
    backgroundColor: Colors.dark.surface, borderRadius: 14, paddingVertical: 16, marginTop: 10,
    borderWidth: 1, borderColor: Colors.dark.border,
  },
  backToFiltersText: { fontSize: 15, fontWeight: '600' as const, color: Colors.dark.gold },
});

import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
  Pressable,
  TextInput,
  Animated,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import {
  Music, Trash2, ChevronRight, BarChart3, PlayCircle, Timer,
  Pause, Play, Square, Tag, FileText, X, Check, Share2,
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Clipboard from 'expo-clipboard';
import Colors from '@/constants/colors';
import { useApp } from '@/providers/AppProvider';
import { getSongById } from '@/mocks/shows';
import { RepertoireItem, SongTag, ALL_TAGS } from '@/types';

const STATUS_COLORS: Record<string, string> = {
  'learning': Colors.dark.warning,
  'polishing': Colors.dark.gold,
  'performance-ready': Colors.dark.success,
};

const STATUS_LABELS: Record<string, string> = {
  'learning': 'Learning',
  'polishing': 'Polishing',
  'performance-ready': 'Ready',
};

const TAG_COLORS: Record<string, string> = {
  'uptempo': '#E8C96A',
  'ballad': '#7EB5E8',
  'comedic': '#E87EB5',
  'dramatic': '#B22255',
  'patter': '#2ECC71',
  'belt': '#E74C3C',
  'legit': '#9B59B6',
  'contemporary': '#3498DB',
  'classic': '#D4A843',
  'audition-ready': '#2ECC71',
};

export default function RepertoireScreen() {
  const insets = useSafeAreaInsets();
  const {
    repertoire, removeFromRepertoire, updateRepertoireItem,
    addPracticeSession, toggleTag,
  } = useApp();
  const [filter, setFilter] = useState<string>('all');
  const [timerModal, setTimerModal] = useState(false);
  const [timerItem, setTimerItem] = useState<RepertoireItem | null>(null);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [timerRunning, setTimerRunning] = useState(false);
  const [timerNotes, setTimerNotes] = useState('');
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const [notesModal, setNotesModal] = useState(false);
  const [notesItem, setNotesItem] = useState<RepertoireItem | null>(null);
  const [editNotes, setEditNotes] = useState('');
  const [editLyrics, setEditLyrics] = useState('');
  const [notesTab, setNotesTab] = useState<'notes' | 'lyrics'>('notes');

  const [tagsModal, setTagsModal] = useState(false);
  const [tagsItem, setTagsItem] = useState<RepertoireItem | null>(null);

  const filteredRepertoire = useMemo(() => {
    if (filter === 'all') return repertoire;
    return repertoire.filter(r => r.status === filter);
  }, [repertoire, filter]);

  useEffect(() => {
    if (timerRunning) {
      timerRef.current = setInterval(() => {
        setTimerSeconds(s => s + 1);
      }, 1000);
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.15, duration: 800, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
        ])
      ).start();
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
      pulseAnim.setValue(1);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [timerRunning]);

  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const startTimer = useCallback((item: RepertoireItem) => {
    setTimerItem(item);
    setTimerSeconds(0);
    setTimerRunning(false);
    setTimerNotes('');
    setTimerModal(true);
  }, []);

  const saveTimerSession = useCallback(() => {
    if (!timerItem || timerSeconds < 10) {
      Alert.alert('Too Short', 'Practice for at least 10 seconds to log a session.');
      return;
    }
    const durationMinutes = Math.max(1, Math.round(timerSeconds / 60));
    addPracticeSession({
      id: Date.now().toString(),
      repertoireItemId: timerItem.id,
      date: new Date().toISOString(),
      durationMinutes,
      notes: timerNotes,
    });
    setTimerRunning(false);
    setTimerModal(false);
    const result = getSongById(timerItem.songId);
    Alert.alert('Session Saved', `${durationMinutes} min practice logged for "${result?.song.title ?? 'song'}".`);
  }, [timerItem, timerSeconds, timerNotes, addPracticeSession]);

  const openNotes = useCallback((item: RepertoireItem) => {
    setNotesItem(item);
    setEditNotes(item.notes);
    setEditLyrics(item.lyrics ?? '');
    setNotesTab('notes');
    setNotesModal(true);
  }, []);

  const saveNotes = useCallback(() => {
    if (!notesItem) return;
    updateRepertoireItem(notesItem.id, { notes: editNotes, lyrics: editLyrics });
    setNotesModal(false);
  }, [notesItem, editNotes, editLyrics, updateRepertoireItem]);

  const openTags = useCallback((item: RepertoireItem) => {
    setTagsItem(item);
    setTagsModal(true);
  }, []);

  const handleRemove = useCallback((item: RepertoireItem) => {
    const result = getSongById(item.songId);
    Alert.alert(
      'Remove Song',
      `Remove "${result?.song.title ?? 'this song'}" from your repertoire?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Remove', style: 'destructive', onPress: () => removeFromRepertoire(item.id) },
      ]
    );
  }, [removeFromRepertoire]);

  const cycleStatus = useCallback((item: RepertoireItem) => {
    const statuses: RepertoireItem['status'][] = ['learning', 'polishing', 'performance-ready'];
    const currentIndex = statuses.indexOf(item.status);
    const nextStatus = statuses[(currentIndex + 1) % statuses.length];
    updateRepertoireItem(item.id, { status: nextStatus });
  }, [updateRepertoireItem]);

  const handleShareRepertoire = useCallback(async () => {
    const lines = repertoire.map(item => {
      const result = getSongById(item.songId);
      if (!result) return '';
      const { song, show } = result;
      const tags = item.tags.length > 0 ? ` [${item.tags.join(', ')}]` : '';
      return `• ${song.title} — ${show.title} (${song.character}) | ${STATUS_LABELS[item.status] ?? item.status}${tags}`;
    }).filter(Boolean);

    const text = `🎭 My Repertoire (${repertoire.length} songs)\n\n${lines.join('\n')}`;

    try {
      await Clipboard.setStringAsync(text);
      Alert.alert('Copied!', 'Your repertoire list has been copied to clipboard.');
    } catch {
      Alert.alert('Error', 'Could not copy to clipboard.');
    }
  }, [repertoire]);

  const renderItem = useCallback((item: RepertoireItem) => {
    const result = getSongById(item.songId);
    if (!result) return null;
    const { song, show } = result;
    const statusColor = STATUS_COLORS[item.status] ?? Colors.dark.textMuted;

    return (
      <View key={item.id} style={styles.repCard}>
        <TouchableOpacity
          style={styles.repCardMain}
          onPress={() => router.push({ pathname: '/song/[songId]', params: { songId: song.id } } as never)}
          activeOpacity={0.7}
        >
          <View style={[styles.statusBar, { backgroundColor: statusColor }]} />
          <View style={styles.repInfo}>
            <Text style={styles.repSongTitle} numberOfLines={1}>{song.title}</Text>
            <Text style={styles.repShowTitle} numberOfLines={1}>{show.title} · {song.character}</Text>
            <View style={styles.repMeta}>
              <TouchableOpacity
                style={[styles.statusBadge, { backgroundColor: statusColor + '22' }]}
                onPress={() => cycleStatus(item)}
              >
                <Text style={[styles.statusText, { color: statusColor }]}>
                  {STATUS_LABELS[item.status] ?? item.status}
                </Text>
              </TouchableOpacity>
              <View style={styles.practiceCount}>
                <BarChart3 size={12} color={Colors.dark.textMuted} />
                <Text style={styles.practiceCountText}>{item.practiceCount}x</Text>
              </View>
            </View>
            {item.tags.length > 0 && (
              <View style={styles.tagRow}>
                {item.tags.slice(0, 3).map(tag => (
                  <View key={tag} style={[styles.miniTag, { backgroundColor: (TAG_COLORS[tag] ?? Colors.dark.textMuted) + '22' }]}>
                    <Text style={[styles.miniTagText, { color: TAG_COLORS[tag] ?? Colors.dark.textMuted }]}>{tag}</Text>
                  </View>
                ))}
                {item.tags.length > 3 && (
                  <Text style={styles.moreTagsText}>+{item.tags.length - 3}</Text>
                )}
              </View>
            )}
          </View>
          <ChevronRight size={18} color={Colors.dark.textMuted} />
        </TouchableOpacity>
        <View style={styles.repActions}>
          <TouchableOpacity style={styles.actionIcon} onPress={() => startTimer(item)}>
            <Timer size={15} color={Colors.dark.gold} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionIcon} onPress={() => openNotes(item)}>
            <FileText size={15} color={Colors.dark.goldLight} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionIcon} onPress={() => openTags(item)}>
            <Tag size={15} color={Colors.dark.success} />
          </TouchableOpacity>
          <View style={{ flex: 1 }} />
          <TouchableOpacity
            onPress={() => handleRemove(item)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Trash2 size={15} color={Colors.dark.danger} />
          </TouchableOpacity>
        </View>
      </View>
    );
  }, [cycleStatus, startTimer, openNotes, openTags, handleRemove]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>My Repertoire</Text>
          <Text style={styles.headerCount}>{repertoire.length} songs</Text>
        </View>
        {repertoire.length > 0 && (
          <TouchableOpacity onPress={handleShareRepertoire} style={styles.shareBtn}>
            <Share2 size={18} color={Colors.dark.gold} />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterScroll}
        contentContainerStyle={styles.filterContent}
      >
        {[
          { key: 'all', label: 'All' },
          { key: 'learning', label: 'Learning' },
          { key: 'polishing', label: 'Polishing' },
          { key: 'performance-ready', label: 'Ready' },
        ].map(f => (
          <TouchableOpacity
            key={f.key}
            style={[styles.filterChip, filter === f.key && styles.filterChipActive]}
            onPress={() => setFilter(f.key)}
          >
            <Text style={[styles.filterText, filter === f.key && styles.filterTextActive]}>
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {filteredRepertoire.length === 0 ? (
          <View style={styles.emptyState}>
            <Music size={48} color={Colors.dark.textMuted} />
            <Text style={styles.emptyTitle}>
              {filter === 'all' ? 'No songs yet' : `No ${filter} songs`}
            </Text>
            <Text style={styles.emptySubtitle}>Browse Discover to add songs</Text>
          </View>
        ) : (
          filteredRepertoire.map(renderItem)
        )}
      </ScrollView>

      <Modal visible={timerModal} animationType="slide" transparent onRequestClose={() => { setTimerRunning(false); setTimerModal(false); }}>
        <Pressable style={styles.modalOverlay} onPress={() => { setTimerRunning(false); setTimerModal(false); }}>
          <Pressable style={styles.timerModalContent} onPress={() => {}}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Practice Timer</Text>
              <TouchableOpacity onPress={() => { setTimerRunning(false); setTimerModal(false); }}>
                <X size={22} color={Colors.dark.textMuted} />
              </TouchableOpacity>
            </View>
            {timerItem && (() => {
              const r = getSongById(timerItem.songId);
              return r ? (
                <Text style={styles.timerSongName}>{r.song.title} — {r.show.title}</Text>
              ) : null;
            })()}
            <Animated.View style={[styles.timerCircle, { transform: [{ scale: timerRunning ? pulseAnim : 1 }] }]}>
              <Text style={styles.timerDisplay}>{formatTimer(timerSeconds)}</Text>
              <Text style={styles.timerLabel}>{timerRunning ? 'Practicing...' : timerSeconds > 0 ? 'Paused' : 'Ready'}</Text>
            </Animated.View>
            <View style={styles.timerControls}>
              {!timerRunning ? (
                <TouchableOpacity style={styles.timerPlayBtn} onPress={() => setTimerRunning(true)}>
                  <Play size={28} color={Colors.dark.background} fill={Colors.dark.background} />
                </TouchableOpacity>
              ) : (
                <TouchableOpacity style={styles.timerPauseBtn} onPress={() => setTimerRunning(false)}>
                  <Pause size={28} color={Colors.dark.gold} />
                </TouchableOpacity>
              )}
              {timerSeconds > 0 && !timerRunning && (
                <TouchableOpacity style={styles.timerResetBtn} onPress={() => setTimerSeconds(0)}>
                  <Text style={styles.timerResetText}>Reset</Text>
                </TouchableOpacity>
              )}
            </View>
            <TextInput
              style={styles.timerNotesInput}
              placeholder="Session notes (optional)..."
              placeholderTextColor={Colors.dark.textMuted}
              value={timerNotes}
              onChangeText={setTimerNotes}
              multiline
            />
            <TouchableOpacity
              style={[styles.submitBtn, timerSeconds < 10 && styles.submitBtnDisabled]}
              onPress={saveTimerSession}
            >
              <Text style={styles.submitBtnText}>Save Session ({Math.max(1, Math.round(timerSeconds / 60))} min)</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal visible={notesModal} animationType="slide" transparent onRequestClose={() => setNotesModal(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setNotesModal(false)}>
          <Pressable style={styles.notesModalContent} onPress={() => {}}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Notes & Lyrics</Text>
              <TouchableOpacity onPress={saveNotes}>
                <Check size={22} color={Colors.dark.success} />
              </TouchableOpacity>
            </View>
            <View style={styles.notesTabRow}>
              <TouchableOpacity
                style={[styles.notesTab, notesTab === 'notes' && styles.notesTabActive]}
                onPress={() => setNotesTab('notes')}
              >
                <Text style={[styles.notesTabText, notesTab === 'notes' && styles.notesTabTextActive]}>Notes</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.notesTab, notesTab === 'lyrics' && styles.notesTabActive]}
                onPress={() => setNotesTab('lyrics')}
              >
                <Text style={[styles.notesTabText, notesTab === 'lyrics' && styles.notesTabTextActive]}>Lyrics</Text>
              </TouchableOpacity>
            </View>
            {notesTab === 'notes' ? (
              <TextInput
                style={styles.notesInput}
                placeholder="Acting choices, vocal notes, key changes..."
                placeholderTextColor={Colors.dark.textMuted}
                value={editNotes}
                onChangeText={setEditNotes}
                multiline
                textAlignVertical="top"
              />
            ) : (
              <TextInput
                style={styles.notesInput}
                placeholder="Paste or type lyrics here..."
                placeholderTextColor={Colors.dark.textMuted}
                value={editLyrics}
                onChangeText={setEditLyrics}
                multiline
                textAlignVertical="top"
              />
            )}
          </Pressable>
        </Pressable>
      </Modal>

      <Modal visible={tagsModal} animationType="fade" transparent onRequestClose={() => setTagsModal(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setTagsModal(false)}>
          <Pressable style={styles.tagsModalContent} onPress={() => {}}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Song Tags</Text>
              <TouchableOpacity onPress={() => setTagsModal(false)}>
                <X size={22} color={Colors.dark.textMuted} />
              </TouchableOpacity>
            </View>
            <View style={styles.tagsGrid}>
              {ALL_TAGS.map(tag => {
                const isActive = tagsItem?.tags.includes(tag) ?? false;
                const color = TAG_COLORS[tag] ?? Colors.dark.textMuted;
                return (
                  <TouchableOpacity
                    key={tag}
                    style={[styles.tagChip, isActive && { backgroundColor: color + '33', borderColor: color }]}
                    onPress={() => tagsItem && toggleTag(tagsItem.id, tag)}
                  >
                    <Text style={[styles.tagChipText, isActive && { color }]}>{tag}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.dark.background },
  header: {
    paddingHorizontal: 20, paddingTop: 12, paddingBottom: 4,
    flexDirection: 'row' as const, justifyContent: 'space-between' as const, alignItems: 'center' as const,
  },
  headerTitle: { fontSize: 32, fontWeight: '800' as const, color: Colors.dark.text, letterSpacing: -0.5 },
  headerCount: { fontSize: 13, color: Colors.dark.textMuted, fontWeight: '500' as const, marginTop: 2 },
  shareBtn: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.dark.surface,
    justifyContent: 'center' as const, alignItems: 'center' as const, borderWidth: 1, borderColor: Colors.dark.border,
  },
  filterScroll: { marginTop: 16, maxHeight: 44 },
  filterContent: { paddingHorizontal: 20, gap: 8 },
  filterChip: {
    paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20,
    backgroundColor: Colors.dark.surfaceLight, borderWidth: 1, borderColor: Colors.dark.border,
  },
  filterChipActive: { backgroundColor: Colors.dark.goldDim, borderColor: Colors.dark.gold },
  filterText: { color: Colors.dark.textSecondary, fontSize: 13, fontWeight: '600' as const },
  filterTextActive: { color: Colors.dark.gold },
  scrollContent: { padding: 20, paddingBottom: 30, gap: 12 },
  repCard: { backgroundColor: Colors.dark.surface, borderRadius: 14, overflow: 'hidden' as const, borderWidth: 1, borderColor: Colors.dark.border },
  repCardMain: { flexDirection: 'row' as const, alignItems: 'center' as const, padding: 14, paddingLeft: 0 },
  statusBar: { width: 4, height: 52, borderRadius: 2, marginRight: 12 },
  repInfo: { flex: 1 },
  repSongTitle: { fontSize: 15, fontWeight: '700' as const, color: Colors.dark.text, marginBottom: 2 },
  repShowTitle: { fontSize: 12, color: Colors.dark.textSecondary, marginBottom: 6 },
  repMeta: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: 10 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  statusText: { fontSize: 10, fontWeight: '700' as const, textTransform: 'uppercase' as const },
  practiceCount: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: 4 },
  practiceCountText: { fontSize: 11, color: Colors.dark.textMuted },
  tagRow: { flexDirection: 'row' as const, gap: 4, marginTop: 6, flexWrap: 'wrap' as const },
  miniTag: { paddingHorizontal: 6, paddingVertical: 1, borderRadius: 4 },
  miniTagText: { fontSize: 9, fontWeight: '600' as const },
  moreTagsText: { fontSize: 9, color: Colors.dark.textMuted, alignSelf: 'center' as const },
  repActions: {
    flexDirection: 'row' as const, alignItems: 'center' as const, gap: 12,
    paddingHorizontal: 14, paddingVertical: 10, borderTopWidth: 0.5, borderTopColor: Colors.dark.border,
  },
  actionIcon: {
    width: 32, height: 32, borderRadius: 16, backgroundColor: Colors.dark.surfaceLight,
    justifyContent: 'center' as const, alignItems: 'center' as const,
  },
  emptyState: { alignItems: 'center' as const, justifyContent: 'center' as const, paddingTop: 80, gap: 8 },
  emptyTitle: { fontSize: 18, fontWeight: '600' as const, color: Colors.dark.text, marginTop: 8 },
  emptySubtitle: { fontSize: 14, color: Colors.dark.textMuted, textAlign: 'center' as const },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' as const },
  timerModalContent: { backgroundColor: Colors.dark.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: '80%' },
  notesModalContent: { backgroundColor: Colors.dark.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: '85%', minHeight: '60%' },
  tagsModalContent: { backgroundColor: Colors.dark.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24 },
  modalHeader: { flexDirection: 'row' as const, justifyContent: 'space-between' as const, alignItems: 'center' as const, marginBottom: 16 },
  modalTitle: { fontSize: 20, fontWeight: '700' as const, color: Colors.dark.text },
  timerSongName: { fontSize: 14, color: Colors.dark.textSecondary, textAlign: 'center' as const, marginBottom: 20 },
  timerCircle: {
    width: 180, height: 180, borderRadius: 90, borderWidth: 3, borderColor: Colors.dark.gold,
    justifyContent: 'center' as const, alignItems: 'center' as const, alignSelf: 'center' as const, marginBottom: 24,
    backgroundColor: Colors.dark.goldDim + '11',
  },
  timerDisplay: { fontSize: 42, fontWeight: '800' as const, color: Colors.dark.text, fontVariant: ['tabular-nums'] },
  timerLabel: { fontSize: 12, color: Colors.dark.textMuted, marginTop: 4 },
  timerControls: { flexDirection: 'row' as const, justifyContent: 'center' as const, alignItems: 'center' as const, gap: 20, marginBottom: 20 },
  timerPlayBtn: {
    width: 64, height: 64, borderRadius: 32, backgroundColor: Colors.dark.gold,
    justifyContent: 'center' as const, alignItems: 'center' as const, paddingLeft: 4,
  },
  timerPauseBtn: {
    width: 64, height: 64, borderRadius: 32, backgroundColor: Colors.dark.surfaceLight,
    justifyContent: 'center' as const, alignItems: 'center' as const, borderWidth: 2, borderColor: Colors.dark.gold,
  },
  timerResetBtn: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10, backgroundColor: Colors.dark.surfaceLight },
  timerResetText: { color: Colors.dark.textSecondary, fontWeight: '600' as const, fontSize: 14 },
  timerNotesInput: {
    backgroundColor: Colors.dark.surfaceLight, borderRadius: 12, padding: 14, fontSize: 14,
    color: Colors.dark.text, borderWidth: 1, borderColor: Colors.dark.border, minHeight: 60, marginBottom: 16,
    textAlignVertical: 'top' as const,
  },
  submitBtn: { backgroundColor: Colors.dark.gold, borderRadius: 14, paddingVertical: 16, alignItems: 'center' as const, marginBottom: 10 },
  submitBtnDisabled: { opacity: 0.5 },
  submitBtnText: { fontSize: 16, fontWeight: '700' as const, color: Colors.dark.background },
  notesTabRow: { flexDirection: 'row' as const, gap: 8, marginBottom: 16 },
  notesTab: {
    flex: 1, paddingVertical: 10, borderRadius: 10, backgroundColor: Colors.dark.surfaceLight,
    alignItems: 'center' as const, borderWidth: 1, borderColor: Colors.dark.border,
  },
  notesTabActive: { backgroundColor: Colors.dark.goldDim, borderColor: Colors.dark.gold },
  notesTabText: { color: Colors.dark.textSecondary, fontWeight: '600' as const, fontSize: 14 },
  notesTabTextActive: { color: Colors.dark.gold },
  notesInput: {
    backgroundColor: Colors.dark.surfaceLight, borderRadius: 12, padding: 14, fontSize: 14,
    color: Colors.dark.text, borderWidth: 1, borderColor: Colors.dark.border, flex: 1, minHeight: 200,
    textAlignVertical: 'top' as const,
  },
  tagsGrid: { flexDirection: 'row' as const, flexWrap: 'wrap' as const, gap: 8, paddingBottom: 20 },
  tagChip: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
    backgroundColor: Colors.dark.surfaceLight, borderWidth: 1, borderColor: Colors.dark.border,
  },
  tagChipText: { color: Colors.dark.textSecondary, fontSize: 13, fontWeight: '600' as const },
});

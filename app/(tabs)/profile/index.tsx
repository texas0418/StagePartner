import React, { useMemo, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Pressable,
  TextInput,
  Animated,
} from 'react-native';
import {
  User, Music, Star, BarChart3, CalendarClock, Award, Flame,
  Target, Mic, Bell, BellOff, ChevronRight, X, Check,
  Sparkles, Calendar, Zap,
} from 'lucide-react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Colors from '@/constants/colors';
import { useApp } from '@/providers/AppProvider';
import { getSongById, getShowById } from '@/mocks/shows';
import { VOCAL_RANGES } from '@/types';

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const {
    repertoire, auditions, practiceSessions, favoriteShowIds,
    totalPracticeMinutes, thisWeekSessions, currentStreak,
    settings, updateSettings,
  } = useApp();

  const [vocalRangeModal, setVocalRangeModal] = useState(false);
  const [goalModal, setGoalModal] = useState(false);
  const [goalInput, setGoalInput] = useState('');

  const stats = useMemo(() => {
    const readyCount = repertoire.filter(r => r.status === 'performance-ready').length;
    const upcomingAuditions = auditions.filter(a => a.status === 'upcoming').length;
    const bookedCount = auditions.filter(a => a.journal?.callbackStatus === 'booked').length;
    return {
      totalSongs: repertoire.length,
      readyCount,
      upcomingAuditions,
      totalSessions: practiceSessions.length,
      totalMinutes: totalPracticeMinutes,
      favoriteCount: favoriteShowIds.length,
      bookedCount,
    };
  }, [repertoire, auditions, practiceSessions, favoriteShowIds, totalPracticeMinutes]);

  const weeklyProgress = useMemo(() => {
    const goal = settings.practiceGoalPerWeek;
    const done = thisWeekSessions.length;
    return { done, goal, pct: goal > 0 ? Math.min(1, done / goal) : 0 };
  }, [thisWeekSessions, settings.practiceGoalPerWeek]);

  const recentPractice = useMemo(() => {
    return [...practiceSessions]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5);
  }, [practiceSessions]);

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  const openGoalModal = useCallback(() => {
    setGoalInput(settings.practiceGoalPerWeek.toString());
    setGoalModal(true);
  }, [settings.practiceGoalPerWeek]);

  const saveGoal = useCallback(() => {
    const val = parseInt(goalInput, 10);
    if (!isNaN(val) && val > 0 && val <= 50) {
      updateSettings({ practiceGoalPerWeek: val });
    }
    setGoalModal(false);
  }, [goalInput, updateSettings]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <View style={styles.avatar}>
            <User size={32} color={Colors.dark.gold} />
          </View>
          <Text style={styles.headerTitle}>Your Stage</Text>
          {settings.vocalRange ? (
            <TouchableOpacity style={styles.vocalBadge} onPress={() => setVocalRangeModal(true)}>
              <Mic size={12} color={Colors.dark.gold} />
              <Text style={styles.vocalBadgeText}>{settings.vocalRange}</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.setVocalBtn} onPress={() => setVocalRangeModal(true)}>
              <Mic size={14} color={Colors.dark.gold} />
              <Text style={styles.setVocalText}>Set Your Vocal Range</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.quickActionsRow}>
          <TouchableOpacity style={styles.quickActionBtn} onPress={() => router.push('/warmup' as never)}>
            <View style={[styles.quickActionIcon, { backgroundColor: '#FF6B6B22' }]}>
              <Zap size={18} color="#FF6B6B" />
            </View>
            <Text style={styles.quickActionLabel}>Warm-Up</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickActionBtn} onPress={() => router.push('/song-finder' as never)}>
            <View style={[styles.quickActionIcon, { backgroundColor: Colors.dark.gold + '22' }]}>
              <Sparkles size={18} color={Colors.dark.gold} />
            </View>
            <Text style={styles.quickActionLabel}>Song Finder</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickActionBtn} onPress={() => router.push('/calendar' as never)}>
            <View style={[styles.quickActionIcon, { backgroundColor: '#45B7D122' }]}>
              <Calendar size={18} color="#45B7D1" />
            </View>
            <Text style={styles.quickActionLabel}>Calendar</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.weeklyGoalCard}>
          <View style={styles.weeklyGoalHeader}>
            <View style={styles.weeklyGoalLeft}>
              <Target size={18} color={Colors.dark.gold} />
              <Text style={styles.weeklyGoalTitle}>Weekly Goal</Text>
            </View>
            <TouchableOpacity onPress={openGoalModal}>
              <Text style={styles.weeklyGoalEdit}>Edit</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.weeklyGoalBody}>
            <View style={styles.progressRingContainer}>
              <View style={styles.progressRingBg}>
                <View style={[styles.progressRingFill, {
                  width: `${weeklyProgress.pct * 100}%`,
                }]} />
              </View>
              <Text style={styles.progressRingText}>{weeklyProgress.done}/{weeklyProgress.goal}</Text>
            </View>
            <View style={styles.weeklyGoalStats}>
              <View style={styles.streakRow}>
                <Flame size={16} color={currentStreak > 0 ? '#FF6B35' : Colors.dark.textMuted} />
                <Text style={[styles.streakText, currentStreak > 0 && { color: '#FF6B35' }]}>
                  {currentStreak} day streak
                </Text>
              </View>
              <Text style={styles.weeklyGoalSub}>
                {weeklyProgress.done >= weeklyProgress.goal
                  ? 'Goal reached! Keep it up!'
                  : `${weeklyProgress.goal - weeklyProgress.done} more sessions this week`}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.reminderRow}>
          <Bell size={16} color={settings.reminderEnabled ? Colors.dark.gold : Colors.dark.textMuted} />
          <Text style={styles.reminderText}>Practice Reminders</Text>
          <TouchableOpacity
            style={[styles.reminderToggle, settings.reminderEnabled && styles.reminderToggleOn]}
            onPress={() => updateSettings({ reminderEnabled: !settings.reminderEnabled })}
          >
            <View style={[styles.reminderDot, settings.reminderEnabled && styles.reminderDotOn]} />
          </TouchableOpacity>
        </View>

        <View style={styles.statsGrid}>
          {[
            { icon: <Music size={18} color={Colors.dark.gold} />, value: stats.totalSongs, label: 'Songs', bg: Colors.dark.gold },
            { icon: <Award size={18} color={Colors.dark.success} />, value: stats.readyCount, label: 'Ready', bg: Colors.dark.success },
            { icon: <CalendarClock size={18} color={Colors.dark.burgundyLight} />, value: stats.upcomingAuditions, label: 'Auditions', bg: Colors.dark.burgundyLight },
            { icon: <Star size={18} color={Colors.dark.gold} />, value: stats.bookedCount, label: 'Booked', bg: Colors.dark.gold },
          ].map((s, i) => (
            <View key={i} style={styles.statCard}>
              <View style={[styles.statIcon, { backgroundColor: s.bg + '22' }]}>{s.icon}</View>
              <Text style={styles.statValue}>{s.value}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </View>
          ))}
        </View>

        <View style={styles.practiceOverview}>
          <View style={styles.practiceHeader}>
            <BarChart3 size={20} color={Colors.dark.gold} />
            <Text style={styles.practiceTitle}>Practice Stats</Text>
          </View>
          <View style={styles.practiceStats}>
            <View style={styles.practiceStat}>
              <Text style={styles.practiceStatValue}>{stats.totalSessions}</Text>
              <Text style={styles.practiceStatLabel}>Sessions</Text>
            </View>
            <View style={styles.practiceDivider} />
            <View style={styles.practiceStat}>
              <Text style={styles.practiceStatValue}>{formatDuration(stats.totalMinutes)}</Text>
              <Text style={styles.practiceStatLabel}>Total Time</Text>
            </View>
            <View style={styles.practiceDivider} />
            <View style={styles.practiceStat}>
              <Text style={styles.practiceStatValue}>{thisWeekSessions.length}</Text>
              <Text style={styles.practiceStatLabel}>This Week</Text>
            </View>
          </View>
        </View>

        {recentPractice.length > 0 && (
          <View style={styles.recentSection}>
            <Text style={styles.sectionTitle}>Recent Practice</Text>
            {recentPractice.map(session => {
              const repItem = repertoire.find(r => r.id === session.repertoireItemId);
              const songResult = repItem ? getSongById(repItem.songId) : null;
              return (
                <View key={session.id} style={styles.recentItem}>
                  <View style={styles.recentDot} />
                  <View style={styles.recentInfo}>
                    <Text style={styles.recentSong}>{songResult?.song.title ?? 'Unknown Song'}</Text>
                    <Text style={styles.recentMeta}>
                      {formatDuration(session.durationMinutes)} · {new Date(session.date).toLocaleDateString()}
                      {session.notes ? ` · ${session.notes}` : ''}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {favoriteShowIds.length > 0 && (
          <View style={styles.favSection}>
            <Text style={styles.sectionTitle}>Favorite Shows</Text>
            <View style={styles.favGrid}>
              {favoriteShowIds.map(id => {
                const show = getShowById(id);
                if (!show) return null;
                return (
                  <View key={id} style={styles.favChip}>
                    <Star size={12} color={Colors.dark.gold} fill={Colors.dark.gold} />
                    <Text style={styles.favChipText}>{show.title}</Text>
                  </View>
                );
              })}
            </View>
          </View>
        )}
      </ScrollView>

      <Modal visible={vocalRangeModal} animationType="fade" transparent onRequestClose={() => setVocalRangeModal(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setVocalRangeModal(false)}>
          <Pressable style={styles.vocalModalContent} onPress={() => {}}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Your Vocal Range</Text>
              <TouchableOpacity onPress={() => setVocalRangeModal(false)}><X size={22} color={Colors.dark.textMuted} /></TouchableOpacity>
            </View>
            <Text style={styles.vocalDesc}>Select your vocal range to filter songs in Discover that match your voice.</Text>
            <View style={styles.vocalGrid}>
              {VOCAL_RANGES.map(range => (
                <TouchableOpacity
                  key={range}
                  style={[styles.vocalOption, settings.vocalRange === range && styles.vocalOptionActive]}
                  onPress={() => { updateSettings({ vocalRange: range }); setVocalRangeModal(false); }}
                >
                  <Text style={[styles.vocalOptionText, settings.vocalRange === range && styles.vocalOptionTextActive]}>{range}</Text>
                </TouchableOpacity>
              ))}
              {settings.vocalRange && (
                <TouchableOpacity
                  style={styles.vocalClearBtn}
                  onPress={() => { updateSettings({ vocalRange: '' }); setVocalRangeModal(false); }}
                >
                  <Text style={styles.vocalClearText}>Clear Selection</Text>
                </TouchableOpacity>
              )}
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal visible={goalModal} animationType="fade" transparent onRequestClose={() => setGoalModal(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setGoalModal(false)}>
          <Pressable style={styles.goalModalContent} onPress={() => {}}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Weekly Practice Goal</Text>
              <TouchableOpacity onPress={() => setGoalModal(false)}><X size={22} color={Colors.dark.textMuted} /></TouchableOpacity>
            </View>
            <Text style={styles.goalDesc}>How many practice sessions per week?</Text>
            <TextInput
              style={styles.goalInput}
              value={goalInput}
              onChangeText={setGoalInput}
              keyboardType="number-pad"
              maxLength={2}
              placeholder="5"
              placeholderTextColor={Colors.dark.textMuted}
            />
            <TouchableOpacity style={styles.submitBtn} onPress={saveGoal}>
              <Text style={styles.submitBtnText}>Save Goal</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.dark.background },
  scrollContent: { paddingBottom: 40 },
  header: { alignItems: 'center' as const, paddingTop: 20, paddingBottom: 16 },
  avatar: {
    width: 72, height: 72, borderRadius: 36, backgroundColor: Colors.dark.surface,
    justifyContent: 'center' as const, alignItems: 'center' as const,
    borderWidth: 2, borderColor: Colors.dark.gold + '44', marginBottom: 12,
  },
  headerTitle: { fontSize: 26, fontWeight: '800' as const, color: Colors.dark.text, letterSpacing: -0.3 },
  vocalBadge: {
    flexDirection: 'row' as const, alignItems: 'center' as const, gap: 6,
    backgroundColor: Colors.dark.goldDim + '33', paddingHorizontal: 14, paddingVertical: 6,
    borderRadius: 20, marginTop: 8, borderWidth: 1, borderColor: Colors.dark.gold + '44',
  },
  vocalBadgeText: { fontSize: 13, color: Colors.dark.gold, fontWeight: '600' as const },
  setVocalBtn: {
    flexDirection: 'row' as const, alignItems: 'center' as const, gap: 6,
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, marginTop: 8,
    backgroundColor: Colors.dark.surface, borderWidth: 1, borderColor: Colors.dark.border,
  },
  setVocalText: { fontSize: 13, color: Colors.dark.gold, fontWeight: '600' as const },
  weeklyGoalCard: {
    marginHorizontal: 20, backgroundColor: Colors.dark.surface, borderRadius: 16,
    padding: 18, borderWidth: 1, borderColor: Colors.dark.border, marginBottom: 12,
  },
  weeklyGoalHeader: { flexDirection: 'row' as const, justifyContent: 'space-between' as const, alignItems: 'center' as const, marginBottom: 14 },
  weeklyGoalLeft: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: 8 },
  weeklyGoalTitle: { fontSize: 16, fontWeight: '700' as const, color: Colors.dark.text },
  weeklyGoalEdit: { fontSize: 13, color: Colors.dark.gold, fontWeight: '600' as const },
  weeklyGoalBody: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: 16 },
  progressRingContainer: { alignItems: 'center' as const, width: 80 },
  progressRingBg: { width: 80, height: 8, borderRadius: 4, backgroundColor: Colors.dark.surfaceLight, overflow: 'hidden' as const },
  progressRingFill: { height: '100%', backgroundColor: Colors.dark.gold, borderRadius: 4 },
  progressRingText: { fontSize: 14, fontWeight: '700' as const, color: Colors.dark.text, marginTop: 6 },
  weeklyGoalStats: { flex: 1 },
  streakRow: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: 6, marginBottom: 4 },
  streakText: { fontSize: 15, fontWeight: '700' as const, color: Colors.dark.textMuted },
  weeklyGoalSub: { fontSize: 12, color: Colors.dark.textSecondary },
  reminderRow: {
    marginHorizontal: 20, flexDirection: 'row' as const, alignItems: 'center' as const,
    backgroundColor: Colors.dark.surface, borderRadius: 12, padding: 14,
    borderWidth: 1, borderColor: Colors.dark.border, marginBottom: 16, gap: 10,
  },
  reminderText: { flex: 1, fontSize: 14, color: Colors.dark.text, fontWeight: '500' as const },
  reminderToggle: {
    width: 48, height: 28, borderRadius: 14, backgroundColor: Colors.dark.surfaceLight,
    justifyContent: 'center' as const, paddingHorizontal: 3,
  },
  reminderToggleOn: { backgroundColor: Colors.dark.goldDim },
  reminderDot: { width: 22, height: 22, borderRadius: 11, backgroundColor: Colors.dark.textMuted },
  reminderDotOn: { backgroundColor: Colors.dark.gold, alignSelf: 'flex-end' as const },
  statsGrid: { flexDirection: 'row' as const, paddingHorizontal: 20, gap: 10, marginBottom: 16 },
  statCard: {
    flex: 1, backgroundColor: Colors.dark.surface, borderRadius: 14, padding: 14,
    alignItems: 'center' as const, borderWidth: 1, borderColor: Colors.dark.border,
  },
  statIcon: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center' as const, alignItems: 'center' as const, marginBottom: 8 },
  statValue: { fontSize: 22, fontWeight: '800' as const, color: Colors.dark.text },
  statLabel: { fontSize: 11, color: Colors.dark.textMuted, fontWeight: '500' as const, marginTop: 2 },
  practiceOverview: {
    marginHorizontal: 20, backgroundColor: Colors.dark.surface, borderRadius: 16,
    padding: 18, borderWidth: 1, borderColor: Colors.dark.border, marginBottom: 20,
  },
  practiceHeader: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: 8, marginBottom: 16 },
  practiceTitle: { fontSize: 16, fontWeight: '700' as const, color: Colors.dark.text },
  practiceStats: { flexDirection: 'row' as const, justifyContent: 'space-between' as const },
  practiceStat: { flex: 1, alignItems: 'center' as const },
  practiceStatValue: { fontSize: 20, fontWeight: '800' as const, color: Colors.dark.gold },
  practiceStatLabel: { fontSize: 11, color: Colors.dark.textMuted, marginTop: 4, fontWeight: '500' as const },
  practiceDivider: { width: 1, backgroundColor: Colors.dark.border, marginVertical: 2 },
  sectionTitle: { fontSize: 16, fontWeight: '700' as const, color: Colors.dark.text, marginBottom: 12 },
  recentSection: { marginHorizontal: 20, marginBottom: 20 },
  recentItem: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: 12, paddingVertical: 10, borderBottomWidth: 0.5, borderBottomColor: Colors.dark.border },
  recentDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.dark.gold },
  recentInfo: { flex: 1 },
  recentSong: { fontSize: 14, fontWeight: '600' as const, color: Colors.dark.text },
  recentMeta: { fontSize: 12, color: Colors.dark.textMuted, marginTop: 2 },
  favSection: { marginHorizontal: 20 },
  favGrid: { flexDirection: 'row' as const, flexWrap: 'wrap' as const, gap: 8 },
  favChip: {
    flexDirection: 'row' as const, alignItems: 'center' as const, gap: 6,
    backgroundColor: Colors.dark.surface, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8,
    borderWidth: 1, borderColor: Colors.dark.gold + '33',
  },
  favChipText: { fontSize: 13, color: Colors.dark.text, fontWeight: '500' as const },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center' as const, alignItems: 'center' as const },
  vocalModalContent: { backgroundColor: Colors.dark.surface, borderRadius: 20, padding: 24, width: '90%', maxHeight: '80%' },
  goalModalContent: { backgroundColor: Colors.dark.surface, borderRadius: 20, padding: 24, width: '85%' },
  modalHeader: { flexDirection: 'row' as const, justifyContent: 'space-between' as const, alignItems: 'center' as const, marginBottom: 16 },
  modalTitle: { fontSize: 20, fontWeight: '700' as const, color: Colors.dark.text },
  vocalDesc: { fontSize: 13, color: Colors.dark.textSecondary, marginBottom: 16, lineHeight: 18 },
  vocalGrid: { gap: 8 },
  vocalOption: {
    paddingVertical: 14, paddingHorizontal: 18, borderRadius: 12, backgroundColor: Colors.dark.surfaceLight,
    borderWidth: 1, borderColor: Colors.dark.border,
  },
  vocalOptionActive: { backgroundColor: Colors.dark.goldDim + '44', borderColor: Colors.dark.gold },
  vocalOptionText: { fontSize: 15, color: Colors.dark.textSecondary, fontWeight: '600' as const },
  vocalOptionTextActive: { color: Colors.dark.gold },
  vocalClearBtn: { paddingVertical: 12, alignItems: 'center' as const, marginTop: 4 },
  vocalClearText: { fontSize: 14, color: Colors.dark.danger, fontWeight: '600' as const },
  goalDesc: { fontSize: 14, color: Colors.dark.textSecondary, marginBottom: 16 },
  goalInput: {
    backgroundColor: Colors.dark.surfaceLight, borderRadius: 14, padding: 16, fontSize: 28,
    color: Colors.dark.text, borderWidth: 1, borderColor: Colors.dark.border, textAlign: 'center' as const,
    fontWeight: '800' as const, marginBottom: 8,
  },
  quickActionsRow: {
    flexDirection: 'row' as const, paddingHorizontal: 20, gap: 10, marginBottom: 16,
  },
  quickActionBtn: {
    flex: 1, backgroundColor: Colors.dark.surface, borderRadius: 14, padding: 14,
    alignItems: 'center' as const, borderWidth: 1, borderColor: Colors.dark.border, gap: 8,
  },
  quickActionIcon: {
    width: 40, height: 40, borderRadius: 20,
    justifyContent: 'center' as const, alignItems: 'center' as const,
  },
  quickActionLabel: { fontSize: 12, fontWeight: '600' as const, color: Colors.dark.text },
  submitBtn: { backgroundColor: Colors.dark.gold, borderRadius: 14, paddingVertical: 16, alignItems: 'center' as const, marginTop: 16 },
  submitBtnText: { fontSize: 16, fontWeight: '700' as const, color: Colors.dark.background },
});

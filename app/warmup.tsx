import React, { useState, useEffect, useRef, useCallback } from 'react';
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
import { ArrowLeft, Play, Pause, SkipForward, RotateCcw, Check, Timer, ChevronRight } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Colors from '@/constants/colors';
import { WARM_UP_ROUTINES, CATEGORY_INFO, WarmUpRoutine, WarmUpExercise } from '@/mocks/warmups';

const { width } = Dimensions.get('window');

export default function WarmUpScreen() {
  const insets = useSafeAreaInsets();
  const [activeRoutine, setActiveRoutine] = useState<WarmUpRoutine | null>(null);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [completedExercises, setCompletedExercises] = useState<Set<string>>(new Set());
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const progressAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const currentExercise = activeRoutine?.exercises[currentExerciseIndex] ?? null;
  const totalExercises = activeRoutine?.exercises.length ?? 0;

  useEffect(() => {
    if (isRunning && secondsLeft > 0) {
      timerRef.current = setInterval(() => {
        setSecondsLeft(prev => {
          if (prev <= 1) {
            setIsRunning(false);
            if (currentExercise) {
              setCompletedExercises(prev => new Set([...prev, currentExercise.id]));
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.05, duration: 1000, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
        ])
      ).start();
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
      pulseAnim.setValue(1);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning, secondsLeft]);

  useEffect(() => {
    if (currentExercise) {
      const total = currentExercise.durationSeconds;
      const elapsed = total - secondsLeft;
      const pct = total > 0 ? elapsed / total : 0;
      Animated.timing(progressAnim, {
        toValue: pct,
        duration: 300,
        useNativeDriver: false,
      }).start();
    }
  }, [secondsLeft, currentExercise]);

  const startRoutine = useCallback((routine: WarmUpRoutine) => {
    setActiveRoutine(routine);
    setCurrentExerciseIndex(0);
    setSecondsLeft(routine.exercises[0]?.durationSeconds ?? 0);
    setIsRunning(false);
    setCompletedExercises(new Set());
    progressAnim.setValue(0);
  }, []);

  const nextExercise = useCallback(() => {
    if (!activeRoutine) return;
    if (currentExercise) {
      setCompletedExercises(prev => new Set([...prev, currentExercise.id]));
    }
    setIsRunning(false);
    if (currentExerciseIndex < totalExercises - 1) {
      const nextIdx = currentExerciseIndex + 1;
      setCurrentExerciseIndex(nextIdx);
      setSecondsLeft(activeRoutine.exercises[nextIdx]?.durationSeconds ?? 0);
      progressAnim.setValue(0);
    } else {
      setActiveRoutine(null);
    }
  }, [activeRoutine, currentExerciseIndex, totalExercises, currentExercise]);

  const resetTimer = useCallback(() => {
    setIsRunning(false);
    if (currentExercise) {
      setSecondsLeft(currentExercise.durationSeconds);
      progressAnim.setValue(0);
    }
  }, [currentExercise]);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const exitRoutine = useCallback(() => {
    setIsRunning(false);
    setActiveRoutine(null);
  }, []);

  if (activeRoutine && currentExercise) {
    const catInfo = CATEGORY_INFO[currentExercise.category] ?? { label: 'Exercise', color: Colors.dark.textMuted, emoji: '🎵' };
    const isComplete = secondsLeft === 0 && completedExercises.has(currentExercise.id);
    const isLastExercise = currentExerciseIndex === totalExercises - 1;
    const routineProgress = completedExercises.size / totalExercises;

    return (
      <View style={styles.container}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={[styles.activeHeader, { paddingTop: insets.top + 8 }]}>
          <TouchableOpacity onPress={exitRoutine} style={styles.backBtn}>
            <ArrowLeft size={22} color={Colors.dark.text} />
          </TouchableOpacity>
          <View style={styles.activeHeaderCenter}>
            <Text style={styles.activeRoutineName} numberOfLines={1}>{activeRoutine.name}</Text>
            <Text style={styles.exerciseProgress}>{currentExerciseIndex + 1} of {totalExercises}</Text>
          </View>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.routineProgressBar}>
          <View style={[styles.routineProgressFill, { width: `${routineProgress * 100}%` }]} />
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.activeContent}>
          <View style={[styles.categoryBadge, { backgroundColor: catInfo.color + '22' }]}>
            <Text style={styles.categoryEmoji}>{catInfo.emoji}</Text>
            <Text style={[styles.categoryLabel, { color: catInfo.color }]}>{catInfo.label}</Text>
          </View>

          <Text style={styles.exerciseName}>{currentExercise.name}</Text>
          <Text style={styles.exerciseDesc}>{currentExercise.description}</Text>

          <Animated.View style={[styles.timerCircle, { transform: [{ scale: isRunning ? pulseAnim : 1 }] }]}>
            {isComplete ? (
              <View style={styles.completedCheck}>
                <Check size={48} color={Colors.dark.success} />
              </View>
            ) : (
              <>
                <Text style={styles.timerText}>{formatTime(secondsLeft)}</Text>
                <Text style={styles.timerSubtext}>
                  {isRunning ? 'In Progress' : secondsLeft === currentExercise.durationSeconds ? 'Ready' : 'Paused'}
                </Text>
              </>
            )}
          </Animated.View>

          <View style={styles.timerProgressContainer}>
            <Animated.View
              style={[
                styles.timerProgressFill,
                {
                  width: progressAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0%', '100%'],
                  }),
                },
              ]}
            />
          </View>

          <View style={styles.controlsRow}>
            <TouchableOpacity style={styles.controlBtn} onPress={resetTimer}>
              <RotateCcw size={20} color={Colors.dark.textSecondary} />
            </TouchableOpacity>
            {!isComplete ? (
              <TouchableOpacity
                style={[styles.playBtn, isRunning && styles.pauseBtn]}
                onPress={() => setIsRunning(!isRunning)}
              >
                {isRunning ? (
                  <Pause size={30} color={Colors.dark.gold} />
                ) : (
                  <Play size={30} color={Colors.dark.background} fill={Colors.dark.background} />
                )}
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={styles.nextBtn} onPress={nextExercise}>
                {isLastExercise ? (
                  <Text style={styles.nextBtnText}>Finish</Text>
                ) : (
                  <>
                    <Text style={styles.nextBtnText}>Next</Text>
                    <SkipForward size={18} color={Colors.dark.background} />
                  </>
                )}
              </TouchableOpacity>
            )}
            <TouchableOpacity style={styles.controlBtn} onPress={nextExercise}>
              <SkipForward size={20} color={Colors.dark.textSecondary} />
            </TouchableOpacity>
          </View>

          <View style={styles.instructionsCard}>
            <Text style={styles.instructionsTitle}>Instructions</Text>
            {currentExercise.instructions.map((step, i) => (
              <View key={i} style={styles.instructionRow}>
                <View style={styles.instructionBullet}>
                  <Text style={styles.instructionNum}>{i + 1}</Text>
                </View>
                <Text style={styles.instructionText}>{step}</Text>
              </View>
            ))}
          </View>

          <View style={styles.upNextSection}>
            <Text style={styles.upNextTitle}>
              {isLastExercise ? 'Last Exercise!' : 'Up Next'}
            </Text>
            {!isLastExercise && activeRoutine.exercises[currentExerciseIndex + 1] && (
              <View style={styles.upNextCard}>
                <Text style={styles.upNextEmoji}>
                  {CATEGORY_INFO[activeRoutine.exercises[currentExerciseIndex + 1].category]?.emoji ?? '🎵'}
                </Text>
                <View style={styles.upNextInfo}>
                  <Text style={styles.upNextName}>{activeRoutine.exercises[currentExerciseIndex + 1].name}</Text>
                  <Text style={styles.upNextDur}>{formatTime(activeRoutine.exercises[currentExerciseIndex + 1].durationSeconds)}</Text>
                </View>
              </View>
            )}
          </View>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft size={22} color={Colors.dark.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Warm-Ups</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <Text style={styles.heroEmoji}>🎭</Text>
        <Text style={styles.heroTitle}>Warm Up Your Instrument</Text>
        <Text style={styles.heroSubtitle}>
          Guided routines for voice, body, and diction. Choose a routine and follow along.
        </Text>

        {WARM_UP_ROUTINES.map(routine => (
          <TouchableOpacity
            key={routine.id}
            style={styles.routineCard}
            onPress={() => startRoutine(routine)}
            activeOpacity={0.8}
          >
            <View style={styles.routineCardLeft}>
              <Text style={styles.routineEmoji}>{routine.emoji}</Text>
              <View style={styles.routineInfo}>
                <Text style={styles.routineName}>{routine.name}</Text>
                <Text style={styles.routineDesc}>{routine.description}</Text>
                <View style={styles.routineMeta}>
                  <Timer size={12} color={Colors.dark.textMuted} />
                  <Text style={styles.routineDur}>{routine.durationMinutes} min</Text>
                  <Text style={styles.routineDot}>·</Text>
                  <Text style={styles.routineExCount}>{routine.exercises.length} exercises</Text>
                </View>
                <View style={styles.routineCategoryRow}>
                  {[...new Set(routine.exercises.map(e => e.category))].map(cat => {
                    const info = CATEGORY_INFO[cat];
                    return info ? (
                      <View key={cat} style={[styles.routineCatBadge, { backgroundColor: info.color + '18' }]}>
                        <Text style={styles.routineCatEmoji}>{info.emoji}</Text>
                        <Text style={[styles.routineCatLabel, { color: info.color }]}>{info.label}</Text>
                      </View>
                    ) : null;
                  })}
                </View>
              </View>
            </View>
            <ChevronRight size={20} color={Colors.dark.textMuted} />
          </TouchableOpacity>
        ))}
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
  heroSubtitle: { fontSize: 14, color: Colors.dark.textSecondary, textAlign: 'center' as const, marginTop: 8, marginBottom: 28, lineHeight: 20, paddingHorizontal: 20 },
  routineCard: {
    backgroundColor: Colors.dark.surface, borderRadius: 16, padding: 18,
    borderWidth: 1, borderColor: Colors.dark.border, marginBottom: 14,
    flexDirection: 'row' as const, alignItems: 'center' as const,
  },
  routineCardLeft: { flex: 1, flexDirection: 'row' as const, gap: 14 },
  routineEmoji: { fontSize: 36, marginTop: 2 },
  routineInfo: { flex: 1 },
  routineName: { fontSize: 17, fontWeight: '700' as const, color: Colors.dark.text, marginBottom: 4 },
  routineDesc: { fontSize: 13, color: Colors.dark.textSecondary, lineHeight: 18, marginBottom: 8 },
  routineMeta: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: 5, marginBottom: 8 },
  routineDur: { fontSize: 12, color: Colors.dark.textMuted, fontWeight: '600' as const },
  routineDot: { color: Colors.dark.textMuted, fontSize: 12 },
  routineExCount: { fontSize: 12, color: Colors.dark.textMuted },
  routineCategoryRow: { flexDirection: 'row' as const, flexWrap: 'wrap' as const, gap: 6 },
  routineCatBadge: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  routineCatEmoji: { fontSize: 10 },
  routineCatLabel: { fontSize: 10, fontWeight: '600' as const },
  activeHeader: {
    flexDirection: 'row' as const, alignItems: 'center' as const,
    paddingHorizontal: 16, paddingBottom: 12, gap: 12,
  },
  activeHeaderCenter: { flex: 1, alignItems: 'center' as const },
  activeRoutineName: { fontSize: 16, fontWeight: '700' as const, color: Colors.dark.text },
  exerciseProgress: { fontSize: 12, color: Colors.dark.textMuted, marginTop: 2 },
  routineProgressBar: { height: 3, backgroundColor: Colors.dark.surfaceLight, marginHorizontal: 20 },
  routineProgressFill: { height: '100%', backgroundColor: Colors.dark.gold, borderRadius: 2 },
  activeContent: { padding: 20, paddingBottom: 40, alignItems: 'center' as const },
  categoryBadge: {
    flexDirection: 'row' as const, alignItems: 'center' as const, gap: 6,
    paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, marginBottom: 16,
  },
  categoryEmoji: { fontSize: 14 },
  categoryLabel: { fontSize: 13, fontWeight: '700' as const },
  exerciseName: { fontSize: 24, fontWeight: '800' as const, color: Colors.dark.text, textAlign: 'center' as const, marginBottom: 6 },
  exerciseDesc: { fontSize: 14, color: Colors.dark.textSecondary, textAlign: 'center' as const, marginBottom: 28 },
  timerCircle: {
    width: 200, height: 200, borderRadius: 100,
    borderWidth: 4, borderColor: Colors.dark.gold,
    justifyContent: 'center' as const, alignItems: 'center' as const,
    backgroundColor: Colors.dark.surface, marginBottom: 16,
  },
  completedCheck: { alignItems: 'center' as const },
  timerText: { fontSize: 52, fontWeight: '800' as const, color: Colors.dark.text, fontVariant: ['tabular-nums'] },
  timerSubtext: { fontSize: 13, color: Colors.dark.textMuted, marginTop: 2 },
  timerProgressContainer: { width: '100%', height: 4, backgroundColor: Colors.dark.surfaceLight, borderRadius: 2, marginBottom: 24 },
  timerProgressFill: { height: '100%', backgroundColor: Colors.dark.gold, borderRadius: 2 },
  controlsRow: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: 24, marginBottom: 32 },
  controlBtn: {
    width: 48, height: 48, borderRadius: 24, backgroundColor: Colors.dark.surfaceLight,
    justifyContent: 'center' as const, alignItems: 'center' as const,
  },
  playBtn: {
    width: 72, height: 72, borderRadius: 36, backgroundColor: Colors.dark.gold,
    justifyContent: 'center' as const, alignItems: 'center' as const, paddingLeft: 4,
  },
  pauseBtn: {
    backgroundColor: Colors.dark.surfaceLight, borderWidth: 2, borderColor: Colors.dark.gold, paddingLeft: 0,
  },
  nextBtn: {
    flexDirection: 'row' as const, alignItems: 'center' as const, gap: 6,
    backgroundColor: Colors.dark.gold, paddingHorizontal: 28, paddingVertical: 18, borderRadius: 36,
  },
  nextBtnText: { fontSize: 16, fontWeight: '700' as const, color: Colors.dark.background },
  instructionsCard: {
    width: '100%', backgroundColor: Colors.dark.surface, borderRadius: 16,
    padding: 18, borderWidth: 1, borderColor: Colors.dark.border, marginBottom: 20,
  },
  instructionsTitle: { fontSize: 16, fontWeight: '700' as const, color: Colors.dark.text, marginBottom: 14 },
  instructionRow: { flexDirection: 'row' as const, gap: 12, marginBottom: 12, alignItems: 'flex-start' as const },
  instructionBullet: {
    width: 24, height: 24, borderRadius: 12, backgroundColor: Colors.dark.goldDim + '33',
    justifyContent: 'center' as const, alignItems: 'center' as const, marginTop: 1,
  },
  instructionNum: { fontSize: 11, fontWeight: '700' as const, color: Colors.dark.gold },
  instructionText: { flex: 1, fontSize: 14, color: Colors.dark.textSecondary, lineHeight: 20 },
  upNextSection: { width: '100%' },
  upNextTitle: { fontSize: 14, fontWeight: '700' as const, color: Colors.dark.textMuted, marginBottom: 10 },
  upNextCard: {
    flexDirection: 'row' as const, alignItems: 'center' as const, gap: 12,
    backgroundColor: Colors.dark.surfaceLight, borderRadius: 12, padding: 14,
  },
  upNextEmoji: { fontSize: 24 },
  upNextInfo: { flex: 1 },
  upNextName: { fontSize: 14, fontWeight: '600' as const, color: Colors.dark.text },
  upNextDur: { fontSize: 12, color: Colors.dark.textMuted, marginTop: 2 },
});

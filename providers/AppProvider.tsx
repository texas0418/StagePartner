import createContextHook from '@nkzw/create-context-hook';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Audition, AuditionChecklistItem, AuditionJournalEntry, PracticeSession, RepertoireItem, SongTag, UserSettings } from '@/types';

const REPERTOIRE_KEY = 'musical_theater_repertoire';
const AUDITIONS_KEY = 'musical_theater_auditions';
const PRACTICE_KEY = 'musical_theater_practice';
const FAVORITES_KEY = 'musical_theater_favorites';
const SETTINGS_KEY = 'musical_theater_settings';

const DEFAULT_SETTINGS: UserSettings = {
  vocalRange: '',
  practiceGoalPerWeek: 5,
  reminderEnabled: false,
  reminderTime: '18:00',
};

export const [AppProvider, useApp] = createContextHook(() => {
  const queryClient = useQueryClient();
  const [repertoire, setRepertoire] = useState<RepertoireItem[]>([]);
  const [auditions, setAuditions] = useState<Audition[]>([]);
  const [practiceSessions, setPracticeSessions] = useState<PracticeSession[]>([]);
  const [favoriteShowIds, setFavoriteShowIds] = useState<string[]>([]);
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS);

  const repertoireQuery = useQuery({
    queryKey: ['repertoire'],
    queryFn: async () => {
      const stored = await AsyncStorage.getItem(REPERTOIRE_KEY);
      if (!stored) return [];
      const parsed = JSON.parse(stored) as RepertoireItem[];
      return parsed.map(r => ({ ...r, tags: r.tags ?? [], lyrics: r.lyrics ?? '' }));
    },
  });

  const auditionsQuery = useQuery({
    queryKey: ['auditions'],
    queryFn: async () => {
      const stored = await AsyncStorage.getItem(AUDITIONS_KEY);
      return stored ? JSON.parse(stored) as Audition[] : [];
    },
  });

  const practiceQuery = useQuery({
    queryKey: ['practice'],
    queryFn: async () => {
      const stored = await AsyncStorage.getItem(PRACTICE_KEY);
      return stored ? JSON.parse(stored) as PracticeSession[] : [];
    },
  });

  const favoritesQuery = useQuery({
    queryKey: ['favorites'],
    queryFn: async () => {
      const stored = await AsyncStorage.getItem(FAVORITES_KEY);
      return stored ? JSON.parse(stored) as string[] : [];
    },
  });

  const settingsQuery = useQuery({
    queryKey: ['settings'],
    queryFn: async () => {
      const stored = await AsyncStorage.getItem(SETTINGS_KEY);
      return stored ? { ...DEFAULT_SETTINGS, ...JSON.parse(stored) } as UserSettings : DEFAULT_SETTINGS;
    },
  });

  useEffect(() => {
    if (repertoireQuery.data) setRepertoire(repertoireQuery.data);
  }, [repertoireQuery.data]);

  useEffect(() => {
    if (auditionsQuery.data) setAuditions(auditionsQuery.data);
  }, [auditionsQuery.data]);

  useEffect(() => {
    if (practiceQuery.data) setPracticeSessions(practiceQuery.data);
  }, [practiceQuery.data]);

  useEffect(() => {
    if (favoritesQuery.data) setFavoriteShowIds(favoritesQuery.data);
  }, [favoritesQuery.data]);

  useEffect(() => {
    if (settingsQuery.data) setSettings(settingsQuery.data);
  }, [settingsQuery.data]);

  const saveRepertoire = useMutation({
    mutationFn: async (items: RepertoireItem[]) => {
      await AsyncStorage.setItem(REPERTOIRE_KEY, JSON.stringify(items));
      return items;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['repertoire'] }),
  });

  const saveAuditions = useMutation({
    mutationFn: async (items: Audition[]) => {
      await AsyncStorage.setItem(AUDITIONS_KEY, JSON.stringify(items));
      return items;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['auditions'] }),
  });

  const savePractice = useMutation({
    mutationFn: async (items: PracticeSession[]) => {
      await AsyncStorage.setItem(PRACTICE_KEY, JSON.stringify(items));
      return items;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['practice'] }),
  });

  const saveFavorites = useMutation({
    mutationFn: async (ids: string[]) => {
      await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(ids));
      return ids;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['favorites'] }),
  });

  const saveSettings = useMutation({
    mutationFn: async (s: UserSettings) => {
      await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(s));
      return s;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['settings'] }),
  });

  const addToRepertoire = useCallback((item: RepertoireItem) => {
    const updated = [...repertoire, item];
    setRepertoire(updated);
    saveRepertoire.mutate(updated);
  }, [repertoire]);

  const removeFromRepertoire = useCallback((id: string) => {
    const updated = repertoire.filter(r => r.id !== id);
    setRepertoire(updated);
    saveRepertoire.mutate(updated);
  }, [repertoire]);

  const updateRepertoireItem = useCallback((id: string, updates: Partial<RepertoireItem>) => {
    const updated = repertoire.map(r => r.id === id ? { ...r, ...updates } : r);
    setRepertoire(updated);
    saveRepertoire.mutate(updated);
  }, [repertoire]);

  const toggleTag = useCallback((itemId: string, tag: SongTag) => {
    const item = repertoire.find(r => r.id === itemId);
    if (!item) return;
    const tags = item.tags.includes(tag)
      ? item.tags.filter(t => t !== tag)
      : [...item.tags, tag];
    updateRepertoireItem(itemId, { tags });
  }, [repertoire, updateRepertoireItem]);

  const addAudition = useCallback((audition: Audition) => {
    const updated = [...auditions, audition];
    setAuditions(updated);
    saveAuditions.mutate(updated);
  }, [auditions]);

  const updateAudition = useCallback((id: string, updates: Partial<Audition>) => {
    const updated = auditions.map(a => a.id === id ? { ...a, ...updates } : a);
    setAuditions(updated);
    saveAuditions.mutate(updated);
  }, [auditions]);

  const removeAudition = useCallback((id: string) => {
    const updated = auditions.filter(a => a.id !== id);
    setAuditions(updated);
    saveAuditions.mutate(updated);
  }, [auditions]);

  const toggleChecklistItem = useCallback((auditionId: string, itemId: string) => {
    const updated = auditions.map(a => {
      if (a.id !== auditionId) return a;
      return {
        ...a,
        checklist: a.checklist.map((c: AuditionChecklistItem) =>
          c.id === itemId ? { ...c, completed: !c.completed } : c
        ),
      };
    });
    setAuditions(updated);
    saveAuditions.mutate(updated);
  }, [auditions]);

  const addJournalEntry = useCallback((auditionId: string, journal: AuditionJournalEntry) => {
    const updated = auditions.map(a => a.id === auditionId ? { ...a, journal } : a);
    setAuditions(updated);
    saveAuditions.mutate(updated);
  }, [auditions]);

  const addPracticeSession = useCallback((session: PracticeSession) => {
    const updated = [...practiceSessions, session];
    setPracticeSessions(updated);
    savePractice.mutate(updated);
    const repItem = repertoire.find(r => r.id === session.repertoireItemId);
    if (repItem) {
      updateRepertoireItem(session.repertoireItemId, {
        practiceCount: repItem.practiceCount + 1,
        lastPracticed: session.date,
      });
    }
  }, [practiceSessions, repertoire, updateRepertoireItem]);

  const toggleFavorite = useCallback((showId: string) => {
    const updated = favoriteShowIds.includes(showId)
      ? favoriteShowIds.filter(id => id !== showId)
      : [...favoriteShowIds, showId];
    setFavoriteShowIds(updated);
    saveFavorites.mutate(updated);
  }, [favoriteShowIds]);

  const isFavorite = useCallback((showId: string) => {
    return favoriteShowIds.includes(showId);
  }, [favoriteShowIds]);

  const isInRepertoire = useCallback((songId: string) => {
    return repertoire.some(r => r.songId === songId);
  }, [repertoire]);

  const updateSettings = useCallback((updates: Partial<UserSettings>) => {
    const updated = { ...settings, ...updates };
    setSettings(updated);
    saveSettings.mutate(updated);
  }, [settings]);

  const totalPracticeMinutes = useMemo(() => {
    return practiceSessions.reduce((sum, s) => sum + s.durationMinutes, 0);
  }, [practiceSessions]);

  const thisWeekSessions = useMemo(() => {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return practiceSessions.filter(s => new Date(s.date) > weekAgo);
  }, [practiceSessions]);

  const currentStreak = useMemo(() => {
    if (practiceSessions.length === 0) return 0;
    const dates = [...new Set(practiceSessions.map(s =>
      new Date(s.date).toISOString().split('T')[0]
    ))].sort().reverse();
    let streak = 0;
    const today = new Date();
    for (let i = 0; i < dates.length; i++) {
      const checkDate = new Date(today);
      checkDate.setDate(checkDate.getDate() - i);
      const checkStr = checkDate.toISOString().split('T')[0];
      if (dates.includes(checkStr)) {
        streak++;
      } else if (i === 0) {
        continue;
      } else {
        break;
      }
    }
    return streak;
  }, [practiceSessions]);

  const isLoading = repertoireQuery.isLoading || auditionsQuery.isLoading || practiceQuery.isLoading;

  return {
    repertoire,
    auditions,
    practiceSessions,
    favoriteShowIds,
    settings,
    isLoading,
    totalPracticeMinutes,
    thisWeekSessions,
    currentStreak,
    addToRepertoire,
    removeFromRepertoire,
    updateRepertoireItem,
    toggleTag,
    addAudition,
    updateAudition,
    removeAudition,
    toggleChecklistItem,
    addJournalEntry,
    addPracticeSession,
    toggleFavorite,
    isFavorite,
    isInRepertoire,
    updateSettings,
  };
});

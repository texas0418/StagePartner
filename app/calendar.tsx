import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { Stack, router } from 'expo-router';
import {
  ArrowLeft, ChevronLeft, ChevronRight, CalendarDays,
  Music, CalendarClock, MapPin, Circle,
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Colors from '@/constants/colors';
import { useApp } from '@/providers/AppProvider';
import { getSongById } from '@/mocks/shows';

const { width } = Dimensions.get('window');
const DAY_SIZE = Math.floor((width - 40 - 12) / 7);

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function getDateStr(date: Date): string {
  return date.toISOString().split('T')[0] ?? '';
}

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 1).getDay();
}

interface CalendarEvent {
  type: 'audition' | 'practice';
  title: string;
  subtitle: string;
  color: string;
  date: string;
  id: string;
}

export default function CalendarScreen() {
  const insets = useSafeAreaInsets();
  const { auditions, practiceSessions, repertoire } = useApp();

  const today = new Date();
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState<string>(getDateStr(today));

  const eventsByDate = useMemo(() => {
    const map: Record<string, CalendarEvent[]> = {};

    for (const audition of auditions) {
      const dateStr = audition.date.split('T')[0] ?? '';
      if (!map[dateStr]) map[dateStr] = [];
      map[dateStr].push({
        type: 'audition',
        title: audition.showTitle,
        subtitle: `${audition.role}${audition.location ? ` · ${audition.location}` : ''}`,
        color: Colors.dark.burgundyLight,
        date: dateStr,
        id: audition.id,
      });
    }

    for (const session of practiceSessions) {
      const dateStr = session.date.split('T')[0] ?? '';
      if (!map[dateStr]) map[dateStr] = [];
      const repItem = repertoire.find(r => r.id === session.repertoireItemId);
      const songResult = repItem ? getSongById(repItem.songId) : null;
      map[dateStr].push({
        type: 'practice',
        title: songResult?.song.title ?? 'Practice Session',
        subtitle: `${session.durationMinutes} min${session.notes ? ` · ${session.notes}` : ''}`,
        color: Colors.dark.gold,
        date: dateStr,
        id: session.id,
      });
    }

    return map;
  }, [auditions, practiceSessions, repertoire]);

  const selectedEvents = useMemo(() => {
    return eventsByDate[selectedDate] ?? [];
  }, [eventsByDate, selectedDate]);

  const calendarDays = useMemo(() => {
    const daysInMonth = getDaysInMonth(currentYear, currentMonth);
    const firstDay = getFirstDayOfMonth(currentYear, currentMonth);
    const days: Array<{ day: number; dateStr: string; isCurrentMonth: boolean; isToday: boolean }> = [];

    const prevMonthDays = getDaysInMonth(
      currentMonth === 0 ? currentYear - 1 : currentYear,
      currentMonth === 0 ? 11 : currentMonth - 1
    );
    for (let i = firstDay - 1; i >= 0; i--) {
      const d = prevMonthDays - i;
      const m = currentMonth === 0 ? 11 : currentMonth - 1;
      const y = currentMonth === 0 ? currentYear - 1 : currentYear;
      days.push({
        day: d,
        dateStr: `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`,
        isCurrentMonth: false,
        isToday: false,
      });
    }

    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      days.push({
        day: d,
        dateStr,
        isCurrentMonth: true,
        isToday: dateStr === getDateStr(today),
      });
    }

    const remaining = 7 - (days.length % 7);
    if (remaining < 7) {
      for (let d = 1; d <= remaining; d++) {
        const m = currentMonth === 11 ? 0 : currentMonth + 1;
        const y = currentMonth === 11 ? currentYear + 1 : currentYear;
        days.push({
          day: d,
          dateStr: `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`,
          isCurrentMonth: false,
          isToday: false,
        });
      }
    }

    return days;
  }, [currentYear, currentMonth]);

  const goToPrevMonth = useCallback(() => {
    if (currentMonth === 0) {
      setCurrentYear(y => y - 1);
      setCurrentMonth(11);
    } else {
      setCurrentMonth(m => m - 1);
    }
  }, [currentMonth]);

  const goToNextMonth = useCallback(() => {
    if (currentMonth === 11) {
      setCurrentYear(y => y + 1);
      setCurrentMonth(0);
    } else {
      setCurrentMonth(m => m + 1);
    }
  }, [currentMonth]);

  const goToToday = useCallback(() => {
    setCurrentYear(today.getFullYear());
    setCurrentMonth(today.getMonth());
    setSelectedDate(getDateStr(today));
  }, []);

  const formatSelectedDate = (dateStr: string) => {
    try {
      const [y, m, d] = dateStr.split('-').map(Number);
      if (y === undefined || m === undefined || d === undefined) return dateStr;
      const date = new Date(y, m - 1, d);
      return date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  const monthStats = useMemo(() => {
    let auditionCount = 0;
    let practiceCount = 0;
    const monthPrefix = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`;
    for (const [dateStr, events] of Object.entries(eventsByDate)) {
      if (dateStr.startsWith(monthPrefix)) {
        for (const e of events) {
          if (e.type === 'audition') auditionCount++;
          else practiceCount++;
        }
      }
    }
    return { auditionCount, practiceCount };
  }, [eventsByDate, currentYear, currentMonth]);

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft size={22} color={Colors.dark.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Calendar</Text>
        <TouchableOpacity onPress={goToToday} style={styles.todayBtn}>
          <Text style={styles.todayBtnText}>Today</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.monthNav}>
          <TouchableOpacity onPress={goToPrevMonth} style={styles.navArrow}>
            <ChevronLeft size={24} color={Colors.dark.text} />
          </TouchableOpacity>
          <Text style={styles.monthTitle}>{MONTHS[currentMonth]} {currentYear}</Text>
          <TouchableOpacity onPress={goToNextMonth} style={styles.navArrow}>
            <ChevronRight size={24} color={Colors.dark.text} />
          </TouchableOpacity>
        </View>

        <View style={styles.monthStatsRow}>
          <View style={styles.monthStatChip}>
            <CalendarClock size={12} color={Colors.dark.burgundyLight} />
            <Text style={styles.monthStatText}>{monthStats.auditionCount} audition{monthStats.auditionCount !== 1 ? 's' : ''}</Text>
          </View>
          <View style={styles.monthStatChip}>
            <Music size={12} color={Colors.dark.gold} />
            <Text style={styles.monthStatText}>{monthStats.practiceCount} session{monthStats.practiceCount !== 1 ? 's' : ''}</Text>
          </View>
        </View>

        <View style={styles.weekdayRow}>
          {WEEKDAYS.map(day => (
            <View key={day} style={styles.weekdayCell}>
              <Text style={styles.weekdayText}>{day}</Text>
            </View>
          ))}
        </View>

        <View style={styles.calendarGrid}>
          {calendarDays.map((dayInfo, index) => {
            const events = eventsByDate[dayInfo.dateStr] ?? [];
            const hasAudition = events.some(e => e.type === 'audition');
            const hasPractice = events.some(e => e.type === 'practice');
            const isSelected = dayInfo.dateStr === selectedDate;

            return (
              <TouchableOpacity
                key={index}
                style={[
                  styles.dayCell,
                  isSelected && styles.dayCellSelected,
                  dayInfo.isToday && !isSelected && styles.dayCellToday,
                ]}
                onPress={() => setSelectedDate(dayInfo.dateStr)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.dayText,
                    !dayInfo.isCurrentMonth && styles.dayTextOther,
                    isSelected && styles.dayTextSelected,
                    dayInfo.isToday && !isSelected && styles.dayTextToday,
                  ]}
                >
                  {dayInfo.day}
                </Text>
                <View style={styles.dotRow}>
                  {hasAudition && <View style={[styles.dot, { backgroundColor: Colors.dark.burgundyLight }]} />}
                  {hasPractice && <View style={[styles.dot, { backgroundColor: Colors.dark.gold }]} />}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.selectedSection}>
          <Text style={styles.selectedDate}>{formatSelectedDate(selectedDate)}</Text>

          {selectedEvents.length === 0 ? (
            <View style={styles.noEventsCard}>
              <CalendarDays size={28} color={Colors.dark.textMuted} />
              <Text style={styles.noEventsText}>Nothing scheduled</Text>
            </View>
          ) : (
            selectedEvents.map((event, i) => (
              <View key={`${event.id}-${i}`} style={styles.eventCard}>
                <View style={[styles.eventStripe, { backgroundColor: event.color }]} />
                <View style={styles.eventContent}>
                  <View style={styles.eventTypeRow}>
                    {event.type === 'audition' ? (
                      <CalendarClock size={13} color={event.color} />
                    ) : (
                      <Music size={13} color={event.color} />
                    )}
                    <Text style={[styles.eventTypeText, { color: event.color }]}>
                      {event.type === 'audition' ? 'Audition' : 'Practice'}
                    </Text>
                  </View>
                  <Text style={styles.eventTitle}>{event.title}</Text>
                  <Text style={styles.eventSubtitle}>{event.subtitle}</Text>
                </View>
              </View>
            ))
          )}
        </View>

        <View style={styles.legendSection}>
          <Text style={styles.legendTitle}>Legend</Text>
          <View style={styles.legendRow}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: Colors.dark.burgundyLight }]} />
              <Text style={styles.legendText}>Audition</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: Colors.dark.gold }]} />
              <Text style={styles.legendText}>Practice</Text>
            </View>
          </View>
        </View>
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
  todayBtn: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
    backgroundColor: Colors.dark.goldDim + '44', borderWidth: 1, borderColor: Colors.dark.gold + '44',
  },
  todayBtnText: { fontSize: 13, fontWeight: '700' as const, color: Colors.dark.gold },
  scrollContent: { paddingBottom: 40 },
  monthNav: {
    flexDirection: 'row' as const, alignItems: 'center' as const,
    justifyContent: 'space-between' as const, paddingHorizontal: 20, paddingVertical: 16,
  },
  navArrow: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.dark.surfaceLight,
    justifyContent: 'center' as const, alignItems: 'center' as const,
  },
  monthTitle: { fontSize: 20, fontWeight: '800' as const, color: Colors.dark.text },
  monthStatsRow: {
    flexDirection: 'row' as const, justifyContent: 'center' as const, gap: 16,
    marginBottom: 16,
  },
  monthStatChip: {
    flexDirection: 'row' as const, alignItems: 'center' as const, gap: 6,
    backgroundColor: Colors.dark.surface, paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 12, borderWidth: 1, borderColor: Colors.dark.border,
  },
  monthStatText: { fontSize: 12, color: Colors.dark.textSecondary, fontWeight: '600' as const },
  weekdayRow: {
    flexDirection: 'row' as const, paddingHorizontal: 20, marginBottom: 4,
  },
  weekdayCell: { width: DAY_SIZE, alignItems: 'center' as const, paddingVertical: 6 },
  weekdayText: { fontSize: 11, color: Colors.dark.textMuted, fontWeight: '700' as const },
  calendarGrid: {
    flexDirection: 'row' as const, flexWrap: 'wrap' as const, paddingHorizontal: 20,
    marginBottom: 20,
  },
  dayCell: {
    width: DAY_SIZE, height: DAY_SIZE + 4, alignItems: 'center' as const,
    justifyContent: 'center' as const, borderRadius: 12,
  },
  dayCellSelected: { backgroundColor: Colors.dark.gold },
  dayCellToday: { backgroundColor: Colors.dark.surfaceLight },
  dayText: { fontSize: 15, fontWeight: '600' as const, color: Colors.dark.text },
  dayTextOther: { color: Colors.dark.textMuted, opacity: 0.4 },
  dayTextSelected: { color: Colors.dark.background, fontWeight: '800' as const },
  dayTextToday: { color: Colors.dark.gold },
  dotRow: {
    flexDirection: 'row' as const, gap: 3, height: 6, alignItems: 'center' as const,
    marginTop: 1,
  },
  dot: { width: 4, height: 4, borderRadius: 2 },
  selectedSection: { paddingHorizontal: 20, marginBottom: 20 },
  selectedDate: { fontSize: 17, fontWeight: '700' as const, color: Colors.dark.text, marginBottom: 12 },
  noEventsCard: {
    backgroundColor: Colors.dark.surface, borderRadius: 14, padding: 24,
    alignItems: 'center' as const, gap: 8, borderWidth: 1, borderColor: Colors.dark.border,
  },
  noEventsText: { fontSize: 14, color: Colors.dark.textMuted },
  eventCard: {
    flexDirection: 'row' as const, backgroundColor: Colors.dark.surface,
    borderRadius: 14, overflow: 'hidden' as const, borderWidth: 1,
    borderColor: Colors.dark.border, marginBottom: 10,
  },
  eventStripe: { width: 4 },
  eventContent: { flex: 1, padding: 14 },
  eventTypeRow: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: 6, marginBottom: 4 },
  eventTypeText: { fontSize: 11, fontWeight: '700' as const, textTransform: 'uppercase' as const, letterSpacing: 0.5 },
  eventTitle: { fontSize: 16, fontWeight: '700' as const, color: Colors.dark.text, marginBottom: 2 },
  eventSubtitle: { fontSize: 13, color: Colors.dark.textSecondary },
  legendSection: { paddingHorizontal: 20 },
  legendTitle: { fontSize: 13, fontWeight: '600' as const, color: Colors.dark.textMuted, marginBottom: 8 },
  legendRow: { flexDirection: 'row' as const, gap: 20 },
  legendItem: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: 6 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontSize: 12, color: Colors.dark.textSecondary },
});

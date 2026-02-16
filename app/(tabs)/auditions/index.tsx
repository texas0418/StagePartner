import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
  Modal,
  Pressable,
} from 'react-native';
import {
  CalendarClock, Plus, MapPin, CheckSquare, Square, Trash2, X,
  BookOpen, ThumbsUp, ThumbsDown, Meh, Sparkles,
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Colors from '@/constants/colors';
import { useApp } from '@/providers/AppProvider';
import { Audition, AuditionChecklistItem, AuditionJournalEntry } from '@/types';

const DEFAULT_CHECKLIST: Omit<AuditionChecklistItem, 'id'>[] = [
  { label: 'Prepare audition song', completed: false },
  { label: 'Review sides/script', completed: false },
  { label: 'Prepare monologue', completed: false },
  { label: 'Research the show', completed: false },
  { label: 'Plan outfit', completed: false },
  { label: 'Warm up vocals', completed: false },
];

const HOW_IT_WENT_OPTIONS: { key: AuditionJournalEntry['howItWent']; label: string; color: string }[] = [
  { key: 'great', label: 'Great', color: Colors.dark.success },
  { key: 'good', label: 'Good', color: Colors.dark.gold },
  { key: 'okay', label: 'Okay', color: Colors.dark.warning },
  { key: 'rough', label: 'Rough', color: Colors.dark.danger },
];

const CALLBACK_OPTIONS: { key: AuditionJournalEntry['callbackStatus']; label: string; color: string }[] = [
  { key: 'pending', label: 'Pending', color: Colors.dark.textSecondary },
  { key: 'callback', label: 'Callback!', color: Colors.dark.gold },
  { key: 'no-callback', label: 'No Callback', color: Colors.dark.textMuted },
  { key: 'booked', label: 'Booked!', color: Colors.dark.success },
];

export default function AuditionsScreen() {
  const insets = useSafeAreaInsets();
  const { auditions, addAudition, removeAudition, toggleChecklistItem, updateAudition, addJournalEntry } = useApp();
  const [showModal, setShowModal] = useState(false);
  const [filter, setFilter] = useState<'upcoming' | 'completed' | 'all'>('upcoming');
  const [journalModal, setJournalModal] = useState(false);
  const [journalAudition, setJournalAudition] = useState<Audition | null>(null);

  const [newShow, setNewShow] = useState('');
  const [newRole, setNewRole] = useState('');
  const [newDate, setNewDate] = useState('');
  const [newLocation, setNewLocation] = useState('');
  const [newNotes, setNewNotes] = useState('');

  const [jHowItWent, setJHowItWent] = useState<AuditionJournalEntry['howItWent']>('good');
  const [jCallback, setJCallback] = useState<AuditionJournalEntry['callbackStatus']>('pending');
  const [jNotes, setJNotes] = useState('');
  const [jImprovements, setJImprovements] = useState('');

  const filtered = useMemo(() => {
    if (filter === 'all') return auditions;
    return auditions.filter(a => a.status === filter);
  }, [auditions, filter]);

  const sortedAuditions = useMemo(() => {
    return [...filtered].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [filtered]);

  const handleAdd = useCallback(() => {
    if (!newShow.trim() || !newRole.trim()) {
      Alert.alert('Missing Info', 'Please fill in at least the show and role.');
      return;
    }
    const audition: Audition = {
      id: Date.now().toString(),
      showTitle: newShow.trim(),
      role: newRole.trim(),
      date: newDate.trim() || new Date().toISOString(),
      location: newLocation.trim(),
      notes: newNotes.trim(),
      checklist: DEFAULT_CHECKLIST.map((c, i) => ({ ...c, id: `${Date.now()}-${i}` })),
      status: 'upcoming',
    };
    addAudition(audition);
    setNewShow(''); setNewRole(''); setNewDate(''); setNewLocation(''); setNewNotes('');
    setShowModal(false);
  }, [newShow, newRole, newDate, newLocation, newNotes, addAudition]);

  const handleDelete = useCallback((audition: Audition) => {
    Alert.alert('Delete Audition', `Remove "${audition.showTitle}" audition?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => removeAudition(audition.id) },
    ]);
  }, [removeAudition]);

  const handleComplete = useCallback((audition: Audition) => {
    updateAudition(audition.id, { status: audition.status === 'completed' ? 'upcoming' : 'completed' });
  }, [updateAudition]);

  const openJournal = useCallback((audition: Audition) => {
    setJournalAudition(audition);
    if (audition.journal) {
      setJHowItWent(audition.journal.howItWent);
      setJCallback(audition.journal.callbackStatus);
      setJNotes(audition.journal.notes);
      setJImprovements(audition.journal.improvements);
    } else {
      setJHowItWent('good');
      setJCallback('pending');
      setJNotes('');
      setJImprovements('');
    }
    setJournalModal(true);
  }, []);

  const saveJournal = useCallback(() => {
    if (!journalAudition) return;
    const entry: AuditionJournalEntry = {
      id: journalAudition.journal?.id ?? Date.now().toString(),
      auditionId: journalAudition.id,
      date: new Date().toISOString(),
      howItWent: jHowItWent,
      callbackStatus: jCallback,
      notes: jNotes,
      improvements: jImprovements,
    };
    addJournalEntry(journalAudition.id, entry);
    setJournalModal(false);
    Alert.alert('Journal Saved', 'Your audition notes have been saved.');
  }, [journalAudition, jHowItWent, jCallback, jNotes, jImprovements, addJournalEntry]);

  const getDaysUntil = (dateStr: string) => {
    const diff = new Date(dateStr).getTime() - Date.now();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    if (days < 0) return 'Past';
    if (days === 0) return 'Today';
    if (days === 1) return 'Tomorrow';
    return `${days} days`;
  };

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch { return dateStr; }
  };

  const renderAudition = useCallback((audition: Audition) => {
    const completedCount = audition.checklist.filter(c => c.completed).length;
    const totalCount = audition.checklist.length;
    const progress = totalCount > 0 ? completedCount / totalCount : 0;
    const isCompleted = audition.status === 'completed';

    return (
      <View key={audition.id} style={[styles.audCard, isCompleted && styles.audCardCompleted]}>
        <View style={styles.audHeader}>
          <View style={styles.audHeaderLeft}>
            <Text style={styles.audShow}>{audition.showTitle}</Text>
            <Text style={styles.audRole}>{audition.role}</Text>
          </View>
          <View style={[styles.daysBadge, getDaysUntil(audition.date) === 'Today' && styles.daysBadgeToday]}>
            <Text style={[styles.daysText, getDaysUntil(audition.date) === 'Today' && styles.daysTextToday]}>
              {getDaysUntil(audition.date)}
            </Text>
          </View>
        </View>

        <View style={styles.audMeta}>
          <CalendarClock size={13} color={Colors.dark.textMuted} />
          <Text style={styles.audMetaText}>{formatDate(audition.date)}</Text>
          {audition.location ? (
            <>
              <MapPin size={13} color={Colors.dark.textMuted} />
              <Text style={styles.audMetaText}>{audition.location}</Text>
            </>
          ) : null}
        </View>

        {audition.notes ? <Text style={styles.audNotes}>{audition.notes}</Text> : null}

        <View style={styles.progressSection}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressLabel}>Prep Checklist</Text>
            <Text style={styles.progressCount}>{completedCount}/{totalCount}</Text>
          </View>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
          </View>
        </View>

        <View style={styles.checklistSection}>
          {audition.checklist.map(item => (
            <TouchableOpacity key={item.id} style={styles.checkItem} onPress={() => toggleChecklistItem(audition.id, item.id)}>
              {item.completed ? <CheckSquare size={18} color={Colors.dark.success} /> : <Square size={18} color={Colors.dark.textMuted} />}
              <Text style={[styles.checkLabel, item.completed && styles.checkLabelDone]}>{item.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {audition.journal && (
          <View style={styles.journalPreview}>
            <BookOpen size={13} color={Colors.dark.gold} />
            <Text style={styles.journalPreviewText}>
              {HOW_IT_WENT_OPTIONS.find(o => o.key === audition.journal?.howItWent)?.label ?? ''} · {CALLBACK_OPTIONS.find(o => o.key === audition.journal?.callbackStatus)?.label ?? ''}
            </Text>
          </View>
        )}

        <View style={styles.audActions}>
          <TouchableOpacity style={[styles.actionBtn, isCompleted && styles.actionBtnDone]} onPress={() => handleComplete(audition)}>
            <Text style={[styles.actionBtnText, isCompleted && styles.actionBtnTextDone]}>
              {isCompleted ? 'Reopen' : 'Complete'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.journalBtn} onPress={() => openJournal(audition)}>
            <BookOpen size={14} color={Colors.dark.gold} />
            <Text style={styles.journalBtnText}>{audition.journal ? 'Edit Journal' : 'Add Journal'}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handleDelete(audition)}>
            <Trash2 size={18} color={Colors.dark.danger} />
          </TouchableOpacity>
        </View>
      </View>
    );
  }, [toggleChecklistItem, handleComplete, handleDelete, openJournal]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Auditions</Text>
          <Text style={styles.headerSubtitle}>{auditions.filter(a => a.status === 'upcoming').length} upcoming</Text>
        </View>
        <TouchableOpacity style={styles.addButton} onPress={() => setShowModal(true)}>
          <Plus size={20} color={Colors.dark.background} />
        </TouchableOpacity>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll} contentContainerStyle={styles.filterContent}>
        {([
          { key: 'upcoming' as const, label: 'Upcoming' },
          { key: 'completed' as const, label: 'Completed' },
          { key: 'all' as const, label: 'All' },
        ]).map(f => (
          <TouchableOpacity key={f.key} style={[styles.filterChip, filter === f.key && styles.filterChipActive]} onPress={() => setFilter(f.key)}>
            <Text style={[styles.filterText, filter === f.key && styles.filterTextActive]}>{f.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {sortedAuditions.length === 0 ? (
          <View style={styles.emptyState}>
            <CalendarClock size={48} color={Colors.dark.textMuted} />
            <Text style={styles.emptyTitle}>No auditions</Text>
            <Text style={styles.emptySubtitle}>Tap + to add your first audition</Text>
          </View>
        ) : sortedAuditions.map(renderAudition)}
      </ScrollView>

      <Modal visible={showModal} animationType="slide" transparent onRequestClose={() => setShowModal(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setShowModal(false)}>
          <Pressable style={styles.modalContent} onPress={() => {}}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>New Audition</Text>
              <TouchableOpacity onPress={() => setShowModal(false)}><X size={22} color={Colors.dark.textMuted} /></TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.inputLabel}>Show *</Text>
              <TextInput style={styles.input} placeholder="e.g. Hamilton" placeholderTextColor={Colors.dark.textMuted} value={newShow} onChangeText={setNewShow} />
              <Text style={styles.inputLabel}>Role *</Text>
              <TextInput style={styles.input} placeholder="e.g. Eliza Hamilton" placeholderTextColor={Colors.dark.textMuted} value={newRole} onChangeText={setNewRole} />
              <Text style={styles.inputLabel}>Date</Text>
              <TextInput style={styles.input} placeholder="e.g. 2026-03-15" placeholderTextColor={Colors.dark.textMuted} value={newDate} onChangeText={setNewDate} />
              <Text style={styles.inputLabel}>Location</Text>
              <TextInput style={styles.input} placeholder="e.g. Broadway Theater" placeholderTextColor={Colors.dark.textMuted} value={newLocation} onChangeText={setNewLocation} />
              <Text style={styles.inputLabel}>Notes</Text>
              <TextInput style={[styles.input, styles.inputMulti]} placeholder="Additional notes..." placeholderTextColor={Colors.dark.textMuted} value={newNotes} onChangeText={setNewNotes} multiline numberOfLines={3} />
              <TouchableOpacity style={styles.submitBtn} onPress={handleAdd}>
                <Text style={styles.submitBtnText}>Add Audition</Text>
              </TouchableOpacity>
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal visible={journalModal} animationType="slide" transparent onRequestClose={() => setJournalModal(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setJournalModal(false)}>
          <Pressable style={styles.journalModalContent} onPress={() => {}}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Audition Journal</Text>
              <TouchableOpacity onPress={() => setJournalModal(false)}><X size={22} color={Colors.dark.textMuted} /></TouchableOpacity>
            </View>
            {journalAudition && (
              <Text style={styles.journalShowName}>{journalAudition.showTitle} — {journalAudition.role}</Text>
            )}
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.inputLabel}>How did it go?</Text>
              <View style={styles.optionRow}>
                {HOW_IT_WENT_OPTIONS.map(opt => (
                  <TouchableOpacity
                    key={opt.key}
                    style={[styles.optionChip, jHowItWent === opt.key && { backgroundColor: opt.color + '33', borderColor: opt.color }]}
                    onPress={() => setJHowItWent(opt.key)}
                  >
                    <Text style={[styles.optionChipText, jHowItWent === opt.key && { color: opt.color }]}>{opt.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.inputLabel}>Callback Status</Text>
              <View style={styles.optionRow}>
                {CALLBACK_OPTIONS.map(opt => (
                  <TouchableOpacity
                    key={opt.key}
                    style={[styles.optionChip, jCallback === opt.key && { backgroundColor: opt.color + '33', borderColor: opt.color }]}
                    onPress={() => setJCallback(opt.key)}
                  >
                    <Text style={[styles.optionChipText, jCallback === opt.key && { color: opt.color }]}>{opt.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.inputLabel}>Notes</Text>
              <TextInput style={[styles.input, styles.inputMulti]} placeholder="How the audition went..." placeholderTextColor={Colors.dark.textMuted} value={jNotes} onChangeText={setJNotes} multiline />

              <Text style={styles.inputLabel}>What to improve</Text>
              <TextInput style={[styles.input, styles.inputMulti]} placeholder="Things to work on next time..." placeholderTextColor={Colors.dark.textMuted} value={jImprovements} onChangeText={setJImprovements} multiline />

              <TouchableOpacity style={styles.submitBtn} onPress={saveJournal}>
                <Text style={styles.submitBtnText}>Save Journal</Text>
              </TouchableOpacity>
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.dark.background },
  header: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 4, flexDirection: 'row' as const, justifyContent: 'space-between' as const, alignItems: 'center' as const },
  headerTitle: { fontSize: 32, fontWeight: '800' as const, color: Colors.dark.text, letterSpacing: -0.5 },
  headerSubtitle: { fontSize: 13, color: Colors.dark.textMuted, marginTop: 2 },
  addButton: { width: 42, height: 42, borderRadius: 21, backgroundColor: Colors.dark.gold, justifyContent: 'center' as const, alignItems: 'center' as const },
  filterScroll: { marginTop: 16, maxHeight: 44 },
  filterContent: { paddingHorizontal: 20, gap: 8 },
  filterChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: Colors.dark.surfaceLight, borderWidth: 1, borderColor: Colors.dark.border },
  filterChipActive: { backgroundColor: Colors.dark.goldDim, borderColor: Colors.dark.gold },
  filterText: { color: Colors.dark.textSecondary, fontSize: 13, fontWeight: '600' as const },
  filterTextActive: { color: Colors.dark.gold },
  scrollContent: { padding: 20, paddingBottom: 30, gap: 16 },
  audCard: { backgroundColor: Colors.dark.surface, borderRadius: 16, padding: 18, borderWidth: 1, borderColor: Colors.dark.border },
  audCardCompleted: { opacity: 0.7 },
  audHeader: { flexDirection: 'row' as const, justifyContent: 'space-between' as const, alignItems: 'flex-start' as const, marginBottom: 10 },
  audHeaderLeft: { flex: 1 },
  audShow: { fontSize: 18, fontWeight: '700' as const, color: Colors.dark.text, marginBottom: 2 },
  audRole: { fontSize: 14, color: Colors.dark.gold, fontWeight: '600' as const },
  daysBadge: { backgroundColor: Colors.dark.surfaceLight, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  daysBadgeToday: { backgroundColor: Colors.dark.burgundy },
  daysText: { fontSize: 12, color: Colors.dark.textSecondary, fontWeight: '700' as const },
  daysTextToday: { color: Colors.dark.text },
  audMeta: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: 6, marginBottom: 8 },
  audMetaText: { fontSize: 12, color: Colors.dark.textMuted, marginRight: 8 },
  audNotes: { fontSize: 13, color: Colors.dark.textSecondary, marginBottom: 12, fontStyle: 'italic' as const },
  progressSection: { marginBottom: 12 },
  progressHeader: { flexDirection: 'row' as const, justifyContent: 'space-between' as const, marginBottom: 6 },
  progressLabel: { fontSize: 12, color: Colors.dark.textMuted, fontWeight: '600' as const },
  progressCount: { fontSize: 12, color: Colors.dark.textSecondary, fontWeight: '600' as const },
  progressBar: { height: 4, backgroundColor: Colors.dark.surfaceLight, borderRadius: 2, overflow: 'hidden' as const },
  progressFill: { height: '100%', backgroundColor: Colors.dark.gold, borderRadius: 2 },
  checklistSection: { gap: 8, marginBottom: 14 },
  checkItem: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: 10 },
  checkLabel: { fontSize: 13, color: Colors.dark.textSecondary, flex: 1 },
  checkLabelDone: { textDecorationLine: 'line-through' as const, color: Colors.dark.textMuted },
  journalPreview: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: 6, backgroundColor: Colors.dark.goldDim + '22', borderRadius: 8, padding: 8, marginBottom: 12 },
  journalPreviewText: { fontSize: 12, color: Colors.dark.gold, fontWeight: '600' as const },
  audActions: { flexDirection: 'row' as const, justifyContent: 'space-between' as const, alignItems: 'center' as const, borderTopWidth: 0.5, borderTopColor: Colors.dark.border, paddingTop: 12, gap: 8 },
  actionBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, backgroundColor: Colors.dark.goldDim + '44' },
  actionBtnDone: { backgroundColor: Colors.dark.surfaceLight },
  actionBtnText: { fontSize: 13, fontWeight: '600' as const, color: Colors.dark.gold },
  actionBtnTextDone: { color: Colors.dark.textMuted },
  journalBtn: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: 4, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, backgroundColor: Colors.dark.surfaceLight },
  journalBtnText: { fontSize: 12, color: Colors.dark.gold, fontWeight: '600' as const },
  emptyState: { alignItems: 'center' as const, justifyContent: 'center' as const, paddingTop: 80, gap: 8 },
  emptyTitle: { fontSize: 18, fontWeight: '600' as const, color: Colors.dark.text, marginTop: 8 },
  emptySubtitle: { fontSize: 14, color: Colors.dark.textMuted, textAlign: 'center' as const },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' as const },
  modalContent: { backgroundColor: Colors.dark.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: '85%' },
  journalModalContent: { backgroundColor: Colors.dark.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: '85%' },
  modalHeader: { flexDirection: 'row' as const, justifyContent: 'space-between' as const, alignItems: 'center' as const, marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: '700' as const, color: Colors.dark.text },
  journalShowName: { fontSize: 14, color: Colors.dark.textSecondary, marginBottom: 16 },
  inputLabel: { fontSize: 13, fontWeight: '600' as const, color: Colors.dark.textSecondary, marginBottom: 6, marginTop: 12 },
  input: { backgroundColor: Colors.dark.surfaceLight, borderRadius: 12, padding: 14, fontSize: 15, color: Colors.dark.text, borderWidth: 1, borderColor: Colors.dark.border },
  inputMulti: { minHeight: 80, textAlignVertical: 'top' as const },
  optionRow: { flexDirection: 'row' as const, flexWrap: 'wrap' as const, gap: 8 },
  optionChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: Colors.dark.surfaceLight, borderWidth: 1, borderColor: Colors.dark.border },
  optionChipText: { color: Colors.dark.textSecondary, fontSize: 13, fontWeight: '600' as const },
  submitBtn: { backgroundColor: Colors.dark.gold, borderRadius: 14, paddingVertical: 16, alignItems: 'center' as const, marginTop: 24, marginBottom: 20 },
  submitBtnText: { fontSize: 16, fontWeight: '700' as const, color: Colors.dark.background },
});

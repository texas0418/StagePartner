export interface Show {
  id: string;
  title: string;
  composer: string;
  lyricist: string;
  year: number;
  genre: string;
  synopsis: string;
  imageUrl: string;
  songs: Song[];
  characters: Character[];
}

export interface Song {
  id: string;
  showId: string;
  title: string;
  character: string;
  vocalRange: string;
  type: 'solo' | 'duet' | 'ensemble' | 'monologue';
  act: number;
  lyrics?: string;
}

export interface Character {
  name: string;
  vocalRange: string;
  description: string;
}

export type SongTag = 'uptempo' | 'ballad' | 'comedic' | 'dramatic' | 'patter' | 'belt' | 'legit' | 'contemporary' | 'classic' | 'audition-ready';

export interface RepertoireItem {
  id: string;
  songId: string;
  showId: string;
  addedAt: string;
  notes: string;
  lyrics: string;
  practiceCount: number;
  lastPracticed?: string;
  status: 'learning' | 'polishing' | 'performance-ready';
  tags: SongTag[];
}

export interface PracticeSession {
  id: string;
  repertoireItemId: string;
  date: string;
  durationMinutes: number;
  notes: string;
}

export interface AuditionJournalEntry {
  id: string;
  auditionId: string;
  date: string;
  howItWent: 'great' | 'good' | 'okay' | 'rough';
  callbackStatus: 'pending' | 'callback' | 'no-callback' | 'booked';
  notes: string;
  improvements: string;
}

export interface Audition {
  id: string;
  showTitle: string;
  role: string;
  date: string;
  location: string;
  notes: string;
  checklist: AuditionChecklistItem[];
  status: 'upcoming' | 'completed' | 'cancelled';
  journal?: AuditionJournalEntry;
}

export interface AuditionChecklistItem {
  id: string;
  label: string;
  completed: boolean;
}

export interface UserSettings {
  vocalRange: string;
  practiceGoalPerWeek: number;
  reminderEnabled: boolean;
  reminderTime: string;
}

export type Genre = 'All' | 'Classic' | 'Contemporary' | 'Rock' | 'Comedy' | 'Drama' | 'Revival';

export const VOCAL_RANGES = [
  'Soprano',
  'Mezzo-Soprano',
  'Mezzo-Soprano/Belt',
  'Alto',
  'Alto/Mezzo',
  'Tenor',
  'Baritone',
  'Baritone/Tenor',
  'Bass',
  'Bass/Baritone',
] as const;

export const ALL_TAGS: SongTag[] = [
  'uptempo', 'ballad', 'comedic', 'dramatic', 'patter', 'belt', 'legit', 'contemporary', 'classic', 'audition-ready',
];

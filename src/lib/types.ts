// Type definitions for ChosenWorship application

export interface User {
  id: string;
  name: string;
  email: string;
  instruments: string[];
  roles: ('leader' | 'worship' | 'praise' | 'musical-director')[];
  defaultPreferredNote?: string;
  userSongPreferences?: UserSongPreference[];
  avatar?: string;
  phone?: string;
  emergencyContact?: string;
}

export interface UserSongPreference {
  songId: string;
  preferredNote: string;
  notes?: string;
}

export interface Song {
  id: string;
  title: string;
  artist?: string;
  originalKey: string;
  lyricsUrl?: string;
  chordsUrl?: string;
  tags?: string[];
  language?: 'en' | 'es' | 'bilingual';
  tempo?: 'slow' | 'medium' | 'fast';
  category?: 'worship' | 'praise' | 'hymn' | 'contemporary';
  duration?: number; // in minutes
  lastUsed?: string;
  usageCount?: number;
}

export interface SetlistSong {
  songId: string;
  section: 'praise' | 'worship' | 'opening' | 'closing' | 'transition';
  order: number;
  preferredKey?: string;
  notes?: string;
  transposition?: number; // semitone difference from original
}

export interface Setlist {
  id: string;
  title: string;
  date: string;
  serviceId?: string;
  songs: SetlistSong[];
  praiseLeader?: string;
  worshipLeader?: string;
  musicalDirector?: string;
  createdBy?: string;
  createdAt?: string;
  notes?: string[];
  status?: 'draft' | 'ready' | 'completed';
  estimatedDuration?: number;
}

export interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  time: string;
  location: string;
  description?: string;
  setlistId?: string;
  createdBy?: string;
  eventType?: 'service' | 'rehearsal' | 'meeting';
}

export interface RecurringService {
  id: string;
  title: string;
  dayOfWeek: number; // 0 = Sunday, 1 = Monday, etc.
  time: string; // "HH:mm" format
  location: string;
  type: string;
  setlistReminderDays: number;
  teamReminderDays: number;
  active: boolean;
  defaultDuration: number;
  requiredRoles: string[];
}

export interface SetlistNotification {
  id: string;
  type: 'setlist-reminder' | 'team-reminder' | 'service-reminder';
  serviceId: string;
  targetDate: string;
  createdAt: string;
  status: 'pending' | 'acknowledged' | 'completed';
  assignedTo: string;
  message: string;
}

export interface SetlistTemplate {
  id: string;
  name: string;
  serviceType: string;
  structure: Record<string, {
    count: number;
    type: 'praise' | 'worship';
    tempo: 'slow' | 'medium' | 'fast' | 'mixed';
  }>;
  totalSongs: number;
  estimatedDuration: number;
}

export interface UserAvailability {
  userId: string;
  unavailableFrom: string;
  unavailableTo: string;
  reason: string;
}

export interface ChosenWorshipData {
  users: User[];
  songs: Song[];
  setlists: Setlist[];
  calendarEvents: CalendarEvent[];
  recurringServices: RecurringService[];
  notifications: SetlistNotification[];
  setlistTemplates: SetlistTemplate[];
  availability: UserAvailability[];
}

// Musical theory types
export interface KeyTransposition {
  originalKey: string;
  targetKey: string;
  semitones: number;
  capoSuggestion?: number;
}

export interface MusicalScale {
  notes: string[];
  intervals: number[];
}

// Form and UI types
export interface FormError {
  field: string;
  message: string;
}

export interface ToastNotification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number;
  actions?: Array<{
    label: string;
    action: () => void;
  }>;
}

// Filter and search types
export interface SongFilter {
  search: string;
  key?: string;
  language?: 'en' | 'es' | 'bilingual' | 'all';
  category?: 'worship' | 'praise' | 'hymn' | 'contemporary' | 'all';
  tempo?: 'slow' | 'medium' | 'fast' | 'all';
  tags?: string[];
}

export interface SetlistFilter {
  status: 'all' | 'upcoming' | 'past' | 'needs-setlist' | 'draft' | 'ready';
  service?: string;
  leader?: string;
  dateRange?: {
    start: string;
    end: string;
  };
}
/**
 * Cross-compatible Database Schema for SQLite and PostgreSQL
 * Uses conditional types based on environment
 */

import { sql } from 'drizzle-orm';
import { 
  pgTable, pgEnum, uuid, varchar, text, integer, 
  timestamp, jsonb, boolean, serial
} from 'drizzle-orm/pg-core';
import { 
  sqliteTable, text as sqliteText, integer as sqliteInteger,
  blob, real
} from 'drizzle-orm/sqlite-core';

const isSqlite = process.env.DATABASE_URL?.startsWith('sqlite:') ?? false;

// Common types and enums for PostgreSQL
export const userRoleEnum = pgEnum('user_role', ['leader', 'worship', 'praise', 'musical-director']);
export const setlistSectionEnum = pgEnum('setlist_section', ['praise', 'worship', 'opening', 'closing', 'transition']);
export const setlistStatusEnum = pgEnum('setlist_status', ['draft', 'active', 'completed', 'archived']);
export const notificationTypeEnum = pgEnum('notification_type', ['setlist-reminder', 'team-reminder', 'service-reminder']);
export const notificationStatusEnum = pgEnum('notification_status', ['pending', 'sent', 'acknowledged']);
export const recurringServiceTypeEnum = pgEnum('recurring_service_type', ['worship', 'discipleship', 'prayer', 'special']);
export const calendarEventTypeEnum = pgEnum('calendar_event_type', ['service', 'rehearsal', 'meeting', 'other']);

// Universal schema - for now let's create a simplified SQLite version
export const users = sqliteTable('users', {
  id: sqliteText('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: sqliteText('name').notNull(),
  email: sqliteText('email').notNull(),
  instruments: sqliteText('instruments'), // JSON string
  roles: sqliteText('roles'), // JSON string
  defaultPreferredNote: sqliteText('default_preferred_note'),
  avatar: sqliteText('avatar'),
  phone: sqliteText('phone'),
  emergencyContact: sqliteText('emergency_contact'),
  createdAt: sqliteInteger('created_at').$defaultFn(() => Date.now()).notNull(),
  updatedAt: sqliteInteger('updated_at').$defaultFn(() => Date.now()).notNull()
});

export const songs = sqliteTable('songs', {
  id: sqliteText('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  title: sqliteText('title').notNull(),
  artist: sqliteText('artist').notNull(),
  originalKey: sqliteText('original_key').notNull(),
  lyricsUrl: sqliteText('lyrics_url'),
  chordsUrl: sqliteText('chords_url'),
  tags: sqliteText('tags'), // JSON string
  language: sqliteText('language').default('en'),
  tempo: sqliteInteger('tempo'),
  category: sqliteText('category'),
  duration: sqliteInteger('duration'), // seconds
  usageCount: sqliteInteger('usage_count').default(0),
  lastUsed: sqliteInteger('last_used'), // timestamp
  createdAt: sqliteInteger('created_at').$defaultFn(() => Date.now()).notNull(),
  updatedAt: sqliteInteger('updated_at').$defaultFn(() => Date.now()).notNull()
});

export const recurringServices = sqliteTable('recurring_services', {
  id: sqliteText('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  title: sqliteText('title').notNull(),
  dayOfWeek: sqliteInteger('day_of_week').notNull(), // 0-6 (Sunday=0)
  time: sqliteText('time').notNull(), // HH:MM format
  location: sqliteText('location'),
  type: sqliteText('type').notNull(), // worship, discipleship, etc.
  setlistReminderDays: sqliteInteger('setlist_reminder_days').default(3),
  teamReminderDays: sqliteInteger('team_reminder_days').default(1),
  active: sqliteInteger('active', { mode: 'boolean' }).default(true),
  defaultDuration: sqliteInteger('default_duration').default(90), // minutes
  requiredRoles: sqliteText('required_roles'), // JSON string
  createdAt: sqliteInteger('created_at').$defaultFn(() => Date.now()).notNull(),
  updatedAt: sqliteInteger('updated_at').$defaultFn(() => Date.now()).notNull()
});

export const setlists = sqliteTable('setlists', {
  id: sqliteText('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  title: sqliteText('title').notNull(),
  date: sqliteInteger('date').notNull(), // timestamp
  serviceId: sqliteText('service_id').references(() => recurringServices.id),
  praiseLeader: sqliteText('praise_leader').references(() => users.id),
  worshipLeader: sqliteText('worship_leader').references(() => users.id),
  musicalDirector: sqliteText('musical_director').references(() => users.id),
  status: sqliteText('status').default('draft'),
  estimatedDuration: sqliteInteger('estimated_duration'), // minutes
  notes: sqliteText('notes'), // JSON string
  createdBy: sqliteText('created_by').references(() => users.id).notNull(),
  createdAt: sqliteInteger('created_at').$defaultFn(() => Date.now()).notNull(),
  updatedAt: sqliteInteger('updated_at').$defaultFn(() => Date.now()).notNull()
});

export const setlistSongs = sqliteTable('setlist_songs', {
  id: sqliteText('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  setlistId: sqliteText('setlist_id').references(() => setlists.id).notNull(),
  songId: sqliteText('song_id').references(() => songs.id).notNull(),
  section: sqliteText('section').notNull(), // praise, worship, etc.
  order: sqliteInteger('order').notNull(),
  preferredKey: sqliteText('preferred_key'),
  transposition: sqliteInteger('transposition'), // semitone difference
  notes: sqliteText('notes'),
  createdAt: sqliteInteger('created_at').$defaultFn(() => Date.now()).notNull()
});

export const notifications = sqliteTable('notifications', {
  id: sqliteText('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  type: sqliteText('type').notNull(), // setlist-reminder, team-reminder, etc.
  serviceId: sqliteText('service_id').references(() => recurringServices.id),
  setlistId: sqliteText('setlist_id').references(() => setlists.id),
  targetDate: sqliteInteger('target_date').notNull(), // timestamp
  status: sqliteText('status').default('pending'),
  assignedTo: sqliteText('assigned_to').references(() => users.id).notNull(),
  message: sqliteText('message').notNull(),
  metadata: sqliteText('metadata'), // JSON string
  createdAt: sqliteInteger('created_at').$defaultFn(() => Date.now()).notNull(),
  updatedAt: sqliteInteger('updated_at').$defaultFn(() => Date.now()).notNull()
});

export const userSongPreferences = sqliteTable('user_song_preferences', {
  id: sqliteText('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: sqliteText('user_id').references(() => users.id).notNull(),
  songId: sqliteText('song_id').references(() => songs.id).notNull(),
  preferredNote: sqliteText('preferred_note').notNull(),
  notes: sqliteText('notes'),
  createdAt: sqliteInteger('created_at').$defaultFn(() => Date.now()).notNull(),
  updatedAt: sqliteInteger('updated_at').$defaultFn(() => Date.now()).notNull()
});

export const calendarEvents = sqliteTable('calendar_events', {
  id: sqliteText('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  title: sqliteText('title').notNull(),
  date: sqliteInteger('date').notNull(), // timestamp
  time: sqliteText('time'),
  location: sqliteText('location'),
  description: sqliteText('description'),
  setlistId: sqliteText('setlist_id').references(() => setlists.id),
  eventType: sqliteText('event_type').default('service'),
  createdBy: sqliteText('created_by').references(() => users.id).notNull(),
  createdAt: sqliteInteger('created_at').$defaultFn(() => Date.now()).notNull(),
  updatedAt: sqliteInteger('updated_at').$defaultFn(() => Date.now()).notNull()
});

export const setlistTemplates = sqliteTable('setlist_templates', {
  id: sqliteText('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: sqliteText('name').notNull(),
  serviceType: sqliteText('service_type').notNull(),
  structure: sqliteText('structure').notNull(), // JSON string
  totalSongs: sqliteInteger('total_songs').notNull(),
  praiseSongs: sqliteInteger('praise_songs').default(0),
  worshipSongs: sqliteInteger('worship_songs').default(0),
  createdBy: sqliteText('created_by').references(() => users.id).notNull(),
  createdAt: sqliteInteger('created_at').$defaultFn(() => Date.now()).notNull(),
  updatedAt: sqliteInteger('updated_at').$defaultFn(() => Date.now()).notNull()
});

export const userAvailability = sqliteTable('user_availability', {
  id: sqliteText('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: sqliteText('user_id').references(() => users.id).notNull(),
  date: sqliteInteger('date').notNull(), // timestamp
  available: sqliteInteger('available', { mode: 'boolean' }).default(true),
  notes: sqliteText('notes'),
  serviceId: sqliteText('service_id').references(() => recurringServices.id),
  createdAt: sqliteInteger('created_at').$defaultFn(() => Date.now()).notNull(),
  updatedAt: sqliteInteger('updated_at').$defaultFn(() => Date.now()).notNull()
});
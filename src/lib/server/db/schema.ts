import { 
  pgTable, 
  uuid, 
  text, 
  timestamp, 
  jsonb, 
  boolean, 
  integer,
  pgEnum,
  varchar
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Enums
export const userRoleEnum = pgEnum('user_role', ['leader', 'worship', 'praise', 'musical-director']);
export const setlistSectionEnum = pgEnum('setlist_section', ['praise', 'worship', 'opening', 'closing', 'transition']);
export const notificationTypeEnum = pgEnum('notification_type', ['setlist-reminder', 'team-reminder', 'service-reminder']);
export const notificationStatusEnum = pgEnum('notification_status', ['pending', 'acknowledged', 'completed']);
export const languageEnum = pgEnum('language', ['en', 'es', 'bilingual']);
export const tempoEnum = pgEnum('tempo', ['slow', 'medium', 'fast', 'mixed']);
export const setlistStatusEnum = pgEnum('setlist_status', ['draft', 'ready', 'completed']);

// Users table
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  instruments: jsonb('instruments').$type<string[]>().default([]),
  roles: jsonb('roles').$type<('leader' | 'worship' | 'praise' | 'musical-director')[]>().default([]),
  defaultPreferredNote: varchar('default_preferred_note', { length: 10 }),
  avatar: varchar('avatar', { length: 500 }),
  phone: varchar('phone', { length: 20 }),
  emergencyContact: varchar('emergency_contact', { length: 255 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
});

// Songs table
export const songs = pgTable('songs', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: varchar('title', { length: 255 }).notNull(),
  artist: varchar('artist', { length: 255 }),
  originalKey: varchar('original_key', { length: 10 }).notNull(),
  lyricsUrl: varchar('lyrics_url', { length: 500 }),
  chordsUrl: varchar('chords_url', { length: 500 }),
  tags: jsonb('tags').$type<string[]>().default([]),
  language: languageEnum('language').default('en'),
  tempo: tempoEnum('tempo'),
  category: varchar('category', { length: 50 }),
  duration: integer('duration'), // in minutes
  ccliNumber: varchar('ccli_number', { length: 20 }),
  notes: text('notes'),
  usageCount: integer('usage_count').default(0),
  lastUsed: timestamp('last_used'),
  addedBy: uuid('added_by').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
});

// User song preferences
export const userSongPreferences = pgTable('user_song_preferences', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  songId: uuid('song_id').references(() => songs.id).notNull(),
  preferredNote: varchar('preferred_note', { length: 10 }).notNull(),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
});

// Recurring services
export const recurringServices = pgTable('recurring_services', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: varchar('title', { length: 255 }).notNull(),
  dayOfWeek: integer('day_of_week').notNull(), // 0 = Sunday, 1 = Monday, etc.
  time: varchar('time', { length: 10 }).notNull(), // "HH:mm" format
  location: varchar('location', { length: 255 }).notNull(),
  type: varchar('type', { length: 50 }).notNull(),
  setlistReminderDays: integer('setlist_reminder_days').default(5),
  teamReminderDays: integer('team_reminder_days').default(3),
  active: boolean('active').default(true),
  defaultDuration: integer('default_duration').default(45), // minutes
  requiredRoles: jsonb('required_roles').$type<string[]>().default([]),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
});

// Setlists table
export const setlists = pgTable('setlists', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: varchar('title', { length: 255 }).notNull(),
  date: timestamp('date').notNull(),
  serviceId: uuid('service_id').references(() => recurringServices.id),
  praiseLeader: uuid('praise_leader').references(() => users.id),
  worshipLeader: uuid('worship_leader').references(() => users.id),
  musicalDirector: uuid('musical_director').references(() => users.id),
  status: setlistStatusEnum('status').default('draft'),
  estimatedDuration: integer('estimated_duration'), // minutes
  notes: jsonb('notes').$type<string[]>().default([]),
  createdBy: uuid('created_by').references(() => users.id).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
});

// Setlist songs (junction table)
export const setlistSongs = pgTable('setlist_songs', {
  id: uuid('id').primaryKey().defaultRandom(),
  setlistId: uuid('setlist_id').references(() => setlists.id).notNull(),
  songId: uuid('song_id').references(() => songs.id).notNull(),
  section: setlistSectionEnum('section').notNull(),
  order: integer('order').notNull(),
  preferredKey: varchar('preferred_key', { length: 10 }),
  transposition: integer('transposition'), // semitone difference
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull()
});

// Calendar events
export const calendarEvents = pgTable('calendar_events', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: varchar('title', { length: 255 }).notNull(),
  date: timestamp('date').notNull(),
  time: varchar('time', { length: 10 }).notNull(),
  location: varchar('location', { length: 255 }).notNull(),
  description: text('description'),
  setlistId: uuid('setlist_id').references(() => setlists.id),
  serviceId: uuid('service_id').references(() => recurringServices.id),
  eventType: varchar('event_type', { length: 50 }).default('service'),
  createdBy: uuid('created_by').references(() => users.id).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
});

// Notifications
export const notifications = pgTable('notifications', {
  id: uuid('id').primaryKey().defaultRandom(),
  type: notificationTypeEnum('type').notNull(),
  serviceId: uuid('service_id').references(() => recurringServices.id),
  setlistId: uuid('setlist_id').references(() => setlists.id),
  targetDate: timestamp('target_date').notNull(),
  status: notificationStatusEnum('status').default('pending'),
  assignedTo: uuid('assigned_to').references(() => users.id).notNull(),
  message: text('message').notNull(),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
});

// Setlist templates
export const setlistTemplates = pgTable('setlist_templates', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  serviceType: varchar('service_type', { length: 50 }).notNull(),
  structure: jsonb('structure').notNull(),
  totalSongs: integer('total_songs').notNull(),
  estimatedDuration: integer('estimated_duration').notNull(),
  createdBy: uuid('created_by').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
});

// User availability
export const userAvailability = pgTable('user_availability', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  unavailableFrom: timestamp('unavailable_from').notNull(),
  unavailableTo: timestamp('unavailable_to').notNull(),
  reason: varchar('reason', { length: 255 }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  songsAdded: many(songs),
  songPreferences: many(userSongPreferences),
  setlistsCreated: many(setlists),
  setlistsAsMusicalDirector: many(setlists),
  notificationsAssigned: many(notifications),
  availability: many(userAvailability)
}));

export const songsRelations = relations(songs, ({ one, many }) => ({
  addedBy: one(users, { fields: [songs.addedBy], references: [users.id] }),
  userPreferences: many(userSongPreferences),
  setlistEntries: many(setlistSongs)
}));

export const setlistsRelations = relations(setlists, ({ one, many }) => ({
  service: one(recurringServices, { fields: [setlists.serviceId], references: [recurringServices.id] }),
  praiseLeader: one(users, { fields: [setlists.praiseLeader], references: [users.id] }),
  worshipLeader: one(users, { fields: [setlists.worshipLeader], references: [users.id] }),
  musicalDirector: one(users, { fields: [setlists.musicalDirector], references: [users.id] }),
  createdBy: one(users, { fields: [setlists.createdBy], references: [users.id] }),
  songs: many(setlistSongs),
  calendarEvents: many(calendarEvents)
}));

export const setlistSongsRelations = relations(setlistSongs, ({ one }) => ({
  setlist: one(setlists, { fields: [setlistSongs.setlistId], references: [setlists.id] }),
  song: one(songs, { fields: [setlistSongs.songId], references: [songs.id] })
}));

export const recurringServicesRelations = relations(recurringServices, ({ many }) => ({
  setlists: many(setlists),
  notifications: many(notifications),
  calendarEvents: many(calendarEvents)
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  service: one(recurringServices, { fields: [notifications.serviceId], references: [recurringServices.id] }),
  setlist: one(setlists, { fields: [notifications.setlistId], references: [setlists.id] }),
  assignedTo: one(users, { fields: [notifications.assignedTo], references: [users.id] })
}));

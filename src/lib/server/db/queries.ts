/**
 * Database Query Utilities for ChosenWorship
 * Replaces JSON data access with database queries
 */

import { db } from './index.js';
import * as schema from './schema-sqlite.js';
import { eq, desc, asc, and, or, gte, lte, sql } from 'drizzle-orm';
import type { 
  User, 
  Song, 
  Setlist, 
  SetlistNotification, 
  RecurringService,
  CalendarEvent 
} from '$lib/types.js';

// ==================== USERS ====================

export async function getAllUsers(): Promise<User[]> {
  const users = await db.select().from(schema.users).orderBy(asc(schema.users.name));
  return users.map(transformUserFromDb);
}

export async function getUserById(id: string): Promise<User | null> {
  const [user] = await db.select().from(schema.users).where(eq(schema.users.id, id));
  return user ? transformUserFromDb(user) : null;
}

export async function getUsersByRole(role: string): Promise<User[]> {
  const users = await db.select().from(schema.users)
    .where(sql`${schema.users.roles} ? ${role}`);
  return users.map(transformUserFromDb);
}

function transformUserFromDb(dbUser: any): User {
  return {
    id: dbUser.id,
    name: dbUser.name,
    email: dbUser.email,
    instruments: dbUser.instruments ? JSON.parse(dbUser.instruments) : [],
    roles: dbUser.roles ? JSON.parse(dbUser.roles) : [],
    defaultPreferredNote: dbUser.defaultPreferredNote,
    avatar: dbUser.avatar,
    phone: dbUser.phone,
    emergencyContact: dbUser.emergencyContact
  };
}

// ==================== SONGS ====================

export async function getAllSongs(): Promise<Song[]> {
  const songs = await db.select().from(schema.songs).orderBy(asc(schema.songs.title));
  return songs.map(transformSongFromDb);
}

export async function getSongById(id: string): Promise<Song | null> {
  const [song] = await db.select().from(schema.songs).where(eq(schema.songs.id, id));
  return song ? transformSongFromDb(song) : null;
}

export async function searchSongs(query: string): Promise<Song[]> {
  const songs = await db.select().from(schema.songs)
    .where(
      or(
        sql`${schema.songs.title} ILIKE ${`%${query}%`}`,
        sql`${schema.songs.artist} ILIKE ${`%${query}%`}`,
        sql`${schema.songs.tags} ? ${query}`
      )
    )
    .orderBy(asc(schema.songs.title));
  return songs.map(transformSongFromDb);
}

export async function getSongsByKey(key: string): Promise<Song[]> {
  const songs = await db.select().from(schema.songs)
    .where(eq(schema.songs.originalKey, key))
    .orderBy(asc(schema.songs.title));
  return songs.map(transformSongFromDb);
}

function transformSongFromDb(dbSong: any): Song {
  return {
    id: dbSong.id,
    title: dbSong.title,
    artist: dbSong.artist,
    originalKey: dbSong.originalKey,
    lyricsUrl: dbSong.lyricsUrl,
    chordsUrl: dbSong.chordsUrl,
    tags: dbSong.tags ? JSON.parse(dbSong.tags) : [],
    language: dbSong.language || 'en',
    tempo: dbSong.tempo,
    category: dbSong.category,
    duration: dbSong.duration,
    usageCount: dbSong.usageCount || 0,
    lastUsed: dbSong.lastUsed ? new Date(dbSong.lastUsed).toISOString() : undefined
  };
}

// ==================== SETLISTS ====================

export async function getAllSetlists(): Promise<Setlist[]> {
  const setlists = await db.select().from(schema.setlists)
    .orderBy(desc(schema.setlists.date));
  return Promise.all(setlists.map(transformSetlistFromDb));
}

export async function getSetlistById(id: string): Promise<Setlist | null> {
  const [setlist] = await db.select().from(schema.setlists)
    .where(eq(schema.setlists.id, id));
  return setlist ? await transformSetlistFromDb(setlist) : null;
}

export async function getUpcomingSetlists(): Promise<Setlist[]> {
  const now = Date.now();
  const setlists = await db.select().from(schema.setlists)
    .where(gte(schema.setlists.date, now))
    .orderBy(asc(schema.setlists.date));
  return Promise.all(setlists.map(transformSetlistFromDb));
}

async function transformSetlistFromDb(dbSetlist: any): Promise<Setlist> {
  // Get setlist songs
  const dbSetlistSongs = await db.select({
    songId: schema.setlistSongs.songId,
    section: schema.setlistSongs.section,
    order: schema.setlistSongs.order,
    preferredKey: schema.setlistSongs.preferredKey,
    transposition: schema.setlistSongs.transposition,
    notes: schema.setlistSongs.notes
  }).from(schema.setlistSongs)
    .where(eq(schema.setlistSongs.setlistId, dbSetlist.id))
    .orderBy(asc(schema.setlistSongs.order));

  const setlistSongs = dbSetlistSongs.map(song => ({
    songId: song.songId,
    section: song.section,
    order: song.order,
    preferredKey: song.preferredKey || undefined,
    transposition: song.transposition || undefined,
    notes: song.notes || undefined
  }));

  return {
    id: dbSetlist.id,
    title: dbSetlist.title,
    date: new Date(dbSetlist.date).toISOString().split('T')[0],
    serviceId: dbSetlist.serviceId,
    songs: setlistSongs,
    praiseLeader: dbSetlist.praiseLeader,
    worshipLeader: dbSetlist.worshipLeader,
    musicalDirector: dbSetlist.musicalDirector,
    createdBy: dbSetlist.createdBy,
    createdAt: new Date(dbSetlist.createdAt).toISOString(),
    notes: dbSetlist.notes ? JSON.parse(dbSetlist.notes) : [],
    status: dbSetlist.status || 'draft',
    estimatedDuration: dbSetlist.estimatedDuration
  };
}

// ==================== RECURRING SERVICES ====================

export async function getAllRecurringServices(): Promise<RecurringService[]> {
  const services = await db.select().from(schema.recurringServices)
    .where(eq(schema.recurringServices.active, true))
    .orderBy(asc(schema.recurringServices.dayOfWeek));
  return services.map(transformServiceFromDb);
}

function transformServiceFromDb(dbService: any): RecurringService {
  return {
    id: dbService.id,
    title: dbService.title,
    dayOfWeek: dbService.dayOfWeek,
    time: dbService.time,
    location: dbService.location,
    type: dbService.type,
    setlistReminderDays: dbService.setlistReminderDays,
    teamReminderDays: dbService.teamReminderDays,
    active: Boolean(dbService.active),
    defaultDuration: dbService.defaultDuration,
    requiredRoles: dbService.requiredRoles ? JSON.parse(dbService.requiredRoles) : []
  };
}

// ==================== NOTIFICATIONS ====================

export async function getAllNotifications(): Promise<SetlistNotification[]> {
  const notifications = await db.select().from(schema.notifications)
    .orderBy(desc(schema.notifications.createdAt));
  return notifications.map(transformNotificationFromDb);
}

export async function getActiveNotifications(): Promise<SetlistNotification[]> {
  const notifications = await db.select().from(schema.notifications)
    .where(eq(schema.notifications.status, 'pending'))
    .orderBy(asc(schema.notifications.targetDate));
  return notifications.map(transformNotificationFromDb);
}

function transformNotificationFromDb(dbNotification: any): SetlistNotification {
  return {
    id: dbNotification.id,
    type: dbNotification.type,
    serviceId: dbNotification.serviceId,
    targetDate: new Date(dbNotification.targetDate).toISOString().split('T')[0],
    createdAt: new Date(dbNotification.createdAt).toISOString(),
    status: dbNotification.status,
    assignedTo: dbNotification.assignedTo,
    message: dbNotification.message
  };
}

// ==================== CALENDAR EVENTS ====================

export async function getAllCalendarEvents(): Promise<CalendarEvent[]> {
  const events = await db.select().from(schema.calendarEvents)
    .orderBy(asc(schema.calendarEvents.date));
  return events.map(transformCalendarEventFromDb);
}

export async function getUpcomingCalendarEvents(): Promise<CalendarEvent[]> {
  const now = Date.now();
  const events = await db.select().from(schema.calendarEvents)
    .where(gte(schema.calendarEvents.date, now))
    .orderBy(asc(schema.calendarEvents.date));
  return events.map(transformCalendarEventFromDb);
}

function transformCalendarEventFromDb(dbEvent: any): CalendarEvent {
  return {
    id: dbEvent.id,
    title: dbEvent.title,
    date: new Date(dbEvent.date).toISOString().split('T')[0],
    time: dbEvent.time,
    location: dbEvent.location,
    description: dbEvent.description,
    setlistId: dbEvent.setlistId,
    eventType: dbEvent.eventType || 'service',
    createdBy: dbEvent.createdBy
  };
}

// ==================== USER SONG PREFERENCES ====================

export async function getUserSongPreferences(userId: string) {
  const preferences = await db.select().from(schema.userSongPreferences)
    .where(eq(schema.userSongPreferences.userId, userId));
  
  return preferences.map(pref => ({
    songId: pref.songId,
    preferredNote: pref.preferredNote,
    notes: pref.notes
  }));
}

// ==================== SETLIST TEMPLATES ====================

export async function getAllSetlistTemplates() {
  const templates = await db.select().from(schema.setlistTemplates)
    .orderBy(asc(schema.setlistTemplates.name));
  return templates;
}

// ==================== STATISTICS ====================

export async function getDashboardStats() {
  const [userCount] = await db.select({ count: sql<number>`count(*)` }).from(schema.users);
  const [songCount] = await db.select({ count: sql<number>`count(*)` }).from(schema.songs);
  const [setlistCount] = await db.select({ count: sql<number>`count(*)` }).from(schema.setlists);
  const [serviceCount] = await db.select({ count: sql<number>`count(*)` }).from(schema.recurringServices);

  return {
    totalUsers: userCount.count,
    totalSongs: songCount.count,
    totalSetlists: setlistCount.count,
    activeServices: serviceCount.count
  };
}
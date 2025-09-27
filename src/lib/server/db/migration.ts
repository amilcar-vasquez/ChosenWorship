/**
 * Database Migration Utility
 * Migrates JSON data to PostgreSQL database
 */

import { db } from './index.js';
import * as schema from './schema.js';
import type { ChosenWorshipData } from '$lib/types.js';

export interface MigrationResult {
  success: boolean;
  message: string;
  counts?: {
    users: number;
    songs: number;
    setlists: number;
    userPreferences: number;
    recurringServices: number;
    notifications: number;
    templates: number;
    availability: number;
    calendarEvents: number;
  };
  errors?: string[];
}

export async function migrateJsonToDatabase(jsonData: ChosenWorshipData): Promise<MigrationResult> {
  const errors: string[] = [];
  
  try {
    console.log('🔄 Starting database migration...');
    
    // Clear existing data in development
    if (process.env.NODE_ENV !== 'production') {
      await clearAllTables();
    }
    
    // 1. Migrate Users
    console.log('👥 Migrating users...');
    const userIds = new Map<string, string>();
    
    for (const user of jsonData.users) {
      try {
        const [newUser] = await db.insert(schema.users).values({
          name: user.name,
          email: user.email,
          instruments: user.instruments || [],
          roles: user.roles || [],
          defaultPreferredNote: user.defaultPreferredNote,
          avatar: user.avatar
        }).returning({ id: schema.users.id });
        
        userIds.set(user.id, newUser.id);
      } catch (error) {
        errors.push(`Failed to migrate user ${user.name}: ${error}`);
      }
    }
    
    // 2. Migrate Songs
    console.log('🎵 Migrating songs...');
    const songIds = new Map<string, string>();
    
    for (const song of jsonData.songs) {
      try {
        const [newSong] = await db.insert(schema.songs).values({
          title: song.title,
          artist: song.artist,
          originalKey: song.originalKey,
          lyricsUrl: song.lyricsUrl,
          chordsUrl: song.chordsUrl,
          tags: song.tags || [],
          language: (song.language as any) || 'en',
          tempo: (song.tempo as any),
          category: song.category,
          duration: song.duration,
          usageCount: song.usageCount || 0,
          lastUsed: song.lastUsed ? new Date(song.lastUsed) : null,
          addedBy: (song as any).addedBy ? userIds.get((song as any).addedBy) || null : null
        }).returning({ id: schema.songs.id });
        
        songIds.set(song.id, newSong.id);
      } catch (error) {
        errors.push(`Failed to migrate song ${song.title}: ${error}`);
      }
    }
    
    // 3. Migrate User Song Preferences
    console.log('⚙️ Migrating user song preferences...');
    for (const pref of (jsonData as any).userSongPreferences || []) {
      try {
        const userId = userIds.get(pref.userId);
        const songId = songIds.get(pref.songId);
        
        if (userId && songId) {
          await db.insert(schema.userSongPreferences).values({
            userId,
            songId,
            preferredNote: pref.preferredNote,
            notes: pref.notes
          });
        }
      } catch (error) {
        errors.push(`Failed to migrate user preference: ${error}`);
      }
    }
    
    // 4. Migrate Recurring Services
    console.log('🔄 Migrating recurring services...');
    const serviceIds = new Map<string, string>();
    
    for (const service of jsonData.recurringServices || []) {
      try {
        const [newService] = await db.insert(schema.recurringServices).values({
          title: service.title,
          dayOfWeek: service.dayOfWeek,
          time: service.time,
          location: service.location,
          type: service.type,
          setlistReminderDays: service.setlistReminderDays,
          teamReminderDays: service.teamReminderDays,
          active: service.active,
          defaultDuration: service.defaultDuration,
          requiredRoles: service.requiredRoles || []
        }).returning({ id: schema.recurringServices.id });
        
        serviceIds.set(service.id, newService.id);
      } catch (error) {
        errors.push(`Failed to migrate service ${service.title}: ${error}`);
      }
    }
    
    // 5. Migrate Setlists
    console.log('📋 Migrating setlists...');
    const setlistIds = new Map<string, string>();
    
    for (const setlist of jsonData.setlists) {
      try {
        const [newSetlist] = await db.insert(schema.setlists).values({
          title: setlist.title,
          date: new Date(setlist.date),
          serviceId: setlist.serviceId ? serviceIds.get(setlist.serviceId) || null : null,
          praiseLeader: setlist.praiseLeader ? userIds.get(setlist.praiseLeader) || null : null,
          worshipLeader: setlist.worshipLeader ? userIds.get(setlist.worshipLeader) || null : null,
          musicalDirector: setlist.musicalDirector ? userIds.get(setlist.musicalDirector) || null : null,
          status: (setlist.status as any) || 'draft',
          estimatedDuration: setlist.estimatedDuration,
          notes: Array.isArray(setlist.notes) ? setlist.notes : (setlist.notes ? [setlist.notes as string] : []),
          createdBy: setlist.createdBy ? userIds.get(setlist.createdBy) || Array.from(userIds.values())[0] : Array.from(userIds.values())[0]
        }).returning({ id: schema.setlists.id });
        
        setlistIds.set(setlist.id, newSetlist.id);
        
        // Migrate setlist songs
        if (setlist.songs && Array.isArray(setlist.songs)) {
          for (const songEntry of setlist.songs) {
            const songId = songIds.get(songEntry.songId);
            if (songId) {
              await db.insert(schema.setlistSongs).values({
                setlistId: newSetlist.id,
                songId,
                section: (songEntry.section as any) || 'worship',
                order: songEntry.order || 1,
                preferredKey: songEntry.preferredKey,
                transposition: songEntry.transposition,
                notes: songEntry.notes
              });
            }
          }
        }
      } catch (error) {
        errors.push(`Failed to migrate setlist ${setlist.title}: ${error}`);
      }
    }
    
    // 6. Migrate Calendar Events
    console.log('📅 Migrating calendar events...');
    for (const event of jsonData.calendarEvents) {
      try {
        await db.insert(schema.calendarEvents).values({
          title: event.title,
          date: new Date(event.date),
          time: event.time,
          location: event.location,
          description: event.description,
          setlistId: event.setlistId ? setlistIds.get(event.setlistId) || null : null,
          serviceId: (event as any).serviceId ? serviceIds.get((event as any).serviceId) || null : null,
          eventType: event.eventType || 'service',
          createdBy: (event as any).createdBy ? userIds.get((event as any).createdBy) || Array.from(userIds.values())[0] : Array.from(userIds.values())[0]
        });
      } catch (error) {
        errors.push(`Failed to migrate calendar event ${event.title}: ${error}`);
      }
    }
    
    // 7. Migrate Notifications
    console.log('🔔 Migrating notifications...');
    for (const notification of jsonData.notifications || []) {
      try {
        await db.insert(schema.notifications).values({
          type: (notification.type as any),
          serviceId: notification.serviceId ? serviceIds.get(notification.serviceId) || null : null,
          targetDate: new Date(notification.targetDate),
          status: (notification.status as any) || 'pending',
          assignedTo: userIds.get(notification.assignedTo) || Array.from(userIds.values())[0],
          message: notification.message
        });
      } catch (error) {
        errors.push(`Failed to migrate notification: ${error}`);
      }
    }
    
    // 8. Migrate Setlist Templates
    console.log('📝 Migrating setlist templates...');
    for (const template of jsonData.setlistTemplates || []) {
      try {
        await db.insert(schema.setlistTemplates).values({
          name: template.name,
          serviceType: template.serviceType,
          structure: template.structure,
          totalSongs: template.totalSongs,
          estimatedDuration: template.estimatedDuration,
          createdBy: Array.from(userIds.values())[0] || null
        });
      } catch (error) {
        errors.push(`Failed to migrate template ${template.name}: ${error}`);
      }
    }
    
    // 9. Migrate User Availability
    console.log('📋 Migrating user availability...');
    for (const availability of jsonData.availability || []) {
      try {
        const userId = userIds.get(availability.userId);
        if (userId) {
          await db.insert(schema.userAvailability).values({
            userId,
            unavailableFrom: new Date(availability.unavailableFrom),
            unavailableTo: new Date(availability.unavailableTo),
            reason: availability.reason
          });
        }
      } catch (error) {
        errors.push(`Failed to migrate availability: ${error}`);
      }
    }
    
    // Get final counts
    const counts = {
      users: await db.select().from(schema.users).then(r => r.length),
      songs: await db.select().from(schema.songs).then(r => r.length),
      setlists: await db.select().from(schema.setlists).then(r => r.length),
      userPreferences: await db.select().from(schema.userSongPreferences).then(r => r.length),
      recurringServices: await db.select().from(schema.recurringServices).then(r => r.length),
      notifications: await db.select().from(schema.notifications).then(r => r.length),
      templates: await db.select().from(schema.setlistTemplates).then(r => r.length),
      availability: await db.select().from(schema.userAvailability).then(r => r.length),
      calendarEvents: await db.select().from(schema.calendarEvents).then(r => r.length)
    };
    
    console.log('✅ Migration completed successfully!');
    console.log('📊 Final counts:', counts);
    
    return {
      success: true,
      message: 'Database migration completed successfully',
      counts,
      errors: errors.length > 0 ? errors : undefined
    };
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    return {
      success: false,
      message: `Migration failed: ${error}`,
      errors: [...errors, String(error)]
    };
  }
}

async function clearAllTables() {
  console.log('🗑️ Clearing existing data...');
  
  // Delete in reverse dependency order
  await db.delete(schema.setlistSongs);
  await db.delete(schema.userSongPreferences);
  await db.delete(schema.userAvailability);
  await db.delete(schema.notifications);
  await db.delete(schema.calendarEvents);
  await db.delete(schema.setlists);
  await db.delete(schema.setlistTemplates);
  await db.delete(schema.recurringServices);
  await db.delete(schema.songs);
  await db.delete(schema.users);
  
  console.log('✅ Tables cleared');
}

export async function testDatabaseConnection(): Promise<boolean> {
  try {
    await db.select().from(schema.users).limit(1);
    return true;
  } catch (error) {
    console.error('Database connection failed:', error);
    return false;
  }
}
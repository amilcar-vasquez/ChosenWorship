/**
 * Standalone Database Migration Script
 * Migrates JSON data directly to the database
 */

import { readFileSync } from 'fs';
import { config } from 'dotenv';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import * as schema from '../src/lib/server/db/schema-sqlite.js';

// Load environment variables
config();

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  throw new Error('DATABASE_URL is not set');
}

// Setup SQLite database connection
const sqlite = new Database(DATABASE_URL.replace('sqlite:', ''));
const db = drizzle(sqlite);

// Load JSON data
const jsonData = JSON.parse(readFileSync(new URL('../src/lib/data/chosenWorship.json', import.meta.url), 'utf8'));

async function testConnection() {
  try {
    // Simple test query
    await db.select().from(schema.users).limit(1);
    return true;
  } catch (error) {
    console.error('Database connection failed:', error);
    return false;
  }
}

async function clearTables() {
  console.log('🧹 Clearing existing data...');
  
  const tables = [
    schema.userAvailability,
    schema.calendarEvents, 
    schema.setlistTemplates,
    schema.notifications,
    schema.setlistSongs,
    schema.userSongPreferences,
    schema.setlists,
    schema.recurringServices,
    schema.songs,
    schema.users
  ];
  
  for (const table of tables) {
    try {
      await db.delete(table);
    } catch (error) {
      console.log(`Note: ${table} may not exist yet`);
    }
  }
}

async function migrate() {
  console.log('🚀 ChosenWorship Database Migration');
  console.log('=====================================');
  
  // Test connection
  console.log('🔌 Testing database connection...');
  const connectionOk = await testConnection();
  if (!connectionOk) {
    console.error('❌ Database connection failed!');
    process.exit(1);
  }
  console.log('✅ Database connection successful!');
  
  // Clear tables
  await clearTables();
  
  const counts = {
    users: 0,
    songs: 0,
    setlists: 0,
    userPreferences: 0,
    recurringServices: 0,
    notifications: 0,
    templates: 0,
    availability: 0,
    calendarEvents: 0
  };
  
  try {
    // 1. Migrate Users
    console.log('👥 Migrating users...');
    const userIds = new Map<string, string>();
    
    for (const user of jsonData.users) {
      const [newUser] = await db.insert(schema.users).values({
        name: user.name,
        email: user.email,
        instruments: JSON.stringify(user.instruments || []),
        roles: JSON.stringify(user.roles || []),
        defaultPreferredNote: user.defaultPreferredNote,
        avatar: user.avatar,
        phone: user.phone,
        emergencyContact: user.emergencyContact
      }).returning({ id: schema.users.id });
      
      userIds.set(user.id, newUser.id as string);
      counts.users++;
    }
    
    // 2. Migrate Songs
    console.log('🎵 Migrating songs...');
    const songIds = new Map<string, string>();
    
    for (const song of jsonData.songs) {
      const [newSong] = await db.insert(schema.songs).values({
        title: song.title,
        artist: song.artist || 'Unknown',
        originalKey: song.originalKey,
        lyricsUrl: song.lyricsUrl,
        chordsUrl: song.chordsUrl,
        tags: JSON.stringify(song.tags || []),
        language: song.language || 'en',
        tempo: song.tempo,
        category: song.category,
        duration: song.duration,
        usageCount: song.usageCount || 0,
        lastUsed: song.lastUsed ? new Date(song.lastUsed).getTime() : null
      }).returning({ id: schema.songs.id });
      
      songIds.set(song.id, newSong.id as string);
      counts.songs++;
    }
    
    // 3. Migrate Recurring Services
    console.log('⛪ Migrating recurring services...');
    const serviceIds = new Map<string, string>();
    
    for (const service of jsonData.recurringServices) {
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
        requiredRoles: JSON.stringify(service.requiredRoles || [])
      }).returning({ id: schema.recurringServices.id });
      
      serviceIds.set(service.id, newService.id as string);
      counts.recurringServices++;
    }
    
    // 4. Migrate Setlists
    console.log('📝 Migrating setlists...');
    const defaultUserId = userIds.values().next().value;
    
    for (const setlist of jsonData.setlists) {
      const [newSetlist] = await db.insert(schema.setlists).values({
        title: setlist.title,
        date: new Date(setlist.date).getTime(),
        serviceId: serviceIds.get(setlist.serviceId) || null,
        praiseLeader: userIds.get(setlist.praiseLeader) || null,
        worshipLeader: userIds.get(setlist.worshipLeader) || null,
        musicalDirector: userIds.get(setlist.musicalDirector) || null,
        createdBy: userIds.get(setlist.createdBy) || defaultUserId || '',
        notes: JSON.stringify(setlist.notes || []),
        status: setlist.status || 'draft',
        estimatedDuration: setlist.estimatedDuration
      }).returning({ id: schema.setlists.id });
      
      // Migrate setlist songs
      for (const song of setlist.songs || []) {
        await db.insert(schema.setlistSongs).values({
          setlistId: newSetlist.id,
          songId: songIds.get(song.songId) || '',
          section: song.section as any,
          order: song.order,
          preferredKey: song.preferredKey,
          transposition: song.transposition,
          notes: song.notes
        });
      }
      
      counts.setlists++;
    }
    
    // 5. Migrate User Song Preferences  
    console.log('🎹 Migrating user preferences...');
    for (const pref of jsonData.userSongPreferences || []) {
      await db.insert(schema.userSongPreferences).values({
        userId: userIds.get(pref.userId) || '',
        songId: songIds.get(pref.songId) || '',
        preferredNote: pref.preferredNote,
        notes: pref.notes
      });
      counts.userPreferences++;
    }
    
    // 6. Migrate Notifications
    console.log('🔔 Migrating notifications...');
    for (const notification of jsonData.setlistNotifications || []) {
      const assignedUserId = userIds.get(notification.assignedTo) || defaultUserId;
      if (assignedUserId) {
        await db.insert(schema.notifications).values({
          type: notification.type,
          serviceId: serviceIds.get(notification.serviceId) || null,
          targetDate: new Date(notification.targetDate).getTime(),
          status: notification.status || 'pending',
          assignedTo: assignedUserId,
          message: notification.message || 'Setlist reminder'
        });
        counts.notifications++;
      }
    }
    
    console.log('🎉 Migration completed successfully!');
    console.log('\n📊 Migration Summary:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━');
    Object.entries(counts).forEach(([table, count]) => {
      console.log(`${table.padEnd(20)} ${count.toString().padStart(4)} records`);
    });
    
    console.log('\n✨ Your database is ready! You can now:');
    console.log('• Update your components to use database queries');
    console.log('• Run the development server: npm run dev');
    console.log('• View your database: npm run db:studio');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Handle errors
process.on('unhandledRejection', (error) => {
  console.error('💥 Unhandled rejection:', error);
  process.exit(1);
});

migrate().catch(console.error);
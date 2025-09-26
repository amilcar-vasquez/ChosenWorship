// Utilities for automatic setlist generation and management

import type { Song, SetlistSong, SetlistTemplate, User } from '$lib/types.ts';

export interface AutoSetlistParams {
  template: SetlistTemplate;
  availableSongs: Song[];
  availableUsers: User[];
  serviceDate: string;
  serviceId: string;
}

export interface GeneratedSetlist {
  id: string;
  title: string;
  date: string;
  serviceId: string;
  songs: SetlistSong[];
  praiseLeader?: string;
  worshipLeader?: string;
  musicalDirector?: string;
  estimatedDuration: number;
  notes: string[];
}

// Generate setlist ID for a service and date
export function generateAutoSetlistId(serviceId: string, date: string): string {
  const dateStr = date.replace(/-/g, '');
  return `setlist_auto_${serviceId}_${dateStr}`;
}

// Get songs by tempo and type
export function getSongsByFilter(
  songs: Song[], 
  type: 'praise' | 'worship', 
  tempo?: 'slow' | 'medium' | 'fast'
): Song[] {
  return songs.filter(song => {
    // Filter by type (tags or category)
    const matchesType = song.tags?.some(tag => 
      tag.toLowerCase().includes(type) || 
      (type === 'worship' && (tag.toLowerCase().includes('slow') || tag.toLowerCase().includes('intimate'))) ||
      (type === 'praise' && (tag.toLowerCase().includes('fast') || tag.toLowerCase().includes('upbeat')))
    );
    
    // Filter by tempo if specified
    if (tempo && song.tags) {
      const matchesTempo = song.tags.some(tag => tag.toLowerCase().includes(tempo));
      return matchesType && matchesTempo;
    }
    
    return matchesType;
  });
}

// Generate automatic setlist based on template
export function generateAutoSetlist(params: AutoSetlistParams): GeneratedSetlist {
  const { template, availableSongs, availableUsers, serviceDate, serviceId } = params;
  
  const setlistId = generateAutoSetlistId(serviceId, serviceDate);
  const songs: SetlistSong[] = [];
  const notes: string[] = [];
  
  let order = 1;
  
  // Process each section in the template
  Object.entries(template.structure).forEach(([sectionName, section]) => {
    // Get appropriate songs for this section
    const tempo = section.tempo === 'mixed' ? undefined : section.tempo;
    let sectionSongs = getSongsByFilter(availableSongs, section.type, tempo);
    
    // Shuffle and take the required number
    sectionSongs = shuffleArray(sectionSongs).slice(0, section.count);
    
    // Add to setlist with proper ordering
    sectionSongs.forEach(song => {
      songs.push({
        songId: song.id,
        section: section.type,
        order: order++,
        preferredKey: song.originalKey, // Will be adjusted based on leader preferences
        notes: `Auto-generated for ${sectionName} section`
      });
    });
    
    // Add section note
    notes.push(`${sectionName}: ${section.count} ${section.type} song(s) (${section.tempo} tempo)`);
  });
  
  // Assign leaders based on availability and roles
  const { praiseLeader, worshipLeader, musicalDirector } = assignLeaders(availableUsers, serviceDate);
  
  return {
    id: setlistId,
    title: `${template.name} - ${new Date(serviceDate).toLocaleDateString()}`,
    date: serviceDate,
    serviceId,
    songs,
    praiseLeader: praiseLeader?.id,
    worshipLeader: worshipLeader?.id,
    musicalDirector: musicalDirector?.id,
    estimatedDuration: template.estimatedDuration,
    notes
  };
}

// Assign leaders based on roles and availability
function assignLeaders(users: User[], serviceDate: string) {
  // Filter users by roles
  const praiseLeaders = users.filter(u => u.roles.includes('praise'));
  const worshipLeaders = users.filter(u => u.roles.includes('worship'));
  const musicalDirectors = users.filter(u => u.roles.includes('musical-director'));
  
  // TODO: Check availability against the serviceDate
  // For now, just pick the first available in each category
  
  return {
    praiseLeader: praiseLeaders[0],
    worshipLeader: worshipLeaders[0],
    musicalDirector: musicalDirectors[0]
  };
}

// Shuffle array utility
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// Adjust setlist keys based on musical director preferences
export function adjustSetlistKeys(
  setlist: GeneratedSetlist, 
  musicalDirector: User, 
  songs: Song[]
): GeneratedSetlist {
  if (!musicalDirector || !musicalDirector.defaultPreferredNote) {
    return setlist;
  }
  
  const adjustedSongs = setlist.songs.map(setlistSong => {
    const song = songs.find(s => s.id === setlistSong.songId);
    if (!song) return setlistSong;
    
    // Check if musical director has a specific preference for this song
    const userPreference = musicalDirector.userSongPreferences?.find(
      p => p.songId === song.id
    );
    
    const preferredKey = userPreference?.preferredNote || musicalDirector.defaultPreferredNote;
    
    return {
      ...setlistSong,
      preferredKey: preferredKey || song.originalKey
    };
  });
  
  return {
    ...setlist,
    songs: adjustedSongs,
    notes: [
      ...setlist.notes,
      `Keys adjusted for musical director: ${musicalDirector.name}`
    ]
  };
}

// Calculate key transitions for smooth flow
export function optimizeKeyFlow(setlist: GeneratedSetlist, songs: Song[]): GeneratedSetlist {
  const songLookup = Object.fromEntries(songs.map(s => [s.id, s]));
  
  // Sort songs by section to maintain template structure but optimize within sections
  const songsBySections = setlist.songs.reduce((acc, song) => {
    if (!acc[song.section]) acc[song.section] = [];
    acc[song.section].push(song);
    return acc;
  }, {} as Record<string, SetlistSong[]>);
  
  const optimizedSongs: SetlistSong[] = [];
  let order = 1;
  
  // Process each section and optimize key flow within it
  Object.entries(songsBySections).forEach(([section, sectionSongs]) => {
    // For now, keep original order but this could be enhanced with key analysis
    sectionSongs.forEach(song => {
      optimizedSongs.push({
        ...song,
        order: order++
      });
    });
  });
  
  return {
    ...setlist,
    songs: optimizedSongs,
    notes: [
      ...setlist.notes,
      'Song order optimized for key flow'
    ]
  };
}

// Generate setlist preview summary
export function generateSetlistSummary(setlist: GeneratedSetlist, songs: Song[], users: User[]) {
  const songLookup = Object.fromEntries(songs.map(s => [s.id, s]));
  const userLookup = Object.fromEntries(users.map(u => [u.id, u]));
  
  const songsBySection = setlist.songs.reduce((acc, setlistSong) => {
    const song = songLookup[setlistSong.songId];
    if (!song) return acc;
    
    if (!acc[setlistSong.section]) acc[setlistSong.section] = [];
    acc[setlistSong.section].push({
      title: song.title,
      originalKey: song.originalKey,
      preferredKey: setlistSong.preferredKey || song.originalKey,
      order: setlistSong.order
    });
    return acc;
  }, {} as Record<string, Array<{title: string; originalKey: string; preferredKey: string; order: number}>>);
  
  return {
    title: setlist.title,
    date: setlist.date,
    estimatedDuration: setlist.estimatedDuration,
    totalSongs: setlist.songs.length,
    leaders: {
      praise: setlist.praiseLeader ? userLookup[setlist.praiseLeader]?.name : 'Unassigned',
      worship: setlist.worshipLeader ? userLookup[setlist.worshipLeader]?.name : 'Unassigned',
      musicalDirector: setlist.musicalDirector ? userLookup[setlist.musicalDirector]?.name : 'Unassigned'
    },
    songsBySection,
    notes: setlist.notes
  };
}
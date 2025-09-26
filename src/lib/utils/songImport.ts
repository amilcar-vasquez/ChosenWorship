/**
 * Bulk Song Import Utility
 * Helps import multiple songs at once with validation
 */

import { validateSongData, type SongData } from './music';

export interface BulkSongInput {
  title: string;
  originalKey: string;
  tags?: string[];
  artist?: string;
  lyricsUrl?: string;
  ccliNumber?: string;
  notes?: string;
}

export interface ImportResult {
  success: boolean;
  imported: SongData[];
  errors: Array<{ song: BulkSongInput; errors: string[] }>;
  duplicates: string[];
}

/**
 * Process bulk song import with validation
 */
export function processBulkImport(songs: BulkSongInput[], existingSongs: SongData[] = []): ImportResult {
  const existingTitles = new Set(existingSongs.map(s => s.title.toLowerCase()));
  const imported: SongData[] = [];
  const errors: Array<{ song: BulkSongInput; errors: string[] }> = [];
  const duplicates: string[] = [];
  
  for (const songInput of songs) {
    // Check for duplicates
    if (existingTitles.has(songInput.title.toLowerCase())) {
      duplicates.push(songInput.title);
      continue;
    }
    
    // Transform and validate
    const songData: SongData = {
      title: songInput.title.trim(),
      originalNote: songInput.originalKey,
      tags: songInput.tags || [],
      lyricsUrl: songInput.lyricsUrl,
      artist: songInput.artist,
      ccliNumber: songInput.ccliNumber
    };
    
    const validation = validateSongData(songData);
    
    if (validation.isValid) {
      imported.push(songData);
      existingTitles.add(songData.title.toLowerCase());
    } else {
      errors.push({
        song: songInput,
        errors: validation.errors
      });
    }
  }
  
  return {
    success: errors.length === 0,
    imported,
    errors,
    duplicates
  };
}

/**
 * Generate song template for easy copying
 */
export function generateSongTemplate(): string {
  return `{
  "title": "Song Title Here",
  "originalKey": "C",
  "tags": ["worship", "slow"],
  "artist": "Artist Name (optional)",
  "lyricsUrl": "https://... (optional)",
  "ccliNumber": "1234567 (optional)",
  "notes": "Any notes about the song (optional)"
}`;
}

/**
 * Common worship song tags for reference
 */
export const COMMON_WORSHIP_TAGS = {
  style: ['contemporary', 'traditional', 'hymn', 'modern'],
  tempo: ['fast', 'slow', 'medium', 'ballad', 'upbeat'],
  theme: ['worship', 'praise', 'salvation', 'grace', 'love', 'faith', 'hope', 'peace', 'joy'],
  season: ['christmas', 'easter', 'thanksgiving'],
  usage: ['opening', 'closing', 'communion', 'baptism', 'altar-call', 'offertory']
};

/**
 * Auto-suggest tags based on song title
 */
export function suggestTags(title: string): string[] {
  const titleLower = title.toLowerCase();
  const suggestions: string[] = [];
  
  // Theme-based suggestions
  if (titleLower.includes('praise') || titleLower.includes('hallelujah')) {
    suggestions.push('praise');
  }
  if (titleLower.includes('worship') || titleLower.includes('holy')) {
    suggestions.push('worship');
  }
  if (titleLower.includes('love') || titleLower.includes('heart')) {
    suggestions.push('love');
  }
  if (titleLower.includes('grace') || titleLower.includes('mercy')) {
    suggestions.push('grace');
  }
  if (titleLower.includes('cross') || titleLower.includes('blood')) {
    suggestions.push('salvation');
  }
  if (titleLower.includes('joy') || titleLower.includes('celebrate')) {
    suggestions.push('joy', 'fast');
  }
  if (titleLower.includes('peace') || titleLower.includes('still')) {
    suggestions.push('peace', 'slow');
  }
  
  // Common worship songs tempo
  const fastSongs = ['alive', 'shout', 'dance', 'celebrate', 'rise', 'victory'];
  const slowSongs = ['still', 'quiet', 'gentle', 'peace', 'rest', 'whisper'];
  
  if (fastSongs.some(word => titleLower.includes(word))) {
    suggestions.push('fast', 'upbeat');
  }
  if (slowSongs.some(word => titleLower.includes(word))) {
    suggestions.push('slow', 'ballad');
  }
  
  return [...new Set(suggestions)];
}
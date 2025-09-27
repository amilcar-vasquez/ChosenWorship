/**
 * Music Theory and Transposition Utilities
 */

export const CHROMATIC_SCALE = [
  'C', 'C#/Db', 'D', 'D#/Eb', 'E', 'F', 
  'F#/Gb', 'G', 'G#/Ab', 'A', 'A#/Bb', 'B'
];

export interface TranspositionInfo {
  semitones: number;
  direction: 'up' | 'down' | 'same';
  capoSuggestion?: number;
  description: string;
}

/**
 * Calculate semitone difference between two keys
 */
export function calculateTransposition(originalKey: string, targetKey: string): TranspositionInfo {
  const getKeyIndex = (key: string) => {
    const normalizedKey = key.split('/')[0]; // Handle flat/sharp notation
    return CHROMATIC_SCALE.findIndex(k => k.startsWith(normalizedKey));
  };
  
  const originalIndex = getKeyIndex(originalKey);
  const targetIndex = getKeyIndex(targetKey);
  
  if (originalIndex === -1 || targetIndex === -1) {
    throw new Error(`Invalid key: ${originalKey} or ${targetKey}`);
  }
  
  const semitones = (targetIndex - originalIndex + 12) % 12;
  
  let direction: 'up' | 'down' | 'same' = 'same';
  let description = 'Same key';
  let capoSuggestion: number | undefined;
  
  if (semitones > 0) {
    if (semitones <= 6) {
      direction = 'up';
      description = `${semitones} semitone${semitones > 1 ? 's' : ''} up`;
      // Suggest capo for guitar (up to 7 frets is reasonable)
      if (semitones <= 7) {
        capoSuggestion = semitones;
      }
    } else {
      direction = 'down';
      const downSemitones = 12 - semitones;
      description = `${downSemitones} semitone${downSemitones > 1 ? 's' : ''} down`;
    }
  }
  
  return {
    semitones,
    direction,
    capoSuggestion,
    description
  };
}

/**
 * Get the key at a specific capo position
 */
export function getCapoKey(originalKey: string, capoFret: number): string {
  const originalIndex = CHROMATIC_SCALE.findIndex(k => k.startsWith(originalKey.split('/')[0]));
  if (originalIndex === -1) return originalKey;
  
  const newIndex = (originalIndex + capoFret) % 12;
  return CHROMATIC_SCALE[newIndex];
}

/**
 * Generate chord chart transposition suggestions for a musical director
 */
export function generateTranspositionChart(originalKey: string, teamPreferences: Record<string, string>) {
  const suggestions = Object.entries(teamPreferences).map(([userId, preferredKey]) => {
    const transposition = calculateTransposition(originalKey, preferredKey);
    return {
      userId,
      preferredKey,
      transposition
    };
  });
  
  // Find the most common preferred key
  const keyFrequency = suggestions.reduce((acc, { preferredKey }) => {
    acc[preferredKey] = (acc[preferredKey] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  const mostCommonKey = Object.entries(keyFrequency)
    .sort(([,a], [,b]) => b - a)[0]?.[0];
  
  return {
    originalKey,
    mostCommonKey,
    suggestions,
    keyFrequency
  };
}

/**
 * Lyrics API Integration
 */
export interface LyricsSearchResult {
  title: string;
  artist?: string;
  url?: string;
  source: string;
}

/**
 * Search for lyrics using multiple sources
 * Note: This is a placeholder implementation. In production, you'd need:
 * 1. API keys for services like Musixmatch, Genius
 * 2. Rate limiting and error handling
 * 3. Caching mechanism
 */
export async function searchLyrics(songTitle: string, artist?: string): Promise<LyricsSearchResult[]> {
  const results: LyricsSearchResult[] = [];
  
  // Letras.com search (no API, but could scrape responsibly)
  const letrasQuery = encodeURIComponent(`${songTitle} ${artist || ''}`);
  results.push({
    title: songTitle,
    artist,
    url: `https://www.letras.com/buscar?q=${letrasQuery}`,
    source: 'Letras.com'
  });
  
  // Genius.com search
  const geniusQuery = encodeURIComponent(`${songTitle} ${artist || ''} lyrics`);
  results.push({
    title: songTitle,
    artist,
    url: `https://genius.com/search?q=${geniusQuery}`,
    source: 'Genius'
  });
  
  // Christian Copyright Licensing International (CCLI) - worship songs
  const ccliQuery = encodeURIComponent(songTitle);
  results.push({
    title: songTitle,
    url: `https://songselect.ccli.com/search/results?SearchText=${ccliQuery}`,
    source: 'CCLI SongSelect'
  });
  
  // Worship Together
  const worshipQuery = encodeURIComponent(songTitle);
  results.push({
    title: songTitle,
    url: `https://www.worshiptogether.com/search/?q=${worshipQuery}`,
    source: 'Worship Together'
  });
  
  return results;
}

/**
 * Validate and format song data
 */
export interface SongData {
  title: string;
  originalKey: string;
  tags: string[];
  lyricsUrl?: string;
  artist?: string;
  ccliNumber?: string;
}

export function validateSongData(data: Partial<SongData>): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!data.title || data.title.trim().length === 0) {
    errors.push('Song title is required');
  }
  
  if (!data.originalKey || !CHROMATIC_SCALE.some(key => key.startsWith(data.originalKey!))) {
    errors.push('Valid original key is required');
  }
  
  if (data.lyricsUrl && !isValidUrl(data.lyricsUrl)) {
    errors.push('Lyrics URL must be a valid URL');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Common worship song tags for quick selection
 */
export const WORSHIP_TAGS = [
  'worship',
  'praise',
  'fast',
  'slow',
  'contemporary',
  'traditional',
  'hymn',
  'scripture',
  'salvation',
  'grace',
  'love',
  'faith',
  'hope',
  'peace',
  'joy',
  'glory',
  'holy',
  'cross',
  'resurrection',
  'christmas',
  'easter',
  'communion',
  'baptism',
  'prayer',
  'thanksgiving'
];
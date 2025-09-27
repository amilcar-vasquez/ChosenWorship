/**
 * Dashboard page data loader
 */
import type { PageServerLoad } from './$types';
import { songsLoad } from '$lib/server/loaders.js';

export const load: PageServerLoad = songsLoad;
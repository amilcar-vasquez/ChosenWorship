/**
 * Setlists page data loader
 */
import type { PageServerLoad } from './$types';
import { setlistsLoad } from '$lib/server/loaders.js';

export const load: PageServerLoad = setlistsLoad;
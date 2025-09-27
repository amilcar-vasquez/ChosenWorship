/**
 * Dashboard/Home page data loader
 */
import type { PageServerLoad } from './$types';
import { dashboardLoad } from '$lib/server/loaders.js';

export const load: PageServerLoad = dashboardLoad;
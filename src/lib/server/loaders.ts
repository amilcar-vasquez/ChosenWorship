/**
 * Server-side data loading functions for ChosenWorship pages
 * Implements SvelteKit load functions to replace JSON imports
 */

import type { ServerLoad } from '@sveltejs/kit';
import { 
  getAllUsers,
  getAllSongs,
  getAllSetlists,
  getAllNotifications,
  getAllRecurringServices,
  getUpcomingCalendarEvents,
  getDashboardStats
} from '$lib/server/db/queries-sqlite.js';

// Dashboard data loader
export const dashboardLoad: ServerLoad = async () => {
  try {
    const [
      stats,
      recentSetlists,
      notifications,
      upcomingEvents,
      services
    ] = await Promise.all([
      getDashboardStats(),
      getAllSetlists().then(setlists => setlists.slice(0, 5)),
      getAllNotifications().then(notifications => notifications.slice(0, 5)),
      getUpcomingCalendarEvents().then(events => events.slice(0, 3)),
      getAllRecurringServices()
    ]);

    return {
      stats,
      recentSetlists,
      notifications,
      upcomingEvents,
      services
    };
  } catch (error) {
    console.error('Dashboard load error:', error);
    // Return fallback data structure
    return {
      stats: { totalUsers: 0, totalSongs: 0, totalSetlists: 0, activeServices: 0 },
      recentSetlists: [],
      notifications: [],
      upcomingEvents: [],
      services: []
    };
  }
};

// Songs page data loader
export const songsLoad: ServerLoad = async () => {
  try {
    const [songs, users] = await Promise.all([
      getAllSongs(),
      getAllUsers()
    ]);

    return {
      songs,
      users
    };
  } catch (error) {
    console.error('Songs load error:', error);
    return {
      songs: [],
      users: []
    };
  }
};

// Setlists page data loader
export const setlistsLoad: ServerLoad = async () => {
  try {
    const [
      setlists,
      songs,
      users,
      notifications,
      services
    ] = await Promise.all([
      getAllSetlists(),
      getAllSongs(),
      getAllUsers(),
      getAllNotifications(),
      getAllRecurringServices()
    ]);

    return {
      setlists,
      songs,
      users,
      notifications,
      services
    };
  } catch (error) {
    console.error('Setlists load error:', error);
    return {
      setlists: [],
      songs: [],
      users: [],
      notifications: [],
      services: []
    };
  }
};

// Calendar page data loader
export const calendarLoad: ServerLoad = async () => {
  try {
    const [
      events,
      setlists,
      services
    ] = await Promise.all([
      getUpcomingCalendarEvents(),
      getAllSetlists(),
      getAllRecurringServices()
    ]);

    return {
      events,
      setlists,
      services
    };
  } catch (error) {
    console.error('Calendar load error:', error);
    return {
      events: [],
      setlists: [],
      services: []
    };
  }
};
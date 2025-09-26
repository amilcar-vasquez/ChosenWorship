<script lang="ts">
  import { onMount } from 'svelte';
  import data from '$lib/data/chosenWorship.json';
  import {
    generateUpcomingNotifications,
    getActiveNotifications,
    formatServiceTime,
    getDayName,
    isSetlistOverdue,
    generateSetlistId,
    type SetlistNotification
  } from '$lib/utils/scheduling';
  
  // Transform data for quick lookups
  const users = Object.fromEntries(data.users.map(u => [u.id, u]));
  const songs = Object.fromEntries(data.songs.map(s => [s.id, s]));
  const services = Object.fromEntries(data.recurringServices.map(s => [s.id, s]));
  const setlists = Object.fromEntries(data.setlists.map(s => [s.id, s]));
  
  // Reactive state
  let notifications: SetlistNotification[] = $state(data.notifications as SetlistNotification[] || []);
  let activeReminders: SetlistNotification[] = $state([]);
  
  // Dashboard metrics
  const totalSongs = data.songs.length;
  const totalSetlists = data.setlists.length;
  const totalUsers = data.users.length;
  
  // Upcoming events (legacy calendar events)
  const upcomingEvents = data.calendarEvents
    .filter(event => new Date(event.date) >= new Date())
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 3);
    
  // Recent setlists
  const recentSetlists = data.setlists
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 3);
    
  // Quick stats
  const worshipLeaders = data.users.filter(u => u.roles.includes('worship')).length;
  const praiseLeaders = data.users.filter(u => u.roles.includes('praise')).length;
  const musicalDirectors = data.users.filter(u => u.roles.includes('musical-director')).length;
  
  // Calculate upcoming services from recurring schedule
  function getUpcomingServices() {
    const upcoming: any[] = [];
    const now = new Date();
    
    data.recurringServices.forEach(service => {
      if (!service.active) return;
      
      for (let week = 0; week < 4; week++) {
        const checkDate = new Date(now);
        checkDate.setDate(now.getDate() + (week * 7));
        
        // Find next occurrence of this service
        const targetDay = service.dayOfWeek;
        const currentDay = checkDate.getDay();
        let daysUntilTarget = targetDay - currentDay;
        
        if (daysUntilTarget <= 0) {
          daysUntilTarget += 7;
        }
        
        const serviceDate = new Date(checkDate);
        serviceDate.setDate(checkDate.getDate() + daysUntilTarget);
        
        const dateStr = serviceDate.toISOString().split('T')[0];
        const setlistId = generateSetlistId(service.id, dateStr);
        const hasSetlist = data.setlists.some(s => s.id === setlistId);
        const overdue = isSetlistOverdue(service, dateStr, hasSetlist);
        
        upcoming.push({
          ...service,
          date: dateStr,
          dateObj: serviceDate,
          hasSetlist,
          overdue,
          setlistId
        });
      }
    });
    
    return upcoming.sort((a, b) => a.dateObj.getTime() - b.dateObj.getTime());
  }
  
  const upcomingServices = getUpcomingServices();
  
  // Auto-generate notifications on mount
  onMount(() => {
    const newNotifications = generateUpcomingNotifications(
      data.recurringServices,
      notifications,
      4 // 4 weeks ahead
    );
    
    if (newNotifications.length > 0) {
      notifications = [...notifications, ...newNotifications];
    }
    
    activeReminders = getActiveNotifications(notifications);
  });
  
  function acknowledgeReminder(notificationId: string) {
    const index = notifications.findIndex(n => n.id === notificationId);
    if (index >= 0) {
      notifications[index].status = 'acknowledged';
      notifications = [...notifications];
      activeReminders = getActiveNotifications(notifications);
    }
  }
  
  function formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    });
  }
</script>

<svelte:head>
  <title>Dashboard - ChosenWorship</title>
</svelte:head>

<!-- Welcome Header -->
<div class="mb-8">
  <h1 class="text-3xl font-bold text-gray-900 mb-2">Welcome back! 🙏</h1>
  <p class="text-gray-600">Ready to prepare for worship? Here's what's happening with your team.</p>
</div>

<!-- Quick Stats Grid -->
<div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
  <!-- Total Songs -->
  <div class="md-primary-container rounded-lg p-4 md-elevation-1">
    <div class="flex items-center">
      <div class="flex-shrink-0">
        <span class="text-2xl">🎵</span>
      </div>
      <div class="ml-3">
        <p class="text-sm font-medium opacity-70">Songs</p>
        <p class="text-2xl font-bold">{totalSongs}</p>
      </div>
    </div>
  </div>
  
  <!-- Total Setlists -->
  <div class="md-secondary-container rounded-lg p-4 md-elevation-1">
    <div class="flex items-center">
      <div class="flex-shrink-0">
        <span class="text-2xl">📋</span>
      </div>
      <div class="ml-3">
        <p class="text-sm font-medium opacity-70">Setlists</p>
        <p class="text-2xl font-bold">{totalSetlists}</p>
      </div>
    </div>
  </div>
  
  <!-- Team Members -->
  <div class="md-primary-container rounded-lg p-4 md-elevation-1">
    <div class="flex items-center">
      <div class="flex-shrink-0">
        <span class="text-2xl">👥</span>
      </div>
      <div class="ml-3">
        <p class="text-sm font-medium opacity-70">Team</p>
        <p class="text-2xl font-bold">{totalUsers}</p>
      </div>
    </div>
  </div>
  
  <!-- Leaders -->
  <div class="md-secondary-container rounded-lg p-4 md-elevation-1">
    <div class="flex items-center">
      <div class="flex-shrink-0">
        <span class="text-2xl">⭐</span>
      </div>
      <div class="ml-3">
        <p class="text-sm font-medium opacity-70">Leaders</p>
        <p class="text-2xl font-bold">{worshipLeaders + praiseLeaders}</p>
      </div>
    </div>
  </div>
</div>

<!-- Active Reminders -->
{#if activeReminders.length > 0}
  <div class="mb-8">
    <h2 class="text-xl font-semibold text-surface-on mb-4 flex items-center gap-2">
      <span class="inline-block w-3 h-3 bg-error rounded-full animate-pulse"></span>
      Active Reminders
    </h2>
    <div class="grid gap-3">
      {#each activeReminders as reminder}
        {@const service = services[reminder.serviceId]}
        <div class="surface-container-high rounded-lg p-4 border-l-4 border-error">
          <div class="flex justify-between items-start mb-2">
            <h3 class="font-semibold text-surface-on">{service?.title}</h3>
            <span class="text-xs px-2 py-1 error-container text-error-container-on rounded">
              Due in {Math.ceil((new Date(reminder.targetDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} days
            </span>
          </div>
          <p class="text-sm text-surface-on-variant mb-2">{reminder.message}</p>
          <div class="flex gap-2">
            <a 
              href="/setlists" 
              class="text-sm px-3 py-1 primary-container text-primary-container-on rounded hover:shadow-md transition-shadow"
            >
              Create Setlist
            </a>
            <button 
              class="text-sm px-3 py-1 surface-container text-surface-on rounded hover:surface-container-high transition-colors"
              onclick={() => acknowledgeReminder(reminder.id)}
            >
              Acknowledge
            </button>
          </div>
        </div>
      {/each}
    </div>
  </div>
{/if}

<!-- Main Content Grid -->
<div class="grid lg:grid-cols-2 gap-8">
  <!-- Upcoming Services (Enhanced) -->
  <div class="surface rounded-lg p-6 shadow-md">
    <h2 class="text-xl font-semibold text-surface-on mb-4 flex items-center">
      <span class="mr-2">📅</span>
      Upcoming Services
    </h2>
    
    {#if upcomingServices.length > 0}
      <div class="space-y-4">
        {#each upcomingServices.slice(0, 4) as serviceInstance}
          {@const service = services[serviceInstance.id]}
          {@const existingSetlist = setlists[serviceInstance.setlistId]}
          
          <div class="surface-container rounded-lg p-4 border-l-4 {serviceInstance.hasSetlist ? 'border-secondary' : serviceInstance.overdue ? 'border-error' : 'border-surface-container-high'}">
            <div class="flex justify-between items-start mb-2">
              <div>
                <h3 class="font-semibold text-surface-on flex items-center gap-2">
                  {service.title}
                  {#if serviceInstance.overdue}
                    <span class="inline-block w-2 h-2 bg-error rounded-full animate-pulse"></span>
                  {/if}
                </h3>
                <p class="text-surface-on-variant text-sm">
                  {formatDate(serviceInstance.date)} at {formatServiceTime(service.time)}
                </p>
                <p class="text-surface-on-variant text-xs">📍 {service.location}</p>
              </div>
              
              <div class="flex flex-col items-end gap-1">
                {#if serviceInstance.hasSetlist}
                  <span class="text-xs px-2 py-1 secondary-container text-secondary-container-on rounded">
                    Ready
                  </span>
                {:else if serviceInstance.overdue}
                  <span class="text-xs px-2 py-1 error-container text-error-container-on rounded">
                    Overdue
                  </span>
                {:else}
                  <span class="text-xs px-2 py-1 surface-container-high text-surface-on-variant rounded">
                    Pending
                  </span>
                {/if}
              </div>
            </div>
            
            {#if existingSetlist}
              <div class="flex items-center gap-2 text-sm mt-2">
                <svg class="w-4 h-4 text-secondary" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
                </svg>
                <span class="text-secondary">Setlist: {existingSetlist.title} ({existingSetlist.songs.length} songs)</span>
              </div>
              
              {#if existingSetlist.praiseLeader || existingSetlist.worshipLeader}
                <div class="text-xs text-surface-on-variant mt-1">
                  Leaders: 
                  {#if existingSetlist.praiseLeader}
                    Praise - {users[existingSetlist.praiseLeader]?.name}
                  {/if}
                  {#if existingSetlist.praiseLeader && existingSetlist.worshipLeader}, {/if}
                  {#if existingSetlist.worshipLeader}
                    Worship - {users[existingSetlist.worshipLeader]?.name}
                  {/if}
                </div>
              {/if}
            {:else}
              <div class="flex items-center justify-between text-sm mt-2">
                <div class="flex items-center gap-2">
                  <svg class="w-4 h-4 text-error" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/>
                  </svg>
                  <span class="text-error">No setlist created yet</span>
                </div>
                <a 
                  href="/setlists" 
                  class="text-xs px-2 py-1 primary-container text-primary-container-on rounded hover:shadow-md transition-shadow"
                >
                  Create Now
                </a>
              </div>
            {/if}
          </div>
        {/each}
      </div>
      
      <div class="mt-4 text-center">
        <a 
          href="/setlists" 
          class="text-sm text-primary hover:text-primary-container transition-colors"
        >
          View all upcoming services →
        </a>
      </div>
    {:else}
      <div class="text-center py-8 text-surface-on-variant">
        <span class="text-4xl mb-2 block">🗓️</span>
        <p>No upcoming services scheduled</p>
        <a href="/setlists" class="text-primary hover:underline text-sm">View scheduling →</a>
      </div>
    {/if}
  </div>
  
  <!-- Recent Setlists -->
  <div class="md-surface rounded-lg md-elevation-2 p-6">
    <h2 class="text-xl font-semibold mb-4 flex items-center">
      <span class="mr-2">🎼</span>
      Recent Setlists
    </h2>
    
    {#if recentSetlists.length > 0}
      <div class="space-y-4">
        {#each recentSetlists as setlist}
          {@const praiseSongs = setlist.songs.filter(s => s.section === 'praise')}
          {@const worshipSongs = setlist.songs.filter(s => s.section === 'worship')}
          
          <div class="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
            <div class="flex justify-between items-start mb-2">
              <h3 class="font-semibold text-gray-900">{setlist.title}</h3>
              <span class="text-sm text-gray-500">{new Date(setlist.date).toLocaleDateString()}</span>
            </div>
            
            <div class="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p class="font-medium text-purple-600 mb-1">Praise ({praiseSongs.length})</p>
                {#each praiseSongs.slice(0, 2) as songEntry}
                  {@const song = songs[songEntry.songId]}
                  <p class="text-gray-600 text-xs">• {song?.title || 'Unknown Song'}</p>
                {/each}
                {#if praiseSongs.length > 2}
                  <p class="text-gray-400 text-xs">+{praiseSongs.length - 2} more</p>
                {/if}
              </div>
              
              <div>
                <p class="font-medium text-purple-600 mb-1">Worship ({worshipSongs.length})</p>
                {#each worshipSongs.slice(0, 2) as songEntry}
                  {@const song = songs[songEntry.songId]}
                  <p class="text-gray-600 text-xs">• {song?.title || 'Unknown Song'}</p>
                {/each}
                {#if worshipSongs.length > 2}
                  <p class="text-gray-400 text-xs">+{worshipSongs.length - 2} more</p>
                {/if}
              </div>
            </div>
            
            {#if setlist.notes}
              <p class="text-xs text-gray-500 mt-2 italic">"{setlist.notes}"</p>
            {/if}
          </div>
        {/each}
      </div>
    {:else}
      <div class="text-center py-8 text-gray-500">
        <span class="text-4xl mb-2 block">🎵</span>
        <p>No setlists created yet</p>
        <a href="/setlists" class="text-purple-600 hover:underline text-sm">Create your first setlist</a>
      </div>
    {/if}
  </div>
</div>

<!-- Team Overview -->
<div class="mt-8 md-surface rounded-lg md-elevation-2 p-6">
  <h2 class="text-xl font-semibold mb-4 flex items-center">
    <span class="mr-2">🎯</span>
    Team Overview
  </h2>
  
  <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
    <!-- Worship Leaders -->
    <div class="text-center">
      <div class="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-2">
        <span class="text-2xl">🙏</span>
      </div>
      <p class="font-semibold">{worshipLeaders} Worship Leaders</p>
      <p class="text-sm text-gray-600">Available for worship sets</p>
    </div>
    
    <!-- Praise Leaders -->
    <div class="text-center">
      <div class="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-2">
        <span class="text-2xl">🎉</span>
      </div>
      <p class="font-semibold">{praiseLeaders} Praise Leaders</p>
      <p class="text-sm text-gray-600">Available for praise sets</p>
    </div>
    
    <!-- Musical Directors -->
    <div class="text-center">
      <div class="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
        <span class="text-2xl">🎼</span>
      </div>
      <p class="font-semibold">{musicalDirectors} Musical Directors</p>
      <p class="text-sm text-gray-600">Advanced transposition tools</p>
    </div>
  </div>
</div>

<!-- Quick Actions -->
<div class="mt-8 grid grid-cols-2 lg:grid-cols-4 gap-4">
  <a href="/setlists" class="md-primary text-white rounded-lg p-4 text-center hover:opacity-90 transition-opacity">
    <span class="text-2xl block mb-2">➕</span>
    <span class="text-sm font-medium">New Setlist</span>
  </a>
  
  <a href="/songs" class="md-secondary-container rounded-lg p-4 text-center hover:shadow-md transition-shadow">
    <span class="text-2xl block mb-2">🎵</span>
    <span class="text-sm font-medium">Browse Songs</span>
  </a>
  
  <a href="/calendar" class="md-secondary-container rounded-lg p-4 text-center hover:shadow-md transition-shadow">
    <span class="text-2xl block mb-2">📅</span>
    <span class="text-sm font-medium">Schedule</span>
  </a>
  
  <a href="/profile" class="md-secondary-container rounded-lg p-4 text-center hover:shadow-md transition-shadow">
    <span class="text-2xl block mb-2">⚙️</span>
    <span class="text-sm font-medium">Settings</span>
  </a>
</div>
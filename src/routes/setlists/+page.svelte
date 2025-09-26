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
    type RecurringService,
    type SetlistNotification
  } from '$lib/utils/scheduling';
  
  // Transform arrays to lookup objects
  const users = Object.fromEntries(data.users.map(u => [u.id, u]));
  const songs = Object.fromEntries(data.songs.map(s => [s.id, s]));
  const services = Object.fromEntries(data.recurringServices.map(s => [s.id, s]));
  const templates = Object.fromEntries(data.setlistTemplates.map(t => [t.id, t]));
  
  // Reactive state
  let notifications: SetlistNotification[] = $state(data.notifications as SetlistNotification[] || []);
  let activeNotifications: SetlistNotification[] = $state([]);
  let selectedService: RecurringService | null = $state(null);
  let showCreateModal = $state(false);
  let selectedTemplate: string = $state('');
  let selectedDate: string = $state('');
  
  // Filter states
  let filterStatus = $state('all'); // 'all', 'upcoming', 'past', 'needs-setlist'
  let sortBy = $state('date'); // 'date', 'service', 'status'
  
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
    
    activeNotifications = getActiveNotifications(notifications);
  });
  
  // Calculate upcoming services for the next month
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
  
  // Get filtered and sorted setlists/services
  function getFilteredServices() {
    const upcoming = getUpcomingServices();
    
    let filtered = upcoming;
    
    switch (filterStatus) {
      case 'upcoming':
        filtered = upcoming.filter(s => s.dateObj > new Date());
        break;
      case 'past':
        filtered = upcoming.filter(s => s.dateObj < new Date());
        break;
      case 'needs-setlist':
        filtered = upcoming.filter(s => !s.hasSetlist && s.dateObj > new Date());
        break;
    }
    
    return filtered;
  }
  
  function openCreateModal(service: RecurringService, date: string) {
    selectedService = service;
    selectedDate = date;
    
    // Auto-select appropriate template
    const serviceTemplates = data.setlistTemplates.filter(t => t.serviceType === service.type);
    selectedTemplate = serviceTemplates[0]?.id || '';
    
    showCreateModal = true;
  }
  
  function acknowledgeNotification(notificationId: string) {
    const index = notifications.findIndex(n => n.id === notificationId);
    if (index >= 0) {
      notifications[index].status = 'acknowledged';
      notifications = [...notifications];
      activeNotifications = getActiveNotifications(notifications);
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
  
  console.log('Setlists data:', { setlists: data.setlists, users, songs, services });
</script>

<div class="container mx-auto p-4 max-w-6xl">
  <header class="mb-6">
    <h1 class="text-2xl font-bold text-surface-on mb-2">Setlists & Scheduling</h1>
    <p class="text-surface-on-variant">Manage worship setlists and automatic service scheduling</p>
  </header>

  <!-- Active Notifications -->
  {#if activeNotifications.length > 0}
    <section class="mb-6">
      <h2 class="text-lg font-semibold text-surface-on mb-3 flex items-center gap-2">
        <span class="inline-block w-2 h-2 bg-error rounded-full animate-pulse"></span>
        Active Reminders
      </h2>
      
      <div class="grid gap-3 md:grid-cols-2">
        {#each activeNotifications as notification}
          {@const service = services[notification.serviceId]}
          <div class="surface-container-high rounded-lg p-4 border-l-4 border-error">
            <div class="flex justify-between items-start mb-2">
              <h3 class="font-medium text-surface-on">{service?.title}</h3>
              <button 
                class="text-xs px-2 py-1 surface-container rounded hover:surface-container-high transition-colors"
                onclick={() => acknowledgeNotification(notification.id)}
              >
                Acknowledge
              </button>
            </div>
            <p class="text-sm text-surface-on-variant mb-2">{notification.message}</p>
            <div class="flex justify-between items-center text-xs text-surface-on-variant">
              <span>Service: {formatDate(notification.targetDate)}</span>
              <span>Due: {Math.ceil((new Date(notification.targetDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} days</span>
            </div>
          </div>
        {/each}
      </div>
    </section>
  {/if}

  <!-- Filters and Controls -->
  <section class="mb-6 flex flex-wrap gap-4 items-center justify-between">
    <div class="flex gap-2">
      <select 
        bind:value={filterStatus}
        class="px-3 py-2 surface-container rounded-lg text-surface-on text-sm"
      >
        <option value="all">All Services</option>
        <option value="upcoming">Upcoming</option>
        <option value="needs-setlist">Needs Setlist</option>
        <option value="past">Past Services</option>
      </select>
      
      <select 
        bind:value={sortBy}
        class="px-3 py-2 surface-container rounded-lg text-surface-on text-sm"
      >
        <option value="date">Sort by Date</option>
        <option value="service">Sort by Service</option>
        <option value="status">Sort by Status</option>
      </select>
    </div>
    
    <button 
      class="px-4 py-2 primary-container text-primary-container-on rounded-lg hover:shadow-lg transition-shadow flex items-center gap-2"
      onclick={() => showCreateModal = true}
    >
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/>
      </svg>
      Create Setlist
    </button>
  </section>

  <!-- Recurring Services Schedule -->
  <section class="mb-6">
    <h2 class="text-lg font-semibold text-surface-on mb-3">Recurring Services</h2>
    
    <div class="grid gap-4 md:grid-cols-2">
      {#each data.recurringServices as service}
        <div class="surface-container rounded-lg p-4">
          <div class="flex justify-between items-start mb-3">
            <div>
              <h3 class="font-medium text-surface-on">{service.title}</h3>
              <p class="text-sm text-surface-on-variant">
                Every {getDayName(service.dayOfWeek)} at {formatServiceTime(service.time)}
              </p>
            </div>
            <span class="px-2 py-1 text-xs rounded {service.active ? 'secondary-container text-secondary-container-on' : 'surface-container-high text-surface-on-variant'}">
              {service.active ? 'Active' : 'Inactive'}
            </span>
          </div>
          
          <div class="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span class="text-surface-on-variant">Location:</span>
              <div class="text-surface-on">{service.location}</div>
            </div>
            <div>
              <span class="text-surface-on-variant">Duration:</span>
              <div class="text-surface-on">{service.defaultDuration} min</div>
            </div>
            <div>
              <span class="text-surface-on-variant">Setlist Reminder:</span>
              <div class="text-surface-on">{service.setlistReminderDays} days before</div>
            </div>
            <div>
              <span class="text-surface-on-variant">Team Reminder:</span>
              <div class="text-surface-on">{service.teamReminderDays} days before</div>
            </div>
          </div>
        </div>
      {/each}
    </div>
  </section>

  <!-- Upcoming Services & Setlists -->
  <section>
    <h2 class="text-lg font-semibold text-surface-on mb-3">Upcoming Services</h2>
    
    <div class="grid gap-4">
      {#each getFilteredServices() as serviceInstance}
        {@const service = services[serviceInstance.id]}
        {@const existingSetlist = data.setlists.find(s => s.id === serviceInstance.setlistId)}
        
        <article class="surface-container rounded-lg p-4 shadow-sm">
          <div class="flex justify-between items-start mb-3">
            <div>
              <h3 class="text-lg font-medium text-surface-on flex items-center gap-2">
                {service.title}
                {#if serviceInstance.overdue}
                  <span class="inline-block w-2 h-2 bg-error rounded-full animate-pulse"></span>
                {/if}
              </h3>
              <p class="text-surface-on-variant">
                {formatDate(serviceInstance.date)} at {formatServiceTime(service.time)} • {service.location}
              </p>
            </div>
            
            <div class="flex items-center gap-2">
              {#if serviceInstance.hasSetlist}
                <span class="px-2 py-1 text-xs secondary-container text-secondary-container-on rounded">
                  Setlist Ready
                </span>
              {:else if serviceInstance.overdue}
                <span class="px-2 py-1 text-xs error-container text-error-container-on rounded">
                  Overdue
                </span>
              {:else}
                <span class="px-2 py-1 text-xs surface-container-high text-surface-on-variant rounded">
                  Pending
                </span>
              {/if}
              
              <button 
                class="px-3 py-1 text-sm primary-container text-primary-container-on rounded hover:shadow-md transition-shadow"
                onclick={() => openCreateModal(service, serviceInstance.date)}
              >
                {serviceInstance.hasSetlist ? 'Edit' : 'Create'} Setlist
              </button>
            </div>
          </div>
          
          {#if existingSetlist}
            <!-- Show existing setlist preview -->
            <div class="border-t border-surface-container-high pt-3">
              <div class="grid md:grid-cols-2 gap-4">
                <div>
                  <h4 class="text-sm font-medium text-surface-on mb-2">Leaders</h4>
                  <div class="space-y-1 text-sm">
                    {#if existingSetlist.praiseLeader}
                      <div><span class="text-surface-on-variant">Praise:</span> {users[existingSetlist.praiseLeader]?.name}</div>
                    {/if}
                    {#if existingSetlist.worshipLeader}
                      <div><span class="text-surface-on-variant">Worship:</span> {users[existingSetlist.worshipLeader]?.name}</div>
                    {/if}
                  </div>
                </div>
                
                <div>
                  <h4 class="text-sm font-medium text-surface-on mb-2">Songs ({existingSetlist.songs.length})</h4>
                  <div class="space-y-1 max-h-24 overflow-y-auto">
                    {#each existingSetlist.songs.slice(0, 3) as songEntry}
                      {@const song = songs[songEntry.songId]}
                      <div class="text-sm text-surface-on-variant">
                        {song?.title} ({song?.originalKey}) • {songEntry.section}
                      </div>
                    {/each}
                    {#if existingSetlist.songs.length > 3}
                      <div class="text-xs text-surface-on-variant">
                        +{existingSetlist.songs.length - 3} more songs
                      </div>
                    {/if}
                  </div>
                </div>
              </div>
            </div>
          {:else}
            <!-- Show service requirements -->
            <div class="border-t border-surface-container-high pt-3">
              <div class="text-sm text-surface-on-variant">
                <span class="font-medium">Required roles:</span> {service.requiredRoles.join(', ')}
              </div>
              <div class="text-sm text-surface-on-variant mt-1">
                <span class="font-medium">Suggested template:</span> 
                {templates[data.setlistTemplates.find(t => t.serviceType === service.type)?.id || '']?.name || 'None available'}
              </div>
            </div>
          {/if}
        </article>
      {/each}
    </div>
  </section>

  <!-- Existing Setlists -->
  {#if data.setlists.length > 0}
    <section class="mt-8">
      <h2 class="text-lg font-semibold text-surface-on mb-3">All Setlists</h2>
      
      <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {#each data.setlists as setlist}
          <article class="surface-container rounded-lg p-4 shadow-sm">
            <h3 class="text-lg font-semibold text-surface-on mb-2">{setlist.title}</h3>
            <p class="text-sm text-surface-on-variant mb-3">{formatDate(setlist.date)}</p>
            
            <!-- Leaders -->
            <div class="mb-3">
              <h4 class="text-sm font-medium text-surface-on mb-1">Leaders</h4>
              <div class="space-y-1">
                {#if setlist.praiseLeader}
                  <div class="text-sm">
                    <span class="text-surface-on-variant">Praise:</span>
                    <span class="text-surface-on ml-1">{users[setlist.praiseLeader]?.name || 'Unknown'}</span>
                  </div>
                {/if}
                {#if setlist.worshipLeader}
                  <div class="text-sm">
                    <span class="text-surface-on-variant">Worship:</span>
                    <span class="text-surface-on ml-1">{users[setlist.worshipLeader]?.name || 'Unknown'}</span>
                  </div>
                {/if}
              </div>
            </div>
            
            <!-- Songs -->
            <div>
              <h4 class="text-sm font-medium text-surface-on mb-2">Songs ({setlist.songs.length})</h4>
              <div class="space-y-1 max-h-32 overflow-y-auto">
                {#each setlist.songs as songEntry}
                  {@const song = songs[songEntry.songId]}
                  <div class="text-sm p-2 surface-container-high rounded">
                    <div class="font-medium text-surface-on">{song?.title || 'Unknown Song'}</div>
                    <div class="text-surface-on-variant text-xs">
                      {song?.originalKey} • {songEntry.section}
                    </div>
                  </div>
                {/each}
              </div>
            </div>
          </article>
        {/each}
      </div>
    </section>
  {/if}
</div>

<!-- Create Setlist Modal -->
{#if showCreateModal}
  <div class="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
    <div class="surface rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
      <div class="p-6">
        <div class="flex justify-between items-center mb-4">
          <h2 class="text-xl font-semibold text-surface-on">
            {selectedService ? `Create Setlist: ${selectedService.title}` : 'Create Setlist'}
          </h2>
          <button 
            class="p-2 hover:surface-container rounded-full transition-colors"
            onclick={() => showCreateModal = false}
            aria-label="Close modal"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>
        
        {#if selectedService}
          <div class="mb-6 p-4 surface-container-low rounded-lg">
            <div class="grid md:grid-cols-2 gap-4 text-sm">
              <div>
                <span class="text-surface-on-variant">Service:</span>
                <div class="text-surface-on font-medium">{selectedService.title}</div>
              </div>
              <div>
                <span class="text-surface-on-variant">Date & Time:</span>
                <div class="text-surface-on font-medium">
                  {selectedDate ? formatDate(selectedDate) : 'Not selected'} at {formatServiceTime(selectedService.time)}
                </div>
              </div>
              <div>
                <span class="text-surface-on-variant">Location:</span>
                <div class="text-surface-on font-medium">{selectedService.location}</div>
              </div>
              <div>
                <span class="text-surface-on-variant">Duration:</span>
                <div class="text-surface-on font-medium">{selectedService.defaultDuration} minutes</div>
              </div>
            </div>
          </div>
        {/if}
        
        <!-- Template Selection -->
        <div class="mb-6">
          <label for="template-select" class="block text-sm font-medium text-surface-on mb-2">
            Choose Template
          </label>
          <select 
            id="template-select"
            bind:value={selectedTemplate}
            class="w-full px-3 py-2 surface-container rounded-lg text-surface-on"
          >
            <option value="">No Template (Start Fresh)</option>
            {#each data.setlistTemplates as template}
              {#if !selectedService || template.serviceType === selectedService.type}
                <option value={template.id}>
                  {template.name} ({template.totalSongs} songs, ~{template.estimatedDuration}min)
                </option>
              {/if}
            {/each}
          </select>
        </div>
        
        {#if selectedTemplate}
          {@const template = templates[selectedTemplate]}
          <div class="mb-6 p-4 surface-container-low rounded-lg">
            <h3 class="text-sm font-medium text-surface-on mb-3">Template Structure</h3>
            <div class="grid gap-2">
              {#each Object.entries(template.structure) as [sectionName, section]}
                <div class="flex justify-between items-center text-sm">
                  <span class="text-surface-on capitalize">{sectionName.replace('_', ' ')}</span>
                  <span class="text-surface-on-variant">
                    {section.count} {section.type} song{section.count !== 1 ? 's' : ''} ({section.tempo})
                  </span>
                </div>
              {/each}
            </div>
          </div>
        {/if}
        
        <div class="flex justify-end gap-3">
          <button 
            class="px-4 py-2 surface-container text-surface-on rounded-lg hover:surface-container-high transition-colors"
            onclick={() => showCreateModal = false}
          >
            Cancel
          </button>
          <button 
            class="px-4 py-2 primary text-primary-on rounded-lg hover:shadow-lg transition-shadow"
            onclick={() => {
              // TODO: Implement setlist creation logic
              console.log('Create setlist:', { selectedService, selectedDate, selectedTemplate });
              showCreateModal = false;
            }}
          >
            Create Setlist
          </button>
        </div>
      </div>
    </div>
  </div>
{/if}

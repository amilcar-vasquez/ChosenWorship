<script lang="ts">
  import data from '$lib/data/chosenWorship.json';
  import { CHROMATIC_SCALE, calculateTransposition, searchLyrics, WORSHIP_TAGS } from '$lib/utils/music';
  import { processBulkImport, generateSongTemplate, type BulkSongInput } from '$lib/utils/songImport';
  import SongPreferencesModal from '$lib/components/SongPreferencesModal.svelte';
  
  // Current user - in real app this would come from auth
  const currentUserId = 'user_neo123'; // Mock current user
  const currentUser = data.users.find(u => u.id === currentUserId);
  
  // Transform data
  const users = Object.fromEntries(data.users.map(u => [u.id, u]));
  const userPrefs = Object.fromEntries(
    data.userSongPreferences.map(p => [`${p.userId}_${p.songId}`, p.preferredNote])
  );
  
  // Reactive search and filters
  let searchQuery = '';
  let selectedTags: string[] = [];
  let selectedKey = '';
  let sortBy = 'title'; // 'title', 'date', 'key'
  let showAddForm = false;
  let showBulkImport = false;
  let showPreferencesModal = false;
  let selectedSongForPrefs: any = null;
  
  // Available tags and keys for filters
  const allTags = [...new Set(data.songs.flatMap(s => s.tags))].sort();
  
  // New song form
  let newSong = {
    title: '',
    originalNote: 'C',
    tags: [] as string[],
    lyricsUrl: '',
    newTag: ''
  };
  
  // Bulk import
  let bulkImportText = '';
  let importResults: any = null;
  
  // Filter and search logic
  $: filteredSongs = data.songs
    .filter(song => {
      const matchesSearch = song.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          song.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesTags = selectedTags.length === 0 || selectedTags.every(tag => song.tags.includes(tag));
      const matchesKey = !selectedKey || song.originalKey === selectedKey;
      return matchesSearch && matchesTags && matchesKey;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'date':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'key':
          return CHROMATIC_SCALE.indexOf(a.originalKey) - CHROMATIC_SCALE.indexOf(b.originalKey);
        default:
          return a.title.localeCompare(b.title);
      }
    });
    
  // Get user's preferred key for a song
  function getUserPreferredKey(songId: string): string {
    const prefKey = userPrefs[`${currentUserId}_${songId}`];
    return prefKey || currentUser?.defaultPreferredNote || 'C';
  }
  
  // Toggle tag selection
  function toggleTag(tag: string) {
    if (selectedTags.includes(tag)) {
      selectedTags = selectedTags.filter(t => t !== tag);
    } else {
      selectedTags = [...selectedTags, tag];
    }
  }
  
  // Add new tag to song form
  function addNewTag() {
    if (newSong.newTag && !newSong.tags.includes(newSong.newTag)) {
      newSong.tags = [...newSong.tags, newSong.newTag];
      newSong.newTag = '';
    }
  }
  
  // Add suggested worship tag
  function addSuggestedTag(tag: string) {
    if (!newSong.tags.includes(tag)) {
      newSong.tags = [...newSong.tags, tag];
    }
  }
  
  // Open lyrics search
  async function openLyricsSearch(title: string) {
    try {
      const results = await searchLyrics(title);
      // Open the first result (CCLI SongSelect for worship songs)
      if (results.length > 0) {
        window.open(results[0].url, '_blank');
      }
    } catch (error) {
      console.error('Error searching lyrics:', error);
      // Fallback to Google search
      const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(title + ' lyrics')}`;
      window.open(searchUrl, '_blank');
    }
  }
  
  // Open song preferences modal
  function openPreferences(song: any) {
    selectedSongForPrefs = song;
    showPreferencesModal = true;
  }
  
  // Save user preference
  function saveUserPreference(songId: string, newKey: string) {
    // In real app: POST to API endpoint
    console.log(`Saving preference: Song ${songId} -> Key ${newKey}`);
    alert(`Preference saved: ${newKey} for this song!`);
    // Update local state
    userPrefs[`${currentUserId}_${songId}`] = newKey;
  }
  
  // Mock function to simulate adding a song
  function addSong() {
    console.log('Adding song:', newSong);
    // In real app: POST to API endpoint
    alert('Song would be added to database!');
    showAddForm = false;
    newSong = { title: '', originalNote: 'C', tags: [], lyricsUrl: '', newTag: '' };
  }
  
  // Process bulk import
  function processBulkSongImport() {
    try {
      const songs: BulkSongInput[] = JSON.parse(`[${bulkImportText}]`);
      importResults = processBulkImport(songs, data.songs);
      console.log('Import Results:', importResults);
      
      if (importResults.success) {
        alert(`Successfully processed ${importResults.imported.length} songs!`);
      } else {
        alert(`Import completed with ${importResults.errors.length} errors. Check the results below.`);
      }
    } catch (error) {
      alert('Invalid JSON format. Please check your song data format.');
      console.error('Import error:', error);
    }
  }
  
  // Generate template
  function copyTemplate() {
    const template = generateSongTemplate();
    navigator.clipboard.writeText(template).then(() => {
      alert('Template copied to clipboard!');
    });
  }
</script>

<svelte:head>
  <title>Songs - ChosenWorship</title>
</svelte:head>

<!-- Header with Actions -->
<div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
  <div>
    <h1 class="text-3xl font-bold text-gray-900">Songs Library 🎵</h1>
    <p class="text-gray-600 mt-1">{filteredSongs.length} of {data.songs.length} songs</p>
  </div>
  
  <div class="flex gap-2">
    <button 
      class="md-secondary-container px-4 py-2 rounded-lg md-elevation-1 hover:md-elevation-2 transition-shadow flex items-center gap-2"
      on:click={() => showBulkImport = !showBulkImport}
    >
      <span>📥</span>
      Bulk Import
    </button>
    <button 
      class="md-primary text-white px-4 py-2 rounded-lg md-elevation-1 hover:opacity-90 transition-opacity flex items-center gap-2"
      on:click={() => showAddForm = !showAddForm}
    >
      <span>➕</span>
      Add Song
    </button>
  </div>
</div>

<!-- Search and Filters -->
<div class="md-surface rounded-lg p-4 mb-6 md-elevation-1">
  <!-- Search Bar -->
  <div class="mb-4">
    <label for="search" class="block text-sm font-medium text-gray-700 mb-2">Search Songs</label>
    <input 
      id="search"
      type="text" 
      bind:value={searchQuery}
      placeholder="Search by title or tags..."
      class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
    >
  </div>
  
  <!-- Filter Controls -->
  <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
    <!-- Tags Filter -->
    <div>
      <span class="block text-sm font-medium text-gray-700 mb-2">Tags</span>
      <div class="flex flex-wrap gap-2">
        {#each allTags as tag}
          <button 
            class="px-3 py-1 text-sm rounded-full border transition-colors
              {selectedTags.includes(tag) 
                ? 'bg-purple-100 border-purple-300 text-purple-700' 
                : 'border-gray-300 hover:border-purple-300'
              }"
            on:click={() => toggleTag(tag)}
          >
            {tag}
          </button>
        {/each}
      </div>
    </div>
    
    <!-- Key Filter -->
    <div>
      <label for="keyFilter" class="block text-sm font-medium text-gray-700 mb-2">Original Key</label>
      <select 
        id="keyFilter"
        bind:value={selectedKey}
        class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
      >
        <option value="">All Keys</option>
        {#each CHROMATIC_SCALE as key}
          <option value={key}>{key}</option>
        {/each}
      </select>
    </div>
    
    <!-- Sort By -->
    <div>
      <label for="sortBy" class="block text-sm font-medium text-gray-700 mb-2">Sort By</label>
      <select 
        id="sortBy"
        bind:value={sortBy}
        class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
      >
        <option value="title">Title (A-Z)</option>
        <option value="date">Recently Added</option>
        <option value="key">Original Key</option>
      </select>
    </div>
  </div>
  
  <!-- Clear Filters -->
  {#if searchQuery || selectedTags.length > 0 || selectedKey}
    <button 
      class="mt-4 text-purple-600 hover:text-purple-800 text-sm font-medium"
      on:click={() => { searchQuery = ''; selectedTags = []; selectedKey = ''; }}
    >
      Clear all filters
    </button>
  {/if}
</div>

<!-- Add Song Form -->
{#if showAddForm}
  <div class="md-surface rounded-lg p-6 mb-6 md-elevation-2 border border-purple-200">
    <h2 class="text-xl font-semibold mb-4 flex items-center">
      <span class="mr-2">🎵</span>
      Add New Song
    </h2>
    
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <label for="songTitle" class="block text-sm font-medium text-gray-700 mb-2">Song Title *</label>
        <input 
          id="songTitle"
          type="text" 
          bind:value={newSong.title}
          placeholder="Enter song title..."
          class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
        >
      </div>
      
      <div>
        <label for="songKey" class="block text-sm font-medium text-gray-700 mb-2">Original Key *</label>
        <select 
          id="songKey"
          bind:value={newSong.originalNote}
          class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
        >
          {#each CHROMATIC_SCALE as key}
            <option value={key}>{key}</option>
          {/each}
        </select>
      </div>
      
      <div class="md:col-span-2">
        <label for="lyricsUrl" class="block text-sm font-medium text-gray-700 mb-2">Lyrics URL</label>
        <div class="flex gap-2">
          <input 
            id="lyricsUrl"
            type="url" 
            bind:value={newSong.lyricsUrl}
            placeholder="https://..."
            class="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
          >
          <button 
            class="px-4 py-2 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 transition-colors"
            on:click={() => openLyricsSearch(newSong.title)}
            disabled={!newSong.title}
            title="Search for lyrics"
          >
            🔍
          </button>
        </div>
      </div>
      
      <div class="md:col-span-2">
        <span class="block text-sm font-medium text-gray-700 mb-2">Tags</span>
        <div class="flex flex-wrap gap-2 mb-2">
          {#each newSong.tags as tag}
            <span class="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm flex items-center gap-2">
              {tag}
              <button 
                class="text-purple-500 hover:text-purple-700"
                on:click={() => newSong.tags = newSong.tags.filter(t => t !== tag)}
              >
                ×
              </button>
            </span>
          {/each}
        </div>
        <div class="flex gap-2">
          <input 
            type="text" 
            bind:value={newSong.newTag}
            placeholder="Add tag..."
            class="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
            on:keydown={(e) => e.key === 'Enter' && addNewTag()}
          >
          <button 
            class="px-4 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors"
            on:click={addNewTag}
            disabled={!newSong.newTag}
          >
            Add
          </button>
        </div>
        
        <!-- Suggested Tags -->
        <div class="mt-2">
          <p class="text-xs text-gray-600 mb-2">Suggested:</p>
          <div class="flex flex-wrap gap-1">
            {#each WORSHIP_TAGS.slice(0, 8) as tag}
              <button 
                class="px-2 py-1 text-xs bg-gray-100 hover:bg-purple-100 rounded transition-colors
                  {newSong.tags.includes(tag) ? 'bg-purple-100 text-purple-700' : 'text-gray-600'}"
                on:click={() => addSuggestedTag(tag)}
                disabled={newSong.tags.includes(tag)}
              >
                {tag}
              </button>
            {/each}
          </div>
        </div>
      </div>
    </div>
    
    <div class="flex justify-end gap-3 mt-6">
      <button 
        class="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        on:click={() => { showAddForm = false; newSong = { title: '', originalNote: 'C', tags: [], lyricsUrl: '', newTag: '' }; }}
      >
        Cancel
      </button>
      <button 
        class="md-primary text-white px-4 py-2 rounded-lg hover:opacity-90 transition-opacity"
        on:click={addSong}
        disabled={!newSong.title}
      >
        Add Song
      </button>
    </div>
  </div>
{/if}

<!-- Bulk Import Form -->
{#if showBulkImport}
  <div class="md-surface rounded-lg p-6 mb-6 md-elevation-2 border border-blue-200">
    <h2 class="text-xl font-semibold mb-4 flex items-center">
      <span class="mr-2">📥</span>
      Bulk Import Songs
    </h2>
    
    <div class="mb-4 p-4 bg-blue-50 rounded-lg">
      <h3 class="font-semibold text-blue-900 mb-2">How to Add Your Church's Songs:</h3>
      <div class="text-sm text-blue-800 space-y-2">
        <p><strong>Step 1:</strong> Copy the template below and fill in your song details</p>
        <p><strong>Step 2:</strong> Add multiple songs by copying the template for each song</p>
        <p><strong>Step 3:</strong> Paste all songs in the text area and click "Import Songs"</p>
      </div>
    </div>
    
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- Template and Instructions -->
      <div>
        <div class="flex justify-between items-center mb-2">
          <h3 class="block text-sm font-medium text-gray-700">Song Template</h3>
          <button 
            class="px-3 py-1 bg-blue-100 text-blue-700 rounded text-sm hover:bg-blue-200 transition-colors"
            on:click={copyTemplate}
          >
            📋 Copy Template
          </button>
        </div>
        
        <div class="bg-gray-50 rounded-lg p-4 text-sm font-mono overflow-x-auto">
          <pre>{generateSongTemplate()}</pre>
        </div>
        
        <div class="mt-4 text-xs text-gray-600">
          <p><strong>Required:</strong> title, originalKey</p>
          <p><strong>Optional:</strong> tags, artist, lyricsUrl, ccliNumber, notes</p>
          <p><strong>Keys:</strong> C, C#/Db, D, D#/Eb, E, F, F#/Gb, G, G#/Ab, A, A#/Bb, B</p>
        </div>
        
        <!-- Common Tags Reference -->
        <div class="mt-4">
          <p class="text-sm font-medium text-gray-700 mb-2">Common Tags:</p>
          <div class="flex flex-wrap gap-1 text-xs">
            {#each WORSHIP_TAGS.slice(0, 12) as tag}
              <span class="px-2 py-1 bg-gray-100 rounded">{tag}</span>
            {/each}
          </div>
        </div>
      </div>
      
      <!-- Import Area -->
      <div>
        <label for="bulkImport" class="block text-sm font-medium text-gray-700 mb-2">
          Your Songs (JSON Format)
        </label>
        <textarea 
          id="bulkImport"
          bind:value={bulkImportText}
          placeholder="Paste your song JSON objects here, separated by commas..."
          class="w-full h-64 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-mono text-sm"
        ></textarea>
        
        <div class="flex justify-between items-center mt-4">
          <div class="text-sm text-gray-600">
            {#if bulkImportText.trim()}
              <span class="text-green-600">✓</span> Ready to import
            {:else}
              Paste your song data above
            {/if}
          </div>
          
          <div class="flex gap-3">
            <button 
              class="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              on:click={() => { showBulkImport = false; bulkImportText = ''; importResults = null; }}
            >
              Cancel
            </button>
            <button 
              class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              on:click={processBulkSongImport}
              disabled={!bulkImportText.trim()}
            >
              Import Songs
            </button>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Import Results -->
    {#if importResults}
      <div class="mt-6 p-4 border rounded-lg {importResults.success ? 'border-green-200 bg-green-50' : 'border-orange-200 bg-orange-50'}">
        <h4 class="font-semibold mb-3 {importResults.success ? 'text-green-900' : 'text-orange-900'}">
          Import Results
        </h4>
        
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div class="text-center">
            <p class="text-2xl font-bold text-green-600">{importResults.imported.length}</p>
            <p class="text-sm text-gray-600">Successfully Imported</p>
          </div>
          <div class="text-center">
            <p class="text-2xl font-bold text-orange-600">{importResults.errors.length}</p>
            <p class="text-sm text-gray-600">Errors</p>
          </div>
          <div class="text-center">
            <p class="text-2xl font-bold text-blue-600">{importResults.duplicates.length}</p>
            <p class="text-sm text-gray-600">Duplicates Skipped</p>
          </div>
        </div>
        
        <!-- Error Details -->
        {#if importResults.errors.length > 0}
          <div class="mb-4">
            <h5 class="font-medium text-red-900 mb-2">Errors to Fix:</h5>
            <div class="space-y-2">
              {#each importResults.errors as error}
                <div class="bg-red-50 border border-red-200 rounded p-3">
                  <p class="font-medium text-red-900">"{error.song.title}"</p>
                  <ul class="text-sm text-red-700 mt-1">
                    {#each error.errors as errorMsg}
                      <li>• {errorMsg}</li>
                    {/each}
                  </ul>
                </div>
              {/each}
            </div>
          </div>
        {/if}
        
        <!-- Duplicate Details -->
        {#if importResults.duplicates.length > 0}
          <div class="mb-4">
            <h5 class="font-medium text-blue-900 mb-2">Duplicates Skipped:</h5>
            <div class="flex flex-wrap gap-2">
              {#each importResults.duplicates as duplicate}
                <span class="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm">"{duplicate}"</span>
              {/each}
            </div>
          </div>
        {/if}
        
        {#if importResults.success}
          <p class="text-green-700 text-sm">
            🎉 All songs imported successfully! They would now appear in your songs library.
          </p>
        {/if}
      </div>
    {/if}
  </div>
{/if}

<!-- Songs Grid -->
{#if filteredSongs.length > 0}
  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
    {#each filteredSongs as song}
      {@const userPreferredKey = getUserPreferredKey(song.id)}
      {@const transposition = calculateTransposition(song.originalKey, userPreferredKey)}
      
      <div class="md-surface rounded-lg p-4 md-elevation-1 hover:md-elevation-2 transition-shadow border border-gray-200">
        <!-- Song Header -->
        <div class="flex justify-between items-start mb-3">
          <h3 class="font-semibold text-lg text-gray-900 leading-tight">{song.title}</h3>
          <div class="flex gap-1 ml-2">
            {#if song.lyricsUrl}
              <a 
                href={song.lyricsUrl} 
                target="_blank" 
                class="text-purple-600 hover:text-purple-800 text-sm"
                title="View lyrics"
              >
                🔗
              </a>
            {/if}
          </div>
        </div>
        
        <!-- Key Information -->
        <div class="mb-3">
          <div class="flex items-center justify-between text-sm">
            <div>
              <span class="text-gray-600">Original:</span>
              <span class="font-semibold text-gray-900 ml-1">{song.originalKey}</span>
            </div>
            
            {#if currentUser}
              <div class="text-right">
                <span class="text-gray-600">Your key:</span>
                <span class="font-semibold ml-1 {transposition.semitones === 0 ? 'text-green-600' : 'text-purple-600'}">
                  {userPreferredKey}
                </span>
                {#if transposition.semitones !== 0}
                  <div class="text-xs text-gray-500">
                    {transposition.direction === 'up' ? '↑' : '↓'} {transposition.semitones} semitones
                  </div>
                {/if}
              </div>
            {/if}
          </div>
        </div>
        
        <!-- Tags -->
        <div class="mb-3">
          <div class="flex flex-wrap gap-1">
            {#each song.tags as tag}
              <span class="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs">
                {tag}
              </span>
            {/each}
          </div>
        </div>
        
        <!-- Song Metadata -->
        <div class="text-xs text-gray-500 mb-3">
          Added by {users[song.addedBy]?.name || 'Unknown'} • 
          {new Date(song.createdAt).toLocaleDateString()}
        </div>
        
        <!-- Actions -->
        <div class="flex justify-between items-center pt-3 border-t border-gray-100">
          <div class="flex gap-2">
            <button 
              class="text-purple-600 hover:text-purple-800 text-sm font-medium"
              on:click={() => openPreferences(song)}
            >
              ⚙️ Preferences
            </button>
          </div>
          
          <div class="flex gap-2">
            {#if song.lyricsUrl}
              <a 
                href={song.lyricsUrl} 
                target="_blank"
                class="px-3 py-1 bg-purple-100 text-purple-700 rounded text-sm hover:bg-purple-200 transition-colors"
              >
                View Lyrics
              </a>
            {:else}
              <button 
                class="px-3 py-1 bg-gray-100 text-gray-600 rounded text-sm hover:bg-gray-200 transition-colors"
                on:click={() => openLyricsSearch(song.title)}
              >
                Find Lyrics
              </button>
            {/if}
          </div>
        </div>
      </div>
    {/each}
  </div>
{:else}
  <div class="text-center py-12">
    <span class="text-6xl mb-4 block">🎵</span>
    <h3 class="text-xl font-semibold text-gray-900 mb-2">No songs found</h3>
    <p class="text-gray-600 mb-4">
      {#if searchQuery || selectedTags.length > 0 || selectedKey}
        Try adjusting your filters or search terms.
      {:else}
        Start building your song library by adding your first song.
      {/if}
    </p>
    
    {#if searchQuery || selectedTags.length > 0 || selectedKey}
      <button 
        class="text-purple-600 hover:text-purple-800 font-medium"
        on:click={() => { searchQuery = ''; selectedTags = []; selectedKey = ''; }}
      >
        Clear filters
      </button>
    {:else}
      <button 
        class="md-primary text-white px-4 py-2 rounded-lg hover:opacity-90 transition-opacity"
        on:click={() => showAddForm = true}
      >
        Add Your First Song
      </button>
    {/if}
  </div>
{/if}

<!-- Song Preferences Modal -->
{#if showPreferencesModal && selectedSongForPrefs}
  <SongPreferencesModal
    song={selectedSongForPrefs}
    currentUserPreference={getUserPreferredKey(selectedSongForPrefs.id)}
    onClose={() => { showPreferencesModal = false; selectedSongForPrefs = null; }}
    onSave={(newKey) => saveUserPreference(selectedSongForPrefs.id, newKey)}
  />
{/if}

<!-- Quick Stats Footer -->
<div class="mt-8 pt-6 border-t border-gray-200">
  <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
    <div>
      <p class="text-2xl font-bold text-purple-600">{data.songs.length}</p>
      <p class="text-sm text-gray-600">Total Songs</p>
    </div>
    <div>
      <p class="text-2xl font-bold text-purple-600">{allTags.length}</p>
      <p class="text-sm text-gray-600">Unique Tags</p>
    </div>
    <div>
      <p class="text-2xl font-bold text-purple-600">{new Set(data.songs.map(s => s.originalKey)).size}</p>
      <p class="text-sm text-gray-600">Different Keys</p>
    </div>
    <div>
      <p class="text-2xl font-bold text-purple-600">{data.songs.filter(s => s.lyricsUrl).length}</p>
      <p class="text-sm text-gray-600">With Lyrics</p>
    </div>
  </div>
</div>

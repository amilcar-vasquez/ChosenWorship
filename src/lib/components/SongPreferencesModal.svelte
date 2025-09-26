<script lang="ts">
  import { CHROMATIC_SCALE, calculateTransposition } from '$lib/utils/music';
  import type { TranspositionInfo } from '$lib/utils/music';
  
  export let song: any;
  export let currentUserPreference: string;
  export let onClose: () => void;
  export let onSave: (newKey: string) => void;
  
  let selectedKey = currentUserPreference;
  let transpositionInfo: TranspositionInfo;
  
  $: {
    if (selectedKey) {
      transpositionInfo = calculateTransposition(song.originalNote, selectedKey);
    }
  }
  
  function handleSave() {
    onSave(selectedKey);
    onClose();
  }
  
  function handleKeyDown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      onClose();
    }
  }
</script>

<svelte:window on:keydown={handleKeyDown} />

<!-- Modal Backdrop -->
<div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" on:click={onClose}>
  <!-- Modal Content -->
  <div class="md-surface rounded-lg max-w-md w-full p-6 md-elevation-3" on:click|stopPropagation>
    <!-- Header -->
    <div class="flex justify-between items-start mb-4">
      <div>
        <h3 class="text-lg font-semibold text-gray-900">Key Preferences</h3>
        <p class="text-sm text-gray-600">Set your preferred key for "{song.title}"</p>
      </div>
      <button 
        class="text-gray-400 hover:text-gray-600 text-xl leading-none"
        on:click={onClose}
      >
        ×
      </button>
    </div>
    
    <!-- Song Info -->
    <div class="bg-gray-50 rounded-lg p-3 mb-4">
      <div class="flex justify-between items-center text-sm">
        <span class="text-gray-600">Original Key:</span>
        <span class="font-semibold">{song.originalNote}</span>
      </div>
    </div>
    
    <!-- Key Selection -->
    <div class="mb-4">
      <label class="block text-sm font-medium text-gray-700 mb-3">Your Preferred Key</label>
      <div class="grid grid-cols-4 gap-2">
        {#each CHROMATIC_SCALE as key}
          <button 
            class="p-3 text-center border rounded-lg font-medium transition-colors
              {selectedKey === key 
                ? 'bg-purple-600 text-white border-purple-600' 
                : 'border-gray-300 hover:border-purple-300 hover:bg-purple-50'
              }"
            on:click={() => selectedKey = key}
          >
            {key}
          </button>
        {/each}
      </div>
    </div>
    
    <!-- Transposition Info -->
    {#if transpositionInfo}
      <div class="mb-6 p-3 bg-blue-50 rounded-lg">
        <div class="flex items-center justify-between mb-2">
          <span class="text-sm font-medium text-blue-900">Transposition</span>
          <span class="text-sm text-blue-700">{transpositionInfo.description}</span>
        </div>
        
        {#if transpositionInfo.capoSuggestion}
          <div class="flex items-center gap-2 text-sm text-blue-700">
            <span class="bg-blue-200 px-2 py-1 rounded text-xs font-medium">🎸 Guitar</span>
            <span>Capo fret {transpositionInfo.capoSuggestion}</span>
          </div>
        {/if}
        
        {#if transpositionInfo.semitones === 0}
          <div class="flex items-center gap-2 text-sm text-green-700">
            <span class="bg-green-200 px-2 py-1 rounded text-xs font-medium">✓</span>
            <span>No transposition needed</span>
          </div>
        {/if}
      </div>
    {/if}
    
    <!-- Actions -->
    <div class="flex justify-end gap-3">
      <button 
        class="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        on:click={onClose}
      >
        Cancel
      </button>
      <button 
        class="md-primary text-white px-4 py-2 rounded-lg hover:opacity-90 transition-opacity"
        on:click={handleSave}
      >
        Save Preference
      </button>
    </div>
  </div>
</div>

<style>
  /* Prevent body scroll when modal is open */
  :global(body:has(.modal-open)) {
    overflow: hidden;
  }
</style>
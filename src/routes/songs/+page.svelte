<script lang="ts">
  import data from '$lib/data/chosenWorship.json';
  let songs = data.songs;
</script>

<h1 class="text-2xl font-bold mb-4">Songs</h1>
<ul>
  {#each songs as song}
    <li class="mb-2 border p-2 rounded">
      <div class="font-semibold">{song.title}</div>
      <div>Original Note: {song.originalNote}</div>
      <div><a href={song.lyricsUrl} target="_blank" class="text-blue-600">View Lyrics</a></div>
    </li>
  {/each}
</ul>

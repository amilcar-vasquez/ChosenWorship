<script lang="ts">
  import data from '$lib/data/chosenWorship.json';
  const setlists = data.setlists;
  const users = Object.fromEntries(data.users.map(u => [u.id, u]));
  const songs = Object.fromEntries(data.songs.map(s => [s.id, s]));
</script>

<h1 class="text-2xl font-bold mb-4">Setlists</h1>

{#each setlists as set}
  <div class="mb-4 border p-4 rounded">
    <h2 class="text-xl font-semibold">{set.title} ({set.date})</h2>
    <p><strong>Praise Leader:</strong> {users[set.assignedPraiseLeader]?.name}</p>
    <p><strong>Worship Leader:</strong> {users[set.assignedWorshipLeader]?.name}</p>

    <div class="mt-2">
      <h3 class="font-bold">Praise Songs:</h3>
      <ul>
        {#each set.praise as sid}
          <li>{songs[sid]?.title}</li>
        {/each}
      </ul>
    </div>

    <div class="mt-2">
      <h3 class="font-bold">Worship Songs:</h3>
      <ul>
        {#each set.worship as sid}
          <li>{songs[sid]?.title}</li>
        {/each}
      </ul>
    </div>

    <p class="text-sm mt-2 italic">{set.notes}</p>
  </div>
{/each}

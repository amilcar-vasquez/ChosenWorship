<script>
  import "../app.css";
</script>

<nav class="bg-gray-800 text-white p-4">
  <ul class="flex gap-4">
    <li><a href="/songs" class="hover:underline">Songs</a></li>
    <li><a href="/setlists" class="hover:underline">Setlists</a></li>
    <li><a href="/calendar" class="hover:underline">Calendar</a></li>
    <li><a href="/profile" class="hover:underline">Profile</a></li>
  </ul>
</nav>

<main class="p-4">
  <slot />
</main>

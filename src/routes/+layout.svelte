<script>
  import "../app.css";
  import { page } from '$app/stores';
  
  const navItems = [
    { href: '/dashboard', label: 'Dashboard', icon: '🏠' },
    { href: '/songs', label: 'Songs', icon: '🎵' },
    { href: '/setlists', label: 'Setlists', icon: '📋' },
    { href: '/calendar', label: 'Calendar', icon: '📅' },
    { href: '/profile', label: 'Profile', icon: '👤' }
  ];
</script>

<!-- Top App Bar for Desktop -->
<header class="hidden md:block md-primary text-white shadow-md">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div class="flex justify-between items-center h-16">
      <div class="flex items-center">
        <h1 class="text-xl font-semibold">🎶 ChosenWorship</h1>
      </div>
      <nav>
        <div class="flex space-x-8">
          {#each navItems as item}
            <a 
              href={item.href} 
              class="px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 {$page.url.pathname === item.href ? 'bg-white/20' : 'hover:bg-white/10'}"
            >
              {item.icon} {item.label}
            </a>
          {/each}
        </div>
      </nav>
    </div>
  </div>
</header>

<!-- Main Content -->
<main class="flex-1 overflow-y-auto pb-16 md:pb-0">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
    <slot />
  </div>
</main>

<!-- Bottom Navigation for Mobile -->
<nav class="fixed bottom-0 left-0 right-0 md:hidden md-surface border-t border-gray-200 md-elevation-2">
  <div class="grid grid-cols-5 h-16">
    {#each navItems as item}
      <a 
        href={item.href}
        class="flex flex-col items-center justify-center space-y-1 transition-colors duration-200 {$page.url.pathname === item.href ? 'text-purple-600' : 'text-gray-500 active:text-purple-600'}"
      >
        <span class="text-lg">{item.icon}</span>
        <span class="text-xs font-medium">{item.label}</span>
      </a>
    {/each}
  </div>
</nav>

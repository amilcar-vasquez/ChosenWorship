<!-- Notification/Alert component for reminders -->
<script lang="ts">
  interface NotificationProps {
    type?: 'info' | 'warning' | 'error' | 'success';
    title: string;
    message?: string;
    actions?: Array<{
      label: string;
      action: () => void;
      variant: 'primary' | 'secondary';
    }>;
    onDismiss?: () => void;
    dismissible?: boolean;
  }
  
  let {
    type = 'info',
    title,
    message,
    actions = [],
    onDismiss,
    dismissible = true
  }: NotificationProps = $props();
  
  const typeStyles = {
    info: {
      container: 'surface-container border-l-4 border-primary',
      icon: '📋',
      iconColor: 'text-primary'
    },
    warning: {
      container: 'tertiary-container border-l-4 border-tertiary',
      icon: '⚠️',
      iconColor: 'text-tertiary-container-on'
    },
    error: {
      container: 'error-container border-l-4 border-error',
      icon: '🚨',
      iconColor: 'text-error-container-on'
    },
    success: {
      container: 'secondary-container border-l-4 border-secondary',
      icon: '✅',
      iconColor: 'text-secondary-container-on'
    }
  };
  
  const styles = typeStyles[type];
</script>

<div class="{styles.container} rounded-lg p-4 shadow-sm animate-slideIn">
  <div class="flex items-start gap-3">
    <!-- Icon -->
    <div class="flex-shrink-0 mt-0.5">
      <span class="text-lg">{styles.icon}</span>
    </div>
    
    <!-- Content -->
    <div class="flex-1 min-w-0">
      <div class="flex items-start justify-between">
        <div class="flex-1">
          <h4 class="font-medium text-surface-on text-sm">{title}</h4>
          {#if message}
            <p class="text-surface-on-variant text-sm mt-1">{message}</p>
          {/if}
        </div>
        
        <!-- Dismiss button -->
        {#if dismissible && onDismiss}
          <button 
            class="ml-4 flex-shrink-0 p-1 hover:surface-container-high rounded transition-colors"
            onclick={onDismiss}
            aria-label="Dismiss notification"
          >
            <svg class="w-4 h-4 text-surface-on-variant" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        {/if}
      </div>
      
      <!-- Actions -->
      {#if actions.length > 0}
        <div class="flex gap-2 mt-3">
          {#each actions as action}
            <button 
              class="text-xs px-3 py-1 rounded transition-shadow {action.variant === 'primary' ? 'primary text-primary-on hover:shadow-md' : 'surface-container text-surface-on hover:surface-container-high'}"
              onclick={action.action}
            >
              {action.label}
            </button>
          {/each}
        </div>
      {/if}
    </div>
  </div>
</div>

<style>
  @keyframes slideIn {
    from {
      opacity: 0;
      transform: translateY(-10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  .animate-slideIn {
    animation: slideIn 0.3s ease-out;
  }
</style>
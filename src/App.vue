<script setup>
import { RouterLink, RouterView } from 'vue-router'
import { useBoardStore } from '@/stores/useBoardStore'

const boardStore = useBoardStore()
</script>

<template>
  <div class="app-shell">
    <header class="app-navbar">
      <div class="brand-lockup">
        <span class="brand-logo" aria-hidden="true">🏀</span>
        <div>
          <span class="brand-name">CourtVision</span>
          <span class="brand-tagline">Virtual Dry-Erase Basketball Board</span>
        </div>
      </div>

      <nav class="main-nav" aria-label="Primary Navigation">
        <RouterLink to="/" class="nav-link" exact-active-class="active">
          🖊️ Coaching Board
        </RouterLink>
        <RouterLink to="/playbook" class="nav-link" active-class="active">
          📚 Playbook ({{ boardStore.savedPlays.length }})
        </RouterLink>
      </nav>
    </header>

    <RouterView />
  </div>
</template>

<style scoped>
.app-shell {
  min-block-size: 100dvb;
  display: flex;
  flex-direction: column;
}

.app-navbar {
  display: flex;
  flex-wrap: wrap;
  align-items: safe center;
  justify-content: space-between;
  gap: 0.75rem;
  padding-block: 0.65rem;
  padding-inline: 1.25rem;
  background-color: #090d16;
  border-block-end: 1px solid var(--border-color);
}

.brand-lockup {
  display: flex;
  align-items: safe center;
  gap: 0.65rem;
}

.brand-logo {
  font-size: 1.65rem;
}

.brand-name {
  display: block;
  font-size: 1.05rem;
  font-weight: 800;
  letter-spacing: -0.01em;
  color: #ffffff;
}

.brand-tagline {
  display: block;
  font-size: 0.72rem;
  color: var(--text-muted);
}

.main-nav {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
}

.nav-link {
  text-decoration: none;
  color: var(--text-muted);
  font-size: 0.84rem;
  font-weight: 600;
  padding-block: 0.45rem;
  padding-inline: 0.85rem;
  border-radius: var(--radius-sm);
  border: 1px solid transparent;
  transition: background-color 0.15s ease, color 0.15s ease;
}

.nav-link:hover {
  color: var(--text-main);
  background-color: var(--bg-panel);
}

.nav-link.active {
  color: #0f172a;
  background-color: var(--brand-color);
  font-weight: 700;
}
</style>

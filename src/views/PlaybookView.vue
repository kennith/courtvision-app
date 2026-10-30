<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useBoardStore } from '@/stores/useBoardStore'

const boardStore = useBoardStore()
const router = useRouter()

const searchQuery = ref('')
const activeCategory = ref('All')
const copiedPlayId = ref(null)

const categories = ['All', 'Offense', 'Defense', 'Inbound', 'Fast Break', 'Special']

const filteredPlays = computed(() => {
  return boardStore.savedPlays.filter((play) => {
    const matchesCat =
      activeCategory.value === 'All' || play.category === activeCategory.value
    const q = searchQuery.value.trim().toLowerCase()
    const matchesQuery = !q || play.title.toLowerCase().includes(q)
    return matchesCat && matchesQuery
  })
})

function openPlayInBoard(play, autoAnimate = false) {
  boardStore.loadPlay(play)
  router.push({ name: 'board' }).then(() => {
    if (autoAnimate && play.frames && play.frames.length > 1) {
      boardStore.isPlaying = true
    }
  })
}

async function sharePlayCard(play) {
  try {
    const serialized = JSON.stringify({
      title: play.title,
      category: play.category,
      courtMode: play.courtMode,
      frames: play.frames
    })
    const encoded = encodeURIComponent(btoa(unescape(encodeURIComponent(serialized))))
    const url = `${window.location.origin}/?play=${encoded}`
    await navigator.clipboard.writeText(url)
    copiedPlayId.value = play.id
    setTimeout(() => {
      if (copiedPlayId.value === play.id) copiedPlayId.value = null
    }, 2000)
  } catch {
    // ignore clipboard fallback
  }
}
</script>

<template>
  <main class="playbook-page">
    <header class="playbook-header">
      <div>
        <h1>Team Playbook Library</h1>
        <p class="subtitle">
          Review, organize, and share your saved offensive sets, defensive coverages, and special situations.
        </p>
      </div>

      <div class="filter-bar">
        <input
          v-model="searchQuery"
          type="search"
          class="search-input"
          placeholder="Search plays by title..."
          aria-label="Search plays"
        />
        <div class="category-pills" role="tablist" aria-label="Filter plays by category">
          <button
            v-for="cat in categories"
            :key="cat"
            type="button"
            class="cat-pill"
            :class="{ active: activeCategory === cat }"
            @click="activeCategory = cat"
          >
            {{ cat }}
          </button>
        </div>
      </div>
    </header>

    <section v-if="filteredPlays.length > 0" class="playbook-grid">
      <article
        v-for="play in filteredPlays"
        :key="play.id"
        class="play-card"
      >
        <!-- Row 1: Card Header & Mini Tactical Diagram -->
        <div class="card-top">
          <div class="mini-court-preview">
            <svg viewBox="0 0 200 150" class="mini-svg" aria-hidden="true">
              <rect width="200" height="150" rx="4" fill="#f8fafc" />
              <rect x="6" y="6" width="188" height="138" rx="2" fill="#f8fafc" stroke="#1e293b" stroke-width="1.5" />
              <rect x="68" y="6" width="64" height="56" fill="rgba(37,99,235,0.07)" stroke="#1e293b" stroke-width="1.5" />
              <path d="M 76 62 A 24 24 0 0 0 124 62" fill="none" stroke="#1e293b" stroke-width="1.5" />
              <circle cx="100" cy="18" r="4" fill="none" stroke="#ea580c" stroke-width="1.5" />
              <path d="M 26 6 L 26 48.4 A 80 80 0 0 0 174 48.4 L 174 6" fill="none" stroke="#1e293b" stroke-width="1.5" />
              <!-- Render first frame tokens -->
              <g v-if="play.frames && play.frames[0]">
                <template v-for="tk in play.frames[0].tokens" :key="tk.id">
                  <circle
                    :cx="tk.x * 200"
                    :cy="tk.y * 150"
                    :r="tk.team === 'ball' ? 4 : 6.5"
                    :fill="tk.team === 'offense' ? '#2563eb' : tk.team === 'defense' ? '#dc2626' : '#ea580c'"
                    stroke="#ffffff"
                    stroke-width="1"
                  />
                </template>
              </g>
            </svg>
            <span class="steps-badge">{{ play.frames?.length || 1 }} Steps</span>
          </div>

          <div class="title-row">
            <span class="cat-badge">{{ play.category }}</span>
            <h2>{{ play.title }}</h2>
          </div>
        </div>

        <!-- Row 2: Actions -->
        <div class="card-actions">
          <button
            type="button"
            class="action-btn primary"
            @click="openPlayInBoard(play, false)"
          >
            📋 Open on Board
          </button>
          <button
            type="button"
            class="action-btn"
            @click="openPlayInBoard(play, true)"
          >
            ▶ Animate
          </button>
          <button
            type="button"
            class="action-btn"
            @click="sharePlayCard(play)"
          >
            {{ copiedPlayId === play.id ? '✓ Link Copied' : '🔗 Share' }}
          </button>
          <button
            type="button"
            class="action-btn delete"
            aria-label="Delete play"
            title="Delete play"
            @click="boardStore.deleteSavedPlay(play.id)"
          >
            🗑
          </button>
        </div>
      </article>
    </section>

    <div v-else class="empty-state">
      <p>No saved plays match your current filter.</p>
      <button type="button" class="action-btn primary" @click="router.push({ name: 'board' })">
        Draw a New Play on the Board
      </button>
    </div>
  </main>
</template>

<style scoped>
.playbook-page {
  max-inline-size: 1440px;
  margin-inline: auto;
  padding: 1.25rem 1.25rem 2.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.playbook-header {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  background-color: var(--bg-panel);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  padding: 1.2rem;
}

.playbook-header h1 {
  font-size: 1.35rem;
  font-weight: 800;
}

.subtitle {
  font-size: 0.88rem;
  color: var(--text-muted);
}

.filter-bar {
  display: flex;
  flex-wrap: wrap;
  align-items: safe center;
  gap: 0.75rem;
}

.search-input {
  flex: 1 1 240px;
  padding-block: 0.5rem;
  padding-inline: 0.75rem;
  background-color: var(--bg-elevated);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
  font-size: 0.85rem;
}

.category-pills {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
}

.cat-pill {
  padding-block: 0.4rem;
  padding-inline: 0.75rem;
  font-size: 0.8rem;
  font-weight: 600;
  background-color: var(--bg-elevated);
  border: 1px solid var(--border-color);
  color: var(--text-muted);
}

.cat-pill.active {
  background-color: var(--brand-color);
  border-color: var(--brand-color);
  color: #0f172a;
}

/* Responsive grid with subgrid row alignment and same-cascade fallback */
.playbook-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  grid-auto-rows: 1fr auto;
  gap: 1.15rem;
}

.play-card {
  grid-row: span 2;
  display: grid;
  /* Same-cascade fallback: ignored when subgrid is supported */
  grid-template-rows: 1fr auto;
  grid-template-rows: subgrid;
  gap: 0.85rem;
  background-color: var(--bg-panel);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  padding: 1rem;
}

.card-top {
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
}

.mini-court-preview {
  position: relative;
  border-radius: var(--radius-sm);
  overflow: clip;
}

.mini-svg {
  inline-size: 100%;
  block-size: auto;
}

.steps-badge {
  position: absolute;
  inset-block-end: 0.45rem;
  inset-inline-end: 0.45rem;
  background-color: rgba(15, 23, 42, 0.88);
  border: 1px solid var(--border-color);
  padding-block: 0.15rem;
  padding-inline: 0.45rem;
  border-radius: 999px;
  font-size: 0.7rem;
  font-weight: 700;
}

.title-row {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.cat-badge {
  align-self: flex-start;
  font-size: 0.68rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding-block: 0.12rem;
  padding-inline: 0.45rem;
  border-radius: 999px;
  background-color: rgba(234, 88, 12, 0.18);
  color: var(--brand-color);
}

.title-row h2 {
  font-size: 1.02rem;
  font-weight: 700;
}

.card-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  align-items: safe center;
}

.action-btn {
  padding-block: 0.42rem;
  padding-inline: 0.65rem;
  font-size: 0.78rem;
  font-weight: 600;
  background-color: var(--bg-elevated);
  border: 1px solid var(--border-color);
}

.action-btn.primary {
  background-color: var(--brand-color);
  border-color: var(--brand-color);
  color: #0f172a;
  font-weight: 700;
  flex: 1 1 auto;
}

.action-btn.delete {
  margin-inline-start: auto;
  color: #fca5a5;
}

.empty-state {
  background-color: var(--bg-panel);
  border: 1px dashed var(--border-color);
  border-radius: var(--radius-md);
  padding: 2.5rem;
  display: flex;
  flex-direction: column;
  align-items: safe center;
  gap: 1rem;
  color: var(--text-muted);
}
</style>

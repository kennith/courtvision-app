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
            <svg viewBox="0 0 54 51" class="mini-svg" aria-hidden="true">
              <rect width="54" height="51" rx="1.5" fill="#f8fafc" />
              <!-- Outer 50ft x 47ft Half Court Boundary -->
              <rect x="2" y="2" width="50" height="47" fill="#f8fafc" stroke="#1e293b" stroke-width="0.4" />
              <!-- 16ft x 19ft Key / Paint -->
              <rect x="19" y="2" width="16" height="19" fill="rgba(37,99,235,0.07)" stroke="#1e293b" stroke-width="0.4" />
              <!-- Low Blocks & Lane Hash Marks -->
              <rect x="18.15" y="9" width="0.85" height="1" fill="#1e293b" />
              <rect x="35" y="9" width="0.85" height="1" fill="#1e293b" />
              <path d="M 19 13 L 18.15 13 M 19 16 L 18.15 16 M 19 19 L 18.15 19 M 35 13 L 35.85 13 M 35 16 L 35.85 16 M 35 19 L 35.85 19" stroke="#1e293b" stroke-width="0.35" />
              <!-- Free-Throw Circle (6ft radius) -->
              <path d="M 21 21 A 6 6 0 0 0 33 21" fill="none" stroke="#1e293b" stroke-width="0.4" />
              <path d="M 21 21 A 6 6 0 0 1 33 21" fill="none" stroke="#1e293b" stroke-width="0.35" stroke-dasharray="1 1" />
              <!-- Restricted Area (4ft radius), Backboard (6ft wide at 4ft) & Rim (at 5.25ft) -->
              <path d="M 23 6 L 23 7.25 A 4 4 0 0 0 31 7.25 L 31 6" fill="none" stroke="#1e293b" stroke-width="0.35" />
              <path d="M 24 6 L 30 6 M 27 6 L 27 6.5" stroke="#1e293b" stroke-width="0.4" />
              <circle cx="27" cy="7.25" r="0.75" fill="none" stroke="#ea580c" stroke-width="0.45" />
              <!-- Regulation 3-Point Line (22ft corners, 23.75ft arc) -->
              <path d="M 5 2 L 5 16.2 A 23.75 23.75 0 0 0 49 16.2 L 49 2" fill="none" stroke="#1e293b" stroke-width="0.4" />
              <!-- Midcourt Center Circle (6ft & 2ft radii) -->
              <path d="M 21 49 A 6 6 0 0 1 33 49 M 25 49 A 2 2 0 0 1 29 49" fill="none" stroke="#1e293b" stroke-width="0.4" />
              <!-- Render first frame tokens -->
              <g v-if="play.frames && play.frames[0]">
                <template v-for="tk in play.frames[0].tokens" :key="tk.id">
                  <circle
                    :cx="tk.x * 54"
                    :cy="tk.y * 51"
                    :r="tk.team === 'ball' ? 1.2 : 1.85"
                    :fill="tk.team === 'offense' ? '#2563eb' : tk.team === 'defense' ? '#dc2626' : '#ea580c'"
                    stroke="#ffffff"
                    stroke-width="0.3"
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

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useBoardStore } from '@/stores/useBoardStore'
import CourtCanvas from '@/components/CourtCanvas.vue'
import MarkerToolbar from '@/components/MarkerToolbar.vue'
import AnimationTimeline from '@/components/AnimationTimeline.vue'
import SaveShareModal from '@/components/SaveShareModal.vue'

const boardStore = useBoardStore()
const route = useRoute()
const router = useRouter()

const courtCanvasRef = ref(null)
const saveShareModalRef = ref(null)

function getSnapshotDataUrl() {
  return courtCanvasRef.value?.exportSnapshotPng() || null
}

onMounted(() => {
  if (route.query.play) {
    try {
      const decoded = decodeURIComponent(escape(atob(String(route.query.play))))
      boardStore.importPlayFromJson(decoded)
      router.replace({ query: {} })
    } catch (err) {
      console.warn('Failed to parse shared play query parameter:', err)
    }
  }
})
</script>

<template>
  <div class="board-workspace">
    <!-- Top Play Context Header Bar -->
    <header class="play-context-bar">
      <div class="play-meta-inputs">
        <input
          v-model="boardStore.playTitle"
          type="text"
          class="play-title-input"
          aria-label="Play title"
          placeholder="Enter play title..."
        />
        <select
          v-model="boardStore.playCategory"
          class="play-category-select"
          aria-label="Play category"
        >
          <option value="Offense">Offense</option>
          <option value="Defense">Defense</option>
          <option value="Inbound">Inbound</option>
          <option value="Fast Break">Fast Break</option>
          <option value="Special">Special</option>
        </select>
      </div>

      <div class="play-actions-group">
        <button
          type="button"
          class="bar-btn"
          title="Start a blank play"
          @click="boardStore.resetNewPlay()"
        >
          📄 New Board
        </button>
        <button
          type="button"
          class="bar-btn"
          @click="saveShareModalRef?.openShareModal()"
        >
          🔗 Share / Export
        </button>
        <button
          type="button"
          class="bar-btn primary"
          @click="saveShareModalRef?.openSaveModal()"
        >
          💾 Save Play
        </button>
      </div>
    </header>

    <!-- Main 2-Column Responsive Grid -->
    <div class="workspace-grid">
      <MarkerToolbar class="area-tools" />

      <div class="area-center">
        <CourtCanvas ref="courtCanvasRef" />
        <AnimationTimeline />
      </div>
    </div>

    <SaveShareModal
      ref="saveShareModalRef"
      :get-snapshot-data-url="getSnapshotDataUrl"
    />
  </div>
</template>

<style scoped>
.board-workspace {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding: 0.75rem 1.25rem;
  max-inline-size: 1520px;
  margin-inline: auto;
  inline-size: 100%;
}

.play-context-bar {
  display: flex;
  flex-wrap: wrap;
  align-items: safe center;
  justify-content: space-between;
  gap: 0.75rem;
  background-color: var(--bg-panel);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  padding-block: 0.55rem;
  padding-inline: 0.85rem;
}

.play-meta-inputs {
  display: flex;
  flex-wrap: wrap;
  align-items: safe center;
  gap: 0.5rem;
  flex: 1 1 280px;
}

.play-title-input {
  flex: 1 1 200px;
  min-inline-size: 0;
  padding-block: 0.4rem;
  padding-inline: 0.65rem;
  background-color: var(--bg-elevated);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
  font-size: 0.95rem;
  font-weight: 700;
}

.play-category-select {
  padding-block: 0.4rem;
  padding-inline: 0.65rem;
  background-color: var(--bg-elevated);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
  font-size: 0.82rem;
  font-weight: 600;
}

.play-actions-group {
  display: flex;
  flex-wrap: wrap;
  gap: 0.45rem;
  margin-inline-start: auto;
}

.bar-btn {
  padding-block: 0.44rem;
  padding-inline: 0.8rem;
  font-size: 0.82rem;
  font-weight: 600;
  background-color: var(--bg-elevated);
  border: 1px solid var(--border-color);
}

.bar-btn:hover {
  border-color: var(--brand-color);
}

.bar-btn.primary {
  background-color: var(--brand-color);
  border-color: var(--brand-color);
  color: #0f172a;
  font-weight: 700;
}

.workspace-grid {
  display: grid;
  grid-template-columns: 280px minmax(0, 1fr);
  grid-template-areas: "tools center";
  gap: 0.85rem;
  align-items: start;
}

.area-tools {
  grid-area: tools;
}

.area-center {
  grid-area: center;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  min-inline-size: 0;
}

@media (max-width: 780px) {
  .workspace-grid {
    grid-template-columns: 1fr;
    grid-template-areas:
      "center"
      "tools";
  }
}
</style>

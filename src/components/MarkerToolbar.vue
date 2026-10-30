<script setup>
import { computed } from 'vue'
import { useBoardStore } from '@/stores/useBoardStore'

const boardStore = useBoardStore()

const tools = [
  { id: 'select', label: 'Move Players', icon: '✋', hint: 'Drag players & ball' },
  { id: 'pen', label: 'Marker', icon: '🖊️', hint: 'Freehand dry-erase marker' },
  { id: 'arrow', label: 'Cut / Run', icon: '↗️', hint: 'Solid movement arrow' },
  { id: 'pass', label: 'Pass', icon: '⚡', hint: 'Dashed pass arrow' },
  { id: 'dribble', label: 'Dribble', icon: '〰️', hint: 'Wavy dribble arrow' },
  { id: 'screen', label: 'Screen', icon: '⊥', hint: 'Pick / screen T-bar' },
  { id: 'eraser', label: 'Eraser', icon: '🧽', hint: 'Tap or drag over lines to erase' }
]

const formations = [
  { id: '5-out', label: '5-Out' },
  { id: 'horns', label: 'Horns' },
  { id: '1-4-high', label: '1-4 High' },
  { id: 'box', label: 'Box Set' },
  { id: '2-3-zone', label: '2-3 Zone' }
]

const strokeProgressStyle = computed(() => {
  const pct = ((boardStore.markerWidth - 2) / (10 - 2)) * 100
  return { '--progress': `${pct}%` }
})

function onWidthInput(e) {
  boardStore.markerWidth = Number(e.target.value)
}
</script>

<template>
  <aside class="toolbar-panel scrollable-panel" aria-label="Coaching Board Tools">
    <!-- Tool Selector -->
    <section class="tool-section">
      <h2 class="section-heading">Dry-Erase Tools</h2>
      <div class="tool-grid">
        <button
          v-for="tool in tools"
          :key="tool.id"
          type="button"
          class="tool-btn"
          :class="{ active: boardStore.activeTool === tool.id }"
          :title="tool.hint"
          @click="boardStore.activeTool = tool.id"
        >
          <span class="tool-icon" aria-hidden="true">{{ tool.icon }}</span>
          <span class="tool-label">{{ tool.label }}</span>
        </button>
      </div>
    </section>

    <!-- Marker Colors -->
    <section class="tool-section">
      <div class="section-row">
        <h2 class="section-heading">Marker Color</h2>
        <span class="badge-thickness">{{ boardStore.markerWidth }}px</span>
      </div>
      <div class="color-swatch-row" role="radiogroup" aria-label="Marker color selection">
        <button
          v-for="swatch in boardStore.markerColors"
          :key="swatch.hex"
          type="button"
          class="color-swatch"
          :class="{ selected: boardStore.markerColor === swatch.hex }"
          :style="{ backgroundColor: swatch.hex }"
          :aria-label="swatch.name"
          :aria-pressed="boardStore.markerColor === swatch.hex"
          :title="swatch.name"
          @click="boardStore.markerColor = swatch.hex"
        ></button>
      </div>

      <label class="slider-label" for="marker-width-range">
        <span>Tip Size</span>
        <input
          id="marker-width-range"
          type="range"
          min="2"
          max="10"
          step="1"
          :value="boardStore.markerWidth"
          :style="strokeProgressStyle"
          @input="onWidthInput"
        />
      </label>

      <div class="action-pair">
        <button
          type="button"
          class="secondary-btn"
          :disabled="boardStore.currentFrame.strokes.length === 0"
          @click="boardStore.undoStroke()"
        >
          ↩ Undo
        </button>
        <button
          type="button"
          class="secondary-btn"
          :disabled="!(boardStore.redoStacks[boardStore.currentFrameIndex]?.length)"
          @click="boardStore.redoStroke()"
        >
          ↪ Redo
        </button>
        <button
          type="button"
          class="danger-btn"
          @click="boardStore.clearCurrentStrokes()"
        >
          Clear Ink
        </button>
      </div>
    </section>

    <!-- Quick Formations -->
    <section class="tool-section">
      <h2 class="section-heading">Quick Formations</h2>
      <div class="formation-chips">
        <button
          v-for="fmt in formations"
          :key="fmt.id"
          type="button"
          class="chip-btn"
          @click="boardStore.applyFormation(fmt.id)"
        >
          {{ fmt.label }}
        </button>
      </div>
    </section>

    <!-- Court Configuration -->
    <section class="tool-section">
      <h2 class="section-heading">Court &amp; Display</h2>
      <div class="segmented-group" role="group" aria-label="Court dimensions">
        <button
          type="button"
          class="seg-btn"
          :class="{ active: boardStore.courtMode === 'half' }"
          @click="boardStore.setCourtMode('half')"
        >
          Half Court
        </button>
        <button
          type="button"
          class="seg-btn"
          :class="{ active: boardStore.courtMode === 'full' }"
          @click="boardStore.setCourtMode('full')"
        >
          Full Court
        </button>
      </div>

      <div class="segmented-group" role="group" aria-label="Court surface theme">
        <button
          type="button"
          class="seg-btn"
          :class="{ active: boardStore.courtSurface === 'whiteboard' }"
          @click="boardStore.courtSurface = 'whiteboard'"
        >
          Whiteboard
        </button>
        <button
          type="button"
          class="seg-btn"
          :class="{ active: boardStore.courtSurface === 'hardwood' }"
          @click="boardStore.courtSurface = 'hardwood'"
        >
          Hardwood
        </button>
        <button
          type="button"
          class="seg-btn"
          :class="{ active: boardStore.courtSurface === 'dark' }"
          @click="boardStore.courtSurface = 'dark'"
        >
          Slate
        </button>
      </div>

      <div class="toggles-stack">
        <label class="checkbox-label" for="toggle-defense">
          <input
            id="toggle-defense"
            v-model="boardStore.showDefense"
            type="checkbox"
            class="visually-hidden"
          />
          <span>Show Defenders (X1–X5)</span>
        </label>
        <label class="checkbox-label" for="toggle-roles">
          <input
            id="toggle-roles"
            v-model="boardStore.showPlayerRoles"
            type="checkbox"
            class="visually-hidden"
          />
          <span>Show Position Labels (PG–C)</span>
        </label>
      </div>
    </section>
  </aside>
</template>

<style scoped>
.toolbar-panel {
  background-color: var(--bg-panel);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  padding: 0.85rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.tool-section {
  display: flex;
  flex-direction: column;
  gap: 0.55rem;
  padding-block-end: 0.85rem;
  border-block-end: 1px solid rgba(148, 163, 184, 0.14);
}

.tool-section:last-child {
  padding-block-end: 0;
  border-block-end: none;
}

.section-row {
  display: flex;
  align-items: safe center;
  justify-content: space-between;
}

.section-heading {
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--text-muted);
  font-weight: 700;
}

.badge-thickness {
  font-size: 0.75rem;
  color: var(--brand-color);
  font-weight: 700;
}

.tool-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.4rem;
}

.tool-btn {
  display: flex;
  align-items: safe center;
  gap: 0.45rem;
  padding-block: 0.5rem;
  padding-inline: 0.6rem;
  background-color: var(--bg-elevated);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
  font-size: 0.82rem;
  font-weight: 600;
  text-align: start;
}

.tool-btn:hover {
  border-color: #64748b;
}

.tool-btn.active {
  background-color: rgba(234, 88, 12, 0.18);
  border-color: var(--brand-color);
  color: #fff;
}

.tool-icon {
  font-size: 1rem;
}

.color-swatch-row {
  display: flex;
  flex-wrap: wrap;
  gap: 0.45rem;
}

.color-swatch {
  inline-size: 1.75rem;
  block-size: 1.75rem;
  border-radius: 50%;
  border: 2px solid rgba(255, 255, 255, 0.35);
  transition: transform 0.12s ease, border-color 0.12s ease;
}

.color-swatch.selected {
  transform: scale(1.16);
  border-color: #ffffff;
  box-shadow: 0 0 0 2px var(--brand-color);
}

.slider-label {
  display: flex;
  align-items: safe center;
  gap: 0.65rem;
  font-size: 0.8rem;
  color: var(--text-muted);
}

.slider-label input[type="range"] {
  flex: 1 1 auto;
}

.action-pair {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
}

.secondary-btn,
.danger-btn {
  flex: 1 1 auto;
  padding-block: 0.4rem;
  padding-inline: 0.5rem;
  font-size: 0.78rem;
  font-weight: 600;
  background-color: var(--bg-elevated);
  border: 1px solid var(--border-color);
}

.secondary-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.danger-btn {
  color: #fca5a5;
  border-color: rgba(220, 38, 38, 0.4);
}

.danger-btn:hover {
  background-color: rgba(220, 38, 38, 0.2);
}

.formation-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
}

.chip-btn {
  flex: 1 1 70px;
  padding-block: 0.38rem;
  padding-inline: 0.5rem;
  font-size: 0.78rem;
  font-weight: 600;
  background-color: var(--bg-elevated);
  border: 1px solid var(--border-color);
}

.chip-btn:hover {
  border-color: var(--brand-color);
  color: #fff;
}

.segmented-group {
  display: flex;
  background-color: var(--bg-elevated);
  padding: 0.2rem;
  border-radius: var(--radius-sm);
  border: 1px solid var(--border-color);
  gap: 0.2rem;
}

.seg-btn {
  flex: 1 1 0;
  padding-block: 0.35rem;
  font-size: 0.76rem;
  font-weight: 600;
  color: var(--text-muted);
}

.seg-btn.active {
  background-color: var(--bg-card);
  color: var(--text-main);
}

.toggles-stack {
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
  margin-block-start: 0.2rem;
}

.checkbox-label {
  display: inline-flex;
  align-items: safe center;
  gap: 0.5rem;
  font-size: 0.82rem;
  cursor: pointer;
}
</style>

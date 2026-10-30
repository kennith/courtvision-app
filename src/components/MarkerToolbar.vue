<script setup>
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
</script>

<template>
  <aside class="toolbar-panel" aria-label="Coaching Board Tools">
    <!-- Tool Selector -->
    <section class="tool-section">
      <h2 class="section-heading">Dry-Erase Tools</h2>
      <div class="tool-row">
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
      <div class="court-display-row">
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

        <div class="toggles-row">
          <label class="checkbox-label" for="toggle-defense">
            <input
              id="toggle-defense"
              v-model="boardStore.showDefense"
              type="checkbox"
              class="visually-hidden"
            />
            <span>Defenders (X1–X5)</span>
          </label>
          <label class="checkbox-label" for="toggle-roles">
            <input
              id="toggle-roles"
              v-model="boardStore.showPlayerRoles"
              type="checkbox"
              class="visually-hidden"
            />
            <span>Roles (PG–C)</span>
          </label>
        </div>
      </div>
    </section>
  </aside>
</template>

<style scoped>
.toolbar-panel {
  background-color: var(--bg-panel);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  padding: 0.7rem 0.9rem;
  display: flex;
  flex-wrap: wrap;
  align-items: stretch;
  gap: 1rem;
}

.tool-section {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 0.45rem;
  padding-inline-end: 1rem;
  border-inline-end: 1px solid rgba(148, 163, 184, 0.14);
}

.tool-section:last-child {
  padding-inline-end: 0;
  border-inline-end: none;
}

.section-heading {
  font-size: 0.72rem;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--text-muted);
  font-weight: 700;
}

.tool-row {
  display: flex;
  flex-wrap: wrap;
  align-items: safe center;
  gap: 0.35rem;
}

.tool-btn {
  display: inline-flex;
  align-items: safe center;
  gap: 0.38rem;
  padding-block: 0.42rem;
  padding-inline: 0.6rem;
  background-color: var(--bg-elevated);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
  font-size: 0.8rem;
  font-weight: 600;
  white-space: nowrap;
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
  font-size: 0.95rem;
}

.action-pair {
  display: flex;
  gap: 0.35rem;
  margin-inline-start: 0.35rem;
}

.secondary-btn,
.danger-btn {
  padding-block: 0.42rem;
  padding-inline: 0.55rem;
  font-size: 0.78rem;
  font-weight: 600;
  background-color: var(--bg-elevated);
  border: 1px solid var(--border-color);
  white-space: nowrap;
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
  padding-block: 0.4rem;
  padding-inline: 0.6rem;
  font-size: 0.78rem;
  font-weight: 600;
  background-color: var(--bg-elevated);
  border: 1px solid var(--border-color);
  white-space: nowrap;
}

.chip-btn:hover {
  border-color: var(--brand-color);
  color: #fff;
}

.court-display-row {
  display: flex;
  flex-wrap: wrap;
  align-items: safe center;
  gap: 0.65rem;
}

.segmented-group {
  display: flex;
  background-color: var(--bg-elevated);
  padding: 0.18rem;
  border-radius: var(--radius-sm);
  border: 1px solid var(--border-color);
  gap: 0.2rem;
}

.seg-btn {
  padding-block: 0.3rem;
  padding-inline: 0.6rem;
  font-size: 0.76rem;
  font-weight: 600;
  color: var(--text-muted);
  white-space: nowrap;
}

.seg-btn.active {
  background-color: var(--bg-card);
  color: var(--text-main);
}

.toggles-row {
  display: flex;
  flex-wrap: wrap;
  align-items: safe center;
  gap: 0.65rem;
}

.checkbox-label {
  display: inline-flex;
  align-items: safe center;
  gap: 0.4rem;
  font-size: 0.8rem;
  cursor: pointer;
  white-space: nowrap;
}

@media (max-width: 900px) {
  .tool-section {
    padding-inline-end: 0;
    border-inline-end: none;
    inline-size: 100%;
  }
}
</style>

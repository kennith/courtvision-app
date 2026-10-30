<script setup>
import { useBoardStore } from '@/stores/useBoardStore'

const boardStore = useBoardStore()

const speeds = [0.5, 1, 1.5, 2]

function togglePlayback() {
  if (boardStore.frames.length < 2) {
    // Automatically add a second step if coach hits Play with only 1 step so they know how it works
    boardStore.addFrame()
    return
  }
  boardStore.isPlaying = !boardStore.isPlaying
}
</script>

<template>
  <section class="timeline-bar" aria-label="Play Animation Timeline">
    <div class="playback-controls">
      <button
        type="button"
        class="play-btn"
        :class="{ playing: boardStore.isPlaying }"
        @click="togglePlayback"
      >
        <span v-if="boardStore.isPlaying">⏸ Pause</span>
        <span v-else>▶ Animate Play</span>
      </button>

      <label class="checkbox-label loop-toggle" for="loop-animation">
        <input
          id="loop-animation"
          v-model="boardStore.isLooping"
          type="checkbox"
          class="visually-hidden"
        />
        <span>Loop</span>
      </label>

      <div class="speed-group" role="group" aria-label="Animation speed">
        <button
          v-for="spd in speeds"
          :key="spd"
          type="button"
          class="speed-btn"
          :class="{ active: boardStore.playbackSpeed === spd }"
          @click="boardStore.playbackSpeed = spd"
        >
          {{ spd }}x
        </button>
      </div>
    </div>

    <div class="frames-track">
      <div
        v-for="(frame, idx) in boardStore.frames"
        :key="frame.id"
        class="frame-pill"
        :class="{ active: boardStore.currentFrameIndex === idx }"
      >
        <button
          type="button"
          class="frame-select-btn"
          @click="boardStore.selectFrame(idx)"
        >
          Step {{ idx + 1 }}
        </button>
        <button
          v-if="boardStore.frames.length > 1"
          type="button"
          class="frame-delete-btn"
          :aria-label="`Delete step ${idx + 1}`"
          title="Delete step"
          @click.stop="boardStore.deleteFrame(idx)"
        >
          ×
        </button>
      </div>

      <button
        type="button"
        class="add-frame-btn"
        title="Duplicate current player positions into a new animation step"
        @click="boardStore.addFrame()"
      >
        + Add Movement Step
      </button>
    </div>
  </section>
</template>

<style scoped>
.timeline-bar {
  background-color: var(--bg-panel);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  padding-block: 0.6rem;
  padding-inline: 0.85rem;
  display: flex;
  flex-wrap: wrap;
  align-items: safe center;
  gap: 0.85rem;
}

.playback-controls {
  display: flex;
  align-items: safe center;
  gap: 0.6rem;
  flex-wrap: wrap;
}

.play-btn {
  padding-block: 0.45rem;
  padding-inline: 0.9rem;
  background-color: var(--brand-color);
  color: #0f172a;
  font-weight: 700;
  font-size: 0.84rem;
  border-radius: var(--radius-sm);
}

.play-btn.playing {
  background-color: #eab308;
}

.loop-toggle {
  font-size: 0.8rem;
  display: inline-flex;
  align-items: safe center;
  gap: 0.35rem;
  cursor: pointer;
}

.speed-group {
  display: flex;
  background-color: var(--bg-elevated);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
  padding: 0.15rem;
  gap: 0.15rem;
}

.speed-btn {
  padding-block: 0.22rem;
  padding-inline: 0.45rem;
  font-size: 0.74rem;
  font-weight: 600;
  color: var(--text-muted);
}

.speed-btn.active {
  background-color: var(--bg-card);
  color: var(--text-main);
}

.frames-track {
  display: flex;
  align-items: safe center;
  flex-wrap: wrap;
  gap: 0.45rem;
  flex: 1 1 260px;
}

.frame-pill {
  display: inline-flex;
  align-items: safe center;
  background-color: var(--bg-elevated);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
}

.frame-pill.active {
  border-color: var(--brand-color);
  background-color: rgba(234, 88, 12, 0.16);
}

.frame-select-btn {
  padding-block: 0.35rem;
  padding-inline: 0.65rem;
  font-size: 0.8rem;
  font-weight: 600;
}

.frame-delete-btn {
  padding-block: 0.25rem;
  padding-inline: 0.4rem;
  font-size: 0.9rem;
  color: var(--text-muted);
  border-inline-start: 1px solid var(--border-color);
  border-radius: 0 var(--radius-sm) var(--radius-sm) 0;
}

.frame-delete-btn:hover {
  color: #fca5a5;
  background-color: rgba(220, 38, 38, 0.2);
}

.add-frame-btn {
  padding-block: 0.38rem;
  padding-inline: 0.75rem;
  font-size: 0.8rem;
  font-weight: 600;
  background-color: var(--bg-elevated);
  border: 1px dashed #64748b;
  color: var(--text-main);
}

.add-frame-btn:hover {
  border-color: var(--brand-color);
  color: var(--brand-color);
}
</style>

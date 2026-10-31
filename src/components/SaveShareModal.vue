<script setup>
import { ref, onMounted } from 'vue'
import { useBoardStore } from '@/stores/useBoardStore'

const props = defineProps({
  getSnapshotDataUrl: {
    type: Function,
    default: null
  }
})

const boardStore = useBoardStore()

const saveDialogRef = ref(null)
const shareDialogRef = ref(null)

const formTitle = ref('')
const formCategory = ref('Offense')
const statusMessage = ref('')

const shareJsonText = ref('')
const shareLinkText = ref('')
const importJsonInput = ref('')
const shareFeedback = ref('')

const categories = ['Offense', 'Defense', 'Inbound', 'Fast Break', 'Special']

function attachClosedByFallback(dialogEl) {
  if (!dialogEl) return
  if (!('closedBy' in HTMLDialogElement.prototype)) {
    dialogEl.addEventListener('click', (event) => {
      if (event.target !== dialogEl) return
      const rect = dialogEl.getBoundingClientRect()
      const isDialogContent =
        rect.top <= event.clientY &&
        event.clientY <= rect.top + rect.height &&
        rect.left <= event.clientX &&
        event.clientX <= rect.left + rect.width
      if (isDialogContent) return
      dialogEl.close()
    })
  }
}

onMounted(() => {
  attachClosedByFallback(saveDialogRef.value)
  attachClosedByFallback(shareDialogRef.value)
})

function openSaveModal() {
  formTitle.value = boardStore.playTitle
  formCategory.value = boardStore.playCategory
  statusMessage.value = ''
  saveDialogRef.value?.showModal()
}

function handleSaveSubmit() {
  boardStore.saveCurrentPlay({
    title: formTitle.value,
    category: formCategory.value
  })
  statusMessage.value = 'Play saved to Playbook!'
  setTimeout(() => {
    saveDialogRef.value?.close()
  }, 550)
}

function openShareModal() {
  shareFeedback.value = ''
  importJsonInput.value = ''
  const serialized = boardStore.serializeCurrentPlay()
  shareJsonText.value = serialized
  try {
    const encoded = encodeURIComponent(btoa(unescape(encodeURIComponent(serialized))))
    shareLinkText.value = `${window.location.origin}${import.meta.env.BASE_URL}?play=${encoded}`
  } catch {
    shareLinkText.value = window.location.href
  }
  shareDialogRef.value?.showModal()
}

async function copyShareLink() {
  try {
    await navigator.clipboard.writeText(shareLinkText.value)
    shareFeedback.value = 'Shareable play link copied to clipboard!'
  } catch {
    shareFeedback.value = 'Select and copy the link from the box above.'
  }
}

async function copyShareJson() {
  try {
    await navigator.clipboard.writeText(shareJsonText.value)
    shareFeedback.value = 'Play JSON copied to clipboard!'
  } catch {
    shareFeedback.value = 'Select and copy the JSON text above.'
  }
}

function downloadSnapshot() {
  if (!props.getSnapshotDataUrl) return
  const dataUrl = props.getSnapshotDataUrl()
  if (!dataUrl) return
  const a = document.createElement('a')
  const safeName = (boardStore.playTitle || 'basketball-play')
    .toLowerCase()
    .replace(/[^a-z0-9-_]+/g, '-')
  a.href = dataUrl
  a.download = `${safeName}.png`
  a.click()
  shareFeedback.value = 'PNG court diagram downloaded!'
}

function handleImportPlay() {
  if (!importJsonInput.value.trim()) return
  try {
    boardStore.importPlayFromJson(importJsonInput.value.trim())
    shareFeedback.value = 'Play imported and loaded onto the board!'
    importJsonInput.value = ''
  } catch (err) {
    shareFeedback.value = `Could not import play: ${err.message}`
  }
}

defineExpose({
  openSaveModal,
  openShareModal
})
</script>

<template>
  <!-- Save Play Modal Dialog with native light-dismiss -->
  <dialog
    ref="saveDialogRef"
    v-bind="{ closedby: 'any' }"
    aria-labelledby="save-play-dialog-title"
  >
    <div class="dialog-content">
      <header class="dialog-header">
        <h2 id="save-play-dialog-title">Save Play to Playbook</h2>
        <button type="button" class="close-icon-btn" @click="saveDialogRef?.close()">✕</button>
      </header>

      <form class="dialog-form" @submit.prevent="handleSaveSubmit">
        <label class="field-group">
          <span>Play Title</span>
          <input
            v-model="formTitle"
            type="text"
            required
            placeholder="e.g., Horns Flare Action"
          />
        </label>

        <label class="field-group">
          <span>Category</span>
          <select v-model="formCategory">
            <option v-for="cat in categories" :key="cat" :value="cat">
              {{ cat }}
            </option>
          </select>
        </label>

        <p v-if="statusMessage" class="feedback-banner">{{ statusMessage }}</p>

        <div class="dialog-actions">
          <button type="button" class="btn-secondary" @click="saveDialogRef?.close()">
            Cancel
          </button>
          <button type="submit" class="btn-primary">
            💾 Save Play ({{ boardStore.frames.length }} Steps)
          </button>
        </div>
      </form>
    </div>
  </dialog>

  <!-- Share / Export / Import Modal Dialog with native light-dismiss -->
  <dialog
    ref="shareDialogRef"
    v-bind="{ closedby: 'any' }"
    aria-labelledby="share-play-dialog-title"
  >
    <div class="dialog-content">
      <header class="dialog-header">
        <h2 id="share-play-dialog-title">Share, Export &amp; Import Play</h2>
        <button type="button" class="close-icon-btn" @click="shareDialogRef?.close()">✕</button>
      </header>

      <div class="share-sections">
        <div class="share-block">
          <h3>1. Shareable Web Link</h3>
          <p class="helper-text">
            Send this URL to assistant coaches or players to open this exact play and animation directly:
          </p>
          <div class="copy-row">
            <input type="text" readonly :value="shareLinkText" aria-label="Shareable play URL" />
            <button type="button" class="btn-primary" @click="copyShareLink">Copy Link</button>
          </div>
        </div>

        <div class="share-block">
          <h3>2. Export Image or Play Data</h3>
          <div class="export-buttons-row">
            <button type="button" class="btn-secondary" @click="downloadSnapshot">
              📸 Download Court PNG
            </button>
            <button type="button" class="btn-secondary" @click="copyShareJson">
              📋 Copy Play JSON
            </button>
          </div>
        </div>

        <div class="share-block">
          <h3>3. Import Play JSON from Another Coach</h3>
          <textarea
            v-model="importJsonInput"
            rows="3"
            placeholder="Paste shared play JSON here..."
            aria-label="Import play JSON"
          ></textarea>
          <button
            type="button"
            class="btn-secondary"
            :disabled="!importJsonInput.trim()"
            @click="handleImportPlay"
          >
            📥 Import &amp; Load Play
          </button>
        </div>

        <p v-if="shareFeedback" class="feedback-banner">{{ shareFeedback }}</p>
      </div>
    </div>
  </dialog>
</template>

<style scoped>
.dialog-content {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.dialog-header {
  display: flex;
  align-items: safe center;
  justify-content: space-between;
}

.dialog-header h2 {
  font-size: 1.1rem;
  font-weight: 700;
}

.close-icon-btn {
  padding: 0.3rem 0.55rem;
  color: var(--text-muted);
  font-size: 1rem;
}

.dialog-form,
.share-sections {
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
}

.field-group {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  font-size: 0.82rem;
  font-weight: 600;
}

.field-group input,
.field-group select,
.share-block input,
.share-block textarea {
  padding-block: 0.5rem;
  padding-inline: 0.65rem;
  background-color: var(--bg-elevated);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
  font-size: 0.85rem;
}

.share-block {
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
  padding-block-end: 0.75rem;
  border-block-end: 1px solid rgba(148, 163, 184, 0.14);
}

.share-block:last-of-type {
  border-block-end: none;
  padding-block-end: 0;
}

.share-block h3 {
  font-size: 0.85rem;
  font-weight: 700;
}

.helper-text {
  font-size: 0.76rem;
  color: var(--text-muted);
}

.copy-row,
.export-buttons-row {
  display: flex;
  gap: 0.5rem;
}

.copy-row input {
  flex: 1 1 auto;
  min-inline-size: 0;
}

.dialog-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  margin-block-start: 0.25rem;
}

.btn-primary {
  padding-block: 0.5rem;
  padding-inline: 0.9rem;
  background-color: var(--brand-color);
  color: #0f172a;
  font-weight: 700;
  font-size: 0.84rem;
}

.btn-secondary {
  padding-block: 0.5rem;
  padding-inline: 0.85rem;
  background-color: var(--bg-elevated);
  border: 1px solid var(--border-color);
  font-weight: 600;
  font-size: 0.82rem;
}

.feedback-banner {
  padding: 0.5rem 0.75rem;
  border-radius: var(--radius-sm);
  background-color: rgba(22, 163, 74, 0.2);
  border: 1px solid rgba(22, 163, 74, 0.5);
  color: #86efac;
  font-size: 0.8rem;
  font-weight: 600;
}
</style>

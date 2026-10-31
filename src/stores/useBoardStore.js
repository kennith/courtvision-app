import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

const STORAGE_KEY = 'courtvision_saved_plays_v1'
const BLACK_INK = '#0f172a'

function createDefaultTokens(courtMode = 'half') {
  if (courtMode === 'full') {
    return [
      { id: 'O1', label: '1', role: 'PG', team: 'offense', x: 0.36, y: 0.50 },
      { id: 'O2', label: '2', role: 'SG', team: 'offense', x: 0.28, y: 0.22 },
      { id: 'O3', label: '3', role: 'SF', team: 'offense', x: 0.28, y: 0.78 },
      { id: 'O4', label: '4', role: 'PF', team: 'offense', x: 0.16, y: 0.35 },
      { id: 'O5', label: '5', role: 'C', team: 'offense', x: 0.14, y: 0.65 },
      { id: 'D1', label: 'X1', role: 'PG', team: 'defense', x: 0.29, y: 0.50 },
      { id: 'D2', label: 'X2', role: 'SG', team: 'defense', x: 0.22, y: 0.26 },
      { id: 'D3', label: 'X3', role: 'SF', team: 'defense', x: 0.22, y: 0.74 },
      { id: 'D4', label: 'X4', role: 'PF', team: 'defense', x: 0.12, y: 0.38 },
      { id: 'D5', label: 'X5', role: 'C', team: 'defense', x: 0.11, y: 0.60 },
      { id: 'BALL', label: '🏀', role: 'Ball', team: 'ball', x: 0.39, y: 0.47 }
    ]
  }
  return [
    { id: 'O1', label: '1', role: 'PG', team: 'offense', x: 0.50, y: 0.72 },
    { id: 'O2', label: '2', role: 'SG', team: 'offense', x: 0.20, y: 0.54 },
    { id: 'O3', label: '3', role: 'SF', team: 'offense', x: 0.80, y: 0.54 },
    { id: 'O4', label: '4', role: 'PF', team: 'offense', x: 0.36, y: 0.32 },
    { id: 'O5', label: '5', role: 'C', team: 'offense', x: 0.64, y: 0.32 },
    { id: 'D1', label: 'X1', role: 'PG', team: 'defense', x: 0.50, y: 0.60 },
    { id: 'D2', label: 'X2', role: 'SG', team: 'defense', x: 0.27, y: 0.46 },
    { id: 'D3', label: 'X3', role: 'SF', team: 'defense', x: 0.73, y: 0.46 },
    { id: 'D4', label: 'X4', role: 'PF', team: 'defense', x: 0.40, y: 0.24 },
    { id: 'D5', label: 'X5', role: 'C', team: 'defense', x: 0.60, y: 0.24 },
    { id: 'BALL', label: '🏀', role: 'Ball', team: 'ball', x: 0.54, y: 0.70 }
  ]
}

const DEFAULT_PLAYS = [
  {
    id: 'preset-horns-flare',
    title: 'Horns High Ball Screen & Flare',
    category: 'Offense',
    courtMode: 'half',
    updatedAt: '2026-10-30T12:00:00Z',
    frames: [
      {
        id: 'f1',
        name: '1. Initial Horns Alignment',
        tokens: [
          { id: 'O1', label: '1', role: 'PG', team: 'offense', x: 0.50, y: 0.72 },
          { id: 'O2', label: '2', role: 'SG', team: 'offense', x: 0.12, y: 0.22 },
          { id: 'O3', label: '3', role: 'SF', team: 'offense', x: 0.88, y: 0.22 },
          { id: 'O4', label: '4', role: 'PF', team: 'offense', x: 0.35, y: 0.45 },
          { id: 'O5', label: '5', role: 'C', team: 'offense', x: 0.65, y: 0.45 },
          { id: 'D1', label: 'X1', role: 'PG', team: 'defense', x: 0.50, y: 0.61 },
          { id: 'D2', label: 'X2', role: 'SG', team: 'defense', x: 0.18, y: 0.22 },
          { id: 'D3', label: 'X3', role: 'SF', team: 'defense', x: 0.82, y: 0.22 },
          { id: 'D4', label: 'X4', role: 'PF', team: 'defense', x: 0.37, y: 0.37 },
          { id: 'D5', label: 'X5', role: 'C', team: 'defense', x: 0.63, y: 0.37 },
          { id: 'BALL', label: '🏀', role: 'Ball', team: 'ball', x: 0.54, y: 0.70 }
        ],
        strokes: [
          {
            id: 's1',
            tool: 'screen',
            color: BLACK_INK,
            width: 4,
            points: [{ x: 0.35, y: 0.45 }, { x: 0.44, y: 0.66 }]
          },
          {
            id: 's2',
            tool: 'dribble',
            color: BLACK_INK,
            width: 4,
            points: [{ x: 0.50, y: 0.72 }, { x: 0.38, y: 0.64 }, { x: 0.28, y: 0.45 }]
          },
          {
            id: 's3',
            tool: 'arrow',
            color: BLACK_INK,
            width: 4,
            points: [{ x: 0.35, y: 0.45 }, { x: 0.44, y: 0.22 }]
          }
        ]
      },
      {
        id: 'f2',
        name: '2. Drive & Roll / Flare',
        tokens: [
          { id: 'O1', label: '1', role: 'PG', team: 'offense', x: 0.28, y: 0.45 },
          { id: 'O2', label: '2', role: 'SG', team: 'offense', x: 0.12, y: 0.22 },
          { id: 'O3', label: '3', role: 'SF', team: 'offense', x: 0.74, y: 0.58 },
          { id: 'O4', label: '4', role: 'PF', team: 'offense', x: 0.45, y: 0.22 },
          { id: 'O5', label: '5', role: 'C', team: 'offense', x: 0.62, y: 0.56 },
          { id: 'D1', label: 'X1', role: 'PG', team: 'defense', x: 0.35, y: 0.48 },
          { id: 'D2', label: 'X2', role: 'SG', team: 'defense', x: 0.22, y: 0.28 },
          { id: 'D3', label: 'X3', role: 'SF', team: 'defense', x: 0.70, y: 0.48 },
          { id: 'D4', label: 'X4', role: 'PF', team: 'defense', x: 0.34, y: 0.38 },
          { id: 'D5', label: 'X5', role: 'C', team: 'defense', x: 0.58, y: 0.35 },
          { id: 'BALL', label: '🏀', role: 'Ball', team: 'ball', x: 0.25, y: 0.43 }
        ],
        strokes: [
          {
            id: 's4',
            tool: 'pass',
            color: BLACK_INK,
            width: 4,
            points: [{ x: 0.28, y: 0.45 }, { x: 0.43, y: 0.23 }]
          },
          {
            id: 's5',
            tool: 'pass',
            color: BLACK_INK,
            width: 4,
            points: [{ x: 0.28, y: 0.45 }, { x: 0.14, y: 0.23 }]
          }
        ]
      },
      {
        id: 'f3',
        name: '3. Finish at Rim or Corner 3',
        tokens: [
          { id: 'O1', label: '1', role: 'PG', team: 'offense', x: 0.28, y: 0.45 },
          { id: 'O2', label: '2', role: 'SG', team: 'offense', x: 0.12, y: 0.20 },
          { id: 'O3', label: '3', role: 'SF', team: 'offense', x: 0.55, y: 0.68 },
          { id: 'O4', label: '4', role: 'PF', team: 'offense', x: 0.48, y: 0.16 },
          { id: 'O5', label: '5', role: 'C', team: 'offense', x: 0.66, y: 0.48 },
          { id: 'D1', label: 'X1', role: 'PG', team: 'defense', x: 0.33, y: 0.44 },
          { id: 'D2', label: 'X2', role: 'SG', team: 'defense', x: 0.19, y: 0.23 },
          { id: 'D3', label: 'X3', role: 'SF', team: 'defense', x: 0.55, y: 0.56 },
          { id: 'D4', label: 'X4', role: 'PF', team: 'defense', x: 0.43, y: 0.24 },
          { id: 'D5', label: 'X5', role: 'C', team: 'defense', x: 0.54, y: 0.22 },
          { id: 'BALL', label: '🏀', role: 'Ball', team: 'ball', x: 0.49, y: 0.15 }
        ],
        strokes: []
      }
    ]
  },
  {
    id: 'preset-23-zone-shift',
    title: '2-3 Zone Wing Trap & Weakside Rotation',
    category: 'Defense',
    courtMode: 'half',
    updatedAt: '2026-10-30T11:30:00Z',
    frames: [
      {
        id: 'z1',
        name: '1. Base 2-3 Alignment',
        tokens: [
          { id: 'O1', label: '1', role: 'PG', team: 'offense', x: 0.50, y: 0.72 },
          { id: 'O2', label: '2', role: 'SG', team: 'offense', x: 0.18, y: 0.50 },
          { id: 'O3', label: '3', role: 'SF', team: 'offense', x: 0.82, y: 0.50 },
          { id: 'O4', label: '4', role: 'PF', team: 'offense', x: 0.14, y: 0.18 },
          { id: 'O5', label: '5', role: 'C', team: 'offense', x: 0.50, y: 0.40 },
          { id: 'D1', label: 'X1', role: 'PG', team: 'defense', x: 0.38, y: 0.50 },
          { id: 'D2', label: 'X2', role: 'SG', team: 'defense', x: 0.62, y: 0.50 },
          { id: 'D3', label: 'X3', role: 'SF', team: 'defense', x: 0.26, y: 0.24 },
          { id: 'D4', label: 'X4', role: 'PF', team: 'defense', x: 0.74, y: 0.24 },
          { id: 'D5', label: 'X5', role: 'C', team: 'defense', x: 0.50, y: 0.20 },
          { id: 'BALL', label: '🏀', role: 'Ball', team: 'ball', x: 0.54, y: 0.70 }
        ],
        strokes: [
          {
            id: 'zs1',
            tool: 'pass',
            color: BLACK_INK,
            width: 4,
            points: [{ x: 0.50, y: 0.72 }, { x: 0.20, y: 0.50 }]
          },
          {
            id: 'zs2',
            tool: 'arrow',
            color: BLACK_INK,
            width: 4,
            points: [{ x: 0.38, y: 0.50 }, { x: 0.23, y: 0.53 }]
          },
          {
            id: 'zs3',
            tool: 'arrow',
            color: BLACK_INK,
            width: 4,
            points: [{ x: 0.26, y: 0.24 }, { x: 0.20, y: 0.44 }]
          }
        ]
      },
      {
        id: 'z2',
        name: '2. Wing Trap & Weakside Drop',
        tokens: [
          { id: 'O1', label: '1', role: 'PG', team: 'offense', x: 0.50, y: 0.72 },
          { id: 'O2', label: '2', role: 'SG', team: 'offense', x: 0.18, y: 0.50 },
          { id: 'O3', label: '3', role: 'SF', team: 'offense', x: 0.82, y: 0.50 },
          { id: 'O4', label: '4', role: 'PF', team: 'offense', x: 0.14, y: 0.18 },
          { id: 'O5', label: '5', role: 'C', team: 'offense', x: 0.44, y: 0.38 },
          { id: 'D1', label: 'X1', role: 'PG', team: 'defense', x: 0.23, y: 0.54 },
          { id: 'D2', label: 'X2', role: 'SG', team: 'defense', x: 0.46, y: 0.44 },
          { id: 'D3', label: 'X3', role: 'SF', team: 'defense', x: 0.20, y: 0.44 },
          { id: 'D4', label: 'X4', role: 'PF', team: 'defense', x: 0.56, y: 0.22 },
          { id: 'D5', label: 'X5', role: 'C', team: 'defense', x: 0.32, y: 0.20 },
          { id: 'BALL', label: '🏀', role: 'Ball', team: 'ball', x: 0.16, y: 0.49 }
        ],
        strokes: []
      }
    ]
  },
  {
    id: 'preset-box-elevator',
    title: 'BLOB Box Elevator Doors',
    category: 'Inbound',
    courtMode: 'half',
    updatedAt: '2026-10-30T10:15:00Z',
    frames: [
      {
        id: 'b1',
        name: '1. Box Set Under Basket',
        tokens: [
          { id: 'O1', label: '1', role: 'PG', team: 'offense', x: 0.36, y: 0.22 },
          { id: 'O2', label: '2', role: 'SG', team: 'offense', x: 0.64, y: 0.22 },
          { id: 'O3', label: '3', role: 'SF', team: 'offense', x: 0.42, y: 0.05 },
          { id: 'O4', label: '4', role: 'PF', team: 'offense', x: 0.36, y: 0.44 },
          { id: 'O5', label: '5', role: 'C', team: 'offense', x: 0.64, y: 0.44 },
          { id: 'D1', label: 'X1', role: 'PG', team: 'defense', x: 0.40, y: 0.20 },
          { id: 'D2', label: 'X2', role: 'SG', team: 'defense', x: 0.60, y: 0.20 },
          { id: 'D3', label: 'X3', role: 'SF', team: 'defense', x: 0.43, y: 0.12 },
          { id: 'D4', label: 'X4', role: 'PF', team: 'defense', x: 0.40, y: 0.39 },
          { id: 'D5', label: 'X5', role: 'C', team: 'defense', x: 0.60, y: 0.39 },
          { id: 'BALL', label: '🏀', role: 'Ball', team: 'ball', x: 0.42, y: 0.04 }
        ],
        strokes: [
          {
            id: 'bs1',
            tool: 'arrow',
            color: BLACK_INK,
            width: 4,
            points: [{ x: 0.64, y: 0.22 }, { x: 0.50, y: 0.32 }, { x: 0.50, y: 0.68 }]
          },
          {
            id: 'bs2',
            tool: 'screen',
            color: BLACK_INK,
            width: 4,
            points: [{ x: 0.36, y: 0.44 }, { x: 0.46, y: 0.44 }]
          },
          {
            id: 'bs3',
            tool: 'screen',
            color: BLACK_INK,
            width: 4,
            points: [{ x: 0.64, y: 0.44 }, { x: 0.54, y: 0.44 }]
          }
        ]
      },
      {
        id: 'b2',
        name: '2. Doors Close & Catch-and-Shoot',
        tokens: [
          { id: 'O1', label: '1', role: 'PG', team: 'offense', x: 0.16, y: 0.24 },
          { id: 'O2', label: '2', role: 'SG', team: 'offense', x: 0.50, y: 0.68 },
          { id: 'O3', label: '3', role: 'SF', team: 'offense', x: 0.42, y: 0.05 },
          { id: 'O4', label: '4', role: 'PF', team: 'offense', x: 0.46, y: 0.44 },
          { id: 'O5', label: '5', role: 'C', team: 'offense', x: 0.54, y: 0.44 },
          { id: 'D1', label: 'X1', role: 'PG', team: 'defense', x: 0.22, y: 0.24 },
          { id: 'D2', label: 'X2', role: 'SG', team: 'defense', x: 0.50, y: 0.36 },
          { id: 'D3', label: 'X3', role: 'SF', team: 'defense', x: 0.43, y: 0.12 },
          { id: 'D4', label: 'X4', role: 'PF', team: 'defense', x: 0.44, y: 0.38 },
          { id: 'D5', label: 'X5', role: 'C', team: 'defense', x: 0.56, y: 0.38 },
          { id: 'BALL', label: '🏀', role: 'Ball', team: 'ball', x: 0.50, y: 0.65 }
        ],
        strokes: []
      }
    ]
  }
]

function cloneDeep(obj) {
  return JSON.parse(JSON.stringify(obj))
}

export const useBoardStore = defineStore('board', () => {
  // Active board settings
  const currentPlayId = ref(null)
  const playTitle = ref('Untitled Play')
  const playCategory = ref('Offense')
  const courtMode = ref('half') // 'half' | 'full'
  const courtRotated = ref(false)
  const showDefense = ref(true)
  const showPlayerRoles = ref(true)

  // Marker & tool state (fixed black dry-erase ink, 5px tip)
  const activeTool = ref('pen') // 'select' | 'pen' | 'arrow' | 'pass' | 'dribble' | 'screen' | 'eraser'
  const markerColor = ref(BLACK_INK)
  const markerWidth = ref(5)

  // Multi-frame animation state
  const frames = ref([
    {
      id: 'frame-1',
      name: '1. Setup',
      tokens: createDefaultTokens('half'),
      strokes: []
    }
  ])
  const currentFrameIndex = ref(0)
  const redoStacks = ref([[]])

  // Playback state
  const isPlaying = ref(false)
  const isLooping = ref(true)
  const playbackSpeed = ref(1)
  const animationProgress = ref(0)

  // Saved plays in localStorage
  const savedPlays = ref(loadSavedPlays())

  function loadSavedPlays() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (!raw) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_PLAYS))
        return cloneDeep(DEFAULT_PLAYS)
      }
      const parsed = JSON.parse(raw)
      return Array.isArray(parsed) && parsed.length > 0 ? parsed : cloneDeep(DEFAULT_PLAYS)
    } catch {
      return cloneDeep(DEFAULT_PLAYS)
    }
  }

  function persistPlays() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(savedPlays.value))
    } catch (e) {
      console.error('Failed to save plays to localStorage:', e)
    }
  }

  const currentFrame = computed(() => {
    return frames.value[currentFrameIndex.value] || frames.value[0]
  })

  const displayedTokens = computed(() => {
    if (!isPlaying.value || frames.value.length < 2) {
      return currentFrame.value.tokens
    }
    const totalTransitions = frames.value.length - 1
    const clamped = Math.max(0, Math.min(totalTransitions, animationProgress.value))
    const fromIdx = Math.min(Math.floor(clamped), totalTransitions - 1)
    const toIdx = fromIdx + 1
    const t = clamped - fromIdx
    const smoothT = t * t * (3 - 2 * t)

    const fromTokens = frames.value[fromIdx].tokens
    const toTokens = frames.value[toIdx].tokens

    return fromTokens.map((token) => {
      const target = toTokens.find((tk) => tk.id === token.id)
      if (!target) return token
      return {
        ...token,
        x: token.x + (target.x - token.x) * smoothT,
        y: token.y + (target.y - token.y) * smoothT
      }
    })
  })

  const displayedStrokes = computed(() => {
    if (!isPlaying.value || frames.value.length < 2) {
      return currentFrame.value.strokes
    }
    const idx = Math.min(frames.value.length - 1, Math.floor(animationProgress.value))
    return frames.value[idx].strokes
  })

  function addStroke(stroke) {
    currentFrame.value.strokes.push({
      ...stroke,
      color: BLACK_INK,
      width: 5
    })
    if (!redoStacks.value[currentFrameIndex.value]) {
      redoStacks.value[currentFrameIndex.value] = []
    }
    redoStacks.value[currentFrameIndex.value] = []
  }

  function removeStrokeById(strokeId) {
    const idx = currentFrame.value.strokes.findIndex((s) => s.id === strokeId)
    if (idx !== -1) {
      currentFrame.value.strokes.splice(idx, 1)
    }
  }

  function undoStroke() {
    const strokes = currentFrame.value.strokes
    if (strokes.length === 0) return
    const popped = strokes.pop()
    if (!redoStacks.value[currentFrameIndex.value]) {
      redoStacks.value[currentFrameIndex.value] = []
    }
    redoStacks.value[currentFrameIndex.value].push(popped)
  }

  function redoStroke() {
    const stack = redoStacks.value[currentFrameIndex.value]
    if (!stack || stack.length === 0) return
    const restored = stack.pop()
    currentFrame.value.strokes.push(restored)
  }

  function clearCurrentStrokes() {
    currentFrame.value.strokes = []
    redoStacks.value[currentFrameIndex.value] = []
  }

  function updateTokenPosition(tokenId, x, y) {
    const token = currentFrame.value.tokens.find((t) => t.id === tokenId)
    if (token) {
      token.x = Math.max(0.03, Math.min(0.97, x))
      token.y = Math.max(0.03, Math.min(0.97, y))
    }
  }

  function addFrame() {
    const baseFrame = currentFrame.value
    const nextNumber = frames.value.length + 1
    const newFrame = {
      id: `frame-${Date.now()}`,
      name: `${nextNumber}. Step ${nextNumber}`,
      tokens: cloneDeep(baseFrame.tokens),
      strokes: []
    }
    frames.value.splice(currentFrameIndex.value + 1, 0, newFrame)
    redoStacks.value.splice(currentFrameIndex.value + 1, 0, [])
    currentFrameIndex.value += 1
  }

  function deleteFrame(index) {
    if (frames.value.length <= 1) return
    frames.value.splice(index, 1)
    redoStacks.value.splice(index, 1)
    if (currentFrameIndex.value >= frames.value.length) {
      currentFrameIndex.value = frames.value.length - 1
    }
  }

  function selectFrame(index) {
    if (index >= 0 && index < frames.value.length) {
      isPlaying.value = false
      currentFrameIndex.value = index
      animationProgress.value = index
    }
  }

  function applyFormation(presetName) {
    isPlaying.value = false
    const tokens = currentFrame.value.tokens
    const setCoords = (map) => {
      tokens.forEach((tk) => {
        if (map[tk.id]) {
          tk.x = map[tk.id].x
          tk.y = map[tk.id].y
        }
      })
    }

    if (courtMode.value === 'full') {
      setCoords({
        O1: { x: 0.36, y: 0.50 },
        O2: { x: 0.28, y: 0.22 },
        O3: { x: 0.28, y: 0.78 },
        O4: { x: 0.16, y: 0.35 },
        O5: { x: 0.14, y: 0.65 },
        D1: { x: 0.29, y: 0.50 },
        D2: { x: 0.22, y: 0.26 },
        D3: { x: 0.22, y: 0.74 },
        D4: { x: 0.12, y: 0.38 },
        D5: { x: 0.11, y: 0.60 },
        BALL: { x: 0.39, y: 0.47 }
      })
      return
    }

    switch (presetName) {
      case '5-out':
        setCoords({
          O1: { x: 0.50, y: 0.74 },
          O2: { x: 0.16, y: 0.56 },
          O3: { x: 0.84, y: 0.56 },
          O4: { x: 0.12, y: 0.20 },
          O5: { x: 0.88, y: 0.20 },
          D1: { x: 0.50, y: 0.62 },
          D2: { x: 0.24, y: 0.48 },
          D3: { x: 0.76, y: 0.48 },
          D4: { x: 0.20, y: 0.20 },
          D5: { x: 0.80, y: 0.20 },
          BALL: { x: 0.54, y: 0.72 }
        })
        break
      case 'horns':
        setCoords({
          O1: { x: 0.50, y: 0.72 },
          O2: { x: 0.12, y: 0.20 },
          O3: { x: 0.88, y: 0.20 },
          O4: { x: 0.35, y: 0.44 },
          O5: { x: 0.65, y: 0.44 },
          D1: { x: 0.50, y: 0.60 },
          D2: { x: 0.19, y: 0.20 },
          D3: { x: 0.81, y: 0.20 },
          D4: { x: 0.37, y: 0.36 },
          D5: { x: 0.63, y: 0.36 },
          BALL: { x: 0.54, y: 0.70 }
        })
        break
      case '1-4-high':
        setCoords({
          O1: { x: 0.50, y: 0.72 },
          O2: { x: 0.16, y: 0.44 },
          O3: { x: 0.84, y: 0.44 },
          O4: { x: 0.36, y: 0.44 },
          O5: { x: 0.64, y: 0.44 },
          D1: { x: 0.50, y: 0.60 },
          D2: { x: 0.22, y: 0.36 },
          D3: { x: 0.78, y: 0.36 },
          D4: { x: 0.38, y: 0.34 },
          D5: { x: 0.62, y: 0.34 },
          BALL: { x: 0.54, y: 0.70 }
        })
        break
      case 'box':
        setCoords({
          O1: { x: 0.50, y: 0.70 },
          O2: { x: 0.36, y: 0.44 },
          O3: { x: 0.64, y: 0.44 },
          O4: { x: 0.36, y: 0.20 },
          O5: { x: 0.64, y: 0.20 },
          D1: { x: 0.50, y: 0.58 },
          D2: { x: 0.40, y: 0.38 },
          D3: { x: 0.60, y: 0.38 },
          D4: { x: 0.40, y: 0.18 },
          D5: { x: 0.60, y: 0.18 },
          BALL: { x: 0.54, y: 0.68 }
        })
        break
      case '2-3-zone':
        setCoords({
          O1: { x: 0.50, y: 0.72 },
          O2: { x: 0.18, y: 0.52 },
          O3: { x: 0.82, y: 0.52 },
          O4: { x: 0.16, y: 0.18 },
          O5: { x: 0.50, y: 0.38 },
          D1: { x: 0.38, y: 0.48 },
          D2: { x: 0.62, y: 0.48 },
          D3: { x: 0.26, y: 0.22 },
          D4: { x: 0.74, y: 0.22 },
          D5: { x: 0.50, y: 0.20 },
          BALL: { x: 0.54, y: 0.70 }
        })
        break
      default:
        currentFrame.value.tokens = createDefaultTokens(courtMode.value)
    }
  }

  function rotateBoard() {
    courtRotated.value = !courtRotated.value
  }

  function setCourtMode(mode) {
    if (courtMode.value === mode) return
    courtMode.value = mode
    isPlaying.value = false
    frames.value = [
      {
        id: `frame-${Date.now()}`,
        name: '1. Setup',
        tokens: createDefaultTokens(mode),
        strokes: []
      }
    ]
    currentFrameIndex.value = 0
    redoStacks.value = [[]]
  }

  function resetNewPlay() {
    isPlaying.value = false
    currentPlayId.value = null
    playTitle.value = 'Untitled Play'
    playCategory.value = 'Offense'
    frames.value = [
      {
        id: `frame-${Date.now()}`,
        name: '1. Setup',
        tokens: createDefaultTokens(courtMode.value),
        strokes: []
      }
    ]
    currentFrameIndex.value = 0
    redoStacks.value = [[]]
  }

  function saveCurrentPlay({ title, category }) {
    const finalTitle = (title || playTitle.value || 'Untitled Play').trim()
    const finalCategory = category || playCategory.value || 'Offense'

    playTitle.value = finalTitle
    playCategory.value = finalCategory

    const existingIdx = savedPlays.value.findIndex((p) => p.id === currentPlayId.value)
    const payload = {
      id: currentPlayId.value || `play-${Date.now()}`,
      title: finalTitle,
      category: finalCategory,
      courtMode: courtMode.value,
      updatedAt: new Date().toISOString(),
      frames: cloneDeep(frames.value)
    }

    if (existingIdx !== -1) {
      savedPlays.value[existingIdx] = payload
    } else {
      currentPlayId.value = payload.id
      savedPlays.value.unshift(payload)
    }
    persistPlays()
    return payload
  }

  function loadPlay(play) {
    if (!play) return
    isPlaying.value = false
    currentPlayId.value = play.id || null
    playTitle.value = play.title || 'Loaded Play'
    playCategory.value = play.category || 'Offense'
    courtMode.value = play.courtMode || 'half'
    frames.value = cloneDeep(play.frames || [
      {
        id: 'frame-1',
        name: '1. Setup',
        tokens: createDefaultTokens(courtMode.value),
        strokes: []
      }
    ])
    currentFrameIndex.value = 0
    animationProgress.value = 0
    redoStacks.value = frames.value.map(() => [])
  }

  function deleteSavedPlay(playId) {
    savedPlays.value = savedPlays.value.filter((p) => p.id !== playId)
    if (currentPlayId.value === playId) {
      currentPlayId.value = null
    }
    persistPlays()
  }

  function serializeCurrentPlay() {
    return JSON.stringify({
      title: playTitle.value,
      category: playCategory.value,
      courtMode: courtMode.value,
      frames: frames.value
    })
  }

  function importPlayFromJson(jsonString) {
    const parsed = JSON.parse(jsonString)
    if (!parsed || !Array.isArray(parsed.frames) || parsed.frames.length === 0) {
      throw new Error('Invalid play format: missing frames array.')
    }
    const imported = {
      id: `imported-${Date.now()}`,
      title: parsed.title || 'Imported Play',
      category: parsed.category || 'Offense',
      courtMode: parsed.courtMode || 'half',
      updatedAt: new Date().toISOString(),
      frames: parsed.frames
    }
    savedPlays.value.unshift(imported)
    persistPlays()
    loadPlay(imported)
    return imported
  }

  return {
    currentPlayId,
    playTitle,
    playCategory,
    courtMode,
    courtRotated,
    showDefense,
    showPlayerRoles,
    activeTool,
    markerColor,
    markerWidth,
    frames,
    currentFrameIndex,
    currentFrame,
    redoStacks,
    isPlaying,
    isLooping,
    playbackSpeed,
    animationProgress,
    displayedTokens,
    displayedStrokes,
    savedPlays,
    addStroke,
    removeStrokeById,
    undoStroke,
    redoStroke,
    clearCurrentStrokes,
    updateTokenPosition,
    addFrame,
    deleteFrame,
    selectFrame,
    applyFormation,
    rotateBoard,
    setCourtMode,
    resetNewPlay,
    saveCurrentPlay,
    loadPlay,
    deleteSavedPlay,
    serializeCurrentPlay,
    importPlayFromJson
  }
})

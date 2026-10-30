<script setup>
import { ref, watch, onMounted, onBeforeUnmount } from 'vue'
import { useBoardStore } from '@/stores/useBoardStore'

const boardStore = useBoardStore()

const containerRef = ref(null)
const canvasRef = ref(null)

let resizeObserver = null
let animationFrameId = null
let lastTimestamp = 0

// Interaction state
const draggingTokenId = ref(null)
const isDrawing = ref(false)
const activeStrokePoints = ref([])

// Convert pointer event to normalized (0..1) court coordinates
function getNormalizedCoords(event) {
  const canvas = canvasRef.value
  if (!canvas) return { x: 0.5, y: 0.5 }
  const rect = canvas.getBoundingClientRect()
  const x = Math.max(0.01, Math.min(0.99, (event.clientX - rect.left) / rect.width))
  const y = Math.max(0.01, Math.min(0.99, (event.clientY - rect.top) / rect.height))
  return { x, y }
}

function findHitToken(normX, normY) {
  const canvas = canvasRef.value
  if (!canvas) return null
  const rect = canvas.getBoundingClientRect()
  const hitRadiusPx = 24
  const tokens = boardStore.displayedTokens
  for (let i = tokens.length - 1; i >= 0; i--) {
    const tk = tokens[i]
    if (!boardStore.showDefense && tk.team === 'defense') continue
    const dx = (tk.x - normX) * rect.width
    const dy = (tk.y - normY) * rect.height
    if (Math.hypot(dx, dy) <= hitRadiusPx) {
      return tk
    }
  }
  return null
}

function eraseStrokesNear(normX, normY) {
  const canvas = canvasRef.value
  if (!canvas) return
  const rect = canvas.getBoundingClientRect()
  const thresholdPx = 18

  const strokes = boardStore.currentFrame.strokes
  for (let i = strokes.length - 1; i >= 0; i--) {
    const st = strokes[i]
    const hit = st.points.some((pt) => {
      const dx = (pt.x - normX) * rect.width
      const dy = (pt.y - normY) * rect.height
      return Math.hypot(dx, dy) <= thresholdPx
    })
    if (hit) {
      boardStore.removeStrokeById(st.id)
    }
  }
}

function onPointerDown(event) {
  if (boardStore.isPlaying) {
    boardStore.isPlaying = false
  }
  const canvas = canvasRef.value
  if (!canvas) return
  canvas.setPointerCapture(event.pointerId)

  const { x, y } = getNormalizedCoords(event)

  // Always allow dragging a player or ball if clicked directly, or when tool === 'select'
  const hitToken = findHitToken(x, y)
  if (hitToken && (boardStore.activeTool === 'select' || event.button === 0)) {
    draggingTokenId.value = hitToken.id
    renderBoard()
    return
  }

  if (boardStore.activeTool === 'select') return

  if (boardStore.activeTool === 'eraser') {
    isDrawing.value = true
    eraseStrokesNear(x, y)
    renderBoard()
    return
  }

  isDrawing.value = true
  activeStrokePoints.value = [{ x, y }]
  renderBoard()
}

function onPointerMove(event) {
  if (!draggingTokenId.value && !isDrawing.value) return
  const { x, y } = getNormalizedCoords(event)

  if (draggingTokenId.value) {
    boardStore.updateTokenPosition(draggingTokenId.value, x, y)
    renderBoard()
    return
  }

  if (isDrawing.value) {
    if (boardStore.activeTool === 'eraser') {
      eraseStrokesNear(x, y)
      renderBoard()
      return
    }

    const tool = boardStore.activeTool
    if (tool === 'arrow' || tool === 'pass' || tool === 'screen') {
      if (activeStrokePoints.value.length === 1) {
        activeStrokePoints.value.push({ x, y })
      } else {
        activeStrokePoints.value[1] = { x, y }
      }
    } else {
      const last = activeStrokePoints.value[activeStrokePoints.value.length - 1]
      const dist = Math.hypot(x - last.x, y - last.y)
      if (dist > 0.004) {
        activeStrokePoints.value.push({ x, y })
      }
    }
    renderBoard()
  }
}

function onPointerUp(event) {
  const canvas = canvasRef.value
  if (canvas && canvas.hasPointerCapture(event.pointerId)) {
    canvas.releasePointerCapture(event.pointerId)
  }

  if (draggingTokenId.value) {
    draggingTokenId.value = null
    renderBoard()
    return
  }

  if (isDrawing.value) {
    isDrawing.value = false
    if (boardStore.activeTool !== 'eraser' && activeStrokePoints.value.length >= 2) {
      boardStore.addStroke({
        id: `st-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        tool: boardStore.activeTool,
        color: '#0f172a',
        width: boardStore.markerWidth,
        points: [...activeStrokePoints.value]
      })
    }
    activeStrokePoints.value = []
    renderBoard()
  }
}

// Drawing helpers (Whiteboard court only)
function drawCourtMarkings(ctx, w, h) {
  const mode = boardStore.courtMode

  // 1. Whiteboard background surface
  ctx.fillStyle = '#f8fafc'
  ctx.fillRect(0, 0, w, h)
  ctx.fillStyle = 'rgba(148, 163, 184, 0.22)'
  const step = Math.max(24, Math.round(w / 28))
  for (let gx = step; gx < w; gx += step) {
    for (let gy = step; gy < h; gy += step) {
      ctx.fillRect(gx, gy, 1.5, 1.5)
    }
  }

  const lineColor = '#1e293b'
  const paintFill = 'rgba(37, 99, 235, 0.07)'

  ctx.save()
  ctx.strokeStyle = lineColor
  ctx.lineWidth = Math.max(2, w * 0.0032)
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'

  const pad = w * 0.04
  const cw = w - pad * 2
  const ch = h - pad * 2

  // Outer boundary
  ctx.strokeRect(pad, pad, cw, ch)

  if (mode === 'half') {
    const cx = w / 2
    const topY = pad
    const bottomY = pad + ch

    // Key / Paint
    const keyW = cw * 0.32
    const keyH = ch * 0.40
    ctx.fillStyle = paintFill
    ctx.fillRect(cx - keyW / 2, topY, keyW, keyH)
    ctx.strokeRect(cx - keyW / 2, topY, keyW, keyH)

    // Free throw circle
    const ftRadius = keyW * 0.375
    ctx.beginPath()
    ctx.arc(cx, topY + keyH, ftRadius, 0, Math.PI, false)
    ctx.stroke()

    ctx.save()
    ctx.setLineDash([6, 6])
    ctx.beginPath()
    ctx.arc(cx, topY + keyH, ftRadius, Math.PI, Math.PI * 2, false)
    ctx.stroke()
    ctx.restore()

    // Backboard & Rim
    const backboardW = cw * 0.12
    const backboardY = topY + ch * 0.055
    ctx.beginPath()
    ctx.moveTo(cx - backboardW / 2, backboardY)
    ctx.lineTo(cx + backboardW / 2, backboardY)
    ctx.stroke()

    const rimRadius = cw * 0.02
    const rimY = backboardY + rimRadius * 1.4
    ctx.save()
    ctx.strokeStyle = '#ea580c'
    ctx.lineWidth = Math.max(2.5, w * 0.004)
    ctx.beginPath()
    ctx.arc(cx, rimY, rimRadius, 0, Math.PI * 2)
    ctx.stroke()
    ctx.restore()

    // Restricted area arc
    ctx.beginPath()
    ctx.arc(cx, rimY, cw * 0.08, 0, Math.PI, false)
    ctx.stroke()

    // Regulation-proportioned 3-Point Line
    const threeRadius = Math.min(cw * 0.44, ch * 0.56)
    const cornerXOffset = threeRadius * (22 / 23.75)
    const dy = Math.sqrt(threeRadius * threeRadius - cornerXOffset * cornerXOffset)
    const cornerBreakY = rimY + dy
    const startAngle = Math.atan2(dy, -cornerXOffset)
    const endAngle = Math.atan2(dy, cornerXOffset)

    ctx.beginPath()
    ctx.moveTo(cx - cornerXOffset, topY)
    ctx.lineTo(cx - cornerXOffset, cornerBreakY)
    ctx.arc(cx, rimY, threeRadius, startAngle, endAngle, true)
    ctx.lineTo(cx + cornerXOffset, topY)
    ctx.stroke()

    // Half-court center circle at bottom
    ctx.beginPath()
    ctx.arc(cx, bottomY, cw * 0.12, Math.PI, Math.PI * 2)
    ctx.stroke()
  } else {
    // Full Court (Horizontal: Left basket and Right basket)
    const leftX = pad
    const rightX = pad + cw
    const midX = w / 2
    const midY = h / 2

    // Center line & circle
    ctx.beginPath()
    ctx.moveTo(midX, pad)
    ctx.lineTo(midX, pad + ch)
    ctx.stroke()

    ctx.beginPath()
    ctx.arc(midX, midY, ch * 0.18, 0, Math.PI * 2)
    ctx.stroke()

    const keyLength = cw * 0.19
    const keyHeight = ch * 0.34
    const threeRadius = ch * 0.43
    const cornerYOffset = threeRadius * (22 / 23.75)
    const dx = Math.sqrt(threeRadius * threeRadius - cornerYOffset * cornerYOffset)

    // --- Left Court ---
    ctx.fillStyle = paintFill
    ctx.fillRect(leftX, midY - keyHeight / 2, keyLength, keyHeight)
    ctx.strokeRect(leftX, midY - keyHeight / 2, keyLength, keyHeight)

    ctx.beginPath()
    ctx.arc(leftX + keyLength, midY, keyHeight * 0.36, -Math.PI / 2, Math.PI / 2)
    ctx.stroke()

    const leftBackboardX = leftX + cw * 0.032
    const leftRimRadius = ch * 0.025
    const leftRimX = leftBackboardX + leftRimRadius * 1.35

    ctx.beginPath()
    ctx.moveTo(leftBackboardX, midY - ch * 0.06)
    ctx.lineTo(leftBackboardX, midY + ch * 0.06)
    ctx.stroke()

    const leftBreakX = leftRimX + dx
    const leftStartAngle = Math.atan2(-cornerYOffset, dx)
    const leftEndAngle = Math.atan2(cornerYOffset, dx)
    ctx.beginPath()
    ctx.moveTo(leftX, midY - cornerYOffset)
    ctx.lineTo(leftBreakX, midY - cornerYOffset)
    ctx.arc(leftRimX, midY, threeRadius, leftStartAngle, leftEndAngle, false)
    ctx.lineTo(leftX, midY + cornerYOffset)
    ctx.stroke()

    ctx.save()
    ctx.strokeStyle = '#ea580c'
    ctx.beginPath()
    ctx.arc(leftRimX, midY, leftRimRadius, 0, Math.PI * 2)
    ctx.stroke()
    ctx.restore()

    // --- Right Court ---
    ctx.fillStyle = paintFill
    ctx.fillRect(rightX - keyLength, midY - keyHeight / 2, keyLength, keyHeight)
    ctx.strokeRect(rightX - keyLength, midY - keyHeight / 2, keyLength, keyHeight)

    ctx.beginPath()
    ctx.arc(rightX - keyLength, midY, keyHeight * 0.36, Math.PI / 2, -Math.PI / 2)
    ctx.stroke()

    const rightBackboardX = rightX - cw * 0.032
    const rightRimRadius = ch * 0.025
    const rightRimX = rightBackboardX - rightRimRadius * 1.35

    ctx.beginPath()
    ctx.moveTo(rightBackboardX, midY - ch * 0.06)
    ctx.lineTo(rightBackboardX, midY + ch * 0.06)
    ctx.stroke()

    const rightBreakX = rightRimX - dx
    const rightStartAngle = Math.atan2(-cornerYOffset, -dx)
    const rightEndAngle = Math.atan2(cornerYOffset, -dx)
    ctx.beginPath()
    ctx.moveTo(rightX, midY - cornerYOffset)
    ctx.lineTo(rightBreakX, midY - cornerYOffset)
    ctx.arc(rightRimX, midY, threeRadius, rightStartAngle, rightEndAngle, true)
    ctx.lineTo(rightX, midY + cornerYOffset)
    ctx.stroke()

    ctx.save()
    ctx.strokeStyle = '#ea580c'
    ctx.beginPath()
    ctx.arc(rightRimX, midY, rightRimRadius, 0, Math.PI * 2)
    ctx.stroke()
    ctx.restore()
  }

  ctx.restore()
}

function drawArrowhead(ctx, fromX, fromY, toX, toY, size) {
  const angle = Math.atan2(toY - fromY, toX - fromX)
  ctx.beginPath()
  ctx.moveTo(toX, toY)
  ctx.lineTo(
    toX - size * Math.cos(angle - Math.PI / 6),
    toY - size * Math.sin(angle - Math.PI / 6)
  )
  ctx.lineTo(
    toX - size * Math.cos(angle + Math.PI / 6),
    toY - size * Math.sin(angle + Math.PI / 6)
  )
  ctx.closePath()
  ctx.fill()
}

function drawScreenTBar(ctx, fromX, fromY, toX, toY, size) {
  const angle = Math.atan2(toY - fromY, toX - fromX)
  const perp = angle + Math.PI / 2
  ctx.beginPath()
  ctx.moveTo(toX - size * Math.cos(perp), toY - size * Math.sin(perp))
  ctx.lineTo(toX + size * Math.cos(perp), toY + size * Math.sin(perp))
  ctx.stroke()
}

function drawSingleStroke(ctx, stroke, w, h) {
  const pts = stroke.points
  if (!pts || pts.length < 2) return

  ctx.save()
  ctx.strokeStyle = '#0f172a'
  ctx.fillStyle = '#0f172a'
  ctx.lineWidth = stroke.width * (w / 700)
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'

  const pixelPts = pts.map((p) => ({ x: p.x * w, y: p.y * h }))
  const first = pixelPts[0]
  const last = pixelPts[pixelPts.length - 1]
  const prev = pixelPts[Math.max(0, pixelPts.length - 2)]
  const headSize = Math.max(11, stroke.width * 3.4 * (w / 750))

  if (stroke.tool === 'pass') {
    ctx.setLineDash([10, 8])
  }

  if (stroke.tool === 'dribble') {
    ctx.beginPath()
    ctx.moveTo(first.x, first.y)
    let cumulativeDist = 0
    for (let i = 1; i < pixelPts.length; i++) {
      const p0 = pixelPts[i - 1]
      const p1 = pixelPts[i]
      const segLen = Math.hypot(p1.x - p0.x, p1.y - p0.y)
      const angle = Math.atan2(p1.y - p0.y, p1.x - p0.x)
      const perp = angle + Math.PI / 2
      const steps = Math.max(1, Math.floor(segLen / 6))
      for (let s = 1; s <= steps; s++) {
        const t = s / steps
        const bx = p0.x + (p1.x - p0.x) * t
        const by = p0.y + (p1.y - p0.y) * t
        cumulativeDist += segLen / steps
        const wave = Math.sin(cumulativeDist * 0.25) * 5.5
        ctx.lineTo(bx + Math.cos(perp) * wave, by + Math.sin(perp) * wave)
      }
    }
    ctx.stroke()
    ctx.setLineDash([])
    drawArrowhead(ctx, prev.x, prev.y, last.x, last.y, headSize)
  } else {
    ctx.beginPath()
    ctx.moveTo(first.x, first.y)
    for (let i = 1; i < pixelPts.length; i++) {
      ctx.lineTo(pixelPts[i].x, pixelPts[i].y)
    }
    ctx.stroke()
    ctx.setLineDash([])

    if (stroke.tool === 'arrow' || stroke.tool === 'pass') {
      drawArrowhead(ctx, prev.x, prev.y, last.x, last.y, headSize)
    } else if (stroke.tool === 'screen') {
      drawScreenTBar(ctx, prev.x, prev.y, last.x, last.y, headSize * 0.95)
    }
  }

  ctx.restore()
}

function drawGhostPaths(ctx, w, h) {
  if (boardStore.frames.length < 2) return
  const curIdx = boardStore.currentFrameIndex
  const nextFrame = boardStore.frames[curIdx + 1]
  if (!nextFrame || boardStore.isPlaying) return

  const curTokens = boardStore.currentFrame.tokens
  ctx.save()
  ctx.setLineDash([4, 6])
  ctx.lineWidth = 2

  curTokens.forEach((tk) => {
    if (!boardStore.showDefense && tk.team === 'defense') return
    const nextTk = nextFrame.tokens.find((nt) => nt.id === tk.id)
    if (!nextTk) return
    const dist = Math.hypot(nextTk.x - tk.x, nextTk.y - tk.y)
    if (dist > 0.015) {
      ctx.strokeStyle =
        tk.team === 'offense'
          ? 'rgba(37, 99, 235, 0.45)'
          : tk.team === 'defense'
          ? 'rgba(220, 38, 38, 0.45)'
          : 'rgba(234, 88, 12, 0.55)'
      ctx.beginPath()
      ctx.moveTo(tk.x * w, tk.y * h)
      ctx.lineTo(nextTk.x * w, nextTk.y * h)
      ctx.stroke()
    }
  })
  ctx.restore()
}

function drawTokens(ctx, w, h) {
  const tokens = boardStore.displayedTokens
  const tokenRadius = Math.max(15, Math.min(24, w * 0.027))

  tokens.forEach((tk) => {
    if (!boardStore.showDefense && tk.team === 'defense') return

    const cx = tk.x * w
    const cy = tk.y * h

    ctx.save()

    if (tk.team === 'ball') {
      const ballRadius = tokenRadius * 0.72
      ctx.beginPath()
      ctx.arc(cx, cy, ballRadius, 0, Math.PI * 2)
      ctx.fillStyle = '#ea580c'
      ctx.fill()
      ctx.lineWidth = 2
      ctx.strokeStyle = '#1e293b'
      ctx.stroke()

      ctx.beginPath()
      ctx.moveTo(cx - ballRadius, cy)
      ctx.lineTo(cx + ballRadius, cy)
      ctx.moveTo(cx, cy - ballRadius)
      ctx.lineTo(cx, cy + ballRadius)
      ctx.stroke()
      ctx.restore()
      return
    }

    ctx.shadowColor = 'rgba(0, 0, 0, 0.35)'
    ctx.shadowBlur = 6
    ctx.shadowOffsetY = 2

    ctx.beginPath()
    ctx.arc(cx, cy, tokenRadius, 0, Math.PI * 2)
    ctx.fillStyle = tk.team === 'offense' ? '#2563eb' : '#dc2626'
    ctx.fill()

    ctx.shadowColor = 'transparent'
    ctx.lineWidth = 2.5
    ctx.strokeStyle = '#ffffff'
    ctx.stroke()

    ctx.fillStyle = '#ffffff'
    ctx.font = `700 ${Math.round(tokenRadius * 0.82)}px Inter, sans-serif`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(tk.label, cx, cy)

    if (boardStore.showPlayerRoles && tk.role) {
      ctx.font = `600 ${Math.round(tokenRadius * 0.52)}px Inter, sans-serif`
      ctx.fillStyle = '#0f172a'
      ctx.fillText(tk.role, cx, cy + tokenRadius + 10)
    }

    ctx.restore()
  })
}

function renderBoard() {
  const canvas = canvasRef.value
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  const dpr = window.devicePixelRatio || 1
  const cssW = canvas.width / dpr
  const cssH = canvas.height / dpr

  ctx.save()
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

  drawCourtMarkings(ctx, cssW, cssH)
  drawGhostPaths(ctx, cssW, cssH)

  boardStore.displayedStrokes.forEach((stroke) => {
    drawSingleStroke(ctx, stroke, cssW, cssH)
  })

  if (isDrawing.value && activeStrokePoints.value.length >= 2) {
    drawSingleStroke(
      ctx,
      {
        tool: boardStore.activeTool,
        color: '#0f172a',
        width: boardStore.markerWidth,
        points: activeStrokePoints.value
      },
      cssW,
      cssH
    )
  }

  drawTokens(ctx, cssW, cssH)
  ctx.restore()
}

function tickAnimation(timestamp) {
  if (!boardStore.isPlaying) {
    lastTimestamp = 0
    return
  }
  if (!lastTimestamp) lastTimestamp = timestamp
  const dtSeconds = (timestamp - lastTimestamp) / 1000
  lastTimestamp = timestamp

  const totalTransitions = boardStore.frames.length - 1
  if (totalTransitions <= 0) {
    boardStore.isPlaying = false
    return
  }

  const stepPerSec = (1 / 1.4) * boardStore.playbackSpeed
  boardStore.animationProgress += dtSeconds * stepPerSec

  if (boardStore.animationProgress >= totalTransitions) {
    if (boardStore.isLooping) {
      boardStore.animationProgress = 0
      boardStore.currentFrameIndex = 0
    } else {
      boardStore.animationProgress = totalTransitions
      boardStore.currentFrameIndex = totalTransitions
      boardStore.isPlaying = false
    }
  } else {
    boardStore.currentFrameIndex = Math.floor(boardStore.animationProgress)
  }

  renderBoard()
  if (boardStore.isPlaying) {
    animationFrameId = requestAnimationFrame(tickAnimation)
  }
}

watch(
  () => boardStore.isPlaying,
  (playing) => {
    if (playing) {
      if (boardStore.frames.length < 2) {
        boardStore.isPlaying = false
        return
      }
      if (boardStore.animationProgress >= boardStore.frames.length - 1) {
        boardStore.animationProgress = 0
      }
      lastTimestamp = 0
      animationFrameId = requestAnimationFrame(tickAnimation)
    } else if (animationFrameId) {
      cancelAnimationFrame(animationFrameId)
      animationFrameId = null
      renderBoard()
    }
  }
)

watch(
  () => [
    boardStore.currentFrameIndex,
    boardStore.courtMode,
    boardStore.showDefense,
    boardStore.showPlayerRoles,
    boardStore.currentFrame.strokes.length,
    boardStore.currentFrame.tokens
  ],
  () => {
    renderBoard()
  },
  { deep: true }
)

function exportSnapshotPng() {
  const canvas = canvasRef.value
  if (!canvas) return null
  renderBoard()
  return canvas.toDataURL('image/png')
}

defineExpose({
  exportSnapshotPng,
  renderBoard
})

onMounted(() => {
  const canvas = canvasRef.value
  if (!canvas) return

  resizeObserver = new ResizeObserver(([entry]) => {
    const dpr = window.devicePixelRatio || 1
    const width = Math.max(300, Math.round(entry.contentRect.width))
    const height = Math.max(260, Math.round(entry.contentRect.height))
    canvas.width = Math.round(width * dpr)
    canvas.height = Math.round(height * dpr)
    renderBoard()
  })

  resizeObserver.observe(canvas)
})

onBeforeUnmount(() => {
  if (resizeObserver) {
    resizeObserver.disconnect()
  }
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId)
  }
})
</script>

<template>
  <div
    ref="containerRef"
    class="court-stage"
    :class="{ 'full-court-aspect': boardStore.courtMode === 'full' }"
  >
    <canvas
      ref="canvasRef"
      class="court-canvas"
      :aria-label="`Basketball coaching dry erase board (${boardStore.playTitle})`"
      @pointerdown="onPointerDown"
      @pointermove="onPointerMove"
      @pointerup="onPointerUp"
      @pointercancel="onPointerUp"
    ></canvas>
  </div>
</template>

<style scoped>
.court-stage {
  position: relative;
  inline-size: 100%;
  block-size: 100%;
  min-block-size: 380px;
  display: grid;
  place-items: center;
  background-color: #090d16;
  border-radius: var(--radius-md);
  border: 1px solid var(--border-color);
  padding: 0.75rem;
}

.court-canvas {
  inline-size: 100%;
  block-size: 100%;
  max-inline-size: 1060px;
  aspect-ratio: 4 / 3;
  border-radius: var(--radius-sm);
  touch-action: none;
  user-select: none;
  cursor: crosshair;
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.45);
}

.court-stage.full-court-aspect .court-canvas {
  aspect-ratio: 16 / 9;
}
</style>

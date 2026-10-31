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
const dragAutoTool = ref(null) // 'dribble' | 'arrow' | 'screen' | 'pass' | null
const dragTrailPoints = ref([])
const dragStartHolderId = ref(null)
const dragStartTokens = ref(null)
const isDrawing = ref(false)
const activeStrokePoints = ref([])

// Trim a path so it stops at the outer edge of the target token (so the token circle doesn't cover the arrowhead)
function getTrimmedTrailPoints(points, targetCenter, stopDist = 0.038) {
  if (!points || points.length < 2) return []
  const start = points[0]
  if (Math.hypot(targetCenter.x - start.x, targetCenter.y - start.y) <= stopDist * 1.1) {
    return []
  }

  for (let i = points.length - 2; i >= 0; i--) {
    const pt = points[i]
    const d = Math.hypot(targetCenter.x - pt.x, targetCenter.y - pt.y)
    if (d >= stopDist) {
      const nextPt = points[i + 1]
      const segDx = nextPt.x - pt.x
      const segDy = nextPt.y - pt.y
      const segLen = Math.hypot(segDx, segDy)
      const remain = Math.max(0, d - stopDist)
      const t = segLen > 0.0001 ? Math.min(1, remain / segLen) : 0
      const edgePt = {
        x: pt.x + segDx * t,
        y: pt.y + segDy * t
      }
      return [...points.slice(0, i + 1), edgePt]
    }
  }
  return []
}

// Convert pointer event to normalized (0..1) court coordinates
function getNormalizedCoords(event) {
  const canvas = canvasRef.value
  if (!canvas) return { x: 0.5, y: 0.5 }
  const rect = canvas.getBoundingClientRect()
  const rawX = Math.max(0.01, Math.min(0.99, (event.clientX - rect.left) / rect.width))
  const rawY = Math.max(0.01, Math.min(0.99, (event.clientY - rect.top) / rect.height))
  if (boardStore.courtRotated) {
    return { x: 1 - rawX, y: 1 - rawY }
  }
  return { x: rawX, y: rawY }
}

function findHitToken(normX, normY) {
  const canvas = canvasRef.value
  if (!canvas) return null
  const rect = canvas.getBoundingClientRect()
  const playerRadiusPx = rect.width * 0.035
  const ballRadiusPx = playerRadiusPx * 0.72
  const tokens = boardStore.displayedTokens

  let bestToken = null
  let bestDist = Infinity

  for (let i = tokens.length - 1; i >= 0; i--) {
    const tk = tokens[i]
    if (!boardStore.showDefense && tk.team === 'defense') continue
    const radiusPx = tk.team === 'ball' ? ballRadiusPx : playerRadiusPx
    const dx = (tk.x - normX) * rect.width
    const dy = (tk.y - normY) * rect.height
    const dist = Math.hypot(dx, dy)
    if (dist <= radiusPx && dist < bestDist) {
      bestDist = dist
      bestToken = tk
    }
  }
  return bestToken
}

function isTouchingDefender(token) {
  if (!token || token.team === 'defense' || token.team === 'ball' || !boardStore.showDefense) {
    return false
  }
  const canvas = canvasRef.value
  if (!canvas) return false
  const rect = canvas.getBoundingClientRect()
  if (!rect.width || !rect.height) return false

  const playerRadiusPx = rect.width * 0.035
  const touchThresholdPx = playerRadiusPx * 2.15

  return boardStore.currentFrame.tokens.some((other) => {
    if (other.team !== 'defense' || other.id === token.id) return false
    const dx = (other.x - token.x) * rect.width
    const dy = (other.y - token.y) * rect.height
    return Math.hypot(dx, dy) <= touchThresholdPx
  })
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
    dragStartTokens.value = JSON.parse(JSON.stringify(boardStore.currentFrame.tokens))
    if (hitToken.id === 'BALL') {
      dragStartHolderId.value = boardStore.getBallHolderId()
      dragAutoTool.value = 'pass'
      dragTrailPoints.value = [{ x: hitToken.x, y: hitToken.y }]
    } else if (boardStore.playerHasBall(hitToken.id)) {
      dragStartHolderId.value = hitToken.id
      dragAutoTool.value = 'dribble'
      dragTrailPoints.value = [{ x: hitToken.x, y: hitToken.y }]
    } else {
      dragStartHolderId.value = null
      dragAutoTool.value = 'arrow'
      dragTrailPoints.value = [{ x: hitToken.x, y: hitToken.y }]
    }
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
    const movedToken = boardStore.currentFrame.tokens.find(
      (t) => t.id === draggingTokenId.value
    )
    if (
      movedToken &&
      (dragAutoTool.value === 'dribble' ||
        dragAutoTool.value === 'arrow' ||
        dragAutoTool.value === 'screen')
    ) {
      if (dragAutoTool.value === 'arrow' || dragAutoTool.value === 'screen') {
        dragAutoTool.value = isTouchingDefender(movedToken) ? 'screen' : 'arrow'
      }
      const lastPt = dragTrailPoints.value[dragTrailPoints.value.length - 1]
      if (lastPt && Math.hypot(movedToken.x - lastPt.x, movedToken.y - lastPt.y) > 0.005) {
        dragTrailPoints.value.push({ x: movedToken.x, y: movedToken.y })
      }
    } else if (movedToken && dragAutoTool.value === 'pass' && dragTrailPoints.value.length > 0) {
      dragTrailPoints.value = [
        dragTrailPoints.value[0],
        { x: movedToken.x, y: movedToken.y }
      ]
    }
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
    const tokenId = draggingTokenId.value
    const movedToken = boardStore.currentFrame.tokens.find((t) => t.id === tokenId)
    const receiver = boardStore.finalizeTokenDrop(tokenId)
    const tokensAfterMove = JSON.parse(JSON.stringify(boardStore.currentFrame.tokens))

    if (
      (dragAutoTool.value === 'dribble' ||
        dragAutoTool.value === 'arrow' ||
        dragAutoTool.value === 'screen') &&
      movedToken &&
      dragTrailPoints.value.length >= 2
    ) {
      if (dragAutoTool.value === 'arrow' || dragAutoTool.value === 'screen') {
        dragAutoTool.value = isTouchingDefender(movedToken) ? 'screen' : 'arrow'
      }
      const trimmed = getTrimmedTrailPoints(dragTrailPoints.value, movedToken, 0.038)
      if (trimmed.length >= 2) {
        if (dragStartTokens.value) {
          boardStore.setCurrentTokens(dragStartTokens.value)
        }
        boardStore.addMovementStep(tokensAfterMove, {
          id: `st-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          tool: dragAutoTool.value,
          color: '#0f172a',
          width: boardStore.markerWidth,
          points: trimmed
        })
      }
    } else if (
      dragAutoTool.value === 'pass' &&
      receiver &&
      receiver.id !== dragStartHolderId.value &&
      dragTrailPoints.value.length >= 1
    ) {
      const startPt = dragTrailPoints.value[0]
      const dx = receiver.x - startPt.x
      const dy = receiver.y - startPt.y
      const dist = Math.hypot(dx, dy)
      if (dist > 0.045) {
        const endPt = {
          x: receiver.x - (dx / dist) * 0.038,
          y: receiver.y - (dy / dist) * 0.038
        }
        if (dragStartTokens.value) {
          boardStore.setCurrentTokens(dragStartTokens.value)
        }
        boardStore.addMovementStep(tokensAfterMove, {
          id: `st-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          tool: 'pass',
          color: '#0f172a',
          width: boardStore.markerWidth,
          points: [startPt, endPt]
        })
      }
    }

    draggingTokenId.value = null
    dragAutoTool.value = null
    dragTrailPoints.value = []
    dragStartHolderId.value = null
    dragStartTokens.value = null
    renderBoard()
    return
  }

  if (isDrawing.value) {
    isDrawing.value = false
    if (boardStore.activeTool !== 'eraser' && activeStrokePoints.value.length >= 2) {
      const tool = boardStore.activeTool
      const strokeObj = {
        id: `st-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        tool,
        color: '#0f172a',
        width: boardStore.markerWidth,
        points: [...activeStrokePoints.value]
      }
      if (tool === 'arrow' || tool === 'pass' || tool === 'dribble' || tool === 'screen') {
        boardStore.addMovementStep(boardStore.currentFrame.tokens, strokeObj)
      } else {
        boardStore.addStroke(strokeObj)
      }
    }
    activeStrokePoints.value = []
    renderBoard()
  }
}

/**
 * Draws one regulation 50ft x 47ft half-court end using a uniform scale `s` (pixels per foot).
 * Local coordinate system:
 *   Origin (0, 0) = midpoint of the baseline
 *   x in [-25*s, +25*s] = sideline to sideline (50 ft)
 *   y in [0, 47*s]      = baseline to midcourt line (47 ft)
 */
function drawRegulationHalfCourtEnd(ctx, s, lineColor, paintFill) {
  // 1. Half-court outer boundary (50 ft wide x 47 ft long)
  ctx.strokeRect(-25 * s, 0, 50 * s, 47 * s)

  // 2. Outer Key / Paint (16 ft wide x 19 ft long from baseline)
  ctx.fillStyle = paintFill
  ctx.fillRect(-8 * s, 0, 16 * s, 19 * s)
  ctx.strokeRect(-8 * s, 0, 16 * s, 19 * s)

  // 3. Low Blocks & Key Rebound Hash Marks along outer lane lines (x = +/- 8 ft)
  ctx.fillStyle = lineColor
  // Low blocks: 7 ft to 8 ft from baseline, 0.85 ft wide outside the key
  ctx.fillRect(-8.85 * s, 7 * s, 0.85 * s, 1 * s)
  ctx.fillRect(8 * s, 7 * s, 0.85 * s, 1 * s)

  // Lane hash ticks at 11 ft, 14 ft, and 17 ft from baseline
  const hashFt = [11, 14, 17]
  ctx.beginPath()
  hashFt.forEach((yFt) => {
    ctx.moveTo(-8 * s, yFt * s)
    ctx.lineTo(-8.85 * s, yFt * s)
    ctx.moveTo(8 * s, yFt * s)
    ctx.lineTo(8.85 * s, yFt * s)
  })
  ctx.stroke()

  // 4. Free-Throw Circle (centered at (0, 19 ft), radius = 6 ft)
  // Top half (toward midcourt): solid semicircle
  ctx.beginPath()
  ctx.arc(0, 19 * s, 6 * s, 0, Math.PI, false)
  ctx.stroke()

  // Bottom half (inside key): dashed semicircle
  ctx.save()
  ctx.setLineDash([5, 5])
  ctx.beginPath()
  ctx.arc(0, 19 * s, 6 * s, Math.PI, Math.PI * 2, false)
  ctx.stroke()
  ctx.restore()

  // 5. 3-Point Line (Rim center at 5.25 ft, arc radius = 23.75 ft, corner lines at +/- 22 ft)
  const rimY = 5.25 * s
  const threeRadius = 23.75 * s
  const cornerX = 22 * s
  const dy = Math.sqrt(threeRadius * threeRadius - cornerX * cornerX)
  const cornerBreakY = rimY + dy
  const startAngle = Math.atan2(dy, -cornerX)
  const endAngle = Math.atan2(dy, cornerX)

  ctx.beginPath()
  ctx.moveTo(-cornerX, 0)
  ctx.lineTo(-cornerX, cornerBreakY)
  ctx.arc(0, rimY, threeRadius, startAngle, endAngle, true)
  ctx.lineTo(cornerX, 0)
  ctx.stroke()

  // 6. Restricted Area Arc (4 ft radius from rim center, with straight extensions to backboard at 4 ft)
  ctx.beginPath()
  ctx.moveTo(-4 * s, 4 * s)
  ctx.lineTo(-4 * s, rimY)
  ctx.arc(0, rimY, 4 * s, Math.PI, 0, true)
  ctx.lineTo(4 * s, 4 * s)
  ctx.stroke()

  // 7. Backboard (6 ft wide, 4 ft inside baseline) & Rim (1.5 ft diameter centered at 5.25 ft)
  ctx.beginPath()
  ctx.moveTo(-3 * s, 4 * s)
  ctx.lineTo(3 * s, 4 * s)
  // Rim mounting neck
  ctx.moveTo(0, 4 * s)
  ctx.lineTo(0, 4.5 * s)
  ctx.stroke()

  ctx.save()
  ctx.strokeStyle = '#ea580c'
  ctx.lineWidth = Math.max(2.5, 0.22 * s)
  ctx.beginPath()
  ctx.arc(0, rimY, 0.75 * s, 0, Math.PI * 2)
  ctx.stroke()
  ctx.restore()

  // 8. 28-ft Sideline Hash Marks (3 ft long inward from sidelines)
  ctx.beginPath()
  ctx.moveTo(-25 * s, 28 * s)
  ctx.lineTo(-22 * s, 28 * s)
  ctx.moveTo(25 * s, 28 * s)
  ctx.lineTo(22 * s, 28 * s)
  ctx.stroke()

  // 9. Midcourt Center Circle Semicircles (outer 6 ft radius, inner 2 ft radius at y = 47 ft)
  ctx.beginPath()
  ctx.arc(0, 47 * s, 6 * s, Math.PI, Math.PI * 2, false)
  ctx.stroke()

  ctx.beginPath()
  ctx.arc(0, 47 * s, 2 * s, Math.PI, Math.PI * 2, false)
  ctx.stroke()
}

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
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'

  if (mode === 'half') {
    // Regulation Half Court: 50 ft wide x 47 ft long using a single uniform scale (pixels per foot)
    const s = Math.min((w * 0.92) / 50, (h * 0.92) / 47)
    const courtH = 47 * s
    const topY = (h - courtH) / 2
    const cx = w / 2

    ctx.lineWidth = Math.max(2, 0.18 * s)
    ctx.save()
    ctx.translate(cx, topY)
    drawRegulationHalfCourtEnd(ctx, s, lineColor, paintFill)
    ctx.restore()
  } else {
    // Regulation Full Court: 94 ft long x 50 ft wide using a single uniform scale (pixels per foot)
    const s = Math.min((w * 0.94) / 94, (h * 0.92) / 50)
    const courtW = 94 * s
    const leftX = (w - courtW) / 2
    const rightX = leftX + courtW
    const midY = h / 2

    ctx.lineWidth = Math.max(2, 0.18 * s)

    // Left Half Court (baseline at leftX, facing right toward midcourt)
    ctx.save()
    ctx.translate(leftX, midY)
    ctx.rotate(-Math.PI / 2)
    drawRegulationHalfCourtEnd(ctx, s, lineColor, paintFill)
    ctx.restore()

    // Right Half Court (baseline at rightX, facing left toward midcourt)
    ctx.save()
    ctx.translate(rightX, midY)
    ctx.rotate(Math.PI / 2)
    drawRegulationHalfCourtEnd(ctx, s, lineColor, paintFill)
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
  let prev = pixelPts[0]
  for (let i = pixelPts.length - 2; i >= 0; i--) {
    if (Math.hypot(last.x - pixelPts[i].x, last.y - pixelPts[i].y) >= 4) {
      prev = pixelPts[i]
      break
    }
  }
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
  const tokenRadius = w * 0.035

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
      ctx.font = `600 ${Math.round(tokenRadius * 0.45)}px Inter, sans-serif`
      ctx.fillStyle = '#0f172a'
      ctx.fillText(tk.role, cx, cy + tokenRadius + Math.round(tokenRadius * 0.38))
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

  ctx.save()
  if (boardStore.courtRotated) {
    ctx.translate(cssW / 2, cssH / 2)
    ctx.rotate(Math.PI)
    ctx.translate(-cssW / 2, -cssH / 2)
  }

  drawCourtMarkings(ctx, cssW, cssH)
  drawGhostPaths(ctx, cssW, cssH)

  boardStore.displayedStrokes.forEach((stroke) => {
    drawSingleStroke(ctx, stroke, cssW, cssH)
  })

  if (draggingTokenId.value && dragAutoTool.value && dragTrailPoints.value.length >= 2) {
    const movedToken = boardStore.currentFrame.tokens.find(
      (t) => t.id === draggingTokenId.value
    )
    const previewPoints =
      (dragAutoTool.value === 'dribble' ||
        dragAutoTool.value === 'arrow' ||
        dragAutoTool.value === 'screen') &&
      movedToken
        ? getTrimmedTrailPoints(dragTrailPoints.value, movedToken, 0.038)
        : dragTrailPoints.value
    if (previewPoints.length >= 2) {
      drawSingleStroke(
        ctx,
        {
          tool: dragAutoTool.value,
          color: '#0f172a',
          width: boardStore.markerWidth,
          points: previewPoints
        },
        cssW,
        cssH
      )
    }
  }

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
    boardStore.courtRotated,
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
  max-inline-size: 760px;
  aspect-ratio: 50 / 47;
  border-radius: var(--radius-sm);
  touch-action: none;
  user-select: none;
  cursor: crosshair;
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.45);
}

.court-stage.full-court-aspect .court-canvas {
  max-inline-size: 1060px;
  aspect-ratio: 94 / 50;
}
</style>

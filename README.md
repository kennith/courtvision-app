# CourtVision — Virtual Dry-Erase Basketball Board

**CourtVision** is an interactive virtual dry-erase basketball coaching board and playbook manager built with **Vue 3** (`<script setup>` Composition API), **Vue Router 4**, **Pinia 2**, and **Vite 5**. Coaches can diagram plays on regulation half-court or full-court surfaces, auto-generate tactical movement lines by dragging players and the ball, animate multi-step progressions, and organize or share plays via URL, JSON, or PNG snapshots.

---

## Table of Contents

1. [Tech Stack & Architecture](#tech-stack--architecture)
2. [Project Structure](#project-structure)
3. [Application Terminology & Glossary](#application-terminology--glossary)
   - [Court & Geometry Terminology](#1-court--geometry-terminology)
   - [Tokens, Teams, Roles & Possession](#2-tokens-teams-roles--possession)
   - [Dry-Erase Tools & Strokes](#3-dry-erase-tools--strokes)
   - [Smart Auto-Drawing & Progressive Movement Fade](#4-smart-auto-drawing--progressive-movement-fade)
   - [Quick Formations](#5-quick-formations)
   - [Animation & Timeline Terminology](#6-animation--timeline-terminology)
   - [Playbook, Categories & Built-In Preset Plays](#7-playbook-categories--built-in-preset-plays)
   - [Persistence, Sharing & Export Terminology](#8-persistence-sharing--export-terminology)
4. [Store State & API Reference (`useBoardStore`)](#store-state--api-reference-useboardstore)
5. [Getting Started & Scripts](#getting-started--scripts)
6. [Deploying to GitHub Pages](#deploying-to-github-pages)

---

## Tech Stack & Architecture

- **Framework**: [Vue 3](https://vuejs.org/) (`^3.5.12`) using `<script setup>` Composition API
- **Routing**: [Vue Router 4](https://router.vuejs.org/) (`^4.4.5`) with HTML5 History mode
- **State Management**: [Pinia](https://pinia.vuejs.org/) (`^2.2.4`) single source of truth ([`useBoardStore`](src/stores/useBoardStore.js))
- **Build Tool**: [Vite 5](https://vite.dev/) (`^5.4.10`)
- **Rendering**: High-DPI HTML5 2D `<canvas>` ([`CourtCanvas.vue`](src/components/CourtCanvas.vue)) with `ResizeObserver` and SVG mini-court previews ([`PlaybookView.vue`](src/views/PlaybookView.vue))

---

## Project Structure

```text
courtvision-app/
├── index.html                        # App entry HTML shell
├── package.json                      # Dependencies and npm scripts
├── vite.config.js                    # Vite configuration
├── AGENTS.md                         # Project stack rules & guidelines
└── src/
    ├── main.js                       # Vue app initialization (Pinia + Router)
    ├── App.vue                       # Top navigation bar (Coaching Board & Playbook links)
    ├── assets/
    │   └── main.css                  # Design tokens, dark UI theme, native dialog & form styles
    ├── router/
    │   └── index.js                  # Routes: '/' (board) and '/playbook' (playbook)
    ├── stores/
    │   └── useBoardStore.js          # Central Pinia store for board, tokens, strokes, frames & playbook
    ├── views/
    │   ├── BoardView.vue             # Main Coaching Board workspace view
    │   └── PlaybookView.vue          # Team Playbook Library grid, search & category filter view
    └── components/
        ├── CourtCanvas.vue           # Interactive HTML5 canvas court, token hit-testing & animation loop
        ├── MarkerToolbar.vue         # Dry-Erase Tools, Quick Formations & Court/Display toggles
        ├── AnimationTimeline.vue     # Playback controls, speed selector, loop toggle & step pills
        └── SaveShareModal.vue        # Native <dialog> modals for saving, link sharing, PNG & JSON I/O
```

---

## Application Terminology & Glossary

This section documents all basketball coaching terms, UI labels, visual conventions, and internal codebase concepts used throughout CourtVision.

### 1. Court & Geometry Terminology

CourtVision renders regulation basketball court markings using a uniform scale (`s` = pixels per foot) inside [`CourtCanvas.vue`](src/components/CourtCanvas.vue):

| Term | UI / Code Identifier | Description |
| :--- | :--- | :--- |
| **Coaching Board** | `BoardView.vue` (`/`) | The primary interactive workspace containing the Play Context Bar, Court Canvas, Marker Toolbar, and Animation Timeline. |
| **Whiteboard Surface** | `drawCourtMarkings()` | Light dry-erase background (`#f8fafc`) overlaid with a subtle alignment dot grid (`rgba(148, 163, 184, 0.22)`). |
| **Half Court** | `courtMode: 'half'` | Regulation **50 ft wide × 47 ft long** half-court diagram (`aspect-ratio: 50 / 47`). Origin `(0, 0)` is the midpoint of the top baseline. |
| **Full Court** | `courtMode: 'full'` | Regulation **94 ft long × 50 ft wide** full-court diagram (`aspect-ratio: 94 / 50`) rendered by joining two opposing 50×47 ft half-court ends at midcourt. |
| **Rotate Board** | `courtRotated` / `rotateBoard()` | Rotates the court visual 180° (`Math.PI`) and inverts pointer coordinate normalization (`1 - rawX`, `1 - rawY`) so coaches can view the half court from either orientation. |
| **Normalized Coordinates** | `x`, `y` (`0..1`) | Resolution-independent coordinate system used for all tokens and stroke points across canvas resizes. |
| **Baseline & Sidelines** | Outer boundary (`50 ft × 47 ft`) | The outer boundary lines of each half court. |
| **Key / Paint (Outer Lane)** | `16 ft × 19 ft` | The shaded rectangular lane (`rgba(37, 99, 235, 0.07)`) extending 19 ft from the baseline and 8 ft to either side of the basket center. |
| **Low Blocks** | `7 ft` to `8 ft` from baseline | Solid rectangular blocks (`0.85 ft × 1 ft`) along the outside edge of the key. |
| **Lane Rebound Hash Marks** | `hashFt = [11, 14, 17]` | Perpendicular tick marks along the outer lane lines at 11 ft, 14 ft, and 17 ft from the baseline where players line up during free throws. |
| **Free-Throw Circle** | `6 ft` radius at `19 ft` | Centered at the free-throw line (`19 ft` from baseline): rendered with a **solid** semicircle toward midcourt and a **dashed** semicircle inside the key. |
| **3-Point Line (Arc & Corners)** | `threeRadius = 23.75 ft`, `cornerX = 22 ft` | Regulation 3-point arc (`23.75 ft` radius from the center of the rim) transitioning into straight corner lines `22 ft` from the court centerline. |
| **Restricted Area Arc** | `4 ft` radius from rim center | Semicircular arc (`4 ft` radius) beneath the basket with straight extensions to the backboard face. |
| **Backboard & Rim** | Backboard at `4 ft`, Rim at `5.25 ft` | A `6 ft` wide backboard positioned `4 ft` inside the baseline with an orange (`#ea580c`) `1.5 ft` diameter rim centered at `5.25 ft` from the baseline. |
| **28-ft Sideline Hash Marks** | `28 ft` from baseline | `3 ft` inward hash marks along both sidelines used for coaching box boundaries and frontcourt inbound alignments. |
| **Midcourt Center Circle** | `6 ft` outer & `2 ft` inner radii | Concentric semicircles at the `47 ft` midcourt division line. |

---

### 2. Tokens, Teams, Roles & Possession

All movable on-court entities are represented as **Tokens** (`currentFrame.tokens` / `displayedTokens`):

| Term | Identifier / Value | Visual Style | Description |
| :--- | :--- | :--- | :--- |
| **Offensive Players** | `id`: `'O1'`–`'O5'`<br>`label`: `'1'`–`'5'`<br>`team`: `'offense'` | Blue circle (`#2563eb`) with white number | The 5 offensive players numbered `1` through `5` according to standard basketball numbering. |
| **Defenders (X1–X5)** | `id`: `'D1'`–`'D5'`<br>`label`: `'X1'`–`'X5'`<br>`team`: `'defense'` | Red circle (`#dc2626`) with white `X1`–`X5` label | The 5 defensive players. Visibility on the board is controlled by the **Defenders (X1–X5)** toggle (`showDefense`). |
| **Ball Token** | `id`: `'BALL'`<br>`label`: `'🏀'`<br>`team`: `'ball'`<br>`role`: `'Ball'` | Orange basketball (`#ea580c`) with seam crosshairs | The basketball token (`0.72×` player token radius). Tracks possession via `ball.holderId`. |
| **Roles (PG–C)** | `role` property & `showPlayerRoles` toggle | Dark label beneath each player token | Standard basketball position abbreviations displayed under both offensive and defensive tokens when **Roles (PG–C)** is checked:<ul><li>**`PG`** — Point Guard (`1` / `X1`)</li><li>**`SG`** — Shooting Guard (`2` / `X2`)</li><li>**`SF`** — Small Forward (`3` / `X3`)</li><li>**`PF`** — Power Forward (`4` / `X4`)</li><li>**`C`** — Center (`5` / `X5`)</li></ul> |
| **Ball Possession / Ball Holder** | `ball.holderId`, `getBallHolderId()`, `playerHasBall(tokenId)` | Ball tucked beside offensive player | An offensive player within `0.075` normalized distance of the ball holds possession (`holderId`).<ul><li>**Dribble Carry**: Dragging the offensive ball holder automatically moves the ball along with the player (`dx`, `dy`).</li><li>**Loose Ball Pickup**: Dragging an offensive player within `0.055` of an unpossessed ball automatically assigns `ball.holderId` to that player.</li><li>**Side-Tuck Offset (`finalizeTokenDrop`)**: Dropping the ball directly over an offensive player (distance `< 0.034`) offsets the ball to distance `0.04` from the player's center so both tokens remain visible and clickable.</li></ul> |

---

### 3. Dry-Erase Tools & Strokes

All markings drawn on a step are stored in `currentFrame.strokes` and rendered with fixed black dry-erase ink (`BLACK_INK = '#0f172a'`, `markerWidth = 5`).

| Tool Label (UI) | Tool ID (`activeTool`) | Icon | Stroke Geometry & Meaning |
| :--- | :--- | :--- | :--- |
| **Move Players** | `'select'` | ✋ | Repositions player and ball tokens by dragging without drawing freehand strokes on empty court space. *(Note: Clicking directly on any token with primary click/touch drags that token regardless of the active tool.)* |
| **Marker** | `'pen'` | 🖊️ | **Freehand Marker**: General-purpose solid dry-erase ink for annotations, zone circles, or coaching notes. Not classified as a movement stroke. |
| **Cut / Run** | `'arrow'` | ↗️ | **Player Movement / Cut**: Solid line ending with a filled directional arrowhead (`drawArrowhead`). Represents off-ball player movement, cuts, or defensive rotations. |
| **Pass** | `'pass'` | ⚡ | **Ball Pass**: Dashed line (`setLineDash([10, 8])`) ending with a filled arrowhead. Represents passing the ball between players. |
| **Dribble** | `'dribble'` | 〰️ | **Live Dribble**: Sinusoidal wavy line (`Math.sin`) ending with a filled arrowhead. Represents a ball-handler driving or dribbling the basketball. |
| **Screen** | `'screen'` | ⊥ | **Pick / Screen**: Solid line ending with a perpendicular T-bar (`drawScreenTBar`). Represents an offensive player setting an on-ball or off-ball screen (pick). |
| **Eraser** | `'eraser'` | 🧽 | **Stroke Eraser**: Tapping or dragging within `18px` (`eraseStrokesNear`) of any stroke deletes that stroke (`removeStrokeById`). |

#### Stroke Action Buttons
- **↩ Undo (`undoStroke`)**: Pops the most recent stroke from `currentFrame.strokes` onto the current step's redo stack (`redoStacks[currentFrameIndex]`).
- **↪ Redo (`redoStroke`)**: Restores the most recently undone stroke for the active step.
- **Clear Ink (`clearCurrentStrokes`)**: Wipes all drawn strokes and resets the redo stack on the active step (also called automatically when applying a Quick Formation).

---

### 4. Smart Auto-Drawing & Progressive Movement Fade

CourtVision distinguishes between general freehand annotations (`pen`) and tactical **Movement Strokes (Movement Lines)**:

- **`MOVEMENT_TOOLS`**: `new Set(['arrow', 'pass', 'dribble', 'screen'])`
- **Auto-Generated Movement Strokes on Token Drag (`dragAutoTool`)**:
  When dragging tokens directly on the canvas, CourtVision automatically previews and commits the appropriate tactical movement stroke on pointer release:
  1. **Dribble (`'dribble'`)**: Triggered automatically when dragging an **offensive player who currently has possession of the ball** (`playerHasBall(id) === true`).
  2. **Cut / Run (`'arrow'`)**: Triggered automatically when dragging an **offensive player without the ball** when they do not end in contact with a defender.
  3. **Screen (`'screen'`)**: Triggered automatically when dragging an **offensive player without the ball** so that they touch a visible defender (`isTouchingDefender(token)` — within `2.15 × playerRadiusPx` of any `D1`–`D5` token). Dynamically switches between `'arrow'` and `'screen'` live as you drag near or away from a defender.
  4. **Pass (`'pass'`)**: Triggered automatically when dragging the **ball (`BALL`)** to a different receiving offensive player (`receiver.id !== dragStartHolderId`).
  5. **Defender Repositioning (`null`)**: Dragging defensive players (`X1`–`X5`) moves them silently without generating movement strokes.
- **Trail Trimming (`getTrimmedTrailPoints`)**: Auto-drawn player and pass trails are trimmed back by `stopDist = 0.038` from the destination token's center so the player circle never overlaps or obscures the arrowhead or screen T-bar.
- **Progressive Movement Fade (`fadeMovementStrokes`)**:
  Every time a new movement stroke (`arrow`, `pass`, `dribble`, or `screen`) is added to the current frame, all prior movement strokes on that frame automatically fade by **20%** (`-0.2` opacity delta, clamped to a minimum `opacity` of `0.1`). This visually emphasizes the latest action in a sequence while keeping earlier actions visible for context. Undoing (`undoStroke`) or redoing (`redoStroke`) a movement stroke restores (`+0.2`) or reapplies (`-0.2`) the fade step.

---

### 5. Quick Formations

Located in [`MarkerToolbar.vue`](src/components/MarkerToolbar.vue) and implemented via `applyFormation(presetName)` in [`useBoardStore.js`](src/stores/useBoardStore.js), **Quick Formations** clear current ink on the active step, place `BALL` with `O1`, and snap all 10 players into standard basketball alignments:

| Formation Label | Preset ID | Tactical Alignment Description |
| :--- | :--- | :--- |
| **5-Out** | `'5-out'` | Spread perimeter alignment with `1` at the top of the key, `2` and `3` on the wings, and `4` and `5` spaced in the deep corners, leaving the paint completely open for cuts and drives. |
| **Horns** | `'horns'` | classic Horns A-set with `1` at the top of the key, `4` and `5` stationed at the two high-post elbows, and `2` and `3` spaced in the deep corners. |
| **1-4 High** | `'1-4-high'` | `1` at the point with all four teammates (`2`, `4`, `5`, `3`) aligned horizontally across the free-throw line extended (high post and wings). |
| **Box Set** | `'box'` | `1` at the top of the key with `2` and `3` at the high-post elbows and `4` and `5` on the low blocks forming a rectangular box around the key. |
| **2-3 Zone** | `'2-3-zone'` | Defensive 2-3 zone coverage alignment with `X1` and `X2` guarding the top slots, `X3` and `X4` on the wide low blocks, and `X5` anchoring the middle of the paint against a 4-out/1-in offensive spread. |

*(Note: When `courtMode === 'full'`, clicking any Quick Formation resets tokens to the default full-court press/transition alignment.)*

---

### 6. Animation & Timeline Terminology

CourtVision supports multi-step keyframe animations controlled by [`AnimationTimeline.vue`](src/components/AnimationTimeline.vue) and rendered in [`CourtCanvas.vue`](src/components/CourtCanvas.vue):

| Term | Identifier / Control | Description |
| :--- | :--- | :--- |
| **Step / Frame** | `frames`, `currentFrame`, `currentFrameIndex` | A discrete stage in a play's progression (`Step 1`, `Step 2`, etc.). Each frame stores `{ id, name, tokens, strokes }`. |
| **+ Add Movement Step** | `addFrame()` | Clones the active step's current token coordinates into a new step inserted immediately after `currentFrameIndex`, with an empty `strokes` array ready for the next action. |
| **Delete Step (`×`)** | `deleteFrame(index)` | Removes a step from the timeline (available whenever a play has more than 1 step). |
| **Ghost Paths** | `drawGhostPaths()` | Dashed preview lines (`[4, 6]`) displayed while paused that connect each token's position in the current step (`currentFrameIndex`) to its position in the next step (`currentFrameIndex + 1`). Colored semi-transparent blue for offense, red for defense, and orange for the ball. |
| **▶ Animate Play / ⏸ Pause** | `togglePlayback()`, `isPlaying` | Starts or pauses continuous interpolation across all steps. If pressed when the play only has 1 step, CourtVision automatically calls `addFrame()` to create `Step 2`. |
| **Smoothstep Interpolation** | `displayedTokens`, `animationProgress` | During playback, token positions between adjacent steps (`fromIdx` → `toIdx`) are interpolated using Hermite smoothstep easing (`smoothT = t * t * (3 - 2 * t)`). Base transition rate is `1 / 1.4` steps per second at `1x` speed. |
| **Loop** | `isLooping` | Checkbox toggle that seamlessly restarts playback from `Step 1` after reaching the final step. |
| **Animation Speed** | `playbackSpeed` (`0.5x`, `1x`, `1.5x`, `2x`) | Multiplier applied to the step transition rate during playback. |

---

### 7. Playbook, Categories & Built-In Preset Plays

The **Team Playbook Library** ([`PlaybookView.vue`](src/views/PlaybookView.vue), route `/playbook`) lets coaches search Plays by title, filter by category, preview a mini SVG court diagram with a **Steps Badge** (`N Steps`), and trigger **📋 Open on Board**, **▶ Animate**, **🔗 Share**, or **🗑 Delete**.

#### Play Categories (`playCategory`)
- **`Offense`**: Half-court or full-court offensive sets and quick hitters.
- **`Defense`**: Man-to-man rotations, zone traps, and defensive coverages.
- **`Inbound`**: Baseline Out of Bounds (**BLOB**) and Sideline Out of Bounds (**SLOB**) plays.
- **`Fast Break`**: Transition offense and primary/secondary break actions.
- **`Special`**: End-of-game, after-timeout (**ATO**), or special situational plays.

#### Built-In Default Plays (`DEFAULT_PLAYS`)
When initialized with an empty `localStorage`, CourtVision seeds the Playbook with three multi-step plays illustrating common basketball terminology:

1. **Horns High Ball Screen & Flare (`preset-horns-flare`, Category: `Offense`, 3 Steps)**
   - *1. Initial Horns Alignment*: `4` sets a high ball screen for `1` driving left while `5` sets a flare screen for `4` popping/flaring to the top.
   - *2. Drive & Roll / Flare*: `1` penetrates to the left wing and reads the kickout pass to `4` at the top of the arc or `2` in the left corner.
   - *3. Finish at Rim or Corner 3*: Ball is swung to `4` for an open top-of-the-key three-pointer.
2. **2-3 Zone Wing Trap & Weakside Rotation (`preset-23-zone-shift`, Category: `Defense`, 2 Steps)**
   - *1. Base 2-3 Alignment*: `1` passes to `2` on the left wing; top guard `X1` and strong-side forward `X3` converge to trap the wing.
   - *2. Wing Trap & Weakside Drop*: `X1` and `X3` trap `2` on the wing while `X5` rotates to the strong-side low post, `X2` drops to the high post/nail, and weak-side forward `X4` drops to protect the rim.
3. **BLOB Box Elevator Doors (`preset-box-elevator`, Category: `Inbound`, 2 Steps)**
   - *1. Box Set Under Basket*: **BLOB** (Baseline Out of Bounds) with `3` inbounding under the basket. `2` cuts up through the middle of the lane between `4` and `5` at the elbows.
   - *2. Doors Close & Catch-and-Shoot*: `4` and `5` slide together ("closing the elevator doors") to screen `X2`, freeing `2` at the top of the key for a catch-and-shoot three-pointer.

---

### 8. Persistence, Sharing & Export Terminology

Managed via the Play Context Bar ([`BoardView.vue`](src/views/BoardView.vue)) and native `<dialog>` modals ([`SaveShareModal.vue`](src/components/SaveShareModal.vue)):

| Feature / Term | Function / Identifier | Description |
| :--- | :--- | :--- |
| **📄 New Board** | `resetNewPlay()` | Resets the active workspace to an `'Untitled Play'` (`Offense` category) with a single `'1. Setup'` frame and default tokens. |
| **💾 Save Play** | `saveCurrentPlay({ title, category })` | Saves or updates the active play in `savedPlays` and persists it to `localStorage` under `STORAGE_KEY = 'courtvision_saved_plays_v1'`. |
| **1. Shareable Web Link** | `?play=<base64>` / `copyShareLink()` | Serializes the play to JSON, Base64-encodes it (`btoa`), and generates a URL (`/?play=...`). Opening that URL automatically decodes, imports, and loads the play onto the board. |
| **2. 📸 Download Court PNG** | `exportSnapshotPng()` / `downloadSnapshot()` | Exports the current `<canvas>` visual to a PNG data URL and downloads it as `<slugified-play-title>.png`. |
| **2. 📋 Copy Play JSON** | `serializeCurrentPlay()` / `copyShareJson()` | Copies the portable JSON representation (`{ title, category, courtMode, frames }`) of the active play to the clipboard. |
| **3. 📥 Import & Load Play** | `importPlayFromJson(jsonString)` | Validates a pasted play JSON string (requiring a non-empty `frames` array), adds it to `savedPlays`, persists it to `localStorage`, and loads it onto the Coaching Board. |

---

## Store State & API Reference (`useBoardStore`)

Defined in [`src/stores/useBoardStore.js`](src/stores/useBoardStore.js):

- **Reactive State**:
  - `currentPlayId`: `string | null` — ID of the currently loaded/saved play.
  - `playTitle`: `string` — Title of the active play (default `'Untitled Play'`).
  - `playCategory`: `'Offense' | 'Defense' | 'Inbound' | 'Fast Break' | 'Special'`.
  - `courtMode`: `'half' | 'full'` — Active court dimension mode.
  - `courtRotated`: `boolean` — Whether the canvas is rotated 180°.
  - `showDefense`: `boolean` — Toggles visibility and hit-testing of defenders `X1`–`X5`.
  - `showPlayerRoles`: `boolean` — Toggles visibility of role labels (`PG`–`C`) beneath player tokens.
  - `activeTool`: `'select' | 'pen' | 'arrow' | 'pass' | 'dribble' | 'screen' | 'eraser'`.
  - `markerColor`: `string` (`'#0f172a'`) & `markerWidth`: `number` (`5`).
  - `frames`: `Array<{ id, name, tokens, strokes }>` — Ordered animation steps.
  - `currentFrameIndex`: `number` — Zero-based index of the active step.
  - `redoStacks`: `Array<Array<Stroke>>` — Per-frame redo history stacks.
  - `isPlaying`: `boolean`, `isLooping`: `boolean`, `playbackSpeed`: `number`, `animationProgress`: `number`.
  - `savedPlays`: `Array<Play>` — Plays persisted in `localStorage`.
- **Computed Getters**:
  - `currentFrame`: Active step object from `frames[currentFrameIndex]`.
  - `displayedTokens`: Current step's tokens when paused, or smoothstep-interpolated tokens during playback.
  - `displayedStrokes`: Active step's strokes during editing or playback.

---

## Getting Started & Scripts

### Prerequisites
- **Node.js** (v18+ recommended) and **npm**

### Installation & Development

```bash
# Install dependencies
npm install

# Start local Vite development server with HMR
npm run dev

# Build production bundle to ./dist
npm run build

# Preview production build locally
npm run preview
```

---

## Deploying to GitHub Pages

The repository is pre-configured for **GitHub Pages** deployment via:
- **[`vite.config.js`](vite.config.js)**:
  - Dynamically resolves the `base` path (`/` during `npm run dev`, `/${repo}/` in GitHub Actions via `GITHUB_REPOSITORY`, or `/courtvision-app/` by default on local builds; overridable via `BASE_URL`).
  - Automatically generates `dist/404.html`, `dist/playbook/index.html`, and `dist/.nojekyll` during `npm run build` so Vue Router (`createWebHistory`) routes work cleanly on direct page loads and refreshes.
- **[`.github/workflows/deploy.yml`](.github/workflows/deploy.yml)**:
  - GitHub Actions workflow that builds and deploys `./dist` to GitHub Pages automatically on every push to `main`.

### Steps to Publish on GitHub
1. Push this repository to GitHub (on the `main` branch).
2. In your GitHub repository, navigate to **Settings → Pages**.
3. Under **Build and deployment → Source**, select **GitHub Actions**.
4. The **Deploy to GitHub Pages** workflow will run automatically and publish your site at `https://<username>.github.io/<repo-name>/`.


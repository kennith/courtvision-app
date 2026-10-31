# CourtVision — Basketball Coaching Board

A virtual dry-erase basketball coaching board built with **Vue 3** (`<script setup>`), **Vue Router**, and **Pinia**.

## Terminology & Concepts

### Strokes & Movement Strokes (Movement Lines)
All drawn lines on the whiteboard for the active step are stored in `currentFrame.strokes` in [`src/stores/useBoardStore.js`](src/stores/useBoardStore.js).

- **Movement Strokes (Movement Lines)**: The tactical play lines representing player and ball actions, grouped under `MOVEMENT_TOOLS = new Set(['arrow', 'pass', 'dribble', 'screen'])`:
  - **`arrow` (Cut / Run)**: Solid line with an arrowhead, drawn automatically when dragging a player without the ball (when not touching a defender) or manually with the **Cut / Run** tool.
  - **`pass` (Pass)**: Dashed line with an arrowhead, drawn automatically when dragging the ball (`BALL`) to a receiving player or manually with the **Pass** tool.
  - **`dribble` (Dribble)**: Wavy line with an arrowhead, drawn automatically when dragging a player who currently has possession of the ball or manually with the **Dribble** tool.
  - **`screen` (Screen)**: Solid line ending with a perpendicular T-bar (`⊥`), drawn automatically when dragging an offensive player without the ball so they touch a defender (`X1`–`X5`) or manually with the **Screen** tool.
- **Freehand Marker (`pen`)**: General dry-erase freehand drawing stroke (not part of `MOVEMENT_TOOLS`).
- **Progressive Movement Fade**: Each time a new **movement stroke** (`arrow`, `pass`, `dribble`, or `screen`) is created, previous movement strokes on the current frame automatically fade out by **20%** (`0.2` opacity step, down to a minimum of `0.1`) via `fadeMovementStrokes()`. Undoing or redoing a movement stroke restores or reapplies the 20% fade step.
- **Clear Ink (`clearCurrentStrokes`)**: Clears all strokes on the current frame (also triggered automatically when selecting a Quick Formation preset).

## Development

```bash
npm install
npm run dev
npm run build
```

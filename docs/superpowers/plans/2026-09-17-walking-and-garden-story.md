# Walking and Garden Story Implementation Plan

> **For agentic workers:** Use superpowers:subagent-driven-development for independent navigation and plant simulation tasks. The coordinator owns movement, interaction, rendering integration and browser verification.

**Goal:** Characters avoid illustrated obstacles and the first seed becomes a flower visited by a bee during one playable session.

**Architecture:** Static scene footprints and object bases feed a grid backed by PathFinding.js A*. MOVE creates serializable routes; MovementSystem follows the route and only emits reached at the actual endpoint. PlantSystem owns time-based growth and a persistent bee visitor; actions validate approach before mutation. UI projects these states without driving the simulation.

**Tech Stack:** Existing TypeScript, PixiJS, Vite and Vitest, plus PathFinding.js.

**Spec:** User-approved next steps: natural walking around houses, trees and water; visible seed-to-flower-to-bee story. Existing docs/01-设计方案-V1.0.md and docs/04-架构规范.md remain the domain baseline.

## Constraints

- Keep existing artwork and saves. Reconcile an old position only when it lies inside newly solid geometry.
- All state changes remain actions or explicit simulation systems. No DOM or Pixi objects in WorldState.
- Use the illustrated bridge to cross the forest stream. Block the lake and solid house/greenhouse footprints, not tree canopy silhouettes.
- Cancel pending interaction on a new movement request, scene change, failed route or vanished target. Never interact through an obstacle merely because a distance check passes.
- First watering sprouts immediately; subsequent healthy growth takes roughly 90–120 seconds to flower. No repeated watering growth exploit. Dry plants pause. Offline growth uses the same elapsed-time rule.
- A flowering plant creates one saved visitor, whose arrival is animated in the active scene. Completion requires observing the arrived visitor once. Reload must not duplicate it or its reward.

## Task 1: Navigation geometry and A*

Files: `src/world/Navigation.ts`, `tests/Navigation.test.ts`.

Interfaces: `Point {x:number;y:number}`, `isWalkable(world, point): boolean`, `nearestWalkable(world, point): Point | undefined`, `findRoute(world, from, to): Point[] | undefined`. Routes include the reachable endpoint, omit the start, and contain only safe segments. Blocked targets project to a reachable edge; non-finite inputs return undefined. `segmentWalkable(world, from, to): boolean` samples the real geometry along a segment for interaction checks and regressions.

- [ ] Add failing tests for house detour, lake avoidance, stream bridge route, blocked target projection, tree trunks and invalid input.
- [ ] Implement geometry and PathFinding.js A* using non-corner-cutting diagonal movement and padded obstacles.
- [ ] Run `npm test -- --run tests/Navigation.test.ts`. Sample every returned segment in the tests.

## Task 2: Plant and visitor state

Files: `src/world/PlantSystem.ts`, `src/world/GardenProgress.ts`, `tests/PlantStory.test.ts`, `tests/GardenProgress.test.ts`.

Interfaces: retain `stageFor`, `PlantState`, `simulatePlants(world, seconds, bus?)`. Add `updateGardenVisitors(world, seconds, bus?)` and `observeGardenVisitor(world, objectId, bus?): boolean`. Garden progress includes `{title, detail, targetId, step, total, done, mode, growth}` with mode `interact | observe | visit`. Visitor objects have template `bee`, tag `garden_visitor`, saved `state.plantId` and `state.arrived`. `garden.completed` event payload is `{plantId, beeId}`.

- [ ] Test elapsed-time growth, hydration pause, negative/invalid time, offline/frame equivalence, persistent unique visitors, arrival and exactly-once observation reward.
- [ ] Implement approximately 100 seconds from sprout to flower when hydrated. Visitor simulation is separate from generic animal wandering.
- [ ] Expand guidance through growth, flower and visitor observation; preserve the existing layout migration.
- [ ] Run the plant/guidance tests and existing watering tests.

## Task 3: Movement and interaction integration

Files: `src/world/MovementSystem.ts`, `src/world/WorldEngine.ts`, `src/interaction/Interaction.ts`, `src/app/App.ts`, `src/world/AnimalSystem.ts`; tests for route following and interaction validity.

- [ ] Test that a character follows safe segments, cancels stale routes on travel and never teleports on an unreachable action.
- [ ] Make MOVE use routes; use a shared interaction point and reachable approach selection for world clicks and action validation.
- [ ] Validate scene, carrying, reach and line of sight for pick/plant/water/refill/inspect. Approach water from shore. Reconcile old blocked character positions to a legal cell.
- [ ] Hook garden visitor simulation and completion into the App; record the existing bee/pollination knowledge through its event.
- [ ] Guard delayed exploration navigation and pending interaction while a modal is open. Update live-save timestamps.

## Task 4: Playable feedback and verification

Files: `src/render/Renderer.ts`, `src/ui/game.css`, handoff progress docs, browser screenshots in `artifacts/visual/`.

- [ ] Show route, nearby actionable objects, readable contextual verbs, growing-plant progress, stage celebration and visitor arrival without another large panel.
- [ ] `npm test` and `npm run build` must pass.
- [ ] Browser: real pointer/keyboard/touch movement around obstacles, complete seed-to-bee story, reload at growth and after reward, cross bridge, retain tools and refill, desktop/mobile layout and canvas pixel checks.
- [ ] Review important regressions and update the progress documents. No git commit: this handoff directory is not a Git repository.

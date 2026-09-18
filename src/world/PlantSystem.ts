import type { WorldState } from './WorldState';
import type { WorldObject } from './WorldObject';
import type { EventBus } from '../core/EventBus';

export type PlantStage = 'seed' | 'sprout' | 'young' | 'mature' | 'flower';
export interface PlantState {
  stage: PlantStage;
  growth: number;
  water: number;
  health: number;
  sunlight: number;
  plantedAt: number;
  lastWateredAt?: number;
  pollinated?: boolean;
}
export const stageFor = (g: number): PlantStage => g < .15 ? 'seed' : g < .35 ? 'sprout' : g < .60 ? 'young' : g < .85 ? 'mature' : 'flower';

const stages: PlantStage[] = ['seed', 'sprout', 'young', 'mature', 'flower'];
const waterDrain = .002;
const growthRate = .007;
const arrivalSeconds = 4;
const finite = (value: unknown, fallback = 0): number => typeof value === 'number' && Number.isFinite(value) ? value : fallback;
const unit = (value: unknown, fallback = 0) => Math.max(0, Math.min(1, finite(value, fallback)));

function ensureVisitor(world: WorldState, plant: WorldObject) {
  if (plant.location.type !== 'scene') return;
  const id = `garden_bee_${plant.id}`;
  if (world.objects[id] || Object.values(world.objects).some(o => o.templateId === 'bee' && o.tags.includes('garden_visitor') && o.state.plantId === plant.id)) return;
  world.objects[id] = {
    id, templateId: 'bee', tags: ['animal', 'insect', 'garden_visitor'], lifecycle: 'active',
    location: { ...plant.location },
    transform: { x: finite(plant.transform.x) + 180, y: finite(plant.transform.y) - 90 },
    state: { plantId: plant.id, arrived: false, elapsed: 0, phase: 0, mode: 'garden_visitor', flying: true, wandering: false, vx: 0, vy: 0 },
    capabilities: { carryable: false, movable: false, usable: true },
  };
}

export function simulatePlants(world: WorldState, elapsedSeconds: number, bus?: EventBus) {
  if (!Number.isFinite(elapsedSeconds) || elapsedSeconds < 0) return;
  for (const plant of Object.values(world.objects)) {
    if (plant.templateId !== 'plant.basic' || plant.lifecycle !== 'active') continue;
    const s = plant.state as unknown as PlantState;
    const old = s.stage;
    s.growth = unit(s.growth);
    s.water = unit(s.water);
    s.health = unit(s.health, 1);
    s.sunlight = unit(s.sunlight, .8);
    // Integrate only the hydrated part of this interval, independent of frame size.
    const hydratedSeconds = Math.min(elapsedSeconds, Math.max(0, (s.water - .1) / waterDrain));
    const started = s.growth > 0 || stages.indexOf(old) > 0 || Number.isFinite(s.lastWateredAt);
    if (started) s.growth = Math.min(1, s.growth + hydratedSeconds * growthRate * (.5 + .5 * s.sunlight) * (.5 + .5 * s.health));
    // Snap rounding noise so a threshold is reached on the same tick offline and live.
    for (const boundary of [.15, .35, .60, .85, 1]) {
      if (s.growth < boundary && boundary - s.growth <= 1e-12) s.growth = boundary;
    }
    s.water = Math.max(0, s.water - elapsedSeconds * waterDrain);
    const next = stageFor(s.growth);
    s.stage = stages.indexOf(old) > stages.indexOf(next) ? old : next;
    if (s.stage === 'flower') ensureVisitor(world, plant);
    if (s.stage !== old) bus?.emit('plant.grew', { plantId: plant.id, stage: s.stage });
  }
}

function visitorPlant(world: WorldState, bee: WorldObject | undefined): WorldObject | undefined {
  if (!bee || bee.lifecycle !== 'active' || bee.templateId !== 'bee' || !bee.tags.includes('garden_visitor')) return;
  if (bee.location.type !== 'scene' || bee.location.sceneId !== world.activeSceneId || typeof bee.state.plantId !== 'string') return;
  const plant = world.objects[bee.state.plantId];
  if (!plant || plant.lifecycle !== 'active' || plant.templateId !== 'plant.basic' || plant.state.stage !== 'flower') return;
  if (plant.location.type !== 'scene' || plant.location.sceneId !== bee.location.sceneId) return;
  return plant;
}

export function updateGardenVisitors(world: WorldState, seconds: number, bus?: EventBus) {
  if (!Number.isFinite(seconds) || seconds <= 0) return;
  for (const bee of Object.values(world.objects)) {
    const plant = visitorPlant(world, bee);
    if (!plant) continue;
    const elapsed = Math.max(0, Math.min(arrivalSeconds, finite(bee.state.elapsed)));
    const wasArrived = bee.state.arrived === true;
    bee.state.elapsed = Math.min(arrivalSeconds, elapsed + seconds);
    bee.state.arrived = wasArrived || Number(bee.state.elapsed) >= arrivalSeconds - 1e-9;
    const hoverSeconds = wasArrived ? seconds : Math.max(0, seconds - (arrivalSeconds - elapsed));
    bee.state.phase = (finite(bee.state.phase) + (hoverSeconds % (Math.PI * 2)) * 2) % (Math.PI * 2);
    const phase = Number(bee.state.phase);
    const progress = bee.state.arrived ? 1 : Number(bee.state.elapsed) / arrivalSeconds;
    const x = finite(plant.transform.x), y = finite(plant.transform.y);
    const targetX = x + 22 + Math.cos(phase) * 10;
    const targetY = y - 18 + Math.sin(phase) * 7;
    bee.transform = { x: x + 180 + (targetX - x - 180) * progress, y: y - 90 + (targetY - y + 90) * progress };
    if (!wasArrived && bee.state.arrived) bus?.emit('garden.visitor.arrived', { plantId: plant.id, beeId: bee.id });
  }
}

/** Proximity and reachable approach are validated by WorldEngine before calling. */
export function observeGardenVisitor(world: WorldState, objectId: string, bus?: EventBus): boolean {
  const bee = world.objects[objectId];
  const plant = visitorPlant(world, bee);
  if (!plant || bee.state.arrived !== true || plant.state.pollinated === true || world.flags.gardenStoryComplete) return false;
  plant.state.pollinated = true;
  world.flags.gardenStoryComplete = true;
  const payload = { plantId: plant.id, beeId: bee.id };
  world.eventLog.push({ id: `garden_completed_${plant.id}`, type: 'garden.completed', timestamp: Date.now(), sceneId: world.activeSceneId, targetId: plant.id, ...payload });
  if (world.eventLog.length > 120) world.eventLog.splice(0, world.eventLog.length - 120);
  bus?.emit('garden.completed', payload);
  return true;
}

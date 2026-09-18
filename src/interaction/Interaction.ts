import type { WorldObject } from '../world/WorldObject';
import type { WorldState } from '../world/WorldState';
import { findRoute, isWalkable, nearestWalkable, segmentWalkable, type Point } from '../world/Navigation';

export const INTERACTION_RANGE = 104;

export function interactionPoint(world: WorldState, object: WorldObject): Point {
  if (object.templateId === 'plant.basic') return { x: object.transform.x, y: object.transform.y + 48 };
  if (['pond', 'stream'].includes(object.templateId)) return nearestWalkable(world, object.transform) ?? object.transform;
  return object.transform;
}

function sameScene(world: WorldState, actor: WorldObject, object: WorldObject) {
  return actor.lifecycle === 'active' && object.lifecycle === 'active' && actor.location.type === 'scene' && object.location.type === 'scene'
    && actor.location.sceneId === world.activeSceneId && object.location.sceneId === world.activeSceneId;
}

export function canInteract(world: WorldState, actor: WorldObject | undefined, object: WorldObject | undefined): boolean {
  if (!actor || !object || !sameScene(world, actor, object) || !isWalkable(world, actor.transform)) return false;
  const point = interactionPoint(world, object);
  const distance = Math.hypot(point.x - actor.transform.x, point.y - actor.transform.y);
  if (!Number.isFinite(distance) || distance > INTERACTION_RANGE) return false;
  // Solid objects are touched at their edge; the actor never needs to enter their footprint.
  const edge = ['flower_pot', 'plant.basic', 'tree'].includes(object.templateId) ? 52 : 0;
  const factor = distance > 0 ? Math.max(0, distance - edge) / distance : 0;
  return segmentWalkable(world, actor.transform, {
    x: actor.transform.x + (point.x - actor.transform.x) * factor,
    y: actor.transform.y + (point.y - actor.transform.y) * factor,
  });
}

export function approachPoint(world: WorldState, actor: WorldObject, object: WorldObject): Point | undefined {
  if (!sameScene(world, actor, object)) return undefined;
  if (canInteract(world, actor, object)) return actor.transform;
  const center = interactionPoint(world, object);
  const candidates: Point[] = [];
  for (const radius of [80, 96, 60]) {
    for (let i = 0; i < 16; i++) {
      const angle = i * Math.PI / 8;
      candidates.push({ x: center.x + Math.cos(angle) * radius, y: center.y + Math.sin(angle) * radius });
    }
  }
  candidates.sort((a, b) => Math.hypot(a.x - actor.transform.x, a.y - actor.transform.y) - Math.hypot(b.x - actor.transform.x, b.y - actor.transform.y));
  for (const point of candidates) {
    if (!canInteract(world, { ...actor, transform: point }, object)) continue;
    const path = findRoute(world, actor.transform, point);
    const end = path?.at(-1);
    if (end && canInteract(world, { ...actor, transform: end }, object)) return end;
  }
  return undefined;
}

export function interactionLabel(world: WorldState, object: WorldObject): string {
  const held = Object.values(world.objects).find((o) => o.lifecycle === 'active' && o.location.type === 'carried' && o.location.actorId === 'child_character');
  if (object.tags.includes('garden_visitor')) return object.state.arrived ? '看看花粉' : '蜜蜂飞来了';
  if (object.templateId === 'plant.basic') return held?.templateId === 'watering_can' && Number(object.state.water) < 0.9 ? '浇水' : '观察';
  if (object.templateId === 'flower_pot' && held?.templateId === 'seed') return '种下';
  if (['pond', 'stream'].includes(object.templateId) && held?.templateId === 'watering_can') return '装水';
  if (object.capabilities.carryable) return held ? '先放下' : '拿起';
  if (object.templateId === 'backpack') return '打开';
  if (object.templateId === 'storybook') return '读一读';
  return object.tags.includes('animal') ? '打招呼' : '看看';
}

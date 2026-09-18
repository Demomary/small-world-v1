import type { WorldState } from './WorldState';
import type { EventBus } from '../core/EventBus';
import { findRoute, isWalkable, nearestWalkable, segmentWalkable, type Point } from './Navigation';

export interface MovementState { targetX?: number; targetY?: number; speed: number; moving: boolean; direction?: 'up'|'down'|'left'|'right'; route?: Point[]; routeSceneId?: string; }

export class MovementSystem {
  constructor(private bus: EventBus) {}

  setTarget(world: WorldState, actorId: string, x: number, y: number) {
    const actor = world.objects[actorId];
    if (!actor || actor.location.type !== 'scene' || actor.location.sceneId !== world.activeSceneId || !Number.isFinite(x) || !Number.isFinite(y)) return false;
    const s = actor.state as unknown as MovementState;
    const route = findRoute(world, actor.transform, { x, y });
    if (!route) {
      s.route = []; s.moving = false;
      this.bus.emit('character.blocked', { actorId });
      return false;
    }
    const end = route.at(-1) ?? actor.transform;
    s.targetX = end.x; s.targetY = end.y;
    s.route = route;
    s.routeSceneId = world.activeSceneId;
    s.moving = route.length > 0;
    this.bus.emit('character.move.started', { actorId, x: s.targetX, y: s.targetY });
    if (!s.moving) this.bus.emit('character.reached', { actorId, ...actor.transform });
    return true;
  }

  update(world: WorldState, dt: number) {
    for (const actor of Object.values(world.objects)) {
      if (!actor.tags.includes('character') || actor.lifecycle !== 'active' || actor.location.type !== 'scene' || actor.location.sceneId !== world.activeSceneId) continue;
      const s = actor.state as unknown as MovementState;
      if (!isWalkable(world, actor.transform)) {
        const safe = nearestWalkable(world, actor.transform);
        if (safe) actor.transform = safe;
        s.moving = false; s.route = [];
        this.bus.emit('character.position.corrected', { actorId: actor.id });
      }
      if (s.routeSceneId && s.routeSceneId !== world.activeSceneId) { s.moving = false; s.route = []; }
      if (!s.moving || s.targetX === undefined || s.targetY === undefined) continue;
      if (!s.route?.length) {
        this.setTarget(world, actor.id, s.targetX, s.targetY);
        if (!s.route?.length) continue;
      }
      if (!Number.isFinite(dt) || dt <= 0) continue;
      let remaining = Math.min(dt, 0.25) * (Number.isFinite(s.speed) && s.speed > 0 ? s.speed : 230);
      while (s.route.length && remaining > 0) {
        const next = s.route[0];
        if (!segmentWalkable(world, actor.transform, next)) { this.setTarget(world, actor.id, s.targetX, s.targetY); break; }
        const dx = next.x - actor.transform.x, dy = next.y - actor.transform.y;
        const distance = Math.hypot(dx, dy);
        s.direction = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up');
        if (distance <= remaining) { actor.transform = { ...next }; s.route.shift(); remaining -= distance; }
        else { actor.transform.x += dx / distance * remaining; actor.transform.y += dy / distance * remaining; remaining = 0; }
      }
      if (!s.route.length && s.moving) {
        s.moving = false;
        this.bus.emit('character.reached', { actorId: actor.id, ...actor.transform });
      } else if (s.moving) this.bus.emit('character.moving', { actorId: actor.id, ...actor.transform });
    }
  }
}

import type { EventBus } from '../core/EventBus';
import type { Action } from '../action/Action';
import type { WorldState } from './WorldState';
import type { WorldObject } from './WorldObject';
import { createId } from '../core/Id';
import { observeGardenVisitor, stageFor } from './PlantSystem';
import { MovementSystem } from './MovementSystem';
import { nearestWalkable } from './Navigation';
import { canInteract } from '../interaction/Interaction';

export class WorldEngine {
  private movement: MovementSystem;
  constructor(private world: WorldState, private bus: EventBus) { this.movement = new MovementSystem(bus); }
  get state() { return this.world; }

  dispatch(action: Action): boolean {
    const actor = this.world.objects[action.actorId ?? ''];
    const object = this.world.objects[action.targetId ?? ''];
    const now = Date.now();
    if (!actor || actor.lifecycle !== 'active' || actor.location.type !== 'scene' || actor.location.sceneId !== this.world.activeSceneId) return this.reject(action, '先回到当前场景吧。');
    const heldByActor = (item: WorldObject | undefined) => item?.lifecycle === 'active' && item.location.type === 'carried' && item.location.actorId === actor.id;
    const held = Object.values(this.world.objects).find(heldByActor);

    if (action.type === 'MOVE') {
      const moved = this.movement.setTarget(this.world, actor.id, Number(action.payload?.x), Number(action.payload?.y));
      if (moved) this.record(action);
      return moved;
    }
    if (action.type === 'TRAVEL') {
      if (!['home', 'park', 'forest'].includes(action.sceneId ?? '') || action.sceneId === this.world.activeSceneId) return false;
      const scene = action.sceneId as WorldState['activeSceneId'];
      this.world.activeSceneId = scene;
      actor.location = { type: 'scene', sceneId: scene };
      const spawn = scene === 'home' ? { x: 350, y: 540 } : { x: 450, y: 490 };
      actor.transform = nearestWalkable(this.world, spawn) ?? spawn;
      Object.assign(actor.state, { moving: false, route: [], routeSceneId: scene, targetX: actor.transform.x, targetY: actor.transform.y });
      this.record(action);
      this.bus.emit('scene.entered', { sceneId: scene });
      return true;
    }
    if (action.type === 'PICK') {
      if (held) return this.reject(action, '手里有东西啦，先放下它吧。');
      if (!object?.capabilities.carryable || !canInteract(this.world, actor, object)) return this.reject(action, '走近一点，就能拿起来了。');
      object.location = { type: 'carried', actorId: actor.id, slot: 'hand' };
      this.record(action);
      this.bus.emit('object.picked', { objectId: object.id, actorId: actor.id });
      return true;
    }
    if (action.type === 'DROP') {
      if (!heldByActor(object)) return false;
      const point = nearestWalkable(this.world, { x: actor.transform.x + 42, y: actor.transform.y + 8 });
      object.location = { type: 'scene', sceneId: this.world.activeSceneId };
      object.transform = point && Math.hypot(point.x - actor.transform.x, point.y - actor.transform.y) < 85 ? point : { ...actor.transform };
      this.record(action);
      this.bus.emit('object.dropped', { objectId: object.id });
      return true;
    }
    if (action.type === 'PLANT') {
      const pot = this.world.objects[String(action.payload?.potId)];
      if (!heldByActor(object) || object.templateId !== 'seed' || pot?.templateId !== 'flower_pot' || pot.state.occupied || !canInteract(this.world, actor, pot)) return this.reject(action, '拿着种子，走到空花盆旁边吧。');
      object.lifecycle = 'consumed';
      pot.state.occupied = true;
      const plant: WorldObject = {
        id: createId('plant'), templateId: 'plant.basic', tags: ['plant', 'living', 'interactive'], lifecycle: 'active',
        location: { type: 'scene', sceneId: this.world.activeSceneId }, transform: { x: pot.transform.x, y: pot.transform.y - 48 },
        state: { stage: 'seed', growth: 0, water: 0.4, health: 1, sunlight: 0.8, plantedAt: now },
        capabilities: { usable: true },
      };
      this.world.objects[plant.id] = plant;
      this.record(action);
      this.bus.emit('plant.planted', { plantId: plant.id, potId: pot.id });
      return true;
    }
    if (action.type === 'WATER') {
      const can = this.world.objects[String(action.payload?.canId)];
      if (object?.templateId !== 'plant.basic' || can?.templateId !== 'watering_can' || !heldByActor(can) || !canInteract(this.world, actor, object)) return this.reject(action, '拿着水壶，走到植物旁边吧。');
      const water = Number(can.state.water ?? 0);
      if (!Number.isFinite(water) || water < 0.35) return this.reject(action, '水壶空啦，去池塘或小溪装点水吧。');
      object.state.water = Math.min(1, Number(object.state.water ?? 0) + 0.35);
      can.state.water = Math.max(0, water - 0.35);
      object.state.lastWateredAt = now;
      this.record(action);
      if (Number(object.state.growth) < 0.15) {
        object.state.growth = 0.15;
        object.state.stage = stageFor(0.15);
        this.bus.emit('plant.grew', { plantId: object.id, stage: object.state.stage });
      }
      this.bus.emit('plant.watered', { plantId: object.id, water: object.state.water });
      return true;
    }
    if (action.type === 'REFILL') {
      const source = this.world.objects[String(action.payload?.waterSourceId)];
      if (object?.templateId !== 'watering_can' || !heldByActor(object) || !source || !['pond', 'stream'].includes(source.templateId) || !canInteract(this.world, actor, source)) return this.reject(action, '到水边就可以装水啦。');
      object.state.water = Number(object.state.capacity ?? 1);
      this.record(action);
      this.bus.emit('tool.refilled', { objectId: object.id, sourceId: source.id });
      return true;
    }
    if (action.type === 'INSPECT') {
      if (!canInteract(this.world, actor, object)) return this.reject(action, '走近一点，再仔细看看。');
      this.record(action);
      observeGardenVisitor(this.world, object.id, this.bus);
      this.bus.emit('object.inspected', { objectId: object.id });
      return true;
    }
    return false;
  }

  private reject(action: Action, message: string) {
    this.bus.emit('action.rejected', { type: action.type, message });
    return false;
  }

  private record(action: Action) {
    this.world.eventLog.push({ id: createId('evt'), type: `action.${action.type.toLowerCase()}`, timestamp: Date.now(), sceneId: this.world.activeSceneId, targetId: action.targetId });
    if (this.world.eventLog.length > 120) this.world.eventLog.splice(0, this.world.eventLog.length - 120);
  }
}

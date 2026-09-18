import { describe, expect, it } from 'vitest';
import { initialWorld } from '../src/world/WorldState';
import { WorldEngine } from '../src/world/WorldEngine';
import { EventBus } from '../src/core/EventBus';
import type { WorldObject } from '../src/world/WorldObject';

function setup() {
  const world = initialWorld();
  const object = (id: string, templateId: string, state = {}): WorldObject => ({ id, templateId, state, transform: { x: 500, y: 400 }, tags: [], capabilities: {}, lifecycle: 'active', location: { type: 'scene', sceneId: 'home' } });
  world.objects = { child: object('child', 'child_character'), plant: object('plant', 'plant.basic', { growth: 0, stage: 'seed', water: 0.4 }), can: object('can', 'watering_can', { water: 1, capacity: 1 }), pond: object('pond', 'pond') };
  world.objects.can.location = { type: 'carried', actorId: 'child' };
  const engine = new WorldEngine(world, new EventBus());
  const water = () => engine.dispatch({ id: 'water', type: 'WATER', source: 'child', actorId: 'child', targetId: 'plant', payload: { canId: 'can' }, timestamp: Date.now() });
  return { world, engine, water };
}

describe('watering feedback and refill', () => {
  it('produces the first sprout once without advancing growth on repeated watering', () => {
    const { world, water } = setup();
    water();
    expect(world.objects.plant.state.stage).toBe('sprout');
    expect(world.objects.plant.state.growth).toBe(0.15);
    expect(world.objects.can.state.water).toBeCloseTo(0.65);
    water();
    expect(world.objects.plant.state.growth).toBe(0.15);
    expect(world.objects.can.state.water).toBeCloseTo(0.3);
    water();
    expect(world.objects.can.state.water).toBeCloseTo(0.3);
  });

  it('refills only a held can near a water source in the same scene', () => {
    const { world, engine } = setup();
    world.objects.can.state.water = 0;
    const action = { id: 'refill', type: 'REFILL' as const, source: 'child' as const, actorId: 'child', targetId: 'can', payload: { waterSourceId: 'pond' }, timestamp: Date.now() };
    world.objects.pond.location = { type: 'scene', sceneId: 'park' };
    engine.dispatch(action);
    expect(world.objects.can.state.water).toBe(0);
    world.objects.pond.location = { type: 'scene', sceneId: 'home' };
    world.objects.child.transform.x = 50;
    engine.dispatch(action);
    expect(world.objects.can.state.water).toBe(0);
    world.objects.child.transform.x = 500;
    engine.dispatch(action);
    expect(world.objects.can.state.water).toBe(1);
  });
});

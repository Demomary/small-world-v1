import { describe, expect, it } from 'vitest';
import { WorldEngine } from '../src/world/WorldEngine';
import { initialWorld } from '../src/world/WorldState';
import { EventBus } from '../src/core/EventBus';
import type { WorldObject } from '../src/world/WorldObject';

function setup() {
  const w = initialWorld();
  const item = (id: string, templateId: string, x: number): WorldObject => ({ id, templateId, tags: [], capabilities: { carryable: true }, lifecycle: 'active', location: { type: 'scene', sceneId: 'home' }, transform: { x, y: 450 }, state: {} });
  w.objects = { child: item('child', 'child_character', 400), seed: item('seed', 'seed', 950), can: item('can', 'watering_can', 450), pot: item('pot', 'flower_pot', 900) };
  const engine = new WorldEngine(w, new EventBus());
  return { w, engine };
}

describe('action reach invariants', () => {
  it('cannot pick from far away or carry two objects', () => {
    const { w, engine } = setup();
    engine.dispatch({ id: '1', type: 'PICK', source: 'child', actorId: 'child', targetId: 'seed', timestamp: 1 });
    expect(w.objects.seed.location.type).toBe('scene');
    w.objects.seed.transform.x = 440;
    engine.dispatch({ id: '2', type: 'PICK', source: 'child', actorId: 'child', targetId: 'seed', timestamp: 2 });
    expect(w.objects.seed.location.type).toBe('carried');
    engine.dispatch({ id: '3', type: 'PICK', source: 'child', actorId: 'child', targetId: 'can', timestamp: 3 });
    expect(w.objects.can.location.type).toBe('scene');
  });

  it('cannot plant into a distant pot', () => {
    const { w, engine } = setup();
    w.objects.seed.location = { type: 'carried', actorId: 'child' };
    engine.dispatch({ id: '1', type: 'PLANT', source: 'child', actorId: 'child', targetId: 'seed', payload: { potId: 'pot' }, timestamp: 1 });
    expect(w.objects.seed.lifecycle).toBe('active');
    expect(w.objects.pot.state.occupied).not.toBe(true);
  });

  it('travels atomically with the held item and clears the route', () => {
    const { w, engine } = setup();
    w.objects.can.location = { type: 'carried', actorId: 'child' };
    w.objects.child.state = { route: [{ x: 650, y: 450 }], moving: true, routeSceneId: 'home' };
    engine.dispatch({ id: '1', type: 'TRAVEL', source: 'child', actorId: 'child', sceneId: 'park', timestamp: 1 });
    expect(w.objects.child.location).toEqual({ type: 'scene', sceneId: 'park' });
    expect(w.objects.child.state.moving).toBe(false);
    expect(w.objects.child.state.route).toEqual([]);
    expect(w.objects.can.location).toEqual({ type: 'carried', actorId: 'child' });
  });
});

import { describe, expect, it } from 'vitest';
import { EventBus } from '../src/core/EventBus';
import { initialWorld } from '../src/world/WorldState';
import { MovementSystem } from '../src/world/MovementSystem';
import { isWalkable, segmentWalkable } from '../src/world/Navigation';

function setup() {
  const world = initialWorld();
  world.objects.child = { id: 'child', templateId: 'child_character', tags: ['character'], lifecycle: 'active', location: { type: 'scene', sceneId: 'home' }, transform: { x: 450, y: 260 }, state: { speed: 230, moving: false }, capabilities: {} };
  const bus = new EventBus();
  const movement = new MovementSystem(bus);
  return { world, bus, movement, child: world.objects.child };
}

describe('routed movement', () => {
  it('takes a safe detour around the house and emits reached only once', () => {
    const { world, bus, movement, child } = setup();
    let reached = 0;
    bus.on('character.reached', () => reached++);
    expect(movement.setTarget(world, child.id, 65, 300)).toBe(true);
    for (let step = 0; step < 500 && child.state.moving; step++) {
      const previous = { ...child.transform };
      movement.update(world, 0.05);
      expect(isWalkable(world, child.transform)).toBe(true);
      expect(segmentWalkable(world, previous, child.transform)).toBe(true);
    }
    expect(child.state.moving).toBe(false);
    expect(Math.hypot(child.transform.x - 65, child.transform.y - 300)).toBeLessThan(25);
    expect(reached).toBe(1);
    movement.update(world, 1);
    expect(reached).toBe(1);
  });

  it('clears a saved route when the active scene changes', () => {
    const { world, movement, child } = setup();
    movement.setTarget(world, child.id, 650, 450);
    world.activeSceneId = 'park';
    child.location = { type: 'scene', sceneId: 'park' };
    child.transform = { x: 450, y: 490 };
    movement.update(world, 0.05);
    expect(child.transform).toEqual({ x: 450, y: 490 });
    expect(child.state.moving).toBe(false);
  });

  it('rejects non-finite targets and repairs old saves inside solid geometry', () => {
    const { world, movement, child } = setup();
    expect(movement.setTarget(world, child.id, NaN, 300)).toBe(false);
    child.transform = { x: 200, y: 280 };
    movement.update(world, 0);
    expect(isWalkable(world, child.transform)).toBe(true);
    expect(child.state.moving).toBe(false);
  });
});

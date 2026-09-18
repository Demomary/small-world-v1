import { describe, expect, it } from 'vitest';
import { initialWorld } from '../src/world/WorldState';
import { approachPoint, canInteract, interactionPoint } from '../src/interaction/Interaction';
import { findRoute, isWalkable } from '../src/world/Navigation';
import type { WorldObject } from '../src/world/WorldObject';

const object = (id: string, x: number, y: number, templateId = id): WorldObject => ({ id, templateId, transform: { x, y }, lifecycle: 'active', location: { type: 'scene', sceneId: 'home' }, state: {}, tags: [], capabilities: {} });

describe('reachable interactions', () => {
  it('approaches a pot from a legal location and uses the same base for its plant', () => {
    const world = initialWorld();
    const actor = object('child', 400, 500);
    const pot = object('pot', 520, 390, 'flower_pot');
    const plant = object('plant', 520, 342, 'plant.basic');
    world.objects = { actor, pot };
    const point = approachPoint(world, actor, pot)!;
    expect(point).toBeDefined();
    expect(isWalkable(world, point)).toBe(true);
    actor.transform = point;
    expect(canInteract(world, actor, pot)).toBe(true);
    expect(canInteract(world, actor, plant)).toBe(true);
    expect(interactionPoint(world, plant)).toEqual(pot.transform);
  });

  it('does not allow interacting through the corner of a house', () => {
    const world = initialWorld();
    const actor = object('child', 80, 300);
    const target = object('seed', 140, 355);
    world.objects = { actor, target };
    expect(canInteract(world, actor, target)).toBe(false);
    const approach = approachPoint(world, actor, target)!;
    expect(approach).toBeDefined();
    expect(findRoute(world, actor.transform, approach)).toBeDefined();
  });

  it('rejects objects in other scenes or already carried away', () => {
    const world = initialWorld();
    const actor = object('child', 400, 450);
    const target = object('seed', 400, 450);
    target.location = { type: 'scene', sceneId: 'park' };
    expect(canInteract(world, actor, target)).toBe(false);
    target.location = { type: 'carried', actorId: 'child' };
    expect(approachPoint(world, actor, target)).toBeUndefined();
  });
});

import { describe, expect, it } from 'vitest';
import { findRoute, isWalkable, nearestWalkable, segmentWalkable, type Point } from '../src/world/Navigation';
import { initialWorld, type WorldState } from '../src/world/WorldState';
import type { WorldObject } from '../src/world/WorldObject';

function object(id: string, templateId: string, x: number, y: number): WorldObject {
  return { id, templateId, transform: { x, y }, state: {}, tags: [], capabilities: {}, lifecycle: 'active', location: { type: 'scene', sceneId: 'home' } };
}

function samples(from: Point, route: Point[]): Point[] {
  const result: Point[] = [];
  for (const to of route) {
    const steps = Math.max(1, Math.ceil(Math.hypot(to.x - from.x, to.y - from.y)));
    for (let i = 0; i <= steps; i++) result.push({ x: from.x + (to.x - from.x) * i / steps, y: from.y + (to.y - from.y) * i / steps });
    from = to;
  }
  return result;
}

function safeRoute(world: WorldState, from: Point, to: Point): Point[] {
  const route = findRoute(world, from, to);
  expect(route).toBeDefined();
  expect(route!.length).toBeGreaterThan(0);
  expect(route![0]).not.toEqual(from);
  for (const point of samples(from, route!)) expect(isWalkable(world, point), JSON.stringify(point)).toBe(true);
  let previous = from;
  for (const point of route!) {
    expect(segmentWalkable(world, previous, point)).toBe(true);
    previous = point;
  }
  return route!;
}

describe('illustrated world navigation', () => {
  it('blocks static ground footprints and leaves canopy space open', () => {
    const world = initialWorld();
    for (const p of [{ x: 990, y: 270 }, { x: 160, y: 590 }, { x: 1090, y: 460 }]) expect(isWalkable(world, p)).toBe(false);
    expect(isWalkable(world, { x: 430, y: 210 })).toBe(true);
    world.activeSceneId = 'park';
    for (const p of [{ x: 210, y: 270 }, { x: 380, y: 275 }, { x: 420, y: 214 }]) expect(isWalkable(world, p)).toBe(false);
    expect(isWalkable(world, { x: 470, y: 214 })).toBe(true);
    world.activeSceneId = 'forest';
    expect(isWalkable(world, { x: 1117, y: 236 })).toBe(false);
    expect(isWalkable(world, { x: 1050, y: 300 })).toBe(true);
  });

  it('cannot cross the stream when an active trunk blocks the bridge', () => {
    const world = initialWorld(); world.activeSceneId = 'forest';
    world.objects.tree = object('tree', 'tree', 761, 351);
    world.objects.tree.location = { type: 'scene', sceneId: 'forest' };
    const route = safeRoute(world, { x: 600, y: 450 }, { x: 930, y: 450 });
    expect(route.at(-1)!.x).toBeLessThan(800);
    for (const p of samples({ x: 600, y: 450 }, route)) expect(p.x).toBeLessThan(800);
  });

  it('detours below the house and never cuts a padded corner', () => {
    const world = initialWorld();
    const from = { x: 70, y: 250 }, to = { x: 440, y: 250 };
    expect(segmentWalkable(world, from, to)).toBe(false);
    const route = safeRoute(world, from, to);
    expect(route.at(-1)).toEqual(to);
    for (const p of samples(from, route)) expect(p.x >= 88 && p.x <= 407 && p.y <= 342).toBe(false);
  });

  it('detours around the park lake with an exact safe endpoint', () => {
    const world = initialWorld(); world.activeSceneId = 'park';
    const from = { x: 740, y: 440 }, to = { x: 1145, y: 440 };
    const route = safeRoute(world, from, to);
    expect(route.at(-1)).toEqual(to);
    for (const p of samples(from, route)) expect(((p.x - 960) / 155) ** 2 + ((p.y - 445) / 100) ** 2).toBeGreaterThan(1);
  });

  it.each([240, 460, 640])('crosses the forest stream only on the bridge from y=%s', (y) => {
    const world = initialWorld(); world.activeSceneId = 'forest';
    const from = { x: 580, y }, to = { x: 920, y };
    const route = safeRoute(world, from, to);
    expect(route.at(-1)).toEqual(to);
    const crossings = samples(from, route).filter(p => Math.abs(p.x - 780) < 1);
    expect(crossings.length).toBeGreaterThan(0);
    for (const p of crossings) expect(p.y).toBeGreaterThan(340);
    for (const p of crossings) expect(p.y).toBeLessThan(369);
    expect(isWalkable(world, { x: 761, y: 351 })).toBe(true);
    expect(isWalkable(world, { x: 755, y: 190 })).toBe(false);
    expect(isWalkable(world, { x: 726, y: 655 })).toBe(false);
  });

  it('projects a target inside water onto a reachable bank', () => {
    const world = initialWorld(); world.activeSceneId = 'park';
    const target = { x: 960, y: 445 };
    const route = safeRoute(world, { x: 730, y: 445 }, target);
    expect(route.at(-1)).not.toEqual(target);
    expect(Math.hypot(route.at(-1)!.x - 960, route.at(-1)!.y - 445)).toBeLessThan(135);
    expect(isWalkable(world, nearestWalkable(world, target)!)).toBe(true);
  });

  it('blocks trunks, not crowns, and respects runtime scene and lifecycle', () => {
    const world = initialWorld();
    world.objects.tree = object('tree', 'tree', 600, 430);
    expect(isWalkable(world, { x: 600, y: 430 })).toBe(false);
    expect(isWalkable(world, { x: 600, y: 300 })).toBe(true);
    const from = { x: 500, y: 430 };
    const route = safeRoute(world, from, { x: 700, y: 430 });
    for (const p of samples(from, route)) expect(Math.hypot(p.x - 600, p.y - 430)).toBeGreaterThan(24);
    world.objects.tree.lifecycle = 'destroyed';
    expect(isWalkable(world, { x: 600, y: 430 })).toBe(true);
    world.objects.tree.lifecycle = 'active';
    world.objects.tree.location = { type: 'scene', sceneId: 'park' };
    expect(isWalkable(world, { x: 600, y: 430 })).toBe(true);
  });

  it('keeps all three common garden objects approachable and shares occupied pot geometry', () => {
    const world = initialWorld();
    world.objects.seed = object('seed', 'seed', 400, 450);
    world.objects.pot = object('pot', 'flower_pot', 520, 390);
    world.objects.can = object('can', 'watering_can', 665, 445);
    world.objects.dog = object('dog', 'dog', 450, 450);
    for (const target of [{ x: 400, y: 450 }, { x: 520, y: 390 }, { x: 665, y: 445 }]) {
      const route = safeRoute(world, { x: 560, y: 510 }, target);
      expect(Math.hypot(route.at(-1)!.x - target.x, route.at(-1)!.y - target.y)).toBeLessThan(60);
    }
    expect(isWalkable(world, { x: 450, y: 450 })).toBe(true);
    const before = findRoute(world, { x: 440, y: 390 }, { x: 600, y: 390 });
    world.objects.pot.state.occupied = true;
    world.objects.plant = object('plant', 'plant.basic', 520, 342);
    expect(isWalkable(world, { x: 520, y: 342 })).toBe(true);
    expect(isWalkable(world, { x: 520, y: 390 })).toBe(false);
    expect(findRoute(world, { x: 440, y: 390 }, { x: 600, y: 390 })).toEqual(before);
    delete world.objects.pot;
    expect(isWalkable(world, { x: 520, y: 390 })).toBe(false);
  });

  it('projects onto the starting component when a solid wall isolates the target', () => {
    const world = initialWorld();
    for (let y = 190; y <= 670; y += 30) world.objects[`tree${y}`] = object(`tree${y}`, 'tree', 700, y);
    const route = safeRoute(world, { x: 550, y: 450 }, { x: 820, y: 450 });
    expect(route.at(-1)!.x).toBeLessThan(676);
  });

  it('rejects invalid inputs and blocked starts without escaping through a collider', () => {
    const world = initialWorld(); const safe = { x: 600, y: 450 };
    for (const invalid of [{ x: NaN, y: 450 }, { x: 500, y: Infinity }]) {
      expect(findRoute(world, safe, invalid)).toBeUndefined();
      expect(findRoute(world, invalid, safe)).toBeUndefined();
      expect(nearestWalkable(world, invalid)).toBeUndefined();
      expect(segmentWalkable(world, safe, invalid)).toBe(false);
      expect(isWalkable(world, invalid)).toBe(false);
    }
    expect(findRoute(world, { x: 200, y: 250 }, safe)).toBeUndefined();
    expect(nearestWalkable(world, safe)).toEqual(safe);
    expect(findRoute(world, safe, safe)).toEqual([]);
    safeRoute(world, safe, { x: Number.MAX_VALUE, y: -Number.MAX_VALUE });
  });
});

import { describe, expect, it } from 'vitest';
import { EventBus } from '../src/core/EventBus';
import { initialWorld } from '../src/world/WorldState';
import * as plants from '../src/world/PlantSystem';

function garden(state: Record<string, unknown> = {}) {
  const world = initialWorld();
  world.objects.plant = {
    id: 'plant', templateId: 'plant.basic', tags: ['plant'], lifecycle: 'active',
    location: { type: 'scene', sceneId: 'home' }, transform: { x: 520, y: 342 },
    state: { growth: .15, stage: 'sprout', water: .75, health: 1, sunlight: .8, plantedAt: 0, lastWateredAt: 0, ...state },
    capabilities: {},
  };
  return world;
}
const bees = (world: ReturnType<typeof garden>) => Object.values(world.objects).filter(o => o.tags.includes('garden_visitor'));

describe('plant story elapsed time', () => {
  it('waits for initial watering, then flowers between 90 and 120 seconds', () => {
    const seed = garden({ growth: 0, stage: 'seed', water: .4, lastWateredAt: undefined });
    plants.simulatePlants(seed, 120);
    expect(seed.objects.plant.state.growth).toBe(0);
    const world = garden();
    plants.simulatePlants(world, 89);
    expect(world.objects.plant.state.stage).not.toBe('flower');
    plants.simulatePlants(world, 31);
    expect(world.objects.plant.state.stage).toBe('flower');
    expect(world.flags.gardenStoryComplete).not.toBe(true);
  });

  it.each([100, 400, 86400])('matches offline and small frames over %s seconds, including the dry boundary', seconds => {
    const offline = garden({ water: .25 });
    const live = structuredClone(offline);
    plants.simulatePlants(offline, seconds);
    for (let i = 0; i < seconds * 10; i++) plants.simulatePlants(live, .1);
    expect(live.objects.plant.state.growth).toBeCloseTo(Number(offline.objects.plant.state.growth), 9);
    expect(live.objects.plant.state.water).toBeCloseTo(Number(offline.objects.plant.state.water), 9);
    expect(live.objects.plant.state.stage).toBe(offline.objects.plant.state.stage);
  });

  it('pauses when dry and resumes without a growth boost', () => {
    const world = garden({ water: .09 });
    plants.simulatePlants(world, 50);
    expect(world.objects.plant.state.growth).toBe(.15);
    world.objects.plant.state.water = .75;
    plants.simulatePlants(world, 0);
    expect(world.objects.plant.state.growth).toBe(.15);
    plants.simulatePlants(world, 10);
    expect(Number(world.objects.plant.state.growth)).toBeGreaterThan(.15);
  });

  it.each([10, 30, 60])('agrees at the exact flowering boundary at %s frames per second', fps => {
    const offline = garden({ sunlight: 1 });
    const live = structuredClone(offline);
    plants.simulatePlants(offline, 100);
    for (let i = 0; i < 100 * fps; i++) plants.simulatePlants(live, 1 / fps);
    expect(offline.objects.plant.state.stage).toBe('flower');
    expect(live.objects.plant.state.stage).toBe('flower');
    expect(bees(live)).toHaveLength(1);
    expect(Number(live.objects.plant.state.growth)).toBeCloseTo(Number(offline.objects.plant.state.growth), 9);
  });

  it.each([-1, NaN, Infinity, -Infinity])('ignores invalid elapsed time %s', seconds => {
    const world = garden();
    const before = structuredClone(world);
    plants.simulatePlants(world, seconds);
    expect(world).toEqual(before);
  });

  it('clamps corrupt numeric state and never regresses a legacy grown stage', () => {
    const world = garden({ growth: .65, stage: 'mature', lastWateredAt: undefined, water: .09 });
    plants.simulatePlants(world, 10);
    expect(world.objects.plant.state).toMatchObject({ growth: .65, stage: 'mature' });
    Object.assign(world.objects.plant.state, { growth: NaN, water: 3, health: -1, sunlight: Infinity });
    plants.simulatePlants(world, 10);
    for (const key of ['growth', 'water', 'health', 'sunlight']) {
      expect(Number(world.objects.plant.state[key])).toBeGreaterThanOrEqual(0);
      expect(Number(world.objects.plant.state[key])).toBeLessThanOrEqual(1);
    }
    expect(world.objects.plant.state.stage).toBe('mature');
  });
});

describe('persistent garden visitor', () => {
  it('exports active update and observation APIs', () => {
    expect(plants).toHaveProperty('updateGardenVisitors', expect.any(Function));
    expect(plants).toHaveProperty('observeGardenVisitor', expect.any(Function));
  });

  it('creates one saved bee per flower without advancing arrival offline', () => {
    let world = garden();
    plants.simulatePlants(world, 86400);
    expect(bees(world)).toHaveLength(1);
    expect(bees(world)[0]).toMatchObject({ id: 'garden_bee_plant', templateId: 'bee', state: { plantId: 'plant', arrived: false, elapsed: 0 } });
    world = JSON.parse(JSON.stringify(world));
    plants.simulatePlants(world, 86400);
    expect(bees(world)).toHaveLength(1);
    expect(bees(world)[0].state.arrived).toBe(false);
    expect(world.eventLog.filter(e => e.type === 'garden.completed')).toHaveLength(0);
  });

  it('creates separate stable visitors for two flowers and reuses saved objects', () => {
    const world = garden({ growth: 1, stage: 'flower' });
    world.objects.second = { ...structuredClone(world.objects.plant), id: 'second' };
    plants.simulatePlants(world, 0);
    const first = world.objects.garden_bee_plant;
    plants.simulatePlants(world, 10);
    expect(bees(world).map(o => o.id).sort()).toEqual(['garden_bee_plant', 'garden_bee_second']);
    expect(world.objects.garden_bee_plant).toBe(first);
  });

  it.each([0, -1, NaN, Infinity, -Infinity])('does not advance a visitor with invalid or zero time %s', seconds => {
    const world = garden({ growth: 1, stage: 'flower' });
    plants.simulatePlants(world, 0);
    const before = structuredClone(world);
    plants.updateGardenVisitors(world, seconds);
    expect(world).toEqual(before);
  });

  it('rejects observation when the linked plant is gone or in another scene', () => {
    const world = garden({ growth: 1, stage: 'flower' });
    plants.simulatePlants(world, 0);
    plants.updateGardenVisitors(world, 4);
    world.objects.plant.lifecycle = 'destroyed';
    expect(plants.observeGardenVisitor(world, 'garden_bee_plant')).toBe(false);
    world.objects.plant.lifecycle = 'active';
    world.objects.plant.location = { type: 'scene', sceneId: 'park' };
    expect(plants.observeGardenVisitor(world, 'garden_bee_plant')).toBe(false);
    expect(world.flags.gardenStoryComplete).not.toBe(true);
  });

  it('arrives after four active seconds, resumes after reload, and keeps hovering nearby', () => {
    let world = garden({ growth: 1, stage: 'flower' });
    const bus = new EventBus();
    const arrivals: unknown[] = [];
    bus.on('garden.visitor.arrived', event => arrivals.push(event));
    plants.simulatePlants(world, 1);
    world.activeSceneId = 'park';
    plants.updateGardenVisitors(world, 100, bus);
    expect(bees(world)[0].state.elapsed).toBe(0);
    world.activeSceneId = 'home';
    plants.updateGardenVisitors(world, 2, bus);
    expect(bees(world)[0].state.arrived).toBe(false);
    world = JSON.parse(JSON.stringify(world));
    plants.updateGardenVisitors(world, 2, bus);
    expect(bees(world)[0].state.arrived).toBe(true);
    expect(arrivals).toEqual([{ plantId: 'plant', beeId: 'garden_bee_plant' }]);
    const position = { ...bees(world)[0].transform };
    plants.updateGardenVisitors(world, .5, bus);
    expect(bees(world)[0].transform).not.toEqual(position);
    for (let i = 0; i < 50; i++) {
      plants.updateGardenVisitors(world, .5, bus);
      const bee = bees(world)[0];
      expect(Math.hypot(bee.transform.x - 520, bee.transform.y - 342)).toBeLessThan(55);
    }
    expect(arrivals).toHaveLength(1);
    expect(world.flags.gardenStoryComplete).not.toBe(true);
  });

  it('only rewards a valid arrived visitor once and persists the real bounded event', () => {
    let world = garden({ growth: 1, stage: 'flower' });
    const bus = new EventBus();
    const rewards: unknown[] = [];
    bus.on('garden.completed', event => rewards.push(event));
    plants.simulatePlants(world, 1);
    expect(plants.observeGardenVisitor(world, 'plant', bus)).toBe(false);
    expect(plants.observeGardenVisitor(world, 'missing', bus)).toBe(false);
    expect(plants.observeGardenVisitor(world, 'garden_bee_plant', bus)).toBe(false);
    plants.updateGardenVisitors(world, 4, bus);
    world.activeSceneId = 'park';
    expect(plants.observeGardenVisitor(world, 'garden_bee_plant', bus)).toBe(false);
    world.activeSceneId = 'home';
    world.objects.garden_bee_plant.lifecycle = 'destroyed';
    expect(plants.observeGardenVisitor(world, 'garden_bee_plant', bus)).toBe(false);
    world.objects.garden_bee_plant.lifecycle = 'active';
    world.eventLog = Array.from({ length: 120 }, (_, i) => ({ id: String(i), type: 'action.inspect', timestamp: i }));
    expect(plants.observeGardenVisitor(world, 'garden_bee_plant', bus)).toBe(true);
    expect(world.objects.plant.state.pollinated).toBe(true);
    expect(world.flags.gardenStoryComplete).toBe(true);
    expect(world.eventLog).toHaveLength(120);
    expect(world.eventLog.at(-1)).toMatchObject({ type: 'garden.completed', targetId: 'plant', sceneId: 'home' });
    world = JSON.parse(JSON.stringify(world));
    expect(plants.observeGardenVisitor(world, 'garden_bee_plant', bus)).toBe(false);
    expect(rewards).toEqual([{ plantId: 'plant', beeId: 'garden_bee_plant' }]);
    expect(world.eventLog.filter(e => e.type === 'garden.completed')).toHaveLength(1);
  });
});

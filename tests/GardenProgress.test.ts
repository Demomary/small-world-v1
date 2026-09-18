import { describe, expect, it } from 'vitest';
import { initialWorld } from '../src/world/WorldState';
import { gardenProgress, migrateGardenLayout } from '../src/world/GardenProgress';
import type { WorldObject } from '../src/world/WorldObject';

const object = (id: string, templateId = id): WorldObject => ({ id, templateId, tags: [], lifecycle: 'active', location: { type: 'scene', sceneId: 'home' }, transform: { x: 400, y: 350 }, state: {}, capabilities: {} });

describe('garden guidance', () => {
  it('follows the actual seed, carried item and plant state', () => {
    const world = initialWorld();
    world.objects.seed = object('seed');
    world.objects.pot = object('pot', 'flower_pot');
    world.objects.watering_can = object('watering_can');
    world.objects.watering_can.state.water = 1;
    expect(gardenProgress(world).targetId).toBe('seed');
    world.objects.seed.location = { type: 'carried', actorId: 'child_character' };
    expect(gardenProgress(world).targetId).toBe('pot');
    world.objects.seed.lifecycle = 'consumed';
    world.objects.plant = object('plant', 'plant.basic');
    expect(gardenProgress(world).targetId).toBe('watering_can');
    world.objects.watering_can.location = { type: 'carried', actorId: 'child_character' };
    expect(gardenProgress(world).targetId).toBe('plant');
    world.objects.plant.state.lastWateredAt = Date.now();
    Object.assign(world.objects.plant.state, { growth: .15, stage: 'sprout', water: .75 });
    expect(gardenProgress(world)).toMatchObject({ step: 4, total: 7, done: false, mode: 'observe', growth: .15 });
    Object.assign(world.objects.plant.state, { growth: .4, stage: 'young' });
    expect(gardenProgress(world)).toMatchObject({ step: 5, mode: 'observe' });
    Object.assign(world.objects.plant.state, { growth: .9, stage: 'flower' });
    expect(gardenProgress(world)).toMatchObject({ step: 6, done: false, mode: 'observe' });
    world.objects.bee = { ...object('bee', 'bee'), tags: ['garden_visitor'], state: { plantId: 'plant', arrived: true } };
    expect(gardenProgress(world)).toMatchObject({ step: 6, targetId: 'bee', mode: 'interact', done: false });
    world.objects.plant.state.pollinated = true;
    world.flags.gardenStoryComplete = true;
    expect(gardenProgress(world)).toMatchObject({ step: 7, total: 7, done: true });
  });

  it('guides dry plants to the actual can and empty cans to the pond', () => {
    const world = initialWorld();
    world.objects.plant = { ...object('plant', 'plant.basic'), state: { growth: .4, stage: 'young', water: .05, lastWateredAt: 0 } };
    world.objects.can = { ...object('can', 'watering_can'), location: { type: 'scene', sceneId: 'park' }, state: { water: 0 } };
    world.objects.pond = { ...object('pond'), location: { type: 'scene', sceneId: 'park' } };
    expect(gardenProgress(world)).toMatchObject({ targetId: 'can', mode: 'visit', done: false });
    world.objects.can.location = { type: 'carried', actorId: 'child_character' };
    expect(gardenProgress(world)).toMatchObject({ targetId: 'pond', mode: 'visit' });
    expect(gardenProgress(world).detail).toContain('装水');
    world.activeSceneId = 'park';
    expect(gardenProgress(world)).toMatchObject({ targetId: 'pond', mode: 'interact' });
    world.objects.can.state.water = 1;
    expect(gardenProgress(world)).toMatchObject({ targetId: 'plant', mode: 'visit' });
  });

  it('asks to free the hand without suggesting an invalid action mode', () => {
    const world = initialWorld();
    world.objects.book = { ...object('book', 'storybook'), location: { type: 'carried', actorId: 'child_character' } };
    expect(gardenProgress(world)).toMatchObject({ targetId: 'book', mode: 'observe', done: false });
    expect(gardenProgress(world).detail).toContain('放下手里的东西');
  });

  it('guides watering at the exact dry boundary instead of waiting forever', () => {
    const world = initialWorld();
    world.objects.plant = { ...object('plant', 'plant.basic'), state: { growth: .4, stage: 'young', water: .1 } };
    expect(gardenProgress(world)).toMatchObject({ step: 2, targetId: 'watering_can', mode: 'interact' });
  });

  it('moves original props once, without moving dropped or carried objects', () => {
    const world = initialWorld();
    world.objects.seed = object('seed');
    world.objects.pot = { ...object('pot', 'flower_pot'), transform: { x: 520, y: 350 } };
    world.objects.plant = { ...object('plant', 'plant.basic'), transform: { x: 520, y: 302 } };
    world.objects.watering_can = { ...object('watering_can'), transform: { x: 900, y: 550 } };
    world.objects.backpack = { ...object('backpack'), location: { type: 'carried', actorId: 'child_character' } };
    migrateGardenLayout(world);
    expect(world.objects.seed.transform).toEqual({ x: 400, y: 450 });
    expect(world.objects.pot.transform).toEqual({ x: 520, y: 390 });
    expect(world.objects.plant.transform).toEqual({ x: 520, y: 342 });
    expect(world.objects.watering_can.transform).toEqual({ x: 900, y: 550 });
    expect(world.objects.backpack.location.type).toBe('carried');
    world.objects.seed.transform.x = 650;
    migrateGardenLayout(world);
    expect(world.objects.seed.transform.x).toBe(650);
  });
});

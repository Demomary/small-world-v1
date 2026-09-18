import type { WorldState } from './WorldState';
import { stageFor } from './PlantSystem';

export interface GardenProgress {
  title: string;
  detail: string;
  targetId: string;
  step: number;
  total: number;
  done: boolean;
  mode: 'interact' | 'observe' | 'visit';
  growth: number;
}

export function gardenProgress(world: WorldState): GardenProgress {
  const objects = Object.values(world.objects).filter(o => o.lifecycle === 'active');
  const plant = objects.find(o => o.templateId === 'plant.basic');
  const held = objects.find(o => o.location.type === 'carried' && o.location.actorId === 'child_character');
  const growth = typeof plant?.state.growth === 'number' && Number.isFinite(plant.state.growth) ? Math.max(0, Math.min(1, plant.state.growth)) : 0;
  const result = (title: string, detail: string, targetId: string, step: number, mode: GardenProgress['mode'] = 'interact'): GardenProgress => {
    const target = world.objects[targetId];
    if (target?.location.type === 'scene' && target.location.sceneId !== world.activeSceneId) mode = 'visit';
    return { title, detail, targetId, step, total: 7, done: step === 7, mode, growth };
  };
  const drop = (step: number) => result('先腾出小手', '放下手里的东西，再继续照顾小花园', held!.id, step, 'observe');
  if (world.flags.gardenStoryComplete) return result('花园里的新朋友', '你看到了蜜蜂和花朵的相遇', plant?.id ?? 'pot', 7, 'observe');
  if (plant) {
    const stage = plant.state.stage ?? stageFor(growth);
    if (stage === 'flower') {
      const bee = objects.find(o => o.templateId === 'bee' && o.tags.includes('garden_visitor') && o.state.plantId === plant.id && o.location.type === 'scene' && plant.location.type === 'scene' && o.location.sceneId === plant.location.sceneId);
      if (bee?.state.arrived === true) return result('认识花朵的新朋友', '走近看看，蜜蜂正在花朵旁飞舞', bee.id, 6);
      return result('花开了', '等一等，一位小客人正飞向花朵', plant.id, 6, 'observe');
    }
    const started = growth > 0 || stage !== 'seed' || Number.isFinite(plant.state.lastWateredAt);
    if (!started || !(Number(plant.state.water) > .1)) {
      const can = objects.find(o => o.templateId === 'watering_can');
      if (held && held.templateId !== 'watering_can') return drop(2);
      if (held?.templateId !== 'watering_can') return result('找到小水壶', started ? '泥土干了，生长暂停了，拿水壶来帮忙吧' : '种子也会口渴呢', can?.id ?? 'watering_can', 2);
      if (!(Number(held.state.water) >= .35)) {
        const source = objects.find(o => o.templateId === 'pond') ?? objects.find(o => o.templateId === 'stream');
        return result('给水壶装水', '水壶里的水不够了，去池塘装水再回来', source?.id ?? 'pond', 3);
      }
      return result('给小植物喝点水', started ? '泥土干了，浇水后它就能继续生长' : '让小小的生命开始生长', plant.id, 3);
    }
    return result(stage === 'sprout' || stage === 'seed' ? '小芽正在长大' : '等待花朵开放', '水分充足，静静看看它长大吧', plant.id, stage === 'sprout' || stage === 'seed' ? 4 : 5, 'observe');
  }
  if (held?.templateId === 'seed') return result('种进小花盆', '给这颗种子一个家', objects.find(o => o.templateId === 'flower_pot')?.id ?? 'pot', 1);
  if (held) return drop(0);
  return result('找到小种子', '它会长成什么样呢？', objects.find(o => o.templateId === 'seed')?.id ?? 'seed', 0);
}

// Upgrade untouched prototype placements once; never reset the child's moved items.
export function migrateGardenLayout(world: WorldState) {
  if (world.flags.illustratedGarden) return;
  const placements: Record<string, [number, number, number, number]> = {
    seed: [400, 350, 400, 450], pot: [520, 350, 520, 390], watering_can: [650, 350, 665, 445],
    backpack: [760, 350, 790, 480], storybook: [870, 350, 900, 385],
    child_character: [180, 430, 350, 540],
    park_tree: [350, 360, 370, 360], park_flower: [650, 350, 630, 395],
  };
  for (const [id, [oldX, oldY, x, y]] of Object.entries(placements)) {
    const object = world.objects[id];
    if (!object || object.location.type !== 'scene' || object.transform.x !== oldX || object.transform.y !== oldY) continue;
    object.transform = { x, y };
    if (id === 'pot') {
      for (const plant of Object.values(world.objects)) {
        if (plant.templateId === 'plant.basic' && plant.transform.x === oldX && plant.transform.y === oldY - 48) plant.transform = { x, y: y - 48 };
      }
    }
    if (id === 'child_character') Object.assign(object.state, { targetX: x, targetY: y, moving: false });
  }
  world.flags.illustratedGarden = true;
}

import { EventBus } from '../core/EventBus';
import { initialWorld } from '../world/WorldState';
import { WorldEngine } from '../world/WorldEngine';
import { MovementSystem } from '../world/MovementSystem';
import { simulatePlants, updateGardenVisitors } from '../world/PlantSystem';
import { updateAnimals } from '../world/AnimalSystem';
import { Persistence } from '../persistence/Persistence';
import { Renderer } from '../render/Renderer';
import { recordKnowledgeSignal } from '../knowledge/Progress';
import { opportunities } from '../exploration/Exploration';
import { playListenGame } from '../game/MiniGames';
import { runIceExperiment } from '../experiment/IceExperiment';
import { AudioEngine } from '../audio/AudioEngine';
import { ParentPanel } from '../ui/ParentPanel';
import { QuestionPanel } from '../ui/QuestionPanel';
import { FeedbackSystem } from '../feedback/FeedbackSystem';
import type { Action } from '../action/Action';
import type { WorldObject } from '../world/WorldObject';
import { gardenProgress, migrateGardenLayout } from '../world/GardenProgress';
import { icon } from '../ui/Icons';
import { spriteArt } from '../render/ObjectArt';
import { approachPoint, canInteract } from '../interaction/Interaction';
import '../ui/game.css';

const CHILD = 'child_character';
const id = () => crypto.randomUUID();

type SceneId = 'home' | 'park' | 'forest';

function obj(
  objectId: string,
  templateId: string,
  x: number,
  y: number,
  tags: string[],
  capabilities: Record<string, boolean>,
  state: Record<string, unknown> = {},
  scene: SceneId = 'home',
): WorldObject {
  return {
    id: objectId,
    templateId,
    tags,
    lifecycle: 'active',
    location: { type: 'scene', sceneId: scene },
    transform: { x, y },
    state,
    capabilities,
  };
}

export class App {
  private bus = new EventBus();
  private persistence = new Persistence();
  private world = initialWorld();
  private engine!: WorldEngine;
  private renderer!: Renderer;
  private movement!: MovementSystem;
  private audio = new AudioEngine();
  private focus?: string;
  private pending?: { objectId: string; sceneId: SceneId; mode: 'interact' | 'observe'; attempts: number };
  private ui!: HTMLElement;
  private parent!: ParentPanel;
  private feedback!: FeedbackSystem;
  private questions!: QuestionPanel;
  private liveSaveAccumulator = 0;
  private plantSimAccumulator = 0;
  private renderAccumulator = 0;
  private opportunityIndex = 0;
  private soundEnabled = true;
  private statusKey = '';
  private messageTimer?: number;
  private journal?: HTMLElement;

  async start() {
    this.world = this.persistence.load() ?? this.createWorld();
    if (Object.keys(this.world.objects).length === 0) this.world = this.createWorld();
    migrateGardenLayout(this.world);

    this.advanceClock();
    const elapsed = Math.max(0, (Date.now() - this.world.lastActiveTime) / 1000);
    simulatePlants(this.world, elapsed, this.bus);
    this.world.lastActiveTime = Date.now();

    this.engine = new WorldEngine(this.world, this.bus);
    this.movement = new MovementSystem(this.bus);
    this.movement.update(this.world, 0);
    this.renderer = new Renderer(document.getElementById('app')!);
    await this.renderer.init();

    this.buildUI();
    const host = document.getElementById('app')!;
    this.parent = new ParentPanel(host, this.persistence, () => this.world, () => this.save());
    this.questions = new QuestionPanel(host, () => this.world, () => this.focus, () => this.save(), (s) => this.setLog(s));
    this.feedback = new FeedbackSystem(this.bus, this.audio, (s) => this.setLog(s));

    this.bindEvents();
    if (this.world.activeSceneId === 'home' && !gardenProgress(this.world).done) this.focus = gardenProgress(this.world).targetId;
    this.renderer.sync(this.world, this.focus);
    const progress = gardenProgress(this.world);
    this.setLog(progress.done ? '欢迎回来！你的小花和蜜蜂都在这里。' : progress.step >= 4 ? progress.detail : '那边有一袋种子，会长出什么呢？');
    this.updateStatus();
    document.querySelector('.loading-world')?.remove();

    let last = performance.now();
    this.renderer.app.ticker.add(() => {
      const now = performance.now();
      const elapsed = Math.max(0, (now - last) / 1000);
      const dt = Math.min(0.05, elapsed);
      last = now;

      if (!document.querySelector('.modal-overlay, .parent-overlay')) this.movement.update(this.world, dt);
      updateAnimals(this.world, dt, this.bus);
      updateGardenVisitors(this.world, dt, this.bus);
      this.plantSimAccumulator += elapsed;
      this.liveSaveAccumulator += elapsed;
      this.renderAccumulator += dt;

      if (this.plantSimAccumulator >= 1) {
        simulatePlants(this.world, this.plantSimAccumulator, this.bus);
        this.plantSimAccumulator = 0;
      }
      if (this.liveSaveAccumulator >= 4) {
        this.save();
        this.liveSaveAccumulator = 0;
      }
      if (this.renderAccumulator >= 0.033) {
        this.renderer.sync(this.world, this.focus);
        this.updateStatus();
        this.renderAccumulator = 0;
      }
      this.checkPending();
    });

    window.addEventListener('beforeunload', () => this.save());
    window.addEventListener('pagehide', () => this.save());
    window.addEventListener('keydown', (event) => this.handleDebugKeys(event));
  }

  private advanceClock() {
    const now = Date.now();
    const elapsedSeconds = Math.max(0, (now - this.world.lastActiveTime) / 1000);
    const totalHours = this.world.time.hour + elapsedSeconds / 3600;
    this.world.time.day += Math.floor(totalHours / 24);
    this.world.time.hour = ((totalHours % 24) + 24) % 24;
    if (elapsedSeconds > 0) {
      const weatherPhase = Math.floor(now / 1000 / 60 / 20) % 5;
      this.world.environment.weather = weatherPhase === 2 ? 'rain' : 'sunny';
    }
  }

  private createWorld() {
    const world = initialWorld();
    const add = (o: WorldObject) => { world.objects[o.id] = o; };

    add(obj(CHILD, 'child_character', 180, 430, ['character'], {}, { speed: 230, moving: false, targetX: 180, targetY: 430 }, 'home'));
    add(obj('pot', 'flower_pot', 520, 350, ['container', 'flower_pot'], { container: true }, { occupied: false }));
    add(obj('seed', 'seed', 400, 350, ['item', 'seed', 'plantable'], { carryable: true }));
    add(obj('watering_can', 'watering_can', 650, 350, ['item', 'tool'], { carryable: true, usable: true }, { water: 1, capacity: 1 }));
    add(obj('backpack', 'backpack', 760, 350, ['container'], { container: true }, {}));
    add(obj('home_window', 'window', 940, 190, ['object'], {}, {}));
    add(obj('storybook', 'storybook', 870, 350, ['object', 'knowledge'], { usable: true }, {}));

    add(obj('park_tree', 'tree', 350, 360, ['plant', 'nature'], {}, {}, 'park'));
    add(obj('park_flower', 'flower', 650, 350, ['plant', 'flower', 'nature'], {}, {}, 'park'));
    add(obj('park_bee', 'bee', 720, 320, ['animal', 'insect', 'pollinator'], { movable: true }, { vx: -20, vy: 8 }, 'park'));
    add(obj('park_dog', 'dog', 250, 470, ['animal', 'pet'], { movable: true }, { vx: 16, vy: 2 }, 'park'));
    add(obj('park_cat', 'cat', 740, 520, ['animal', 'pet'], { movable: true }, { vx: -12, vy: 4 }, 'park'));
    add(obj('park_ant', 'ant', 520, 490, ['animal', 'insect'], { movable: true }, { vx: 8, vy: 0 }, 'park'));
    add(obj('basketball', 'basketball', 560, 510, ['item', 'sport'], { carryable: true }, {}, 'park'));
    add(obj('pond', 'pond', 870, 430, ['water'], {}, {}, 'park'));
    add(obj('butterfly', 'butterfly', 560, 250, ['animal', 'insect'], { movable: true }, { vx: 25, vy: 8 }, 'park'));
    add(obj('sparrow', 'sparrow', 760, 220, ['animal', 'bird'], { movable: true }, { vx: -18, vy: 3 }, 'park'));
    add(obj('football', 'football', 420, 520, ['item', 'sport'], { carryable: true }, {}, 'park'));
    add(obj('ice_experiment', 'ice_experiment', 850, 270, ['experiment', 'ice'], { usable: true }, {}, 'park'));
    add(obj('traffic_sign', 'traffic_sign', 160, 250, ['safety', 'object'], {}, {}, 'park'));

    add(obj('stream', 'stream', 720, 450, ['water', 'nature'], {}, {}, 'forest'));
    add(obj('forest_tree', 'tree', 300, 300, ['plant', 'nature'], {}, {}, 'forest'));
    add(obj('rabbit', 'rabbit', 520, 380, ['animal'], { movable: true }, { vx: 12, vy: -3 }, 'forest'));
    add(obj('squirrel', 'squirrel', 830, 300, ['animal'], { movable: true }, { vx: -15, vy: 4 }, 'forest'));
    add(obj('forest_bird', 'sparrow', 650, 220, ['animal', 'bird'], { movable: true }, { vx: 16, vy: -2 }, 'forest'));
    add(obj('mushroom', 'mushroom', 900, 480, ['nature', 'plant'], {}, {}, 'forest'));

    return world;
  }

  private bindEvents() {
    const host = document.getElementById('app')!;
    host.addEventListener('world-object-click', (e: Event) => this.onObject((e as CustomEvent<string>).detail));
    host.addEventListener('world-pointer', (e: Event) => {
      const detail = (e as CustomEvent<{ x: number; y: number }>).detail;
      this.onWorldPoint(detail.x, detail.y);
    });

    this.bus.on('scene.entered', (e: { sceneId: SceneId }) => {
      const names: Record<SceneId, string> = { home: '家', park: '公园', forest: '森林' };
      this.world.eventLog.push({ id: id(), type: 'scene.entered', timestamp: Date.now(), sceneId: e.sceneId });
      this.trimHistory();
      this.opportunityIndex = 0;
      this.setLog(`来到${names[e.sceneId]}。${opportunities(this.world)[0]?.title ?? '四处看看吧。'}`);
    });
    this.bus.on('character.reached', () => this.checkPending());
    this.bus.on('character.blocked', () => { this.pending = undefined; this.setLog('这里暂时走不过去，换个地方看看吧。'); });
    this.bus.on('character.position.corrected', () => { this.pending = undefined; });
    this.bus.on('action.rejected', (e: { message: string }) => this.setLog(e.message));
    this.bus.on('plant.planted', (e: { plantId: string }) => {
      this.renderer.celebrate(this.world.objects[e.plantId], 'plant');
      this.setLog('种子有家啦！再给它喝一点水吧。');
    });
    this.bus.on('plant.watered', (e: { plantId: string }) => {
      this.renderer.celebrate(this.world.objects[e.plantId], 'water', this.world.objects[CHILD]);
      this.setLog('喝饱水啦！一起看看它会长出什么吧。');
    });
    this.bus.on('object.picked', (e: { objectId: string }) => {
      this.discover(e.objectId);
      this.renderer.celebrate(this.world.objects[CHILD], 'pick');
      this.setLog(this.world.objects[e.objectId]?.templateId === 'seed' ? '找到种子啦！我们把它种进花盆吧。' : '拿好啦，出发！');
    });
    this.bus.on('plant.grew', (e: { plantId: string; stage: string }) => {
      const plant = this.world.objects[e.plantId];
      if (plant?.location.type === 'scene' && plant.location.sceneId === this.world.activeSceneId) this.renderer.celebrate(plant, 'grow');
      recordKnowledgeSignal(this.world, { knowledgeId: 'plant_growth', signal: 'observed', strength: 0.1, timestamp: Date.now() });
      const messages: Record<string, string> = { sprout: '泥土里钻出了小芽！', young: '看，嫩芽长出了新叶子！', mature: '叶子舒展开了，小花苞正在长大。', flower: '你种的小花开啦！闻到花香的客人也快到了。' };
      this.setLog(messages[e.stage] ?? '小植物又长大了一点。');
    });
    this.bus.on('garden.visitor.arrived', (e: { beeId: string }) => {
      this.focus = e.beeId;
      this.setLog('嗡嗡，一只蜜蜂来做客了！它的腿上沾着什么？');
      this.save();
    });
    this.bus.on('garden.completed', (e: { plantId: string; beeId: string }) => {
      this.discover(e.beeId);
      recordKnowledgeSignal(this.world, { knowledgeId: 'bee_pollination', signal: 'observed', strength: 0.6, timestamp: Date.now() });
      this.renderer.celebrate(this.world.objects[e.plantId], 'grow');
      this.audio.beep(880, 0.22);
      this.setLog('从一颗种子到一朵花，你还交到了一位新朋友！');
      this.save();
      this.showGardenReward();
    });
  }

  private onWorldPoint(x: number, y: number) {
    if (document.querySelector('.modal-overlay, .parent-overlay')) return;
    this.focus = undefined;
    this.pending = undefined;
    this.dispatch({ id: id(), type: 'MOVE', source: 'child', actorId: CHILD, payload: { x, y }, timestamp: Date.now() });
  }

  private onObject(objectId: string, mode: 'interact' | 'observe' = 'interact', attempts = 0) {
    if (document.querySelector('.modal-overlay, .parent-overlay')) return;
    const object = this.world.objects[objectId];
    if (!object || object.lifecycle !== 'active' || object.location.type !== 'scene' || object.location.sceneId !== this.world.activeSceneId || objectId === CHILD) return;
    this.focus = objectId;
    this.pending = undefined;

    const child = this.world.objects[CHILD];
    if (!child) return;
    this.dispatch({ id: id(), type: 'MOVE', source: 'child', actorId: CHILD, payload: { ...child.transform }, timestamp: Date.now() });
    if (!canInteract(this.world, child, object)) {
      const point = approachPoint(this.world, child, object);
      if (!point) { this.setLog('这里暂时够不到，先去别处看看吧。'); return; }
      this.pending = { objectId, mode, attempts, sceneId: this.world.activeSceneId };
      this.renderer.aim(point.x, point.y);
      if (this.dispatch({ id: id(), type: 'MOVE', source: 'child', actorId: CHILD, payload: point, timestamp: Date.now() })) this.setLog(`去看看${this.nameOf(object)}。`);
      return;
    }
    this.performInteraction(object, mode);
  }

  private performInteraction(object: WorldObject, mode: 'interact' | 'observe') {
    if (!canInteract(this.world, this.world.objects[CHILD], object)) return;
    this.discover(object.id);
    if (mode === 'observe' && object.templateId === 'plant.basic') { this.showPlant(object); return; }
    this.interact(object);
  }

  private interact(object: WorldObject) {
    const held = this.held();
    if (object.tags.includes('garden_visitor')) {
      const completeBefore = this.world.flags.gardenStoryComplete;
      this.dispatch({ id: id(), type: 'INSPECT', source: 'child', actorId: CHILD, targetId: object.id, timestamp: Date.now() });
      if (completeBefore) this.setLog('蜜蜂把花粉带到别的花上，帮助植物结出种子。');
      else if (!this.world.flags.gardenStoryComplete) this.setLog('蜜蜂正在飞向花朵，等它停下来看看。');
      return;
    }
    if (['seed', 'watering_can', 'football', 'basketball'].includes(object.templateId)) {
      this.pick(object);
      return;
    }
    if (object.templateId === 'flower_pot' && object.state.occupied) {
      const plant = Object.values(this.world.objects).find((o) => o.templateId === 'plant.basic' && o.transform.x === object.transform.x && o.lifecycle === 'active');
      if (plant) this.interact(plant);
      return;
    }
    if (object.templateId === 'flower_pot' && held?.templateId === 'seed') {
      this.dispatch({ id: id(), type: 'PLANT', source: 'child', actorId: CHILD, targetId: held.id, payload: { potId: object.id }, timestamp: Date.now() });
      return;
    }
    if (object.templateId === 'plant.basic') {
      if (held?.templateId === 'watering_can' && Number(object.state.water ?? 0) < 0.9) {
        if (Number(held.state.water ?? 0) < 0.35) {
          this.setLog('水壶空啦，带它去池塘或小溪装点水吧。');
          return;
        }
        this.dispatch({ id: id(), type: 'WATER', source: 'child', actorId: CHILD, targetId: object.id, payload: { canId: held.id }, timestamp: Date.now() });
        return;
      }
      recordKnowledgeSignal(this.world, { knowledgeId: 'plant_growth', signal: 'observed', strength: 0.2, timestamp: Date.now() });
      this.showPlant(object);
      return;
    }
    if (object.templateId === 'ice_experiment') {
      void this.runIce();
      return;
    }
    if (object.templateId === 'storybook') {
      this.questions.open('书里有什么秘密？');
      return;
    }
    if (object.templateId === 'backpack') { this.openJournal(); return; }
    if (['pond', 'stream'].includes(object.templateId) && held?.templateId === 'watering_can') {
      if (this.dispatch({ id: id(), type: 'REFILL', source: 'child', actorId: CHILD, targetId: held.id, payload: { waterSourceId: object.id }, timestamp: Date.now() })) {
        this.renderer.celebrate(this.world.objects[CHILD], 'water');
        this.setLog('装满水啦，又可以照顾小植物了。');
      }
      return;
    }
    if (object.templateId === 'traffic_sign') {
      recordKnowledgeSignal(this.world, { knowledgeId: 'traffic_light', signal: 'observed', strength: 0.1, timestamp: Date.now() });
      this.setLog('🚦 这是交通标志。想一想：为什么马路上需要规则？');
      return;
    }
    if (object.tags.includes('animal')) {
      const animalKnowledge: Record<string, string> = {
        butterfly: 'butterfly',
        bee: 'bee_pollination',
        sparrow: 'bird_flight',
        ant: 'ant',
        rabbit: 'animal_behavior',
        squirrel: 'animal_behavior',
        dog: 'animal_behavior',
        cat: 'animal_behavior',
      };
      const knowledgeId = animalKnowledge[object.templateId];
      if (knowledgeId) recordKnowledgeSignal(this.world, { knowledgeId, signal: 'observed', strength: 0.12, timestamp: Date.now() });
      const notes: Record<string, string> = { rabbit: '小兔子竖起了耳朵，好像听到了什么。', squirrel: '松鼠的大尾巴像一把小伞。', butterfly: '蝴蝶在花间飞舞，翅膀像两片花瓣。', bee: '蜜蜂忙着采花蜜呢。', dog: '小狗摇着尾巴，想和你交朋友。', cat: '小猫伸了个懒腰。', sparrow: '听，小鸟在唱歌！', ant: '小蚂蚁正在寻找食物。' };
      this.renderer.celebrate(object, 'pick');
      this.setLog(notes[object.templateId] ?? `${this.nameOf(object)}发现你啦！`);
      return;
    }
    this.setLog(object.templateId === 'flower_pot' ? '一个空花盆，正等着一颗小种子。' : `发现了${this.nameOf(object)}！它藏着什么秘密呢？`);
  }

  private pick(object: WorldObject) {
    if (this.held()) {
      this.setLog('🖐️ 手里已经拿着东西了。先放下，再拿别的。');
      return;
    }
    this.dispatch({ id: id(), type: 'PICK', source: 'child', actorId: CHILD, targetId: object.id, timestamp: Date.now() });
  }

  private held() {
    return Object.values(this.world.objects).find(
      (o) => o.lifecycle === 'active' && o.location.type === 'carried' && o.location.actorId === CHILD,
    );
  }

  private checkPending() {
    if (!this.pending || document.querySelector('.modal-overlay, .parent-overlay')) return;
    const object = this.world.objects[this.pending.objectId];
    const child = this.world.objects[CHILD];
    if (!object || !child || object.lifecycle !== 'active' || this.pending.sceneId !== this.world.activeSceneId || object.location.type !== 'scene' || object.location.sceneId !== this.world.activeSceneId) {
      this.pending = undefined;
      return;
    }
    if (child.state.moving) return;
    if (canInteract(this.world, child, object)) this.tryPending();
    else if (this.pending.attempts < 3) this.onObject(object.id, this.pending.mode, this.pending.attempts + 1);
    else { this.pending = undefined; this.setLog('它换了个地方，我们再靠近一点吧。'); }
  }

  private tryPending() {
    if (!this.pending) return;
    const { objectId, mode } = this.pending;
    this.pending = undefined;
    const object = this.world.objects[objectId];
    if (object) this.performInteraction(object, mode);
  }

  private dispatch(action: Action) {
    const success = this.engine.dispatch(action);
    if (this.world.activeSceneId === 'home' && ['PICK', 'PLANT', 'WATER'].includes(action.type)) this.focus = gardenProgress(this.world).targetId;
    this.save();
    return success;
  }

  private showPlant(object: WorldObject) {
    const state = object.state as { stage?: string; growth?: number; water?: number };
    const stages: Record<string, string> = { seed: '种子睡在泥土里', sprout: '冒出嫩嫩的小芽', young: '长出了新叶子', mature: '已经枝繁叶茂', flower: '开出了漂亮的花' };
    this.setLog(`${stages[state.stage ?? 'seed']}。${Number(state.water ?? 0) <= 0.1 ? '它有点渴了，再浇一点水吧。' : state.stage === 'flower' ? '花香会引来什么客人呢？' : '再等一小会儿，就会有新的变化。'}`);
  }

  private dropHeld() {
    const held = this.held();
    if (!held) {
      this.setLog('手里现在没有东西。');
      return;
    }
    this.dispatch({ id: id(), type: 'DROP', source: 'child', actorId: CHILD, targetId: held.id, timestamp: Date.now() });
    this.setLog(`把${this.nameOf(held)}放下了。`);
  }

  private nameOf(object: WorldObject) {
    const names: Record<string, string> = {
      seed: '种子', flower_pot: '花盆', watering_can: '水壶', plant: '植物', 'plant.basic': '植物',
      butterfly: '蝴蝶', sparrow: '小鸟', rabbit: '兔子', squirrel: '松鼠', tree: '树', flower: '花',
      pond: '池塘', stream: '小溪', football: '足球', basketball: '篮球', ice_experiment: '冰实验',
      window: '窗户', bee: '蜜蜂', dog: '小狗', cat: '小猫', ant: '蚂蚁', backpack: '背包', storybook: '故事书',
      traffic_sign: '交通标志', mushroom: '蘑菇', child_character: '我',
    };
    return names[object.templateId] ?? object.templateId;
  }

  private discover(objectId: string) {
    if (this.world.discoveries.includes(objectId)) return;
    this.world.discoveries.push(objectId);
    this.world.eventLog.push({ id: id(), type: 'object.discovered', timestamp: Date.now(), sceneId: this.world.activeSceneId, targetId: objectId });
    this.trimHistory();
  }

  private trimHistory() {
    if (this.world.eventLog.length > 120) this.world.eventLog.splice(0, this.world.eventLog.length - 120);
    if (this.world.questions.length > 50) this.world.questions.splice(0, this.world.questions.length - 50);
  }

  private ask() {
    this.questions.open();
  }

  private async runIce() {
    if (document.querySelector('.modal-overlay, .parent-overlay')) return;
    this.setLog('🧪 实验：猜猜冰放在温暖的地方会怎样？');
    const result = await runIceExperiment();
    recordKnowledgeSignal(this.world, { knowledgeId: result.knowledgeId, signal: 'understood', strength: 0.3, timestamp: Date.now() });
    this.setLog(`${result.title}\n${result.message}`);
    this.persistence.save(this.world);
  }

  private async listenGame() {
    if (document.querySelector('.modal-overlay, .parent-overlay')) return;
    this.setLog('🎧 仔细听……');
    const result = await playListenGame(this.audio);
    recordKnowledgeSignal(this.world, { knowledgeId: result.knowledgeId!, signal: result.signal, strength: 0.3, timestamp: Date.now() });
    const bird = Object.values(this.world.objects).find((o) => o.templateId === 'sparrow' && o.location.type === 'scene' && o.location.sceneId === this.world.activeSceneId);
    if (result.knowledgeId === 'bird_flight' && bird) this.focus = bird.id;
    this.setLog(`${result.title}\n${result.message}`);
    this.persistence.save(this.world);
  }

  private travel(scene: SceneId) {
    if (scene === this.world.activeSceneId) {
      this.setLog(`已经在${this.sceneName(scene)}了。走走看看吧。`);
      return;
    }
    this.pending = undefined;
    this.dispatch({ id: id(), type: 'TRAVEL', source: 'child', actorId: CHILD, sceneId: scene, timestamp: Date.now() });
    this.focus = undefined;
    this.pending = undefined;
    this.renderer.sync(this.world);
    this.save();
  }

  private buildUI() {
    const app = document.getElementById('app')!;
    this.ui = document.createElement('div');
    this.ui.className = 'hud';
    this.ui.innerHTML = `
      <header class="game-header">
        <div class="world-brand"><span class="brand-mark">${icon('sprout')}</span><div><h1>小小世界</h1><div id="status" class="world-status"></div></div></div>
        <nav class="scene-nav" aria-label="选择场景">
          <button id="home">${icon('home')}<span>小院</span></button><button id="park">${icon('park')}<span>公园</span></button><button id="forest">${icon('forest')}<span>森林</span></button>
        </nav>
        <div class="header-actions"><button id="sound" class="icon-button" aria-label="关闭声音" data-tooltip="声音">${icon('sound')}</button><button id="parent" class="icon-button" aria-label="家长设置" data-tooltip="家长设置">${icon('settings')}</button></div>
      </header>
      <button id="next" class="quest" aria-label="继续探索"><span class="quest-art">${icon('sprout')}</span><span class="quest-copy"><span id="quest-category">小小园丁</span><strong id="quest-title"></strong><span id="quest-detail"></span><span id="quest-progress" class="quest-progress"></span></span>${icon('next')}</button>
      <div class="world-corner"><span class="save-indicator"></span>我的探索日记 <b id="discovery-count">0</b></div>
      <div class="dialogue" role="status" aria-live="polite"><div class="dialogue-avatar"><img src="${this.artUrl('child_character')}" alt=""/></div><div id="log"></div><button id="dismiss-message" class="icon-button" aria-label="收起对话">${icon('close')}</button></div>
      <footer class="game-dock">
        <button id="journal" class="dock-tool" data-tooltip="我的发现">${icon('book')}<span>发现册</span></button>
        <button id="listen" class="dock-tool" data-tooltip="听声找动物">${icon('listen')}<span>听一听</span></button>
        <button id="ice" class="dock-tool" data-tooltip="冰块小实验">${icon('experiment')}<span>实验室</span></button>
        <span class="dock-divider"></span>
        <button id="drop" class="held-slot" aria-label="放下手中物品" data-tooltip="放下物品"><img id="held-image" alt=""/><span id="held-label">空手</span></button>
        <button id="ask" class="ask-button">${icon('ask')}<span>问一问</span></button>
      </footer>`;
    app.appendChild(this.ui);

    this.ui.querySelector('#ask')!.addEventListener('click', () => this.ask());
    this.ui.querySelector('#next')!.addEventListener('click', () => this.showOpportunity());
    this.ui.querySelector('#drop')!.addEventListener('click', () => this.dropHeld());
    this.ui.querySelector('#listen')!.addEventListener('click', () => void this.listenGame());
    this.ui.querySelector('#ice')!.addEventListener('click', () => void this.runIce());
    this.ui.querySelector('#home')!.addEventListener('click', () => this.travel('home'));
    this.ui.querySelector('#park')!.addEventListener('click', () => this.travel('park'));
    this.ui.querySelector('#forest')!.addEventListener('click', () => this.travel('forest'));
    this.ui.querySelector('#parent')!.addEventListener('click', () => this.parent.open());
    this.ui.querySelector('#journal')!.addEventListener('click', () => this.openJournal());
    this.ui.querySelector('#dismiss-message')!.addEventListener('click', () => this.ui.querySelector('.dialogue')?.classList.add('is-hidden'));
    this.ui.querySelector('#sound')!.addEventListener('click', () => {
      this.soundEnabled = !this.soundEnabled;
      this.audio.setEnabled(this.soundEnabled);
      const button = this.ui.querySelector('#sound')!;
      button.innerHTML = icon(this.soundEnabled ? 'sound' : 'mute');
      button.setAttribute('aria-label', this.soundEnabled ? '关闭声音' : '开启声音');
      button.setAttribute('aria-pressed', String(!this.soundEnabled));
    });
  }

  private showOpportunity() {
    if (this.world.activeSceneId === 'home') {
      const progress = gardenProgress(this.world);
      const target = this.world.objects[progress.targetId];
      if (target?.location.type === 'scene' && target.location.sceneId !== 'home') {
        this.travel(target.location.sceneId as SceneId);
      }
      if (target?.capabilities.carryable && this.held() && this.held()?.id !== target.id) this.dropHeld();
      this.onObject(progress.targetId, progress.mode === 'observe' ? 'observe' : 'interact');
      return;
    }
    const list = opportunities(this.world);
    if (!list.length) {
      this.setLog('✨ 这里暂时没有明确提示。慢慢走走，也许会自己发现。');
      return;
    }
    const op = list[this.opportunityIndex % list.length];
    this.opportunityIndex = (this.opportunityIndex + 1) % list.length;
    this.setLog(`✨ ${op.title}`);
    if (op.targetId) {
      this.onObject(op.targetId);
    }
    if (op.kind === 'travel') {
      const next: SceneId = op.id === 'go-park' ? 'park' : op.id === 'go-forest' ? 'forest' : 'home';
      this.travel(next);
    }
    if (op.kind === 'game') void this.listenGame();
    if (op.kind === 'experiment') void this.runIce();
  }

  private handleDebugKeys(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      document.querySelector('.garden-reward')?.remove();
      this.questions.close(); this.parent.close(); this.journal?.remove(); this.journal = undefined;
      return;
    }
    if (document.querySelector('.modal-overlay, .parent-overlay')) return;
    const target = event.target as HTMLElement | null;
    if (target?.tagName === 'INPUT') return;
    const key = event.key.toLowerCase();
    const map: Record<string, { x: number; y: number }> = {
      arrowleft: { x: -1, y: 0 }, a: { x: -1, y: 0 },
      arrowright: { x: 1, y: 0 }, d: { x: 1, y: 0 },
      arrowup: { x: 0, y: -1 }, w: { x: 0, y: -1 },
      arrowdown: { x: 0, y: 1 }, s: { x: 0, y: 1 },
    };
    const direction = map[key];
    if (!direction) return;
    event.preventDefault();
    const child = this.world.objects[CHILD];
    if (!child) return;
    this.onWorldPoint(child.transform.x + direction.x * 65, child.transform.y + direction.y * 65);
  }

  private sceneName(scene: SceneId) {
    return ({ home: '家', park: '公园', forest: '森林' } as Record<SceneId, string>)[scene];
  }

  private updateStatus() {
    const status = this.ui?.querySelector('#status');
    if (!status) return;
    const held = this.held();
    const progress = gardenProgress(this.world);
    const key = [this.world.activeSceneId, this.world.environment.weather, this.world.time.day, this.world.discoveries.length, held?.id, held?.state.water, progress.step, progress.title, Math.floor(progress.growth * 100)].join(':');
    if (key === this.statusKey) return;
    this.statusKey = key;
    this.ui.dataset.scene = this.world.activeSceneId;
    const rainy = this.world.environment.weather === 'rain';
    status.innerHTML = `${icon(rainy ? 'rain' : 'sun')}<span>第 ${this.world.time.day} 天 · ${rainy ? '小雨' : '晴天'}</span>`;
    for (const scene of ['home', 'park', 'forest']) this.ui.querySelector(`#${scene}`)?.setAttribute('aria-current', String(scene === this.world.activeSceneId));
    const atHome = this.world.activeSceneId === 'home';
    this.ui.querySelector('#quest-category')!.textContent = atHome ? '小小园丁' : this.world.activeSceneId === 'park' ? '公园奇遇' : '森林来信';
    this.ui.querySelector('#quest-title')!.textContent = atHome ? progress.title : this.world.activeSceneId === 'park' ? '花丛里的飞行家' : '谁在树林里唱歌？';
    this.ui.querySelector('#quest-detail')!.textContent = atHome ? progress.detail : this.world.activeSceneId === 'park' ? '和蝴蝶交个朋友' : '去听听远处的声音';
    this.ui.querySelector('#quest-progress')!.innerHTML = atHome ? Array.from({ length: progress.total }, (_, step) => `<i class="${step < progress.step ? 'complete' : ''}"></i>`).join('') : '';
    this.ui.querySelector('#home')!.setAttribute('data-notification', String(!atHome && progress.step >= 6 && !progress.done));
    this.ui.querySelector('.quest-art')!.innerHTML = icon(atHome && progress.done ? 'check' : atHome ? 'sprout' : 'compass');
    this.ui.querySelector('#discovery-count')!.textContent = String(this.world.discoveries.length);
    const drop = this.ui.querySelector<HTMLButtonElement>('#drop')!;
    drop.disabled = !held;
    this.ui.querySelector<HTMLImageElement>('#held-image')!.src = this.artUrl(held?.templateId ?? 'backpack');
    this.ui.querySelector('#held-label')!.textContent = held ? this.nameOf(held) : '空手';
    drop.dataset.tooltip = held ? `放下${this.nameOf(held)}` : '空手';
  }

  private setLog(text: string) {
    const element = this.ui?.querySelector('#log');
    if (element) {
      element.textContent = text.replace(/[\p{Extended_Pictographic}\uFE0F\u200D]/gu, '').trim();
      this.ui.querySelector('.dialogue')?.classList.remove('is-hidden');
      window.clearTimeout(this.messageTimer);
      this.messageTimer = window.setTimeout(() => this.ui.querySelector('.dialogue')?.classList.add('is-hidden'), 9000);
    }
  }

  private artUrl(template: string, stage?: string) {
    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(spriteArt(template, stage).svg)}`;
  }

  private openJournal() {
    if (this.journal) return;
    const entries = Object.values(this.world.objects).filter((o) => o.id !== CHILD && o.templateId !== 'window');
    const templates = [...new Map(entries.map((o) => [o.templateId, o])).values()];
    this.journal = document.createElement('div');
    this.journal.className = 'modal-overlay';
    this.journal.innerHTML = `<section class="modal-card journal-card" role="dialog" aria-modal="true" aria-labelledby="journal-title"><div class="modal-head"><div><div class="modal-sub">一路走来，遇见的美好</div><h2 id="journal-title">我的发现册</h2></div><button class="icon-button" aria-label="关闭发现册">${icon('close')}</button></div><div class="journal-grid">${templates.map((o) => {
      const found = entries.some((entry) => entry.templateId === o.templateId && this.world.discoveries.includes(entry.id));
      return `<div class="journal-item ${found ? '' : 'undiscovered'}"><img src="${this.artUrl(o.templateId, String(o.state.stage ?? 'sprout'))}" alt=""/><span>${found ? this.nameOf(o) : '未发现'}</span>${found ? icon('check') : ''}</div>`;
    }).join('')}</div></section>`;
    document.getElementById('app')!.appendChild(this.journal);
    const close = () => { this.journal?.remove(); this.journal = undefined; this.ui.querySelector<HTMLButtonElement>('#journal')?.focus(); };
    this.journal.querySelector('button')!.addEventListener('click', close);
    this.journal.addEventListener('click', (event) => { if (event.target === this.journal) close(); });
    this.journal.querySelector<HTMLButtonElement>('button')!.focus();
  }

  private showGardenReward() {
    if (document.querySelector('.garden-reward')) return;
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay garden-reward';
    overlay.innerHTML = `<section class="modal-card garden-reward-card" role="dialog" aria-modal="true" aria-labelledby="garden-reward-title"><div class="reward-art"><img class="reward-flower" src="${this.artUrl('plant.basic', 'flower')}" alt="盛开的第一朵花"/><img class="reward-bee" src="${this.artUrl('bee')}" alt="来访的蜜蜂"/></div><span class="reward-eyebrow">小小园丁 · 新发现</span><h2 id="garden-reward-title">第一朵花，第一位朋友</h2><p>你照顾的种子开花了！<br/>蜜蜂采走花蜜，也把花粉带去远方。<br/>小小的照顾，让世界多了一份美好。</p><button id="reward-continue">${icon('check')} 继续探索</button></section>`;
    document.getElementById('app')!.appendChild(overlay);
    const close = () => { overlay.remove(); this.ui.querySelector<HTMLButtonElement>('#journal')?.focus(); };
    overlay.querySelector('button')!.addEventListener('click', close);
    overlay.addEventListener('click', (event) => { if (event.target === overlay) close(); });
    overlay.querySelector<HTMLButtonElement>('button')!.focus();
  }

  private save() {
    this.world.lastActiveTime = Date.now();
    this.world.updatedAt = Date.now();
    this.persistence.save(this.world);
  }
}

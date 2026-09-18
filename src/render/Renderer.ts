import { Application, Container, Ellipse, Graphics, Polygon, Rectangle, Sprite, Text, Texture } from 'pixi.js';
import type { WorldState } from '../world/WorldState';
import type { WorldObject } from '../world/WorldObject';
import { sceneArt } from './SceneArt';
import { spriteArt } from './ObjectArt';
import { worldView } from './Camera';

const TEMPLATES = ['child_character', 'flower_pot', 'seed', 'watering_can', 'backpack', 'storybook', 'window', 'tree', 'flower', 'bee', 'dog', 'cat', 'ant', 'basketball', 'pond', 'butterfly', 'sparrow', 'football', 'ice_experiment', 'traffic_sign', 'stream', 'rabbit', 'squirrel', 'mushroom'];
const LABELS: Record<string, string> = {
  child_character: '小小探险家', flower_pot: '小花盆', seed: '一袋种子', watering_can: '小水壶', backpack: '探险背包', storybook: '故事书',
  tree: '大树', flower: '小花', bee: '蜜蜂', dog: '小狗', cat: '小猫', ant: '蚂蚁', basketball: '篮球', pond: '池塘', butterfly: '蝴蝶',
  sparrow: '小鸟', football: '足球', ice_experiment: '冰块实验', traffic_sign: '路口标志', stream: '小溪', rabbit: '小兔子', squirrel: '松鼠', mushroom: '蘑菇', 'plant.basic': '我的小植物',
};
type ObjectView = { container: Container; sprite: Sprite; shadow: Graphics; ring: Graphics; label: Text; key: string };
type Effect = { x: number; y: number; fromX?: number; fromY?: number; start: number; kind: 'pick' | 'plant' | 'water' | 'grow' };

export class Renderer {
  app = new Application();
  root = new Container();
  private background = new Sprite();
  private actors = new Container();
  private effects = new Graphics();
  private ambient = new Graphics();
  private marker = new Graphics();
  private heldSprite = new Sprite();
  private textures = new Map<string, Texture>();
  private scenes = new Map<string, Texture>();
  private views = new Map<string, ObjectView>();
  private bursts: Effect[] = [];
  private hovered?: string;
  private scene?: string;
  private sceneStarted = 0;
  private destination?: { x: number; y: number; start: number };
  private cameraFocus = { x: 600, y: 360 };
  private pan?: { startX: number; focusX: number; moved: boolean };
  private manualFocus?: number;
  private lastActorX = 0;

  constructor(private host: HTMLElement) {}

  async init() {
    await this.app.init({ resizeTo: this.host, background: 0xb4d897, antialias: true, resolution: Math.min(devicePixelRatio || 1, 2), autoDensity: true });
    this.host.appendChild(this.app.canvas);
    this.app.canvas.style.touchAction = 'none';
    this.app.canvas.setAttribute('aria-label', '小小世界探索场景');
    this.app.stage.addChild(this.root);
    this.root.addChild(this.background, this.marker, this.actors, this.heldSprite, this.ambient, this.effects);
    this.actors.sortableChildren = true;
    this.heldSprite.anchor.set(0.5, 1);
    this.heldSprite.eventMode = 'none';
    this.background.eventMode = 'static';
    this.background.cursor = 'pointer';
    this.background.on('pointerdown', (event) => {
      this.pan = { startX: event.global.x, focusX: this.cameraFocus.x, moved: false };
    });
    this.background.on('globalpointermove', (event) => {
      if (!this.pan) return;
      if (Math.abs(event.global.x - this.pan.startX) > 12) this.pan.moved = true;
      if (this.pan.moved) this.manualFocus = this.pan.focusX - (event.global.x - this.pan.startX) / this.root.scale.x;
    });
    this.background.on('pointerup', (event) => {
      if (!this.pan?.moved) {
        const point = event.getLocalPosition(this.root);
        this.aim(point.x, point.y);
        this.host.dispatchEvent(new CustomEvent('world-pointer', { detail: point }));
      }
      this.pan = undefined;
    });
    this.background.on('pointerupoutside', () => { this.pan = undefined; });
    await Promise.all([
      ...['home', 'park', 'forest'].map(async (name) => this.scenes.set(name, await this.makeTexture(sceneArt(name), 1200, 720))),
      ...TEMPLATES.map(async (name) => {
        const art = spriteArt(name);
        this.textures.set(name, await this.makeTexture(art.svg, art.width, art.height));
      }),
      ...['seed', 'sprout', 'young', 'mature', 'flower'].map(async (stage) => {
        const art = spriteArt('plant.basic', stage);
        this.textures.set(`plant.basic:${stage}`, await this.makeTexture(art.svg, art.width, art.height));
      }),
    ]);
    this.app.canvas.dataset.renderReady = 'true';
  }

  private async makeTexture(svg: string, width: number, height: number): Promise<Texture> {
    const url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }));
    try {
      const image = new Image();
      image.src = url;
      await image.decode();
      const canvas = document.createElement('canvas');
      canvas.width = width * 2;
      canvas.height = height * 2;
      canvas.getContext('2d')!.drawImage(image, 0, 0, canvas.width, canvas.height);
      return Texture.from({ resource: canvas, resolution: 2 });
    } finally { URL.revokeObjectURL(url); }
  }

  sync(world: WorldState, selected?: string) {
    const now = performance.now();
    const actor = world.objects.child_character;
    if (this.scene !== world.activeSceneId) {
      this.scene = world.activeSceneId;
      this.background.texture = this.scenes.get(this.scene)!;
      this.background.width = 1200;
      this.background.height = 720;
      this.sceneStarted = now;
      this.manualFocus = undefined;
      this.bursts = [];
      this.destination = undefined;
      this.hovered = undefined;
      this.app.canvas.dataset.scene = this.scene;
    }
    if (actor && Math.abs(actor.transform.x - this.lastActorX) > 0.5) this.manualFocus = undefined;
    this.lastActorX = actor?.transform.x ?? 600;
    this.cameraFocus = { x: this.manualFocus ?? actor?.transform.x ?? 600, y: actor?.transform.y ?? 360 };
    const view = worldView(this.app.screen.width, this.app.screen.height, this.cameraFocus);
    this.root.scale.set(view.scale);
    this.root.position.set(view.x, view.y);
    this.root.alpha = Math.min(1, 0.5 + (now - this.sceneStarted) / 400);
    this.app.canvas.dataset.view = JSON.stringify(view);

    const visible = new Set<string>();
    for (const object of Object.values(world.objects)) {
      if (object.lifecycle !== 'active' || object.location.type !== 'scene' || object.location.sceneId !== this.scene || object.templateId === 'window' || (object.templateId === 'flower_pot' && object.state.occupied)) continue;
      visible.add(object.id);
      const item = this.views.get(object.id) ?? this.createObject(object);
      const key = object.templateId === 'plant.basic' ? `plant.basic:${object.state.stage ?? 'seed'}` : object.templateId;
      if (key !== item.key) { item.sprite.texture = this.textures.get(key)!; item.key = key; }
      const isChild = object.templateId === 'child_character';
      const flying = ['bee', 'butterfly', 'sparrow'].includes(object.templateId);
      const moving = isChild ? Boolean(object.state.moving) : object.tags.includes('animal') && Number(object.state.pauseUntil ?? 0) < Date.now();
      const bob = flying ? Math.sin(now / 240 + object.transform.x) * 5 : moving ? Math.sin(now / 95) * 3 : Math.sin(now / 900 + object.transform.x) * 0.7;
      item.container.position.set(object.transform.x, object.transform.y + (object.templateId === 'plant.basic' ? 48 : 0));
      item.container.zIndex = object.transform.y + (object.templateId === 'plant.basic' ? 70 : 0);
      item.sprite.position.y = bob;
      item.sprite.rotation = moving && !flying ? Math.sin(now / 120) * 0.035 : 0;
      item.sprite.scale.x = (object.state.direction === 'left' || Number(object.state.vx ?? 0) < 0) ? -1 : 1;
      item.sprite.visible = !['pond', 'stream'].includes(object.templateId);
      item.shadow.visible = item.sprite.visible && object.templateId !== 'plant.basic';
      const active = selected === object.id || this.hovered === object.id;
      item.ring.visible = active;
      item.ring.alpha = 0.6 + Math.sin(now / 220) * 0.2;
      item.label.visible = active && !isChild;
      item.label.y = -item.sprite.height - 12;
      item.label.text = LABELS[object.templateId] ?? '新发现';
    }
    for (const [id, item] of this.views) {
      if (!visible.has(id)) { item.container.destroy({ children: true }); this.views.delete(id); }
    }

    const held = Object.values(world.objects).find((o) => o.lifecycle === 'active' && o.location.type === 'carried' && o.location.actorId === actor?.id);
    this.heldSprite.visible = Boolean(held && actor);
    if (held && actor) {
      this.heldSprite.texture = this.textures.get(held.templateId)!;
      const watering = this.bursts.find((effect) => effect.kind === 'water' && now - effect.start < 1600);
      const side = watering && watering.x < actor.transform.x ? -1 : 1;
      this.heldSprite.scale.set(0.62 * side, 0.62);
      this.heldSprite.position.set(actor.transform.x + 28 * side, actor.transform.y - 22 + Math.sin(now / 180) * 2);
      this.heldSprite.rotation = watering ? 0.4 * side : 0.12;
    }
    this.drawEffects(now, world);
  }

  private createObject(object: WorldObject): ObjectView {
    const key = object.templateId === 'plant.basic' ? `plant.basic:${object.state.stage ?? 'seed'}` : object.templateId;
    const sprite = new Sprite(this.textures.get(key));
    sprite.anchor.set(0.5, 1);
    const container = new Container();
    const shadow = new Graphics().ellipse(0, -3, Math.max(16, sprite.width * 0.34), 7).fill({ color: 0x315844, alpha: 0.13 });
    const ring = new Graphics().ellipse(0, -1, Math.max(24, sprite.width * 0.5), 11).stroke({ width: 3, color: 0xfff7cf });
    const label = new Text({ text: '', style: { fontFamily: 'Microsoft YaHei, sans-serif', fontSize: 13, fontWeight: '600', fill: 0x294b40, stroke: { color: 0xffffff, width: 5, join: 'round' } } });
    label.anchor.set(0.5, 1);
    label.eventMode = 'none';
    container.addChild(shadow, ring, sprite, label);
    const width = Math.max(sprite.width, 50);
    container.hitArea = new Rectangle(-width / 2 - 6, -Math.max(sprite.height, 54), width + 12, Math.max(sprite.height, 54) + 12);
    if (object.templateId === 'pond') container.hitArea = new Ellipse(960 - object.transform.x, 445 - object.transform.y, 143, 97);
    if (object.templateId === 'stream') container.hitArea = new Polygon([
      748, 166, 815, 178, 798, 262, 823, 310, 806, 368, 751, 433, 755, 483, 806, 554,
      793, 621, 717, 706, 651, 706, 719, 618, 729, 572, 687, 496, 687, 430, 735, 361, 755, 314, 724, 252,
    ].map((value, i) => value - (i % 2 === 0 ? object.transform.x : object.transform.y)));
    container.eventMode = 'static';
    container.cursor = 'pointer';
    container.on('pointerover', () => { this.hovered = object.id; });
    container.on('pointerout', () => { if (this.hovered === object.id) this.hovered = undefined; });
    container.on('pointertap', (event) => {
      event.stopPropagation();
      this.host.dispatchEvent(new CustomEvent('world-object-click', { detail: object.id }));
    });
    this.actors.addChild(container);
    const view = { container, sprite, shadow, ring, label, key };
    this.views.set(object.id, view);
    return view;
  }

  aim(x: number, y: number) { this.destination = { x, y, start: performance.now() }; }

  celebrate(object: WorldObject | undefined, kind: Effect['kind'], actor?: WorldObject) {
    if (object) this.bursts.push({ ...object.transform, fromX: actor ? actor.transform.x + (object.transform.x < actor.transform.x ? -42 : 42) : undefined, fromY: actor ? actor.transform.y - 44 : undefined, kind, start: performance.now() });
  }

  private drawEffects(now: number, world: WorldState) {
    this.marker.clear();
    if (this.destination) {
      const age = (now - this.destination.start) / 900;
      if (age > 1) this.destination = undefined;
      else this.marker.ellipse(this.destination.x, this.destination.y, 10 + age * 22, 5 + age * 8).stroke({ width: 2.5, color: 0xffffff, alpha: 1 - age });
    }
    this.effects.clear();
    this.bursts = this.bursts.filter((effect) => now - effect.start < 1800);
    for (const effect of this.bursts) {
      const age = (now - effect.start) / 1800;
      for (let i = 0; i < 16; i++) {
        if (effect.kind === 'water') {
          const t = (age * 3 + i / 16) % 1;
          const fromX = effect.fromX ?? effect.x + 36;
          const fromY = effect.fromY ?? effect.y - 40;
          const x = fromX + (effect.x - fromX) * t + Math.sin(i * 7) * 4;
          const y = fromY + (effect.y + 25 - fromY) * t + t * t * 10;
          this.effects.ellipse(x, y, 2.5, 4.5).fill({ color: 0x78d2ec, alpha: 1 - age * 0.7 });
        } else {
          const angle = i * Math.PI * 2 / 16;
          const r = 12 + age * 60;
          const x = effect.x + Math.cos(angle) * r;
          const y = effect.y - 30 + Math.sin(angle) * r * 0.7 - age * 35;
          const color = [0xffd26d, 0xfff3c9, 0xf39a96, 0x88bf81][i % 4];
          this.effects.star(x, y, 4, 4 * (1 - age), 1.6).fill({ color, alpha: 1 - age });
        }
      }
    }
    this.ambient.clear();
    for (let i = 0; i < 9; i++) {
      const x = (i * 157 + now / 90) % 1200;
      const y = 250 + Math.sin(now / 1400 + i * 3) * 80 + (i % 3) * 90;
      this.ambient.ellipse(x, y, 2.3, 1.2).fill({ color: 0xfff6c1, alpha: 0.55 });
    }
    if (world.environment.weather === 'rain') {
      for (let i = 0; i < 65; i++) {
        const x = (i * 113 + now / 45) % 1200;
        const y = (i * 79 + now / 5) % 720;
        this.ambient.moveTo(x, y).lineTo(x - 3, y + 10).stroke({ color: 0xf0fbff, width: 1.4, alpha: 0.4 });
      }
    }
  }
}

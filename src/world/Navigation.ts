import PF from 'pathfinding';
import type { WorldState } from './WorldState';

export interface Point { x: number; y: number }

const MIN_X = 50, MAX_X = 1150, MIN_Y = 190, MAX_Y = 655;
const CELL = 16, PADDING = 12;
const WIDTH = Math.floor((MAX_X - MIN_X) / CELL) + 1;
const HEIGHT = Math.floor((MAX_Y - MIN_Y) / CELL) + 1;
const ANGLE = Math.PI / 15;
const COS = Math.cos(ANGLE), SIN = Math.sin(ANGLE);
const finite = (p: Point) => Number.isFinite(p.x) && Number.isFinite(p.y);
const distance = (a: Point, b: Point) => Math.hypot(a.x - b.x, a.y - b.y);
const clamp = (p: Point): Point => ({ x: Math.max(MIN_X, Math.min(MAX_X, p.x)), y: Math.max(MIN_Y, Math.min(MAX_Y, p.y)) });
type Walkable = (p: Point) => boolean;

function rect(p: Point, left: number, top: number, right: number, bottom: number): boolean {
  return p.x >= left - PADDING && p.x <= right + PADDING && p.y >= top - PADDING && p.y <= bottom + PADDING;
}

function ellipse(p: Point, x: number, y: number, rx: number, ry: number): boolean {
  return ((p.x - x) / (rx + PADDING)) ** 2 + ((p.y - y) / (ry + PADDING)) ** 2 <= 1;
}

function onBridge(p: Point): boolean {
  const x = (p.x - 761) * COS + (p.y - 351) * SIN;
  const y = -(p.x - 761) * SIN + (p.y - 351) * COS;
  // SceneArt's deck is -77..74 by -10..9; keep feet inside its edges.
  return x >= -76 && x <= 73 && y >= -8 && y <= 7;
}

// Sample SceneArt's cubic and reflected S control points once, not on each query.
const STREAM: Point[] = [];
for (const [a, b, c, d] of [
  [{ x: 781, y: 174 }, { x: 719, y: 261 }, { x: 827, y: 305 }, { x: 770, y: 377 }],
  [{ x: 770, y: 377 }, { x: 713, y: 449 }, { x: 702, y: 473 }, { x: 758, y: 555 }],
  [{ x: 758, y: 555 }, { x: 814, y: 637 }, { x: 721, y: 667 }, { x: 650, y: 746 }],
]) {
  for (let i = 0; i <= 80; i++) {
    const t = i / 80, s = 1 - t;
    STREAM.push({ x: s ** 3 * a.x + 3 * s * s * t * b.x + 3 * s * t * t * c.x + t ** 3 * d.x, y: s ** 3 * a.y + 3 * s * s * t * b.y + 3 * s * t * t * c.y + t ** 3 * d.y });
  }
}

function inStream(p: Point): boolean {
  // The water stroke has radius 34. One extra pixel covers curve sampling error.
  const radius = 34 + PADDING + 1;
  return STREAM.some(q => Math.abs(q.y - p.y) <= radius && distance(p, q) <= radius);
}

const PARK_TREES = [[36, 250, 1.1], [184, 184, .7], [420, 214, .9], [616, 183, .7], [827, 223, 1.1], [1089, 253, 1.25], [1220, 307, 1.2]];
const FOREST_PINES = [[32, 225, 1.3], [178, 179, 1.05], [333, 168, .85], [487, 139, .7], [664, 160, .82], [835, 177, 1.05], [1030, 199, 1.2], [1197, 263, 1.45]];
const FOREST_TREES = [[75, 388, 1.8], [1117, 373, 1.7], [238, 228, 1.05], [972, 237, 1.12]];
const FOREST_BACKGROUND_TRUNKS = [[39, 217, 20], [197, 193, 23], [359, 172, 20], [529, 159, 18], [702, 176, 22], [900, 183, 20], [1117, 236, 30]];

function geometry(world: WorldState): Walkable {
  const bases = new Map<string, { x: number; y: number; rx: number; ry: number }>();
  for (const o of Object.values(world.objects)) {
    if (o.lifecycle !== 'active' || o.location.type !== 'scene' || o.location.sceneId !== world.activeSceneId || !finite(o.transform)) continue;
    const tree = o.templateId === 'tree';
    if (!tree && o.templateId !== 'flower_pot' && o.templateId !== 'plant.basic') continue;
    const x = o.transform.x, y = o.transform.y + (o.templateId === 'plant.basic' ? 48 : 0);
    bases.set(`${tree ? 'tree' : 'pot'}:${x}:${y}`, { x, y, rx: 27, ry: tree ? 16 : 14 });
  }
  return p => {
    if (!finite(p) || p.x < MIN_X || p.x > MAX_X || p.y < MIN_Y || p.y > MAX_Y) return false;
    if (world.activeSceneId === 'home') {
      if (rect(p, 100, 190, 395, 330) || rect(p, 860, 190, 1115, 330) || rect(p, 70, 530, 280, 650) || rect(p, 1040, 425, 1160, 490)) return false;
    } else if (world.activeSceneId === 'park') {
      if (ellipse(p, 960, 445, 155, 100) || rect(p, 114, 252, 325, 294) || rect(p, 302, 258, 413, 291)) return false;
      if (PARK_TREES.some(([x, y, s]) => ellipse(p, x, y, 13 * s, 9 * s))) return false;
    } else {
      if (inStream(p) && !onBridge(p)) return false;
      if (FOREST_TREES.some(([x, y, s]) => ellipse(p, x, y, 13 * s, 9 * s)) || FOREST_PINES.some(([x, y, s]) => ellipse(p, x, y, 8 * s, 6 * s))) return false;
      if (FOREST_BACKGROUND_TRUNKS.some(([x, y, rx]) => ellipse(p, x, y, rx, 7))) return false;
      if (rect(p, 15, 345, 85, 375) || rect(p, 1170, 365, 1225, 395) || ellipse(p, 149, 552, 75, 27)) return false;
    }
    for (const base of bases.values()) if (ellipse(p, base.x, base.y, base.rx, base.ry)) return false;
    return true;
  };
}

function segment(safe: Walkable, from: Point, to: Point): boolean {
  if (!safe(from) || !safe(to)) return false;
  const steps = Math.ceil(distance(from, to));
  for (let i = 1; i < steps; i++) {
    if (!safe({ x: from.x + (to.x - from.x) * i / steps, y: from.y + (to.y - from.y) * i / steps })) return false;
  }
  return true;
}

export function isWalkable(world: WorldState, point: Point): boolean {
  return geometry(world)(point);
}

export function segmentWalkable(world: WorldState, from: Point, to: Point): boolean {
  return segment(geometry(world), from, to);
}

function gridPoint(world: WorldState, x: number, y: number): Point {
  const point = { x: MIN_X + x * CELL, y: MIN_Y + y * CELL };
  // Align this row to the narrow rotated deck. All edges still check real geometry.
  if (world.activeSceneId === 'forest' && y === 10 && point.x >= 658 && point.x <= 850) point.y = 350.5 + (point.x - 761) * Math.tan(ANGLE);
  return point;
}

function buildGrid(world: WorldState, safe: Walkable) {
  const grid = new PF.Grid(WIDTH, HEIGHT);
  const points: Point[][] = [];
  const nodes: PF.Node[] = [];
  for (let y = 0; y < HEIGHT; y++) {
    points[y] = [];
    for (let x = 0; x < WIDTH; x++) {
      const p = gridPoint(world, x, y);
      points[y][x] = p;
      grid.setWalkableAt(x, y, safe(p));
      if (grid.isWalkableAt(x, y)) nodes.push(grid.getNodeAt(x, y));
    }
  }
  const point = (node: PF.Node) => points[node.y][node.x];
  const original = grid.getNeighbors.bind(grid);
  const edgeSafety = new Map<string, boolean>();
  grid.getNeighbors = (node, diagonal) => original(node, diagonal).filter(next => {
    const a = node.y * WIDTH + node.x, b = next.y * WIDTH + next.x;
    const key = a < b ? `${a}:${b}` : `${b}:${a}`;
    let valid = edgeSafety.get(key);
    if (valid === undefined) { valid = segment(safe, point(node), point(next)); edgeSafety.set(key, valid); }
    return valid;
  });
  return { grid, nodes, point };
}

/** For old-save repair only: this does not promise reachability from a given actor. */
export function nearestWalkable(world: WorldState, target: Point): Point | undefined {
  if (!finite(target)) return undefined;
  const safe = geometry(world);
  if (safe(target)) return { ...target };
  const requested = clamp(target);
  let nearest: Point | undefined, best = Infinity;
  for (let y = 0; y < HEIGHT; y++) for (let x = 0; x < WIDTH; x++) {
    const p = gridPoint(world, x, y), d = distance(p, requested);
    if (d < best && safe(p)) { best = d; nearest = p; }
  }
  return nearest;
}

/** Build only on a new movement request. Never repair a blocked start implicitly. */
export function findRoute(world: WorldState, from: Point, to: Point): Point[] | undefined {
  if (!finite(from) || !finite(to)) return undefined;
  const safe = geometry(world);
  if (!safe(from)) return undefined;
  if (distance(from, to) === 0) return [];
  if (segment(safe, from, to)) return [{ ...to }];
  const { grid, nodes, point } = buildGrid(world, safe);
  nodes.sort((a, b) => distance(point(a), from) - distance(point(b), from));
  const start = nodes.find(node => segment(safe, from, point(node)));
  if (!start) return undefined;

  // Flood once per request so projection cannot choose a cell across a solid wall.
  const reachable = [start], visited = new Set([start]);
  for (let i = 0; i < reachable.length; i++) {
    for (const next of grid.getNeighbors(reachable[i], PF.DiagonalMovement.OnlyWhenNoObstacles)) {
      if (!visited.has(next)) { visited.add(next); reachable.push(next); }
    }
  }
  const requested = clamp(to);
  reachable.sort((a, b) => distance(point(a), requested) - distance(point(b), requested));
  const exact = safe(to) ? reachable.find(node => segment(safe, point(node), to)) : undefined;
  const end = exact ?? reachable[0];
  const finder = new PF.AStarFinder({ diagonalMovement: PF.DiagonalMovement.OnlyWhenNoObstacles });
  const path = finder.findPath(start.x, start.y, end.x, end.y, grid);
  if (!path.length) return undefined;
  const raw = [from, ...path.map(([x, y]) => point(grid.getNodeAt(x, y)))];
  if (exact) raw.push({ ...to });
  const route: Point[] = [];
  // Greedy visibility smoothing keeps turns natural and verifies every emitted edge.
  for (let i = 0; i < raw.length - 1;) {
    let next = raw.length - 1;
    while (next > i + 1 && !segment(safe, raw[i], raw[next])) next--;
    if (!segment(safe, raw[i], raw[next])) return undefined;
    if (distance(raw[i], raw[next]) > 0) route.push(raw[next]);
    i = next;
  }
  return route;
}

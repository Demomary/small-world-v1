import type { WorldState } from '../world/WorldState';

const KEY = 'small-world-v1-world';
const DB = 'small-world-v1';
const STORE = 'worlds';

export class Persistence {
  private memory: WorldState | null = null;

  save(world: WorldState) {
    this.memory = structuredClone(world);
    try {
      localStorage.setItem(KEY, JSON.stringify(world));
    } catch {
      // Memory copy remains usable.
    }
    if (!('indexedDB' in window)) return;
    try {
      const request = indexedDB.open(DB, 1);
      request.onupgradeneeded = () => {
        if (!request.result.objectStoreNames.contains(STORE)) request.result.createObjectStore(STORE);
      };
      request.onsuccess = () => {
        try {
          const tx = request.result.transaction(STORE, 'readwrite');
          tx.objectStore(STORE).put(world, 'current');
          tx.oncomplete = () => request.result.close();
          tx.onerror = () => request.result.close();
        } catch {
          request.result.close();
        }
      };
    } catch {
      // IndexedDB is only an additional persistence layer.
    }
  }

  load(): WorldState | null {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) return this.migrate(JSON.parse(raw) as WorldState);
    } catch {
      // Fall through to memory.
    }
    return this.memory ? this.migrate(structuredClone(this.memory)) : null;
  }

  clear() {
    this.memory = null;
    try { localStorage.removeItem(KEY); } catch { /* ignore */ }
    try { indexedDB.deleteDatabase(DB); } catch { /* ignore */ }
  }

  export() {
    return JSON.stringify(this.load() ?? {}, null, 2);
  }

  import(raw: string) {
    const world = this.migrate(JSON.parse(raw) as WorldState);
    this.save(world);
  }

  private migrate(world: WorldState): WorldState {
    const w = world as WorldState & Partial<WorldState>;
    if (!w.version || w.version < 2) w.version = 2;
    if (!w.flags) w.flags = {};
    if (!w.environment) w.environment = { weather: 'sunny' };
    if (!w.objects) w.objects = {};
    if (!w.knowledgeProgress) w.knowledgeProgress = {};
    if (!w.discoveries) w.discoveries = [];
    if (!w.questions) w.questions = [];
    if (!w.eventLog) w.eventLog = [];
    if (!w.time) w.time = { hour: new Date().getHours(), day: 1 };
    if (!w.lastActiveTime) w.lastActiveTime = Date.now();
    if (!w.updatedAt) w.updatedAt = Date.now();
    return w;
  }
}

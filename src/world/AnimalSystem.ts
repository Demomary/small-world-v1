import type { EventBus } from '../core/EventBus';
import type { WorldState } from './WorldState';

interface AnimalMotion { vx?: number; vy?: number; homeX?: number; homeY?: number; pauseUntil?: number; }

/** Lightweight, deterministic animal motion. No per-animal AI or physics engine. */
export function updateAnimals(world: WorldState, dt: number, bus: EventBus) {
  const now = Date.now();
  for (const animal of Object.values(world.objects)) {
    if (animal.lifecycle !== 'active' || !animal.tags.includes('animal')) continue;
    if (animal.location.type !== 'scene' || animal.location.sceneId !== world.activeSceneId) continue;
    const s = animal.state as AnimalMotion;
    if (s.pauseUntil && now < s.pauseUntil) continue;
    if (s.vx === undefined) s.vx = (Math.random() > 0.5 ? 1 : -1) * (10 + Math.random() * 18);
    if (s.vy === undefined) s.vy = (Math.random() - 0.5) * 10;
    animal.transform.x += s.vx * dt;
    animal.transform.y += (s.vy ?? 0) * dt;
    const minX = 90, maxX = 1080, minY = 150, maxY = 590;
    if (animal.transform.x < minX || animal.transform.x > maxX) {
      animal.transform.x = Math.max(minX, Math.min(maxX, animal.transform.x));
      s.vx = -(s.vx ?? 10);
    }
    if (animal.transform.y < minY || animal.transform.y > maxY) {
      animal.transform.y = Math.max(minY, Math.min(maxY, animal.transform.y));
      s.vy = -(s.vy ?? 5);
    }
    if (Math.random() < dt * 0.12) {
      s.pauseUntil = now + 500 + Math.random() * 1800;
      bus.emit('animal.behavior.changed', { animalId: animal.id, behavior: 'idle' });
    }
  }
}

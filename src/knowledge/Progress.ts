import type { WorldState } from '../world/WorldState';

export interface KnowledgeSignal { knowledgeId: string; signal: 'observed'|'attempted'|'understood'|'recalled'|'transferred'; strength: number; timestamp: number; }

export function recordKnowledgeSignal(world: WorldState, signal: KnowledgeSignal) {
  const key = signal.knowledgeId;
  const current = Number(world.knowledgeProgress[key] ?? 0);
  world.knowledgeProgress[key] = Math.min(10, current + Math.max(0, Math.min(1, signal.strength)));
}

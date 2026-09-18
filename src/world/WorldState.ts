import type { WorldObject } from './WorldObject';

export interface QuestionRecord {
  id: string;
  text: string;
  knowledgeId: string;
  timestamp: number;
  sceneId?: string;
  focusObjectId?: string;
}

export interface WorldEventRecord {
  id: string;
  type: string;
  timestamp: number;
  sceneId?: string;
  targetId?: string;
}

export interface WorldState {
  version: number;
  childId: string;
  activeSceneId: 'home' | 'park' | 'forest';
  time: { hour: number; day: number };
  environment: { weather: 'sunny' | 'rain' };
  objects: Record<string, WorldObject>;
  flags: Record<string, boolean>;
  knowledgeProgress: Record<string, number>;
  discoveries: string[];
  questions: QuestionRecord[];
  eventLog: WorldEventRecord[];
  lastActiveTime: number;
  updatedAt: number;
}

export const initialWorld = (childId = 'child_001'): WorldState => ({
  version: 2,
  childId,
  activeSceneId: 'home',
  time: { hour: new Date().getHours(), day: 1 },
  environment: { weather: 'sunny' },
  objects: {},
  flags: {},
  knowledgeProgress: {},
  discoveries: [],
  questions: [],
  eventLog: [],
  lastActiveTime: Date.now(),
  updatedAt: Date.now(),
});

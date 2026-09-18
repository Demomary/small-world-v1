export type ActionType='MOVE'|'PICK'|'DROP'|'PLACE'|'PLANT'|'WATER'|'REFILL'|'INSPECT'|'ASK'|'TRAVEL'|'START_GAME'|'START_EXPERIMENT';
export type ActionSource='child'|'ui'|'ai'|'npc'|'world'|'system';
export interface Action{ id:string; type:ActionType; source:ActionSource; actorId?:string; targetId?:string; sceneId?:string; payload?:Record<string,unknown>; timestamp:number; }

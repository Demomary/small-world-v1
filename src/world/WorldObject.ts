export type Lifecycle='active'|'consumed'|'destroyed';
export type Location={type:'scene';sceneId:string}|{type:'carried';actorId:string;slot?:'hand'}|{type:'container';containerId:string}|{type:'inventory';ownerId:string};
export interface Transform{x:number;y:number}
export interface WorldObject{id:string;templateId:string;tags:string[];lifecycle:Lifecycle;location:Location;transform:Transform;state:Record<string,unknown>;capabilities:Record<string,boolean>}

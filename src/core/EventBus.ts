export type Handler<T=unknown>=(payload:T)=>void;
export class EventBus{private map=new Map<string,Set<Handler>>();on<T>(e:string,h:Handler<T>){if(!this.map.has(e))this.map.set(e,new Set());this.map.get(e)!.add(h as Handler);return()=>this.map.get(e)?.delete(h as Handler)}emit<T>(e:string,p:T){this.map.get(e)?.forEach(h=>h(p))}}

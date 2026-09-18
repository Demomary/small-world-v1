import type {WorldState} from '../world/WorldState';
export interface Opportunity{id:string;title:string;sceneId:string;targetId?:string;kind:'observe'|'find'|'experiment'|'game'|'travel';knowledgeId?:string;done?:boolean}
export function opportunities(world:WorldState):Opportunity[]{
 const out:Opportunity[]=[];
 if(world.activeSceneId==='home'){
  const plant=Object.values(world.objects).find(o=>o.templateId==='plant.basic'&&o.lifecycle==='active');
  if(plant) out.push({id:'plant-observe',title:'看看植物今天有什么变化',sceneId:'home',targetId:plant.id,kind:'observe',knowledgeId:'plant_growth'});
  out.push({id:'go-park',title:'去公园听听有没有小动物的声音',sceneId:'home',kind:'travel'});
 }
 if(world.activeSceneId==='park'){
  const butterfly=Object.values(world.objects).find(o=>o.templateId==='butterfly');
  out.push({id:'find-butterfly',title:'找找会飞的蝴蝶',sceneId:'park',targetId:butterfly?.id,kind:'find',knowledgeId:'butterfly'});
  out.push({id:'ice-game',title:'玩一玩“冰会怎样”小实验',sceneId:'park',kind:'experiment',knowledgeId:'ice_melting'});
  out.push({id:'go-forest',title:'沿着小路去森林看看',sceneId:'park',kind:'travel'});
 }
 if(world.activeSceneId==='forest'){
  out.push({id:'listen-bird',title:'听一听森林里哪里有鸟',sceneId:'forest',kind:'game',knowledgeId:'bird_flight'});
  out.push({id:'go-home',title:'回家看看植物',sceneId:'forest',kind:'travel'});
 }
 return out;
}

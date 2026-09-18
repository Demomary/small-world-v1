export type SceneId='home'|'park'|'forest';
export interface SceneDef { id:SceneId; name:string; color:number; description:string; }
export const SCENES:SceneDef[]=[
 {id:'home',name:'家',color:0xfff4dc,description:'这是你的小家。花盆里的植物会继续长大。'},
 {id:'park',name:'公园',color:0xbfe8b0,description:'公园里有鸟、蝴蝶、花朵，还有可以玩的球。'},
 {id:'forest',name:'森林',color:0x9ed39b,description:'森林里有小溪、兔子和松鼠，仔细观察它们。'}
];

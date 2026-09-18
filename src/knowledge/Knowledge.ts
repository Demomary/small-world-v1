export interface KnowledgeNode{id:string;title:string;summary:string;tags:string[];related?:string[]}
export const KNOWLEDGE:KnowledgeNode[]=[
{id:'plant_growth',title:'植物为什么会长大？',summary:'植物需要水、光照和合适的环境。种子先发芽，再慢慢长出茎、叶和花。',tags:['植物','生长','水','阳光']},
{id:'bee_pollination',title:'蜜蜂为什么会到花上？',summary:'蜜蜂采集花蜜和花粉，也会帮助花朵完成传粉。',tags:['蜜蜂','花','传粉']},
{id:'bird_flight',title:'鸟为什么能飞？',summary:'鸟的翅膀和身体结构适合飞行，翅膀运动时会产生帮助它飞起来的空气作用力。',tags:['鸟','飞行']},
{id:'butterfly',title:'蝴蝶从哪里来？',summary:'蝴蝶会经历卵、幼虫、蛹和成虫几个阶段，这叫完全变态。',tags:['蝴蝶','昆虫','生长']},
{id:'ice_melting',title:'冰为什么会融化？',summary:'冰吸收周围的热量后，温度达到融点附近就会从固体变成液体。',tags:['冰','温度','融化']},
{id:'water_cycle',title:'水会消失吗？',summary:'水可以蒸发、凝结和降落，它会在自然界中不断循环。',tags:['水','天气','循环']},
{id:'ant',title:'蚂蚁为什么一起行动？',summary:'蚂蚁会通过气味等方式交流，群体中的不同蚂蚁会完成不同任务。',tags:['蚂蚁','动物','群体']},
{id:'gravity',title:'东西为什么会掉下来？',summary:'地球会对附近的物体产生引力，所以松手的东西通常会向地面运动。',tags:['重力','地球']},
{id:'sound',title:'声音从哪里来？',summary:'物体振动会让周围介质产生变化，这些变化传播到耳朵，我们就听到了声音。',tags:['声音','振动']},
{id:'animal_behavior',title:'小动物为什么会到处走？',summary:'动物会寻找食物、水和安全的地方，也会因为天气、时间和周围变化而改变行动。',tags:['动物','行为','环境']},
{id:'animal_classification',title:'小动物有什么不同？',summary:'我们可以按照身体结构、生活环境、吃什么和怎样运动来比较动物。',tags:['动物','分类','观察']},
{id:'sport_ball',title:'球为什么会滚动？',summary:'球受到推动后会改变运动状态；地面摩擦会让它慢慢停下来。',tags:['运动','球','摩擦']},
{id:'traffic_light',title:'红绿灯为什么要变颜色？',summary:'不同颜色给道路上的人和车辆传递不同的通行信息，帮助大家安全通过。',tags:['安全','交通']}
];
export function resolveKnowledge(text:string, focus?:string){
 const q=text.toLowerCase();
 if(focus==='plant.basic'||q.includes('植物')||q.includes('种子')) return KNOWLEDGE.find(x=>x.id==='plant_growth')!;
 if(q.includes('蜜蜂')||q.includes('花')) return KNOWLEDGE.find(x=>x.id==='bee_pollination')!;
 if(q.includes('鸟')||q.includes('飞')) return KNOWLEDGE.find(x=>x.id==='bird_flight')!;
 if(q.includes('蝴蝶')) return KNOWLEDGE.find(x=>x.id==='butterfly')!;
 if(q.includes('冰')||q.includes('融')) return KNOWLEDGE.find(x=>x.id==='ice_melting')!;
 if(q.includes('红灯')||q.includes('绿灯')||q.includes('交通')) return KNOWLEDGE.find(x=>x.id==='traffic_light')!;
 if(q.includes('掉')||q.includes('重力')) return KNOWLEDGE.find(x=>x.id==='gravity')!;
 if(q.includes('声音')||q.includes('听')) return KNOWLEDGE.find(x=>x.id==='sound')!;
 if(q.includes('动物')||q.includes('为什么一直走')||q.includes('怎么走')) return KNOWLEDGE.find(x=>x.id==='animal_behavior')!;
 if(q.includes('球')||q.includes('滚')) return KNOWLEDGE.find(x=>x.id==='sport_ball')!;
 return KNOWLEDGE[0];
}

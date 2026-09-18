import type { EventBus } from '../core/EventBus';
import { AudioEngine } from '../audio/AudioEngine';

export class FeedbackSystem {
  constructor(private bus:EventBus, private audio:AudioEngine, private log:(text:string)=>void){
    bus.on('object.picked',()=>audio.beep(560,.07));
    bus.on('object.dropped',()=>audio.beep(430,.07));
    bus.on('plant.planted',()=>audio.beep(660,.12));
    bus.on('plant.watered',()=>audio.beep(520,.10));
    bus.on('plant.grew',(e:any)=>{audio.beep(760,.15);log(`🌱 植物长大了：${e.stage}`);});
  }
}

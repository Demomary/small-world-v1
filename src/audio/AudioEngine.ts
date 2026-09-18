export class AudioEngine {
 private ctx?:AudioContext;
 private enabled=true;
 setEnabled(v:boolean){this.enabled=v}
 private ensure(){if(!this.enabled)return; if(!this.ctx)this.ctx=new AudioContext()}
 beep(freq=520,duration=.08){if(!this.enabled)return;this.ensure();if(!this.ctx)return;if(this.ctx.state==='suspended')void this.ctx.resume();const o=this.ctx.createOscillator(),g=this.ctx.createGain();o.frequency.value=freq;o.type='sine';g.gain.setValueAtTime(.035,this.ctx.currentTime);g.gain.exponentialRampToValueAtTime(.001,this.ctx.currentTime+duration);o.connect(g).connect(this.ctx.destination);o.start();o.stop(this.ctx.currentTime+duration)}
}

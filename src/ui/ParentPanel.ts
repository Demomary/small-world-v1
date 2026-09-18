import type { Persistence } from '../persistence/Persistence';
import type { WorldState } from '../world/WorldState';

export class ParentPanel {
  private overlay?: HTMLElement;
  constructor(private host: HTMLElement, private persistence: Persistence, private getWorld:()=>WorldState, private onSave:()=>void) {}
  open() {
    if (this.overlay) return;
    const answer=prompt('家长设置验证：8 + 7 = ？');
    if(answer!=='15') return;
    const w=this.getWorld();
    const discoveries=Object.keys(w.knowledgeProgress).length;
    this.overlay=document.createElement('div');
    this.overlay.className='parent-overlay';
    this.overlay.innerHTML=`<div class="parent-card"><div class="parent-title">家长空间</div><div class="parent-note">这里记录探索过程，不把探索变成分数。</div><div class="parent-stats"><div>探索过的知识<br><b>${discoveries}</b></div><div>当前场景<br><b>${this.sceneName(w.activeSceneId)}</b></div><div>世界天数<br><b>${w.time.day}</b></div></div><div class="parent-lines"><div>最近关注：${discoveries?'孩子正在逐渐形成自己的兴趣轨迹。':'还没有足够的探索记录。'}</div><div>建议：陪孩子一起问“为什么”，再去世界里验证。</div></div><div class="parent-actions"><button data-action="export">导出存档</button><button data-action="reset">删除本地世界</button><button data-action="close">返回世界</button></div></div>`;
    this.host.appendChild(this.overlay);
    this.overlay.addEventListener('click',(e)=>{
      const action=(e.target as HTMLElement).dataset.action;
      if(action==='close')this.close();
      if(action==='export')this.exportSave();
      if(action==='reset'&&confirm('确定删除本机保存的《小小世界》进度吗？')){this.persistence.clear();location.reload();}
    });
  }
  close(){this.overlay?.remove();this.overlay=undefined;this.onSave();}
  private sceneName(id:string){return ({home:'家',park:'公园',forest:'森林'} as Record<string,string>)[id]??id;}
  private exportSave(){const blob=new Blob([this.persistence.export()],{type:'application/json'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='small-world-save.json';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);}
}

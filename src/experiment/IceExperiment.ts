import { spriteArt } from '../render/ObjectArt';
import { icon } from '../ui/Icons';

export interface ExperimentResult {title:string;message:string;knowledgeId:string}

let activeExperiment: Promise<ExperimentResult> | undefined;

export async function runIceExperiment():Promise<ExperimentResult>{
  if (activeExperiment) return activeExperiment;
  const dismissed: ExperimentResult = {title:'冰会怎样？',message:'你暂时离开了实验。',knowledgeId:'ice_melting'};
  if (document.querySelector('.game-card')) return dismissed;
  activeExperiment = new Promise((resolve) => {
    const previousFocus = document.activeElement;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let frame: number | undefined;
    let settled = false;
    const ice = spriteArt('ice_experiment');
    const overlay=document.createElement('div');
    overlay.className='modal-overlay';
    overlay.innerHTML=`
      <div class="modal-card game-card" role="dialog" aria-modal="true" aria-labelledby="ice-experiment-title">
        <div class="modal-head"><div><div id="ice-experiment-title" class="modal-title">${icon('experiment')} 冰会怎样？</div><div class="modal-sub">先猜，再看看结果。</div></div><button data-action="close" aria-label="关闭冰融化实验">${icon('close')}</button></div>
        <div class="ice-scene"><div id="ice-cube" style="position:relative" aria-hidden="true"><span data-water style="position:absolute;bottom:8px;left:5px;width:70px;height:17px;border-radius:50%;background:#98d5d7;border:1.8px solid #6ca8b1;box-shadow:inset 0 3px 0 #d5eee0;opacity:0;transform:scale(.3);transition:transform 1s ease,opacity 1s ease"></span><img data-ice src="data:image/svg+xml,${encodeURIComponent(ice.svg)}" alt="" width="${ice.width}" height="${ice.height}" style="position:relative;transform-origin:50% 90%;transform:scale(1);opacity:1;transition:transform 1s ease-in,opacity 1s ease-in"></div><div id="ice-status" role="status">一块冰放在温暖的地方。</div></div>
        <div class="question-prompt">哪一个会发生？</div>
        <div class="answer-grid"><button data-answer="melt">冰会慢慢变小</button><button data-answer="grow">冰会越来越大</button></div>
        <div id="ice-result" class="answer-box" role="status">选择你的猜想。</div>
      </div>`;
    document.body.appendChild(overlay);
    let done=false;
    const finish = (result: ExperimentResult) => {
      if (settled) return;
      settled = true;
      if (timer !== undefined) clearTimeout(timer);
      if (frame !== undefined) cancelAnimationFrame(frame);
      document.removeEventListener('keydown', onKeyDown);
      overlay.remove();
      activeExperiment = undefined;
      if (previousFocus instanceof HTMLElement && previousFocus.isConnected) previousFocus.focus();
      resolve(result);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        finish(dismissed);
      }
    };
    document.addEventListener('keydown', onKeyDown);
    overlay.querySelector<HTMLButtonElement>('[data-answer]')?.focus();
    overlay.addEventListener('click',(event)=>{
      const target=event.target instanceof Element ? event.target.closest('button') : null;
      if (!target || settled) return;
      if(target.dataset.action==='close'){finish(dismissed);return;}
      const answer=target.dataset.answer;
      if(!answer||done)return;
      done=true;
      overlay.querySelectorAll<HTMLButtonElement>('[data-answer]').forEach(button => { button.disabled = true; });
      const result=overlay.querySelector('#ice-result');
      const cube=overlay.querySelector<HTMLElement>('[data-ice]');
      const water=overlay.querySelector<HTMLElement>('[data-water]');
      const status=overlay.querySelector('#ice-status');
      if(answer==='melt'){
        if(result)result.textContent='猜对啦！冰会慢慢吸收周围的热量，越来越小，最后变成水。';
      }else if(result)result.textContent='这次猜得不一样。冰吸收热量后会融化成水。';
      if (status) status.textContent='冰正在慢慢变小，融化成水。';
      frame = requestAnimationFrame(() => {
        if (settled) return;
        if (cube) { cube.style.transform='scale(.2, .08)'; cube.style.opacity='0'; }
        if (water) { water.style.transform='scale(1)'; water.style.opacity='1'; }
      });
      timer = setTimeout(()=>finish({title:'冰会怎样？',message:'冰吸收周围的热量后会逐渐融化成水。还可以比较阴凉处和温暖处的变化。',knowledgeId:'ice_melting'}),1200);
    });
  });
  return activeExperiment;
}

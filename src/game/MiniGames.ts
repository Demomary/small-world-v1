import { AudioEngine } from '../audio/AudioEngine';
import { spriteArt } from '../render/ObjectArt';
import { icon } from '../ui/Icons';

export interface GameResult { title: string; message: string; knowledgeId?: string; signal: 'observed'|'attempted'|'understood'; }

let activeListenGame: Promise<GameResult> | undefined;

export async function playListenGame(audio = new AudioEngine()): Promise<GameResult> {
  if (activeListenGame) return activeListenGame;
  const dismissed: GameResult = { title: '听声找小动物', message: '你先离开了游戏。', signal: 'attempted' };
  if (document.querySelector('.game-card')) return dismissed;
  activeListenGame = new Promise((resolve) => {
    const host = document.body;
    const previousFocus = document.activeElement;
    const timers = new Set<ReturnType<typeof setTimeout>>();
    let settled = false;
    let answered = false;
    const animal = (id: string) => `<img src="data:image/svg+xml,${encodeURIComponent(spriteArt(id).svg)}" alt="" width="50" height="50">`;
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `
      <div class="modal-card game-card" role="dialog" aria-modal="true" aria-labelledby="listen-game-title">
        <div class="modal-head"><div><div id="listen-game-title" class="modal-title">${icon('listen')} 听声找小动物</div><div class="modal-sub">听听声音，猜猜是谁在附近。</div></div><button data-action="close" aria-label="关闭听声找小动物">${icon('close')}</button></div>
        <div class="sound-stage"><div id="sound-emoji" aria-hidden="true">${icon('listen')}</div><div id="sound-text">点击“播放声音”，再选择你觉得是谁。</div></div>
        <div class="game-actions"><button id="play-sound">${icon('sound')} 播放声音</button></div>
        <div class="animal-choices"><button data-choice="bird">${animal('sparrow')}小鸟</button><button data-choice="rabbit">${animal('rabbit')}兔子</button><button data-choice="butterfly">${animal('butterfly')}蝴蝶</button></div>
        <div id="game-result" class="answer-box" role="status">准备好了吗？</div>
      </div>`;
    host.appendChild(overlay);
    let played = false;
    const finish = (result: GameResult) => {
      if (settled) return;
      settled = true;
      for (const timer of timers) clearTimeout(timer);
      timers.clear();
      document.removeEventListener('keydown', onKeyDown);
      overlay.remove();
      activeListenGame = undefined;
      if (previousFocus instanceof HTMLElement && previousFocus.isConnected) previousFocus.focus();
      resolve(result);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        finish(dismissed);
      }
    };
    const later = (callback: () => void, delay: number) => {
      const timer = setTimeout(() => {
        timers.delete(timer);
        if (!settled) callback();
      }, delay);
      timers.add(timer);
    };
    document.addEventListener('keydown', onKeyDown);
    overlay.querySelector<HTMLButtonElement>('#play-sound')?.focus();
    overlay.addEventListener('click', (event) => {
      const target = event.target instanceof Element ? event.target.closest('button') : null;
      if (!target || settled) return;
      if (target.dataset.action === 'close') { finish(dismissed); return; }
      if (answered) return;
      if (target.id === 'play-sound') {
        played = true;
        audio.beep(820, .18);
        later(() => audio.beep(620, .12), 220);
        const text = overlay.querySelector('#sound-text');
        if (text) text.textContent = '听起来像“啾啾”……是谁？';
      }
      const choice = target.dataset.choice;
      if (choice) {
        const result = overlay.querySelector('#game-result');
        if (!played) { if (result) result.textContent = '先播放一次声音，再来猜猜看。'; return; }
        if (choice === 'bird') {
          answered = true;
          if (result) result.textContent = '猜对了！你听到的是小鸟的声音。';
          const illustration = overlay.querySelector('#sound-emoji');
          if (illustration) illustration.innerHTML = animal('sparrow');
          overlay.querySelectorAll<HTMLButtonElement>('[data-choice], #play-sound').forEach(button => { button.disabled = true; });
          later(() => finish({ title: '听声音找小动物', message: '你听到了“啾啾”的声音，找到了附近的小鸟。', knowledgeId: 'bird_flight', signal: 'understood' }), 500);
        } else if (result) {
          result.textContent = '再听一次，声音像不像小鸟在叫？';
        }
      }
    });
  });
  return activeListenGame;
}

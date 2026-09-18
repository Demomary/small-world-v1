import { resolveKnowledge } from '../knowledge/Knowledge';
import { recordKnowledgeSignal } from '../knowledge/Progress';
import type { WorldState } from '../world/WorldState';
import { icon } from './Icons';

export class QuestionPanel {
  private overlay?: HTMLElement;
  constructor(
    private host: HTMLElement,
    private getWorld: () => WorldState,
    private getFocus: () => string | undefined,
    private save: () => void,
    private setLog: (text: string) => void,
  ) {}

  open(initialQuestion?: string) {
    if (this.overlay) return;
    const world = this.getWorld();
    const focus = this.getFocus();
    const focusName = focus ? this.nameOf(world.objects[focus]?.templateId) : '眼前的东西';
    const suggestions = this.suggestions(focusName);

    this.overlay = document.createElement('div');
    this.overlay.className = 'modal-overlay';
    this.overlay.innerHTML = `
      <div class="modal-card question-card" role="dialog" aria-modal="true" aria-labelledby="question-title">
        <div class="modal-head"><div><div class="modal-sub">好奇心的小窗口</div><div id="question-title" class="modal-title">问一问</div></div><button data-action="close" class="icon-button" aria-label="关闭问答">${icon('close')}</button></div>
        <div class="chips">${suggestions.map((x) => `<button class="chip" data-question="${this.escape(x)}">${this.escape(x)}</button>`).join('')}</div>
        <div class="question-row"><input id="question-input" aria-label="想问的问题" maxlength="80" placeholder="${focusName}有什么秘密？" value="${this.escape(initialQuestion ?? '')}"/><button data-action="ask">问问</button></div>
        <div id="question-answer" class="answer-box" aria-live="polite">我在听，你对什么感到好奇？</div>
      </div>`;
    this.host.appendChild(this.overlay);
    const input = this.overlay.querySelector<HTMLInputElement>('#question-input')!;
    this.overlay.addEventListener('click', (event) => {
      const target = (event.target as Element).closest<HTMLElement>('button');
      if (!target) return;
      const question = target.dataset.question;
      if (question) {
        input.value = question;
        this.answer(question);
      }
      if (target.dataset.action === 'ask') this.answer(input.value.trim());
      if (target.dataset.action === 'close') this.close();
    });
    input.addEventListener('keydown', (event) => { if (event.key === 'Enter' && !event.isComposing) this.answer(input.value.trim()); });
    input.focus();
    if (initialQuestion) this.answer(initialQuestion);
  }

  close() {
    this.overlay?.remove();
    this.overlay = undefined;
    document.querySelector<HTMLButtonElement>('#ask')?.focus();
  }

  private answer(question: string) {
    if (!question) return;
    const world = this.getWorld();
    const focus = this.getFocus();
    const node = resolveKnowledge(question, focus ? world.objects[focus]?.templateId : undefined);
    const timestamp = Date.now();
    recordKnowledgeSignal(world, { knowledgeId: node.id, signal: 'understood', strength: .15, timestamp });
    world.questions.push({
      id: crypto.randomUUID(),
      text: question,
      knowledgeId: node.id,
      timestamp,
      sceneId: world.activeSceneId,
      focusObjectId: focus,
    });
    if (world.questions.length > 50) world.questions.splice(0, world.questions.length - 50);
    const answer = this.overlay?.querySelector('#question-answer');
    if (answer) answer.textContent = `${node.title}\n${node.summary}`;
    this.setLog(`💡 ${node.title}`);
    this.save();
  }

  private suggestions(name: string) {
    const common = ['这是什么？', '为什么？', '接下来可以做什么？'];
    if (name === '小鸟') return [...common, '它为什么会飞？'];
    if (name === '植物') return [...common, '植物为什么会长大？'];
    if (name === '蝴蝶') return [...common, '蝴蝶从哪里来？'];
    return common;
  }

  private nameOf(template?: string) {
    return ({
      plant_basic: '植物',
      'plant.basic': '植物',
      sparrow: '小鸟',
      butterfly: '蝴蝶',
      rabbit: '兔子',
      squirrel: '松鼠',
      seed: '种子',
    } as Record<string, string>)[template ?? ''] ?? '眼前的东西';
  }

  private escape(text: string) {
    return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
}

/** Interface independente do Phaser: feedback desde o HTML inicial. */
const PHRASES = [
  'O churrasco já tá aceso.',
  'O Jetta tá chegando.',
  'Ainda dá tempo de amarelar.',
  'A Alvorada não resolve no diálogo.'
];

export class LoadingView {
  constructor() {
    this.root = document.getElementById('loading');
    this.title = document.getElementById('loading-title');
    this.fill = document.getElementById('loading-fill');
    this.meter = document.getElementById('loading-meter');
    this.percent = document.getElementById('loading-percent');
    this.detail = document.getElementById('loading-detail');
    this.phrase = document.getElementById('loading-phrase');
    this.retry = document.getElementById('loading-retry');
    this.value = 0;
    this.phraseIndex = 0;
    this.phraseInterval = null;
    this.transitionTimer = null;
    this.phraseTimer = null;
    this.onRetry = null;
    this.startPhrases();
  }
  startPhrases() {
    if (this.phraseInterval || !this.root || this.root.hidden) return;
    this.phraseInterval = setInterval(() => {
      this.phrase.classList.add('is-switching');
      clearTimeout(this.phraseTimer);
      this.phraseTimer = setTimeout(() => {
        this.phraseIndex = (this.phraseIndex + 1) % PHRASES.length;
        this.phrase.textContent = PHRASES[this.phraseIndex];
        this.phrase.classList.remove('is-switching');
      }, 180);
    }, 3000);
  }
  clearTimers() {
    clearInterval(this.phraseInterval);
    clearTimeout(this.phraseTimer);
    clearTimeout(this.transitionTimer);
    this.phraseInterval = this.phraseTimer = this.transitionTimer = null;
  }
  beginAttempt(loaded, total) {
    this.root.hidden = false;
    this.root.classList.remove('is-error','is-leaving');
    this.retry.hidden = true;
    this.retry.onclick = null;
    this.title.textContent = 'PREPARANDO A TRETA...';
    this.detail.textContent = 'Carregando os arquivos do jogo...';
    this.value = 0; // Um novo retry é uma nova tentativa; dentro dela nunca retrocede.
    this.update(loaded, total);
    this.startPhrases();
  }
  update(loaded, total) {
    // Mede arquivos necessários concluídos com sucesso, não bytes transferidos.
    const next = total ? Math.floor(100 * loaded / total) : 0;
    this.value = Math.max(this.value, Math.min(99, next));
    this.setPercent(this.value);
  }
  setPercent(value) {
    this.value = value;
    this.fill.style.width = `${value}%`;
    this.percent.textContent = `${value}%`;
    this.meter.setAttribute('aria-valuenow',String(value));
  }
  preparing() {
    this.title.textContent = 'PREPARANDO O JOGO...';
    this.detail.textContent = 'Conferindo as texturas obrigatórias...';
  }
  ready() {
    this.root.classList.remove('is-error');
    this.retry.hidden = true;
    this.title.textContent = 'TÁ TUDO PRONTO PRA CONFUSÃO!';
    this.detail.textContent = 'Tudo pronto!';
    this.setPercent(100);
  }
  error(message, callback) {
    this.root.hidden = false;
    this.root.classList.remove('is-leaving');
    this.root.classList.add('is-error');
    this.title.textContent = 'NÃO FOI POSSÍVEL CARREGAR O JOGO.';
    this.detail.textContent = message || 'Confira sua conexão e tente novamente.';
    this.retry.hidden = false;
    this.retry.onclick = () => {
      if (this.retry.disabled) return;
      this.retry.disabled = true;
      try { callback?.(); }
      finally { this.retry.disabled = false; }
    };
    this.startPhrases();
  }
  /** Fade depois do 100%, e não durante a medição do carregamento. */
  exit() {
    this.clearTimers();
    this.root.classList.add('is-leaving');
    return new Promise(resolve => {
      this.transitionTimer = setTimeout(() => {
        this.root.hidden = true;
        this.retry.onclick = null;
        this.transitionTimer = null;
        resolve();
      }, 305);
    });
  }
}

export const loadingView = new LoadingView();

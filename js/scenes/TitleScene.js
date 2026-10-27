import { configureSceneCamera } from '../config/layout.js';
import { W, H } from '../config/game.js';

/**
 * TitleScene — tela de abertura de ARREDA A MÃO, entre a vinheta da produtora
 * e o menu principal já existente na FightScene.
 *
 * Os cinco PNGs são carregados sem alteração e permanecem em assets/ui/.
 * Apenas posições/alpha dos objetos Phaser são animados.
 */
const TITLE_ASSETS = [
  ['title-background', './assets/ui/fundo_menu.png'],
  ['title-arreda', './assets/ui/logo_arreda.png'],
  ['title-a-mao', './assets/ui/logo_a_mao.png'],
  ['title-challenge', './assets/ui/tem_coragem.png'],
  ['title-touch-start', './assets/ui/toque_para_comecar.png'],
];

// As duas metades do título usam rigorosamente a MESMA escala proporcional.
const LOGO_SCALE = 0.48;
const TITLE_LAYOUT = Object.freeze({
  arredaY: 102,
  maoY: 253,
  challengeY: 405,
  promptY: 491,
  challengeScale: 0.26,
  touchScale: 0.29,
});

const isModifierOrBrowserShortcut = (event) => {
  if (event.ctrlKey || event.altKey || event.metaKey || event.repeat) return true;
  if (/^(Shift|Control|Alt|Meta|AltGraph|OS|Fn|CapsLock|NumLock|ScrollLock)$/.test(event.key)) return true;
  if (/^(Shift|Control|Alt|Meta|OS)(Left|Right)$/.test(event.code || '')) return true;
  // Preserve browser navigation and browser function keys.
  if (event.key === 'Tab' || /^F([1-9]|1[0-9]|2[0-4])$/.test(event.key)) return true;
  return false;
};

export class TitleScene extends Phaser.Scene {
  constructor() { super({ key: 'TitleScene' }); }

  preload() {
    document.body.classList.add('title-active');
    // As cinco texturas são obrigatórias e já foram validadas no BootScene.
    this._loadFailed = false;
  }

  create() {
    configureSceneCamera(this);
    this._ready = false;
    this._transitioning = false;
    this._finished = false;
    this._blinkEvent = null;
    this._onKey = null;
    this._onPointer = null;
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.cleanup, this);

    if (this._loadFailed || TITLE_ASSETS.some(([key]) => !this.textures.exists(key))) {
      // Não bloquear o usuário se faltar um PNG: abrir o menu que já existia.
      const error = document.getElementById('error');
      if (error) error.textContent = 'Não foi possível carregar a tela inicial. Abrindo o menu do jogo.';
      this.finish();
      return;
    }

    this.cameras.main.setBackgroundColor('#000000');
    this.background = this.add.image(W / 2, H / 2, 'title-background')
      .setDisplaySize(W, H).setDepth(0);

    this.arreda = this.add.image(W / 2, -125, 'title-arreda')
      .setScale(LOGO_SCALE).setOrigin(.5).setDepth(10);
    this.mao = this.add.image(W / 2, -215, 'title-a-mao')
      .setScale(LOGO_SCALE).setOrigin(.5).setDepth(11);
    this.challenge = this.add.image(W / 2, TITLE_LAYOUT.challengeY, 'title-challenge')
      .setScale(TITLE_LAYOUT.challengeScale).setOrigin(.5).setDepth(12).setVisible(false);

    // A instrução de teclado é TEXTO, jamais o asset pressione_enter.png.
    // Estilo pixel/arcade sem nova fonte e sem suavizar os PNGs do jogo.
    this.keyboardPrompt = this.add.text(W / 2, TITLE_LAYOUT.promptY, 'APERTE QUALQUER TECLA', {
      fontFamily: '"Courier New", Courier, monospace',
      fontSize: '27px', fontStyle: 'bold', color: '#eaf2ff',
      stroke: '#09102b', strokeThickness: 5, align: 'center',
      shadow: { offsetX: 2, offsetY: 3, color: '#000000', blur: 0, fill: true },
    }).setOrigin(.5).setDepth(12).setVisible(false);

    this.touchPrompt = this.add.image(W / 2, TITLE_LAYOUT.promptY, 'title-touch-start')
      .setScale(TITLE_LAYOUT.touchScale).setOrigin(.5).setDepth(12).setVisible(false);

    const matchCoarse = typeof window.matchMedia === 'function' && window.matchMedia('(pointer: coarse)').matches;
    const touchDevice = !!(matchCoarse || (this.sys.game.device?.input?.touch && navigator.maxTouchPoints > 0));
    this.startPrompt = touchDevice ? this.touchPrompt : this.keyboardPrompt;

    // Filtro de pixels nítidos APENAS nas novas texturas; não tocar no combate.
    for (const [key] of TITLE_ASSETS) this.textures.get(key).setFilter(Phaser.Textures.FilterMode.NEAREST);

    this._onKey = event => {
      if (!this._ready || this._transitioning || isModifierOrBrowserShortcut(event)) return;
      if ([' ', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key)) event.preventDefault();
      this.beginExit();
    };
    this._onPointer = pointer => {
      if (!this._ready || this._transitioning) return;
      // Não avançar por clique secundário.
      if (pointer?.rightButtonDown?.()) return;
      this.beginExit();
    };
    this.input.keyboard?.on('keydown', this._onKey);
    this.input.on('pointerdown', this._onPointer);

    // Revelar SOMENTE o cenário nos primeiros 500 ms.
    this.blackout = this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 1)
      .setDepth(999);
    this.tweens.add({ targets: this.blackout, alpha: 0, duration: 500, ease: 'Linear',
      onComplete: () => {
        this.blackout.destroy();
        this.tweens.add({ targets: this.arreda, y: TITLE_LAYOUT.arredaY,
          duration: 600, ease: 'Cubic.Out', onComplete: () => {
            this.tweens.add({ targets: this.mao, y: TITLE_LAYOUT.maoY,
              duration: 400, ease: 'Cubic.In', onComplete: () => this.showStartPrompt() });
          }});
      }});
  }

  showStartPrompt() {
    if (this._finished || this._transitioning) return;
    this.cameras.main.shake(135, 0.003, true);
    this.challenge.setVisible(true);
    this.startPrompt.setVisible(true);
    this._ready = true;
    this._blinkEvent = this.time.addEvent({ delay: 700, loop: true,
      callback: () => { if (this._ready) this.challenge.setVisible(!this.challenge.visible); } });
  }

  beginExit() {
    if (!this._ready || this._transitioning) return;
    this._transitioning = true;
    this._ready = false;
    this._blinkEvent?.remove(false);
    this._blinkEvent = null;
    this.challenge.setVisible(true);
    this.cameras.main.fadeOut(300, 0, 0, 0);
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => this.finish());
  }

  finish() {
    if (this._finished) return;
    this._finished = true;
    this.cleanup();
    // A FightScene usa introSkipped para bloquear o menu nos primeiros 650 ms.
    // Assim a tecla ou o clique que abriu o menu não escolhe Single Player por acidente.
    this.scene.start('FightScene', { introSkipped: true });
  }

  cleanup() {
    this._ready = false;
    this._blinkEvent?.remove(false);
    this._blinkEvent = null;
    if (this._onKey) this.input.keyboard?.off('keydown', this._onKey);
    if (this._onPointer) this.input.off('pointerdown', this._onPointer);
    if (this._onLoadError) this.load.off('loaderror', this._onLoadError, this);
    this._onKey = this._onPointer = this._onLoadError = null;
    this.tweens.killAll(); // Cena isolada: não altera tweens de FightScene.
    document.body.classList.remove('title-active');
  }
}

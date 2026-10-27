import { ASSET_MANIFEST, loadAssets } from '../assets/manifest.js';
import { loadingView } from '../ui/loadingView.js';

// Estes arquivos pertencem às cenas seguintes. Carregar uma única vez no boot.
export const BOOT_TITLE_ASSETS = [
  ['title-background', './assets/ui/fundo_menu.png'],
  ['title-arreda', './assets/ui/logo_arreda.png'],
  ['title-a-mao', './assets/ui/logo_a_mao.png'],
  ['title-challenge', './assets/ui/tem_coragem.png'],
  ['title-touch-start', './assets/ui/toque_para_comecar.png'],
];
const INTRO_KEY = 'equinox_intro_24';
const INTRO_URL = './assets/ui/jogador_do_equinocio_intro_24.png';
const BOOT_REQUIRED = Object.freeze([
  ...ASSET_MANIFEST.map(([key]) => key),
  ...BOOT_TITLE_ASSETS.map(([key]) => key)
]);

export class BootScene extends Phaser.Scene {
  constructor() { super({key:'BootScene'}); }
  preload() {
    this._failures = new Set();
    this._required = new Set(BOOT_REQUIRED);
    this._success = new Set(BOOT_REQUIRED.filter(key => this.textures.exists(key)));
    this._finished = false;
    loadingView.beginAttempt(this._success.size, BOOT_REQUIRED.length);

    // Phaser fornece eventos por arquivo concluído. Não confundir com progresso em bytes.
    this._fileComplete = (key) => {
      if (!this._required.has(key)) return;
      this._success.add(key);
      loadingView.update(this._success.size, BOOT_REQUIRED.length);
    };
    this._onError = (file) => {
      const key = file?.key || '(desconhecido)';
      if (this._required.has(key)) this._failures.add(key);
      else console.warn('[Arreda a Mão] Asset opcional não carregado:', file?.src || key);
      console.error('[Arreda a Mão] Falha no arquivo:', { key, src: file?.src, type: file?.type });
    };
    this.load.on('filecomplete', this._fileComplete);
    this.load.on('loaderror', this._onError);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.cleanup, this);

    // Não recarrega arquivos que já estão em cache após uma tentativa parcial.
    loadAssets(this);
    for (const [key,url] of BOOT_TITLE_ASSETS) {
      if (!this.textures.exists(key)) this.load.image(key,url);
    }
    if (!this.textures.exists(INTRO_KEY) && !this.registry.get('equinoxOptionalUnavailable')) {
      this.load.spritesheet(INTRO_KEY, INTRO_URL, {frameWidth:600,frameHeight:600,endFrame:23});
    }
  }
  create() {
    loadingView.preparing();
    const missing = BOOT_REQUIRED.filter(key => !this.textures.exists(key));
    if (missing.length || this._failures.size) {
      console.error('[Arreda a Mão] Arquivos obrigatórios ausentes:', missing);
      loadingView.error('Confira sua conexão e tente novamente.', () => this.scene.restart());
      return;
    }
    if (!this.textures.exists(INTRO_KEY)) {
      this.registry.set('equinoxOptionalUnavailable',true);
      console.warn('[Arreda a Mão] Abertura opcional indisponível; seguirá para a tela inicial.');
    }
    // Nenhum estágio arbitrário de porcentagem: 100% só após a conferência final.
    loadingView.ready();
    this._readyTimer = this.time.delayedCall(500, () => {
      if (!this.scene.isActive('BootScene') || this._finished) return;
      this._finished = true;
      loadingView.exit().then(() => {
        if (this.scene.isActive('BootScene')) this.scene.start('IntroScene');
      });
    });
  }
  cleanup() {
    if (this._fileComplete) this.load.off('filecomplete',this._fileComplete);
    if (this._onError) this.load.off('loaderror',this._onError);
    this._readyTimer?.remove(false);
  }
}

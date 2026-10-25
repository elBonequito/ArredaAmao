import { CANVAS_WIDTH, CANVAS_HEIGHT } from './config/game.js';
// Mantemos o Phaser 3.90.0 do projeto original.
const error = document.getElementById('error');
const loading = document.getElementById('loading');
if (!window.Phaser) {
  error.textContent = 'Não foi possível carregar o Phaser 3.90.0. Conecte-se à internet e atualize a página.';
  if (loading) loading.textContent = 'Falha ao carregar Phaser.';
} else {
  Promise.all([
    import('./scenes/IntroScene.js'),
    import('./scenes/TitleScene.js'),
    import('./scenes/FightScene.js')
  ]).then(([{ IntroScene }, { TitleScene }, { FightScene }]) => {
    const game = new Phaser.Game({
      type: Phaser.AUTO,
      width: CANVAS_WIDTH,
      height: CANVAS_HEIGHT,
      parent: 'game',
      backgroundColor: '#000000',
      scene: [IntroScene, TitleScene, FightScene],
      render: { pixelArt: true, antialias: false },
      scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        width: CANVAS_WIDTH,
        height: CANVAS_HEIGHT
      }
    });
    // FIT já observa resize. Este reforço também cobre mudanças de tela cheia
    // em navegadores que disparam fullscreenchange depois do resize.
    document.addEventListener('fullscreenchange', () => game.scale.refresh());
  }).catch(e => {
    console.error('Falha ao iniciar Arreda a Mão:', e);
    error.textContent = 'Falha ao iniciar o jogo: ' + e.message + '. Confira o console e os caminhos relativos.';
    if (loading) { loading.textContent = 'Falha na inicialização'; loading.classList.add('error'); }
  });
}

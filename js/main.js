import { CANVAS_WIDTH, CANVAS_HEIGHT } from './config/game.js';
import { loadingView } from './ui/loadingView.js';

// O HTML já mostra o feedback antes da execução deste módulo ou da CDN Phaser.
async function start() {
  if (!window.Phaser) {
    console.error('[Arreda a Mão] Phaser 3.90.0 indisponível.');
    loadingView.error('A biblioteca do jogo não carregou. Confira sua conexão.', () => location.reload());
    return;
  }
  try {
    const [{BootScene},{IntroScene},{TitleScene},{FightScene}] = await Promise.all([
      import('./scenes/BootScene.js'),
      import('./scenes/IntroScene.js'),
      import('./scenes/TitleScene.js'),
      import('./scenes/FightScene.js')
    ]);
    const game = new Phaser.Game({
      type: Phaser.AUTO,
      width: CANVAS_WIDTH,
      height: CANVAS_HEIGHT,
      parent:'game',
      backgroundColor:'#000000',
      scene:[BootScene,IntroScene,TitleScene,FightScene],
      render:{pixelArt:true,antialias:false},
      scale:{
        mode:Phaser.Scale.FIT,
        autoCenter:Phaser.Scale.CENTER_BOTH,
        width:CANVAS_WIDTH,
        height:CANVAS_HEIGHT
      }
    });
    document.addEventListener('fullscreenchange',()=>game.scale.refresh());
  } catch(error) {
    console.error('[Arreda a Mão] Falha ao iniciar:',error);
    loadingView.error('Não foi possível iniciar o jogo. Confira a conexão e os arquivos.', () => location.reload());
  }
}
start();

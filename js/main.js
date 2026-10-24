import { W, H } from './config/game.js';
// Mantemos a versão e a configuração Phaser 3 do HTML original.
const error=document.getElementById('error');
const loading=document.getElementById('loading');
if(!window.Phaser){
  error.textContent='Não foi possível carregar o Phaser 3.90.0. Conecte-se à internet e atualize a página.';
  if(loading)loading.textContent='Falha ao carregar Phaser.';
}else{
  import('./scenes/FightScene.js').then(({FightScene})=>{
    new Phaser.Game({type:Phaser.AUTO,width:W,height:H,parent:'game',backgroundColor:'#130c1c',scene:[FightScene],render:{pixelArt:true,antialias:false},scale:{mode:Phaser.Scale.FIT,autoCenter:Phaser.Scale.CENTER_HORIZONTALLY}});
  }).catch(e=>{
    console.error('Falha ao iniciar Arreda a Mão:',e);
    error.textContent='Falha ao iniciar o jogo: '+e.message+'. Confira o console do navegador e os caminhos relativos.';
    if(loading){loading.textContent='Falha na inicialização';loading.classList.add('error');}
  });
}

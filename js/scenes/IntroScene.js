import { configureSceneCamera } from '../config/layout.js';
import { W, H } from '../config/game.js';

/**
 * IntroScene — vinheta da produtora JOGADOR DO EQUINÓCIO.
 * A imagem recebida era um logo único de 1254x1254, não uma spritesheet 6x4.
 * Este arquivo exibe 24 quadros DERIVADOS daquele logo por revelação de pixels.
 * Nenhum símbolo, letra ou detalhe foi redesenhado.
 */
const INTRO_KEY='equinox_intro_24';
const INTRO_URL='./assets/ui/jogador_do_equinocio_intro_24.png';
const FRAME_SIDE=600;
const FRAME_DELAYS=Array.from({length:24},(_,i)=>
  i<4?150 : i<12?200 : i<15?(500/3) : i<22?200 :200
);

export class IntroScene extends Phaser.Scene {
  constructor(){super({key:'IntroScene'});}
  // BootScene já carregou a spritesheet opcional. Não baixar novamente.
  preload() {}
  create(){
    configureSceneCamera(this);
    this._done=false;
    this._skipped=false;
    this._timer=null;
    this._introSprite=null;
    this._keyboardHandlers=[];
    document.body.classList.add('intro-active');
    this.events.once(Phaser.Scenes.Events.SHUTDOWN,this.cleanup,this);
    if(!this.textures.exists(INTRO_KEY)){
      this.finish();
      return;
    }

    this.cameras.main.setBackgroundColor('#000000');
    this.add.rectangle(W/2,H/2,W,H,0x000000,1);
    this._introSprite=this.add.sprite(W/2,H/2,INTRO_KEY,0).setOrigin(.5);
    const maxSide=Math.min(W*.79,H*.89,FRAME_SIDE);
    this._introSprite.setScale(maxSide/FRAME_SIDE);
    this._introSprite.texture.setFilter(Phaser.Textures.FilterMode.NEAREST);

    const keyboard=this.input.keyboard;
    if(keyboard){
      for(const key of ['ENTER','SPACE']){
        const name='keydown-'+key;
        const cb=event=>this.skip(event);
        keyboard.on(name,cb);
        this._keyboardHandlers.push({name,cb});
      }
      keyboard.addCapture(['SPACE']);
    }
    this._pointerSkip=()=>this.skip();
    this.input.on('pointerdown',this._pointerSkip);
    this.showFrame(0);
  }
  showFrame(i){
    if(this._done)return;
    this._introSprite.setFrame(i);
    this._timer=this.time.delayedCall(FRAME_DELAYS[i],()=>{
      if(this._done)return;
      if(i<23) this.showFrame(i+1);
      else this._timer=this.time.delayedCall(1000,()=>this.fadeOut());
    });
  }
  fadeOut(){
    if(this._done)return;
    this.tweens.add({targets:this._introSprite,alpha:0,duration:500,ease:'Linear',
      onComplete:()=>this.finish()});
  }
  skip(event){
    if(this._done)return;
    event?.preventDefault?.();
    event?.stopPropagation?.();
    this._skipped=true;
    this.finish();
  }
  finish(){
    if(this._done)return;
    this._done=true;
    // Evita exibir cabeçalho/controles enquanto a nova tela inicial carrega.
    document.body.classList.add('title-active');
    this.cleanup();
    this.scene.start('TitleScene',{introSkipped:this._skipped});
  }
  cleanup(){
    this._timer?.remove(false);
    this._timer=null;
    if(this._introSprite)this.tweens.killTweensOf(this._introSprite);
    for(const {name,cb} of this._keyboardHandlers||[]){this.input.keyboard?.off(name,cb);}
    this._keyboardHandlers=[];
    if(this._pointerSkip)this.input.off('pointerdown',this._pointerSkip);
    this._pointerSkip=null;
    document.body.classList.remove('intro-active');
  }
}

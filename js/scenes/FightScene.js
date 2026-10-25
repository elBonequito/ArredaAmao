import { loadAssets } from "../assets/manifest.js";
import { W, H, FLOOR } from "../config/game.js";
import { CHARACTER_DATA } from "../config/characters.js";
import { EMPTY_COMMAND } from "../controllers/commands.js";
import { menuMethods } from "../ui/menu.js";
import { hudMethods } from "../ui/hud.js";
import { inputMethods } from "../controllers/input.js";
import { movementMethods } from "../combat/movement.js";
import { attacksMethods } from "../combat/attacks.js";
import { specialsMethods } from "../combat/specials.js";
import { visualMethods } from "./visual.js";

export class FightScene extends Phaser.Scene {
 constructor(){super('FightScene')}
 init(data){this._introSkipped=!!data?.introSkipped;}
 preload(){
  this._assetErrors=[];
  const status=document.getElementById('loading');
  this.load.on('progress',progress=>{if(status)status.textContent=`Carregando sprites: ${Math.round(progress*100)}%`;});
  this.load.on('fileloaderror',file=>{
    this._assetErrors.push(file.key);
    const text=`Falha ao carregar: ${file.src || file.key}. Verifique os caminhos e use um servidor HTTP.`;
    if(status){status.textContent=text;status.classList.add('error');}
    document.getElementById('error').textContent=text;
  });
  this.load.once('complete',()=>{
    if(status&&!this._assetErrors.length){status.textContent='';status.style.display='none';}
  });
  loadAssets(this);
 }
 create(){
  if(this._assetErrors && this._assetErrors.length){
    this.add.text(480,270,"Não foi possível carregar todos os sprites. Confira os arquivos e a conexão HTTP.",{fontSize:"21px",color:"#ff8080",align:"center",wordWrap:{width:800}}).setOrigin(.5);
    return;
  }
   // Hit reaction exclusivo do Chila: 12 frames, uma execução a 15 FPS.
   this.anims.create({key:'chila-hit-reaction',
     frames:Array.from({length:12},(_,i)=>({key:'chila_hit_'+i})),
     frameRate:15,repeat:0});

   this.anims.create({key:'junin_jetta_prepare',frames:Array.from({length:5},(_,i)=>({key:'jetta_entry_'+i})),frameRate:10,repeat:0});
   this.anims.create({key:'junin_jetta_enter',frames:Array.from({length:8},(_,i)=>({key:'jetta_entry_'+(5+i)})),frameRate:9,repeat:0});
   this.anims.create({key:'junin_jetta_drive',frames:Array.from({length:4},(_,i)=>({key:'jetta_car_'+i})),frameRate:12,repeat:-1});
   this.anims.create({key:'junin_jetta_impact',frames:Array.from({length:8},(_,i)=>({key:'jetta_impact_'+i})),frameRate:14,repeat:0});
   // Registered as a one-shot jump animation. Visible frames are selected by the
   // fighter's actual vertical velocity and contact state instead of a free-running clock.
   // Junin's three distinct crouch phases. State changes are synchronized with the down key.
   this.anims.create({key:'junin_crouch_down',frames:Array.from({length:6},(_,i)=>({key:'junin_crouch_'+i})),frameRate:15,repeat:0});
   this.anims.create({key:'junin_crouch_idle',frames:[{key:'junin_crouch_6'}],frameRate:1,repeat:-1});
   this.anims.create({key:'junin_crouch_up',frames:Array.from({length:5},(_,i)=>({key:'junin_crouch_'+(7+i)})),frameRate:15,repeat:0});
   this.anims.create({key:'junin_jump',frames:Array.from({length:12},(_,i)=>({key:'junin_jump_'+i})),frameRate:12,repeat:0});
   this.anims.create({key:'junin_punch',frames:Array.from({length:13},(_,i)=>({key:'junin_punch_'+i})),frameRate:54,repeat:0});
   this.anims.create({key:'junin_kick',frames:Array.from({length:12},(_,i)=>({key:'junin_kick_'+i})),frameRate:1000/(370/12),repeat:0});
   // Guard sequences; the control-aware state machine below chooses the phase.
   this.anims.create({key:'junin_defense_enter',frames:[0,1,2,3].map(i=>({key:'junin_defense_'+i})),frameRate:15,repeat:0});
   this.anims.create({key:'junin_defense_hold',frames:[3,5,6,7,8,9].map(i=>({key:'junin_defense_'+i})),frameRate:8,repeat:-1});
   this.anims.create({key:'junin_defense_exit',frames:[10,11,12,13].map(i=>({key:'junin_defense_'+i})),frameRate:14,repeat:0});
   this.anims.create({key:'junin_walk',frames:Array.from({length:12},(_,i)=>({key:'junin_walk_'+i})),frameRate:12,repeat:-1});
   const idleOrder=[0,1,2,3,4,5,6,7,8,9,10,11,10,9,8,7,6,5,4,3,2,1];
   this.anims.create({key:'junin_idle',frames:idleOrder.map(i=>({key:'junin_stance_'+i})),frameRate:1000/90,repeat:-1});

    for(const [group,count,rate,loop] of [
      ['preparacao',9,11,false],['concentracao',6,10,false],
      ['lancamento',6,12,false],['recuperacao',4,10,false],
      ['bola_fogo',8,12,true],['impacto',8,16,false]]){
      this.anims.create({key:'gaucho_'+group,
        frames:Array.from({length:count},(_,i)=>({key:'gaucho_'+group+'_'+i})),
        frameRate:rate,repeat:loop?-1:0});
    }
    this.createChilaStance();this.drawStage();
    this.keys=this.input.keyboard.addKeys('A,D,W,S,F,G,H,Q,K,L,O,P,LEFT,RIGHT,UP,DOWN,ENTER,SPACE,ESC,ESCAPE,BACKSPACE');
    this.input.keyboard.addCapture(['UP','DOWN','LEFT','RIGHT','SPACE']);
    this.p=[];this.jetta=null;this.hitEffects=new Set();
    this.gauchoShots=[];this.gauchoImpacts=[];
    this.round=1;this.wins=[0,0];this.timer=75;this.state='menu';
    this.mode='local';this.difficulty='medio';this.selection={p1:null,p2:null};
    this.selectStep='p1';this.menuIndex=0;this.menuButtons=[];this.menuUI=[];
    this.uiState='menu';this.menuLockedUntil=this.time.now+(this._introSkipped?650:0);this.actionLockUntil=0;this.pendingTimers=[];
    this.hud=null;this.announcement=null;
    this.input.keyboard.on('keydown',this.handleMenuKey,this);
    this.showMainMenu();
   }

 // Phaser-native arcade UI. Pointer + keyboard share the same actions.
 createChilaStance(){ /* Frames originais extraídos da arte aprovada. */ }
 makeFighter(characterId,x,controller,dir,slot){
    const char=CHARACTER_DATA[characterId];
    const f={characterId,name:char.name,controller,slot,x,y:FLOOR,vy:0,skin:char.skin,cloth:char.cloth,dir,
      hp:100,attack:null,attackUntil:0,nextAttack:0,stunUntil:0,block:false,crouch:false,
      guard:0,animClock:0,visualX:x,visualY:FLOOR,visualAngle:0,visualScaleX:1,visualScaleY:1,
      previousX:x,landSquash:0,moveUntil:0,moveSpeed:0,specialCooldown:0,
      chilaHitStart:0,chilaHitUntil:0,chilaHitAnimationStarted:false,
      command:EMPTY_COMMAND(),brain:null};
    f.g=this.add.graphics().setDepth(5);
    f.sprite=this.add.sprite(x,FLOOR,char.preview)
      .setOrigin(.5,1).setDisplaySize(characterId==='junin'?174:153,characterId==='junin'?218:215).setDepth(6);
    if(controller==='cpu')f.brain={nextDecision:0,command:EMPTY_COMMAND(),seenAttack:null,observedAt:0,
      guardUntil:0,crouchUntil:0,guardDecision:false};
    return f;
 }
 update(time,delta){
   if(this.uiState || !this.p.length)return; // Menu time, physics and CPU all frozen.
   const dt=Math.min(delta/1000,.04);
   if(this.state==='fight'){
     this.timer=Math.max(0,this.timer-dt);this.timeText.setText(Math.ceil(this.timer));
     this.p.forEach((f,i)=>{if(f.controller==='cpu')this.updateCPU(f,time)});
     this.p.forEach((f,i)=>this.move(f,i,time,dt));
     this.updateJetta(time,dt);this.updateGaucho(time,dt);this.resolveDistance();
     this.p.forEach((f,i)=>this.checkHit(f,this.p[1-i],time));
     this.updateGauchoProjectiles(time,dt);
     if(this.p.some(f=>f.hp<=0)||this.timer<=0)this.finishRound();
   }
   this.p.forEach((f,i)=>this.paintFighter(f,time,dt));this.paintHud();
 }

 // Unified command layer. Held inputs and edge-triggered actions are separate.
}

// Migração incremental: mantém a cena única e a mesma API de métodos.
Object.assign(FightScene.prototype, menuMethods, hudMethods, inputMethods, movementMethods, attacksMethods, specialsMethods, visualMethods);

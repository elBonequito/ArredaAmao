import { W, H, FLOOR } from "../config/game.js";
import { CHARACTER_DATA } from "../config/characters.js";
import { CHILA_PUNCH_HIT } from "../characters/chila.js";
import { EMPTY_COMMAND } from "../controllers/commands.js";

// Métodos originais da v5.0 agrupados por responsabilidade, sem alterar o corpo da lógica.
export const attacksMethods = {
 attack(f,type,t){if(f.gauchoStage)return;f.attack={type,hit:false};f.attackUntil=t+(type==='punch'?240:370);f.nextAttack=t+(type==='punch'?380:530)}
 // Único acionamento de especial, determinado EXCLUSIVAMENTE pelo characterId.
 // A camada de controle humana/CPU e os cooldowns existentes são preservados.
,
  resolveDistance(){if(this.jetta)return;let [a,b]=this.p;if(Math.abs(a.x-b.x)<70){let mid=(a.x+b.x)/2;a.x=mid+(a.x<=b.x?-35:35);b.x=mid+(b.x>=a.x?35:-35)}}
,
 checkHit(a,b,t){if(!a.attack||a.attack.hit||a.attack.type==='jetta'||a.attack.type==='gaucho')return;
 if(b.jettaActive&&this.jetta&&['enter','drive','coast','exit','leave'].includes(this.jetta.phase))return;
 // CHILA: only activate the existing hitbox when the replacement sprites show impact.
 // The duration and damage of the attack are intentionally unchanged.
 if(a.characterId==='chila'&&(a.attack.type==='punch'||a.attack.type==='kick')){
   const duration=a.attack.type==='punch'?240:370;
   const progress=Phaser.Math.Clamp(1-(a.attackUntil-t)/duration,0,.99999);
   const spriteFrame=Math.floor(progress*12);
   if(spriteFrame<5||spriteFrame>7)return;
 }
 // JUNIN PUNCH: connect only when the sprite fist is fully extended
 // (poses 05–09); never deal damage during preparation or recovery.
 if(a.characterId==='junin'&&a.attack.type==='punch'){
   const punchProgress=Phaser.Math.Clamp(1-(a.attackUntil-t)/240,0,.99999);
   if(punchProgress<4/13||punchProgress>=9/13)return;
 }
 if(a.characterId==='junin'&&a.attack.type==='kick'){
   // Frame indexes 6 and 7: foot fully extended, then withdraws.
   // A single landed hit is still enforced by a.attack.hit.
   const kickProgress=Phaser.Math.Clamp(1-(a.attackUntil-t)/370,0,.99999);
   if(kickProgress<6/12||kickProgress>=8/12)return;
 }
// Chila's lowered hurtbox: high punches pass over the head only when visibly crouched.
if(b.characterId==='chila'&&b.chilaCrouchStage&&b.chilaCrouchFrame>=4&&b.chilaCrouchFrame<=9&&a.attack.type==='punch'&&b.y>=FLOOR-1)return;
let range=a.attack.type==='punch'?115:a.attack.type==='kick'?145:100;
const juninKick=a.characterId==='junin'&&a.attack.type==='kick';
const connect=juninKick
 ? Math.abs((a.x+a.dir*120)-b.x)<58 && Math.abs((a.y-173)-(b.y-150))<84
 : Math.abs(a.x-b.x)<range&&Math.abs(a.y-b.y)<85;
if(connect&&((b.x-a.x)*a.dir)>0){a.attack.hit=true;let damage=a.attack.type==='punch'?9:a.attack.type==='kick'?14:22;if(b.block){damage=Math.ceil(damage*.18);if(b.characterId==='chila')b.chilaDefenseImpactAt=t;if(b.characterId==='junin')b.juninDefenseImpactAt=t;}b.hp=Math.max(0,b.hp-damage);if(!b.block){
   b.stunUntil=t+230;b.x+=a.dir*20;this.cameras.main.shake(75,.003);
   // Reação visual APENAS ao soco válido no Chila. O stun (230ms),
   // dano, recuo (20px), defesa e acerto único permanecem inalterados.
   if(a.attack.type==='punch'&&b.characterId==='chila'&&b.hp>0){
     if(b.gauchoStage)this.stopGaucho(b); // já seria interrompido pelo hit stun no próximo update
     if(b.sprite.anims&&b.sprite.anims.currentAnim&&
        b.sprite.anims.currentAnim.key===CHILA_PUNCH_HIT.animation)b.sprite.anims.stop();
     b.chilaHitStart=t;
     b.chilaHitUntil=t+CHILA_PUNCH_HIT.duration;
     b.chilaHitAnimationStarted=false;
   }
 }this.showHit(b.x,b.y-130,b.block?'DEFESA!':'-'+damage,b.block?'#9bd8ff':'#ffe183')}}
,
 finishRound(){
   this.cleanupJetta();this.clearGauchoAll();this.state='result';
   const winner=this.p[0].hp===this.p[1].hp?-1:this.p[0].hp>this.p[1].hp?0:1;
   if(winner<0)this.announcement.setText('EMPATE!');
   else{this.wins[winner]++;this.announcement.setText(this.p[winner].name+'\nVENCEU O ROUND!');}
   if(this.wins.some(n=>n>=2)){
     this.state='match';this.info.setText('');
     this.roundTimer(1000,()=>{if(this.state==='match')this.showMatchResult(winner)});
   }else{
     this.info.setText('PRÓXIMO ROUND...');
     this.roundTimer(2400,()=>{if(this.state==='result'){this.round++;this.startRound()}});
   }
 }
,
 startRound(){
   this.clearRoundTimers();this.cleanupJetta();this.clearGauchoAll();this.clearHitEffects();this.state='intro';this.uiState=null;
   this.timer=75;this.timeText.setText('75');
   this.p.forEach((f,i)=>{
     f.x=i?690:270;f.y=FLOOR;f.vy=0;f.hp=100;f.attack=null;f.attackUntil=0;
     f.specialCooldown=0;f.stunUntil=0;f.nextAttack=0;f.dir=i?-1:1;
     f.chilaHitStart=0;f.chilaHitUntil=0;f.chilaHitAnimationStarted=false;
     f.block=false;f.crouch=false;f.juninDefensePhase=null;f.juninDefenseSince=0;f.juninDefenseEnterFrom=0;f.juninDefenseImpactAt=0;f.visualX=f.x;f.visualY=f.y;f.visualAngle=0;
     f.visualScaleX=1;f.visualScaleY=1;f.previousX=f.x;f.animClock=0;
     f.landSquash=0;f.moveUntil=0;f.moveSpeed=0;f.inChilaCrouch=false;f.inChilaWalk=false;
     f.inChilaStance=false;f.inChilaPunch=false;f.inChilaJump=false;
     f.inChilaDefense=false;f.chilaDefenseImpactAt=0;f.chilaDefenseRelease=0;
     f.chilaJumpStart=0;f.chilaJumpLandTime=0;f.chilaJumpStage=null;
     f.chilaCrouchStage=null;f.chilaCrouchFrame=0;f.chilaCrouchStartFrame=0;f.chilaCrouchSince=0;
     f.chilaDefenseStage=null;f.chilaDefenseSince=0;f.chilaDefenseFrame=0;f.chilaDefenseStartFrame=0;
     f.jettaActive=false;f.jettaFrame=0;
     f.gauchoStage=null;f.gauchoSince=0;f.gauchoFrame=0;f.gauchoShot=false;f.gauchoDir=f.dir;
     f.juninJumpStage=null;f.juninJumpStart=0;f.juninTakeoff=0;f.juninLandTime=0;
     f.juninCrouchStage=null;f.juninCrouchSince=0;f.juninCrouchFrame=0;f.juninCrouchStartFrame=0;
     f.command=EMPTY_COMMAND();
     if(f.brain){f.brain.nextDecision=0;f.brain.command=EMPTY_COMMAND();f.brain.seenAttack=null;f.brain.observedAt=0;f.brain.guardUntil=0;f.brain.crouchUntil=0;}
     f.sprite.setVisible(true).setAlpha(1).setDepth(6).clearTint();
     if(f.sprite.anims&&f.sprite.anims.isPlaying)f.sprite.anims.stop();
     f.sprite.setTexture(CHARACTER_DATA[f.characterId].preview);
   });
   this.roundText.setText('ROUND '+this.round);
   this.announcement.setText('ROUND '+this.round);this.info.setText(this.mode==='single'?'P1: A/D mover • W/S • F/G • H • Q especial':'P1: A/D W/S F/G H/Q    |    P2: ←/→ ↑/↓ K/L O/P');
   this.actionLockUntil=this.time.now+1900;
   this.roundTimer(1200,()=>{if(this.state==='intro'){
      this.announcement.setText('LUTEM!');this.info.setText('');
      this.roundTimer(650,()=>{if(this.state==='intro'){this.state='fight';this.announcement.setText('')}});
   }});
 }
,
 clearRoundTimers(){if(this.pendingTimers){this.pendingTimers.forEach(ev=>{if(ev&&!ev.hasDispatched)ev.remove(false)})}this.pendingTimers=[];}
,
 roundTimer(ms,cb){const ev=this.time.delayedCall(ms,cb);this.pendingTimers.push(ev);return ev;}
};

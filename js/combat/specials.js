import { W, FLOOR } from "../config/game.js";
import { GAUCHO_PHASES, GAUCHO_COOLDOWN } from "../characters/chila.js";
import { CHARACTER_DATA } from "../config/characters.js";

// Métodos originais da v5.0 agrupados por responsabilidade, sem alterar o corpo da lógica.
export const specialsMethods = {
 activateCharacterSpecial(f,t){
   if(!CHARACTER_DATA[f.characterId]?.special)return; // Júlio: nenhum especial inventado
   if(t<f.specialCooldown||f.gauchoStage||f.jettaActive)return;
   if(f.characterId==='chila'){
     this.startGaucho(f,t);
   }else if(f.characterId==='junin'){
     if(f.y<FLOOR-1||this.jetta)return;
     this.startJetta(f,t);
   }
 }

 // CHURRASCO DO AVÔ DO CHILA — único especial do Chila.
,
 startGaucho(f,t){
   if(f.characterId!=='chila'||f.gauchoStage||f.y<FLOOR-.5||
      f.block||f.crouch||t<f.stunUntil||t<f.specialCooldown||
      (f.attack&&t<f.attackUntil)||this.state!=='fight')return;
   f.gauchoStage='preparacao';f.gauchoSince=t;f.gauchoFrame=0;
   f.gauchoShot=false;f.gauchoDir=f.dir;
   f.attack={type:'gaucho',hit:true}; // Not a contact attack; hitbox belongs to projectile.
   f.attackUntil=Infinity;f.nextAttack=Infinity;
   f.specialCooldown=t+GAUCHO_COOLDOWN;
   f.moveUntil=0;f.vy=0;
   this.showHit(W/2,134,'CHURRASCO DO AVÔ DO CHILA!','#ffb347');
 }
,
 stopGaucho(f){
   if(!f||!f.gauchoStage)return;
   f.gauchoStage=null;f.gauchoSince=0;f.gauchoFrame=0;f.gauchoShot=false;
   if(f.attack&&f.attack.type==='gaucho'){
     f.attack=null;f.attackUntil=0;f.nextAttack=this.time.now+160;
   }
   if(f.sprite&&f.sprite.active){f.sprite.setTexture('chila_stance_0');}
 }
,
 clearGauchoAll(){
   for(const z of this.gauchoShots||[])if(z.sprite&&z.sprite.active)z.sprite.destroy();
   for(const z of this.gauchoImpacts||[])if(z.sprite&&z.sprite.active)z.sprite.destroy();
   this.gauchoShots=[];this.gauchoImpacts=[];
   for(const f of this.p||[])if(f&&f.gauchoStage)this.stopGaucho(f);
 }
,
 updateGaucho(t,dt){
   for(const f of this.p){
     if(!f.gauchoStage)continue;
     if(f.hp<=0||t<f.stunUntil||this.state!=='fight'){
       this.stopGaucho(f);continue;
     }
     const group=f.gauchoStage;
     const desc=GAUCHO_PHASES.find(p=>p[0]===group);
     if(!desc){this.stopGaucho(f);continue;}
     const age=Math.max(0,t-f.gauchoSince);
     f.gauchoFrame=Math.min(desc[1]-1,Math.floor(age/desc[2]));
     if(group==='lancamento'&&!f.gauchoShot&&f.gauchoFrame>=2){
       f.gauchoShot=true;this.fireGauchoBall(f,t);
     }
     if(age>=desc[1]*desc[2]){
       const next=GAUCHO_PHASES.findIndex(p=>p[0]===group)+1;
       if(next>=GAUCHO_PHASES.length){this.stopGaucho(f);}
       else{f.gauchoStage=GAUCHO_PHASES[next][0];f.gauchoSince=t;f.gauchoFrame=0;}
     }
   }
 }
,
 fireGauchoBall(f,t){
   const dir=f.gauchoDir;
   const x=f.x+dir*88,y=f.y-145;
   const sprite=this.add.sprite(x,y,'gaucho_bola_fogo_0')
     .setDepth(12).setScale(.70).setFlipX(dir<0);
   sprite.play('gaucho_bola_fogo');
   this.gauchoShots.push({sprite,x,y,dir,owner:f,hit:false,created:t,life:t+2000});
 }
,
 spawnGauchoImpact(x,y,dir,t){
   const sprite=this.add.sprite(x,y,'gaucho_impacto_0')
     .setDepth(13).setScale(.9).setFlipX(dir<0);
   sprite.play('gaucho_impacto');
   this.gauchoImpacts.push({sprite,created:t});
 }
,
 updateGauchoProjectiles(t,dt){
   for(let i=this.gauchoShots.length-1;i>=0;i--){
     const z=this.gauchoShots[i];
     const prev=z.x;z.x+=z.dir*455*dt;
     z.sprite.setPosition(z.x,z.y);
     const target=this.p[1-z.owner.slot];
     const passed=(target.x-prev)*z.dir>=-38&&(target.x-z.x)*z.dir<=45;
     const close=Math.abs(target.x-z.x)<48;
     const hittable=target.hp>0 && !(target.jettaActive&&this.jetta&&
          ['enter','drive','coast','exit','leave'].includes(this.jetta.phase));
     if(hittable&&(passed||close)&&Math.abs((target.y-123)-z.y)<85){
       const dmg=target.block?4:19;
       target.hp=Math.max(0,target.hp-dmg);
       if(target.block&&target.characterId==='chila')target.chilaDefenseImpactAt=t;if(target.block&&target.characterId==='junin')target.juninDefenseImpactAt=t;
       if(!target.block){
         target.stunUntil=Math.max(target.stunUntil,t+280);
         target.x=Phaser.Math.Clamp(target.x+z.dir*25,55,W-55);
       }
       this.showHit(target.x,target.y-168,target.block?'DEFESA!':'-'+dmg,
                    target.block?'#9bd8ff':'#ffda64');
       this.cameras.main.shake(110,.004);
       this.spawnGauchoImpact(target.x,target.y-128,z.dir,t);
       if(z.sprite.active)z.sprite.destroy();
       this.gauchoShots.splice(i,1); // One hit only, regardless of overlapping frames.
     }else if(t>z.life||z.x<-125||z.x>W+125){
       if(z.sprite.active)z.sprite.destroy();
       this.gauchoShots.splice(i,1);
     }
   }
   for(let i=this.gauchoImpacts.length-1;i>=0;i--){
     const burst=this.gauchoImpacts[i];
     if(t-burst.created>=520){
       if(burst.sprite.active)burst.sprite.destroy();
       this.gauchoImpacts.splice(i,1);
     }
   }
 }

 // JUNIN's JETTA HIPOTÉTICO is an independent Phaser sequence, not a stretched fighter.
 // It uses the existing car art, wheel art and individual smoke/impact frames.
,
 startJetta(f,t){
   this.cleanupJetta();
   const enemy=this.p[1-f.slot];
   const dir=enemy.x>=f.x?1:-1;
   const initialCenter=f.x+dir*55;
   const impactReadyCenter=enemy.x-dir*(167+70);
   const targetX=Phaser.Math.Clamp(dir===1?Math.min(initialCenter,impactReadyCenter):Math.max(initialCenter,impactReadyCenter),190,W-190);
   const startX=dir===1?-215:W+215;
   const car=this.add.image(startX,FLOOR+8,'jetta_car_0').setOrigin(.5,1).setDisplaySize(365,170).setDepth(8).setVisible(false);
   const wheels=[this.add.image(startX,FLOOR-30,'jetta_wheel_0').setDisplaySize(54,54).setDepth(9).setVisible(false),this.add.image(startX,FLOOR-30,'jetta_wheel_0').setDisplaySize(54,54).setDepth(9).setVisible(false)];
   const smoke=this.add.image(startX,FLOOR-20,'jetta_smoke_0').setOrigin(.5,.75).setDepth(9).setVisible(false);
   const burst=this.add.image(enemy.x,FLOOR-74,'jetta_impact_0').setOrigin(.5,.5).setDepth(12).setVisible(false);
   this.jetta={owner:f,phase:'prepare',since:t,dir,startX,targetX,carX:startX,speed:0,hit:false,impactSince:0,car,wheels,smoke,burst,lastTick:t,step:0,entryStartX:f.x};
   f.jettaActive=true;f.jettaFrame=0;f.juninJumpStage=null;f.juninCrouchStage=null;
   f.y=FLOOR;f.vy=0;f.block=false;f.crouch=false;f.moveUntil=0;
   f.attack={type:'jetta',hit:false};f.attackUntil=Infinity;f.nextAttack=Infinity;
   f.specialCooldown=t+5600;
   f.sprite.setDepth(10).setVisible(true).setAlpha(1);
   this.showHit(f.x,f.y-208,'JETTA HIPOTÉTICO!','#f5d36d');
 }
,
 jettaPhase(phase,t){
   const j=this.jetta;if(!j)return;
   j.phase=phase;j.since=t;j.step=0;
   if(phase==='drive'){j.owner.sprite.setVisible(false);j.speed=95;}
   if(phase==='exit'){
     j.speed=0;
     j.owner.x=Phaser.Math.Clamp(j.carX-j.dir*55,62,W-62);
     j.owner.y=FLOOR;j.owner.sprite.setVisible(true).setAlpha(1);
   }
   if(phase==='leave'){j.owner.sprite.setVisible(true);j.owner.jettaFrame=0;j.speed=490;}
 }
,
 updateJetta(t,dt){
   const j=this.jetta;if(!j||this.state!=='fight')return;
   const f=j.owner,enemy=this.p[1-f.slot],age=t-j.since;
   if(f.hp<=0){this.cleanupJetta();return;}
   // Explicit phases instead of timers controlling the sprite independent of world movement.
   if(j.phase==='prepare'){
     f.jettaFrame=Math.min(4,Math.floor(age/106));
     if(age>=530)this.jettaPhase('arrival',t);
   }else if(j.phase==='arrival'){
     const u=Phaser.Math.Clamp(age/950,0,1);
     j.carX=j.startX+(j.targetX-j.startX)*(1-Math.pow(1-u,3));
     f.jettaFrame=4;
     if(u>=1){j.carX=j.targetX;this.jettaPhase('enter',t);}
   }else if(j.phase==='enter'){
     f.jettaFrame=5+Math.min(7,Math.floor(age/112));
     // Approach the door if the car needed extra clearance for close-range bumper contact.
     const approach=Phaser.Math.Clamp(age/660,0,1);
     f.x=j.entryStartX+(j.targetX-j.dir*55-j.entryStartX)*(approach*approach*(3-2*approach));
     if(age>=900)this.jettaPhase('drive',t);
   }else if(j.phase==='drive'){
     const before=j.carX;
     j.speed=Math.min(680,j.speed+900*dt);
     j.carX=Phaser.Math.Clamp(j.carX+j.dir*j.speed*dt,183,W-183);
     // Hitbox is a 40px strip at the FRONT BUMPER, not the whole car sprite.
     const was=before+j.dir*167,now=j.carX+j.dir*167;
     const swept=(enemy.x-was)*j.dir>=-24&&(enemy.x-now)*j.dir<=30;
     const close=Math.abs(enemy.x-now)<31;
     if(!j.hit&&(swept||close)&&enemy.y>=FLOOR-82){
       j.hit=true;j.impactSince=t;j.impactX=enemy.x;j.impactY=enemy.y-85;
       const damage=enemy.block?5:26;
       enemy.hp=Math.max(0,enemy.hp-damage);
       if(enemy.block&&enemy.characterId==='chila')enemy.chilaDefenseImpactAt=t;if(enemy.block&&enemy.characterId==='junin')enemy.juninDefenseImpactAt=t;
       if(!enemy.block){enemy.stunUntil=t+390;enemy.x=Phaser.Math.Clamp(enemy.x+j.dir*48,55,W-55);}
       this.showHit(enemy.x,enemy.y-180,enemy.block?'DEFESA!':'-'+damage,enemy.block?'#9bd8ff':'#ffe183');
       this.cameras.main.shake(155,.006);
       this.jettaPhase('coast',t);
     }else if((enemy.x-now)*j.dir<-60 || (j.dir===1?j.carX>=W-185:j.carX<=185)){
       this.jettaPhase('coast',t);
     }
   }else if(j.phase==='coast'){
     j.speed=Math.max(0,j.speed-1700*dt);
     j.carX=Phaser.Math.Clamp(j.carX+j.dir*j.speed*dt,183,W-183);
     if(age>=430)this.jettaPhase('exit',t);
   }else if(j.phase==='exit'){
     f.jettaFrame=age<135?7:age<270?6:age<410?5:4;
     if(age>=550)this.jettaPhase('leave',t);
   }else if(j.phase==='leave'){
     f.jettaFrame=0;
     j.carX+=-j.dir*j.speed*dt;
     if(age>=1200 || j.carX<-230 || j.carX>W+230){this.cleanupJetta();return;}
   }
   const moving=['arrival','drive','coast','leave'].includes(j.phase);
   j.car.setVisible(j.phase!=='prepare').setPosition(j.carX,FLOOR+8).setFlipX(j.dir===-1);
   // Only intact car variants 0-3 are used: later sheet cars overlap speed streaks.
   const carIdx=moving?Math.floor(t/105)%4:0;
   if(j.car.texture.key!=='jetta_car_'+carIdx)j.car.setTexture('jetta_car_'+carIdx);
   j.car.setDisplaySize(365,170);
   for(let i=0;i<2;i++){
     const w=j.wheels[i];w.setVisible(j.phase!=='prepare');
     w.setPosition(j.carX+j.dir*(i===0?-113:61),FLOOR-31);
     const wheelFrame=moving?Math.floor(t/48)%9:0;
     if(w.texture.key!=='jetta_wheel_'+wheelFrame)w.setTexture('jetta_wheel_'+wheelFrame);
     w.setDisplaySize(54,54);
     // Rotation comes exclusively from the provided sprite poses.
   }
   j.smoke.setVisible((j.phase==='drive'||j.phase==='coast')&&j.speed>130);
   if(j.smoke.visible){
     const smokeId=Math.floor(t/90)%8;
     if(j.smoke.texture.key!=='jetta_smoke_'+smokeId)j.smoke.setTexture('jetta_smoke_'+smokeId);
     j.smoke.setPosition(j.carX-j.dir*168,FLOOR-15).setFlipX(j.dir===-1);
     j.smoke.setScale(.62).setAlpha(.87);
   }
   if(j.hit&&t-j.impactSince<590){
     const idx=Math.min(7,Math.floor((t-j.impactSince)/74));
     j.burst.setVisible(true).setTexture('jetta_impact_'+idx).setPosition(j.impactX,j.impactY).setScale(.76);
   }else j.burst.setVisible(false);
   f.sprite.setVisible(!['drive','coast'].includes(j.phase));
   f.sprite.setDepth(10);
 }
,
 cleanupJetta(){
   const j=this.jetta;if(!j)return;
   for(const sprite of [j.car,...j.wheels,j.smoke,j.burst])if(sprite&&sprite.active)sprite.destroy();
   const f=j.owner;
   f.jettaActive=false;f.jettaFrame=0;f.attack=null;f.attackUntil=0;f.moveUntil=0;
   f.nextAttack=Math.max(0,this.time.now+110);
   if(f.sprite&&f.sprite.active){f.sprite.setVisible(true).setAlpha(1).setDepth(6);if(f.sprite.anims.isPlaying)f.sprite.anims.stop();f.sprite.setTexture('junin_stance_0');}
   this.jetta=null;
 }
};

import { FLOOR, W, H } from "../config/game.js";
import { UI_LAYOUT } from "../config/layout.js";
import { CHILA_PUNCH_HIT, CHILA_VISUAL, GAUCHO_SCALE } from "../characters/chila.js";
import { JUNIN_DEFENSE, juninDefenseFrame } from "../characters/junin.js";
import { JULIO_ID, JULIO_IDLE, JULIO_FLOAT } from "../characters/julio.js";

// Métodos originais da v5.0 agrupados por responsabilidade, sem alterar o corpo da lógica.
export const visualMethods = {
 drawStage(){
   // O cenário original é 1536x1024 (3:2), enquanto a tela é 16:9.
   // Mantém a imagem SEM deformação e corta apenas as bordas verticais,
   // com o piso visível e o letreiro central preservados.
   const background=this.add.image(W/2,UI_LAYOUT.stage.topOffset,'barNovo')
     .setOrigin(.5,0).setDepth(-10);
   const texture=this.textures.get('barNovo').getSourceImage();
   const backgroundScale=Math.max(W/texture.width,H/texture.height);
   background.setScale(backgroundScale);
   this.add.rectangle(W/2,0,W,UI_LAYOUT.stage.darkBandHeight,0x000000,.25).setDepth(-9);
 }
,
 paintFighter(f,t,dt){
  const g=f.g;g.clear();
  const smooth=(a,b,k)=>a+(b-a)*(1-Math.exp(-k*Math.min(dt,.05)));
  const clamp=Phaser.Math.Clamp;
  const grounded=f.y>=FLOOR-.5;
  const speed=(f.x-f.previousX)/Math.max(dt,.001);
  f.previousX=f.x;
  const walking=grounded&&!f.block&&!f.crouch&&!f.attack&&Math.abs(speed)>12;
  if(walking)f.animClock+=dt*Math.min(15,6+Math.abs(speed)*.027);
  const gait=Math.sin(f.animClock);
  const recoil=t<f.stunUntil;
  const active=f.attack&&t<f.attackUntil;
  let angle=0,dx=0,dy=0,sx=1,sy=1;
  if(walking){
    dx=f.dir*Math.sin(f.animClock)*3;
    dy=-Math.abs(gait)*5;
    angle=gait*2.8*f.dir;
    sx=1+Math.cos(f.animClock*2)*.018;
    sy=1-Math.cos(f.animClock*2)*.014;
  }else if(!active&&!recoil&&grounded&&!f.crouch&&!f.block){
    const breath=Math.sin(t*.0035+(f.characterId==='junin'?1.4:0));
    dy=breath*2.5;sy=1+breath*.012;sx=1-breath*.006;
    angle=Math.sin(t*.0022)*.6;
  }
  if(!grounded){angle=clamp(f.vy/95,-9,10)*f.dir;sy=1.055;sx=.96;dy=-2;}
  if(f.crouch){sy=.77;sx=1.11;dy=8;angle=f.dir*3;}
  if(f.block){sx=.93;sy=.97;dx=-f.dir*7;angle=-f.dir*8;}
  if(active){
    const duration=f.attack.type==='punch'?240:f.attack.type==='kick'?370:640;
    const p=clamp(1-(f.attackUntil-t)/duration,0,1);
    const easeOut=x=>1-Math.pow(1-x,3);
    const pulse=p<.23?-Math.sin(p/.23*Math.PI/2)*.55:p<.60?easeOut((p-.23)/.37):Math.pow(1-(p-.60)/.40,2);
    if(f.attack.type==='punch'){
      dx=f.dir*(pulse*27);angle=f.dir*(pulse*13);sx=1+Math.max(0,pulse)*.13;sy=1-Math.max(0,pulse)*.055;
      dy=-Math.max(0,pulse)*3;
    }else if(f.attack.type==='kick'){
      dx=f.dir*(pulse*24);angle=f.dir*(pulse*19);sx=1+Math.max(0,pulse)*.17;
      sy=1-Math.max(0,pulse)*.09;dy=-Math.max(0,pulse)*12;
    }
  }
  if(recoil){const remaining=clamp((f.stunUntil-t)/230,0,1);angle=-f.dir*remaining*13;dx=-f.dir*remaining*14;sx=1-remaining*.10;sy=1+remaining*.045;}
  f.visualX=smooth(f.visualX,f.x+dx,22);
  f.visualY=smooth(f.visualY,f.y+dy,22);
  f.visualAngle=smooth(f.visualAngle,angle,20);
  f.visualScaleX=smooth(f.visualScaleX,sx,20);
  f.visualScaleY=smooth(f.visualScaleY,sy,20);
  g.fillStyle(0x000000,.42).fillEllipse(f.x,FLOOR+5,grounded?104:84,grounded?16:12);
  const s=f.sprite;
  if(f.characterId==='chila'){
    // Reação a soco: prioriza a animação durante o hit stun. Depois do stun,
    // somente um NOVO comando permitido pode interromper a recuperação visual.
    const hitVisualAllowed=!!f.chilaHitUntil&&t<f.chilaHitUntil&&this.state==='fight'&&f.hp>0&&
      (t<f.stunUntil||(!active&&!walking&&!f.block&&!f.crouch&&!f.chilaJumpStage&&!f.gauchoStage));
    if(!hitVisualAllowed&&f.chilaHitAnimationStarted){
      if(s.anims.currentAnim&&s.anims.currentAnim.key===CHILA_PUNCH_HIT.animation)s.anims.stop();
      f.chilaHitAnimationStarted=false;
      f.chilaHitUntil=0; // nunca reproduzir novamente após interrupção
    }
    // New Chila sprites: one isotropic scale, aligned feet and unchanged combat physics.
    const showJump=!!f.chilaJumpStage&&!active&&!recoil&&!f.block;
    const showCrouch=grounded&&!!f.chilaCrouchStage&&!active&&!recoil&&!f.block&&!showJump;
    const showGuard=grounded&&!!f.chilaDefenseStage&&!active&&!recoil&&!showJump;
    const isWalk=walking&&!active&&!recoil&&!showJump&&!showCrouch&&!showGuard;
    const isStance=grounded&&!walking&&!f.crouch&&!f.block&&!active&&!recoil&&!showJump&&!showCrouch&&!showGuard;
    if(hitVisualAllowed){
      if(!f.chilaHitAnimationStarted){
        s.play(CHILA_PUNCH_HIT.animation);
        f.chilaHitAnimationStarted=true;
      }
      // Sem deslocamento, rotação ou stretch visual extras: o knockback
      // existente já atualizou a coordenada física f.x no momento do acerto.
      f.visualX=f.x;f.visualY=f.y;f.visualAngle=0;
      f.visualScaleX=1;f.visualScaleY=1;
    }else if(f.gauchoStage){
      const key='gaucho_'+f.gauchoStage+'_'+f.gauchoFrame;
      s.setTexture(key);
      f.visualX=f.x;f.visualY=f.y;f.visualAngle=0;
      f.visualScaleX=1;f.visualScaleY=1;
    }else if(active&&f.attack.type==='punch'){
      f.inChilaWalk=false;f.inChilaStance=false;
      if(!f.inChilaPunch){f.inChilaPunch=true;f.chilaPunchStart=t;}
      const progress=Phaser.Math.Clamp(1-(f.attackUntil-t)/240,0,.9999);
      s.setTexture('chila_punch_'+Math.min(11,Math.floor(progress*12)));
      f.visualX=f.x;f.visualY=f.y;f.visualAngle=0;f.visualScaleX=1;f.visualScaleY=1;
    }else if(active&&f.attack.type==='kick'){
      f.inChilaPunch=false;f.inChilaWalk=false;f.inChilaStance=false;
      const progress=Phaser.Math.Clamp(1-(f.attackUntil-t)/370,0,.99999);
      s.setTexture('chila_kick_'+Math.min(11,Math.floor(progress*12)));
      f.visualX=f.x;f.visualY=f.y;f.visualAngle=0;f.visualScaleX=1;f.visualScaleY=1;
    }else if(showJump){
      f.inChilaPunch=false;f.inChilaWalk=false;f.inChilaStance=false;
      let frame=0;
      if(f.chilaJumpStage==='prep'){
        frame=Math.min(2,Math.floor((t-f.chilaJumpStart)/46));
      }else if(f.chilaJumpStage==='air'){
        if(f.vy<0){
          const ascent=Phaser.Math.Clamp((560+f.vy)/560,0,1);
          frame=ascent<.23?3:ascent<.56?4:ascent<.82?5:6;
        }else{
          const descent=Phaser.Math.Clamp(f.vy/560,0,1);
          frame=descent<.1?6:descent<.48?7:8;
        }
      }else if(f.chilaJumpStage==='land'){
        const elapsed=t-f.chilaJumpLandTime;
        frame=elapsed<64?9:elapsed<128?10:11;
      }
      s.setTexture('chila_jump_'+frame);
      f.visualX=f.x;f.visualY=f.y;f.visualAngle=0;f.visualScaleX=1;f.visualScaleY=1;
    }else if(showGuard){
      f.inChilaPunch=false;f.inChilaWalk=false;f.inChilaStance=false;
      let frame=f.chilaDefenseFrame||0;
      if(f.block&&f.chilaDefenseImpactAt>0&&t-f.chilaDefenseImpactAt<180){
        frame=6+Math.min(1,Math.floor((t-f.chilaDefenseImpactAt)/90));
      }
      s.setTexture('chila_defense_'+frame);
      f.visualX=f.x;f.visualY=f.y;f.visualAngle=0;f.visualScaleX=1;f.visualScaleY=1;
    }else if(showCrouch){
      f.inChilaPunch=false;f.inChilaWalk=false;f.inChilaStance=false;
      s.setTexture('chila_crouch_'+(f.chilaCrouchFrame||0));
      f.visualX=f.x;f.visualY=f.y;f.visualAngle=0;f.visualScaleX=1;f.visualScaleY=1;
    }else if(isWalk){
      f.inChilaPunch=false;f.inChilaStance=false;
      if(!f.inChilaWalk){f.inChilaWalk=true;f.chilaWalkStart=t;}
      s.setTexture('chila_walk_'+(Math.floor((t-f.chilaWalkStart)/85)%12));
      f.visualX=f.x;f.visualY=f.y;f.visualAngle=0;f.visualScaleX=1;f.visualScaleY=1;
    }else if(isStance){
      f.inChilaPunch=false;f.inChilaWalk=false;
      if(!f.inChilaStance){f.inChilaStance=true;f.chilaStanceStart=t;}
      s.setTexture('chila_stance_'+(Math.floor((t-f.chilaStanceStart)/95)%12));
      f.visualX=f.x;f.visualY=f.y;f.visualAngle=0;f.visualScaleX=1;f.visualScaleY=1;
    }else{
      f.inChilaWalk=false;f.inChilaStance=false;
      s.setTexture('chila');
    }
  }
  // JUNIN HIPOTETICO: physical jump is always authoritative for height.
  // The source image's airborne y offset was removed by bottom-aligning all bodies.
  // Priority: attack/defense > jump > walking > fight stance.
  if(f.characterId==='junin'){
    const guardBlocked=(!grounded||active||recoil||!!f.jettaActive||!!f.juninJumpStage||!!f.crouch||f.hp<=0);
    const guardIndex=juninDefenseFrame(f,t,grounded&&f.block,guardBlocked);
    const showDefense=guardIndex!==null;
    const jumpStage=f.juninJumpStage;
    const showJump=!!jumpStage&&!active&&!recoil&&!f.block;
    const showCrouch=grounded&&!!f.juninCrouchStage&&!active&&!recoil&&!f.block&&!jumpStage;
    const juninWalk=grounded&&walking&&!active&&!recoil&&!f.block&&!f.crouch&&!jumpStage&&!showCrouch&&!showDefense;
    const juninIdle=grounded&&!walking&&!f.block&&!f.crouch&&!active&&!recoil&&!jumpStage&&!showCrouch&&!showDefense;
    if(f.jettaActive&&this.jetta){
      if(s.anims.isPlaying)s.anims.stop();
      s.setTexture('jetta_entry_'+Math.max(0,Math.min(12,f.jettaFrame||0)));
      f.visualX=f.x;f.visualY=FLOOR;f.visualAngle=0;f.visualScaleX=1;f.visualScaleY=1;
    }else if(active&&f.attack.type==='punch'){
      // 13 original poses, played once; combat timer owns its lifetime.
      if(!s.anims.isPlaying || s.anims.currentAnim.key!=='junin_punch')s.play('junin_punch');
      // Image poses already include arm extension: do not stretch, tilt or
      // move the whole fighter forward to fake a punch.
      f.visualX=f.x;f.visualY=f.y;
      f.visualAngle=0;f.visualScaleX=1;f.visualScaleY=1;
    }else if(active&&f.attack.type==='kick'){
      if(!s.anims.isPlaying || s.anims.currentAnim.key!=='junin_kick')s.play('junin_kick');
      // Original 12 kick poses already contain the limb extension.
      // Keep Junin fixed in place: no fake squash, rotation or forward slide.
      f.visualX=f.x;f.visualY=f.y;
      f.visualAngle=0;f.visualScaleX=1;f.visualScaleY=1;
    }else if(showDefense){
      if(s.anims.isPlaying)s.anims.stop();
      // Guard changes only when the command changes; it never runs the full
      // 14-frame strip on repeat while the key remains held.
      s.setTexture('junin_defense_'+guardIndex);
      f.visualX=f.x;f.visualY=f.y;
      f.visualAngle=0;f.visualScaleX=1;f.visualScaleY=1;
    }else if(showJump){
      if(s.anims.isPlaying)s.anims.stop();
      let frame=0;
      if(jumpStage==='prep'){
        const e=t-f.juninJumpStart;
        frame=e<32?0:e<94?1:2;
      }else if(jumpStage==='air'){
        // Use existing vy (-560 launch, +1400 gravity), not source-sheet elevation.
        const ascent=Phaser.Math.Clamp((560+f.vy)/560,0,1);
        const descent=Phaser.Math.Clamp(f.vy/560,0,1);
        if(f.vy<0){frame=ascent<.19?3:ascent<.53?4:ascent<.80?5:6;}
        else{frame=descent<.18?6:descent<.52?7:8;}
      }else if(jumpStage==='land'){
        const e=t-f.juninLandTime;
        frame=e<73?9:e<138?10:11;
      }
      s.setTexture('junin_jump_'+frame);
      // Set only the already simulated position; no second jump curve or stretch.
      f.visualX=f.x;f.visualY=f.y;
      f.visualAngle=0;f.visualScaleX=1;f.visualScaleY=1;
    }else if(showCrouch){
      if(s.anims.isPlaying)s.anims.stop();
      // A real freeze frame during held crouch, no looping through recovery frames.
      s.setTexture('junin_crouch_'+f.juninCrouchFrame);
      f.visualX=f.x; f.visualY=f.y;
      f.visualAngle=0; f.visualScaleX=1; f.visualScaleY=1;
    }else if(juninWalk){
      if(!s.anims.isPlaying || s.anims.currentAnim.key!=='junin_walk')s.play('junin_walk');
      f.visualX=f.x; f.visualY=f.y;
      f.visualAngle=0; f.visualScaleX=1; f.visualScaleY=1;
    }else if(juninIdle){
      if(!s.anims.isPlaying || s.anims.currentAnim.key!=='junin_idle')s.play('junin_idle');
      f.visualX=f.x;f.visualY=f.y;
      f.visualAngle=0;f.visualScaleX=1;f.visualScaleY=1;
    }else{
      // Preserve legacy punches, kicks, defense and recoil effects unchanged.
      if(s.anims.isPlaying)s.anims.stop();
      s.setTexture('junin_stance_0');
    }
  }
  // Júlio: caminhada visual por levitação. A posição real (f.x/f.y),
  // colisões e física continuam intocadas. Ataques, dano, pulo, defesa,
  // agachamento e estados de fim de round sempre têm prioridade.
  if(f.characterId===JULIO_ID){
    const canFloat=this.state==='fight' && f.hp>0 && walking &&
      !active && !recoil && grounded && !f.block && !f.crouch;
    if(canFloat){
      if(!f.julioFloatMoving){
        f.julioFloatMoving=true;
        f.julioFloatStartedAt=t;
        s.play(JULIO_FLOAT.start); // tocada uma vez por início de deslocamento
      }else if(t-f.julioFloatStartedAt>=JULIO_FLOAT.startFrames*JULIO_FLOAT.frameDurationMs){
        if(s.anims.currentAnim?.key!==JULIO_FLOAT.walk || !s.anims.isPlaying)
          s.play(JULIO_FLOAT.walk); // loop somente com frames 7-12
      }
    }else{
      f.julioFloatMoving=false; // soltar movimento reinicia a próxima entrada
      if(!s.anims.isPlaying||s.anims.currentAnim?.key!==JULIO_IDLE.animation)
        s.play(JULIO_IDLE.animation); // demais ações continuam provisórias
    }
    f.visualX=f.x;f.visualY=f.y;f.visualAngle=0;
    f.visualScaleX=1;f.visualScaleY=1;
  }
  s.setPosition(f.visualX,f.visualY);
  // Original sprite sheet faces right; mirror when Junin is facing left (towards Chila).
  s.setFlipX(f.dir===-1);
  const isChilaCrouch=f.characterId==='chila'&&s.texture.key.startsWith('chila_crouch_');
  const isChilaDefense=f.characterId==='chila'&&s.texture.key.startsWith('chila_defense_');
  // A animação muda de textura, nunca de escala do corpo.
  // Mantemos o mesmo ponto de origem do lutador (setOrigin(.5,1)) e o piso
  // definido pela física; os offsets existem só para correções VISUAIS futuras.
  const chilaBodyMotion=f.characterId==='chila'&&(
    s.texture.key.startsWith('chila_hit_')?'hit':
    s.texture.key.startsWith('chila_jump_')?'jump':
    s.texture.key.startsWith('chila_crouch_')?'crouch':
    s.texture.key.startsWith('chila_defense_')?'defense':
    s.texture.key.startsWith('chila_walk_')?'walk':
    s.texture.key.startsWith('chila_stance_')?'stance':null);
  if(f.characterId===JULIO_ID){
    s.setScale(JULIO_IDLE.scale); // idle e levitação, sem stretch
  }else if(f.characterId==='junin' && s.texture.key.startsWith('junin_defense_')){
    s.setScale(JUNIN_DEFENSE.scale); // X=Y: silhouette never stretches.
    s.setPosition(f.visualX,f.visualY+JUNIN_DEFENSE.offsetY);
  }else if(f.characterId==='chila'&&f.gauchoStage){
    s.setScale(GAUCHO_SCALE[f.gauchoStage]); // Especial preservado sem alteração
  }else if(chilaBodyMotion){
    const visual=CHILA_VISUAL[chilaBodyMotion];
    s.setScale(visual.scale); // um único fator para X e Y (sem deformação)
    s.setPosition(f.visualX+visual.offsetX*f.dir,f.visualY+visual.offsetY);
  }else{
  s.setDisplaySize((f.characterId==='junin'?(s.texture.key.startsWith('jetta_entry_')?295:(s.texture.key.startsWith('junin_crouch_')?270:(s.texture.key.startsWith('junin_jump_')?210:(s.texture.key.startsWith('junin_kick_')?312:(s.texture.key.startsWith('junin_punch_')?274:174))))):(isChilaCrouch?270:(isChilaDefense?230:(f.characterId==='chila'&&(s.texture.key.startsWith('chila_stance_')||s.texture.key.startsWith('chila_walk_'))?174:((s.texture.key.startsWith('chila_punch_')||s.texture.key.startsWith('chila_kick_'))?280:(s.texture.key.startsWith('chila_jump_')?228:153))))))*f.visualScaleX,(f.characterId==='junin'&&s.texture.key.startsWith('jetta_entry_')?252:(isChilaCrouch||(f.characterId==='junin'&&s.texture.key.startsWith('junin_crouch_'))?230:218))*f.visualScaleY);
  }
  s.setAngle(f.characterId===JULIO_ID?0:f.visualAngle);
  s.setTint(recoil?0xff7777:(f.block&&f.characterId!=='chila'&&!s.texture.key.startsWith('junin_defense_'))?0x91caff:0xffffff);
 }
};

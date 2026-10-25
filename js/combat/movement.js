import { W, FLOOR } from "../config/game.js";

// Métodos originais da v5.0 agrupados por responsabilidade, sem alterar o corpo da lógica.
export const movementMethods = {
 move(f,i,t,dt){
  const cmd=this.readCommands(f);
  if(f.gauchoStage){f.block=false;f.crouch=false;f.previousX=f.x;return;}
  if(f.characterId==='junin'&&f.jettaActive&&this.jetta){f.block=false;f.crouch=false;f.previousX=f.x;return;}
  const wasGrounded=f.y>=FLOOR-.5;
  const wasAirborne=f.y<FLOOR;
  f.dir=this.p[1-i].x>=f.x?1:-1;
  f.block=cmd.guard&&f.y>=FLOOR-1&&t>=f.stunUntil;
  f.crouch=cmd.crouch&&f.y>=FLOOR-1;

  // ONLY JUNIN: crouch is a state machine: down => hold => up => idle.
  // Releasing during descent or re-pressing while rising continues from a
  // matching pose, rather than jumping abruptly to standing or full crouch.
  if(f.characterId==='junin'){
    const phase=f.juninCrouchStage;
    const grounded=f.y>=FLOOR-.5;
    const interrupted=!grounded||f.block||(f.attack&&t<f.attackUntil)||t<f.stunUntil||!!f.juninJumpStage;
    if(interrupted){
      f.juninCrouchStage=null;
    }else if(f.crouch){
      if(phase===null || phase===undefined){
        f.juninCrouchStage='down';f.juninCrouchSince=t;f.juninCrouchStartFrame=0;
      }else if(phase==='up'){
        const current=f.juninCrouchFrame??11;
        f.juninCrouchStage='down';f.juninCrouchSince=t;
        f.juninCrouchStartFrame=Math.max(0,Math.min(5,11-current));
      }
      if(f.juninCrouchStage==='down'){
        const frame=Math.min(5,f.juninCrouchStartFrame+Math.floor((t-f.juninCrouchSince)/65));
        f.juninCrouchFrame=frame;
        if(frame>=5&&t-f.juninCrouchSince>=(6-f.juninCrouchStartFrame)*65){
          f.juninCrouchStage='hold';f.juninCrouchFrame=6;
        }
      }else if(f.juninCrouchStage==='hold'){
        f.juninCrouchFrame=6;
      }
    }else if(phase==='down'||phase==='hold'){
      const current=phase==='hold'?6:(f.juninCrouchFrame??0);
      f.juninCrouchStage='up';f.juninCrouchSince=t;
      // Earlier release -> shorter recovery, matching the equivalent original pose.
      f.juninCrouchStartFrame=Math.max(7,Math.min(11,11-current));
      f.juninCrouchFrame=f.juninCrouchStartFrame;
    }else if(phase==='up'){
      const index=f.juninCrouchStartFrame+Math.floor((t-f.juninCrouchSince)/65);
      if(index>11){f.juninCrouchStage=null;f.juninCrouchFrame=11;}
      else{f.juninCrouchFrame=index;}
    }
  }

  if(t>=f.stunUntil){
    // Restrict Junin movement during the actual lowering/raising animation only.
    if(!f.block&&!f.crouch&&!(f.characterId==='junin'&&f.juninCrouchStage)&&!(f.characterId==='chila'&&(f.chilaCrouchStage||f.chilaDefenseStage||f.chilaJumpStage==='prep'))){
      let vx=(cmd.right?1:0)-(cmd.left?1:0);
      f.x+=vx*235*dt;
    }
    if(cmd.jump&&f.y>=FLOOR-1&&!f.block&&!f.jettaActive&&t>=this.actionLockUntil){
      if(f.characterId==='junin'){
        // Jump has priority; preserve its exact impulse and physics.
        f.juninCrouchStage=null;
        if(!f.juninJumpStage){f.juninJumpStage='prep';f.juninJumpStart=t;}
      }else if(f.characterId==='chila'){
        f.chilaJumpStage='prep';f.chilaJumpStart=t;f.chilaJumpLandTime=0;
        f.inChilaJump=true;
      }else{
        // Júlio: mesmos -560 de impulso e +1400 de gravidade da arena;
        // só o sprite idle está disponível, sem inventar frames de salto.
        f.vy=-560;
      }
    }
    if(t>=f.nextAttack&&!f.block&&!f.jettaActive&&t>=this.actionLockUntil){
      if(cmd.punch)this.attack(f,'punch',t);
      else if(cmd.kick)this.attack(f,'kick',t);
      else if(cmd.special)this.activateCharacterSpecial(f,t);
    }
  }
  if(f.characterId==='junin'&&f.juninJumpStage==='prep'&&t-f.juninJumpStart>=150){
    if(t>=f.stunUntil&&!f.block){f.vy=-560;f.juninJumpStage='air';f.juninTakeoff=t;}
    else{f.juninJumpStage=null;}
  }
  // Chila: preparation before the existing vertical physics, never add a second visual y offset.
  if(f.characterId==='chila' && f.chilaJumpStage==='prep' && t-f.chilaJumpStart>=138){
    if(t>=f.stunUntil&&!f.block&&!(f.attack&&t<f.attackUntil)){
      f.vy=-560;f.chilaJumpStage='air';
    }else f.chilaJumpStage=null;
  }
  f.vy+=1400*dt;
  f.y=Math.min(FLOOR,f.y+f.vy*dt);
  if(f.y>=FLOOR)f.vy=0;
  if(f.characterId==='chila'){
    if(f.chilaJumpStage==='air' && wasAirborne && f.y>=FLOOR && f.vy===0){
      f.chilaJumpStage='land';f.chilaJumpLandTime=t;
    }
    if(f.chilaJumpStage==='land' && t-f.chilaJumpLandTime>=192)f.chilaJumpStage=null;
    const groundedChila=f.y>=FLOOR-.5;
    const attackActive=!!f.attack&&t<f.attackUntil;
    const busy=!groundedChila||f.block||attackActive||t<f.stunUntil||!!f.chilaJumpStage;
    // CROUCH (held input): enter -> still crouched -> recover once on release.
    const phase=f.chilaCrouchStage;
    if(busy){f.chilaCrouchStage=null;}
    else if(f.crouch){
      if(!phase){
        f.chilaCrouchStage='down';f.chilaCrouchSince=t;f.chilaCrouchStartFrame=0;
      }else if(phase==='up'){
        f.chilaCrouchStartFrame=Math.max(0,Math.min(5,Math.round((11-(f.chilaCrouchFrame||11))*1.6)));
        f.chilaCrouchStage='down';f.chilaCrouchSince=t;
      }
      if(f.chilaCrouchStage==='down'){
        const index=f.chilaCrouchStartFrame+Math.floor((t-f.chilaCrouchSince)/61);
        if(index>=6){f.chilaCrouchStage='hold';f.chilaCrouchFrame=6;f.chilaCrouchSince=t;}
        else f.chilaCrouchFrame=Math.min(5,index);
      }else if(f.chilaCrouchStage==='hold'){
        f.chilaCrouchFrame=6+(Math.floor((t-f.chilaCrouchSince)/160)%2);
      }
    }else if(phase==='down'||phase==='hold'){
      const curr=phase==='hold'?6:(f.chilaCrouchFrame||0);
      f.chilaCrouchStage='up';f.chilaCrouchSince=t;
      f.chilaCrouchStartFrame=Math.max(8,Math.min(11,11-Math.round(curr*.57)));
      f.chilaCrouchFrame=f.chilaCrouchStartFrame;
    }else if(phase==='up'){
      const index=f.chilaCrouchStartFrame+Math.floor((t-f.chilaCrouchSince)/62);
      if(index>11){f.chilaCrouchStage=null;f.chilaCrouchFrame=11;}
      else f.chilaCrouchFrame=index;
    }
    // GUARD (held input): enter -> hold/impact -> release. Combat block Boolean untouched.
    const dp=f.chilaDefenseStage;
    const defenseBlocked=!groundedChila||attackActive||t<f.stunUntil||f.chilaJumpStage==='air'||f.chilaJumpStage==='prep';
    if(defenseBlocked){f.chilaDefenseStage=null;}
    else if(f.block){
      if(!dp){f.chilaDefenseStage='enter';f.chilaDefenseSince=t;f.chilaDefenseStartFrame=0;}
      else if(dp==='up'){
        f.chilaDefenseStage='enter';f.chilaDefenseSince=t;
        f.chilaDefenseStartFrame=Math.min(3,Math.max(0,11-(f.chilaDefenseFrame||11)));
      }
      if(f.chilaDefenseStage==='enter'){
        const frame=f.chilaDefenseStartFrame+Math.floor((t-f.chilaDefenseSince)/70);
        if(frame>=3){f.chilaDefenseStage='hold';f.chilaDefenseSince=t;f.chilaDefenseFrame=3;}
        else f.chilaDefenseFrame=frame;
      }else if(f.chilaDefenseStage==='hold'){
        // Full guard with a subtle breathing loop, never expose the relaxed pose.
        const order=[3,4,8,4];
        f.chilaDefenseFrame=order[Math.floor((t-f.chilaDefenseSince)/155)%order.length];
      }
    }else if(dp==='enter'||dp==='hold'){
      f.chilaDefenseStage='up';f.chilaDefenseSince=t;
      f.chilaDefenseFrame=9;
    }else if(dp==='up'){
      const index=9+Math.floor((t-f.chilaDefenseSince)/72);
      if(index>11){f.chilaDefenseStage=null;f.chilaDefenseFrame=11;f.chilaDefenseImpactAt=0;}
      else f.chilaDefenseFrame=index;
    }
  }
  if(f.characterId==='junin'){
    if(f.juninJumpStage==='air'&&f.y>=FLOOR&&f.vy===0){f.juninJumpStage='land';f.juninLandTime=t;}
    if(f.juninJumpStage==='land'&&t-f.juninLandTime>=180)f.juninJumpStage=null;
  }
  f.x=Phaser.Math.Clamp(f.x,55,W-55);
  if(f.attack&&t>f.attackUntil)f.attack=null;
 }
};

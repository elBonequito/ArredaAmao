import { W, H, FLOOR } from "../config/game.js";
import { CPU_DIFFICULTIES } from "../config/difficulties.js";
import { EMPTY_COMMAND } from "./commands.js";

// Métodos originais da v5.0 agrupados por responsabilidade, sem alterar o corpo da lógica.
export const inputMethods = {
 readCommands(f){
   if(f.controller==='cpu'){
     const c={...f.brain.command};
     // CPU usa o mesmo comando especial, por pulso (sem simular teclas).
     for(const key of ['jump','punch','kick','special'])f.brain.command[key]=false;
     return c;
   }
   const k=this.keys,one=f.controller==='p1';
   // Um especial por personagem; P1=Q, P2=P, independente da posição na arena.
   // Quando o segundo lutador é CPU, a função retorna acima e ignora P.
   return {
     left:(one?k.A:k.LEFT).isDown,right:(one?k.D:k.RIGHT).isDown,
     jump:Phaser.Input.Keyboard.JustDown(one?k.W:k.UP),
     crouch:(one?k.S:k.DOWN).isDown,guard:(one?k.H:k.O).isDown,
     punch:Phaser.Input.Keyboard.JustDown(one?k.F:k.K),
     kick:Phaser.Input.Keyboard.JustDown(one?k.G:k.L),
     special:Phaser.Input.Keyboard.JustDown(one?k.Q:k.P)
   };
 }
 // Infrequent decisions, configurable reaction delay and no foreknowledge of inputs.
,
 updateCPU(f,t){
   const brain=f.brain,cfg=CPU_DIFFICULTIES[this.difficulty],enemy=this.p[1-f.slot];
   if(!brain)return;
   const activeEnemyAttack=enemy.attack&&t<enemy.attackUntil?enemy.attack:null;
   if(activeEnemyAttack!==brain.seenAttack){
     brain.seenAttack=activeEnemyAttack;
     brain.observedAt=t;brain.guardUntil=0;brain.guardDecision=false;
   }
   const dist=Math.abs(enemy.x-f.x),dir=enemy.x>=f.x?1:-1;
   if(t<brain.nextDecision)return;
   const c=EMPTY_COMMAND();
   const reactable=!!activeEnemyAttack&&(t-brain.observedAt>=cfg.reaction+Phaser.Math.Between(0,95));
   const canAct=t>=f.stunUntil && t>=f.nextAttack && !f.jettaActive && !this.jetta;
   const fighting=f.y>=FLOOR-.5 && !f.juninJumpStage;
   const r=Math.random();
   // Non-perfect delayed response: quick punches can land before the CPU reacts.
   if(reactable&&fighting&&dist<180&&r<cfg.defend){
     c.guard=true;brain.guardUntil=t+Phaser.Math.Between(180,340);
     if(dist<110&&Math.random()<cfg.retreat){if(dir>0)c.left=true;else c.right=true;}
   }else if(t<brain.guardUntil){
     c.guard=true;
   }else if(t<brain.crouchUntil&&fighting){
     c.crouch=true;
   }else{
     const ideal= f.characterId==='junin'?115:105;
     const error=Phaser.Math.Between(-cfg.accuracy,cfg.accuracy);
     const wantDistance=ideal+error;
     if(dist>wantDistance+22){if(dir>0)c.right=true;else c.left=true;}
     else if(dist<wantDistance-37 && Math.random()<cfg.retreat){if(dir>0)c.left=true;else c.right=true;}
     else if(Math.random()<cfg.pause){ /* intentional thinking pause */ }
     if(canAct && fighting && dist<(f.characterId==='junin'?235:195)){
       const roll=Math.random();
       if(roll<cfg.attack && dist<156){
         c[Math.random()<.57?'punch':'kick']=true;c.left=false;c.right=false;
       }else if(roll<cfg.attack+cfg.special && t>=f.specialCooldown && !this.jetta){
         c.special=true;c.left=false;c.right=false;
       }else if(roll<cfg.attack+cfg.special+cfg.crouch){c.crouch=true;c.left=false;c.right=false;brain.crouchUntil=t+Phaser.Math.Between(460,820);}
       else if(roll<cfg.attack+cfg.special+cfg.crouch+cfg.jump){c.jump=true;}
     }else if(canAct&&fighting&&dist>=155&&dist<=410&&Math.random()<cfg.special && t>=f.specialCooldown && !this.jetta){
       c.special=true;c.left=false;c.right=false;
     }else if(canAct&&fighting&&Math.random()<cfg.jump*.22){c.jump=true;}
   }
   // Don't back into an arena wall forever.
   if(f.x<78)c.left=false;if(f.x>W-78)c.right=false;
   brain.command=c;
   brain.nextDecision=t+Phaser.Math.Between(cfg.decisionMin,cfg.decisionMax);
 }
};

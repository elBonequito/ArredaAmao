export const JUNIN_DEFENSE={scale:0.53,offsetY:1,
   enter:[0,1,2,3],hold:[3,5,6,7,8,9],impact:4,exit:[10,11,12,13],
   enterStep:70,holdStep:135,exitStep:75,impactMs:180};
// Returns a valid defense texture index, or null if a higher-priority state wins.
export function juninDefenseFrame(f,t,held,interrupted){
  if(interrupted){f.juninDefensePhase=null;f.juninDefenseImpactAt=0;return null;}
  let phase=f.juninDefensePhase;
  if(held){
    if(phase===null||phase===undefined){
      f.juninDefensePhase='enter';f.juninDefenseSince=t;f.juninDefenseEnterFrom=0;
    }else if(phase==='exit'){
      // Re-press during recovery: continue near the equivalent guard pose.
      const exitStep=Math.min(3,Math.floor((t-f.juninDefenseSince)/JUNIN_DEFENSE.exitStep));
      f.juninDefenseEnterFrom=Math.max(0,3-exitStep);
      f.juninDefensePhase='enter';f.juninDefenseSince=t;
    }
    if(f.juninDefensePhase==='enter'){
      const start=f.juninDefenseEnterFrom||0;
      const step=Math.floor((t-f.juninDefenseSince)/JUNIN_DEFENSE.enterStep);
      const pos=Math.min(3,start+step);
      if(start+step>=JUNIN_DEFENSE.enter.length){
        f.juninDefensePhase='hold';f.juninDefenseSince=t;
      }else return JUNIN_DEFENSE.enter[pos];
    }
    // One blocked attack triggers only one short reaction, then normal guard resumes.
    if(f.juninDefenseImpactAt>0 && t-f.juninDefenseImpactAt<JUNIN_DEFENSE.impactMs)
      return JUNIN_DEFENSE.impact;
    const k=Math.floor((t-f.juninDefenseSince)/JUNIN_DEFENSE.holdStep)%JUNIN_DEFENSE.hold.length;
    return JUNIN_DEFENSE.hold[k];
  }
  if(phase==='enter'||phase==='hold'){
    f.juninDefensePhase='exit';f.juninDefenseSince=t;
    phase='exit';
  }
  if(phase==='exit'){
    const idx=Math.floor((t-f.juninDefenseSince)/JUNIN_DEFENSE.exitStep);
    if(idx<JUNIN_DEFENSE.exit.length)return JUNIN_DEFENSE.exit[idx];
    f.juninDefensePhase=null;f.juninDefenseImpactAt=0;
  }
  return null;
}

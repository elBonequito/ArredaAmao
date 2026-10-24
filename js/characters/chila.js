// Corpo do Chila: os sprites de stance, caminhada, salto, agachamento e
// defesa foram desenhados com a mesma escala de cabeça/ombros no PNG original.
// O stance mede 348x436 em pixels nativos e aparece com 174x218 (scale=0.5).
// A mesma escala ISOTRÓPICA vale para TODOS os quadros dos outros três grupos.
// Nunca igualar o tamanho dos retângulos: o agachamento deve ficar mais baixo.
// O sprite já possui a mesma margem inferior transparente (~6 px nativos).
// A duração visual não altera o hit stun nem o knockback definidos pelo combate.
export const CHILA_PUNCH_HIT={animation:'chila-hit-reaction',fps:15,frames:12,duration:800};
export const CHILA_VISUAL={
  stance:{scale:.5,offsetX:0,offsetY:0},
  walk:{scale:.5,offsetX:0,offsetY:0},
  crouch:{scale:.5,offsetX:0,offsetY:0},
  jump:{scale:.5,offsetX:0,offsetY:0},
  defense:{scale:.5,offsetX:0,offsetY:0},
  hit:{scale:.5,offsetX:0,offsetY:0}
};

// Old punches, movement and specials retain their original balance.
// One proportional factor per animation group, never a per-frame resize.
export const GAUCHO_SCALE={preparacao:.88,concentracao:1.02,lancamento:1.035,recuperacao:1.0};
export const GAUCHO_PHASES=[['preparacao',9,90],['concentracao',6,100],['lancamento',6,83],['recuperacao',4,100]];
export const GAUCHO_COOLDOWN=4900;
// Junin's original guard sheet: 14 silhouettes (7 per row). Uniform proportional scale.

// Oito frames originais do Fight Stance. Não há sprites para outros movimentos.
// O sistema de combate permanece funcional; até chegar nova arte, todas as
// ações usam a mesma sequência idle, sem deformações nem sprites emprestados.
export const JULIO_ID='julio-mente-pensante';
export const JULIO_IDLE={animation:'julio-idle',texturePrefix:'julio_idle_',frames:8,fps:8,scale:0.50};

// Caminhada oficial por levitação, extraída dos 12 frames originais.
// Os 6 primeiros entram em suspensão uma só vez ao iniciar o deslocamento;
// os 6 últimos mantêm a flutuação. Posição vertical está no desenho,
// nunca na coordenada física, hitbox ou velocidade de movimento.
export const JULIO_FLOAT = Object.freeze({
  start: 'julio-float-start', walk: 'julio-walk', texturePrefix: 'julio_walk_',
  frames: 12, startFrames: 6, fps: 10, frameDurationMs: 100,
  scale: JULIO_IDLE.scale,
});

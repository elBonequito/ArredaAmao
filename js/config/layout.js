import { CANVAS_WIDTH, CANVAS_HEIGHT, VIEW_ZOOM, W, H } from './game.js';

/**
 * Configura a mesma área lógica 1920x1080 em TODAS as cenas.
 * O conteúdo preexistente ocupa o mundo 960x540; a câmera produz uma
 * apresentação proporcional de 2x. Somente a câmera faz a conversão.
 * Coordenadas de entrada do Phaser (inclusive áreas clicáveis) são
 * automaticamente convertidas para o mundo via getWorldPoint.
 */
export function configureSceneCamera(scene) {
  const camera = scene.cameras.main;
  camera.setViewport(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  camera.setZoom(VIEW_ZOOM);
  // Importante: centralizar usando o mundo original, nunca (960,540).
  // Com zoom 2 e viewport 1920x1080, o retângulo visível é (0,0)-(960,540).
  camera.centerOn(W / 2, H / 2);
  return camera;
}

/** Valores em coordenadas de MUNDO (960x540) para menu, HUD e arena.
 * O Phaser apresenta todos proporcionalmente em 1920x1080.
 */
export const UI_LAYOUT = Object.freeze({
  centerX: W / 2,
  centerY: H / 2,
  leftMargin: 24,
  rightMargin: W - 24,
  menu: Object.freeze({
    topBandHeight: 38,
    titleY: 82,
    subtitleY: 130,
    helpY: H - 26,
    mainButtonY: [233, 308],
    selectCardY: 292,
    selectPreviewFeetY: 349,
    selectNameY: 378,
    selectButtonY: 450,
    difficultyStartY: 218,
    difficultyStepY: 74,
    resultButtonY: [215, 291, 367],
  }),
  hud: Object.freeze({
    namesY: 17,
    barsY: 45,
    barWidth: 382,
    barHeight: 32,
    barInset: 5,
    timeY: 47,
    roundY: 18,
    announcementY: 225,
    detailY: 288,
    winsY: 92,
  }),
  stage: Object.freeze({
    // A imagem original do bar tem 1536x1024 (3:2). Crop vertical
    // conservador, não esticar para 16:9.
    topOffset: -30,
    darkBandHeight: 135,
  }),
});

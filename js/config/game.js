/**
 * Resolução lógica do canvas (Phaser): 1920x1080, sempre 16:9.
 *
 * O protótipo original simula a luta e desenha suas cenas em um mundo
 * 960x540. Mantemos as unidades desse mundo (incluindo FLOOR) para que
 * física, alcance, colisões, IA, projéteis e tempos NÃO sejam convertidos
 * duas vezes. A câmera apresenta o mundo com zoom 2, sem distorção.
 */
export const CANVAS_WIDTH = 1920;
export const CANVAS_HEIGHT = 1080;
export const W = 960;
export const H = 540;
export const FLOOR = 440;
export const VIEW_ZOOM = CANVAS_WIDTH / W;

if (CANVAS_HEIGHT / H !== VIEW_ZOOM) {
  throw new Error('Tela e mundo precisam conservar o mesmo fator de escala 16:9.');
}

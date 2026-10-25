/** Verificação estrutural sem bibliotecas externas: node tests/verificar_layout.mjs */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { CANVAS_WIDTH, CANVAS_HEIGHT, VIEW_ZOOM, W, H, FLOOR } from '../js/config/game.js';
import { configureSceneCamera, UI_LAYOUT } from '../js/config/layout.js';
import { CHARACTER_DATA, CHARACTER_ORDER } from '../js/config/characters.js';
import { ASSET_MANIFEST } from '../js/assets/manifest.js';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
let checked=0;
const ok=(condition,msg)=>{assert.ok(condition,msg);checked++;};

ok(CANVAS_WIDTH===1920 && CANVAS_HEIGHT===1080, 'canvas 1920x1080');
ok(W===960 && H===540 && FLOOR===440, 'mundo de combate mantido');
ok(VIEW_ZOOM===2,'zoom espacial uniforme');
ok(CANVAS_WIDTH/CANVAS_HEIGHT===W/H,'mesma proporção do mundo e da tela');

const camera={
  setViewport(x,y,width,height){Object.assign(this,{x,y,width,height});return this;},
  setZoom(zoom){this.zoom=zoom;return this;},
  // Mesmo cálculo de centerOn da BaseCamera 3.90.0.
  centerOn(x,y){this.scrollX=x-this.width/2;this.scrollY=y-this.height/2;return this;},
};
configureSceneCamera({cameras:{main:camera}});
ok(camera.width===1920 && camera.height===1080 && camera.zoom===2,'viewport/camera');
const worldX=camera.scrollX+(camera.width-camera.width/camera.zoom)/2;
const worldY=camera.scrollY+(camera.height-camera.height/camera.zoom)/2;
ok(worldX===0 && worldY===0,'camera cobre início do mundo');
ok(camera.width/camera.zoom===W && camera.height/camera.zoom===H,'área visível completa');
const toScreen=(x,y)=>[(x-worldX)*camera.zoom,(y-worldY)*camera.zoom];
const toWorld=(x,y)=>[x/camera.zoom+worldX,y/camera.zoom+worldY];
for(const pt of [[0,0],[480,270],[960,540],[270,FLOOR],[690,FLOOR],[24,45],[936,45]]){
  const screen=toScreen(...pt);const world=toWorld(...screen);
  ok(world[0]===pt[0] && world[1]===pt[1],`transformada ponteiro ${pt}`);
}

// FIT preserva 16:9 no navegador em todas as dimensões, com barras se necessário.
for(const [vw,vh] of [[1920,1080],[1366,768],[1024,768],[390,844],[844,390],[2560,1440]]){
  const ratio=Math.min(vw/CANVAS_WIDTH,vh/CANVAS_HEIGHT);
  const width=CANVAS_WIDTH*ratio,height=CANVAS_HEIGHT*ratio;
  ok(width<=vw+1e-5&&height<=vh+1e-5,`FIT sem cortes ${vw}x${vh}`);
  ok(Math.abs(width/height-16/9)<1e-9,`FIT 16:9 ${vw}x${vh}`);
}
ok(UI_LAYOUT.hud.barsY>0 && UI_LAYOUT.hud.barsY<H, 'HUD dentro da tela');
ok(UI_LAYOUT.menu.helpY<H, 'ajuda menu dentro da tela');
ok(UI_LAYOUT.stage.topOffset<=0, 'crop estágio preserva topo');

// Assets externos, somente PNGs existentes, sem duplicatas por chave.
const keys=new Set();
for(const [key,rel] of ASSET_MANIFEST){
  ok(!keys.has(key),`chave de textura duplicada ${key}`);
  keys.add(key);
  ok(fs.existsSync(path.join(root,rel)),`asset ausente ${key}`);
  ok(!rel.startsWith('/') && !rel.includes('data:'), `asset não relativo ${key}`);
}
for(const file of ['assets/ui/fundo_menu.png','assets/ui/logo_arreda.png',
 'assets/ui/logo_a_mao.png','assets/ui/tem_coragem.png',
 'assets/ui/toque_para_comecar.png','assets/ui/jogador_do_equinocio_intro_24.png',
 'assets/stages/barNovo.png']){
 ok(fs.existsSync(path.join(root,file)),`falta ${file}`);
}
ok(CHARACTER_ORDER.length===3,'três lutadores continuam selecionáveis');
for(const id of CHARACTER_ORDER)ok(!!CHARACTER_DATA[id],`lutador ${id} cadastrado`);

// Garantia estrutural: resolução não pode contaminar física ou regras.
for(const rel of ['js/combat/movement.js','js/combat/attacks.js','js/combat/specials.js',
 'js/controllers/input.js','js/config/difficulties.js','js/characters/chila.js',
 'js/characters/junin.js','js/characters/julio.js']){
 const source=fs.readFileSync(path.join(root,rel),'utf8');
 ok(!source.includes('CANVAS_WIDTH') && !source.includes('VIEW_ZOOM'),`simulação não escalonada duas vezes: ${rel}`);
}
console.log(`OK: ${checked} verificações de geometria, resolução, assets e simulação.`);
console.log(`Canvas ${CANVAS_WIDTH}x${CANVAS_HEIGHT}; mundo ${W}x${H}, zoom ${VIEW_ZOOM}; ${ASSET_MANIFEST.length} assets registrados; ${CHARACTER_ORDER.length} lutadores.`);

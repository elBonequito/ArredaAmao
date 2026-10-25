/** Testes de fluxos da interface sem baixar Phaser (não substituem o teste visual). */
import assert from 'node:assert/strict';
import { menuMethods } from '../js/ui/menu.js';
import { CHARACTER_ORDER } from '../js/config/characters.js';

let n=0;
const check=(truth,message)=>{assert.ok(truth,message);n++;};
function object(x=0,y=0,w=10,h=10){
  return {
    x,y,width:w,height:h,active:true,visible:true, _handlers:{},
    setDepth(){return this;},setInteractive(){return this;},
    setOrigin(){return this;},setStrokeStyle(){return this;},
    setFillStyle(){return this;},setColor(){return this;},
    setScale(){return this;},setDisplaySize(w2,h2){this.width=w2;this.height=h2;return this;},
    setText(s){this.text=s;this.width=s.length*11;return this;},
    setFontSize(z){this.fontSize=z;return this;},
    on(name,fn){this._handlers[name]=fn;return this;},destroy(){this.active=false;return this;},
  };
}
function mock(){
  const m={...menuMethods};
  m.time={now:10000};m.menuLockedUntil=0;m.p=[];m.hitEffects=new Set();
  m.add={
    rectangle(x,y,w,h){return object(x,y,w,h);},
    text(x,y,s){return {...object(x,y,s.length*10,30),text:s};},
    image(x,y){return object(x,y,160,200);},
  };
  m.textures={get(){return {getSourceImage(){return {width:340,height:500};}}}};
  m.clearRoundTimers=()=>{};m.cleanupJetta=()=>{};m.clearGauchoAll=()=>{};
  m.makeFighter=(id,x,controller,dir,slot)=>({characterId:id,name:id,x,controller,dir,slot,sprite:object(),g:object(),hp:100});
  m.drawHud=()=>{};m.startRound=()=>{m.state='fight';m.uiState=null;};
  m.selection={p1:null,p2:null};m.selectStep='p1';m.menuUI=[];m.menuButtons=[];
  m.difficulty='medio';m.wins=[0,0];m.mode='local';m.hud=null;
  return m;
}
const confirmed=(scene,index)=>{scene.highlightMenu(index);scene.menuLockedUntil=0;scene.time.now+=400;scene.confirmMenu();};
for(const mode of ['local','single']){
  for(const p1 of CHARACTER_ORDER){
    for(const p2 of CHARACTER_ORDER){
      const m=mock();
      m.showMainMenu();
      check(m.uiState==='menu'&&m.menuButtons.length===2,'menu principal com dois modos');
      confirmed(m,mode==='local'?1:0);
      check(m.uiState==='select'&&m.menuButtons.length===4,'seleção com 3 lutadores + voltar');
      const cards=m.menuUI.filter(x=>x.width>250&&x.height===260);
      check(cards.length===3 && cards.every((x)=>x.x-x.width/2>=0 && x.x+x.width/2<=960),'cartões dentro da tela');
      confirmed(m,CHARACTER_ORDER.indexOf(p1));
      check(m.selection.p1===p1&&m.selectStep==='p2','P1 selecionado');
      confirmed(m,CHARACTER_ORDER.indexOf(p2));
      if(mode==='single'){
        check(m.uiState==='difficulty'&&m.menuButtons.length===4,'escolha dificuldade');
        confirmed(m,1);
      }
      check(m.p.length===2&&m.p[0].characterId===p1&&m.p[1].characterId===p2,'personagens independentes');
      check(m.p[0].controller==='p1'&&m.p[1].controller===(mode==='single'?'cpu':'p2'),'controle correto por slot');
      check(m.uiState===null && m.state==='fight','partida lançada');
      m.wins=[2,0];
      m.showMatchResult();
      check(m.menuButtons.length===3&&m.uiState==='matchResult','resultado com 3 opções');
      confirmed(m,0);
      check(m.p[0].characterId===p1&&m.p[1].characterId===p2&&m.wins.every(x=>x===0),'revanche preserva seleção');
    }
  }
}
// Percorre todas as dificuldades, inclusive com Júlio na CPU.
for(const [idx,dificuldade] of ['facil','medio','dificil'].entries()){
  for(const adversario of CHARACTER_ORDER){
    const m=mock();
    m.showMainMenu();confirmed(m,0); // Single Player
    confirmed(m,0); // Chila P1
    confirmed(m,CHARACTER_ORDER.indexOf(adversario)); // CPU
    check(m.uiState==='difficulty','aguarda dificuldade');
    confirmed(m,idx);
    check(m.difficulty===dificuldade,'dificuldade selecionada');
    check(m.p[1].characterId===adversario&&m.p[1].controller==='cpu','CPU com adversário correto');
  }
}
console.log(`OK: ${n} verificações simuladas de menu, seleção, três personagens, três dificuldades de CPU, resultado e revanche.`);

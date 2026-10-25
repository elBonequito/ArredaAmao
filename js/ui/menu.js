import { W, H } from "../config/game.js";
import { CHARACTER_DATA, CHARACTER_ORDER } from "../config/characters.js";
import { JULIO_ID } from "../characters/julio.js";
import { CPU_DIFFICULTIES } from "../config/difficulties.js";

// Métodos originais da v5.0 agrupados por responsabilidade, sem alterar o corpo da lógica.
export const menuMethods = {
 cleanMenu(){
   for(const o of this.menuUI||[]){if(o&&o.active)o.destroy();}
   this.menuUI=[];this.menuButtons=[];this.menuIndex=0;
 }
,
 menuObject(o){this.menuUI.push(o);return o;}
,
 menuText(x,y,txt,sz=26,col='#ffffff',extra={}){
   return this.menuObject(this.add.text(x,y,txt,{fontFamily:'Arial',fontSize:sz+'px',fontStyle:'bold',color:col,stroke:'#120d16',strokeThickness:4,align:'center',...extra}).setOrigin(.5).setDepth(111));
 }
,
 menuBackdrop(title,subtitle){
   this.cleanMenu();
   this.menuObject(this.add.rectangle(W/2,H/2,W,H,0x090813,.93).setDepth(105));
   this.menuObject(this.add.rectangle(W/2,19,W,38,0x8f2429,.85).setDepth(106));
   this.menuText(480,82,title,47,'#f5d36d');
   this.menuText(480,130,subtitle,17,'#c6b9b1');
   this.menuText(480,514,'↑ ↓ / ← →: NAVEGAR    •    ENTER / ESPAÇO: CONFIRMAR    •    ESC: VOLTAR',15,'#99929b');
 }
,
 menuButton(label,x,y,w,cb,fontSize=22){
   const id=this.menuButtons.length;
   const back=this.menuObject(this.add.rectangle(x,y,w,53,0x1c1522,1).setStrokeStyle(2,0x75604a).setDepth(110).setInteractive({useHandCursor:true}));
   const text=this.menuText(x,y,label,fontSize,'#fff5d0');
   const b={back,text,cb};this.menuButtons.push(b);
   back.on('pointerover',()=>this.highlightMenu(id));
   back.on('pointerdown',()=>{if(this.time.now>=this.menuLockedUntil){this.highlightMenu(id);this.confirmMenu();}});
   this.highlightMenu(this.menuIndex);
 }
,
 highlightMenu(n){
   if(!this.menuButtons.length)return;
   this.menuIndex=(n+this.menuButtons.length)%this.menuButtons.length;
   this.menuButtons.forEach((b,i)=>{
     const on=i===this.menuIndex;
     b.back.setFillStyle(on?0x74401e:0x1c1522).setStrokeStyle(on?3:2,on?0xffdd75:0x75604a);
     b.text.setColor(on?'#ffe28b':'#fff5d0');
   });
 }
,
 confirmMenu(){
   if(this.time.now<this.menuLockedUntil)return;
   const b=this.menuButtons[this.menuIndex];if(!b)return;
   this.menuLockedUntil=this.time.now+170;
   b.cb();
 }
,
 handleMenuKey(event){
   const code=event.code;
   if(!this.uiState){
     if(code==='Escape'&&(this.state==='intro'||this.state==='fight'||this.state==='result')){this.showMainMenu();event.preventDefault();}
     return;
   }
   if(this.time.now<this.menuLockedUntil)return;
   if(['ArrowDown','KeyS','ArrowRight','KeyD'].includes(code)){this.highlightMenu(this.menuIndex+1);event.preventDefault();}
   else if(['ArrowUp','KeyW','ArrowLeft','KeyA'].includes(code)){this.highlightMenu(this.menuIndex-1);event.preventDefault();}
   else if(code==='Enter'||code==='Space'){this.confirmMenu();event.preventDefault();}
   else if(code==='Escape'||code==='Backspace'){this.backMenu();event.preventDefault();}
 }
,
 showMainMenu(){
   this.clearRoundTimers();this.cleanupJetta();this.clearGauchoAll();
   this.state='menu';this.uiState='menu';this.actionLockUntil=this.time.now+350;
   this.menuBackdrop('ARREDA A MÃO','UM CLÁSSICO DO BAR DO SERJÃO • ARCADE LOCAL');
   this.menuButton('SINGLE PLAYER',480,233,365,()=>{
      this.mode='single';this.selection={p1:null,p2:null};this.selectStep='p1';this.showCharacterSelect();
   });
   this.menuButton('MULTIPLAYER LOCAL',480,308,365,()=>{
      this.mode='local';this.selection={p1:null,p2:null};this.selectStep='p1';this.showCharacterSelect();
   });
   this.menuText(480,398,CHARACTER_ORDER.length+' LUTADORES  •  UM TECLADO  •  NENHUM ONLINE',19,'#d1bc9d');
 }
,
 showCharacterSelect(){
   this.state='menu';this.uiState='select';
   const whose=this.selectStep==='p1'?'P1':this.mode==='single'?'CPU':'P2';
   this.menuBackdrop('ESCOLHA O LUTADOR',whose+' — SELECIONE E CONFIRME');
   const pick=(id)=>{
     this.selection[this.selectStep==='p1'?'p1':'p2']=id;
     if(this.selectStep==='p1'){this.selectStep='p2';this.showCharacterSelect();}
     else if(this.mode==='single')this.showDifficulty();
     else this.launchMatch();
   };
   const roster=CHARACTER_ORDER;
   const cardWidth=Math.min(282,(W-45)/roster.length-17);
   for(const [idx,id] of roster.entries()){
     const x=W*(idx+.5)/roster.length;
     const char=CHARACTER_DATA[id];
     const plate=this.menuObject(this.add.rectangle(x,292,cardWidth,260,0x201b27,.9).setStrokeStyle(2,0xb99142).setDepth(109).setInteractive({useHandCursor:true}));
     const sprite=this.add.image(x,349,char.preview).setOrigin(.5,1).setDepth(110);
     // Original-sized portraits for Chila/Junin; proportional-only fit for Júlio.
     if(id===JULIO_ID){
       const tex=this.textures.get(char.preview).getSourceImage();
       sprite.setScale(Math.min(148/tex.width,176/tex.height));
     }else sprite.setDisplaySize(148,176);
     this.menuObject(sprite);
     this.menuText(x,378,char.name,id===JULIO_ID?17:20,'#f5d36d');
     this.menuButton(char.name,x,450,cardWidth-5,()=>pick(id),id===JULIO_ID?17:20);
     plate.on('pointerover',()=>this.highlightMenu(idx));
     plate.on('pointerdown',()=>{this.highlightMenu(idx);this.confirmMenu()});
     if(this.selection.p1===id)this.menuText(x-cardWidth/2+41,182,'P1 ✓',18,'#72e0ff');
   }
   this.menuButton('← VOLTAR',106,120,176,()=>this.backMenu());
   this.menuText(480,493,'MESMO PERSONAGEM EM AMBOS OS LADOS? PODE!',17,'#bbb0bd');
 }
,
 showDifficulty(){
   this.state='menu';this.uiState='difficulty';
   this.menuBackdrop('DIFICULDADE','P1: '+CHARACTER_DATA[this.selection.p1].name+'    VS    CPU: '+CHARACTER_DATA[this.selection.p2].name);
   ['facil','medio','dificil'].forEach((key,i)=>this.menuButton(CPU_DIFFICULTIES[key].name,480,218+i*74,350,()=>{this.difficulty=key;this.launchMatch()}));
   this.menuButton('← VOLTAR',106,120,176,()=>this.backMenu());
 }
,
 backMenu(){
   if(this.uiState==='select'){
     if(this.selectStep==='p2'){this.selectStep='p1';this.selection.p2=null;this.showCharacterSelect();}
     else this.showMainMenu();
   }else if(this.uiState==='difficulty'){this.selectStep='p2';this.showCharacterSelect();}
   else if(this.uiState==='matchResult')this.showMainMenu();
   else if(this.uiState==='menu')this.showMainMenu();
 }
,
 launchMatch(){
   this.clearRoundTimers();this.cleanupJetta();this.clearGauchoAll();
   this.cleanMenu();
   if(this.p)for(const f of this.p){if(f.sprite&&f.sprite.active)f.sprite.destroy();if(f.g&&f.g.active)f.g.destroy();}
   if(this.hud&&this.hud.active)this.hud.destroy();
   for(const field of ['hudNames','timeText','roundText','announcement','info']){
     const val=this[field];if(Array.isArray(val)){for(const obj of val)if(obj&&obj.active)obj.destroy();}
     else if(val&&val.active)val.destroy();
   }
   this.p=[this.makeFighter(this.selection.p1,270,'p1',1,0),
     this.makeFighter(this.selection.p2,690,this.mode==='single'?'cpu':'p2',-1,1)];
   this.wins=[0,0];this.round=1;this.drawHud();this.startRound();
 }
,
 showMatchResult(winner){
   this.state='match';this.uiState='matchResult';
   const win=this.wins[0]>this.wins[1]?0:1;
   this.menuBackdrop('FIM DE JOGO',this.p[win].name+' • '+(win===0?'P1':this.mode==='single'?'CPU':'P2')+' VENCEU!');
   this.menuButton('JOGAR NOVAMENTE',480,215,380,()=>this.launchMatch());
   this.menuButton('SELEÇÃO DE PERSONAGENS',480,291,380,()=>{
      this.selection={p1:null,p2:null};this.selectStep='p1';this.showCharacterSelect();
   });
   this.menuButton('MENU INICIAL',480,367,380,()=>this.showMainMenu());
 }
};

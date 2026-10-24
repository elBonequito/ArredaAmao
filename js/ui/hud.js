import { CPU_DIFFICULTIES } from "../config/difficulties.js";

// Métodos originais da v5.0 agrupados por responsabilidade, sem alterar o corpo da lógica.
export const hudMethods = {
 drawHud(){
    this.hud=this.add.graphics().setDepth(15);
    this.hudNames=[
      this.add.text(32,17,'',{fontSize:'21px',fontStyle:'bold',color:'#fff2c4',stroke:'#000',strokeThickness:4}).setDepth(16),
      this.add.text(928,17,'',{fontSize:'21px',fontStyle:'bold',color:'#fff2c4',stroke:'#000',strokeThickness:4}).setOrigin(1,0).setDepth(16)
    ];
    this.timeText=this.add.text(480,47,'75',{fontSize:'34px',fontStyle:'bold',color:'#ffe69b',stroke:'#000',strokeThickness:5}).setOrigin(.5).setDepth(16);
    this.roundText=this.add.text(480,18,'ROUND 1',{fontSize:'15px',color:'#fff'}).setOrigin(.5).setDepth(16);
    this.announcement=this.add.text(480,225,'',{fontSize:'49px',fontStyle:'bold',color:'#ffdb69',stroke:'#300a0a',strokeThickness:9,align:'center'}).setOrigin(.5).setDepth(20);
    this.info=this.add.text(480,288,'',{fontSize:'21px',color:'#fff',stroke:'#000',strokeThickness:4}).setOrigin(.5).setDepth(20);
    const a=this.p[0],b=this.p[1];
    this.hudNames[0].setText('P1 · '+a.name);
    this.hudNames[1].setText((b.controller==='cpu'?'CPU '+CPU_DIFFICULTIES[this.difficulty].name:'P2')+' · '+b.name);
 }
,
 paintHud(){let g=this.hud;g.clear();g.fillStyle(0x100b10,.95).fillRoundedRect(24,45,382,32,5).fillRoundedRect(554,45,382,32,5);g.fillStyle(0x5a141b).fillRect(29,50,372,22).fillRect(559,50,372,22);g.fillStyle(0xd9ad40).fillRect(29,50,372*this.p[0].hp/100,22).fillRect(931-372*this.p[1].hp/100,50,372*this.p[1].hp/100,22);g.lineStyle(2,0xf8e7a9).strokeRoundedRect(24,45,382,32,5).strokeRoundedRect(554,45,382,32,5);for(let i=0;i<2;i++)for(let n=0;n<this.wins[i];n++){g.fillStyle(0xf3d578).fillCircle(i?916-n*20:44+n*20,92,7)}}
,
 showHit(x,y,s,c){const txt=this.add.text(x,y,s,{fontSize:'22px',fontStyle:'bold',color:c,stroke:'#000',strokeThickness:4}).setOrigin(.5).setDepth(25);this.hitEffects.add(txt);this.tweens.add({targets:txt,y:y-38,alpha:0,duration:600,onComplete:()=>{this.hitEffects.delete(txt);if(txt.active)txt.destroy()}})}
,
 clearHitEffects(){if(!this.hitEffects)return;for(const txt of this.hitEffects){if(this.tweens.killTweensOf)this.tweens.killTweensOf(txt);if(txt.active)txt.destroy()}this.hitEffects.clear()}
};

import assert from 'node:assert/strict';
import {EventEmitter} from 'node:events';

class Elem {
 constructor(){this.hidden=false;this.textContent='';this.style={};this.dataset={};this.onclick=null;this.disabled=false;this.attrs={};this.clss=new Set();this.classList={add:(...xs)=>xs.forEach(x=>this.clss.add(x)),remove:(...xs)=>xs.forEach(x=>this.clss.delete(x)),contains:x=>this.clss.has(x)};}
 setAttribute(k,v){this.attrs[k]=v;}
}
const nodes = new Map();
globalThis.document={getElementById(id){if(!nodes.has(id))nodes.set(id,new Elem());return nodes.get(id);}};
const textures = new Set();
const queued = new Map();
class MockScene {
 constructor(opts){this.key=opts.key;this.textures={exists:key=>textures.has(key)};this.events=new EventEmitter();this.load=new EventEmitter();this.load.image=(key,url)=>queued.set(key,{key,src:url,type:'image'});this.load.spritesheet=(key,url,config)=>queued.set(key,{key,src:url,type:'spritesheet'});this.registry={_m:new Map(),get(k){return this._m.get(k)},set(k,v){this._m.set(k,v)}};this.time={delayedCall:(ms,cb)=>{this._delayed=[ms,cb];return {remove:()=>{}}}};this.scene={start:(key)=>{this.started=key},restart:()=>{this.restarted=true},isActive:(key)=>key==='BootScene'};}
}
globalThis.Phaser={Scene:MockScene,Scenes:{Events:{SHUTDOWN:'shutdown'}}};
const {BootScene,BOOT_TITLE_ASSETS}=await import(new URL('../js/scenes/BootScene.js',import.meta.url));
const {ASSET_MANIFEST}=await import(new URL('../js/assets/manifest.js',import.meta.url));
const {loadingView}=await import(new URL('../js/ui/loadingView.js',import.meta.url));

assert.equal(ASSET_MANIFEST.length,301);
assert.equal(BOOT_TITLE_ASSETS.length,5);
const boot = new BootScene();
boot.preload();
assert.equal(queued.size,307,'306 required + 1 optional');
assert.equal(loadingView.value,0);
const optional=queued.get('equinox_intro_24');
assert.ok(optional);
let already=0;
for(const [key,file] of queued){
 if(key==='equinox_intro_24') continue;
 textures.add(key);boot.load.emit('filecomplete',key,file.type,file);
 already++;
 assert.ok(loadingView.value<100,'must not show 100 during download');
}
assert.equal(already,306);
assert.equal(loadingView.value,99);
boot.create();
assert.equal(loadingView.value,100);
assert.equal(boot._delayed[0],500);
assert.equal(loadingView.title.textContent,'TÁ TUDO PRONTO PRA CONFUSÃO!');
boot._delayed[1]();
await new Promise(r=>setTimeout(r,330));
assert.equal(boot.started,'IntroScene');
assert.equal(loadingView.root.hidden,true);

// Retry: only missing file needs to be loaded again; no re-download of successful files.
textures.delete('chila_hit_3');
queued.clear();
const retry=new BootScene();
retry.preload();
assert.equal(queued.size,2,'one required + intro optional');
assert.equal(loadingView.value,99);
retry.load.emit('loaderror',queued.get('chila_hit_3'));
retry.create();
assert.equal(retry.started,undefined);
assert.equal(loadingView.title.textContent,'NÃO FOI POSSÍVEL CARREGAR O JOGO.');
assert.equal(loadingView.retry.hidden,false);
loadingView.retry.onclick();
assert.equal(retry.restarted,true);
retry.cleanup();

// After reload success, missing file repaired and optional can fail independently.
queued.clear();
const third=new BootScene();
third.preload();
assert.equal(queued.size,2);
textures.add('chila_hit_3');
third.load.emit('filecomplete','chila_hit_3');
third.load.emit('loaderror',queued.get('equinox_intro_24'));
third.create();
assert.equal(loadingView.value,100);
assert.equal(third.registry.get('equinoxOptionalUnavailable'),true);
assert.equal(third._delayed[0],500);
third.cleanup();
loadingView.clearTimers();
console.log('OK: 306 required files; progress never hits 100 early; success, retry, optional intro failure, transition.');

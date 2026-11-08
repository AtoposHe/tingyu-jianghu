/* Run the real game input/update code with a small DOM test double. */
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const map=require('../village-map.js'),Gathering=require('../gathering.js'),HeroRun=require('../hero-run.js'),JianghuStory=require('../story.js'),Martial=require('../martial.js'),Manuals=require('../manuals.js'),Forge=require('../forge.js'),ForestMap=require('../forest-map.js'),ForestGathering=require('../forest-resources.js');
async function run(){
  const elements=new Map(),events={},storage=new Map();let frame,now=0,context,battleReturn;
  const drawing=new Proxy({}, {get:()=>()=>{}});
  class Element {
    constructor(id=''){this.id=id;this.hidden=['#inventory','#cultivation','#smithy','#health','#doctor'].includes(id);this.children=[];this.dataset={};this.style={};this.tagName=id==='#game'?'CANVAS':'DIV';this.textContent='';this.classList={add(){},remove(){},toggle(){}};}
    addEventListener(name,cb){this[name]=cb;}setAttribute(k,v){this[k]=v;}focus(){context.document.activeElement=this;}
    append(...els){this.children.push(...els);}replaceChildren(...v){this.children=v;}getContext(){return drawing;}
    getBoundingClientRect(){return {left:0,top:0,width:1280,height:800};}querySelector(id){return element(id);}querySelectorAll(){return [];}
  }
  const element=id=>{if(!elements.has(id))elements.set(id,new Element(id));return elements.get(id);};
  class Image {set src(value){this.complete=true;this.naturalWidth=100;this.naturalHeight=100;Promise.resolve().then(()=>this.onload?.());}}
  context={console,Image,Gathering,HeroRun,JianghuStory,Martial,Manuals,ForestMap,ForestGathering,Forge:{...Forge,ForgeState:class extends Forge.ForgeState{constructor(storage){super(storage,()=>now);}}},VillageMap:map,devicePixelRatio:1,Math,Map,Set,Promise,Date,Number,
    localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v)},
    document:{activeElement:element('#game'),querySelector:element,createElement:()=>new Element(),createTextNode:text=>({textContent:text}),addEventListener(){}},
    addEventListener:(key,cb)=>events[key]=cb,requestAnimationFrame:cb=>{frame=cb;return 1;},cancelAnimationFrame(){},
    setTimeout:()=>1,clearTimeout(){},setInterval:()=>1,clearInterval(){},ResizeObserver:class{observe(){}},
    WeaponSprites:{load:()=>Promise.resolve(),drawHero(){}},SparringBattle:class{constructor(onReturn){this.active=false;battleReturn=onReturn;}},QSprites:{load:()=>Promise.resolve(),draw(){},drawImage(){}}
  };
  context.window=context;vm.createContext(context);
  vm.runInContext(fs.readFileSync(require.resolve('../inventory.js'),'utf8'),context);
  vm.runInContext(fs.readFileSync(require.resolve('../story-view.js'),'utf8'),context);
  vm.runInContext(fs.readFileSync(require.resolve('../cultivation.js'),'utf8'),context);
  vm.runInContext(fs.readFileSync(require.resolve('../smithy.js'),'utf8'),context);
  vm.runInContext(fs.readFileSync(require.resolve('../health.js'),'utf8'),context);
  vm.runInContext(fs.readFileSync(require.resolve('../game.js'),'utf8'),context);
  for(let i=0;i<15;i++)await Promise.resolve();assert.ok(frame,'Game initializes after all map pictures load');
  const advance=count=>{for(let i=0;i<count;i++){now+=1000/60;frame(now);}};
  const key=value=>events.keydown({key:value,preventDefault(){},repeat:false});
  key('f');advance(120);assert.equal(storage.has('tingyu-keepsakes-v1'),false,'Opening story blocks map collection');
  element('#story-enter').onclick();assert.equal(element('#story-opening').hidden,true);
  advance(120);assert.equal(storage.has('tingyu-keepsakes-v1'),false,'Standing near flowers never auto-collects');
  // Clicking the nearest flower likewise only selects/walks toward it.
  element('#game').pointerdown({clientX:600*.8,clientY:(880-20)*.8});advance(120);
  assert.equal(storage.has('tingyu-keepsakes-v1'),false,'Clicking and walking up to flowers never auto-collects');
  key('f');
  assert.equal(JSON.parse(storage.get('tingyu-keepsakes-v1')).counts.jasmine,1,'F immediately completes collection without waiting for any frame');
  key('f');advance(90);assert.equal(JSON.parse(storage.get('tingyu-keepsakes-v1')).counts.jasmine,1,'Repeated F cannot bypass cooldown');
  element('#game').pointerdown({clientX:616*.8,clientY:(952-20)*.8});advance(120);
  key('f');assert.equal(new Gathering(context.localStorage).total,2,'The second collection also finishes instantly');
  key('b');assert.equal(element('#inventory').hidden,false);assert.match(element('#bag-summary').textContent,/共 2 件/);
  key('f');assert.equal(new Gathering(context.localStorage).total,2,'F without right click must never discard');
  let prevented=false;element('#bag-grid').children[0].oncontextmenu({preventDefault(){prevented=true;}});
  assert.ok(prevented);assert.equal(element('#discard-menu').hidden,false);
  assert.equal(new Gathering(context.localStorage).total,2,'Right click only requests confirmation');
  key('Escape');assert.equal(element('#discard-menu').hidden,true);assert.equal(element('#inventory').hidden,false,'Esc first cancels pending discard');
  element('#bag-grid').children[0].oncontextmenu({preventDefault(){}});key('f');
  assert.equal(new Gathering(context.localStorage).total,1,'Right click followed by F removes exactly one item');
  assert.equal(element('#discard-menu').hidden,true);key('f');assert.equal(new Gathering(context.localStorage).total,1,'Holding or repeating F does not remove another item');
  key('Escape');assert.equal(element('#inventory').hidden,true);
  const reloaded=new Gathering(context.localStorage);assert.equal(reloaded.total,1,'Discarded inventory survives re-creation from saved data');
  element('#quest').click();advance(1500);
  assert.equal(element('#speaker-name').textContent,'老村长','Quest reaches the village chief at his new doorstep');
  assert.equal(element('#npc-identity').textContent,'老村长 · 村长');assert.equal(element('#npc-realm').textContent,'淬体二段');
  element('#close-dialogue').click();
  const nearbyFlower=Gathering.nodes.find(n=>n.id==='guestFlowers');
  element('#game').pointerdown({clientX:(map.elder.x+nearbyFlower.x)/2*.8,clientY:(map.elder.y+nearbyFlower.y)/2*.8});advance(180);
  assert.equal(element('#interaction').hidden,false,'Conversation takes priority beside the chief');
  assert.equal(element('#gather-prompt').hidden,true,'F prompt and E prompt are mutually exclusive when both actions are nearby');
  key('e');assert.equal(element('#speaker-name').textContent,'老村长');
  advance(500);element('#dialogue-next').click();advance(500);
  const clue=element('#choices').children.find(b=>b.textContent.includes('旧镖牌'));assert.ok(clue,'Village chief offers a main-story clue');clue.click();advance(500);element('#dialogue-next').click();
  assert.equal(new JianghuStory(context.localStorage).flags.chief,true,'Reading the chief clue advances the saved story');
  assert.match(element('#quest-text').textContent,/武馆/);
  element('#close-dialogue').click();
  battleReturn('yield');assert.equal(new JianghuStory(context.localStorage).flags.spar,false,'Yielding does not claim a completed spar');
  battleReturn('defeat',false);
  assert.equal(new JianghuStory(context.localStorage).flags.spar,false,'A defeat opens teaching rather than automatically granting a skill');
  assert.equal(element('#speaker-name').textContent,'武青山');
  assert.equal(element('#npc-identity').textContent,'武青山 · 武师');assert.equal(element('#npc-realm').textContent,'通脉五段');
  advance(500);element('#dialogue-next').click();advance(500);
  const lesson=element('#choices').children.find(b=>b.textContent.includes('学习推山掌'));assert.ok(lesson);lesson.click();
  assert.equal(new Martial.Progression(context.localStorage).learned,true,'Explicitly accepting the lesson saves both palm and meditation');
  assert.equal(new JianghuStory(context.localStorage).flags.spar,true);
  advance(500);const retry=element('#choices').children.find(b=>b.textContent.includes('再次请教'));assert.ok(retry);
  element('#close-dialogue').click();key('r');assert.equal(element('#cultivation').hidden,false,'R opens cultivation after teaching');
  key('Escape');assert.equal(element('#cultivation').hidden,true);
  battleReturn('defeat',true);assert.equal(new JianghuStory(context.localStorage).flags.practice,true,'A completed learned-skill rematch advances practice');
  advance(500);const gift=element('#choices').children.find(b=>b.textContent.includes('收下取剑凭条'));assert.ok(gift);gift.click();
  assert.equal(new Forge.ForgeState(context.localStorage).commission,true);advance(500);
  element('#choices').children.find(b=>b.textContent.includes('这就去铁铺')).click();advance(1500);
  assert.equal(element('#smithy').hidden,false,'Gift route reaches the smith at the left-facing forge door');
  element('#smithy-claim').onclick();assert.equal(new Forge.ForgeState(context.localStorage).claimed,true);assert.equal(element('#bag-gold').textContent,'50');assert.match(element('#bag-equipped').textContent,/青锋剑/);
  assert.equal(new JianghuStory(context.localStorage).flags.sword,true);key('Escape');key('b');
  assert.equal(element('#inventory').hidden,false);assert.match(element('#bag-summary').textContent,/共 2 件/);key('Escape');
  element('#outskirts-toggle').onclick();advance(1500);assert.equal(element('#game').dataset.map,'forest','The south road changes to an actual second map');
  assert.equal(element('#map-name').textContent,'听雨林');
  // Current camera is at x=0 near the western entrance; canvas covers the 1600x1100 world without letterboxing.
  element('#game').pointerdown({clientX:310*.8,clientY:(550-15)*.8});advance(1200);
  assert.equal(new Forge.ForgeState(context.localStorage).ores.iron,0,'Walking to a mine never auto-collects');key('f');assert.equal(new Forge.ForgeState(context.localStorage).ores.iron,1);key('f');assert.equal(new Forge.ForgeState(context.localStorage).ores.iron,1,'Repeated F respects persistent mine cooldown');
  element('#find-doctor').onclick();advance(1200);assert.equal(element('#doctor').hidden,false,'Doctor is reachable through the bamboo grove');
  assert.equal(element('#doctor-realm').textContent,'通脉二段');key('Escape');key('c');assert.equal(element('#health').hidden,false);
  element('#hero-name-input').value='听雨客';element('#hero-name-save').onclick();assert.equal(element('#map-hero-name').textContent,'听雨客');assert.equal(new Forge.ForgeState(context.localStorage).heroName,'听雨客');
  key('Escape');element('#outskirts-toggle').onclick();advance(1500);assert.equal(element('#game').dataset.map,'village','The north forest path returns to the village');
  console.log('PASS real input/update: instant F collection, prompt priority, chief route/dialogue, cooldown and saved inventory');
}
module.exports=run();

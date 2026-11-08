const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const scenes=require('../battle-scenes.js');
assert.equal(scenes.forOpponent('trainer').id,'dojo');
assert.equal(scenes.forOpponent('elder').id,'village');
assert.equal(scenes.forOpponent('unknown').id,'village');
assert.notEqual(scenes.forOpponent('trainer').src,scenes.forOpponent('elder').src);
for(const scene of Object.values(scenes.scenes))assert.ok(fs.existsSync(path.join(__dirname,'..',scene.src)));
for(const [w,h]of[[1200,350],[650,420],[360,390]]){
  const r=scenes.crop(2172,724,w,h,.68);
  assert.ok(r.sx>=0&&r.sy>=0&&r.sx+r.sw<=2172+.001&&r.sy+r.sh<=724+.001);
  assert.ok(Math.abs(r.sw/r.sh-w/h)<1e-10,'Cover crop preserves image geometry');
}
async function run(){
  const elements=new Map(),images=[];
  const c={};
  class Element{
    constructor(){this.children=[];this.dataset={};this.style={};this.classList={add(){},remove(){},toggle(){}};}
    querySelector(id){return el(id);}closest(){return el('frame');}getContext(){return c;}
    getBoundingClientRect(){return {width:1200,height:350};}setAttribute(){}addEventListener(){}focus(){}
    prepend(child){this.children.unshift(child);}
    replaceChildren(...children){this.children=children;}
  }
  const el=id=>{if(!elements.has(id))elements.set(id,new Element());return elements.get(id);};
  class Image{constructor(){images.push(this);}set src(v){this.path=v;}get src(){return this.path;}}
  const context={console,Image,Map,Object,Math,Promise,ResizeObserver:class{observe(){}},
    document:{querySelector:el,createElement:()=>new Element(),addEventListener(){}},
    QSprites:{load:()=>Promise.resolve(),height:275},BattleFX:class{},
    Forge:require('../forge.js'),Martial:require('../martial.js'),CombatRules:require('../combat-rules.js'),BattleMoves:require('../battle-moves.js'),
    requestAnimationFrame:()=>1,cancelAnimationFrame(){},devicePixelRatio:1,addEventListener(){}};
  context.window=context;vm.createContext(context);
  for(const file of ['battle-scenes.js','battle.js'])vm.runInContext(fs.readFileSync(path.join(__dirname,'..',file),'utf8'),context);
  const b=new context.SparringBattle(()=>{}),dojo=images.find(i=>i.src.includes('dojo-courtyard'));
  b.start('elder');const village=images.find(i=>i.src.includes('courtyard.svg'));
  const flush=async()=>{for(let i=0;i<12;i++)await Promise.resolve();};
  village.complete=true;village.naturalWidth=1280;village.naturalHeight=800;village.onload();await flush();
  assert.equal(b.scene.id,'village');assert.equal(b.background,village);assert.ok(b.sceneReady);
  dojo.complete=true;dojo.naturalWidth=2172;dojo.naturalHeight=724;dojo.onload();await flush();
  assert.equal(b.background,village,'A late previous scene must not overwrite the current opponent background');
  b.start();await flush();assert.equal(b.opponentId,'elder','Rematch remembers opponent');
  b.start('trainer');await flush();assert.equal(b.background,dojo);assert.equal(b.scene.id,'dojo');
  b.attack();assert.equal(b.motion.side,'hero');assert.equal(b.state.hero.hp,100);
  assert.equal(el('#battle-location').textContent,'听雨武馆 · 演武院');
  b.progression.recordBattle('defeat',false);b.progression.learn();b.start('trainer');await flush();
  b.attack('skill');assert.equal(b.motion.profile.id,'mountain','Learned hero palm uses the full skill animation and effects');
  b.hit();assert.equal(b.state.hero.mp,12);assert.equal(b.state.hero.guard,.6);assert.equal(b.state.enemy.hp,339);
  assert.ok(b.floaters.some(f=>f.text==='灵力 -8'));
  assert.equal(el('#skill-name').textContent,'推山掌');assert.equal(el('#skill-key').textContent,'2');
  b.motion=null;b.busy=false;b.state.phase='player';b.state.hero.mp=7;b.attack('skill');assert.equal(b.motion,null,'Low spirit must not begin an animation');
  b.equipment=new context.Forge.ForgeState();b.equipment.acceptCommission();b.equipment.claim();b.start('trainer');await flush();b.attack();
  assert.equal(b.motion.profile.id,'slash');assert.equal(b.state.hero.weaponId,'qingfeng');b.hit();assert.equal(b.state.enemy.hp,348);
  assert.equal(el('#attack-label').textContent,'基础劈砍');assert.match(el('#attack-hint').textContent,/青锋剑/);
  b.start('trainer');await flush();b.attack();b.last=1000;b.hitPause=.022;b.draw=()=>{};b.frame(1100);assert.ok(Math.abs(b.motion.t-.078)<1e-9,'Slow frames consume only the 22ms hit stop, not an entire frame or artificial slow motion');
  b.state.hero.hp=0;b.state.hero.mp=4;b.finish('defeat');assert.equal(b.state.hero.hp,b.state.hero.maxHp,'Real battle conclusion restores HP immediately');assert.equal(b.equipment.heroProfile(b.progression.hero).currentHp,b.progression.hero.maxHp);assert.equal(b.equipment.condition(b.progression.hero).symptoms[0].id,'bruise','A light sparring bruise is recorded separately from HP');b.start();assert.equal(b.state.hero.hp,b.state.hero.maxHp);assert.equal(b.state.hero.mp,4);
  console.log('PASS opponent scenes, async race protection, rematch, learned hero skill animation, impact cost/guard and insufficient-spirit input');
}
module.exports=run();

const assert=require('node:assert/strict'),Map=require('../forest-map.js'),F=require('../forge.js'),Gathering=require('../forest-resources.js');
for(const p of [...Map.mines,...Map.herbSpots,Map.doctor.talk,Map.portal]){assert.ok(Map.walkable(p.x,p.y),JSON.stringify(p));assert.ok(Map.findPath(Map.spawn,p).length,'All mines, herb sites, portal and clinic are reachable');}
assert.equal(Map.walkable(1200,480),true);assert.equal(Map.walkable(1100,540),false,'Deep water cannot be walked across');
assert.equal(Map.canStep({x:1030,y:550},{x:1190,y:550}),false,'Movement cannot tunnel across the stream between bridges');
let now=0,roll=0;const memory=new global.Map(),storage={getItem:k=>memory.get(k),setItem:(k,v)=>memory.set(k,v)};
const store=new F.ForgeState(storage,()=>now),herbs=new Gathering(store,()=>{roll++;return .2;});assert.equal(herbs.nodes().length,2);
const initial=herbs.nodes().map(n=>n.id);assert.equal(herbs.collect(initial[0]),true);assert.equal(herbs.collect(initial[0]),false);assert.equal(store.herbs.baizhi,1);
const before=roll,reload=new F.ForgeState(storage,()=>now),again=new Gathering(reload,()=>{throw Error('Reload must not reroll persistent herb sites');});assert.equal(roll,before);assert.deepEqual(again.nodes().map(n=>n.id),herbs.nodes().map(n=>n.id));
now=100000;assert.equal(herbs.tick(),false);now=250000;assert.equal(herbs.tick(),true);assert.ok(herbs.nodes().length<=4);assert.ok(herbs.nodes().length>=2);assert.equal(store.herbs.baizhi,1,'Spawning herbs never grants inventory until F collection');
console.log('PASS real forest navigation, creek barriers, all resource/clinic routes, random herb opportunities, persistent refresh and no auto collection');

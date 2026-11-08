const assert=require('node:assert/strict'),Map=require('../forest-map.js'),F=require('../forge.js'),Gathering=require('../forest-resources.js');
for(const p of [...Map.mines.map(n=>n.approach),...Map.herbSpots,Map.doctor.talk,Map.portal]){assert.ok(Map.walkable(p.x,p.y),JSON.stringify(p));assert.ok(Map.findPath(Map.spawn,p).length,'All mines, herb sites, portal and clinic are reachable');}
for(const n of Map.mines)assert.equal(Map.walkable(n.x,n.y-12),false,'Ore deposits are solid; stand beside them to mine');
assert.equal(Map.walkable(1140,540),false,'Deep water cannot be walked across');
assert.equal(Map.canStep({x:1040,y:550},{x:1240,y:550}),false,'Movement cannot tunnel across the stream between bridges');
for(const f of Map.fences){const x=(f[0]+f[2])/2,y=f[1];assert.equal(Map.walkable(x,y),false,'Every visible fence blocks feet');assert.equal(Map.canStep({x,y:y-35},{x,y:y+35}),false,'Fast input cannot tunnel through fences');}
assert.ok(Map.canStep({x:400,y:560},{x:400,y:620}),'Clinic gate has generous open space');
assert.equal(Map.walkable(100,470),false,'Dark dense forest floor is not an invisible shortcut');
for(const p of [...Map.mines.map(n=>n.approach),...Map.herbSpots,Map.doctor.talk,Map.portal]){let previous=Map.spawn;for(const step of Map.findPath(previous,p)){assert.ok(Map.canStep(previous,step),'Pathfinding shares movement collision');previous=step;}}
assert.equal(Map.walkable(1120,380),true,'Bridge deck is open');assert.equal(Map.walkable(1120,340),false,'Upper bridge rail blocks walking');assert.equal(Map.walkable(1120,420),false,'Lower bridge rail blocks walking');assert.equal(Map.walkable(1050,340),false,'Bridge rails also block on the dry bank');
let now=0,roll=0;const memory=new global.Map(),storage={getItem:k=>memory.get(k),setItem:(k,v)=>memory.set(k,v)};
const store=new F.ForgeState(storage,()=>now),herbs=new Gathering(store,()=>{roll++;return .2;});assert.equal(herbs.nodes().length,2);
const initial=herbs.nodes().map(n=>n.id);assert.equal(herbs.collect(initial[0]),true);assert.equal(herbs.collect(initial[0]),false);assert.equal(store.herbs.baizhi,1);
const before=roll,reload=new F.ForgeState(storage,()=>now),again=new Gathering(reload,()=>{throw Error('Reload must not reroll persistent herb sites');});assert.equal(roll,before);assert.deepEqual(again.nodes().map(n=>n.id),herbs.nodes().map(n=>n.id));
now=100000;assert.equal(herbs.tick(),false);now=250000;assert.equal(herbs.tick(),true);assert.ok(herbs.nodes().length<=4);assert.ok(herbs.nodes().length>=2);assert.equal(store.herbs.baizhi,1,'Spawning herbs never grants inventory until F collection');
console.log('PASS real forest navigation, creek barriers, all resource/clinic routes, random herb opportunities, persistent refresh and no auto collection');

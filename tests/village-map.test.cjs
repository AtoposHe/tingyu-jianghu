const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const map=require('../village-map.js');
for(const src of Object.values(map.assets))assert.ok(fs.existsSync(path.join(__dirname,'..',src)),src);
for(const p of [map.spawn,map.elder,map.trainer])assert.ok(map.walkable(p.x,p.y),'Spawn and NPCs must stand on reachable ground');
assert.equal(map.surfaceAt(map.trainer.x,map.trainer.y).height,88);
assert.equal(map.surfaceAt(648,280).height,72);
assert.equal(map.walkable(810,700),false,'The creek cannot be crossed away from the bridge');
assert.equal(map.walkable(370,220),false,'The inn footprint blocks feet');
assert.equal(map.canStep({x:650,y:295},{x:650,y:392}),false,'The terrace retaining wall cannot be crossed');
assert.equal(map.canStep({x:552,y:415},{x:552,y:295}),true,'The inn stairs connect the two elevations');
assert.equal(map.canStep({x:1208,y:420},{x:1208,y:285}),true,'The training stairs connect the two elevations');
const destinations=[map.elder.talk,map.trainer.talk,{x:648,y:280},{x:104,y:275},{x:1096,y:760}];
for(const target of destinations) {
  const route=map.findPath(map.spawn,target);assert.ok(route.length,JSON.stringify(target));
  let previous=map.spawn;
  for(const p of route){assert.ok(map.walkable(p.x,p.y));assert.ok(map.canStep(previous,p),'Each A* segment must obey cliffs and water');previous=p;}
  assert.ok(Math.hypot(previous.x-target.x,previous.y-target.y)<24);
}
const crossing=map.findPath(map.spawn,map.trainer.talk);
assert.ok(crossing.some(p=>p.x>750&&p.x<930&&p.y>414&&p.y<493),'Reaching the trainer must cross the arched bridge');
assert.ok(crossing.some(p=>map.surfaceAt(p.x,p.y).stairs),'Reaching the trainer must climb stairs');
assert.ok(map.findPath(map.spawn,{x:104,y:275}).some(p=>map.surfaceAt(p.x,p.y).id==='westSlope'),'West alley ramp is a second route to the inn terrace');
// Exercise actual sub-cell movement, including route starts between grid centers.
for(const fps of [30,60]) {
  let position={...map.spawn};
  for(const target of [map.trainer.talk,map.elder.talk,{x:648,y:280},map.spawn]) {
    const route=map.findPath(position,target);assert.ok(route.length);
    let frames=0;
    while(route.length&&frames++<2000) {
      while(route.length&&Math.hypot(route[0].x-position.x,route[0].y-position.y)<.1)route.shift();
      if(!route.length)break;
      const next=route[0],dx=next.x-position.x,dy=next.y-position.y,d=Math.hypot(dx,dy);
      const step=Math.min(d,172/fps*map.surfaceAt(position.x,position.y).speed);
      const moved={x:position.x+dx/d*step,y:position.y+dy/d*step};
      assert.ok(map.canStep(position,moved),'Continuous motion must not catch on bridge corners or stair edges');
      position=moved;
    }
    assert.equal(route.length,0);assert.ok(Math.hypot(position.x-target.x,position.y-target.y)<24);
    position={x:position.x+1.2,y:position.y+.7};
  }
}
console.log('PASS map assets, placements, cliffs, bridge, both stairs, slope and NPC path reachability');

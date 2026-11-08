const assert=require('node:assert/strict');
const Gathering=require('../gathering.js');const map=require('../village-map.js');
let value=null,now=100000;const storage={getItem:()=>value,setItem:(key,v)=>{value=v;}};
const g=new Gathering(storage,()=>now),node=Gathering.nodes[0];
assert.equal(g.total,0);assert.equal(g.collect(node),true);assert.equal(g.total,1);
assert.equal(g.collect(node),false,'Same flower cannot be collected twice during cooldown');
const restored=new Gathering(storage,()=>now);assert.equal(restored.total,1);assert.equal(restored.remaining(node),60);
now+=61000;assert.equal(restored.collect(node),true);assert.equal(restored.total,2);
assert.equal(restored.collect({...node}),false,'Unknown resource instances are rejected');
const regen=restored.remaining(node);
assert.equal(restored.discard('jasmine',0),false);assert.equal(restored.discard('jasmine',3),false);assert.equal(restored.discard('missing'),false);
assert.equal(restored.discard('jasmine'),true);assert.equal(restored.total,1);assert.equal(restored.remaining(node),regen,'Discard does not reset flower cooldown');
assert.equal(new Gathering(storage,()=>now).total,1);
assert.equal(restored.discard('jasmine'),true);assert.equal(restored.counts.jasmine,undefined,'Empty stack is removed');
const broken=new Gathering({getItem:()=>'{bad',setItem:()=>{throw Error('blocked');}},()=>now);
assert.equal(broken.total,0);assert.equal(broken.collect(node),true);assert.equal(broken.saved,false);
for(const n of Gathering.nodes){assert.ok(map.walkable(n.x,n.y),n.id);assert.ok(map.findPath(map.spawn,n).length,n.id);}
assert.deepEqual(Object.keys(Gathering.items).sort(),['jasmine','lotus','osmanthus']);
console.log('PASS flower inventory, cooldowns, persistence, malformed data, storage failure and reachability');

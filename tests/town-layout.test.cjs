const assert=require('node:assert/strict');
const map=require('../village-map.js');
const house=map.props.find(p=>p.id==='guesthouse'),forge=map.props.find(p=>p.id==='smithy');
assert.equal(house.label,'村长家');
assert.deepEqual(house.box,[1000,510,235,230],'Only the guesthouse name changes; its image position remains fixed');
assert.equal(forge.label,'溪南铁铺');
assert.ok(forge.box[0]>1300&&forge.box[0]+forge.box[2]<=map.width,'Forge is placed along the east boundary');
assert.equal(map.assets.smithy,'assets/town/smithy-left.png');
assert.ok(map.elder.x>house.box[0]&&map.elder.x<house.box[0]+house.box[2]);
assert.ok(map.elder.y>house.depth&&map.elder.y-house.depth<60,'Chief stands in front of the actual house');
for(const target of [map.elder,map.elder.talk,{x:1376,y:632}]){
  assert.ok(map.walkable(target.x,target.y));
  assert.ok(map.findPath(map.spawn,target).length,'Chief and left-facing forge entrance remain reachable');
}
assert.equal(map.props.filter(p=>p.label==='村长家').length,1);
console.log('PASS correct house label, fixed house position, east-side forge and chief doorstep');

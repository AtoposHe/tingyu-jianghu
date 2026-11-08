const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const sprites=require('../sprites.js');
assert.equal(Object.keys(sprites.data).filter(key=>!key.startsWith('heroRun')).length,8);
assert.equal(Object.keys(sprites.data).filter(key=>key.startsWith('heroRun')).length,8);
for(const [key,frame] of Object.entries(sprites.data)) {
  assert.ok(fs.existsSync(path.join(__dirname,'..',frame.src)));
  const [x,y,w,h]=frame.box;
  assert.ok(x>=0&&y>=0&&w>0&&h>0&&x+w<=frame.size[0]&&y+h<=frame.size[1]);
  const area=frame.cell?frame.cell[2]*frame.cell[3]:frame.size[0]*frame.size[1];
  assert.ok(frame.transparentPixels>area*.05);
  const g=sprites.geometry(key,275);
  if(frame.cell) {
    const [cx,cy,cw,ch]=frame.cell;
    assert.ok(x>=cx&&y>=cy&&x+w<=cx+cw&&y+h<=cy+ch,'A run pose must not sample adjacent cells');
    assert.ok(Math.abs(g.dh/h-275/frame.referenceHeight)<1e-12,'Run frames share one scale instead of stretching airborne poses');
    assert.ok(Math.abs(g.dy+g.dh)<22,'Boots remain close to the fixed ground anchor');
  } else {
    assert.ok(Math.abs(g.dh-275)<.001);
    assert.ok(Math.abs(g.dy+g.dh)<.001,'Standing feet must rest at local y=0');
  }
}
assert.equal(sprites.chooseFrame('hero'),'heroIdle');
assert.equal(sprites.chooseFrame('hero',{attacking:true,progress:.1,hitAt:.47}),'heroWindup');
assert.equal(sprites.chooseFrame('hero',{attacking:true,progress:.47,hitAt:.47}),'heroAttack');
assert.equal(sprites.chooseFrame('hero',{hit:true,attacking:true,progress:.47,hitAt:.47}),'heroHit');
assert.equal(sprites.chooseFrame('enemy',{attacking:true,progress:.57,hitAt:.57,action:'skill'}),'enemyPalm');
assert.equal(sprites.chooseFrame('enemy',{attacking:true,progress:.43,hitAt:.43,action:'normal'}),'enemyAttack');
assert.equal(sprites.chooseFrame('enemy',{hit:true}),'enemyHit');
assert.equal(sprites.chooseFrame('enemy',{attacking:true,progress:.98,hitAt:.43,action:'normal'}),'enemyIdle');
console.log('PASS 8 battle poses + 8 run cells, alpha, shared run scale, ground alignment and battle selection');

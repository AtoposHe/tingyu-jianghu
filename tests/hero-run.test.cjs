const assert=require('node:assert/strict');
const HeroRun=require('../hero-run.js');
const run=new HeroRun();
assert.equal(run.blend,0);
const visited=new Set();let steps=0;
for(let i=0;i<64;i++) {
  visited.add(run.frame);run.update(HeroRun.STRIDE/64,1/60);steps+=run.footfalls;
}
assert.equal(visited.size,8,'A full stride must visit all eight poses');
assert.equal(steps,2,'Each stride has two ground contacts');
assert.equal(run.phase,0,'The cycle loops without an extra duplicate frame');
assert.equal(run.blend,1);
run.update(13,.02);const phase=run.phase;
run.update(0,.03);
assert.equal(run.phase,phase,'Held input with no actual displacement must not advance gait');
assert.equal(run.footfalls,0);
assert.ok(run.blend<1,'Stopping must begin returning to idle');
run.update(0,.1);assert.equal(run.blend,0);assert.equal(run.phase,0);
run.update(13,.02);assert.equal(run.frame,'heroRun1','A fresh run starts from a stable first contact');
run.reset();assert.equal(run.moving,false);assert.equal(run.blend,0);
const fast=new HeroRun(),slow=new HeroRun();
for(let i=0;i<60;i++)fast.update(172/60,1/60);
for(let i=0;i<30;i++)slow.update(172/30,1/30);
assert.ok(Math.abs(fast.phase-slow.phase)<1e-12,'Gait must follow travel equally at 30 and 60 fps');
console.log('PASS run cycle, foot contacts, blocked/stopped movement, restart and frame-rate independence');

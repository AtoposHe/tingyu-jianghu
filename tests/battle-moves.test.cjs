const assert=require('node:assert/strict');
const moves=require('../battle-moves.js');

for(const profile of Object.values(moves.profiles)) {
  for(let i=0;i<=100;i++) {
    const pose=moves.sample(profile,i/100);
    for(const n of Object.values(pose))assert.ok(Number.isFinite(n)&&n>=0&&n<=1);
  }
  assert.equal(moves.sample(profile,0).travel,0);
  assert.equal(moves.sample(profile,1).travel,0);
  assert.equal(moves.sample(profile,profile.hitAt).punch,1);
}
assert.ok(moves.sample(moves.profiles.mountain,.2).charge>0);
assert.equal(moves.sample(moves.profiles.straight,.2).charge,0);
assert.equal(moves.sample(moves.profiles.jab,.2).palm,0);
assert.ok(moves.profiles.mountain.knockback>moves.profiles.straight.knockback);
assert.notEqual(moves.profiles.jab.hitAt,moves.profiles.straight.hitAt);
console.log('PASS finite poses, contact timing, palm charge and distinct reactions');

assert.ok(moves.profiles.slash.duration<.8);assert.ok(moves.profiles.slash.duration*moves.profiles.slash.hitAt<.3,"A sword lands within 300 ms rather than a slow one-second wind-up");

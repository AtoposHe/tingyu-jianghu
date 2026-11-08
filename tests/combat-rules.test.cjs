/* Run with: node tests/combat-rules.test.cjs */
const assert = require('node:assert/strict');
const rules = require('../combat-rules.js');
let checks = 0;
function test(name, run) { run(); checks++; console.log('PASS', name); }

test('Player attacks first; early enemy action is rejected without mutation', () => {
  const state=rules.create(), before=JSON.stringify(state);
  assert.throws(()=>rules.resolve(state,'enemy','normal'));
  assert.equal(JSON.stringify(state),before);
});
test('Unlearned hero skill cannot consume energy or deal damage', () => {
  const state=rules.create(), before=JSON.stringify(state);
  assert.throws(()=>rules.resolve(state,'hero','skill'));
  assert.equal(JSON.stringify(state),before);
});
test('Punch builds mana and hands over turn; duplicate attack is rejected', () => {
  const state=rules.create();
  const hit=rules.resolve(state,'hero','normal');
  assert.equal(state.enemy.hp,98);assert.equal(state.hero.mp,20);
  assert.equal(hit.mpChange,10);assert.equal(state.phase,'enemy');
  assert.throws(()=>rules.resolve(state,'hero','normal'));
  rules.resolve(state,'enemy',rules.enemyAction(state));
  assert.equal(state.hero.hp,86);assert.equal(state.enemy.mp,38);
  assert.equal(state.round,2);assert.equal(state.phase,'player');
});
test('NPC chooses skill on round two; the palm consumes 20 mana', () => {
  const state=rules.create();
  rules.resolve(state,'hero','normal');rules.resolve(state,'enemy','normal');
  rules.resolve(state,'hero','normal');
  assert.equal(rules.enemyAction(state),'skill');
  const hit=rules.resolve(state,'enemy','skill');
  assert.equal(hit.mpChange,-20);assert.equal(state.enemy.mp,18);assert.equal(state.hero.hp,66);
});
test('Not enough mana forbids skills and falls back to a normal reply', () => {
  const state=rules.create();state.phase='enemy';state.round=2;state.enemy.mp=19;
  assert.equal(rules.enemyAction(state),'normal');
  const before=JSON.stringify(state);
  assert.throws(()=>rules.resolve(state,'enemy','skill'));
  assert.equal(JSON.stringify(state),before);
});
test('Spirit is capped; lethal damage is clamped; a defeated NPC cannot reply', () => {
  const state=rules.create();state.hero.mp=58;state.enemy.hp=3;
  const hit=rules.resolve(state,'hero','normal');
  assert.equal(state.hero.mp,60);assert.equal(hit.mpChange,2);
  assert.equal(hit.damage,3);assert.equal(state.enemy.hp,0);assert.equal(state.phase,'victory');
  assert.throws(()=>rules.resolve(state,'enemy','normal'));
});
test('Player defeat ends the fight and rejects subsequent attacks', () => {
  const state=rules.create();state.phase='enemy';state.hero.hp=1;
  rules.resolve(state,'enemy','normal');
  assert.equal(state.hero.hp,0);assert.equal(state.phase,'defeat');
  assert.throws(()=>rules.resolve(state,'hero','normal'));
});
test('Complete fight reaches victory in six rounds, with two NPC skills', () => {
  const state=rules.create();let skills=0;
  while(state.phase==='player') {
    rules.resolve(state,'hero','normal');
    if(state.phase==='enemy') {
      const action=rules.enemyAction(state);if(action==='skill')skills++;
      rules.resolve(state,'enemy',action);
    }
  }
  assert.equal(state.phase,'victory');assert.equal(state.round,6);
  assert.equal(state.hero.hp,18);assert.equal(state.hero.mp,60);assert.equal(skills,2);
  const replay=rules.create();assert.equal(replay.hero.hp,100);assert.equal(replay.hero.mp,10);assert.equal(replay.enemy.hp,120);
});
console.log(`${checks} combat checks passed.`);

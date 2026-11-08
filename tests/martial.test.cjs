const assert=require('node:assert/strict'),M=require('../martial.js');
const memory=new Map(),storage={getItem:k=>memory.get(k),setItem:(k,v)=>memory.set(k,v)};
const p=new M.Progression(storage);
assert.equal(p.hero.maxMp,20);assert.equal(p.hero.maxHp,100);assert.equal(p.hero.realmName,'淬体一重');
assert.equal(p.learn(),false);assert.equal(p.meditate(600),false);assert.equal(p.cultivation,0);
p.recordBattle('yield',false);assert.equal(p.needsLesson,false);
p.recordBattle('defeat',false);assert.ok(p.needsLesson);assert.ok(p.learn());assert.equal(p.learn(),false);
p.meditate(119);assert.equal(p.hero.maxMp,20);assert.equal(p.hero.maxHp,100);
p.meditate(1);assert.equal(p.hero.maxMp,21);assert.equal(p.hero.maxHp,102);assert.equal(p.hero.level,0);
p.meditate(479);assert.equal(p.hero.level,0);p.meditate(1);
assert.equal(p.hero.level,1);assert.equal(p.hero.maxMp,28);assert.equal(p.hero.maxHp,122);
assert.equal(p.hero.attack,22);assert.equal(p.hero.defense,6);assert.equal(p.hero.required,1200);
p.recordBattle('defeat',true);p.save();const reload=new M.Progression(storage);assert.equal(reload.cultivation,600);assert.equal(reload.learned,true);assert.equal(reload.practiced,true);
assert.equal(new M.Progression(storage).cultivation,600,'No Date-based offline cultivation is awarded');
for(const id of Object.keys(M.people)){const person=M.person(id);assert.deepEqual({...person,...M.stats(person.cultivation)},person,'All villagers use the same formulas');}
let last=M.stats(0);for(let seconds=1;seconds<=M.MAX_CULTIVATION;seconds++){
 const next=M.stats(seconds);for(const key of ['maxHp','maxMp','attack','defense','regen','level'])assert.ok(next[key]>=last[key],`${key} must never decrease at a breakthrough`);last=next;
}
assert.equal(last.realmName,'宗师三重');assert.equal(last.required,0);
p.meditate(1e8);assert.equal(p.cultivation,M.MAX_CULTIVATION);assert.equal(p.hero.nextSpirit,0);
assert.equal(p.meditate(NaN),false);assert.equal(p.meditate(-10),false);
assert.equal(M.stats(-1).maxMp,20);assert.equal(M.stats(Infinity).maxMp,20);
assert.doesNotThrow(()=>new M.Progression({getItem(){throw Error();},setItem(){throw Error();}}).save());
const bad=new M.Progression({getItem:()=>JSON.stringify({cultivation:-100,learned:true,practiced:true})});assert.equal(bad.learned,false);assert.equal(bad.cultivation,0);
console.log('PASS slow growth, increasing realm times, monotone shared stats, learning gates, save restore, cap and unavailable/corrupt storage');

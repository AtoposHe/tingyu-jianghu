const assert=require('node:assert/strict'),M=require('../martial.js');
const memory=new Map(),storage={getItem:k=>memory.get(k),setItem:(k,v)=>memory.set(k,v)};
const p=new M.Progression(storage);assert.equal(p.hero.maxMp,20);assert.equal(p.hero.maxHp,100);assert.equal(p.hero.realmName,'淬体二段');
assert.equal(p.meditate(600),false);assert.equal(p.learn(),false);p.recordBattle('yield',false);assert.equal(p.needsLesson,false);
p.recordBattle('defeat',false);assert.ok(p.learn());assert.deepEqual(p.manualIds,['breathing','mountain']);
p.meditate(119);assert.equal(p.spirit,20);p.meditate(1);assert.equal(p.spirit,21);assert.equal(p.hero.maxHp,102);assert.equal(p.hero.realmName,'淬体三段');
// Every realm has ten equal spirit spans; shared endpoints stay in the old realm until breakthrough.
for(let rank=0;rank<M.realms.length;rank++){
 const r=M.realms[rank];assert.equal(M.stats(r.max,rank).realmName,r.name+'十段');
 assert.equal(M.stats(r.min,rank).segment,1);
 const width=(r.max-r.base)/10;
 for(let stage=1;stage<=10;stage++){const spirit=Math.max(r.min,Math.floor(r.base+width*(stage-.5)));assert.equal(M.stats(spirit,rank).segment,stage);}
 if(rank<5)assert.equal(M.stats(r.max,rank+1).realmName,M.realms[rank+1].name+'一段');
}
assert.equal(M.stats(100).realmName,'淬体十段');assert.equal(M.stats(101).realmName,'通脉一段');
assert.equal(M.stats(200).realmName,'通脉十段');assert.equal(M.stats(10000).realmName,'宗师十段');assert.equal(M.stats(10001).realmName,'无号宗师');
for(let spirit=1;spirit<12000;spirit++){const h=M.stats(spirit),next=M.stats(spirit+1);for(const key of ['maxMp','maxHp','attack','defense','regen'])assert.ok(next[key]>=h[key]);}
for(const id of Object.keys(M.people)){const a=M.person(id);assert.equal(a.maxMp,M.people[id].spirit);assert.equal(a.maxHp,M.stats(a.maxMp).maxHp);}
p.meditate(1e6);assert.equal(p.spirit,100);assert.equal(p.hero.realmName,'淬体十段');assert.equal(p.blocked,true);assert.equal(p.practiceProgress,0);
const time=p.cultivation;p.meditate(9999);assert.equal(p.cultivation,time,'No overflow cultivation is banked at a barrier');assert.equal(p.completeBreakthrough('breakthrough-0'),false,'Unimplemented quests cannot be skipped');
p.save();const reloaded=new M.Progression(storage);assert.equal(reloaded.spirit,100);assert.equal(reloaded.blocked,true);assert.deepEqual(reloaded.manualIds,p.manualIds);
for(let rank=0;rank<6;rank++){
 const state={spirit:M.realms[rank].max,manualIds:['breathing'],methodId:'breathing',completedBreakthroughs:M.gates.slice(0,rank).map(g=>g.id)};
 const atGate=new M.Progression({getItem:k=>k.endsWith('v2')?JSON.stringify(state):null,setItem(){}});
 assert.equal(atGate.gate.id,M.gates[rank].id);assert.equal(atGate.meditate(1200),false);assert.equal(atGate.spirit,state.spirit);
}
const titledData={spirit:10001,manualIds:['breathing'],methodId:'breathing',completedBreakthroughs:M.gates.map(g=>g.id)};
let saved;const titled=new M.Progression({getItem:k=>k.endsWith('v2')?JSON.stringify(titledData):null,setItem:(k,v)=>saved=v});
assert.equal(titled.setTitle('听雨'),true);assert.equal(titled.hero.realmName,'听雨宗师');assert.equal(titled.setTitle('<script>'),false);
assert.equal(titled.setTitle(''),false);assert.equal(titled.setTitle('一二三四五六七八九十十一十二'),false);
assert.equal(new M.Progression({getItem:k=>k.endsWith('v2')?saved:null}).hero.realmName,'听雨宗师');assert.equal(p.setTitle('听雨'),false);
const legacy=new M.Progression({getItem:k=>k.endsWith('v1')?JSON.stringify({cultivation:600,firstDefeat:true,learned:true,practiced:true}):null,setItem(){}});
assert.equal(legacy.spirit,28,'Old spirit and learned books survive migration');assert.equal(legacy.methodId,'breathing');assert.ok(legacy.practiced);
assert.equal(p.selectMethod('creek'),false);assert.equal(p.learnManual('creek'),true);assert.equal(p.learnManual('creek'),false);
const fresh=new M.Progression();fresh.recordBattle('defeat',false);fresh.learn();fresh.meditate(60);fresh.learnManual('creek');fresh.selectMethod('creek');
assert.equal(fresh.practiceProgress,75,'Switch preserves the fraction of a spirit point, avoiding cheap method-switch gains');fresh.meditate(74);assert.equal(fresh.spirit,20);fresh.meditate(1);assert.equal(fresh.spirit,21);assert.equal(fresh.selectMethod('mountain'),false);
assert.equal(fresh.meditate(NaN),false);assert.equal(fresh.meditate(-1),false);
assert.doesNotThrow(()=>new M.Progression({getItem(){throw Error();},setItem(){throw Error();}}).save());
const malformed=new M.Progression({getItem:k=>k.endsWith('v2')?JSON.stringify({spirit:20,manualIds:['__proto__','constructor'],completedBreakthroughs:M.gates.map(g=>g.id)}):null});assert.equal(malformed.rank,0);assert.deepEqual(malformed.manualIds,[]);
console.log('PASS six realm ranges, ten segments, all locked boundaries, monotone shared stats, slow growth, books, method switch, titles and legacy migration');

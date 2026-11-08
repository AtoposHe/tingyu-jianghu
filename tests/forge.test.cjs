const assert=require('node:assert/strict'),F=require('../forge.js'),M=require('../martial.js'),rules=require('../combat-rules.js'),moves=require('../battle-moves.js');
const memory=new Map(),storage={getItem:k=>memory.get(k),setItem:(k,v)=>memory.set(k,v)};let now=100;
const s=new F.ForgeState(storage,()=>now);assert.equal(s.gold,50);assert.equal(s.claim().ok,false);assert.equal(s.equip('qingfeng'),false);
s.acceptCommission();assert.equal(s.claim().ok,true);assert.equal(s.claim().ok,false);assert.equal(s.weapons.qingfeng,1);assert.equal(s.equippedId,'qingfeng');
const hero=s.heroProfile(M.person('hero'));assert.equal(hero.attack,24);assert.equal(hero.maxMp,20);assert.equal(hero.baseAttack,18);assert.equal(hero.weaponId,'qingfeng');
let battle=rules.create(hero);const cut=rules.resolve(battle,'hero','normal');assert.equal(cut.move,'基础劈砍');assert.equal(cut.damage,12);assert.equal(cut.mpChange,0);assert.equal(moves.choose('hero','normal',hero.weaponId).id,'slash');assert.equal(moves.choose('hero','skill',hero.weaponId).id,'mountain');
let before=JSON.stringify(s);assert.equal(s.craft('steel').ok,false);assert.equal(JSON.stringify(s),before,'Insufficient ore never partially deducts gold or ore');
assert.equal(s.buy('wood').ok,true);assert.equal(s.gold,35);assert.equal(s.weapons.wood,1);assert.equal(s.equip('wood'),true);assert.equal(s.heroProfile(M.person('hero')).attack,21);
assert.equal(s.buy('steel').ok,false);assert.equal(s.gold,35);
for(const id of ['__proto__','missing']){assert.equal(s.buy(id).ok,false);assert.equal(s.craft(id).ok,false);assert.equal(s.sellOre(id).ok,false);assert.equal(s.equip(id),false);assert.equal(s.mine(id),false);}
assert.equal(s.mine('iron-west'),true);assert.equal(s.mine('iron-west'),false);assert.equal(s.ores.iron,1);
let reload=new F.ForgeState(storage,()=>now);assert.equal(reload.remaining('iron-west'),60);now+=60000;assert.equal(reload.mine('iron-west'),true);
for(let i=0;i<4;i++){now+=60000;for(const n of F.nodes)reload.mine(n.id);}
const oreBefore={...reload.ores},goldBefore=reload.gold;assert.equal(reload.craft('steel').ok,true);assert.equal(reload.ores.iron,oreBefore.iron-8);assert.equal(reload.ores.copper,oreBefore.copper-2);assert.equal(reload.gold,goldBefore-25);assert.equal(reload.crafted,true);assert.equal(reload.weapons.steel,1);
const remainder=reload.gold;assert.equal(reload.sellOre('iron').ok,true);assert.equal(reload.gold,remainder+6);assert.equal(reload.equip('steel'),true);
assert.equal(reload.discard('weapon','steel'),true);assert.equal(reload.equippedId,null,'Discarding the last equipped copy returns to fists');assert.equal(reload.heroProfile(M.person('hero')).attack,18);
reload=new F.ForgeState(storage,()=>now);assert.equal(reload.claimed,true);assert.equal(reload.crafted,true);assert.equal(reload.gold,remainder+6);assert.equal(reload.equippedId,null);
assert.doesNotThrow(()=>new F.ForgeState({getItem(){throw Error();},setItem(){throw Error();}}).buy('wood'));
console.log('PASS one-time gift, atomic wallet/material transactions, owned equipment, weapon damage/slash, invalid IDs, mine cooldown, sale, last-copy discard and reload');

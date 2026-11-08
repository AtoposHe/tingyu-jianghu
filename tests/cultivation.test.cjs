const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),M=require('../martial.js');
const elements=new Map(),events={},frames=new Map(),store=new Map();let sequence=0,now=0,changes=0;
class Element{
 constructor(){this.hidden=true;this.style={};this.classList={toggle(){}};this.disabled=false;}
 querySelector(id){return el(id);}focus(){context.document.activeElement=this;}
}
const el=id=>{if(!elements.has(id))elements.set(id,new Element());return elements.get(id);};
const p=new M.Progression({getItem:k=>store.get(k),setItem:(k,v)=>store.set(k,v)});
const context={window:null,document:{hidden:false,querySelector:el,addEventListener:(key,fn)=>events[key]=fn},
 requestAnimationFrame:fn=>{frames.set(++sequence,fn);return sequence;},cancelAnimationFrame:id=>frames.delete(id),addEventListener:(key,fn)=>events[key]=fn,Math};
context.window=context;vm.createContext(context);vm.runInContext(fs.readFileSync(require.resolve('../cultivation.js'),'utf8'),context);
const view=new context.CultivationView(p,()=>{},()=>{},()=>changes++);
const advance=seconds=>{for(let i=0;i<seconds*60;i++){now+=1000/60;const pending=[...frames.values()];frames.clear();pending.forEach(fn=>fn(now));}};
view.open();view.toggle();advance(120);assert.equal(p.cultivation,0,'No meditation before learning');
p.recordBattle('defeat',false);p.learn();view.render();view.toggle();advance(30);
assert.ok(p.cultivation>=29&&p.cultivation<=30,'30 real seconds must not award minutes of cultivation');assert.equal(p.hero.maxMp,20);
const prior=p.cultivation;context.document.hidden=true;events.visibilitychange();advance(600);assert.equal(p.cultivation,prior);assert.equal(view.running,false);
context.document.hidden=false;view.toggle();advance(92);assert.equal(p.hero.maxMp,21);assert.equal(p.hero.maxHp,102);assert.ok(changes>100);
view.close();const closed=p.cultivation;advance(600);assert.equal(p.cultivation,closed,'Closing meditation never accrues offline time');
assert.equal(new M.Progression(p.storage).cultivation,closed,'Closing flushes the latest earned second');
view.open();view.toggle();advance(1);const before=p.cultivation;
const pending=[...frames.values()];frames.clear();now+=3600000;pending.forEach(fn=>fn(now));assert.ok(p.cultivation-before<=1,'A suspended animation frame cannot grant an hour of progress');
view.handleKey({key:'Escape',preventDefault(){}});assert.equal(view.active,false);
console.log('PASS actual meditation controller: learning gate, slow active time, hidden/closed pause, save flush and suspension cap');

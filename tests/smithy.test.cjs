const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),Forge=require('../forge.js'),Martial=require('../martial.js');
let now=0,changes=0;const elements=new Map();
class Element{constructor(){this.hidden=true;this.children=[];this.style={};this.classList={add(){},remove(){}};this.textContent='';}querySelector(id){return el(id);}querySelectorAll(){return [];}setAttribute(k,v){this[k]=v;}focus(){}append(...children){this.children.push(...children);}replaceChildren(...children){this.children=children;}}
const el=id=>{if(!elements.has(id))elements.set(id,new Element());return elements.get(id);};
const context={Forge,Martial,document:{querySelector:el,createElement:()=>new Element()},setInterval:()=>1,clearInterval(){}};context.window=context;vm.createContext(context);vm.runInContext(fs.readFileSync(require.resolve('../smithy.js'),'utf8'),context);
const state=new Forge.ForgeState(null,()=>now),shop=new context.SmithyView(state,()=>{},()=>changes++,()=>{});shop.open();
assert.equal(el('#smithy-gold').textContent,'50');assert.equal(el('#smithy-claim').disabled,true);
state.acceptCommission();shop.render();el('#smithy-claim').onclick();assert.equal(state.weapons.qingfeng,1);assert.equal(el('#smithy-claim').disabled,true);
el('#smithy-goods').children[0].children[0].onclick();assert.equal(state.gold,50,'Opening an order is not payment');el('#forge-cancel').onclick();el('#forge-confirm').onclick();assert.equal(state.gold,50);
el('#smithy-goods').children[0].children[0].onclick();el('#forge-confirm').onclick();assert.equal(state.gold,35);assert.equal(state.weapons.wood,1);el('#forge-confirm').onclick();assert.equal(state.gold,35,'Duplicate confirm settles only once');
for(let i=0;i<2;i++){for(const n of Forge.nodes)state.mine(n.id);now+=60000;}shop.render();
assert.equal(el('#smithy-recipes').children[0].children[0].disabled,false);el('#smithy-recipes').children[0].children[0].onclick();el('#forge-confirm').onclick();assert.equal(state.gold,25);assert.equal(state.weapons.qingfeng,2);assert.equal(state.crafted,true);assert.ok(changes>=3);
console.log('PASS real shop order cancel/confirm, one-time claim, confirmed purchase/craft and double confirmation guard');

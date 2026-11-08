const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),Manuals=require('../manuals.js'),Martial=require('../martial.js'),Gathering=require('../gathering.js');
const elements=new Map();let context,changed=0;
class Element{
 constructor(){this.hidden=true;this.children=[];this.dataset={};this.attributes={};this.textContent='';}
 setAttribute(k,v){this.attributes[k]=v;}addEventListener(){}append(...children){this.children.push(...children);}replaceChildren(...children){this.children=children;}
 querySelector(){return null;}querySelectorAll(){return [];}focus(){context.document.activeElement=this;}
}
const el=id=>{if(!elements.has(id))elements.set(id,new Element());return elements.get(id);};
context={Manuals,Martial,Gathering,document:{querySelector:el,createElement:()=>new Element()}};context.window=context;vm.createContext(context);vm.runInContext(fs.readFileSync(require.resolve('../inventory.js'),'utf8'),context);
const p=new Martial.Progression(),store=new Gathering();store.counts.jasmine=2;
const bag=new context.InventoryView(store,()=>{},p,()=>changed++);bag.open();bag.switchTab('books');
assert.equal(el('#manual-grid').children.length,0);assert.equal(el('#manual-empty').hidden,false);
p.recordBattle('defeat',false);p.learn();bag.render();assert.equal(el('#manual-grid').children.length,2,'Only learned manuscripts appear');
const book=el('#manual-grid').children.find(b=>b.dataset.bookId==='breathing');assert.equal(book.children[0].children[0].textContent,'基础吐纳法','Book cover shows the technique title');book.onclick();
assert.equal(el('#book-reader').hidden,false);assert.equal(el('#book-title').textContent,'基础吐纳法');assert.equal(el('#book-text').children.length,Manuals.get('breathing').chapters.length);
for(let i=0;i<Manuals.get('breathing').chapters.length;i++)assert.equal(el('#book-text').children[i].children[1].textContent,Manuals.get('breathing').chapters[i][1],'Full chapter text is rendered without truncation');
assert.equal(el('#book-explanation').textContent,Manuals.get('breathing').explanation);
const press=key=>bag.handleKey({key,preventDefault(){}});press('f');assert.equal(store.total,2,'F while reading never discards');press('Escape');assert.equal(bag.active,true);assert.equal(el('#book-reader').hidden,true);
p.learnManual('creek');bag.render();el('#manual-grid').children.find(b=>b.dataset.bookId==='creek').onclick();el('#book-use').onclick();assert.equal(p.methodId,'creek');assert.equal(changed,1);
bag.switchTab('items');bag.requestDiscard('jasmine');bag.switchTab('books');press('f');assert.equal(store.total,2,'Changing tabs cancels a pending flower discard');
bag.switchTab('items');bag.requestDiscard('jasmine');press('f');assert.equal(store.total,1,'Existing right-click then F item discard remains functional');
for(const book of Object.values(Manuals.catalogue)){assert.ok(book.chapters.length>=4);assert.ok(book.chapters.every(([title,text])=>title&&text.length>25));}
console.log('PASS learned book covers, full original chapters, explanations, book reading/back, method use, empty shelf and flower discard isolation');

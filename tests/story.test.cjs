const assert=require('node:assert/strict'),Story=require('../story.js');
let data=null;const storage={getItem:()=>data,setItem:(k,v)=>data=v};
const story=new Story(storage);assert.equal(story.next,'chief');assert.equal(story.seen,false);
story.enter();story.mark('flowers');assert.equal(story.next,'chief','Optional exploration can happen before main story');
story.mark('chief');assert.equal(story.next,'spar');story.mark('spar');assert.equal(story.next,'meditate');story.mark('meditate');assert.equal(story.next,'practice');story.mark('practice');assert.equal(story.next,'journal');
const again=new Story(storage);assert.equal(again.seen,true);assert.equal(again.next,'journal');
again.mark('unknown');assert.equal(again.flags.unknown,undefined);
assert.doesNotThrow(()=>new Story({getItem(){throw Error('blocked');},setItem(){throw Error('blocked');}}).enter());
console.log('PASS opening state, independent chapter goals, save restore and unavailable storage');

/* Random herb opportunities persist in the same wallet save as collected herbs. */
(() => {
 const map=typeof module!=='undefined'&&module.exports?require('./forest-map.js'):ForestMap;
 class ForestGathering{
  constructor(store,random=Math.random){this.store=store;this.random=random;
   if(!store.forestSlots||store.forestSlots.length!==map.herbSpots.length){const shuffled=[...map.herbSpots];for(let i=shuffled.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[shuffled[i],shuffled[j]]=[shuffled[j],shuffled[i]];}const picks=shuffled.slice(0,2).map(n=>n.id);store.forestSlots=map.herbSpots.map(n=>({id:n.id,active:picks.includes(n.id),herb:random()<.7?'baizhi':'lingzhi',nextAt:store.now()+this.delay()}));store.save();}
  }
  delay(){return 120000+Math.floor(this.random()*120000);}
  tick(){const s=this.store;let changed=false,active=s.forestSlots.filter(n=>n.active).length;
   for(const slot of s.forestSlots){if(slot.active||slot.nextAt>s.now())continue;slot.nextAt=s.now()+this.delay();if(active<4&&this.random()<.65){slot.active=true;slot.herb=this.random()<.7?'baizhi':'lingzhi';active++;}changed=true;}
   if(changed)s.save();return changed;
  }
  nodes(){return this.store.forestSlots.filter(n=>n.active).map(n=>({...map.herbSpots.find(p=>p.id===n.id),herb:n.herb,kind:'herb'}));}
  collect(id){const s=this.store,slot=s.forestSlots.find(n=>n.id===id);if(!slot?.active||s.herbs[slot.herb]>=999999)return false;s.herbs[slot.herb]++;slot.active=false;slot.nextAt=s.now()+this.delay();s.save();return true;}
 }
 if(typeof module!=='undefined'&&module.exports)module.exports=ForestGathering;else globalThis.ForestGathering=ForestGathering;
})();

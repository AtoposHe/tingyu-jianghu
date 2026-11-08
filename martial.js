/* One cultivation scale for every person. Time is earned by visible, active meditation only. */
(() => {
  'use strict';
  const realms=Object.freeze(['淬体','通脉','凝气','归元','化境','宗师']);
  const MAX_LEVEL=17, STEP_SECONDS=120;
  const threshold=level=>300*level*(level+1);
  const MAX_CULTIVATION=threshold(MAX_LEVEL);
  const skills=Object.freeze({mountain:Object.freeze({id:'mountain',name:'推山掌',cost:8,power:1.4,pierce:.7,bonus:4,guard:.6})});
  const people=Object.freeze({
    hero:Object.freeze({id:'hero',name:'无名少侠',cultivation:0,skills:[]}),
    trainer:Object.freeze({id:'trainer',name:'武青山',cultivation:threshold(4),skills:['mountain']}),
    elder:Object.freeze({id:'elder',name:'老村长',cultivation:0,skills:[]})
  });
  function normalize(value){return Number.isFinite(value)?Math.min(MAX_CULTIVATION,Math.max(0,Math.floor(value))):0;}
  function stats(cultivation=0){
    cultivation=normalize(cultivation);let level=0;
    while(level<MAX_LEVEL&&cultivation>=threshold(level+1))level++;
    const roots=Math.floor(cultivation/STEP_SECONDS),realm=realms[Math.floor(level/3)];
    return {cultivation,level,realm,realmName:realm+['一重','二重','三重'][level%3],
      maxHp:100+12*level+2*roots,maxMp:20+3*level+roots,
      attack:18+4*level,defense:4+2*level,regen:2+Math.floor(level/3),
      progress:cultivation-threshold(level),required:level===MAX_LEVEL?0:threshold(level+1)-threshold(level),
      nextSpirit:level===MAX_LEVEL?0:STEP_SECONDS-cultivation%STEP_SECONDS};
  }
  function person(id='hero',cultivation=people[id]?.cultivation||0,learned=people[id]?.skills||[]){
    const profile=people[id];if(!profile)throw Error('Unknown martial profile');
    return {...stats(cultivation),id,name:profile.name,skills:learned.filter(id=>skills[id])};
  }
  class Progression {
    constructor(storage){
      this.storage=storage;this.cultivation=0;this.remainder=0;this.saveClock=0;
      this.firstDefeat=false;this.learned=false;this.practiced=false;
      try{const data=JSON.parse(storage?.getItem('tingyu-martial-v1')||'{}');
        this.cultivation=normalize(data.cultivation);this.firstDefeat=data.firstDefeat===true;
        this.learned=this.firstDefeat&&data.learned===true;this.practiced=this.learned&&data.practiced===true;
      }catch{}
    }
    get hero(){return person('hero',this.cultivation,this.learned?['mountain']:[]);}
    get needsLesson(){return this.firstDefeat&&!this.learned;}
    save(){try{this.storage?.setItem('tingyu-martial-v1',JSON.stringify({cultivation:this.cultivation,firstDefeat:this.firstDefeat,learned:this.learned,practiced:this.practiced}));}catch{}}
    recordBattle(kind,hadSkill){
      if(kind==='defeat')this.firstDefeat=true;
      if(hadSkill&&['victory','defeat'].includes(kind))this.practiced=true;
      this.save();
    }
    learn(){if(!this.needsLesson)return false;this.learned=true;this.save();return true;}
    meditate(seconds){
      if(!this.learned||!Number.isFinite(seconds)||seconds<=0)return false;
      this.remainder+=seconds;const whole=Math.floor(this.remainder);this.remainder-=whole;
      if(!whole||this.cultivation===MAX_CULTIVATION)return false;
      this.cultivation=normalize(this.cultivation+whole);this.saveClock+=whole;
      if(this.saveClock>=5){this.save();this.saveClock=0;}
      return true;
    }
  }
  const api=Object.freeze({realms,skills,people,stats,person,threshold,MAX_LEVEL,MAX_CULTIVATION,STEP_SECONDS,Progression});
  if(typeof module!=='undefined'&&module.exports)module.exports=api;else globalThis.Martial=api;
})();

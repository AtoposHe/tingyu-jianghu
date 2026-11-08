/* Spirit determines every person's realm. Major boundaries require a recorded breakthrough. */
(() => {
  'use strict';
  const books=typeof module!=='undefined'&&module.exports?require('./manuals.js'):globalThis.Manuals;
  const realms=Object.freeze([
    {name:'淬体',min:1,base:0,max:100},{name:'通脉',min:100,base:100,max:200},
    {name:'凝气',min:200,base:200,max:500},{name:'归元',min:500,base:500,max:1000},
    {name:'化境',min:1000,base:1000,max:2000},{name:'宗师',min:2000,base:2000,max:10000}
  ].map(Object.freeze));
  const segments=['一','二','三','四','五','六','七','八','九','十'];
  const gates=Object.freeze(realms.map((realm,index)=>Object.freeze({id:'breakthrough-'+index,from:realm.name,to:realms[index+1]?.name||'封号宗师',cap:realm.max,implemented:false})));
  const skills=Object.freeze({mountain:books.get('mountain')});
  const people=Object.freeze({hero:Object.freeze({id:'hero',name:'无名少侠',spirit:20,skills:[]}),
    trainer:Object.freeze({id:'trainer',name:'武青山',spirit:150,skills:['mountain']}),
    elder:Object.freeze({id:'elder',name:'老村长',spirit:20,skills:[]}),
    smith:Object.freeze({id:'smith',name:'铁师傅',spirit:60,skills:[]})});
  const spiritValue=value=>Number.isFinite(value)?Math.min(1000000000,Math.max(1,Math.floor(value))):20;
  function inferRealm(spirit){let rank=0;while(rank<6&&spirit>realms[rank].max)rank++;return rank;}
  function stats(value=20,unlocked=inferRealm(spiritValue(value)),title=''){
    let spirit=spiritValue(value),rank=Math.max(0,Math.min(6,Math.floor(unlocked)||0));
    if(rank<6&&spirit<realms[rank].min)rank=inferRealm(spirit);
    if(rank<6)spirit=Math.min(spirit,realms[rank].max);
    const band=realms[rank],segment=band?Math.max(1,Math.min(10,Math.ceil((spirit-band.base)/((band.max-band.base)/10)))):10;
    const named=spirit>10000&&rank===6,realm=named?'封号宗师':band?.name||'宗师';
    return {spirit,maxMp:spirit,realm,realmIndex:rank,segment,level:rank*10+segment-1,
      realmName:named?(title||'无号宗师'):realm+segments[segment-1]+'段',
      maxHp:100+2*(spirit-20),attack:Math.max(1,18+Math.floor((spirit-20)/8)),
      defense:Math.max(0,4+Math.floor((spirit-20)/16)),regen:Math.max(1,2+Math.floor((spirit-20)/100)),
      progress:band?spirit-band.base:0,required:band?band.max-band.base:0,cap:band?.max||null};
  }
  function person(id='hero',spirit=people[id]?.spirit,learned=people[id]?.skills||[],rank=inferRealm(spiritValue(spirit)),title=''){
    const profile=people[id];if(!profile)throw Error('Unknown martial profile');
    return {...stats(spirit,rank,title),id,name:profile.name,skills:learned.filter(id=>Object.hasOwn(skills,id))};
  }
  class Progression {
    constructor(storage){
      this.storage=storage;this.spirit=20;this.cultivation=0;this.practiceProgress=0;this.saveClock=0;
      this.firstDefeat=false;this.practiced=false;this.manualIds=[];this.methodId=null;this.completedBreakthroughs=[];this.title='';this.saved=!!storage;
      try{
        const raw=storage?.getItem('tingyu-martial-v2');let data;
        if(raw){
          data=JSON.parse(raw);this.firstDefeat=data.firstDefeat===true;this.practiced=data.practiced===true;
          this.manualIds=[...new Set((Array.isArray(data.manualIds)?data.manualIds:[]).filter(id=>books.get(id)))];
          this.spirit=spiritValue(data.spirit);
          for(const gate of gates){if(this.spirit>=gate.cap&&Array.isArray(data.completedBreakthroughs)&&data.completedBreakthroughs.includes(gate.id))this.completedBreakthroughs.push(gate.id);else break;}
          this.cultivation=Number.isFinite(data.cultivation)?Math.max(0,Math.floor(data.cultivation)):0;
          this.methodId=this.manualIds.includes(data.methodId)&&books.get(data.methodId)?.type==='cultivation'?data.methodId:this.methods[0]?.id||null;
          this.practiceProgress=Number.isFinite(data.practiceProgress)?Math.max(0,Math.min(this.method?.secondsPerPoint||120,data.practiceProgress)):0;
          this.title=this.cleanTitle(data.title)||'';
        }else{
          const legacy=storage?.getItem('tingyu-martial-v1');data=JSON.parse(legacy||'{}');
          this.firstDefeat=data.firstDefeat===true;this.practiced=data.practiced===true;
          const old=Number.isFinite(data.cultivation)?Math.max(0,Math.min(91800,Math.floor(data.cultivation))):0;
          let level=0;while(level<17&&old>=300*(level+1)*(level+2))level++;
          this.spirit=20+3*level+Math.floor(old/120);this.cultivation=old;this.practiceProgress=old%120;
          if(this.firstDefeat&&data.learned===true){this.manualIds=['breathing','mountain'];this.methodId='breathing';}
        }
        this.spirit=Math.min(this.spirit,this.cap);if(this.blocked)this.practiceProgress=0;
      }catch{this.saved=false;}
    }
    get learned(){return this.manualIds.includes('breathing');}
    get methods(){return this.manualIds.map(id=>books.get(id)).filter(book=>book?.type==='cultivation');}
    get method(){return books.get(this.methodId);}
    get rank(){return this.completedBreakthroughs.length;}
    get cap(){return realms[this.rank]?.max||1000000000;}
    get blocked(){return this.spirit>=this.cap;}
    get gate(){return this.blocked?gates[this.rank]||null:null;}
    get hero(){return person('hero',this.spirit,this.manualIds.filter(id=>Object.hasOwn(skills,id)),this.rank,this.title);}
    get needsLesson(){return this.firstDefeat&&!this.learned;}
    get nextSpirit(){return Math.ceil((this.method?.secondsPerPoint||120)-this.practiceProgress);}
    save(){try{this.storage?.setItem('tingyu-martial-v2',JSON.stringify({spirit:this.spirit,cultivation:this.cultivation,practiceProgress:this.practiceProgress,manualIds:this.manualIds,methodId:this.methodId,completedBreakthroughs:this.completedBreakthroughs,title:this.title,firstDefeat:this.firstDefeat,practiced:this.practiced}));this.saved=!!this.storage;}catch{this.saved=false;}}
    recordBattle(kind,hadSkill){if(kind==='defeat')this.firstDefeat=true;if(hadSkill&&['victory','defeat'].includes(kind))this.practiced=true;this.save();}
    learnManual(id){if(!books.get(id)||this.manualIds.includes(id))return false;this.manualIds.push(id);if(!this.methodId&&books.get(id).type==='cultivation')this.methodId=id;this.save();return true;}
    learn(){if(!this.needsLesson)return false;this.learnManual('breathing');this.learnManual('mountain');return true;}
    selectMethod(id){if(!this.manualIds.includes(id)||books.get(id)?.type!=='cultivation')return false;const ratio=this.practiceProgress/(this.method?.secondsPerPoint||120);this.methodId=id;this.practiceProgress=ratio*this.method.secondsPerPoint;this.save();return true;}
    completeBreakthrough(id){
      const gate=this.gate;
      // Future quest completion connects here. Unimplemented quests cannot be clicked through.
      if(!gate||gate.id!==id||!gate.implemented)return false;
      this.completedBreakthroughs.push(id);this.practiceProgress=0;this.save();return true;
    }
    cleanTitle(value){if(typeof value!=='string')return '';const text=value.trim();return text.length>=1&&text.length<=12&&!/[<>\x00-\x1f\x7f]/.test(text)?text:'';}
    setTitle(value){const title=this.cleanTitle(value);if(this.spirit<=10000||this.rank<6||!title)return false;const full=title.endsWith('宗师')?title:title+'宗师';if(full.length>12)return false;this.title=full;this.save();return true;}
    meditate(seconds){
      if(!this.method||this.blocked||!Number.isFinite(seconds)||seconds<=0)return false;
      const earned=Math.min(seconds,(this.cap-this.spirit)*this.method.secondsPerPoint-this.practiceProgress);
      if(earned<=0)return false;
      this.practiceProgress+=earned;this.cultivation+=earned;this.saveClock+=earned;
      const points=Math.floor((this.practiceProgress+1e-8)/this.method.secondsPerPoint);
      this.spirit=Math.min(this.cap,this.spirit+points);this.practiceProgress=Math.max(0,this.practiceProgress-points*this.method.secondsPerPoint);
      if(this.blocked)this.practiceProgress=0;
      if(this.saveClock>=5||this.blocked){this.save();this.saveClock=0;}
      return true;
    }
  }
  const api=Object.freeze({realms,gates,skills,people,stats,person,inferRealm,Progression,STEP_SECONDS:120});
  if(typeof module!=='undefined'&&module.exports)module.exports=api;else globalThis.Martial=api;
})();

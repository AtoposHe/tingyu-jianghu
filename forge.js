/* Wallet, ores, equipment and the sword commission share one transaction/save boundary. */
(() => {
  'use strict';
  const weapons=Object.freeze({
    wood:Object.freeze({id:'wood',name:'练习木剑',type:'sword',attack:3,price:15,src:'assets/weapons/wood.png',color:'#d6ac6a',description:'轻便木剑，适合熟悉基础劈砍。'}),
    qingfeng:Object.freeze({id:'qingfeng',name:'青锋剑',type:'sword',attack:6,price:60,src:'assets/weapons/qingfeng.png',color:'#b7e2df',description:'银刃青柄，武青山托铁匠为你准备的入门佩剑。'}),
    steel:Object.freeze({id:'steel',name:'精铁长剑',type:'sword',attack:10,price:120,src:'assets/weapons/steel.png',color:'#c1c8ed',description:'刃脊厚实，乌铁护手配赤色剑柄，挥斩更有分量。'})
  });
  const ores=Object.freeze({iron:Object.freeze({id:'iron',name:'铁矿石',price:6,color:'#87989c',src:'assets/items/iron-ore.png'}),copper:Object.freeze({id:'copper',name:'铜矿石',price:9,color:'#bf8559',src:'assets/items/copper-ore.png'})});
  const herbs=Object.freeze({baizhi:Object.freeze({id:'baizhi',name:'白芷',price:5,src:'assets/forest/baizhi.png',description:'林间采得的白花药草，杏竹医馆收购。'}),lingzhi:Object.freeze({id:'lingzhi',name:'赤灵芝',price:12,src:'assets/forest/lingzhi.png',description:'偶见于林下的赤色灵芝，可卖给医生。'})});
  const bodyParts=Object.freeze({head:{name:'头部',x:135,y:52},chest:{name:'胸部',x:135,y:139},abdomen:{name:'腹部',x:135,y:210},leftArm:{name:'左臂',x:197,y:180},rightArm:{name:'右臂',x:73,y:180},leftLeg:{name:'左腿',x:160,y:332},rightLeg:{name:'右腿',x:110,y:332}});
  const ailments=Object.freeze({
    poison:Object.freeze({id:'poison',name:'中毒',part:'chest',cost:24,symptom:'毒素滞留经络，胸闷、气促，偶有心悸。',care:'可用解毒丹，或请顾大夫解毒。'}),
    fracture:Object.freeze({id:'fracture',name:'骨折',part:'leftArm',cost:32,symptom:'伤处肿痛，活动时疼痛明显，需要接骨固定。',care:'可用接骨膏，或请顾大夫接骨。'}),
    stomachache:Object.freeze({id:'stomachache',name:'腹痛',part:'abdomen',cost:12,symptom:'腹部阵阵绞痛，胃脘不适，食欲不佳。',care:'可用和胃散，或请顾大夫调理。'}),
    bruise:Object.freeze({id:'bruise',name:'挫伤',part:'leftArm',cost:8,symptom:'伤处青紫，抬臂时隐隐作痛。',care:'可用止血散，或请顾大夫处理。'})
  });
  const medicines=Object.freeze({
    bandage:Object.freeze({id:'bandage',name:'止血散',price:8,cures:['bruise'],mp:0,src:'assets/items/zhixue-san.png',description:'战斗外使用，处理挫伤与皮下淤血。'}),
    salve:Object.freeze({id:'salve',name:'接骨膏',price:18,cures:['fracture'],mp:0,src:'assets/items/jiegu-gao.png',description:'战斗外使用，接骨固定，治愈一处骨折。'}),
    spirit:Object.freeze({id:'spirit',name:'回气丸',price:12,cures:[],mp:20,src:'assets/items/huiqi-wan.png',description:'战斗外服用，恢复 20 灵力，不超过上限。'}),
    antidote:Object.freeze({id:'antidote',name:'解毒丹',price:16,cures:['poison'],mp:0,src:'assets/items/jiedu-dan.png',description:'战斗外服用，清除体内中毒状态。'}),
    stomach:Object.freeze({id:'stomach',name:'和胃散',price:10,cures:['stomachache'],mp:0,src:'assets/items/hewei-san.png',description:'战斗外服用，调和脾胃，缓解腹痛。'})
  });
  const recipes=Object.freeze({qingfeng:Object.freeze({weapon:'qingfeng',ores:{iron:4,copper:1},gold:10}),steel:Object.freeze({weapon:'steel',ores:{iron:8,copper:2},gold:25})});
  const nodes=Object.freeze([
    {id:'iron-west',ore:'iron',x:24,y:64},{id:'iron-north',ore:'iron',x:43,y:34},{id:'iron-east',ore:'iron',x:77,y:76},
    {id:'copper-east',ore:'copper',x:72,y:47},{id:'copper-north',ore:'copper',x:60,y:23}
  ].map(Object.freeze));
  const count=(n,max=999999)=>Number.isSafeInteger(n)&&n>=0?Math.min(n,max):0;
  class ForgeState {
    constructor(storage,now=()=>Date.now()){
      this.storage=storage;this.now=now;this.gold=50;this.herbs={baizhi:0,lingzhi:0};this.medicines={};this.forestSlots=null;this.heroName='无名少侠';this.hpMissing=0;this.mpMissing=0;this.ailments=[];this.ores={iron:0,copper:0};this.weapons={};this.equippedId=null;this.cooldowns={};this.commission=false;this.claimed=false;this.crafted=false;this.saved=!!storage;
      try{const raw=storage?.getItem('tingyu-forge-v1');if(raw){const data=JSON.parse(raw);this.gold=count(data.gold,1000000000);
        this.heroName=this.cleanName(data.heroName)||'无名少侠';this.hpMissing=0;this.mpMissing=count(data.mpMissing,1000000000);
        if(Array.isArray(data.ailments))for(const a of data.ailments){if(!a||!Object.hasOwn(ailments,a.id))continue;const part=Object.hasOwn(bodyParts,a.part)?a.part:ailments[a.id].part;if(!this.ailments.some(n=>n.id===a.id&&n.part===part))this.ailments.push({id:a.id,part,source:typeof a.source==='string'?a.source.slice(0,60):''});}
        for(const id of Object.keys(herbs))this.herbs[id]=count(data.herbs?.[id]);
        for(const id of Object.keys(medicines))if(count(data.medicines?.[id]))this.medicines[id]=count(data.medicines[id]);
        if(Array.isArray(data.forestSlots)&&data.forestSlots.length===8)this.forestSlots=data.forestSlots.map((slot,i)=>({id:'herb-'+i,active:slot.active===true,herb:Object.hasOwn(herbs,slot.herb)?slot.herb:'baizhi',nextAt:Number.isFinite(slot.nextAt)?Math.min(slot.nextAt,this.now()+240000):this.now()+120000}));
        for(const id of Object.keys(ores))this.ores[id]=count(data.ores?.[id]);
        for(const id of Object.keys(weapons))if(count(data.weapons?.[id]))this.weapons[id]=count(data.weapons[id]);
        this.equippedId=Object.hasOwn(this.weapons,data.equippedId)&&this.weapons[data.equippedId]?data.equippedId:null;this.commission=data.commission===true;this.claimed=this.commission&&data.claimed===true;this.crafted=data.crafted===true;
        for(const node of nodes)if(Number.isFinite(data.cooldowns?.[node.id]))this.cooldowns[node.id]=Math.min(this.now()+60000,data.cooldowns[node.id]);
      }}catch{this.saved=false;}
    }
    save(){try{this.storage?.setItem('tingyu-forge-v1',JSON.stringify({gold:this.gold,heroName:this.heroName,hpMissing:this.hpMissing,mpMissing:this.mpMissing,ailments:this.ailments,herbs:this.herbs,medicines:this.medicines,forestSlots:this.forestSlots,ores:this.ores,weapons:this.weapons,equippedId:this.equippedId,cooldowns:this.cooldowns,commission:this.commission,claimed:this.claimed,crafted:this.crafted}));this.saved=!!this.storage;}catch{this.saved=false;}}
    get equipped(){return weapons[this.equippedId]||null;}
    get total(){return Object.values(this.herbs).reduce((a,b)=>a+b,0)+Object.values(this.medicines).reduce((a,b)=>a+b,0)+Object.values(this.ores).reduce((a,b)=>a+b,0)+Object.values(this.weapons).reduce((a,b)=>a+b,0);}
    heroProfile(hero){return {...hero,name:this.heroName,currentHp:hero.maxHp,ailments:this.ailments.map(a=>({...a})),currentMp:Math.max(0,hero.maxMp-this.mpMissing),baseAttack:hero.attack,attack:hero.attack+(this.equipped?.attack||0),weaponId:this.equippedId};}
    cleanName(value){if(typeof value!=='string')return '';const name=value.trim();return name.length>0&&name.length<=10&&!/[<>\x00-\x1f\x7f]/.test(name)?name:'';}
    setName(value){const name=this.cleanName(value);if(!name)return false;this.heroName=name;this.save();return true;}
    recordVitals(hero){this.hpMissing=0;this.mpMissing=Math.max(0,hero.maxMp-hero.mp);this.save();}
    addAilment(id,part=ailments[id]?.part,source=''){if(!Object.hasOwn(ailments,id)||!Object.hasOwn(bodyParts,part)||this.ailments.some(a=>a.id===id&&a.part===part))return false;this.ailments.push({id,part,source:String(source).slice(0,60)});this.save();return true;}
    finishBattle(hero,kind,opponent='trainer'){this.recordVitals(hero);if(kind==='defeat'&&opponent==='trainer')this.addAilment('bruise','leftArm','与武青山切磋时挫伤');return this.condition(hero);}
    condition(hero){const h=this.heroProfile(hero),symptoms=this.ailments.map(a=>({...ailments[a.id],...a,body:bodyParts[a.part]}));return {...h,symptoms,status:symptoms.length?`有 ${symptoms.length} 处伤病`:'身体康健',cost:symptoms.reduce((n,a)=>n+a.cost,0)};}
    treat(hero){const h=this.condition(hero);if(!h.cost)return {ok:false,message:'未发现持续性伤病，无需治疗。灵力不足可另购回气丸。'};if(this.gold<h.cost)return {ok:false,message:'金币不足，可先出售药草或使用对应药品。'};this.gold-=h.cost;this.ailments=[];this.save();return {ok:true,message:'诊治完成，所有伤病已治愈。'};}
    buyMedicine(id){if(!Object.hasOwn(medicines,id))return {ok:false,message:'药品不存在。'};const m=medicines[id];if(this.gold<m.price)return {ok:false,message:'金币不足。'};if((this.medicines[id]||0)>=999999)return {ok:false,message:'药品数量已满。'};this.gold-=m.price;this.medicines[id]=(this.medicines[id]||0)+1;this.save();return {ok:true,message:`购得${m.name} ×1，可在行囊使用。`};}
    useMedicine(id,hero){if(!Object.hasOwn(medicines,id)||!this.medicines[id])return {ok:false,message:'没有这份药品。'};const m=medicines[id],index=this.ailments.findIndex(a=>m.cures.includes(a.id)),mp=Math.min(this.mpMissing,hero.maxMp,m.mp);if(index<0&&mp<=0)return {ok:false,message:'没有此药对应的症状，当前无需使用，没有消耗药品。'};let cured='';if(index>=0){const a=this.ailments.splice(index,1)[0];cured=bodyParts[a.part].name+'的'+ailments[a.id].name;}this.mpMissing=Math.max(0,this.mpMissing-mp);this.medicines[id]--;if(!this.medicines[id])delete this.medicines[id];this.save();return {ok:true,message:`使用${m.name}，${cured?'治愈'+cured:'恢复灵力 '+mp}。`};}
    sellHerb(id){if(!Object.hasOwn(herbs,id)||this.herbs[id]<1)return {ok:false,message:'没有可出售的药草。'};if(this.gold+herbs[id].price>1000000000)return {ok:false,message:'金币数量已满。'};this.herbs[id]--;this.gold+=herbs[id].price;this.save();return {ok:true,message:`售出${herbs[id].name} ×1，获得 ${herbs[id].price} 金币。`};}
    acceptCommission(){if(this.commission)return false;this.commission=true;this.save();return true;}
    claim(){if(!this.commission)return {ok:false,message:'请先向武青山取得赠剑凭条。'};if(this.claimed)return {ok:false,message:'赠剑已领取，不可重复领取。'};
      if((this.weapons.qingfeng||0)>=999999)return {ok:false,message:'青锋剑数量已满，请先整理行囊。'};this.claimed=true;this.weapons.qingfeng=(this.weapons.qingfeng||0)+1;if(!this.equippedId)this.equippedId='qingfeng';this.save();return {ok:true,message:'已领取武青山赠送的青锋剑，可在行囊切换装备。'};}
    buy(id){if(!Object.hasOwn(weapons,id))return {ok:false,message:'商品不存在。'};const w=weapons[id];if(this.gold<w.price)return {ok:false,message:'金币不足。'};if((this.weapons[id]||0)>=999999)return {ok:false,message:'此类武器数量已满。'};
      this.gold-=w.price;this.weapons[id]=(this.weapons[id]||0)+1;this.save();return {ok:true,message:`购得${w.name} ×1，花费 ${w.price} 金币。`};}
    craft(id){if(!Object.hasOwn(recipes,id))return {ok:false,message:'锻造配方不存在。'};const r=recipes[id];if(Object.entries(r.ores).some(([ore,n])=>this.ores[ore]<n))return {ok:false,message:'矿石不足，请先到听雨林矿径采集。'};if(this.gold<r.gold)return {ok:false,message:'金币不足，无法支付工钱。'};if((this.weapons[id]||0)>=999999)return {ok:false,message:'此类武器数量已满。'};
      for(const [ore,n] of Object.entries(r.ores))this.ores[ore]-=n;this.gold-=r.gold;this.crafted=true;this.weapons[id]=(this.weapons[id]||0)+1;this.save();return {ok:true,message:`锻造完成：${weapons[id].name} ×1。矿石与工钱已交付。`};}
    sellOre(id){if(!Object.hasOwn(ores,id)||this.ores[id]<1)return {ok:false,message:'没有可出售的矿石。'};if(this.gold+ores[id].price>1000000000)return {ok:false,message:'金币数量已满。'};this.ores[id]--;this.gold+=ores[id].price;this.save();return {ok:true,message:`售出${ores[id].name} ×1，获得 ${ores[id].price} 金币。`};}
    equip(id){if(id!==null&&(!Object.hasOwn(weapons,id)||!this.weapons[id]))return false;this.equippedId=id;this.save();return true;}
    discard(kind,id){if(kind==='herb'&&Object.hasOwn(herbs,id)&&this.herbs[id]>0)this.herbs[id]--;
      else if(kind==='medicine'&&Object.hasOwn(medicines,id)&&this.medicines[id]>0){this.medicines[id]--;if(!this.medicines[id])delete this.medicines[id];}
      else if(kind==='ore'&&Object.hasOwn(ores,id)&&this.ores[id]>0)this.ores[id]--;
      else if(kind==='weapon'&&Object.hasOwn(weapons,id)&&this.weapons[id]>0){this.weapons[id]--;if(!this.weapons[id]){delete this.weapons[id];if(this.equippedId===id)this.equippedId=null;}}
      else return false;this.save();return true;}
    remaining(id){return Math.max(0,Math.ceil(((this.cooldowns[id]||0)-this.now())/1000));}
    mine(id){const node=nodes.find(n=>n.id===id);if(!node||this.remaining(id)||this.ores[node.ore]>=999999)return false;this.ores[node.ore]++;this.cooldowns[id]=this.now()+60000;this.save();return true;}
  }
  const api=Object.freeze({weapons,ores,herbs,medicines,ailments,bodyParts,recipes,nodes,ForgeState});
  if(typeof module!=='undefined'&&module.exports)module.exports=api;else globalThis.Forge=api;
})();

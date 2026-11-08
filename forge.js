/* Wallet, ores, equipment and the sword commission share one transaction/save boundary. */
(() => {
  'use strict';
  const weapons=Object.freeze({
    wood:Object.freeze({id:'wood',name:'练习木剑',type:'sword',attack:3,price:15,src:'assets/weapons/wood.png',color:'#d6ac6a',description:'轻便木剑，适合熟悉基础劈砍。'}),
    qingfeng:Object.freeze({id:'qingfeng',name:'青锋剑',type:'sword',attack:6,price:60,src:'assets/weapons/qingfeng.png',color:'#b7e2df',description:'银刃青柄，武青山托铁匠为你准备的入门佩剑。'}),
    steel:Object.freeze({id:'steel',name:'精铁长剑',type:'sword',attack:10,price:120,src:'assets/weapons/steel.png',color:'#c1c8ed',description:'刃脊厚实，乌铁护手配赤色剑柄，挥斩更有分量。'})
  });
  const ores=Object.freeze({iron:Object.freeze({id:'iron',name:'铁矿石',price:6,color:'#87989c'}),copper:Object.freeze({id:'copper',name:'铜矿石',price:9,color:'#bf8559'})});
  const herbs=Object.freeze({baizhi:Object.freeze({id:'baizhi',name:'白芷',price:5,src:'assets/forest/baizhi.png',description:'林间采得的白花药草，杏竹医馆收购。'}),lingzhi:Object.freeze({id:'lingzhi',name:'赤灵芝',price:12,src:'assets/forest/lingzhi.png',description:'偶见于林下的赤色灵芝，可卖给医生。'})});
  const medicines=Object.freeze({bandage:Object.freeze({id:'bandage',name:'止血散',price:8,hp:30,mp:0,description:'战斗外服用，恢复 30 气血，不超过上限。'}),salve:Object.freeze({id:'salve',name:'金疮药',price:18,hp:70,mp:0,description:'战斗外服用，恢复 70 气血，不超过上限。'}),spirit:Object.freeze({id:'spirit',name:'回气丸',price:12,hp:0,mp:20,description:'战斗外服用，恢复 20 灵力，不超过上限。'})});
  const recipes=Object.freeze({qingfeng:Object.freeze({weapon:'qingfeng',ores:{iron:4,copper:1},gold:10}),steel:Object.freeze({weapon:'steel',ores:{iron:8,copper:2},gold:25})});
  const nodes=Object.freeze([
    {id:'iron-west',ore:'iron',x:24,y:64},{id:'iron-north',ore:'iron',x:43,y:34},{id:'iron-east',ore:'iron',x:77,y:76},
    {id:'copper-east',ore:'copper',x:72,y:47},{id:'copper-north',ore:'copper',x:60,y:23}
  ].map(Object.freeze));
  const count=(n,max=999999)=>Number.isSafeInteger(n)&&n>=0?Math.min(n,max):0;
  class ForgeState {
    constructor(storage,now=()=>Date.now()){
      this.storage=storage;this.now=now;this.gold=50;this.herbs={baizhi:0,lingzhi:0};this.medicines={};this.forestSlots=null;this.heroName='无名少侠';this.hpMissing=0;this.mpMissing=0;this.ores={iron:0,copper:0};this.weapons={};this.equippedId=null;this.cooldowns={};this.commission=false;this.claimed=false;this.crafted=false;this.saved=!!storage;
      try{const raw=storage?.getItem('tingyu-forge-v1');if(raw){const data=JSON.parse(raw);this.gold=count(data.gold,1000000000);
        this.heroName=this.cleanName(data.heroName)||'无名少侠';this.hpMissing=count(data.hpMissing,1000000000);this.mpMissing=count(data.mpMissing,1000000000);
        for(const id of Object.keys(herbs))this.herbs[id]=count(data.herbs?.[id]);
        for(const id of Object.keys(medicines))if(count(data.medicines?.[id]))this.medicines[id]=count(data.medicines[id]);
        if(Array.isArray(data.forestSlots)&&data.forestSlots.length===8)this.forestSlots=data.forestSlots.map((slot,i)=>({id:'herb-'+i,active:slot.active===true,herb:Object.hasOwn(herbs,slot.herb)?slot.herb:'baizhi',nextAt:Number.isFinite(slot.nextAt)?Math.min(slot.nextAt,this.now()+240000):this.now()+120000}));
        for(const id of Object.keys(ores))this.ores[id]=count(data.ores?.[id]);
        for(const id of Object.keys(weapons))if(count(data.weapons?.[id]))this.weapons[id]=count(data.weapons[id]);
        this.equippedId=Object.hasOwn(this.weapons,data.equippedId)&&this.weapons[data.equippedId]?data.equippedId:null;this.commission=data.commission===true;this.claimed=this.commission&&data.claimed===true;this.crafted=data.crafted===true;
        for(const node of nodes)if(Number.isFinite(data.cooldowns?.[node.id]))this.cooldowns[node.id]=Math.min(this.now()+60000,data.cooldowns[node.id]);
      }}catch{this.saved=false;}
    }
    save(){try{this.storage?.setItem('tingyu-forge-v1',JSON.stringify({gold:this.gold,heroName:this.heroName,hpMissing:this.hpMissing,mpMissing:this.mpMissing,herbs:this.herbs,medicines:this.medicines,forestSlots:this.forestSlots,ores:this.ores,weapons:this.weapons,equippedId:this.equippedId,cooldowns:this.cooldowns,commission:this.commission,claimed:this.claimed,crafted:this.crafted}));this.saved=!!this.storage;}catch{this.saved=false;}}
    get equipped(){return weapons[this.equippedId]||null;}
    get total(){return Object.values(this.herbs).reduce((a,b)=>a+b,0)+Object.values(this.medicines).reduce((a,b)=>a+b,0)+Object.values(this.ores).reduce((a,b)=>a+b,0)+Object.values(this.weapons).reduce((a,b)=>a+b,0);}
    heroProfile(hero){return {...hero,name:this.heroName,currentHp:Math.max(1,hero.maxHp-this.hpMissing),currentMp:Math.max(0,hero.maxMp-this.mpMissing),baseAttack:hero.attack,attack:hero.attack+(this.equipped?.attack||0),weaponId:this.equippedId};}
    cleanName(value){if(typeof value!=='string')return '';const name=value.trim();return name.length>0&&name.length<=10&&!/[<>\x00-\x1f\x7f]/.test(name)?name:'';}
    setName(value){const name=this.cleanName(value);if(!name)return false;this.heroName=name;this.save();return true;}
    recordVitals(hero){this.hpMissing=Math.max(0,hero.maxHp-Math.max(1,hero.hp));this.mpMissing=Math.max(0,hero.maxMp-hero.mp);this.save();}
    condition(hero){const h=this.heroProfile(hero),ratio=h.currentHp/h.maxHp;return {...h,status:ratio>=1?'身体康健':ratio>.65?'轻伤待养':ratio>.3?'伤势未愈':'伤势较重',cost:this.hpMissing||this.mpMissing?5+Math.ceil((Math.min(this.hpMissing,h.maxHp-1)+Math.min(this.mpMissing,h.maxMp))*.08):0};}
    treat(hero){const h=this.condition(hero);if(!h.cost)return {ok:false,message:'身体无恙，无需治疗。'};if(this.gold<h.cost)return {ok:false,message:'金币不足，可先出售药草或使用行囊中的药品。'};this.gold-=h.cost;this.hpMissing=0;this.mpMissing=0;this.save();return {ok:true,message:'调养完成，气血与灵力已恢复。'};}
    buyMedicine(id){if(!Object.hasOwn(medicines,id))return {ok:false,message:'药品不存在。'};const m=medicines[id];if(this.gold<m.price)return {ok:false,message:'金币不足。'};if((this.medicines[id]||0)>=999999)return {ok:false,message:'药品数量已满。'};this.gold-=m.price;this.medicines[id]=(this.medicines[id]||0)+1;this.save();return {ok:true,message:`购得${m.name} ×1，可在行囊服用。`};}
    useMedicine(id,hero){if(!Object.hasOwn(medicines,id)||!this.medicines[id])return {ok:false,message:'没有这份药品。'};const m=medicines[id],hp=Math.min(this.hpMissing,hero.maxHp-1,m.hp),mp=Math.min(this.mpMissing,hero.maxMp,m.mp);if(hp+mp<=0)return {ok:false,message:'当前无需使用此药，没有消耗药品。'};this.hpMissing=Math.max(0,this.hpMissing-m.hp);this.mpMissing=Math.max(0,this.mpMissing-m.mp);this.medicines[id]--;if(!this.medicines[id])delete this.medicines[id];this.save();return {ok:true,message:`服用${m.name}，恢复气血 ${hp}、灵力 ${mp}。`};}
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
  const api=Object.freeze({weapons,ores,herbs,medicines,recipes,nodes,ForgeState});
  if(typeof module!=='undefined'&&module.exports)module.exports=api;else globalThis.Forge=api;
})();

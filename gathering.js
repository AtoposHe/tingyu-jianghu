/* Town keepsakes: inventory and flower regeneration survive a page refresh. */
(() => {
  const items={jasmine:{name:'素馨花',art:'jasmine',kind:'花卉',description:'街边花圃里的白色小花，清香淡雅。可收藏的江南花材。'},osmanthus:{name:'桂花瓣',art:'osmanthus',kind:'花卉',description:'从桂花盆景旁拾得的金色落花，带着温暖的甜香。'},lotus:{name:'荷花瓣',art:'lotus',kind:'花卉',description:'水缸边新落的粉色花瓣，薄如轻绸。收集落瓣不会损伤荷株。'}};
  const nodes=[
    ['southFlowers','jasmine',600,880],['laneFlowers','osmanthus',472,735],['villageFlowers','jasmine',424,630],
    ['wineFlowers','osmanthus',480,565],['bridgeFlowers','lotus',654,536],['innFlowers','jasmine',650,246],
    ['dojoFlowers','osmanthus',1032,232],['eastFlowers','jasmine',1056,464],['guestFlowers','osmanthus',1216,780],
    ['forgeFlowers','jasmine',1488,816],['dockFlowers','lotus',1136,824],['southLotus','lotus',616,952]
  ].map(([id,item,x,y])=>({id,item,x,y}));
  class Gathering {
    constructor(storage,now=()=>Date.now()) {
      this.storage=storage;this.now=now;this.counts={};this.cooldowns={};this.saved=true;
      try {const raw=JSON.parse(storage?.getItem('tingyu-keepsakes-v1')||'{}');for(const key of Object.keys(items))if(Number.isSafeInteger(raw.counts?.[key])&&raw.counts[key]>0)this.counts[key]=Math.min(raw.counts[key],999999);
        for(const n of nodes)if(Number.isFinite(raw.cooldowns?.[n.id]))this.cooldowns[n.id]=Math.min(raw.cooldowns[n.id],this.now()+60000);
      }catch{}
    }
    remaining(node){return Math.max(0,Math.ceil(((this.cooldowns[node.id]||0)-this.now())/1000));}
    collect(node) {
      if(!nodes.includes(node)||this.remaining(node))return false;
      this.counts[node.item]=(this.counts[node.item]||0)+1;this.cooldowns[node.id]=this.now()+60000;
      this.save();
      return true;
    }
    save(){try{this.storage?.setItem('tingyu-keepsakes-v1',JSON.stringify({counts:this.counts,cooldowns:this.cooldowns}));this.saved=!!this.storage;}catch{this.saved=false;}}
    discard(id,count=1){
      if(!Object.hasOwn(items,id)||!Number.isSafeInteger(count)||count<1||(this.counts[id]||0)<count)return false;
      this.counts[id]-=count;if(!this.counts[id])delete this.counts[id];this.save();return true;
    }
    get total(){return Object.values(this.counts).reduce((a,b)=>a+b,0);}
  }
  Gathering.items=items;Gathering.nodes=nodes;
  if(typeof module!=='undefined'&&module.exports)module.exports=Gathering;else window.Gathering=Gathering;
})();

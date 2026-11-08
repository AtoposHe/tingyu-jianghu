/* Fictional setting and chapter progress are separate from combat/save items. */
(() => {
  const goals=[
    {id:'chief',title:'拜访村长 · 旧镖寻人',text:'到村长家门口，向老村长询问旧镖牌的来历。'},
    {id:'spar',title:'武馆试拳 · 立身江湖',text:'与武青山认真交手，落败后请教，学习推山掌与吐纳法。' },
    {id:'meditate',title:'静坐吐纳 · 积水成渊',text:'按 R 打开修炼，开始打坐积累第一息修为。每两分钟灵力上限才增长一点。'},
    {id:'practice',title:'再试推山 · 体悟差距',text:'带着推山掌再与武青山完整切磋一场；不以胜负论成败。'},
    {id:'commission',title:'武师赠剑 · 启程之礼',text:'完成复战后再与武青山交谈，接下他赠剑的取剑凭条。'},
    {id:'sword',title:'溪南取剑 · 初握青锋',text:'到村东右侧的溪南铁铺，找铁师傅领取青锋剑。'},
    {id:'forge',title:'村外寻矿 · 淬火铸锋',text:'到村外石坡按 F 采矿，回铁铺交付矿石和工钱，锻造一把武器。'},
    {id:'flowers',title:'支线拾芳 · 识路安顿',text:'沿街探索，按 F 收集一份花材，再用 B 查看行囊。'}
  ];
  class JianghuStory {
    constructor(storage){this.storage=storage;this.flags={};this.seen=false;try{const d=JSON.parse(storage?.getItem('tingyu-story-v1')||'{}');this.seen=d.seen===true;for(const g of goals)this.flags[g.id]=d.flags?.[g.id]===true;}catch{}}
    save(){try{this.storage?.setItem('tingyu-story-v1',JSON.stringify({seen:this.seen,flags:this.flags}));}catch{}}
    mark(id){if(!goals.some(g=>g.id===id)||this.flags[id])return;this.flags[id]=true;this.save();}
    enter(){this.seen=true;this.save();}
    get next(){return goals.find(g=>!this.flags[g.id])?.id||'journal';}
  }
  JianghuStory.goals=goals;
  if(typeof module!=='undefined'&&module.exports)module.exports=JianghuStory;else window.JianghuStory=JianghuStory;
})();

/* Fictional setting and chapter progress are separate from combat/save items. */
(() => {
  const goals=[
    {id:'chief',title:'拜访村长 · 旧镖寻人',text:'到村长家门口，向老村长询问旧镖牌的来历。'},
    {id:'spar',title:'武馆试拳 · 立身江湖',text:'与陆青山完成一次切磋，胜负都算历练；认输后可再试。'},
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

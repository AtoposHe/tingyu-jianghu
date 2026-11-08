(() => {
  class StoryView {
    constructor(story,onOpen,onClose){this.story=story;this.onOpen=onOpen;this.onClose=onClose;this.root=document.querySelector('#story-opening');
      document.querySelector('#story-enter').onclick=()=>this.close();document.querySelector('#story-toggle').onclick=()=>this.open();this.render();}
    get active(){return !this.root.hidden;}
    render(){
      const list=document.querySelector('#story-goals');list.replaceChildren();
      for(const goal of JianghuStory.goals){const li=document.createElement('li');li.className=this.story.flags[goal.id]?'goal-done':'';const title=document.createElement('strong'),text=document.createElement('p');title.textContent=(this.story.flags[goal.id]?'✓ ':'○ ')+goal.title;text.textContent=goal.text;li.append(title);li.append(text);list.append(li);}
      document.querySelector('#story-enter').textContent=this.story.seen?'继续前路 ↗':'踏入听雨村 ↗';
      const target=this.story.next,labels={chief:'旧镖寻人 · 拜访村长',spar:'武馆试拳 · 拜师学艺',meditate:'静坐吐纳 · R 修炼',practice:'再试推山 · 寻访武师',commission:'武师赠剑 · 领取凭条',sword:'溪南取剑 · 寻访铁匠',forge:'村外采矿 · 锻造武器',flowers:'沿街拾芳 · F 收集',journal:'江湖手记 · 查看后续'};
      document.querySelector('#quest-text').textContent=labels[target];document.querySelector('#quest-check').textContent=target==='journal'?'✓':'○';
      document.querySelector('#quest').title=JianghuStory.goals.find(g=>g.id===target)?.text||'回顾身世与后续故事规划';
    }
    open(){if(this.onOpen()===false)return;this.render();this.root.hidden=false;document.querySelector('#story-enter').focus({preventScroll:true});}
    close(){this.story.enter();this.root.hidden=true;this.onClose();}
    handleKey(e){const key=e.key.toLowerCase();if(key==='escape'){e.preventDefault();if(!document.querySelector('#story-enter').disabled)this.close();}if(key==='tab'){e.preventDefault();document.querySelector('#story-enter').focus();}}
  }
  window.StoryView=StoryView;
})();

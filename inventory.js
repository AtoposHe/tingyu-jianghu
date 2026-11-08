(() => {
  class InventoryView {
    constructor(store,onToggle) {
      this.store=store;this.onToggle=onToggle;this.root=document.querySelector('#inventory');this.selected=null;this.pendingDiscard=null;
      document.querySelector('#bag-toggle').onclick=()=>this.open();document.querySelector('#bag-close').onclick=()=>this.close();
      this.root.addEventListener('click',e=>{if(e.target===this.root)this.close();});
      document.querySelector('#discard-confirm').onclick=()=>this.confirmDiscard();
      document.querySelector('#discard-cancel').onclick=()=>this.cancelDiscard();
    }
    get active(){return !this.root.hidden;}
    open(){this.onToggle();this.pendingDiscard=null;document.querySelector('#bag-feedback').textContent='';this.root.hidden=false;this.render();document.querySelector('#bag-close').focus({preventScroll:true});}
    close(){this.cancelDiscard();this.root.hidden=true;document.querySelector('#game').focus({preventScroll:true});}
    cancelDiscard(){this.pendingDiscard=null;document.querySelector('#discard-menu').hidden=true;}
    requestDiscard(id){if(!this.store.counts[id])return;document.querySelector('#bag-feedback').textContent='';this.selected=id;this.pendingDiscard=id;this.render();document.querySelector('#discard-confirm').focus({preventScroll:true});}
    confirmDiscard(){
      const id=this.pendingDiscard;if(!id)return;
      const removed=this.store.discard(id,1);this.cancelDiscard();this.render();
      document.querySelector('#bag-feedback').textContent=removed?`已丢弃 ${Gathering.items[id].name} ×1`:'物品数量已变化，请重新选择。';
      document.querySelector('#bag-close').focus({preventScroll:true});
    }
    handleKey(e){
      const key=e.key.toLowerCase();
      if(key==='f'){e.preventDefault();if(!e.repeat)this.confirmDiscard();return;}
      if(key==='escape'&&this.pendingDiscard){e.preventDefault();this.cancelDiscard();document.querySelector('#bag-close').focus({preventScroll:true});return;}
      if(key==='escape'||key==='b'){e.preventDefault();if(!e.repeat)this.close();return;}
      if(key==='tab'){const buttons=[...this.root.querySelectorAll('button')].filter(b=>!b.closest('[hidden]'));const i=buttons.indexOf(document.activeElement);e.preventDefault();buttons[(i+(e.shiftKey?-1:1)+buttons.length)%buttons.length]?.focus();}
    }
    render(){
      const entries=Object.keys(Gathering.items).filter(id=>this.store.counts[id]);
      if(!entries.includes(this.selected))this.selected=entries[0]||null;
      document.querySelector('#bag-summary').textContent=`花卉收藏 · ${entries.length} 种 · 共 ${this.store.total} 件`;
      document.querySelector('#bag-count').textContent=this.store.total;
      const grid=document.querySelector('#bag-grid');grid.replaceChildren();
      for(const id of entries){const item=Gathering.items[id],b=document.createElement('button');b.className='bag-slot';b.type='button';b.setAttribute('aria-pressed',String(id===this.selected));b.setAttribute('aria-label',`${item.name}，${this.store.counts[id]} 件`);
        b.innerHTML=`<img src="assets/town/${item.art}.png" alt=""><span>${item.name}</span><b>×${this.store.counts[id]}</b>`;
        b.onclick=()=>{this.cancelDiscard();this.selected=id;this.render();grid.querySelector(`[aria-label^="${item.name}"]`)?.focus();};
        b.oncontextmenu=e=>{e.preventDefault();this.requestDiscard(id);};grid.append(b);}
      for(let i=entries.length;i<12;i++){const slot=document.createElement('div');slot.className='bag-slot empty';slot.setAttribute('aria-hidden','true');grid.append(slot);}
      const detail=document.querySelector('#bag-detail'),item=Gathering.items[this.selected];
      detail.innerHTML=item?`<img src="assets/town/${item.art}.png" alt="${item.name}"><h3>${item.name}</h3><p>花卉收藏 · 拥有 ${this.store.counts[this.selected]} 件</p><p>${item.description}</p>`:'<h3>行囊待满</h3><p>靠近路边花草，按 F 收集花朵或落瓣。它们会在这里留下江南的颜色。</p>';
      document.querySelector('#bag-save').textContent=this.store.saved?'花卉收藏自动保存在当前浏览器。':'当前浏览器无法保存，收藏将在关闭页面后丢失。';
      document.querySelector('#discard-menu').hidden=!this.pendingDiscard;
      if(this.pendingDiscard)document.querySelector('#discard-name').textContent=`丢弃 ${Gathering.items[this.pendingDiscard].name} ×1？`;
    }
  }
  window.InventoryView=InventoryView;
})();

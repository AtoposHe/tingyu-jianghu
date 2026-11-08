(() => {
  class InventoryView {
    constructor(store,onToggle,progression,onMethodChange=()=>{}) {
      this.store=store;this.onToggle=onToggle;this.root=document.querySelector('#inventory');this.selected=null;this.pendingDiscard=null;this.progression=progression;this.onMethodChange=onMethodChange;this.tab='items';this.reading=null;
      document.querySelector('#bag-toggle').onclick=()=>this.open();document.querySelector('#bag-close').onclick=()=>this.close();
      this.root.addEventListener('click',e=>{if(e.target===this.root)this.close();});
      document.querySelector('#discard-confirm').onclick=()=>this.confirmDiscard();
      document.querySelector('#discard-cancel').onclick=()=>this.cancelDiscard();
      document.querySelector('#bag-items-tab').onclick=()=>this.switchTab('items');
      document.querySelector('#bag-books-tab').onclick=()=>this.switchTab('books');
      document.querySelector('#book-back').onclick=()=>this.closeBook();
      document.querySelector('#book-use').onclick=()=>{if(this.progression?.selectMethod(this.reading)){this.onMethodChange();this.renderBooks();}};
    }
    get active(){return !this.root.hidden;}
    open(){this.onToggle();this.pendingDiscard=null;document.querySelector('#bag-feedback').textContent='';this.root.hidden=false;this.render();document.querySelector('#bag-close').focus({preventScroll:true});}
    close(){this.cancelDiscard();this.root.hidden=true;document.querySelector('#game').focus({preventScroll:true});}
    switchTab(tab){this.tab=tab;this.reading=null;this.cancelDiscard();this.render();document.querySelector(tab==='items'?'#bag-items-tab':'#bag-books-tab').focus({preventScroll:true});}
    closeBook(){const id=this.reading;this.reading=null;this.renderBooks();document.querySelector(`[data-book-id="${id}"]`)?.focus({preventScroll:true});}
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
      if(key==='f'){e.preventDefault();if(!e.repeat&&this.tab==='items')this.confirmDiscard();return;}
      if(key==='escape'&&this.reading){e.preventDefault();this.closeBook();return;}
      if(key==='escape'&&this.pendingDiscard){e.preventDefault();this.cancelDiscard();document.querySelector('#bag-close').focus({preventScroll:true});return;}
      if(key==='escape'||key==='b'){e.preventDefault();if(!e.repeat)this.close();return;}
      if(key==='tab'){const buttons=[...this.root.querySelectorAll('button')].filter(b=>!b.closest('[hidden]'));const i=buttons.indexOf(document.activeElement);e.preventDefault();buttons[(i+(e.shiftKey?-1:1)+buttons.length)%buttons.length]?.focus();}
    }
    renderBooks(){
      const ids=this.progression?.manualIds||[],grid=document.querySelector('#manual-grid');grid.replaceChildren();
      document.querySelector('#manual-empty').hidden=ids.length>0;
      document.querySelector('#manual-grid').hidden=!!this.reading;
      document.querySelector('#book-reader').hidden=!this.reading;
      for(const id of ids){
        const book=Manuals.get(id);if(!book)continue;
        const button=document.createElement('button');button.type='button';button.className='manual-book '+book.color;
        button.dataset.bookId=id;button.setAttribute('aria-label','阅读'+book.name);
        const cover=document.createElement('span');cover.className='manual-cover';
        const title=document.createElement('strong');title.textContent=book.name;
        const kind=document.createElement('small');kind.textContent=book.kind;cover.append(title,kind);
        const note=document.createElement('span');note.className='manual-book-note';note.textContent=this.progression.methodId===id?'当前修炼 · 点击阅读':book.kind+' · 点击阅读';
        button.append(cover,note);button.onclick=()=>{this.reading=id;this.renderBooks();document.querySelector('#book-back').focus({preventScroll:true});};grid.append(button);
      }
      const book=Manuals.get(this.reading);if(!book)return;
      document.querySelector('#book-title').textContent=book.name;document.querySelector('#book-source').textContent=book.source;
      const text=document.querySelector('#book-text');text.replaceChildren();
      for(const [name,content] of book.chapters){const section=document.createElement('section'),heading=document.createElement('h4'),paragraph=document.createElement('p');heading.textContent=name;paragraph.textContent=content;section.append(heading,paragraph);text.append(section);}
      document.querySelector('#book-explanation').textContent=book.explanation;
      const use=document.querySelector('#book-use');use.hidden=book.type!=='cultivation';use.disabled=this.progression.methodId===book.id;use.textContent=use.disabled?'当前正在修习此功法':'设为当前修炼功法';
    }
    render(){
      const isBooks=this.tab==='books';
      document.querySelector('#bag-items-tab').setAttribute('aria-pressed',String(!isBooks));
      document.querySelector('#bag-books-tab').setAttribute('aria-pressed',String(isBooks));
      document.querySelector('#bag-items').hidden=isBooks;document.querySelector('#bag-books').hidden=!isBooks;
      document.querySelector('#bag-item-hint').hidden=isBooks;
      this.renderBooks();
      const entries=Object.keys(Gathering.items).filter(id=>this.store.counts[id]);
      if(!entries.includes(this.selected))this.selected=entries[0]||null;
      document.querySelector('#bag-summary').textContent=isBooks?`已学典籍 · ${this.progression?.manualIds.length||0} 部 · 不占物品格`:`花卉收藏 · ${entries.length} 种 · 共 ${this.store.total} 件`;
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

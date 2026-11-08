(() => {
  class InventoryView {
    constructor(store,onToggle,progression,onMethodChange=()=>{},economy=null,onGearChange=()=>{}) {
      this.store=store;this.onToggle=onToggle;this.root=document.querySelector('#inventory');this.selected=null;this.pendingDiscard=null;this.progression=progression;this.onMethodChange=onMethodChange;this.tab='items';this.reading=null;this.economy=economy;this.onGearChange=onGearChange;
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
    open(){if(this.onToggle()===false)return;this.pendingDiscard=null;document.querySelector('#bag-feedback').textContent='';this.root.hidden=false;this.render();document.querySelector('#bag-close').focus({preventScroll:true});}
    close(){this.cancelDiscard();this.root.hidden=true;document.querySelector('#game').focus({preventScroll:true});}
    switchTab(tab){this.tab=tab;this.reading=null;this.cancelDiscard();this.render();document.querySelector(tab==='items'?'#bag-items-tab':'#bag-books-tab').focus({preventScroll:true});}
    closeBook(){const id=this.reading;this.reading=null;this.renderBooks();document.querySelector(`[data-book-id="${id}"]`)?.focus({preventScroll:true});}
    cancelDiscard(){this.pendingDiscard=null;document.querySelector('#discard-menu').hidden=true;}
    requestDiscard(id){if(!this.item(id)?.count)return;document.querySelector('#bag-feedback').textContent='';this.selected=id;this.pendingDiscard=id;this.render();document.querySelector('#discard-confirm').focus({preventScroll:true});}
    confirmDiscard(){
      const id=this.pendingDiscard;if(!id)return;
      const item=this.item(id),parts=id.split(':'),removed=parts.length>1?this.economy.discard(parts[0],parts[1]):this.store.discard(id,1);this.cancelDiscard();if(removed)this.onGearChange();this.render();
      document.querySelector('#bag-feedback').textContent=removed?`已丢弃 ${item.name} ×1`:'物品数量已变化，请重新选择。';
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
    item(id){
      if(!id)return null;
      const [kind,key]=id.split(':');
      if(kind==='ore'&&this.economy&&Object.hasOwn(Forge.ores,key)){const ore=Forge.ores[key];return {...ore,count:this.economy.ores[key],ore:key,kind:'锻造矿石',description:'村外采集所得，可交给铁师傅锻造武器，也可在铁铺出售。'};}
      if(kind==='herb'&&this.economy&&Object.hasOwn(Forge.herbs,key)){return {...Forge.herbs[key],count:this.economy.herbs[key],kind:'采集药草'};}
      if(kind==='medicine'&&this.economy&&Object.hasOwn(Forge.medicines,key)){return {...Forge.medicines[key],count:this.economy.medicines[key],medicine:Forge.medicines[key],kind:'药品'};}
      if(kind==='weapon'&&this.economy&&Object.hasOwn(Forge.weapons,key)){const weapon=Forge.weapons[key];return {...weapon,count:this.economy.weapons[key],weapon,kind:`兵器 · 武力 +${weapon.attack}`};}
      const item=Gathering.items[id];return item?{...item,count:this.store.counts[id],src:`assets/town/${item.art}.png`}:null;
    }
    icon(item){return item.src?`<img src="${item.src}" alt="${item.name}">`:`<span class="item-fallback">${item.name}</span>`;}
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
      document.querySelector('#bag-gold').textContent=String(this.economy?.gold||0);
      document.querySelector('#bag-equipped').textContent=this.economy?.equipped?`当前装备 · ${this.economy.equipped.name}（武力 +${this.economy.equipped.attack}）`:'当前装备 · 徒手';
      const entries=Object.keys(Gathering.items).filter(id=>this.store.counts[id]);
      if(this.economy){for(const id of Object.keys(Forge.ores))if(this.economy.ores[id])entries.push('ore:'+id);for(const id of Object.keys(Forge.weapons))if(this.economy.weapons[id])entries.push('weapon:'+id);for(const id of Object.keys(Forge.herbs))if(this.economy.herbs[id])entries.push('herb:'+id);for(const id of Object.keys(Forge.medicines))if(this.economy.medicines[id])entries.push('medicine:'+id);}
      if(!entries.includes(this.selected))this.selected=entries[0]||null;
      const total=this.store.total+(this.economy?.total||0);
      document.querySelector('#bag-summary').textContent=isBooks?`已学典籍 · ${this.progression?.manualIds.length||0} 部 · 不占物品格`:`物品材料 · ${entries.length} 种 · 共 ${total} 件`;
      document.querySelector('#bag-count').textContent=total;
      const grid=document.querySelector('#bag-grid');grid.replaceChildren();
      for(const id of entries){const item=this.item(id),b=document.createElement('button');b.className='bag-slot';b.type='button';b.setAttribute('aria-pressed',String(id===this.selected));b.setAttribute('aria-label',`${item.name}，${item.count} 件`);
        b.innerHTML=`${this.icon(item)}<span>${item.name}</span><b>×${item.count}</b>`;
        b.onclick=()=>{this.cancelDiscard();this.selected=id;this.render();grid.querySelector(`[aria-label^="${item.name}"]`)?.focus();};
        b.oncontextmenu=e=>{e.preventDefault();this.requestDiscard(id);};grid.append(b);}
      for(let i=entries.length;i<12;i++){const slot=document.createElement('div');slot.className='bag-slot empty';slot.setAttribute('aria-hidden','true');grid.append(slot);}
      const detail=document.querySelector('#bag-detail'),item=this.item(this.selected);
      detail.innerHTML=item?`${this.icon(item)}<h3>${item.name}</h3><p>${item.kind} · 拥有 ${item.count} 件</p><p>${item.description}</p>`:'<h3>行囊待满</h3><p>收集花卉、到村外采矿，或向铁师傅领取武师赠剑。</p>';
      if(item?.weapon){const button=document.createElement('button');button.type='button';button.className='equip-button';const equipped=this.economy.equippedId===item.weapon.id;button.textContent=equipped?'卸下武器 · 恢复徒手':'装备'+item.name;button.onclick=()=>{this.economy.equip(equipped?null:item.weapon.id);this.onGearChange();this.render();};detail.append(button);}
      if(item?.medicine){const button=document.createElement('button');button.type='button';button.className='equip-button';button.textContent='使用'+item.name;button.onclick=()=>{const result=this.economy.useMedicine(item.medicine.id,this.progression.hero);if(result.ok)this.onGearChange();this.render();document.querySelector('#bag-feedback').textContent=result.message;};detail.append(button);}
      document.querySelector('#bag-save').textContent=this.store.saved?'花卉收藏自动保存在当前浏览器。':'当前浏览器无法保存，收藏将在关闭页面后丢失。';
      document.querySelector('#discard-menu').hidden=!this.pendingDiscard;
      if(this.pendingDiscard)document.querySelector('#discard-name').textContent=`丢弃 ${this.item(this.pendingDiscard).name} ×1？`;
    }
  }
  window.InventoryView=InventoryView;
})();

/* A shop action always settles once, then repaints all wallet/material counts. */
(() => {
  class SmithyView{
    constructor(store,onClose,onChange,onMine){this.store=store;this.onClose=onClose;this.onChange=onChange;this.onMine=onMine;this.root=document.querySelector('#smithy');this.$=s=>this.root.querySelector(s);this.pending=null;this.timer=0;
      this.$('#smithy-close').onclick=()=>this.close();this.$('#smithy-claim').onclick=()=>this.settle(this.store.claim());
      this.$('#smithy-mine').onclick=()=>{this.close();this.onMine();};this.$('#forge-cancel').onclick=()=>this.cancel();this.$('#forge-confirm').onclick=()=>this.confirm();
    }
    get active(){return !this.root.hidden;}
    open(){this.root.hidden=false;this.pending=null;this.$('#smithy-feedback').textContent='';this.render();this.$('#smithy-close').focus({preventScroll:true});}
    close(){this.cancel();this.root.hidden=true;this.onClose();}
    cancel(){this.pending=null;this.$('#forge-order').hidden=true;}
    request(kind,id){this.pending={kind,id};const w=Forge.weapons[id],r=Forge.recipes[id];
      this.$('#forge-order-text').textContent=kind==='buy'?`购买${w.name} ×1，支付 ${w.price} 金币？`:`交付${Object.entries(r.ores).map(([ore,n])=>`${Forge.ores[ore].name} ×${n}`).join('、')}及 ${r.gold} 金币，锻造${w.name}？`;
      this.$('#forge-order').hidden=false;this.$('#forge-confirm').focus({preventScroll:true});}
    confirm(){const order=this.pending;if(!order)return;this.cancel();this.settle(order.kind==='buy'?this.store.buy(order.id):this.store.craft(order.id));}
    settle(result){this.$('#smithy-feedback').textContent=result.message;if(result.ok){this.onChange();this.root.classList.remove('forge-success');void this.root.offsetWidth;this.root.classList.add('forge-success');}this.render();}
    render(){const s=this.store;this.$('#smithy-realm').textContent=Martial.person('smith').realmName;this.$('#smithy-gold').textContent=String(s.gold);this.$('#smithy-materials').textContent=`铁矿石 ${s.ores.iron}　铜矿石 ${s.ores.copper}`;
      this.$('#smithy-claim').disabled=!s.commission||s.claimed;this.$('#smithy-claim').textContent=s.claimed?'赠剑已领取':s.commission?'凭条领取青锋剑 · 免费':'需武青山的赠剑凭条';
      this.$('#smithy-greeting').textContent=s.commission&&!s.claimed?'武师托我的剑已打磨好了。这把青锋送你，愿你握剑时记得为何出发。':'我是溪南铁铺的铁师傅。带矿来，我替你锻剑；若急着上路，也可挑一把现成的。';
      const shop=this.$('#smithy-goods'),craft=this.$('#smithy-recipes');shop.replaceChildren();craft.replaceChildren();
      for(const w of Object.values(Forge.weapons)){
        const card=document.createElement('article');card.className='smithy-product';card.innerHTML=`<img src="${w.src}" alt="${w.name}"><div><h4>${w.name}</h4><p>武力 +${w.attack} · 已有 ${s.weapons[w.id]||0} 把</p><small>${w.description}</small></div>`;
        const button=document.createElement('button');button.type='button';button.textContent=`购买 · ${w.price} 金币`;button.disabled=s.gold<w.price;button.onclick=()=>this.request('buy',w.id);card.append(button);shop.append(card);
      }
      for(const [id,r] of Object.entries(Forge.recipes)){
        const card=document.createElement('article');card.className='smithy-recipe';card.innerHTML=`<h4>${Forge.weapons[id].name}</h4><p>${Object.entries(r.ores).map(([ore,n])=>`${Forge.ores[ore].name} ${s.ores[ore]}/${n}`).join(' · ')}</p><small>工钱 ${r.gold} 金币 · 武力 +${Forge.weapons[id].attack}</small>`;
        const button=document.createElement('button');button.type='button';button.textContent='交付材料锻造';button.disabled=s.gold<r.gold||Object.entries(r.ores).some(([ore,n])=>s.ores[ore]<n);button.onclick=()=>this.request('craft',id);card.append(button);craft.append(card);
      }
      const sell=this.$('#smithy-sell');sell.replaceChildren();for(const ore of Object.values(Forge.ores)){const b=document.createElement('button');b.type='button';b.textContent=`出售${ore.name} ×1 · +${ore.price} 金币`;b.disabled=s.ores[ore.id]<1;b.onclick=()=>this.settle(s.sellOre(ore.id));sell.append(b);}
    }
    handleKey(e){if(e.key==='Escape'){e.preventDefault();if(this.pending)this.cancel();else this.close();}if(e.key==='Tab'){const buttons=[...this.root.querySelectorAll('button')].filter(b=>!b.disabled&&!b.closest('[hidden]'));const i=buttons.indexOf(document.activeElement);e.preventDefault();buttons[(i+(e.shiftKey?-1:1)+buttons.length)%buttons.length]?.focus();}}
  }
  window.SmithyView=SmithyView;
})();

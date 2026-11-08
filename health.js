/* Fictional character condition and clinic services; costs are settled in the wallet model. */
(() => {
 function trap(root,e){if(e.key!=='Tab')return;const controls=[...root.querySelectorAll('button,input')].filter(x=>!x.disabled&&!x.closest('[hidden]')),i=controls.indexOf(document.activeElement);e.preventDefault();controls[(i+(e.shiftKey?-1:1)+controls.length)%controls.length]?.focus();}
 class HealthView{
  constructor(store,getHero,onOpen,onClose,onChange){this.store=store;this.getHero=getHero;this.onOpen=onOpen;this.onClose=onClose;this.onChange=onChange;this.root=document.querySelector('#health');this.$=s=>this.root.querySelector(s);
   document.querySelector('#health-toggle').onclick=()=>this.open();this.$('#health-close').onclick=()=>this.close();this.$('#hero-name-save').onclick=()=>{const ok=store.setName(this.$('#hero-name-input').value);this.$('#health-feedback').textContent=ok?'名字已保存。':'请填写 1—10 字的名字，不使用尖括号或控制字符。';if(ok){this.render();this.onChange();}};
  }
  get active(){return !this.root.hidden;}
  render(){const h=this.store.condition(this.getHero());if(document.activeElement!==this.$('#hero-name-input'))this.$('#hero-name-input').value=h.name;this.$('#health-name').textContent=h.name;this.$('#health-realm').textContent=h.realmName;this.$('#health-status').textContent=h.status;this.$('#health-hp').textContent=`${h.currentHp} / ${h.maxHp}`;this.$('#health-mp').textContent=`${h.currentMp} / ${h.maxMp}`;this.$('#health-hp-bar').style.width=h.currentHp/h.maxHp*100+'%';this.$('#health-mp-bar').style.width=h.currentMp/h.maxMp*100+'%';this.$('#health-info').textContent=`十八岁 · 清河镖局出身 · 武力 ${h.attack} · 防御 ${h.defense} · 回灵 ${h.regen}`;this.$('#health-description').textContent=h.cost?'伤势与灵力消耗会保留。可在行囊服药，或到听雨林竹林中的杏竹医馆调养。':'气血充盈，呼吸平稳。修炼增长上限后，这里会同步更新。';}
  open(){if(this.active||this.onOpen()===false)return;this.root.hidden=false;this.$('#health-feedback').textContent='';this.render();this.$('#health-close').focus({preventScroll:true});}
  close(){this.root.hidden=true;this.onClose();}
  handleKey(e){trap(this.root,e);if(e.key==='Escape'||(e.key.toLowerCase()==='c'&&document.activeElement?.tagName!=='INPUT')){e.preventDefault();if(!e.repeat)this.close();}}
 }
 class DoctorView{
  constructor(store,getHero,onClose,onChange){this.store=store;this.getHero=getHero;this.onClose=onClose;this.onChange=onChange;this.root=document.querySelector('#doctor');this.$=s=>this.root.querySelector(s);this.$('#doctor-close').onclick=()=>this.close();this.$('#doctor-treat').onclick=()=>this.settle(store.treat(getHero()));}
  get active(){return !this.root.hidden;}
  open(){this.root.hidden=false;this.$('#doctor-feedback').textContent='';this.render();this.$('#doctor-close').focus({preventScroll:true});}
  close(){this.root.hidden=true;this.onClose();}
  settle(result){this.$('#doctor-feedback').textContent=result.message;if(result.ok)this.onChange();this.render();}
  render(){const s=this.store,h=s.condition(this.getHero());this.$('#doctor-realm').textContent=Martial.person('doctor').realmName;this.$('#doctor-gold').textContent=String(s.gold);this.$('#doctor-condition').textContent=`${h.name} · ${h.status}｜气血 ${h.currentHp}/${h.maxHp} · 灵力 ${h.currentMp}/${h.maxMp}`;this.$('#doctor-treat').textContent=h.cost?`治疗并调养 · ${h.cost} 金币`:'身体无恙 · 无需治疗';this.$('#doctor-treat').disabled=!h.cost||s.gold<h.cost;
   const goods=this.$('#doctor-goods');goods.replaceChildren();for(const m of Object.values(Forge.medicines)){const card=document.createElement('article');card.className='medicine-card';card.innerHTML=`<span class="medicine-icon">药</span><h4>${m.name}</h4><p>${m.description}</p><small>行囊已有 ${s.medicines[m.id]||0} 份</small>`;const b=document.createElement('button');b.type='button';b.textContent=`购买${m.name} · ${m.price} 金币`;b.disabled=s.gold<m.price;b.onclick=()=>this.settle(s.buyMedicine(m.id));card.append(b);goods.append(card);}
   const herbs=this.$('#doctor-herbs');herbs.replaceChildren();for(const herb of Object.values(Forge.herbs)){const card=document.createElement('article');card.className='herb-sale';card.innerHTML=`<img src="${herb.src}" alt="${herb.name}"><span>${herb.name} · 持有 ${s.herbs[herb.id]}</span>`;const b=document.createElement('button');b.type='button';b.textContent=`出售 1 份 · +${herb.price} 金币`;b.disabled=s.herbs[herb.id]<1;b.onclick=()=>this.settle(s.sellHerb(herb.id));card.append(b);herbs.append(card);}
  }
  handleKey(e){trap(this.root,e);if(e.key==='Escape'){e.preventDefault();this.close();}}
 }
 window.HealthView=HealthView;window.DoctorView=DoctorView;
})();

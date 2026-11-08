/* Persistent ailments are separate from recoverable battle HP. */
(() => {
 function trap(root,e){if(e.key!=='Tab')return;const controls=[...root.querySelectorAll('button,input')].filter(x=>!x.disabled&&!x.closest('[hidden]')),i=controls.indexOf(document.activeElement);e.preventDefault();controls[(i+(e.shiftKey?-1:1)+controls.length)%controls.length]?.focus();}
 function drawBody(canvas,symptoms,selected){
  canvas.setAttribute('aria-label',symptoms.length?'人体部位图，红色标识：'+symptoms.map(s=>s.body.name+' '+s.name).join('、'):'人体部位图，未发现异常，无红色标识');
  const c=canvas.getContext?.('2d');if(!c)return;c.clearRect(0,0,270,440);c.save();
  c.strokeStyle='#c5cbb788';c.lineWidth=1;c.setLineDash([3,6]);for(const y of [52,139,210,332]){c.beginPath();c.moveTo(22,y);c.lineTo(248,y);c.stroke();}c.setLineDash([]);
  c.fillStyle='#202725';c.beginPath();c.ellipse(135,49,25,32,0,0,Math.PI*2);c.fill();
  c.beginPath();c.moveTo(120,77);c.lineTo(119,92);c.bezierCurveTo(109,97,89,98,82,116);c.lineTo(65,177);c.lineTo(54,227);c.bezierCurveTo(48,244,54,254,64,251);c.bezierCurveTo(76,251,78,240,77,230);c.lineTo(88,177);c.lineTo(102,137);c.lineTo(104,214);c.bezierCurveTo(102,231,96,251,98,270);c.lineTo(105,315);c.lineTo(100,390);c.lineTo(89,409);c.bezierCurveTo(86,419,91,423,102,423);c.lineTo(120,423);c.lineTo(129,393);c.lineTo(132,313);c.lineTo(135,280);c.lineTo(139,313);c.lineTo(142,393);c.lineTo(151,423);c.lineTo(169,423);c.bezierCurveTo(180,423,185,419,181,409);c.lineTo(170,390);c.lineTo(166,315);c.lineTo(173,270);c.bezierCurveTo(175,251,168,231,166,214);c.lineTo(168,137);c.lineTo(182,177);c.lineTo(193,230);c.bezierCurveTo(192,240,194,251,206,251);c.bezierCurveTo(216,254,222,244,216,227);c.lineTo(205,177);c.lineTo(188,116);c.bezierCurveTo(181,98,161,97,151,92);c.lineTo(150,77);c.closePath();c.fill();
  // Region shading and a numbered marker link the silhouette to the symptom list.
  symptoms.forEach((s,i)=>{const {x,y}=s.body;c.save();const glow=c.createRadialGradient(x,y,2,x,y,31);glow.addColorStop(0,'#ed5f50');glow.addColorStop(.45,'#bd443ad9');glow.addColorStop(1,'#be3c3400');c.fillStyle=glow;c.beginPath();c.ellipse(x,y,32,35,0,0,Math.PI*2);c.fill();c.strokeStyle=i===selected?'#ffddae':'#ef8270';c.lineWidth=i===selected?2.5:1.5;c.beginPath();c.arc(x,y,14,0,Math.PI*2);c.stroke();c.fillStyle='#fff6dc';c.font='bold 13px Georgia';c.textAlign='center';c.textBaseline='middle';c.fillText(String(i+1),x,y);c.restore();});c.restore();
 }
 class HealthView{
  constructor(store,getHero,onOpen,onClose,onChange){this.store=store;this.getHero=getHero;this.onOpen=onOpen;this.onClose=onClose;this.onChange=onChange;this.selected=0;this.root=document.querySelector('#health');this.$=s=>this.root.querySelector(s);
   document.querySelector('#health-toggle').onclick=()=>this.open();this.$('#health-close').onclick=()=>this.close();this.$('#hero-name-save').onclick=()=>{const ok=store.setName(this.$('#hero-name-input').value);this.$('#health-feedback').textContent=ok?'名字已保存。':'请填写 1—10 字的名字，不使用尖括号或控制字符。';if(ok){this.render();this.onChange();}};
  }
  get active(){return !this.root.hidden;}
  render(){const h=this.store.condition(this.getHero());if(document.activeElement!==this.$('#hero-name-input'))this.$('#hero-name-input').value=h.name;this.$('#health-name').textContent=h.name;this.$('#health-realm').textContent=h.realmName;this.$('#health-status').textContent=h.status;this.$('#health-status').className=h.symptoms.length?'has-ailment':'';this.$('#health-hp').textContent=`${h.currentHp} / ${h.maxHp}`;this.$('#health-mp').textContent=`${h.currentMp} / ${h.maxMp}`;this.$('#health-hp-bar').style.width=h.currentHp/h.maxHp*100+'%';this.$('#health-mp-bar').style.width=h.currentMp/h.maxMp*100+'%';this.$('#health-info').textContent=`十八岁 · 清河镖局出身 · 武力 ${h.attack} · 防御 ${h.defense} · 回灵 ${h.regen}`;
   this.$('#symptom-count').textContent=h.symptoms.length?`${h.symptoms.length} 处`:'无异常';const list=this.$('#health-symptoms');list.replaceChildren();
   if(!h.symptoms.length){const empty=document.createElement('div');empty.className='healthy-note';empty.innerHTML='<b>身体康健</b><p>未见中毒、骨折或腹痛等异常。<br>气血充盈，行动自如。</p>';list.append(empty);}
   h.symptoms.forEach((s,i)=>{const card=document.createElement('button');card.type='button';card.className='symptom-card';card.setAttribute('aria-pressed',String(i===this.selected));const heading=document.createElement('strong');heading.textContent=`${i+1} · ${s.body.name} · ${s.name}`;const detail=document.createElement('p');detail.textContent=s.symptom;const care=document.createElement('small');care.textContent=s.care;card.append(heading,detail,care);if(s.source){const source=document.createElement('small');source.className='symptom-source';source.textContent='来源：'+s.source;card.append(source);}card.onclick=()=>{this.selected=i;this.render();};list.append(card);});
   this.$('#health-description').textContent='每次战斗结束后气血自动回满。中毒、骨折等伤病会持续保留，需用对应药品或到杏竹医馆诊治。';drawBody(this.$('#body-diagram'),h.symptoms,this.selected);
  }
  open(){if(this.active||this.onOpen()===false)return;this.root.hidden=false;this.selected=0;this.$('#health-feedback').textContent='';this.render();this.$('#health-close').focus({preventScroll:true});}
  close(){this.root.hidden=true;this.onClose();}
  handleKey(e){trap(this.root,e);if(e.key==='Escape'||(e.key.toLowerCase()==='c'&&document.activeElement?.tagName!=='INPUT')){e.preventDefault();if(!e.repeat)this.close();}}
 }
 class DoctorView{
  constructor(store,getHero,onClose,onChange){this.store=store;this.getHero=getHero;this.onClose=onClose;this.onChange=onChange;this.root=document.querySelector('#doctor');this.$=s=>this.root.querySelector(s);this.$('#doctor-close').onclick=()=>this.close();this.$('#doctor-treat').onclick=()=>this.settle(store.treat(getHero()));}
  get active(){return !this.root.hidden;}
  open(){this.root.hidden=false;this.$('#doctor-feedback').textContent='';this.render();this.$('#doctor-close').focus({preventScroll:true});}
  close(){this.root.hidden=true;this.onClose();}
  settle(result){this.$('#doctor-feedback').textContent=result.message;if(result.ok)this.onChange();this.render();}
  render(){const s=this.store,h=s.condition(this.getHero());this.$('#doctor-realm').textContent=Martial.person('doctor').realmName;this.$('#doctor-gold').textContent=String(s.gold);this.$('#doctor-condition').textContent=`${h.name} · ${h.status}｜`+(h.symptoms.length?h.symptoms.map(a=>a.body.name+' '+a.name).join('、'):'未发现持续性伤病');this.$('#doctor-treat').textContent=h.cost?`诊治全部伤病 · ${h.cost} 金币`:'身体无恙 · 无需治疗';this.$('#doctor-treat').disabled=!h.cost||s.gold<h.cost;
   const goods=this.$('#doctor-goods');goods.replaceChildren();for(const m of Object.values(Forge.medicines)){const card=document.createElement('article');card.className='medicine-card';card.innerHTML=`<img class="medicine-art" src="${m.src}" alt="${m.name}"><h4>${m.name}</h4><p>${m.description}</p><small>行囊已有 ${s.medicines[m.id]||0} 份</small>`;const b=document.createElement('button');b.type='button';b.textContent=`购买${m.name} · ${m.price} 金币`;b.disabled=s.gold<m.price;b.onclick=()=>this.settle(s.buyMedicine(m.id));card.append(b);goods.append(card);}
   const herbs=this.$('#doctor-herbs');herbs.replaceChildren();for(const herb of Object.values(Forge.herbs)){const card=document.createElement('article');card.className='herb-sale';card.innerHTML=`<img src="${herb.src}" alt="${herb.name}"><span>${herb.name} · 持有 ${s.herbs[herb.id]}</span>`;const b=document.createElement('button');b.type='button';b.textContent=`出售 1 份 · +${herb.price} 金币`;b.disabled=s.herbs[herb.id]<1;b.onclick=()=>this.settle(s.sellHerb(herb.id));card.append(b);herbs.append(card);}
  }
  handleKey(e){trap(this.root,e);if(e.key==='Escape'){e.preventDefault();this.close();}}
 }
 window.HealthView=HealthView;window.DoctorView=DoctorView;
})();

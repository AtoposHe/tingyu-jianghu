/* Active meditation, learned method selection, realm barriers and eventual custom titles. */
(() => {
  class CultivationView {
    constructor(progression,onOpen,onClose,onChange){
      this.progression=progression;this.onOpen=onOpen;this.onClose=onClose;this.onChange=onChange;
      this.root=document.querySelector('#cultivation');this.running=false;this.last=0;this.raf=0;this.renderClock=0;
      this.$=s=>this.root.querySelector(s);
      document.querySelector('#cultivation-toggle').onclick=()=>this.open();
      this.$('#meditate-toggle').onclick=()=>this.toggle();this.$('#cultivation-close').onclick=()=>this.close();
      this.$('#cultivation-method').onchange=e=>{this.pause();this.progression.selectMethod(e.target.value);this.render();};
      this.$('#title-save').onclick=()=>{
        const ok=this.progression.setTitle(this.$('#master-title').value);
        this.$('#title-feedback').textContent=ok?'封号已记入江湖。':'灵力超过一万且完成封号突破后，可填写 1—12 字的封号。';this.render();this.onChange();
      };
      document.addEventListener('visibilitychange',()=>{if(document.hidden)this.pause();});
      window.addEventListener('pagehide',()=>{this.pause();this.progression.save();});this.render();
    }
    get active(){return !this.root.hidden;}
    render(){
      const p=this.progression,h=p.hero,method=p.method,s=document.querySelector('#map-hero-realm');
      s.textContent=h.realmName;s.title=`气血 ${h.maxHp} · 灵力 ${h.maxMp} · 每回合回灵 ${h.regen}`;
      document.querySelector('#cultivation-toggle').textContent=p.learned?'打坐修炼 · R':'修为 · R';
      this.root.dataset.method=method?.animation||'breath';
      this.$('#cultivation-realm').textContent=h.realmName+(p.blocked?' · 待突破':'');
      this.$('#cultivation-stats').textContent=`气血 ${h.maxHp}　灵力 ${h.maxMp}　武力 ${h.attack}　防御 ${h.defense}`;
      const select=this.$('#cultivation-method'),signature=p.manualIds.join(',')+'|'+p.methodId;
      if(this.methodsSignature!==signature){
        select.replaceChildren();
        for(const book of Object.values(Manuals.catalogue).filter(book=>book.type==='cultivation')){
          const option=document.createElement('option');option.value=book.id;option.textContent=book.name+(p.manualIds.includes(book.id)?'':' · 未习得');option.disabled=!p.manualIds.includes(book.id);select.append(option);
        }
        select.value=p.methodId||'';select.disabled=!p.methods.length;this.methodsSignature=signature;
      }
      this.$('#cultivation-method-note').textContent=method?`${method.name} · 每 ${method.secondsPerPoint} 秒增长 1 点灵力。切换功法会先收功。`:'向武青山习得吐纳法后，可在这里选择功法。';
      this.$('#cultivation-progress').textContent=h.cap?`${h.maxMp} / ${h.cap} 灵力`:`${h.maxMp} 灵力 · ${p.spirit>10000?'封号之境':'宗师圆满'}`;
      this.$('#cultivation-bar').style.width=(h.required?Math.min(1,h.progress/h.required)*100:100)+'%';
      this.$('#practice-bar').style.width=(method?p.practiceProgress/method.secondsPerPoint*100:0)+'%';
      this.$('#cultivation-next').textContent=p.blocked?'灵力已抵达本境上限，继续打坐不会增长或囤积灵力。':method?`下一点灵力还需静修 ${p.nextSpirit} 秒，气血上限同时 +2。`:'尚未习得修炼功法。';
      this.$('#cultivation-skill').textContent=p.manualIds.includes('mountain')?'已习得 · 推山掌｜耗灵 8 · 护势减伤 60%':'尚未习得战斗招式';
      const gate=p.gate,upcoming=Martial.gates[p.rank];
      this.$('#breakthrough-card').classList.toggle('at-barrier',p.blocked);
      this.$('#breakthrough-name').textContent=upcoming?`${upcoming.from} → ${upcoming.to}`:'已越过宗师极境';
      this.$('#breakthrough-status').textContent=gate?'境界瓶颈 · 突破任务待开放':upcoming?`达到 ${upcoming.cap} 灵力后须完成突破任务`:'灵力超过 10000 后可自定封号';
      this.$('#breakthrough-description').textContent=upcoming?'突破任务将在后续剧情开放。到达上限后须先完成任务，不能靠持续打坐越过境界。':'大道由心，封号由你。';
      this.$('#breakthrough-button').disabled=true;
      this.$('#breakthrough-button').textContent=gate?'突破任务待开放':'境界之间均需突破';
      this.$('#breakthrough-button').hidden=!upcoming;
      const canTitle=p.rank===6&&p.spirit>10000;
      this.$('#title-section').hidden=!canTitle;
      if(canTitle&&document.activeElement!==this.$('#master-title'))this.$('#master-title').value=p.title;
      this.$('#meditate-toggle').disabled=!method||p.blocked;
      this.$('#meditate-toggle').textContent=this.running?'收功 · 暂停修炼':p.blocked?'等待突破任务':'开始打坐';
      this.$('#meditation-status').textContent=this.running?`${method.name} · 凝神运气`:p.blocked?'灵力盈满 · 收功候机':'心息归宁';
      this.root.classList.toggle('is-meditating',this.running);
      this.$('#cultivation-save').textContent=p.saved?'修炼进度与当前功法自动保存。':'当前浏览器无法保存修炼进度。';
    }
    open(){if(this.active||this.onOpen()===false)return;this.root.hidden=false;this.render();this.$('#cultivation-close').focus({preventScroll:true});}
    pause(){this.running=false;this.last=0;cancelAnimationFrame(this.raf);this.progression.save();this.render();}
    close(){this.pause();this.root.hidden=true;this.onClose();}
    toggle(){
      if(this.running){this.pause();return;}
      if(!this.progression.method||this.progression.blocked||document.hidden)return;
      this.running=true;this.last=0;this.renderClock=0;this.render();this.raf=requestAnimationFrame(t=>this.frame(t));
    }
    frame(now){
      if(!this.running||!this.active||document.hidden){this.pause();return;}
      const dt=this.last?Math.min(Math.max(0,(now-this.last)/1000),.25):0;this.last=now;this.renderClock+=dt;
      const changed=this.progression.meditate(dt);
      if(changed&&this.renderClock>=.25){this.renderClock=0;this.render();this.onChange();}
      if(this.progression.blocked){this.pause();this.onChange();return;}
      this.raf=requestAnimationFrame(t=>this.frame(t));
    }
    handleKey(e){
      const writing=['INPUT','TEXTAREA'].includes(document.activeElement?.tagName);
      if(e.key==='Tab'){const controls=[...this.root.querySelectorAll('button,select,input')].filter(b=>!b.disabled&&!b.closest('[hidden]'));const i=controls.indexOf(document.activeElement);e.preventDefault();controls[(i+(e.shiftKey?-1:1)+controls.length)%controls.length]?.focus();}
      if(e.key==='Escape'||(!writing&&e.key.toLowerCase()==='r')){e.preventDefault();if(!e.repeat)this.close();}
    }
  }
  window.CultivationView=CultivationView;
})();

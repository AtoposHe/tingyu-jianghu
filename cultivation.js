/* Meditation has no wall-clock/offline reward. Input and hidden tabs pause the practice. */
(() => {
  class CultivationView {
    constructor(progression,onOpen,onClose,onChange){
      this.progression=progression;this.onOpen=onOpen;this.onClose=onClose;this.onChange=onChange;
      this.root=document.querySelector('#cultivation');this.running=false;this.last=0;this.raf=0;
      this.$=s=>this.root.querySelector(s);
      document.querySelector('#cultivation-toggle').onclick=()=>this.open();
      this.$('#meditate-toggle').onclick=()=>this.toggle();this.$('#cultivation-close').onclick=()=>this.close();
      document.addEventListener('visibilitychange',()=>{if(document.hidden)this.pause();});
      window.addEventListener('pagehide',()=>{this.pause();this.progression.save();});this.render();
    }
    get active(){return !this.root.hidden;}
    render(){
      const p=this.progression,h=p.hero,s=document.querySelector('#map-hero-realm');
      s.textContent=h.realmName;s.title=`气血 ${h.maxHp} · 灵力 ${h.maxMp} · 每回合回灵 ${h.regen}`;
      document.querySelector('#cultivation-toggle').textContent=p.learned?'打坐修炼 · R':'修为 · R';
      this.$('#cultivation-realm').textContent=h.realmName;
      this.$('#cultivation-stats').textContent=`气血 ${h.maxHp}　灵力 ${h.maxMp}　武力 ${h.attack}　防御 ${h.defense}`;
      this.$('#cultivation-progress').textContent=h.required?`${h.progress} / ${h.required} 息`:'已达当前最高境界';
      this.$('#cultivation-bar').style.width=(h.required?h.progress/h.required*100:100)+'%';
      this.$('#cultivation-next').textContent=!p.learned?'先与武青山交手，落败后向他请教吐纳法。':h.required?`再静修 ${h.nextSpirit} 秒：灵力上限 +1、气血上限 +2。`:'宗师三重，静修已圆满。';
      this.$('#cultivation-skill').textContent=p.learned?'已习得 · 推山掌（8 灵力）｜护势抵挡下一击 60% 伤害':'尚未习得武学';
      this.$('#meditate-toggle').disabled=!p.learned||!h.required;
      this.$('#meditate-toggle').textContent=this.running?'收功 · 暂停修炼':'开始打坐';
      this.$('#meditation-status').textContent=this.running?'凝神吐纳 · 每秒积累一息修为':'心息归宁';
      this.root.classList.toggle('is-meditating',this.running);
    }
    open(){if(this.active||this.onOpen()===false)return;this.root.hidden=false;this.render();this.$('#meditate-toggle').focus({preventScroll:true});}
    pause(){this.running=false;this.last=0;cancelAnimationFrame(this.raf);this.progression.save();this.render();}
    close(){this.pause();this.root.hidden=true;this.onClose();}
    toggle(){
      if(this.running){this.pause();return;}
      if(!this.progression.learned||!this.progression.hero.required||document.hidden)return;
      this.running=true;this.last=0;this.render();this.raf=requestAnimationFrame(t=>this.frame(t));
    }
    frame(now){
      if(!this.running||!this.active||document.hidden){this.pause();return;}
      // Ignore long gaps rather than granting catch-up cultivation after suspension.
      const dt=this.last?Math.min(Math.max(0,(now-this.last)/1000),.25):0;this.last=now;
      if(this.progression.meditate(dt)){this.render();this.onChange();}
      if(!this.progression.hero.required){this.pause();return;}
      this.raf=requestAnimationFrame(t=>this.frame(t));
    }
    handleKey(e){
      if(e.key==='Tab'){const buttons=[this.$('#cultivation-close'),this.$('#meditate-toggle')].filter(b=>!b.disabled);const i=buttons.indexOf(document.activeElement);e.preventDefault();buttons[(i+(e.shiftKey?-1:1)+buttons.length)%buttons.length].focus();}
      if(e.key==='Escape'||e.key.toLowerCase()==='r'){e.preventDefault();if(!e.repeat)this.close();}
    }
  }
  window.CultivationView=CultivationView;
})();

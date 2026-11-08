/* A separate battle scene: rules settle at the impact frame, input unlocks
   only after both the player's animation and the automatic reply finish. */
(() => {
  'use strict';
  const clamp = (n, lo=0, hi=1) => Math.min(hi, Math.max(lo,n));
  const ease = t => 1-Math.pow(1-clamp(t),3);
  class SparringBattle {
    constructor(onReturn) {
      this.root=document.querySelector('#battle');
      this.stage=document.querySelector('#battle-stage');
      this.canvas=document.querySelector('#battle-canvas');
      this.assetsReady=false;this.frameLoadError=false;this.hitPause=0;
      this.fx=new BattleFX();
      this.ctx=this.canvas.getContext('2d');
      this.onReturn=onReturn;
      this.active=false;this.state=null;this.motion=null;this.floaters=[];
      this.time=0;this.last=0;this.raf=0;this.wait=0;this.busy=false;
      this.background=null;this.sceneReady=false;this.sceneError=false;this.sceneVersion=0;this.opponentId='trainer';
      this.$=s=>this.root.querySelector(s);
      this.selectScene(this.opponentId);
      QSprites.load().then(()=>{this.assetsReady=true;if(this.active)this.sync();}).catch(()=>{this.frameLoadError=true;if(this.active)this.sync();});
      this.$('#attack-button').addEventListener('click',()=>this.attack());
      this.$('#battle-yield').addEventListener('click',()=>this.yield());
      this.$('#battle-return').addEventListener('click',()=>this.leave());
      this.$('#battle-again').addEventListener('click',()=>this.start());
      this.observer=new ResizeObserver(()=>{if(this.active)this.resize();});
      this.observer.observe(this.root);this.observer.observe(this.stage);
      document.addEventListener('visibilitychange',()=>{this.last=0;});
      window.addEventListener('keydown',e=>{
        if(!this.active)return;
        const result=this.$('#battle-result');
        if(!result.hidden && e.key==='Tab') {
          const buttons=[...result.querySelectorAll('button')];
          const i=buttons.indexOf(document.activeElement);
          e.preventDefault();buttons[(i+(e.shiftKey?-1:1)+buttons.length)%buttons.length].focus();return;
        }
        if(e.key==='1'&&!e.repeat&&result.hidden){e.preventDefault();this.attack();}
      });
    }
    selectScene(opponentId) {
      this.opponentId=opponentId;this.scene=BattleScenes.forOpponent(opponentId);
      const version=++this.sceneVersion;this.sceneReady=false;this.sceneError=false;this.background=null;
      this.$('#battle-location').textContent=this.scene.name;
      this.$('#stage-caption').textContent=this.scene.caption;
      this.stage.dataset.scene=this.scene.id;
      this.canvas.setAttribute('aria-label',`${this.scene.name}，双方出招、受击与灵力变化的战斗画面`);
      BattleScenes.load(this.scene).catch(()=>{
        if(version===this.sceneVersion)this.sceneError=true;
        return BattleScenes.load(BattleScenes.scenes.village).catch(()=>null);
      }).then(image=>{
        if(version!==this.sceneVersion)return;
        this.background=image;this.sceneReady=true;
        if(this.sceneError)this.$('#stage-caption').textContent=this.scene.caption+' · 备用场景';
        if(this.active)this.sync();
      });
    }
    start(opponentId=this.opponentId) {
      cancelAnimationFrame(this.raf);
      this.selectScene(opponentId);
      this.state=CombatRules.create();this.active=true;this.busy=false;
      this.motion=null;this.floaters=[];this.wait=0;this.time=0;this.last=0;this.hitPause=0;
      this.root.hidden=false;this.root.closest('.game-frame').classList.add('in-battle');
      this.$('#battle-result').hidden=true;this.$('#combat-log').replaceChildren();
      this.log('切磋开始。双方状态已重置，你先出招。');
      this.resize();this.sync();this.callout('你的回合 · 以拳入江湖');
      this.$('#attack-button').focus({preventScroll:true});
      this.raf=requestAnimationFrame(t=>this.frame(t));
    }
    resize() {
      const rect=this.stage.getBoundingClientRect();
      this.width=rect.width;this.height=rect.height;
      this.dpr=Math.min(window.devicePixelRatio||1,2);
      this.canvas.width=Math.round(this.width*this.dpr);
      this.canvas.height=Math.round(this.height*this.dpr);
    }
    drawActor(c,side,pose) {
      const m=this.motion,active=m?.side===side;
      const frame=QSprites.chooseFrame(side,{attacking:active,progress:active?m.t/m.duration:0,
        action:m?.action,hitAt:m?.profile.hitAt,hit:(pose.recoil||0)>.12});
      c.save();c.rotate((pose.recoil||0)*.02);
      if(!QSprites.draw(c,frame,QSprites.height))QSprites.draw(c,side==='hero'?'heroIdle':'enemyIdle',QSprites.height);
      c.restore();
    }
    log(text) {
      const li=document.createElement('li');
      li.textContent=text;this.$('#combat-log').prepend(li);
      while(this.$('#combat-log').children.length>30)this.$('#combat-log').lastChild.remove();
    }
    callout(text) {this.$('#battle-callout').textContent=text;}
    sync() {
      for(const side of ['hero','enemy']) {
        const actor=this.state[side];
        for(const stat of ['hp','mp']) {
          const max=stat==='hp'?actor.maxHp:actor.maxMp;
          this.$(`#${side}-${stat}`).textContent=`${actor[stat]} / ${max}`;
          this.$(`#${side}-${stat}-bar`).style.width=`${actor[stat]/max*100}%`;
          this.$(`#${side}-${stat}-meter`).setAttribute('aria-valuenow',String(actor[stat]));
        }
      }
      this.$('#battle-round').textContent=String(this.motion?.round ?? this.state.round);
      this.stage.classList.toggle('skill-active',this.motion?.action==='skill');
      const ready=this.assetsReady&&this.sceneReady&&!this.busy&&this.state.phase==='player';
      this.$('#attack-button').disabled=!ready;
      this.$('#battle-yield').disabled=this.busy||!['player','enemy'].includes(this.state.phase);
      this.$('#battle-phase').textContent=this.busy?(this.motion?.side==='hero'?'少侠出招':'武师回合'):!this.assetsReady||!this.sceneReady?'正在入场':ready?'你的回合':'切磋结束';
      this.$('#turn-hint').textContent=this.frameLoadError?'素材加载失败，请刷新':!this.assetsReady?'正在载入Q版素材':!this.sceneReady?'正在载入战斗场景':ready?'请选择行动':this.busy?'招式进行中':'切磋结束';
    }
    attack() {
      if(!this.active||!this.assetsReady||!this.sceneReady||this.busy||this.state.phase!=='player')return;
      this.begin('hero','normal');
    }
    begin(side,action) {
      this.busy=true;this.wait=0;
      const profile=BattleMoves.choose(side,action);
      this.motion={side,action,profile,round:this.state.round,t:0,duration:profile.duration,hit:false};
      this.callout(side==='hero'?'无名少侠 · 直拳':action==='skill'?'陆青山 · 推山掌':'陆青山 · 试探拳');
      this.sync();
    }
    hit() {
      const m=this.motion,round=this.state.round;
      const outcome=CombatRules.resolve(this.state,m.side,m.action);
      const target=m.side==='hero'?'enemy':'hero';
      if(m.action==='skill')this.hitPause=.075;
      this.floaters.push({big:m.action==='skill',side:target,text:`−${outcome.damage}`,type:'damage',t:0});
      if(outcome.mpChange) this.floaters.push({side:m.side,text:`灵力 ${outcome.mpChange>0?'+':''}${outcome.mpChange}`,type:'mana',t:0});
      const actor=m.side==='hero'?'少侠':'陆青山';
      const victim=m.side==='hero'?'陆青山':'少侠';
      const energy=outcome.mpChange===0?'灵力已满':outcome.mpChange>0?`灵力 +${outcome.mpChange}`:`消耗 ${-outcome.mpChange} 灵力`;
      this.log(`第${round}回合 · ${actor}使出${outcome.move}，${victim}气血 −${outcome.damage}；${energy}。`);
      const card=this.$(target==='hero'?'.hero-card':'.enemy-card');
      card.classList.remove('is-hit');void card.offsetWidth;card.classList.add('is-hit');
      this.sync();
    }
    finish(kind) {
      this.busy=false;this.motion=null;this.wait=0;
      this.state.phase=kind;
      this.$('#battle-result').hidden=false;
      const title=kind==='victory'?'切磋获胜':kind==='defeat'?'胜败乃兵家常事':'承让，下次再会';
      this.$('#result-title').textContent=title;
      this.$('#result-message').textContent=kind==='victory'
        ?`经过 ${this.state.round} 回合，你以一双拳头赢得了陆青山的认可。剩余气血 ${this.state.hero.hp}，灵力 ${this.state.hero.mp}。`
        :kind==='defeat'?'陆青山及时收招：“根基尚浅，不必气馁。下次再来，我仍在这里等你。”'
        :'你抱拳认输，陆青山收势回礼：“切磋不争一时，随时再来。”';
      this.log(title+'。返回村庄后不保留切磋伤势。');this.callout('点到即止 · 以武会友');this.sync();
      this.$('#battle-return').focus({preventScroll:true});
    }
    yield() {if(this.active&&!this.busy&&this.state.phase==='player')this.finish('yield');}
    leave() {
      if(!this.active)return;
      this.active=false;cancelAnimationFrame(this.raf);this.motion=null;
      this.root.hidden=true;this.root.closest('.game-frame').classList.remove('in-battle');this.onReturn(this.state.phase);
    }
    frame(now) {
      if(!this.active)return;
      const dt=this.last?Math.min((now-this.last)/1000,.05):0;this.last=now;this.time+=dt;
      for(const f of this.floaters)f.t+=dt;
      this.floaters=this.floaters.filter(f=>f.t<1.3);
      if(this.motion) {
        const motionDt=this.hitPause>0?0:dt;this.hitPause=Math.max(0,this.hitPause-dt);
        this.motion.t+=motionDt;const p=this.motion.t/this.motion.duration;
        if(p>=this.motion.profile.hitAt&&!this.motion.hit){this.motion.hit=true;this.hit();}
        if(p>=1) {
          this.motion=null;
          if(['victory','defeat'].includes(this.state.phase))this.finish(this.state.phase);
          else if(this.state.phase==='enemy'){this.wait=.6;this.callout('武师凝神，准备回击…');this.sync();}
          else {this.busy=false;this.callout('你的回合 · 请选择招式');this.sync();this.$('#attack-button').focus({preventScroll:true});}
        }
      } else if(this.wait>0) {
        this.wait=Math.max(0,this.wait-dt);
        if(!this.wait)this.begin('enemy',CombatRules.enemyAction(this.state));
      }
      this.draw();this.raf=requestAnimationFrame(t=>this.frame(t));
    }
    positions() {
      // All coordinates live inside the dedicated stage, separate from status UI.
      const scale=Math.min((this.height-100)/QSprites.height,this.width/650,1.18);
      const y=this.height-45;
      return {hero:{x:this.width*.23,y},enemy:{x:this.width*.77,y},scale};
    }
    draw() {
      const c=this.ctx,w=this.width,h=this.height;
      if(!w||!h)return;
      c.setTransform(this.dpr,0,0,this.dpr,0,0);c.clearRect(0,0,w,h);
      if(!BattleScenes.draw(c,this.background,w,h,this.scene)){c.fillStyle='#d1d4b9';c.fillRect(0,0,w,h);}
      const shade=c.createLinearGradient(0,0,0,h);shade.addColorStop(0,'#f4efdf18');shade.addColorStop(.6,'#f4efdf00');shade.addColorStop(1,'#f4efdf28');c.fillStyle=shade;c.fillRect(0,0,w,h);
      const pos=this.positions(),m=this.motion,p=m?clamp(m.t/m.duration):0;
      const profile=m?.profile;
      const pose=m?BattleMoves.sample(profile,p):{travel:0,punch:0,palm:0,charge:0,step:0};
      const attacker=m?.side,defender=attacker==='hero'?'enemy':'hero';
      const sinceHit=m?.hit?Math.max(0,(p-profile.hitAt)/(1-profile.hitAt)):0;
      const recoil=m?.hit?Math.sin(Math.min(1,sinceHit*1.7)*Math.PI):0;
      const distance=Math.max(0,(pos.enemy.x-pos.hero.x)-112*pos.scale);
      const points={};
      if(m?.action==='skill')this.fx.background(c,{p,hitAt:profile.hitAt,pos,w,h,time:this.time});
      const shake=m?.action==='skill'?this.fx.shake(p,profile.hitAt):{x:0,y:0};
      c.save();c.translate(shake.x,shake.y);
      for(const side of attacker==='enemy'?['hero','enemy']:['enemy','hero']) {
        const active=side===attacker,dir=side==='hero'?1:-1;
        const isHit=side===defender&&m?.hit;
        const push=isHit?profile.knockback*recoil*pos.scale:0;
        const shake=isHit&&profile.id!=='mountain'?Math.sin(sinceHit*35)*5*(1-sinceHit):0;
        const x=pos[side].x+(active?dir*pose.travel*distance*(m.action==='skill' ? .16 : 1):0)-dir*push+shake;
        const y=pos[side].y+(active?-Math.sin(pose.travel*Math.PI)*3:Math.sin(this.time*2)*.7);
        points[side]={x,y};
        c.fillStyle='#3e59432c';c.beginPath();c.ellipse(x,y+2,43*pos.scale,10*pos.scale,0,0,Math.PI*2);c.fill();
        if(active&&pose.travel>0&&p<profile.hitAt-.05) {
          for(let trail=2;trail>0;trail--) {
            c.save();c.globalAlpha=.06*(3-trail);c.translate(x-dir*trail*14*pos.scale,y);c.scale(pos.scale*dir,pos.scale);
            this.drawActor(c,side,pose);c.restore();
          }
        }
        c.save();c.translate(x,y);c.scale(pos.scale*dir,pos.scale);
        this.drawActor(c,side,active?pose:{recoil:isHit?(profile.id==='mountain'?recoil*1.3:recoil*.5):0});
        if(isHit&&recoil>.15) {
          c.globalAlpha=recoil*(profile.id==='mountain' ? .11 : .16);c.fillStyle=profile.id==='mountain'?'#81e5de':'#fff1c6';
          c.beginPath();c.ellipse(0,-141,36,80,0,0,Math.PI*2);c.fill();
        }
        c.restore();
      }
      if(m)this.effects(m,p,pose,pos,points);
      for(const side of ['hero','enemy']) {
        c.font='11px "Songti SC",serif';c.textAlign='center';c.fillStyle='#344c3b';c.strokeStyle='#fff7df';c.lineWidth=3;
        const label=side==='hero'?'无名少侠 · 徒手':'陆青山 · 拳掌';c.strokeText(label,pos[side].x,pos[side].y+24);c.fillText(label,pos[side].x,pos[side].y+24);
      }
      for(const f of this.floaters) {
        const point=pos[f.side];
        c.save();c.globalAlpha=clamp((1.3-f.t)*2);c.textAlign='center';
        c.font=f.type==='damage'?(f.big?'bold 35px Georgia,serif':'bold 27px Georgia,serif'):'bold 12px "Songti SC",serif';
        c.fillStyle=f.type==='damage'?(f.big?'#995825':'#a34e37'):'#3a8393';c.strokeStyle='#fcf6e7';c.lineWidth=4;
        const y=Math.max(48,point.y-(f.type==='damage'?230:181)*pos.scale-f.t*24);
        const x=point.x+(f.type==='damage'?-28:35)*pos.scale;
        c.strokeText(f.text,x,y);c.fillText(f.text,x,y);c.restore();
      }
      c.restore();
    }
    effects(m,p,pose,pos,points) {
      const c=this.ctx,s=pos.scale,dir=m.side==='hero'?1:-1;
      const target=points[m.side==='hero'?'enemy':'hero'],actor=points[m.side];
      if(m.action==='skill') {
        this.fx.foreground(c,{p,hitAt:m.profile.hitAt,actor,target,dir,s,time:this.time,w:this.width,h:this.height});return;
      }
      const elapsed=p-m.profile.hitAt;
      if(elapsed>-.15&&elapsed<.08) {
        c.save();c.translate(actor.x,actor.y-145*s);c.scale(dir*s,s);c.globalAlpha=Math.sin(clamp((elapsed+.15)/.23)*Math.PI);
        for(let i=0;i<3;i++) {
          c.strokeStyle=i===1?'#fff6d3':m.side==='hero'?'#e3b35d':'#b7d8cb';c.lineWidth=i===1?4:1.6;
          c.beginPath();c.moveTo(24,-15+i*12);c.quadraticCurveTo(68,-22+i*15,106,-11+i*11);c.stroke();
        }
        c.restore();
      }
      if(elapsed>=0&&elapsed<.24) {
        const t=elapsed/.24;
        c.save();c.translate(target.x-dir*19*s,target.y-143*s);c.scale(s,s);c.globalAlpha=1-t;
        c.fillStyle='#fff0b4';c.strokeStyle=m.side==='hero'?'#dfae54':'#9cc7b6';c.lineWidth=2;
        c.beginPath();
        for(let i=0;i<16;i++){const a=i*Math.PI/8,r=i%2?8+t*9:29+t*22;i?c.lineTo(Math.cos(a)*r,Math.sin(a)*r):c.moveTo(Math.cos(a)*r,Math.sin(a)*r);}
        c.closePath();c.fill();c.stroke();
        for(let i=0;i<11;i++){const a=i*2.4,r=15+t*48;c.strokeStyle=i%2?'#c6e0bf':'#e0b764';c.lineWidth=2;c.beginPath();c.moveTo(Math.cos(a)*r,Math.sin(a)*r);c.lineTo(Math.cos(a)*(r+9),Math.sin(a)*(r+9));c.stroke();}
        c.restore();
      }
    }
  }
  window.SparringBattle=SparringBattle;
})();

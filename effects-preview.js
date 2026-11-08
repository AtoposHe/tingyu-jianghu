(() => {
  const $=s=>document.querySelector(s),canvas=$('#fx-canvas'),c=canvas.getContext('2d');
  const fx=new BattleFX(),profile=BattleMoves.profiles.mountain,scene=BattleScenes.forOpponent('trainer');let background=null;
  let ready=false,playing=true,p=0,cycle=0,last=0,time=0,w=0,h=0,dpr=1;
  const clamp=n=>Math.max(0,Math.min(1,n));
  function resize(){const rect=canvas.getBoundingClientRect();w=rect.width;h=rect.height;dpr=Math.min(devicePixelRatio||1,2);canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);}
  new ResizeObserver(resize).observe(canvas);
  function showProgress(){const value=Math.round(p*100);$('#progress').value=String(value);$('#progress-value').textContent=value+'%';$('#play-toggle').textContent=playing?'暂停':'重播';document.querySelectorAll('.phase').forEach(b=>b.setAttribute('aria-pressed',String(!playing&&Number(b.dataset.p)===value)));}
  function seek(value){p=clamp(value/100);cycle=p*profile.duration+.2;playing=false;showProgress();}
  document.querySelectorAll('.phase').forEach(b=>b.addEventListener('click',()=>seek(Number(b.dataset.p))));
  $('#progress').addEventListener('input',e=>seek(Number(e.target.value)));
  $('#play-toggle').addEventListener('click',()=>{if(playing)playing=false;else{playing=true;cycle=0;p=0;}showProgress();});
  function draw(){
    if(!ready||!w||!h)return;
    c.setTransform(dpr,0,0,dpr,0,0);c.clearRect(0,0,w,h);
    if(!BattleScenes.draw(c,background,w,h,scene)){c.fillStyle='#c6cfb2';c.fillRect(0,0,w,h);}
    const s=Math.min((h-105)/QSprites.height,w/650,1.14),y=h-42;
    const pos={hero:{x:w*.23,y},enemy:{x:w*.77,y},scale:s};
    fx.background(c,{p,hitAt:profile.hitAt,pos,w,h,time});
    const pose=BattleMoves.sample(profile,p),t=clamp((p-profile.hitAt)/(1-profile.hitAt));
    const recoil=p>=profile.hitAt?Math.sin(Math.min(1,t*1.7)*Math.PI):0;
    const points={hero:{x:pos.hero.x-profile.knockback*recoil*s,y},enemy:{x:pos.enemy.x-pose.travel*Math.max(0,pos.enemy.x-pos.hero.x-112*s)*.16,y}};
    const shake=fx.shake(p,profile.hitAt);c.save();c.translate(shake.x,shake.y);
    for(const side of ['hero','enemy']) {
      const point=points[side],dir=side==='hero'?1:-1;
      c.fillStyle='#3e59432c';c.beginPath();c.ellipse(point.x,y+2,43*s,10*s,0,0,Math.PI*2);c.fill();
      const frame=QSprites.chooseFrame(side,{hit:side==='hero'&&recoil>.12,attacking:side==='enemy',progress:p,hitAt:profile.hitAt,action:'skill'});
      c.save();c.translate(point.x,y);c.scale(s*dir,s);if(side==='hero')c.rotate(recoil*.02);QSprites.draw(c,frame,QSprites.height);c.restore();
    }
    fx.foreground(c,{p,hitAt:profile.hitAt,actor:points.enemy,target:points.hero,dir:-1,s,time,w,h});
    c.font='12px "Songti SC",serif';c.textAlign='center';c.fillStyle='#536e53';c.fillText('无名少侠',pos.hero.x,y+26);c.fillText('武青山',pos.enemy.x,y+26);
    if(p>=profile.hitAt&&p<.9){c.font='bold 32px Georgia,serif';c.strokeStyle='#fff6de';c.lineWidth=5;c.fillStyle='#9d5728';const ty=Math.max(70,y-230*s-(p-profile.hitAt)*48);c.strokeText('−20',points.hero.x-22*s,ty);c.fillText('−20',points.hero.x-22*s,ty);}
    c.restore();
  }
  function frame(now){const dt=last?Math.min((now-last)/1000,.05):0;last=now;if(ready&&playing){time+=dt;cycle=(cycle+dt)%(profile.duration+1);p=clamp((cycle-.2)/profile.duration);showProgress();}draw();requestAnimationFrame(frame);}
  Promise.all([QSprites.load(),fx.ready,BattleScenes.load(scene)]).then(([, ,image])=>{background=image;ready=true;$('#status').textContent='听雨武馆 · 特效已载入';document.querySelectorAll('button').forEach(b=>b.disabled=false);resize();}).catch(()=>$('#status').textContent='素材加载失败，请刷新页面');
  document.addEventListener('visibilitychange',()=>{last=0;});resize();requestAnimationFrame(frame);
})();

/* 听雨江湖 — vanilla Canvas prototype; no runtime dependencies. */
(() => {
  'use strict';
  const canvas = document.querySelector('#game');
  const ctx = canvas.getContext('2d');
  const $ = s => document.querySelector(s);
  const WORLD = { width: VillageMap.width, height: VillageMap.height };
  const hero = { ...VillageMap.spawn, facing: 1, walking: false };
  const heroRun=new HeroRun(),footDust=[];
  const npc = { id:'elder', name:'老村长', role:'听雨村 · 村长', src:'assets/q/village-chief.png', ...VillageMap.elder };
  const trainer = { id:'trainer', name:'武青山', role:'听雨村 · 武师', src:'assets/q/trainer-idle.png', ...VillageMap.trainer };
  const smith={id:'smith',name:'铁师傅',role:'溪南铁铺 · 铁匠',src:'assets/q/blacksmith.png',...VillageMap.smith};
  const villagers = [npc,trainer,smith];
  let activeNpc=npc;
  const spawn = VillageMap.spawn;
  const keys = new Set();
  const images = {};
  const camera = { x: 0, y: 0, scale: 1, width: 1280, height: 800 };
  let path = [], destination = null, pendingTalk = false;
  let dialogueOpen = false, currentNode = null, elapsed = 0, lastTime = 0;
  let typed = 0, textClock = 0, completed = false, animationId = 0;
  let toastTimer, audioContext = null, soundNodes = [], soundOn = false;
  let storage;try{storage=window.localStorage;}catch{}
  const martial=new Martial.Progression(storage);
  const economy=new Forge.ForgeState(storage);
  const battle = new SparringBattle((result,hadSkill) => {
    martial.recordBattle(result,hadSkill);
    if(hadSkill&&['victory','defeat'].includes(result))markStory('practice');
    cultivation.render();
    keys.clear();heroRun.reset();footDust.length=0;lastTime=0;canvas.focus({preventScroll:true});
    if(martial.needsLesson){openDialogue(trainer);showNode('trainerLesson');}
    else if(martial.practiced&&!economy.commission){openDialogue(trainer);showNode('trainerGift');}
    else announce('已返回听雨村。切磋点到即止，伤势已恢复。');
  },martial,economy);

  const walkable=VillageMap.walkable;
  const findPath=VillageMap.findPath;
  const propOpacity=new Map();
  const keepsakes=new Gathering(storage);
  let chosenFlower=null;
  function stopCollecting(){chosenFlower=null;$('#gather-prompt').hidden=true;$('#interaction').hidden=true;}
  const bag=new InventoryView(keepsakes,()=>{if(smithy.active||outskirts.active)return false;stopCollecting();keys.clear();path=[];destination=null;pendingTalk=false;heroRun.reset();hero.walking=false;},martial,()=>cultivation.render(),economy,()=>syncEquipment());
  bag.render();
  const chronicle=new JianghuStory(storage);
  const storyView=new StoryView(chronicle,()=>{
    if(battle.active||dialogueOpen||bag.active||cultivation.active||smithy.active||outskirts.active)return false;
    stopCollecting();keys.clear();path=[];destination=null;pendingTalk=false;heroRun.reset();hero.walking=false;
  },()=>{keys.clear();lastTime=0;canvas.focus({preventScroll:true});});
  const cultivation=new CultivationView(martial,()=>{
    if(battle.active||dialogueOpen||bag.active||storyView.active||cultivation.active||smithy.active||outskirts.active)return false;
    stopCollecting();keys.clear();path=[];destination=null;pendingTalk=false;heroRun.reset();hero.walking=false;
  },()=>{keys.clear();lastTime=0;canvas.focus({preventScroll:true});},()=>{
    if(martial.cultivation>=1)markStory('meditate');
  });
  function stopExploring(){stopCollecting();keys.clear();path=[];destination=null;pendingTalk=false;heroRun.reset();hero.walking=false;}
  function returnToMap(){keys.clear();lastTime=0;canvas.focus({preventScroll:true});}
  const outskirts=new OutskirtsView(economy,()=>{
    if(battle.active||dialogueOpen||bag.active||storyView.active||cultivation.active||smithy.active||outskirts.active)return false;
    stopExploring();
  },returnToMap,()=>syncEquipment());
  const smithy=new SmithyView(economy,returnToMap,()=>syncEquipment(),()=>outskirts.open());
  function syncEquipment(){bag.render();cultivation.render();if(economy.commission)markStory('commission');if(economy.claimed)markStory('sword');if(economy.crafted)markStory('forge');}
  // Older story saves cannot bypass the new lesson; new cultivation progress restores its goals.
  if(!martial.learned){chronicle.flags.spar=false;chronicle.flags.meditate=false;chronicle.flags.practice=false;chronicle.save();}
  else {markStory('spar');if(martial.cultivation>=1)markStory('meditate');if(martial.practiced)markStory('practice');}
  syncEquipment();
  storyView.open();
  function markStory(flag){chronicle.mark(flag);storyView.render();}
  function flowerNear(node){return Math.hypot(hero.x-node.x,hero.y-node.y)<66&&Math.abs(VillageMap.surfaceAt(hero.x,hero.y).height-VillageMap.surfaceAt(node.x,node.y).height)<2&&VillageMap.canStep(hero,node);}
  function nearestFlower(){return chosenFlower&&flowerNear(chosenFlower)?chosenFlower:Gathering.nodes.filter(flowerNear).sort((a,b)=>Math.hypot(a.x-hero.x,a.y-hero.y)-Math.hypot(b.x-hero.x,b.y-hero.y))[0];}
  function syncFlower(){
    const nearby=closestNpc(),node=nearestFlower(),blocked=dialogueOpen||battle.active||bag.active||storyView.active||cultivation.active||smithy.active||outskirts.active;
    const talk=$('#interaction'),flower=$('#gather-prompt');
    talk.hidden=blocked||!nearby;flower.hidden=blocked||!!nearby||!node;
    if(nearby&&talk.dataset.npc!==nearby.id){talk.dataset.npc=nearby.id;const kbd=document.createElement('kbd');kbd.textContent='E';talk.replaceChildren(kbd,document.createTextNode(` 与${nearby.name}交谈`));}
    if(!node)return;
    const remaining=keepsakes.remaining(node),item=Gathering.items[node.item];
    $('#gather-label').textContent=remaining?`${item.name} · 再生 ${remaining} 秒`:`收集 · ${item.name}`;
    flower.disabled=remaining>0;
  }
  function confirmFlower(){
    if(dialogueOpen||battle.active||bag.active||storyView.active||cultivation.active||smithy.active||outskirts.active||closestNpc())return;
    const node=nearestFlower();if(!node)return announce('请先走近路边花草，再按 F 收集。');
    if(keepsakes.remaining(node))return announce('花材还在再生，稍后再来看看。');
    keys.clear();path=[];destination=null;pendingTalk=false;heroRun.reset();
    if(keepsakes.collect(node)){markStory('flowers');bag.render();announce(`收集到 ${Gathering.items[node.item].name} ×1 · 已放入行囊`);}
    syncFlower();
  }
  $('#gather-prompt').onclick=confirmFlower;
  $('#interaction').onclick=()=>{const person=closestNpc();if(person)openDialogue(person);};
  function announce(text) {
    clearTimeout(toastTimer);
    $('#announcement').textContent=text;
    $('#announcement').classList.add('visible');
    toastTimer=setTimeout(()=>$('#announcement').classList.remove('visible'),2800);
  }

  const story = {
    greeting: { text:'小友，你手中这封信……字迹倒是眼熟。老夫是听雨村的村长，先歇歇脚。你远道而来，可是为了清河镖局的事？', next:'question' },
    question: { text:'这些年，村中有不少人问过夜渡旧案，可很少有人拿着旧物回来。你想先问些什么？', choices:[['请您看看这枚旧镖牌。','oldToken'],['请问此处是什么地方？','village'],['村长可有什么江湖忠告？','advice'],['向村长道别。','farewell']] },
    oldToken: { text:'这半枚水纹镖牌，我见过。十年前夜渡案后，最后一名归来的镖师就在杏花酒肆落过脚。你师父三个月前也来问过此事。先别独自追去，去找武馆的武青山，他与你师父有旧，能替你把把拳脚的根基。', next:'question',storyFlag:'chief' },
    village: { text:'这里是听雨村。西北石阶上的枕间客舍可以歇脚，西巷有杏花酒肆。过桥向北是听雨武馆，武师傅常在那里练武；你眼前这栋便是老夫的家。', next:'villageEnd' },
    villageEnd: { text:'不过今日不必急着赶路。听听溪声，看看山色，也是行走江湖的一番滋味。待你准备好了，再去见那更大的天地。', next:'question' },
    advice: { text:'呵呵，忠告谈不上。只记住：手中有剑，心中也要有一分善意。路见不平时肯停下脚步，才算得上真正的侠客。', next:'adviceEnd' },
    adviceEnd: { text:'莫急着问天下第一是谁。先认清脚下的路，珍惜眼前的人。江湖里的好故事，往往便从一句问候开始。', next:'question' },
    farewell: { text:'去吧，小友。愿你此去，有清风相伴，有知己同行。若哪天走累了，听雨村里总有一盏茶等你。', next:null, completes:true },
    return: { text:'小友，又见面了。江湖路上可有什么新鲜事？坐下来慢慢说，老夫最不缺的，便是听故事的工夫。', next:'question' },
    trainer: { text:'清河镖局的人？你师父曾与我并肩护过镖。寻人要紧，但江湖路远，光凭一腔急切可不够。你尚未习得武学，先以拳脚与我走几招。你只有淬体二段、二十点灵力，我已是通脉五段、百五十点灵力。先认真交手，看看根基的差距；落败后我再传你掌法和吐纳法。', choices:[['请指教，开始切磋！','startBattle'],['下次再来。','trainerBye']] },
    trainerLesson: { text:'你肯认真走完这几招，便值得教。我这一式推山掌只需八点灵力：先沉肩护住中门，再吐劲推出。护势能替你抵去下一击六成伤害；你现在二十点灵力，已够起掌。', next:'trainerBreathing' },
    trainerBreathing: { text:'但招式撑得一时，根基才撑得长久。打坐时凝神调息，静修两分钟，灵力上限才增一点，气血也增两点；灵力决定境界，每境分十段。淬体到一百点时，必须完成突破历练才能进入通脉；历练尚未开启时就先收功，不能硬练越境。莫急，回合间双方都会自然回灵。', choices:[['谨记教诲，学习推山掌与吐纳法。','learnMartial'],['容我再想想。','trainerBye']] },
    trainerLearned: { text:'推山掌与吐纳法已记下。按 R 查看修为并开始打坐；每回合结束，你会回灵两点。现在再试一次，用推山掌护势，应能多撑几招。仍胜不了我也无妨，日积月累才有精进。', choices:[['以推山掌再次请教！','startBattle'],['先打坐修炼。','openCultivation'],['稍后再来。','trainerBye']] },
    trainerReturn: { text:'掌势可曾记牢？你我都遵循同样的修炼之道：修为进境，气血灵力随之增长，境界提升后拳劲、防御与回灵也会增长。打坐贵在恒久，切磋贵在体会。', choices:[['请指教，切磋一场。','startBattle'],['去打坐修炼。','openCultivation'],['稍后再来。','trainerBye']] },
    trainerGift: {text:'掌势虽嫩，你已经懂得进退。你师父当年护镖用的是剑，我托溪南铁铺的铁师傅留了一把青锋，赠你作启程之礼。拿这张凭条去领取吧。记住，佩剑先问为何出鞘。',choices:[['收下取剑凭条。','acceptSword'],['容我稍后再来。','trainerBye']]},
    trainerGiftAccepted: {text:'取剑凭条收好了。铁铺在村子的右侧，门朝西，铁师傅就在门前。取到剑后，在行囊里装备它，出手便是基础劈砍。日后到村外石坡采得矿石，也可请他锻造更合手的剑。',choices:[['这就去铁铺取剑。','findSmith'],['我先在村中走走。','trainerBye']]},
    trainerGiftReminder: {text:'那把青锋还在铁师傅手中。沿东巷去村子右侧的溪南铁铺，凭条领取便是。他也收购矿石，你若缺盘缠，可以采些多余的矿石换金币。',choices:[['前往溪南铁铺。','findSmith'],['再请教一次拳脚。','startBattle'],['稍后再去。','trainerBye']]},
    trainerBye: { text:'好，练武贵在持之以恒。我就在听雨武馆门前，少侠随时可以来找我。', next:null },
  };
  function showNode(id) {
    currentNode=story[id]; typed=0; textClock=0;
    $('#dialogue-text').textContent='';
    $('#choices').replaceChildren();
    $('#dialogue-next').hidden=false;
    $('#dialogue-next').innerHTML='继续 <span>↵</span>';
  }
  function revealActions() {
    if(currentNode.choices) {
      $('#dialogue-next').hidden=true;
      if($('#choices').children.length) return;
      for(const [label,id] of currentNode.choices) {
        const button=document.createElement('button');
        button.type='button'; button.textContent=label;
        button.addEventListener('click',()=>{
          if(id==='startBattle') {
            closeDialogue();keys.clear();path=[];destination=null;pendingTalk=false;
            $('#interaction').hidden=true;battle.start(activeNpc.id);
          } else if(id==='acceptSword'){economy.acceptCommission();syncEquipment();showNode('trainerGiftAccepted');}
          else if(id==='findSmith'){closeDialogue();requestTalk(smith);}
          else if(id==='learnMartial') {
            if(martial.learn()){markStory('spar');cultivation.render();bag.render();announce('习得推山掌与吐纳法 · 战斗按 2 施掌，地图按 R 修炼');}
            showNode('trainerLearned');
          } else if(id==='openCultivation'){closeDialogue();cultivation.open();}
          else showNode(id);
        });
        $('#choices').append(button);
      }
      $('#choices button')?.focus({preventScroll:true});
    } else {
      $('#dialogue-next').innerHTML=currentNode.next?'继续 <span>↵</span>':'告辞，后会有期 <span>↵</span>';
    }
  }
  function openDialogue(person=npc) {
    if(dialogueOpen) return;
    if(person===smith){stopExploring();smithy.open();return;}
    stopCollecting();
    activeNpc=person;
    path=[]; destination=null; pendingTalk=false; keys.clear();heroRun.reset();hero.walking=false;
    dialogueOpen=true; $('#dialogue').hidden=false; $('#interaction').hidden=true;
    $('#speaker-name').textContent=person.name;
    $('.portrait-wrap img').src=person.src;
    $('.portrait-wrap img').alt=person.name;
    $('#npc-identity').textContent=person.name+' · '+person.role.split(' · ').pop();
    $('#npc-realm').textContent=Martial.person(person.id).realmName;
    showNode(person===trainer?(martial.needsLesson?'trainerLesson':martial.learned?(martial.practiced&&!economy.commission?'trainerGift':economy.commission&&!economy.claimed?'trainerGiftReminder':'trainerReturn'):'trainer'):completed?'return':'greeting');
    $('#dialogue-next').focus({preventScroll:true});
  }
  function closeDialogue() {
    if(activeNpc===npc && currentNode?.completes && typed>=currentNode.text.length) {
      completed=true;
      announce('江湖初识 · 你拜访了老村长');
    }
    dialogueOpen=false; $('#dialogue').hidden=true; keys.clear();
    storyView.render();
    canvas.focus({preventScroll:true});
  }
  function advance() {
    if(!dialogueOpen) return;
    if(typed<currentNode.text.length) {
      typed=currentNode.text.length;
      $('#dialogue-text').textContent=currentNode.text;
      revealActions(); return;
    }
    if(currentNode.storyFlag)markStory(currentNode.storyFlag);
    if(currentNode.choices) return;
    if(currentNode.next) showNode(currentNode.next); else closeDialogue();
  }
  const nearNpc=(person)=>Math.hypot(hero.x-person.x,hero.y-person.y)<78&&Math.abs(VillageMap.surfaceAt(hero.x,hero.y).height-VillageMap.surfaceAt(person.x,person.y).height)<2;
  const closestNpc=()=>villagers.filter(nearNpc).sort((a,b)=>Math.hypot(hero.x-a.x,hero.y-a.y)-Math.hypot(hero.x-b.x,hero.y-b.y))[0];
  function requestTalk(person=npc) {
    if(battle.active||storyView.active||bag.active||cultivation.active||smithy.active||outskirts.active)return;
    stopCollecting();
    if(nearNpc(person)) return openDialogue(person);
    const target=person.talk||{x:person.x,y:person.y+45};
    path=findPath(hero,target);
    if(!path.length) return announce('换个位置，再去拜访村长吧。');
    pendingTalk=person; destination=path[path.length-1];
  }
  $('#find-trainer').addEventListener('click',()=>requestTalk(trainer));
  $('#quest').addEventListener('click',()=>{
    if(storyView.active||bag.active||battle.active||dialogueOpen||cultivation.active||smithy.active||outskirts.active)return;
    if(chronicle.next==='chief')requestTalk(npc);
    else if(['spar','practice','commission'].includes(chronicle.next))requestTalk(trainer);
    else if(chronicle.next==='sword')requestTalk(smith);
    else if(chronicle.next==='forge'){if(economy.ores.iron>=4&&economy.ores.copper>=1)requestTalk(smith);else outskirts.open();}
    else if(chronicle.next==='meditate')cultivation.open();
    else if(chronicle.next==='flowers'){
      const node=Gathering.nodes.filter(n=>!keepsakes.remaining(n)).sort((a,b)=>Math.hypot(a.x-hero.x,a.y-hero.y)-Math.hypot(b.x-hero.x,b.y-hero.y))[0];
      if(node){chosenFlower=node;keys.clear();pendingTalk=false;path=flowerNear(node)?[]:findPath(hero,node);destination=path[path.length-1]||null;announce('走近花草后按 F 收集，再按 B 查看行囊。');}
    }else storyView.open();
  });
  $('#dialogue-next').addEventListener('click',advance);
  $('#close-dialogue').addEventListener('click',closeDialogue);
  $('#reset').addEventListener('click',()=>{
    stopCollecting();
    if(dialogueOpen) closeDialogue();
    hero.x=spawn.x; hero.y=spawn.y; hero.walking=false;heroRun.reset();footDust.length=0;path=[]; destination=null; keys.clear(); pendingTalk=false;
    announce('已回到南埠村口。过石桥后向东南走，可到村长家拜访老村长。');
  });
  const movementKeys=['w','a','s','d','arrowup','arrowleft','arrowdown','arrowright'];
  window.addEventListener('keydown',e=>{
    if(battle.active)return;
    if(storyView.active){storyView.handleKey(e);return;}
    if(smithy.active){smithy.handleKey(e);return;}
    if(outskirts.active){outskirts.handleKey(e);return;}
    if(cultivation.active){cultivation.handleKey(e);return;}
    const key=e.key.toLowerCase();
    if(bag.active){
      bag.handleKey(e);
      return;
    }
    if(!dialogueOpen&&key==='r'){e.preventDefault();if(!e.repeat)cultivation.open();return;}
    if(!dialogueOpen&&key==='b'){e.preventDefault();if(!e.repeat)bag.open();return;}
    if(!dialogueOpen&&key==='f'){e.preventDefault();if(!e.repeat)confirmFlower();return;}
    if(dialogueOpen) {
      if(key==='tab') {
        const buttons=[...$('#dialogue').querySelectorAll('button:not([hidden])')].filter(b=>!b.closest('[hidden]'));
        const i=buttons.indexOf(document.activeElement);
        e.preventDefault(); buttons[(i+(e.shiftKey?-1:1)+buttons.length)%buttons.length]?.focus();
      }
      if(key==='escape') { e.preventDefault(); closeDialogue(); }
      if((key==='enter'||key==='e'||key===' ') && document.activeElement?.tagName!=='BUTTON') {e.preventDefault(); if(!e.repeat) advance();}
      return;
    }
    if(document.activeElement?.tagName==='BUTTON'&&document.activeElement.id!=='gather-prompt') return;
    if(movementKeys.includes(key)) { e.preventDefault();stopCollecting(); keys.add(key); path=[]; destination=null; pendingTalk=false; }
    if((key==='e'||key===' ') && !e.repeat) {e.preventDefault(); const person=closestNpc();if(person) openDialogue(person); else announce('走近人物即可交谈，也可点击“寻访武师”切磋。');}
  });
  window.addEventListener('keyup',e=>keys.delete(e.key.toLowerCase()));
  window.addEventListener('blur',()=>keys.clear());
  document.addEventListener('visibilitychange',()=>{keys.clear();lastTime=0;if(document.hidden&&audioContext?.state==='running')audioContext.suspend();else if(!document.hidden&&soundOn)audioContext?.resume();});
  canvas.addEventListener('pointerdown',e=>{
    if(dialogueOpen||battle.active||bag.active||storyView.active||cultivation.active||smithy.active||outskirts.active) return;
    stopCollecting();
    canvas.focus({preventScroll:true});
    const rect=canvas.getBoundingClientRect();
    const p={x:(e.clientX-rect.left)/camera.scale+camera.x,y:(e.clientY-rect.top)/camera.scale+camera.y};
    const clicked=villagers.find(person=>Math.hypot(p.x-person.x,p.y-(person.y-25))<47);
    if(clicked) {requestTalk(clicked);return;}
    const flower=Gathering.nodes.find(n=>Math.hypot(p.x-n.x,p.y-(n.y-20))<35);
    if(flower){chosenFlower=flower;pendingTalk=false;path=flowerNear(flower)?[]:findPath(hero,flower);destination=path[path.length-1]||null;if(!path.length&&!flowerNear(flower))announce('请沿道路走近这处花草。');return;}
    pendingTalk=false;
    if(!walkable(p.x,p.y)) {announce('那里暂时无法通行，沿着小路走走吧。');return;}
    path=findPath(hero,p);
    if(path.length) destination=path[path.length-1];
    else {destination=null;if(Math.hypot(hero.x-p.x,hero.y-p.y)>30)announce('此处无法直达，请沿石桥、台阶或西巷缓坡通行。');}
  });

  function resize() {
    const rect=canvas.getBoundingClientRect(), dpr=Math.min(window.devicePixelRatio||1,2);
    canvas.width=Math.round(rect.width*dpr); canvas.height=Math.round(rect.height*dpr);
    camera.scale=rect.height/WORLD.height;
    camera.width=rect.width/camera.scale; camera.height=WORLD.height;
  }
  new ResizeObserver(resize).observe(canvas);
  function move(dx,dy) {
    if(VillageMap.canStep(hero,{x:hero.x+dx,y:hero.y+dy})) {hero.x+=dx;hero.y+=dy;return true;}
    let moved=false;
    if(dx && VillageMap.canStep(hero,{x:hero.x+dx,y:hero.y})) {hero.x+=dx;moved=true;}
    if(dy && VillageMap.canStep(hero,{x:hero.x,y:hero.y+dy})) {hero.y+=dy;moved=true;}
    return moved;
  }
  function update(dt) {
    const oldX=hero.x,oldY=hero.y;
    hero.walking=false;
    if(battle.active){heroRun.reset();footDust.length=0;return;}
    if(storyView.active){heroRun.reset();return;}
    if(bag.active||cultivation.active||smithy.active||outskirts.active){heroRun.reset();return;}
    for(let i=footDust.length-1;i>=0;i--) {
      footDust[i].life-=dt;if(footDust[i].life<=0)footDust.splice(i,1);
    }
    if(!dialogueOpen) {
      const dx=(keys.has('d')||keys.has('arrowright')?1:0)-(keys.has('a')||keys.has('arrowleft')?1:0);
      const dy=(keys.has('s')||keys.has('arrowdown')?1:0)-(keys.has('w')||keys.has('arrowup')?1:0);
      if(dx||dy) {
        const len=Math.hypot(dx,dy);
        const speed=172*VillageMap.surfaceAt(hero.x,hero.y).speed;
        hero.walking=move(dx/len*speed*dt,dy/len*speed*dt);
      } else if(path.length) {
        // Consume reached waypoints without inserting a frozen frame per cell.
        while(path.length&&Math.hypot(path[0].x-hero.x,path[0].y-hero.y)<.1)path.shift();
        if(path.length) {
        const next=path[0], vx=next.x-hero.x, vy=next.y-hero.y, dist=Math.hypot(vx,vy);
        const step=Math.min(dist,172*dt*VillageMap.surfaceAt(hero.x,hero.y).speed);
          hero.walking=move(vx/dist*step,vy/dist*step);
          if(!hero.walking) {path=[];pendingTalk=false;destination=null;}
        }
        if(!path.length)destination=null;
      }
      if(pendingTalk && nearNpc(pendingTalk)) openDialogue(pendingTalk);
    } else {
      textClock+=dt;
      if(typed<currentNode.text.length) {
        const count=Math.floor(textClock*36);
        if(count>0) {typed=Math.min(currentNode.text.length,typed+count);textClock-=count/36;$('#dialogue-text').textContent=currentNode.text.slice(0,typed);}
        if(typed===currentNode.text.length)revealActions();
      }
    }
    const distance=dialogueOpen?0:Math.hypot(hero.x-oldX,hero.y-oldY);
    hero.walking=distance>.001;
    if(Math.abs(hero.x-oldX)>.001)hero.facing=hero.x>oldX?1:-1;
    heroRun.update(distance,dt);
    if(heroRun.footfalls&&hero.walking)footDust.push({x:hero.x-hero.facing*5,y:hero.y+1,life:.32});
    const targetX=Math.max(0,Math.min(WORLD.width-camera.width,hero.x-camera.width*.5));
    camera.x+=(targetX-camera.x)*Math.min(1,dt*8);
    syncFlower();
    const area=VillageMap.surfaceAt(hero.x,hero.y).name;
    if($('#area-name').textContent!==area)$('#area-name').textContent=area;
    for(const prop of VillageMap.props) {
      const [x,y,w,h]=prop.box;
      const obscures=hero.y<prop.depth&&hero.x>x+12&&hero.x<x+w-12&&hero.y>y+35&&hero.y-65<y+h;
      const alpha=propOpacity.get(prop.id)??1;
      propOpacity.set(prop.id,alpha+((obscures ? .42 : 1)-alpha)*Math.min(1,dt*9));
    }
  }
  function roundRect(x,y,w,h,r,fill,stroke) {
    ctx.beginPath();ctx.roundRect(x,y,w,h,r);ctx.fillStyle=fill;ctx.fill();
    if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=1;ctx.stroke();}
  }
  function character(image,x,y,isHero=false,person=null) {
    // Run PNGs already contain the up/down gait; keep a fixed ground anchor.
    const bob=isHero&&heroRun.blend?0:Math.sin(elapsed*2)*.55;
    const shadow=isHero?1-Math.sin(heroRun.phase*Math.PI*4)**2*.12*heroRun.blend:1;
    ctx.fillStyle='#344d3a26';ctx.beginPath();ctx.ellipse(x,y+2,20*shadow,7*shadow,0,0,Math.PI*2);ctx.fill();
    if(isHero) {
      ctx.strokeStyle='#fcf3ceae';ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(x,y+2,25,10,0,0,Math.PI*2);ctx.stroke();
      ctx.fillStyle='#fcf3ce18';ctx.fill();
    }
    ctx.save();ctx.translate(x,y+bob);if(isHero)ctx.scale(hero.facing,1);else if(person===trainer)ctx.scale(-1,1);
    if(isHero) {
      // A short blend avoids snapping between the guard and first/last stride.
      ctx.globalAlpha=1-heroRun.blend;
      WeaponSprites.drawHero(ctx,'heroIdle',77,economy.equippedId);
      ctx.globalAlpha=heroRun.blend;
      WeaponSprites.drawHero(ctx,heroRun.frame,77,economy.equippedId);
      ctx.globalAlpha=1;
    } else if(person===trainer)QSprites.drawImage(ctx,image,'enemyIdle',77);
    else {const ratio=image.naturalWidth/image.naturalHeight;const w=77*ratio;ctx.drawImage(image,-w/2,-77,w,77);}
    ctx.restore();
    const text=isHero?'无名少侠':person.name;
    ctx.font='12px "Songti SC",serif';ctx.textAlign='center';
    ctx.fillStyle='#fff8df';ctx.strokeStyle='#31432bd9';ctx.lineWidth=3.5;
    ctx.strokeText(text,x,y-82);ctx.fillText(text,x,y-82);
    if(!isHero) {
      const b=Math.sin(elapsed*3)*3;
      roundRect(x-10,y-111+b,20,22,6,person===trainer?'#ead5ab':completed?'#f1edcf':'#f5e5a9','#a8915a');
      ctx.fillStyle='#8d713c';ctx.font='bold 14px serif';ctx.fillText(person===smith?'锻':person===trainer?'武':completed?'…':'!',x,y-95+b);
    }
  }
  function draw() {
    if(battle.active)return;
    const dpr=Math.min(window.devicePixelRatio||1,2);
    ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,canvas.width/dpr,canvas.height/dpr);
    ctx.scale(camera.scale,camera.scale);ctx.translate(-camera.x,-camera.y);
    ctx.drawImage(images.terrain,0,0,WORLD.width,WORLD.height);
    if(destination) {
      ctx.strokeStyle='#617b5b66';ctx.lineWidth=1.5;ctx.setLineDash([3,7]);
      ctx.beginPath();ctx.moveTo(hero.x,hero.y);for(const p of path)ctx.lineTo(p.x,p.y);ctx.stroke();ctx.setLineDash([]);
      const radius=10+Math.sin(elapsed*5)*2;
      ctx.strokeStyle='#f6f0cf';ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(destination.x,destination.y,radius,radius*.45,0,0,Math.PI*2);ctx.stroke();
    }
    for(const dust of footDust) {
      const age=1-dust.life/.32;
      ctx.save();ctx.globalAlpha=(1-age)*.26;ctx.strokeStyle='#f3e7bd';ctx.lineWidth=1;
      ctx.beginPath();ctx.ellipse(dust.x,dust.y,5+age*12,2+age*3,0,0,Math.PI*2);ctx.stroke();ctx.restore();
    }
    // Independent PNG buildings/foliage interleave with actors by foot depth.
    const actors=[{y:hero.y,draw:()=>character(images.hero,hero.x,hero.y,true)},
      {y:npc.y,draw:()=>character(images.npc,npc.x,npc.y,false,npc)},
      {y:trainer.y,draw:()=>character(images.trainer,trainer.x,trainer.y,false,trainer)},
      {y:smith.y,draw:()=>character(images.smith,smith.x,smith.y,false,smith)}];
    for(const node of Gathering.nodes)actors.push({y:node.y,draw:()=>{
      const ready=!keepsakes.remaining(node),near=flowerNear(node),size=node.item==='lotus'?66:55;
      ctx.save();ctx.globalAlpha=ready?1:.48;ctx.drawImage(images[node.item],node.x-size/2,node.y-size,size,size);ctx.restore();
      if(ready){ctx.fillStyle='#f8dda6';ctx.beginPath();ctx.arc(node.x+17,node.y-42+Math.sin(elapsed*2+node.x)*2,2,0,Math.PI*2);ctx.fill();}
      if(near||chosenFlower===node){ctx.font='12px "Songti SC",serif';ctx.textAlign='center';ctx.lineWidth=3;ctx.strokeStyle='#334329';ctx.fillStyle='#fff1cd';const label=Gathering.items[node.item].name;ctx.strokeText(label,node.x,node.y-size-7);ctx.fillText(label,node.x,node.y-size-7);}
    }});
    for(const prop of VillageMap.props)actors.push({y:prop.depth,draw:()=>{
      ctx.save();ctx.globalAlpha=propOpacity.get(prop.id)??1;
      ctx.drawImage(images[prop.art],...prop.box);ctx.restore();
      if(prop.label){ctx.font='12px "Songti SC",serif';ctx.textAlign='center';ctx.lineWidth=3;ctx.strokeStyle='#f5eed8';ctx.fillStyle='#4d5036';ctx.strokeText(prop.label,prop.box[0]+prop.box[2]/2,prop.depth+14);ctx.fillText(prop.label,prop.box[0]+prop.box[2]/2,prop.depth+14);}
    }});
    actors.sort((a,b)=>a.y-b.y).forEach(a=>a.draw());
    // A handful of drifting leaves provide motion without external media.
    for(let i=0;i<9;i++) {
      const x=(i*213+elapsed*11)%WORLD.width,y=170+(i*103+elapsed*8)%790;
      ctx.save();ctx.translate(x,y);ctx.rotate(Math.sin(elapsed+i));ctx.fillStyle='#8fa36c80';
      ctx.beginPath();ctx.ellipse(0,0,4,1.6,0,0,Math.PI*2);ctx.fill();ctx.restore();
    }
  }
  function frame(now) {
    const dt=lastTime?Math.min((now-lastTime)/1000,.04):0;lastTime=now;elapsed+=dt;
    update(dt);draw();animationId=requestAnimationFrame(frame);
  }

  // Optional ambient sound is synthesized locally after a user gesture.
  async function toggleSound() {
    if(soundOn) {
      soundOn=false;await audioContext.suspend();
    } else {
      try {
        if(!audioContext) {
          const Audio=window.AudioContext||window.webkitAudioContext;
          if(!Audio)throw new Error('Audio unavailable');
          audioContext=new Audio();
          const buffer=audioContext.createBuffer(1,audioContext.sampleRate*3,audioContext.sampleRate);
          const data=buffer.getChannelData(0);let brown=0;
          for(let i=0;i<data.length;i++){brown=(brown+Math.random()*.04-.02)/1.02;data[i]=brown*3;}
          const source=audioContext.createBufferSource();source.buffer=buffer;source.loop=true;
          const filter=audioContext.createBiquadFilter();filter.type='lowpass';filter.frequency.value=950;
          const gain=audioContext.createGain();gain.gain.value=.23;
          source.connect(filter);filter.connect(gain);gain.connect(audioContext.destination);source.start();
          soundNodes=[source,filter,gain];
        }
        await audioContext.resume();soundOn=true;
      } catch {announce('当前浏览器暂不支持环境音，仍可正常探索。');return;}
    }
    $('#sound-toggle').setAttribute('aria-pressed',String(soundOn));
    $('#sound-toggle span').textContent=soundOn?'关闭山水声':'开启山水声';
  }
  $('#sound-toggle').addEventListener('click',toggleSound);
  function loadImage(src) {return new Promise((resolve,reject)=>{const img=new Image();img.onload=()=>resolve(img);img.onerror=()=>reject(new Error(src));img.src=src;});}
  const mapLoads=Object.entries(VillageMap.assets).map(async ([key,src])=>[key,await loadImage(src)]);
  Promise.all([Promise.all(mapLoads),loadImage('assets/q/hero-idle.png'),loadImage('assets/q/village-chief.png'),loadImage('assets/q/trainer-idle.png'),loadImage('assets/q/blacksmith.png'),Promise.all([QSprites.load(),WeaponSprites.load()])])
    .then(([mapLayers,heroImage,npcImage,trainerImage,smithImage])=>{
      Object.assign(images,Object.fromEntries(mapLayers),{hero:heroImage,npc:npcImage,trainer:trainerImage,smith:smithImage});resize();
      camera.x=Math.max(0,Math.min(WORLD.width-camera.width,hero.x-camera.width/2));
      $('#loading').hidden=true;$('#story-enter').disabled=false;animationId=requestAnimationFrame(frame);
    }).catch(error=>{console.error('地图素材加载失败',error);$('#loading').textContent='画卷加载失败，请刷新页面，或通过启动脚本打开。';});
  window.addEventListener('pagehide',()=>{cancelAnimationFrame(animationId);soundNodes.forEach(n=>n.disconnect());audioContext?.close();});
})();

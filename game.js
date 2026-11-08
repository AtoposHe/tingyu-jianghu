/* 听雨江湖 — vanilla Canvas prototype; no runtime dependencies. */
(() => {
  'use strict';
  const canvas = document.querySelector('#game');
  const ctx = canvas.getContext('2d');
  const $ = s => document.querySelector(s);
  let worldMap=VillageMap;const WORLD = {width:VillageMap.width,height:VillageMap.height};
  let pendingTravel=null,chosenResource=null,resourceClock=0;
  const hero = { ...VillageMap.spawn, facing: 1, walking: false };
  const heroRun=new HeroRun(),footDust=[];
  const npc = { id:'elder', name:'老村长', role:'听雨村 · 村长', src:'assets/q/village-chief.png', ...VillageMap.elder };
  const trainer = { id:'trainer', name:'武青山', role:'听雨村 · 武师', src:'assets/q/trainer-idle.png', ...VillageMap.trainer };
  const smith={id:'smith',name:'铁师傅',role:'溪南铁铺 · 铁匠',src:'assets/q/blacksmith.png',...VillageMap.smith};
  const doctorNpc={id:'doctor',name:'顾大夫',role:'杏竹医馆 · 医生',src:'assets/q/doctor.png',...ForestMap.doctor};
  const villagers = ()=>worldMap===VillageMap?[npc,trainer,smith]:[doctorNpc];
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
  const forestResources=new ForestGathering(economy);
  const battle = new SparringBattle((result,hadSkill) => {
    martial.recordBattle(result,hadSkill);
    if(hadSkill&&['victory','defeat'].includes(result))markStory('practice');
    syncEquipment();
    keys.clear();heroRun.reset();footDust.length=0;lastTime=0;canvas.focus({preventScroll:true});
    if(martial.needsLesson){openDialogue(trainer);showNode('trainerLesson');}
    else if(martial.practiced&&!economy.commission){openDialogue(trainer);showNode('trainerGift');}
    else announce('切磋结束，气血已回满。按 C 查看伤病，必要时可服药或找顾大夫。');
  },martial,economy);

  const walkable=(x,y)=>worldMap.walkable(x,y);
  const findPath=(a,b)=>worldMap.findPath(a,b);
  const propOpacity=new Map();
  const keepsakes=new Gathering(storage);
  let chosenFlower=null;
  function stopCollecting(){chosenFlower=null;chosenResource=null;$('#gather-prompt').hidden=true;$('#interaction').hidden=true;}
  const bag=new InventoryView(keepsakes,()=>{if(smithy.active||doctor.active||health.active)return false;stopCollecting();keys.clear();path=[];destination=null;pendingTalk=false;heroRun.reset();hero.walking=false;},martial,()=>cultivation.render(),economy,()=>syncEquipment());
  bag.render();
  const chronicle=new JianghuStory(storage);
  const storyView=new StoryView(chronicle,()=>{
    if(battle.active||dialogueOpen||bag.active||cultivation.active||smithy.active||doctor.active||health.active)return false;
    stopCollecting();keys.clear();path=[];destination=null;pendingTalk=false;heroRun.reset();hero.walking=false;
  },()=>{keys.clear();lastTime=0;canvas.focus({preventScroll:true});});
  const cultivation=new CultivationView(martial,()=>{
    if(battle.active||dialogueOpen||bag.active||storyView.active||cultivation.active||smithy.active||doctor.active||health.active)return false;
    stopCollecting();keys.clear();path=[];destination=null;pendingTalk=false;heroRun.reset();hero.walking=false;
  },()=>{syncEquipment();keys.clear();lastTime=0;canvas.focus({preventScroll:true});},()=>{
    if(martial.cultivation>=1)markStory('meditate');
  });
  function stopExploring(){pendingTravel=null;stopCollecting();keys.clear();path=[];destination=null;pendingTalk=false;heroRun.reset();hero.walking=false;}
  function returnToMap(){keys.clear();lastTime=0;canvas.focus({preventScroll:true});}
  const health=new HealthView(economy,()=>martial.hero,()=>{if(battle.active||dialogueOpen||bag.active||storyView.active||cultivation.active||smithy.active||doctor.active)return false;stopExploring();},returnToMap,()=>syncEquipment());
  const doctor=new DoctorView(economy,()=>martial.hero,returnToMap,()=>syncEquipment());
  const smithy=new SmithyView(economy,returnToMap,()=>syncEquipment(),()=>requestTravel('forest'));
  function syncEquipment(){bag.render();cultivation.render();health.render();if(doctor.active)doctor.render();$('#map-hero-name').textContent=economy.heroName;$('.character-chip img').alt=economy.heroName;const h=economy.condition(martial.hero);$('#hero-condition-short').textContent=`${h.status} · 气血 ${h.currentHp}/${h.maxHp}`;if(economy.commission)markStory('commission');if(economy.claimed)markStory('sword');if(economy.crafted)markStory('forge');}
  function switchWorld(target,at){const after=pendingTravel?.after;pendingTravel=null;stopExploring();worldMap=target;Object.assign(WORLD,{width:target.width,height:target.height});Object.assign(hero,at);hero.walking=false;propOpacity.clear();resize();camera.x=Math.max(0,Math.min(WORLD.width-camera.width,hero.x-camera.width/2));camera.y=Math.max(0,Math.min(WORLD.height-camera.height,hero.y-camera.height/2));canvas.dataset.map=target===VillageMap?'village':'forest';$('#map-name').textContent=target===VillageMap?'听雨村':'听雨林';canvas.closest?.('.game-frame')?.setAttribute('aria-label',(target===VillageMap?'听雨村':'听雨林')+'探索场景');$('#outskirts-toggle').textContent=target===VillageMap?'南行 · 听雨林':'北行 · 听雨村';$('#find-doctor').hidden=target===VillageMap;$('#find-trainer').hidden=target!==VillageMap;lastTime=0;syncFlower();canvas.focus({preventScroll:true});announce(target===VillageMap?'沿林径回到听雨村南口。':'进入听雨林：沿林径采矿、寻药，西北竹林有杏竹医馆。');if(after)after();}
  function requestTravel(target,after){if(battle.active||dialogueOpen||bag.active||storyView.active||cultivation.active||smithy.active||doctor.active||health.active)return;const dest=target==='forest'?ForestMap:VillageMap;if(worldMap===dest){if(after)after();else announce('走近矿脉或药草后按 F 采集。');return;}stopExploring();const gate=worldMap===VillageMap?{x:552,y:950}:ForestMap.portal;pendingTravel={target,after};path=findPath(hero,gate);destination=path[path.length-1]||null;if(Math.hypot(hero.x-gate.x,hero.y-gate.y)<25)switchWorld(dest,dest===ForestMap?ForestMap.spawn:{x:552,y:910});}
  $('#outskirts-toggle').onclick=()=>requestTravel(worldMap===VillageMap?'forest':'village');
  $('#find-doctor').onclick=()=>requestTalk(doctorNpc);
  function forestNodes(){return [...ForestMap.mines.map(n=>({...n,kind:'ore'})),...forestResources.nodes()];}
  function resourceNear(n){return Math.hypot(hero.x-n.x,hero.y-n.y)<90&&worldMap.canStep(hero,n.approach||n);}
  function nearestResource(){return chosenResource&&resourceNear(chosenResource)?chosenResource:forestNodes().filter(resourceNear).sort((a,b)=>Math.hypot(a.x-hero.x,a.y-hero.y)-Math.hypot(b.x-hero.x,b.y-hero.y))[0];}
  function collectForest(){if(closestNpc())return;const n=nearestResource();if(!n)return announce('沿林径走近矿脉或药草，再按 F 采集。');stopExploring();const ok=n.kind==='ore'?economy.mine(n.id):forestResources.collect(n.id);if(ok){syncEquipment();announce(`获得${n.kind==='ore'?Forge.ores[n.ore].name:Forge.herbs[n.herb].name} ×1 · 已放入行囊`);}else announce('矿脉尚未恢复，稍后再来。');syncFlower();}
  // Older story saves cannot bypass the new lesson; new cultivation progress restores its goals.
  if(!martial.learned){chronicle.flags.spar=false;chronicle.flags.meditate=false;chronicle.flags.practice=false;chronicle.save();}
  else {markStory('spar');if(martial.cultivation>=1)markStory('meditate');if(martial.practiced)markStory('practice');}
  syncEquipment();
  storyView.open();
  function markStory(flag){chronicle.mark(flag);storyView.render();}
  function flowerNear(node){return Math.hypot(hero.x-node.x,hero.y-node.y)<66&&Math.abs(worldMap.surfaceAt(hero.x,hero.y).height-worldMap.surfaceAt(node.x,node.y).height)<2&&worldMap.canStep(hero,node);}
  function nearestFlower(){return chosenFlower&&flowerNear(chosenFlower)?chosenFlower:(worldMap===VillageMap?Gathering.nodes:[]).filter(flowerNear).sort((a,b)=>Math.hypot(a.x-hero.x,a.y-hero.y)-Math.hypot(b.x-hero.x,b.y-hero.y))[0];}
  function syncFlower(){
    const blocked=dialogueOpen||battle.active||bag.active||storyView.active||cultivation.active||smithy.active||doctor.active||health.active,nearby=closestNpc(),talk=$('#interaction'),flower=$('#gather-prompt');
    const node=worldMap===VillageMap?nearestFlower():nearestResource();const gate=worldMap===VillageMap?{x:552,y:950}:ForestMap.portal;const nearGate=Math.hypot(hero.x-gate.x,hero.y-gate.y)<39;
    talk.hidden=blocked||(!nearby&&(!nearGate||!!node));flower.hidden=blocked||!!nearby||!node;
    const key=nearby?.id||(nearGate?'portal':'');if(talk.dataset.npc!==key){talk.dataset.npc=key;const kbd=document.createElement('kbd');kbd.textContent='E';talk.replaceChildren(kbd,document.createTextNode(nearby?` 与${nearby.name}交谈`:` ${worldMap===VillageMap?'南行进入听雨林':'北行返回听雨村'}`));}
    if(!node)return;const remaining=worldMap===VillageMap?keepsakes.remaining(node):node.kind==='ore'?economy.remaining(node.id):0,name=worldMap===VillageMap?Gathering.items[node.item].name:node.kind==='ore'?Forge.ores[node.ore].name:Forge.herbs[node.herb].name;
    $('#gather-label').textContent=remaining?`${name} · 再生 ${remaining} 秒`:`采集 · ${name}`;flower.disabled=remaining>0;
  }
  function confirmFlower(){
    if(worldMap===ForestMap){if(!dialogueOpen&&!battle.active&&!bag.active&&!storyView.active&&!cultivation.active&&!smithy.active&&!doctor.active&&!health.active)collectForest();return;}
    if(dialogueOpen||battle.active||bag.active||storyView.active||cultivation.active||smithy.active||doctor.active||health.active||closestNpc())return;
    const node=nearestFlower();if(!node)return announce('请先走近路边花草，再按 F 收集。');
    if(keepsakes.remaining(node))return announce('花材还在再生，稍后再来看看。');
    keys.clear();path=[];destination=null;pendingTalk=false;heroRun.reset();
    if(keepsakes.collect(node)){markStory('flowers');bag.render();announce(`收集到 ${Gathering.items[node.item].name} ×1 · 已放入行囊`);}
    syncFlower();
  }
  $('#gather-prompt').onclick=confirmFlower;
  $('#interaction').onclick=()=>{const person=closestNpc();if(person)openDialogue(person);else requestTravel(worldMap===VillageMap?'forest':'village');};
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
    trainerLearned: { text:'推山掌与吐纳法已记下，我先替你调顺气息。日后受伤可去村南竹林的杏竹医馆。按 R 查看修为并开始打坐；每回合结束，你会回灵两点。现在再试一次，用推山掌护势，应能多撑几招。仍胜不了我也无妨，日积月累才有精进。', choices:[['以推山掌再次请教！','startBattle'],['先打坐修炼。','openCultivation'],['稍后再来。','trainerBye']] },
    trainerReturn: { text:'掌势可曾记牢？你我都遵循同样的修炼之道：修为进境，气血灵力随之增长，境界提升后拳劲、防御与回灵也会增长。打坐贵在恒久，切磋贵在体会。', choices:[['请指教，切磋一场。','startBattle'],['去打坐修炼。','openCultivation'],['稍后再来。','trainerBye']] },
    trainerGift: {text:'掌势虽嫩，你已经懂得进退。你师父当年护镖用的是剑，我托溪南铁铺的铁师傅留了一把青锋，赠你作启程之礼。拿这张凭条去领取吧。记住，佩剑先问为何出鞘。',choices:[['收下取剑凭条。','acceptSword'],['容我稍后再来。','trainerBye']]},
    trainerGiftAccepted: {text:'取剑凭条收好了。铁铺在村子的右侧，门朝西，铁师傅就在门前。取到剑后，在行囊里装备它，出手便是基础劈砍。日后到听雨林采得矿石，也可请他锻造更合手的剑。',choices:[['这就去铁铺取剑。','findSmith'],['我先在村中走走。','trainerBye']]},
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
            if(martial.learn()){economy.hpMissing=0;economy.mpMissing=0;economy.ailments=economy.ailments.filter(a=>a.id!=='bruise');economy.save();markStory('spar');cultivation.render();bag.render();announce('习得推山掌与吐纳法 · 战斗按 2 施掌，地图按 R 修炼');}
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
    if(person===doctorNpc){stopExploring();doctor.open();return;}
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
  const nearNpc=(person)=>Math.hypot(hero.x-person.x,hero.y-person.y)<(person.interactionRange||78)&&Math.abs(worldMap.surfaceAt(hero.x,hero.y).height-worldMap.surfaceAt(person.x,person.y).height)<2;
  const closestNpc=()=>villagers().filter(nearNpc).sort((a,b)=>Math.hypot(hero.x-a.x,hero.y-a.y)-Math.hypot(hero.x-b.x,hero.y-b.y))[0];
  function requestTalk(person=npc) {
    const targetMap=person===doctorNpc?ForestMap:VillageMap;if(worldMap!==targetMap){requestTravel(targetMap===ForestMap?'forest':'village',()=>requestTalk(person));return;}
    if(battle.active||storyView.active||bag.active||cultivation.active||smithy.active||doctor.active||health.active)return;
    stopCollecting();
    if(nearNpc(person)) return openDialogue(person);
    const target=person.talk||{x:person.x,y:person.y+45};
    path=findPath(hero,target);
    if(!path.length) return announce('换个位置，再去拜访村长吧。');
    pendingTalk=person; destination=path[path.length-1];
  }
  $('#find-trainer').addEventListener('click',()=>requestTalk(trainer));
  $('#quest').addEventListener('click',()=>{
    if(storyView.active||bag.active||battle.active||dialogueOpen||cultivation.active||smithy.active||doctor.active||health.active)return;
    if(chronicle.next==='chief')requestTalk(npc);
    else if(['spar','practice','commission'].includes(chronicle.next))requestTalk(trainer);
    else if(chronicle.next==='sword')requestTalk(smith);
    else if(chronicle.next==='forge'){if(economy.ores.iron>=4&&economy.ores.copper>=1)requestTalk(smith);else requestTravel('forest');}
    else if(chronicle.next==='meditate')cultivation.open();
    else if(chronicle.next==='flowers'){
      if(worldMap!==VillageMap){requestTravel('village');return;}
      const node=Gathering.nodes.filter(n=>!keepsakes.remaining(n)).sort((a,b)=>Math.hypot(a.x-hero.x,a.y-hero.y)-Math.hypot(b.x-hero.x,b.y-hero.y))[0];
      if(node){chosenFlower=node;keys.clear();pendingTalk=false;path=flowerNear(node)?[]:findPath(hero,node.approach||node);destination=path[path.length-1]||null;announce('走近花草后按 F 收集，再按 B 查看行囊。');}
    }else storyView.open();
  });
  $('#dialogue-next').addEventListener('click',advance);
  $('#close-dialogue').addEventListener('click',closeDialogue);
  $('#reset').addEventListener('click',()=>{
    stopCollecting();
    if(dialogueOpen) closeDialogue();
    pendingTravel=null;switchWorld(VillageMap,spawn);hero.x=spawn.x; hero.y=spawn.y; hero.walking=false;heroRun.reset();footDust.length=0;path=[]; destination=null; keys.clear(); pendingTalk=false;
    announce('已回到南埠村口。过石桥后向东南走，可到村长家拜访老村长。');
  });
  const movementKeys=['w','a','s','d','arrowup','arrowleft','arrowdown','arrowright'];
  window.addEventListener('keydown',e=>{
    if(battle.active)return;
    if(storyView.active){storyView.handleKey(e);return;}
    if(smithy.active){smithy.handleKey(e);return;}
    if(doctor.active){doctor.handleKey(e);return;}
    if(health.active){health.handleKey(e);return;}
    if(cultivation.active){cultivation.handleKey(e);return;}
    const key=e.key.toLowerCase();
    if(bag.active){
      bag.handleKey(e);
      return;
    }
    if(!dialogueOpen&&key==='c'){e.preventDefault();if(!e.repeat)health.open();return;}
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
    if(movementKeys.includes(key)) { e.preventDefault();stopCollecting(); keys.add(key); path=[]; destination=null; pendingTalk=false;pendingTravel=null; }
    if((key==='e'||key===' ') && !e.repeat) {e.preventDefault(); const person=closestNpc();if(person) openDialogue(person);else if(Math.hypot(hero.x-552,hero.y-(worldMap===VillageMap?950:130))<40)requestTravel(worldMap===VillageMap?'forest':'village'); else announce('走近人物即可交谈，也可点击“寻访武师”切磋。');}
  });
  window.addEventListener('keyup',e=>keys.delete(e.key.toLowerCase()));
  window.addEventListener('blur',()=>keys.clear());
  document.addEventListener('visibilitychange',()=>{keys.clear();lastTime=0;if(document.hidden&&audioContext?.state==='running')audioContext.suspend();else if(!document.hidden&&soundOn)audioContext?.resume();});
  canvas.addEventListener('pointerdown',e=>{
    if(dialogueOpen||battle.active||bag.active||storyView.active||cultivation.active||smithy.active||doctor.active||health.active) return;
    stopCollecting();
    canvas.focus({preventScroll:true});
    const rect=canvas.getBoundingClientRect();
    const p={x:(e.clientX-rect.left)/camera.scale+camera.x,y:(e.clientY-rect.top)/camera.scale+camera.y};
    const clicked=villagers().find(person=>Math.hypot(p.x-person.x,p.y-(person.y-25))<47);
    if(clicked) {requestTalk(clicked);return;}
    if(worldMap===ForestMap){const node=forestNodes().find(n=>Math.abs(p.x-n.x)<(n.kind==='ore'?54:35)&&p.y>n.y-(n.kind==='ore'?85:68)&&p.y<n.y+18);if(node){chosenResource=node;pendingTalk=false;pendingTravel=null;path=resourceNear(node)?[]:findPath(hero,node.approach||node);destination=path[path.length-1]||null;return;}}
    const flower=(worldMap===VillageMap?Gathering.nodes:[]).find(n=>Math.hypot(p.x-n.x,p.y-(n.y-20))<35);
    if(flower){chosenFlower=flower;pendingTalk=false;path=flowerNear(flower)?[]:findPath(hero,flower);destination=path[path.length-1]||null;if(!path.length&&!flowerNear(flower))announce('请沿道路走近这处花草。');return;}
    pendingTalk=false;pendingTravel=null;
    if(!walkable(p.x,p.y)) {announce('那里暂时无法通行，沿着小路走走吧。');return;}
    path=findPath(hero,p);
    if(path.length) destination=path[path.length-1];
    else {destination=null;if(Math.hypot(hero.x-p.x,hero.y-p.y)>30)announce('此处无法直达，请沿石桥、台阶或西巷缓坡通行。');}
  });

  function resize() {
    const rect=canvas.getBoundingClientRect(), dpr=Math.min(window.devicePixelRatio||1,2);
    canvas.dataset.map=worldMap===VillageMap?'village':'forest';canvas.width=Math.round(rect.width*dpr); canvas.height=Math.round(rect.height*dpr);
    camera.scale=Math.max(rect.height/WORLD.height,rect.width/WORLD.width);
    camera.width=rect.width/camera.scale; camera.height=rect.height/camera.scale;
  }
  new ResizeObserver(resize).observe(canvas);
  function move(dx,dy) {
    if(worldMap.canStep(hero,{x:hero.x+dx,y:hero.y+dy})) {hero.x+=dx;hero.y+=dy;return true;}
    let moved=false;
    if(dx && worldMap.canStep(hero,{x:hero.x+dx,y:hero.y})) {hero.x+=dx;moved=true;}
    if(dy && worldMap.canStep(hero,{x:hero.x,y:hero.y+dy})) {hero.y+=dy;moved=true;}
    return moved;
  }
  function update(dt) {
    const oldX=hero.x,oldY=hero.y;resourceClock+=dt;if(worldMap===ForestMap&&resourceClock>=1){resourceClock=0;forestResources.tick();}
    hero.walking=false;
    if(battle.active){heroRun.reset();footDust.length=0;return;}
    if(storyView.active){heroRun.reset();return;}
    if(bag.active||cultivation.active||smithy.active||doctor.active||health.active){heroRun.reset();return;}
    for(let i=footDust.length-1;i>=0;i--) {
      footDust[i].life-=dt;if(footDust[i].life<=0)footDust.splice(i,1);
    }
    if(!dialogueOpen) {
      const dx=(keys.has('d')||keys.has('arrowright')?1:0)-(keys.has('a')||keys.has('arrowleft')?1:0);
      const dy=(keys.has('s')||keys.has('arrowdown')?1:0)-(keys.has('w')||keys.has('arrowup')?1:0);
      if(dx||dy) {
        const len=Math.hypot(dx,dy);
        const speed=172*worldMap.surfaceAt(hero.x,hero.y).speed;
        hero.walking=move(dx/len*speed*dt,dy/len*speed*dt);
      } else if(path.length) {
        // Consume reached waypoints without inserting a frozen frame per cell.
        while(path.length&&Math.hypot(path[0].x-hero.x,path[0].y-hero.y)<.1)path.shift();
        if(path.length) {
        const next=path[0], vx=next.x-hero.x, vy=next.y-hero.y, dist=Math.hypot(vx,vy);
        const step=Math.min(dist,172*dt*worldMap.surfaceAt(hero.x,hero.y).speed);
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
    const gateY=worldMap===VillageMap?950:130,headingForGate=!!pendingTravel||(worldMap===VillageMap?(keys.has('s')||keys.has('arrowdown')):(keys.has('w')||keys.has('arrowup')))||(destination&&Math.hypot(destination.x-552,destination.y-gateY)<32);
    if(!dialogueOpen&&hero.walking&&headingForGate&&Math.abs(hero.x-552)<45&&((worldMap===VillageMap&&hero.y>938)||(worldMap===ForestMap&&hero.y<148))){const dest=worldMap===VillageMap?ForestMap:VillageMap;switchWorld(dest,dest===ForestMap?ForestMap.spawn:{x:552,y:910});return;}
    const distance=dialogueOpen?0:Math.hypot(hero.x-oldX,hero.y-oldY);
    hero.walking=distance>.001;
    if(Math.abs(hero.x-oldX)>.001)hero.facing=hero.x>oldX?1:-1;
    heroRun.update(distance,dt);
    if(heroRun.footfalls&&hero.walking)footDust.push({x:hero.x-hero.facing*5,y:hero.y+1,life:.32});
    const targetX=Math.max(0,Math.min(WORLD.width-camera.width,hero.x-camera.width*.5));
    camera.x+=(targetX-camera.x)*Math.min(1,dt*8);
    const targetY=Math.max(0,Math.min(WORLD.height-camera.height,hero.y-camera.height*.5));camera.y+=(targetY-camera.y)*Math.min(1,dt*8);
    syncFlower();
    const area=worldMap.surfaceAt(hero.x,hero.y).name;
    if($('#area-name').textContent!==area)$('#area-name').textContent=area;
    for(const prop of worldMap.props) {
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
    const text=isHero?economy.heroName:person.name;
    ctx.font='12px "Songti SC",serif';ctx.textAlign='center';
    ctx.fillStyle='#fff8df';ctx.strokeStyle='#31432bd9';ctx.lineWidth=3.5;
    ctx.strokeText(text,x,y-82);ctx.fillText(text,x,y-82);
    if(!isHero) {
      const b=Math.sin(elapsed*3)*3;
      roundRect(x-10,y-111+b,20,22,6,person===trainer?'#ead5ab':completed?'#f1edcf':'#f5e5a9','#a8915a');
      ctx.fillStyle='#8d713c';ctx.font='bold 14px serif';ctx.fillText(person===doctorNpc?'医':person===smith?'锻':person===trainer?'武':completed?'…':'!',x,y-95+b);
    }
  }
  function draw() {
    if(battle.active)return;
    const dpr=Math.min(window.devicePixelRatio||1,2);
    ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,canvas.width/dpr,canvas.height/dpr);
    ctx.scale(camera.scale,camera.scale);ctx.translate(-camera.x,-camera.y);
    if(worldMap===VillageMap)ctx.drawImage(images.terrain,0,0,WORLD.width,WORLD.height);else ForestMap.drawGround(ctx,images);
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
    const actors=[{y:hero.y,draw:()=>character(images.hero,hero.x,hero.y,true)},...villagers().map(person=>({y:person.y,draw:()=>character(images[person.id==='elder'?'npc':person.id],person.x,person.y,false,person)}))];
    const resourceNodes=worldMap===VillageMap?Gathering.nodes:forestNodes();
    for(const node of resourceNodes)actors.push({y:node.y,draw:()=>{
      const town=worldMap===VillageMap,ready=town?!keepsakes.remaining(node):node.kind==='ore'?!economy.remaining(node.id):true,near=town?flowerNear(node):resourceNear(node),size=town?(node.item==='lotus'?66:55):node.kind==='herb'?64:100;
      if(!town){ctx.save();ctx.fillStyle=ready?'#f8e4a438':'#777a6444';ctx.strokeStyle=ready?'#ffe9a9':'#9eaa84';ctx.lineWidth=near?3:1.5;ctx.beginPath();ctx.ellipse(node.x,node.y+3,node.kind==='ore'?49:31,node.kind==='ore'?15:10,0,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.restore();}
      ctx.save();ctx.globalAlpha=ready?1:.5;
      const art=town?node.item:node.kind==='ore'?(ready?node.ore+'Ore':'boulder'):node.herb;
      ctx.drawImage(images[art],node.x-size/2,node.y-size*(node.kind==='ore'?.8:1),size,size*(node.kind==='ore'?.8:1));ctx.restore();
      if(!town){ctx.save();ctx.fillStyle=ready?'#ffe6a0':'#b6bda4';ctx.strokeStyle='#536146';ctx.lineWidth=2;const y=node.y+12;ctx.beginPath();ctx.moveTo(node.x,y-7);ctx.lineTo(node.x+6,y);ctx.lineTo(node.x,y+7);ctx.lineTo(node.x-6,y);ctx.closePath();ctx.fill();ctx.stroke();ctx.restore();}
      if(ready){ctx.fillStyle='#ffefb1';ctx.beginPath();ctx.arc(node.x+size*.28,node.y-size*.65+Math.sin(elapsed*2+node.x)*2,2.5,0,Math.PI*2);ctx.fill();}
      if(!town||near||chosenFlower?.id===node.id){ctx.font='12px "Songti SC",serif';ctx.textAlign='center';ctx.lineWidth=4;ctx.strokeStyle='#344932';ctx.fillStyle=ready?'#fff6d1':'#d0d8bc';let label=town?Gathering.items[node.item].name:node.kind==='ore'?Forge.ores[node.ore].name:Forge.herbs[node.herb].name;if(!town)label=(ready?'可采 · ':'休养 · ')+label;ctx.strokeText(label,node.x,node.y-size*(node.kind==='ore'?.8:1)-9);ctx.fillText(label,node.x,node.y-size*(node.kind==='ore'?.8:1)-9);}

    }});
    for(const prop of worldMap.props)actors.push({y:prop.depth,draw:()=>{
      ctx.save();ctx.globalAlpha=propOpacity.get(prop.id)??1;
      ctx.drawImage(images[prop.art],...prop.box);ctx.restore();
      if(prop.label){ctx.font='12px "Songti SC",serif';ctx.textAlign='center';ctx.lineWidth=3;ctx.strokeStyle='#f5eed8';ctx.fillStyle='#4d5036';ctx.strokeText(prop.label,prop.box[0]+prop.box[2]/2,prop.depth+14);ctx.fillText(prop.label,prop.box[0]+prop.box[2]/2,prop.depth+14);}
    }});
    const gate=worldMap===VillageMap?{x:552,y:950}:ForestMap.portal;ctx.font='13px \"Songti SC\",serif';ctx.textAlign='center';ctx.strokeStyle='#f5edd1';ctx.lineWidth=3;ctx.fillStyle='#5f7054';const gateLabel=worldMap===VillageMap?'↓ 南行 · 听雨林':'↑ 北行 · 听雨村';ctx.strokeText(gateLabel,gate.x,gate.y+10);ctx.fillText(gateLabel,gate.x,gate.y+10);
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
  const mapLoads=Object.entries({...VillageMap.assets,...ForestMap.assets}).map(async ([key,src])=>[key,await loadImage(src)]);
  Promise.all([Promise.all(mapLoads),loadImage('assets/q/hero-idle.png'),loadImage('assets/q/village-chief.png'),loadImage('assets/q/trainer-idle.png'),loadImage('assets/q/blacksmith.png'),Promise.all([QSprites.load(),WeaponSprites.load()])])
    .then(([mapLayers,heroImage,npcImage,trainerImage,smithImage])=>{
      Object.assign(images,Object.fromEntries(mapLayers),{hero:heroImage,npc:npcImage,trainer:trainerImage,smith:smithImage});resize();
      camera.x=Math.max(0,Math.min(WORLD.width-camera.width,hero.x-camera.width/2));
      $('#loading').hidden=true;$('#story-enter').disabled=false;animationId=requestAnimationFrame(frame);
    }).catch(error=>{console.error('地图素材加载失败',error);$('#loading').textContent='画卷加载失败，请刷新页面，或通过启动脚本打开。';});
  window.addEventListener('pagehide',()=>{cancelAnimationFrame(animationId);soundNodes.forEach(n=>n.disconnect());audioContext?.close();});
})();

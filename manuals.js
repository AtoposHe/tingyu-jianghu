/* Original in-world manuscripts. This catalogue also drives costs, practice and book reading. */
(() => {
  'use strict';
  const catalogue={
    breathing:{id:'breathing',name:'基础吐纳法',kind:'内功',type:'cultivation',color:'sage',secondsPerPoint:120,animation:'breath',
      source:'武青山口授 · 听雨武馆手抄本',summary:'以静养气，循序筑基。每静修两分钟，灵力上限增长一点。',
      explanation:'入门内功。每累计静修 120 秒，灵力上限 +1，气血上限随之 +2。仅在主动打坐且页面可见时积累时间；抵达大境界上限后须完成突破任务。',
      chapters:[
        ['总诀','夫练武之始，不在争强，在于知身。身如舟，气如水；舟不固，水盛则覆。初学者先收纷念，后养一息，日日不辍，不以一时快慢论功。'],
        ['坐忘篇','寻平稳处，盘膝而坐，衣带舒展，两手安放膝上。脊如松立，肩若云垂，眼帘微合。听檐雨，听溪声，杂念来时，任它自去。'],
        ['调息篇','一呼一吸，缓缓相续。吸时想清风入怀，呼时想浊尘离袖；不强求深长，不追逐奇异。息匀则意宁，意宁则微气可聚。'],
        ['养气篇','气聚如露，不可催骤。得一分，藏一分；得一息，养一息。拳脚虽能试出长短，根基终须平日积累。切莫以胜负扰乱心息。'],
        ['止境篇','小成可循气渐进，大境须过关问心。气满则收功，莫再强灌经络；待机缘、历练与心境俱足，再叩下一重门。收功之际，静候余息，徐徐起身。']
      ]},
    mountain:{id:'mountain',name:'推山掌',kind:'掌法',type:'skill',color:'ochre',cost:8,power:1.4,pierce:.7,bonus:4,guard:.6,
      source:'武青山亲传 · 听雨武馆掌谱',summary:'沉肩护中，蓄劲推出。消耗八点灵力，掌势兼顾攻守。',
      explanation:'战斗按 2 施展，消耗 8 灵力。掌伤随自身武力与对方防御结算，并获得一次护势，抵去下一次受击的 60% 伤害；护势不叠加。双方共用此规则。',
      chapters:[
        ['掌意','推山者，非妄言一掌移山，乃取其不急不躁、步步有根之意。山在前，先立己；敌在侧，先守中。掌未出而身已乱，纵有千钧之力亦散。'],
        ['起势','两足承身，虚实分明。沉肩垂肘，收掌于身前，劲意由足而起。先护中门，使敌来之势有所承，不可只顾向前，失却退路。'],
        ['发掌','心与步合，步与掌合。以一息引八分灵力，沿臂贯掌，向前徐推而骤发。出掌不求身远，贵在劲整；力发即回，不与敌角蛮劲。'],
        ['护势','掌出之际，余劲回环如屏。敌劲来时，顺势承接，卸其六成；一受击，此势便散。莫将护势当作铁甲，不可凭它忘了彼此根基的差距。'],
        ['收势','掌归中门，呼吸归常。能进能退，方见掌法之用。切磋止于点到，学武止于自满；胜时莫骄，败时莫弃，明日仍须静坐养气。']
      ]},
    creek:{id:'creek',name:'清溪养气诀',kind:'内功',type:'cultivation',color:'blue',secondsPerPoint:150,animation:'creek',
      source:'江南散修抄本 · 后续机缘可得',summary:'意随水转，气走周天。以清溪环流之象养气。',
      explanation:'习得后可在修炼页面选用。每静修 150 秒增长 1 点灵力上限与 2 点气血上限，运气呈清蓝环流与水纹。当前剧情尚未开放其获取途径。',
      chapters:[
        ['溪源','天下流水，各有其源。养气者亦须知来处，不因旁人疾行便改己道。溪之功，在于长流；水之德，在于有止。'],
        ['临水','盘膝端坐，两手安膝，心中存一湾清溪。山色不动，溪声自来。先听一息，再听一息，待心中波纹渐平。'],
        ['回澜','气意如水绕身而行，来去有序，不相争夺。逢曲则缓，逢石则让，回转之间，散乱之息渐归一处。'],
        ['满岸','溪水满岸，当候水闸。境界未破，灵力不应漫溢；且收余念，行人间路，待过关之日再引新流。'],
        ['归流','收功时，万流归源，清静如初。今日所得不必炫耀，明日所学不必预忧。留一分从容，便多一分长久。']
      ]}
  };
  for(const book of Object.values(catalogue)){book.chapters=Object.freeze(book.chapters.map(chapter=>Object.freeze(chapter)));Object.freeze(book);}
  const api=Object.freeze({catalogue:Object.freeze(catalogue),get:id=>typeof id==='string'&&Object.hasOwn(catalogue,id)?catalogue[id]:null});
  if(typeof module!=='undefined'&&module.exports)module.exports=api;else globalThis.Manuals=api;
})();

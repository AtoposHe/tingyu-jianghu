/* Shared stats, skill costs and round recovery; no scripted damage or forced defeats. */
(() => {
  'use strict';
  const martial=typeof module!=='undefined'&&module.exports?require('./martial.js'):globalThis.Martial;
  const fighter=profile=>({...profile,skills:[...profile.skills],hp:profile.maxHp,mp:profile.maxMp,guard:0});
  const create=(hero=martial.person('hero'),opponent='trainer')=>({
    round:1,phase:'player',hero:fighter(hero),enemy:fighter(martial.person(opponent))
  });
  const canSkill=actor=>actor.skills.includes('mountain')&&actor.mp>=martial.skills.mountain.cost;
  function enemyAction(state){return state.round%2===0&&canSkill(state.enemy)?'skill':'normal';}
  function resolve(state,side,action){
    if(!['hero','enemy'].includes(side))throw Error('Unknown actor');
    if(state.phase!==(side==='hero'?'player':'enemy'))throw Error('Not this actor’s turn');
    if(!['normal','skill'].includes(action))throw Error('Unknown action');
    const actor=state[side],target=state[side==='hero'?'enemy':'hero'];
    const skill=action==='skill'?martial.skills.mountain:null;
    if(skill&&!actor.skills.includes(skill.id))throw Error('尚未习得技能');
    if(skill&&actor.mp<skill.cost)throw Error('灵力不足');
    const raw=skill?actor.attack*skill.power-target.defense*skill.pierce+skill.bonus:actor.attack-target.defense;
    const guarded=target.guard>0,damage=Math.min(target.hp,Math.max(1,Math.round(Math.max(1,raw)*(1-target.guard))));
    const mpChange=skill?-skill.cost:0;actor.mp+=mpChange;
    target.hp-=damage;target.guard=0;if(skill)actor.guard=skill.guard;
    const recovery=[];
    if(target.hp===0)state.phase=side==='hero'?'victory':'defeat';
    else if(side==='hero')state.phase='enemy';
    else {
      state.phase='player';state.round++;
      // One full round, one recovery for each living participant, regardless of action.
      for(const who of ['hero','enemy']){const unit=state[who],amount=Math.min(unit.regen,unit.maxMp-unit.mp);unit.mp+=amount;recovery.push({side:who,amount});}
    }
    return {side,action,damage,mpChange,recovery,guarded,guard:skill?.guard||0,move:skill?skill.name:side==='hero'?'直拳':'试探拳'};
  }
  const api=Object.freeze({create,resolve,enemyAction,canSkill});
  if(typeof module!=='undefined'&&module.exports)module.exports=api;else globalThis.CombatRules=api;
})();

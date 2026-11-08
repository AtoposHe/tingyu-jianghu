/* Pure turn rules, shared by the battle scene and deterministic checks. */
(() => {
  'use strict';
  const create = () => ({
    round: 1, phase: 'player',
    hero: { hp: 100, maxHp: 100, mp: 10, maxMp: 60 },
    enemy: { hp: 120, maxHp: 120, mp: 30, maxMp: 60 },
  });
  function enemyAction(state) {
    return state.round % 2 === 0 && state.enemy.mp >= 20 ? 'skill' : 'normal';
  }
  function resolve(state, side, action) {
    if (!['hero','enemy'].includes(side)) throw new Error('Unknown actor');
    if (state.phase !== (side === 'hero' ? 'player' : 'enemy')) throw new Error('Not this actor’s turn');
    if (!['normal','skill'].includes(action)) throw new Error('Unknown action');
    if (side === 'hero' && action === 'skill') throw new Error('尚未习得技能');
    const actor = state[side], target = state[side === 'hero' ? 'enemy' : 'hero'];
    if (action === 'skill' && actor.mp < 20) throw new Error('灵力不足');
    const beforeMp = actor.mp;
    const damage = action === 'skill' ? 20 : side === 'hero' ? 20 + state.round % 3 * 2 : 12 + state.round % 2 * 2;
    actor.mp = action === 'skill' ? actor.mp - 20 : Math.min(actor.maxMp, actor.mp + (side === 'hero' ? 10 : 8));
    const actualDamage = Math.min(target.hp, damage);
    target.hp = Math.max(0, target.hp - damage);
    if (target.hp === 0) state.phase = side === 'hero' ? 'victory' : 'defeat';
    else if (side === 'hero') state.phase = 'enemy';
    else { state.phase = 'player'; state.round++; }
    return { side, action, damage: actualDamage, mpChange: actor.mp - beforeMp, move: action === 'skill' ? '推山掌' : side === 'hero' ? '直拳' : '试探拳' };
  }
  const api = Object.freeze({ create, resolve, enemyAction });
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else globalThis.CombatRules = api;
})();

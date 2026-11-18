/* Character training: persistent progress, one active route per run. */
const TRAINING_CHARACTERS = ['balance', 'power', 'speed', 'tank'];
const TRAINING_GATES = [
    {wave:3, uses:2, cost:100}, {wave:6, uses:5, cost:300},
    {wave:10, uses:10, cost:700}, {wave:15, uses:20, cost:1500}, {wave:20, uses:35, cost:3000}
];
const TRAINING_ROUTES = {
    balance: [
        {id:'a',name:'連撃型',effect:l=>`通常弾の連続命中1回につき火力＋${2*l}％（最大10回・${20*l}％）。2秒間命中しないか被弾するとリセット。`},
        {id:'b',name:'適応型',effect:l=>`各WAVEで「通常弾＋${8*l}％」か「被ダメージ−${4*l}％」を選択。`},
        {id:'c',name:'探索型',effect:l=>`敵からの獲得コイン＋${5*l}％。端数は今回の挑戦中に繰り越します。`}
    ],
    power: [
        {id:'a',name:'大魔法型',effect:l=>`全スキルのダメージ＋${15*l}％。インボリュートの当たり判定範囲＋${6*l}％。`},
        {id:'b',name:'速詠型',effect:l=>`全スキルの待ち時間−${8*l}％（${displayInteger(30*(1-.08*l))}秒）。`},
        {id:'c',name:'魔力解放型',effect:l=>`スキル発動後6秒間、通常弾のダメージ＋${12*l}％。`}
    ],
    speed: [
        {id:'a',name:'狙撃型',effect:l=>`敵との距離に応じ通常弾が強化。400px以上で最大＋${12*l}％。`},
        {id:'b',name:'遊撃型',effect:l=>`1500ミリ秒間動き続けると連射速度＋${8*l}％。停止すると解除。`},
        {id:'c',name:'竜狩り型',effect:l=>`ボスに対する通常弾のダメージ＋${15*l}％。`}
    ],
    tank: [
        {id:'a',name:'鉄壁型',effect:l=>`WAVE開始時と12秒ごとに${2*l}ダメージ分のシールド獲得（重ね掛けなし）。`},
        {id:'b',name:'反撃型',effect:l=>`被弾後、半径${100+20*l}pxに通常攻撃力の${100*l}％の衝撃波。2秒に1回、致死ダメージ時は発動しません。`},
        {id:'c',name:'不屈型',effect:l=>`最大HP＋${3*l}。WAVE開始時にHPを${l}回復。`}
    ]
};
function createDefaultTraining() {
    return Object.fromEntries(TRAINING_CHARACTERS.map(id=>[id,{uses:0,bestWave:0,route:'a',levels:{a:0,b:0,c:0}}]));
}
function repairTraining(value) {
    const result=createDefaultTraining();
    for (const id of TRAINING_CHARACTERS) {
        const src=value?.[id]; if (!src || typeof src!=='object') continue;
        const dst=result[id];
        for (const key of ['uses','bestWave']) if (Number.isFinite(src[key])) dst[key]=Math.max(0,Math.min(1000000000,Math.floor(src[key])));
        if (['a','b','c'].includes(src.route)) dst.route=src.route;
        for (const route of ['a','b','c']) if (Number.isFinite(src.levels?.[route])) dst.levels[route]=Math.max(0,Math.min(5,Math.floor(src.levels[route])));
    }
    return result;
}
function getTrainingProgress(id=gameData.character) {
    gameData.training ||= createDefaultTraining();
    return gameData.training[id];
}
let activeTraining = null;
let trainingState = {};
let trainingViewedCharacter = 'balance';
function resetTrainingState() {
    trainingState={combo:0,lastHit:-Infinity,movingSince:null,lastMove:0,surgeUntil:0,shield:0,nextShield:0,lastCounter:-Infinity,coinRemainder:0,adaptation:'attack',hud:''};
}
resetTrainingState();
function trainingStartRun(countUse=true) {
    const p=getTrainingProgress();
    activeTraining={character:gameData.character,route:p.route,level:p.levels[p.route]};
    resetTrainingState();
    if (countUse && gameMode!=='test') { p.uses=Math.min(1000000000,p.uses+1); saveData(); }
}
function trainingLevel(character,route) {
    return activeTraining?.character===character && activeTraining.route===route ? activeTraining.level : 0;
}
function trainingHpBonus() { return trainingLevel('tank','c')*3; }
function getSkillCooldown() { return bombCooldown*(1-.08*trainingLevel('power','b'))*equipmentStats().cooldown; }
function trainingSkillMultiplier() { return (1+.15*trainingLevel('power','a'))*equipmentSkillMultiplier(); }
function trainingSkillRadius() { return 1+.06*trainingLevel('power','a'); }
function trainingOnSkill() { if (trainingLevel('power','c')) trainingState.surgeUntil=gameNow()+6000; }
function trainingFireRateMultiplier() {
    return trainingState.movingSince!==null && gameNow()-trainingState.movingSince>=1500
        ? 1+.08*trainingLevel('speed','b') : 1;
}
function trainingBulletDamage(enemy,damage) {
    const now=gameNow(); let bonus=0;
    if (enemy.type==='boss' && now<enemy.transformingUntil) return damage;
    if (trainingLevel('balance','a')) {
        if (now-trainingState.lastHit>2000) trainingState.combo=0;
        trainingState.combo=Math.min(10,trainingState.combo+1); trainingState.lastHit=now;
        bonus+=.02*trainingLevel('balance','a')*trainingState.combo;
    }
    if (trainingState.adaptation==='attack') bonus+=.08*trainingLevel('balance','b');
    if (now<trainingState.surgeUntil) bonus+=.12*trainingLevel('power','c');
    bonus+=Math.min(1,Math.hypot(enemy.x-playerX,enemy.y-playerY)/400)*.12*trainingLevel('speed','a');
    if (enemy.type==='boss') bonus+=.15*trainingLevel('speed','c');
    return damage*(1+bonus);
}
function trainingCoinReward(base) {
    trainingState.coinRemainder+=base*.05*trainingLevel('balance','c');
    const extra=Math.floor(trainingState.coinRemainder+1e-9);
    trainingState.coinRemainder=Math.max(0,trainingState.coinRemainder-extra);
    return base+extra;
}
function trainingOnWaveStart() {
    trainingState.combo=0; trainingState.lastHit=-Infinity;
    trainingState.movingSince=null; trainingState.surgeUntil=0;
    trainingState.lastCounter=-Infinity;
    trainingState.shield=2*trainingLevel('tank','a'); trainingState.nextShield=gameNow()+12000;
    playerCurrentHp=Math.min(playerMaxHp,playerCurrentHp+trainingLevel('tank','c')); updateHpDisplay();
    if (gameMode!=='test') {
        const p=getTrainingProgress(activeTraining?.character || gameData.character);
        if (currentWave>p.bestWave) { p.bestWave=Math.min(1000000000,currentWave); saveData(); }
    }
}
function updateTrainingCombat(oldX,oldY) {
    const now=gameNow();
    if (Math.hypot(playerX-oldX,playerY-oldY)>.2) {
        if (trainingState.movingSince===null) trainingState.movingSince=now;
        trainingState.lastMove=now;
    } else if (now-trainingState.lastMove>120) trainingState.movingSince=null;
    if (now-trainingState.lastHit>2000) trainingState.combo=0;
    if (trainingLevel('tank','a') && now>=trainingState.nextShield) {
        trainingState.shield=2*trainingLevel('tank','a'); trainingState.nextShield=now+12000;
    }
    let status=activeTraining?.level ? `${TRAINING_ROUTES[activeTraining.character].find(r=>r.id===activeTraining.route).name} Lv.${activeTraining.level}` : '専用育成：未解放';
    if (trainingLevel('balance','a')) status+=` ｜連撃 ${trainingState.combo}/10`;
    if (trainingLevel('balance','b')) status+=trainingState.adaptation==='attack'?' ｜攻撃':' ｜防御';
    if (trainingLevel('power','c') && now<trainingState.surgeUntil) status+=' ｜魔力解放中';
    if (trainingLevel('speed','b')) status+=trainingFireRateMultiplier()>1?' ｜遊撃発動中':' ｜移動で強化';
    if (trainingLevel('tank','a')) status+=` ｜盾 ${Math.ceil(trainingState.shield)}`;
    if (status!==trainingState.hud) { document.getElementById('training-hud').textContent=status; trainingState.hud=status; }
}
function trainingIncomingDamage(damage) {
    trainingState.combo=0;
    if (trainingState.adaptation==='defense') damage*=1-.04*trainingLevel('balance','b');
    const absorbed=Math.min(damage,trainingState.shield); trainingState.shield-=absorbed;
    return Math.max(0,damage-absorbed);
}
function trainingCounterAttack() {
    const level=trainingLevel('tank','b'), now=gameNow();
    if (!level || now-trainingState.lastCounter<2000) return;
    trainingState.lastCounter=now;
    const state=trainingState, x=playerX,y=playerY, radius=100+20*level;
    const damage=getPlayerStats().damage*level;
    gameSetTimeout(()=>{
        if (trainingState!==state || isGameOver || !waveEventActive) return;
        if (!liteMode) {
            const ring=document.createElement('div');ring.className='training-counter';
            Object.assign(ring.style,{left:x+'px',top:y+'px',width:radius*2+'px',height:radius*2+'px'});
            worldLayer.appendChild(ring); gameSetTimeout(()=>ring.remove(),350);
        }
        for (const e of [...enemies]) if (Math.hypot(e.x-x,e.y-y)<=radius) damageEnemy(e,damage);
    },0);
}
function chooseTrainingAdaptation(launch) {
    if (!trainingLevel('balance','b')) { launch(); return; }
    const dialog=document.getElementById('adaptation-dialog');
    const level=trainingLevel('balance','b');
    document.getElementById('adaptation-wave').textContent=`WAVE ${currentWave}の補助を選択`;
    const attack=document.getElementById('adaptation-attack'),defense=document.getElementById('adaptation-defense');
    attack.textContent=`攻撃：通常弾＋${8*level}％`;defense.textContent=`防御：被ダメージ−${4*level}％`;
    let chosen=false;
    const choose=value=>{if(chosen)return;chosen=true;trainingState.adaptation=value;dialog.close();launch();};
    attack.onclick=()=>choose('attack');defense.onclick=()=>choose('defense');
    dialog.oncancel=e=>e.preventDefault();
    document.body.style.cursor='default';dialog.showModal();
}
function canEditTraining() {
    return !homeScreen.classList.contains('hidden') && !startingRun && !preflightPending && !btnBattle.disabled && !cloudConflict;
}
function trainingUpgrade(id,route) {
    if (!canEditTraining() || !TRAINING_CHARACTERS.includes(id) || !['a','b','c'].includes(route)) return false;
    const p=getTrainingProgress(id),level=p.levels[route],gate=TRAINING_GATES[level];
    if (!gate || (p.bestWave<gate.wave && p.uses<gate.uses) || gameData.coins<gate.cost) return false;
    gameData.coins-=gate.cost;p.levels[route]++;saveData();renderTraining();return true;
}
const TRAINING_VISUALS = {
 balance:[['⚔️','当て続けて火力アップ'],['⚖️','WAVEごとに攻守を選ぶ'],['💰','コイン集めが得意']],
 power:[['🔮','大きな魔法で一掃'],['⌛','スキルを早く使える'],['🔥','スキルの後も攻める']],
 speed:[['🎯','遠くから大ダメージ'],['💨','動きながら連射'],['🐉','ボスへの切り札']],
 tank:[['🛡️','シールドで身を守る'],['💥','受けた攻撃に反撃'],['💚','HPと回復で粘る']]
};
function renderTraining() {
 const id=trainingViewedCharacter,p=getTrainingProgress(id),character=CHARACTERS[id];
 const hero=document.getElementById('training-summary');hero.replaceChildren();hero.className='training-hero';
 const portrait=document.createElement('img');portrait.src=character.image;portrait.alt=character.name;hero.appendChild(portrait);
 const info=document.createElement('div');hero.appendChild(info);
 appendEqText(info,character.name,'training-hero-name');appendEqText(info,character.role,'training-tagline');
 appendEqText(info,'🏁 WAVE '+p.bestWave+'　🎮 '+p.uses+'回','training-record');appendEqText(info,'🪙 '+gameData.coins+' G','training-wallet');
 const cards=document.getElementById('training-cards');cards.replaceChildren();
 for(const [index,route] of TRAINING_ROUTES[id].entries()){
  const level=p.levels[route.id],gate=TRAINING_GATES[level],selected=p.route===route.id;
  const card=document.createElement('article');card.className='training-card training-route-'+route.id+(selected?' route-selected':'');
  const art=document.createElement('div');art.className='training-route-art';
  const image=document.createElement('img');image.src=character.image;image.alt='';art.appendChild(image);
  const icon=document.createElement('span');icon.className='training-route-icon';icon.textContent=TRAINING_VISUALS[id][index][0];icon.setAttribute('aria-hidden','true');art.appendChild(icon);
  const badge=document.createElement('span');badge.className='training-route-badge';badge.textContent=selected?(level?'✓ 選択中':'選択中・未解放'):level?'解放済み':'未解放';art.appendChild(badge);card.appendChild(art);
  const title=document.createElement('h3');title.textContent=route.name;card.appendChild(title);
  appendEqText(card,TRAINING_VISUALS[id][index][1],'training-tagline');
  const stars=document.createElement('div');stars.className='training-stars';stars.textContent='★'.repeat(level)+'☆'.repeat(5-level);stars.setAttribute('aria-label','レベル'+level+'、最大5');card.appendChild(stars);
  const detail=document.createElement('details');const summary=document.createElement('summary');summary.textContent='✨ 効果を見る';detail.appendChild(summary);
  appendEqText(detail,level?'現在：'+route.effect(level):'まだ効果はありません。');if(gate)appendEqText(detail,'次のLv.'+(level+1)+'：'+route.effect(level+1));card.appendChild(detail);
  if(gate){
   const satisfied=p.bestWave>=gate.wave||p.uses>=gate.uses;
   const progress=document.createElement('div');progress.className='training-progress';
   appendEqText(progress,satisfied?'✅ プレイ条件クリア':'🏁 WAVE '+gate.wave+' または '+gate.uses+'回使用');
   const bar=document.createElement('progress');bar.max=1;bar.value=Math.min(1,Math.max(p.bestWave/gate.wave,p.uses/gate.uses));bar.setAttribute('aria-label','WAVEまたは使用回数の達成度');progress.appendChild(bar);
   if(!satisfied)appendEqText(progress,'あとWAVE '+Math.max(0,gate.wave-p.bestWave)+' または '+Math.max(0,gate.uses-p.uses)+'回','training-hint');
   appendEqText(progress,gameData.coins>=gate.cost?'🪙 '+gate.cost+' G · 準備OK':'🪙 '+gate.cost+' G · あと'+(gate.cost-gameData.coins)+' G');card.appendChild(progress);
   const buy=document.createElement('button');buy.type='button';buy.className='training-buy';buy.textContent='✦ Lv.'+(level+1)+'に育成 · '+gate.cost+' G';buy.disabled=!canEditTraining()||!satisfied||gameData.coins<gate.cost;buy.addEventListener('click',()=>trainingUpgrade(id,route.id));card.appendChild(buy);
  } else appendEqText(card,'🏆 育成コンプリート！','training-max');
  const equip=document.createElement('button');equip.type='button';equip.className='training-equip';equip.textContent=selected?'✓ このルートを選択中':'このルートにする';equip.disabled=!canEditTraining()||selected||!level;
  equip.addEventListener('click',()=>{if(!canEditTraining())return;p.route=route.id;saveData();renderTraining();});card.appendChild(equip);cards.appendChild(card);
 }
}
function initTrainingUI() {
    const select=document.getElementById('training-character');
    for(const id of TRAINING_CHARACTERS){const option=document.createElement('option');option.value=id;option.textContent=CHARACTERS[id].name;select.appendChild(option);}
    select.addEventListener('change',()=>{trainingViewedCharacter=select.value;renderTraining();});
    document.getElementById('btn-training').addEventListener('click',()=>{
        if (!canEditTraining()) { alert('同期中や戦闘開始中は育成を変更できません。');return; }
        trainingViewedCharacter=gameData.character;select.value=trainingViewedCharacter;renderTraining();document.getElementById('training-dialog').showModal();
    });
}
function trainingCheckpoint() {
    return {active:activeTraining, coinRemainder:trainingState.coinRemainder};
}
function restoreTrainingCheckpoint(c) {
    trainingStartRun(false);
    if (c?.active && c.active.character===gameData.character && ['a','b','c'].includes(c.active.route) && Number.isInteger(c.active.level) && c.active.level>=0 && c.active.level<=5) activeTraining={...c.active};
    if(Number.isFinite(c?.coinRemainder)) trainingState.coinRemainder=Math.max(0,Math.min(.999999,c.coinRemainder));
}

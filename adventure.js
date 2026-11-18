/* v1.6: player convenience and persistent progress. No credentials or role grants. */
const ACHIEVEMENTS=[
 {id:'boss',name:'はじめてのボス撃破',reward:20,goal:1,progress:()=>Object.entries(gameData.codex).filter(([k])=>k.startsWith('boss_')).reduce((n,[,v])=>n+v,0)},
 ...['balance','power','speed','tank'].map(id=>({id:'wave_'+id,name:({balance:'冒険者',power:'魔導士',speed:'レンジャー',tank:'重装騎士'})[id]+'でWAVE10到達',reward:30,goal:10,progress:()=>gameData.training[id].bestWave})),
 {id:'codex10',name:'10種類の敵を発見',reward:30,goal:10,progress:()=>Object.keys(gameData.codex).length},
 {id:'codex25',name:'25種類の敵を発見',reward:50,goal:25,progress:()=>Object.keys(gameData.codex).length}
];
function defaultJourney(){return {locks:[],claimed:[],tutorial:0};}
function repairJourney(v){
 return {locks:[...new Set((Array.isArray(v?.locks)?v.locks:[]).filter(n=>Number.isInteger(n)&&n>0&&n<1000000000))].slice(0,500),
 claimed:[...new Set((Array.isArray(v?.claimed)?v.claimed:[]).filter(id=>ACHIEVEMENTS.some(a=>a.id===id)))],tutorial:[0,1,2].includes(v?.tutorial)?v.tutorial:0};
}
function validJourney(v){return !!v&&Object.keys(v).sort().join()==='claimed,locks,tutorial'&&JSON.stringify(v.locks)===JSON.stringify(repairJourney(v).locks)&&JSON.stringify(v.claimed)===JSON.stringify(repairJourney(v).claimed)&&v.tutorial===repairJourney(v).tutorial;}
function equipmentLocked(uid){return gameData.journey.locks.includes(uid);}
function toggleEquipmentLock(uid){
 if(!canEditTraining()||!equipmentFind(uid))return false;
 const locks=gameData.journey.locks;gameData.journey.locks=locks.includes(uid)?locks.filter(n=>n!==uid):[...locks,uid];
 saveData();renderEquipment();if(document.getElementById('item-detail-dialog').open)openItemDetails(uid);return true;
}
let saleSelection=new Set(),itemDetailUid=null,saleSelectionMode=false;
function toggleSaleItem(uid){
 if(!canEditTraining()||!equipmentFind(uid)||equipmentProtected(uid))return;
 if(saleSelection.has(uid))saleSelection.delete(uid);else saleSelection.add(uid);
 renderEquipment();
}
function equipmentDurabilityGauge(parent,item){
 const gauge=document.createElement('meter');gauge.className='durability-meter';gauge.min=0;gauge.max=EQ_MAX_DURABILITY[item.grade];gauge.low=gauge.max*.2;gauge.high=gauge.max*.5;gauge.optimum=gauge.max;gauge.value=item.durability;
 gauge.setAttribute('aria-label','耐久 '+item.durability+' / '+gauge.max);parent.appendChild(gauge);
}
function repairGoldCost(item){return (EQ_MAX_DURABILITY[item.grade]-item.durability)*[0,1,2,4,8,16][item.grade];}
function repairEquipmentGold(uid){
 if(!canEditTraining())return false;const item=equipmentFind(uid);if(!item)return false;
 const cost=repairGoldCost(item);if(!cost||gameData.coins<cost)return false;
 if(!confirm(equipmentName(item)+'\n'+cost+'Gで耐久を全回復しますか？'))return false;
 gameData.coins-=cost;equipmentReplace({...item,durability:EQ_MAX_DURABILITY[item.grade]});saveData();renderEquipment();
 if(document.getElementById('item-detail-dialog').open)openItemDetails(uid);return true;
}
function selectedSaleItems(){return equipmentItems().filter(i=>saleSelection.has(i.uid)&&!equipmentProtected(i.uid));}
function updateSaleSummary(){
 const toggle=document.getElementById('toggle-sale-mode');
 toggle.textContent=saleSelectionMode?'選択を終了する':'アイコンから選んで売却';
 toggle.setAttribute('aria-pressed',String(saleSelectionMode));
 document.getElementById('sale-mode-help').textContent=saleSelectionMode?'売りたいアイコンをタップ。もう一度タップすると選択解除できます。':'通常はアイコンをタップすると詳細を表示します。';
 const items=selectedSaleItems();document.getElementById('sale-summary').textContent=items.length+'個 / 合計 '+items.reduce((n,i)=>n+equipmentSaleValue(i),0)+'G';
 document.getElementById('sell-selected').disabled=!canEditTraining()||!items.length;
}
function sellSelectedEquipment(){
 if(!canEditTraining())return false;const items=selectedSaleItems();if(!items.length)return false;
 const sum=items.reduce((n,i)=>n+equipmentSaleValue(i),0);
 if(!Number.isSafeInteger(gameData.coins+sum)){equipmentMessage('所持金が上限に達します。');return false;}
 if(!confirm(items.length+'個を合計'+sum+'Gで売却しますか？\nロック・装備中・中断データで使用中の品は除外されます。売却は取り消せません。'))return false;
 const ids=new Set(items.map(i=>i.uid));gameData.equipment.items=gameData.equipment.items.filter(w=>!ids.has(decodeEquipment(w)?.uid));gameData.coins+=sum;saleSelection.clear();saveData();renderEquipment();return true;
}
const COMPARE_FIELDS=[['damage','通常攻撃',100,'ポイント'],['hp','最大HP',1,''],['speed','移動補正',100,'ポイント'],['fireRate','連射補正',100,'ポイント'],['skill','スキル威力',100,'ポイント'],['cooldown','スキル待ち時間',100,'ポイント'],['reduction','ダメージ軽減',100,'ポイント'],['evade','回避率',100,'ポイント'],['crit','会心率',100,'ポイント'],['boss','対ボス補正',100,'ポイント'],['heal','WAVE開始時回復',1,''],['shield','WAVE開始時シールド',1,''],['drop','結晶ドロップ率',100,'ポイント']];
function itemComparison(item){
 const start=Math.floor(item.slot/4)*4;
 const before=gameData.equipment.equipped.slice(start,start+4).map(decodeEquipment).map(i=>i?.durability>0?i:null),after=before.slice();after[item.slot%4]=item.durability>0?item:null;
 const a=equipmentStats(before),b=equipmentStats(after);
 return COMPARE_FIELDS.map(([key,label,scale,unit])=>({key,label,unit,value:displayInteger((b[key]-a[key])*scale)}));
}
function itemDetailPanel(parent,title,fold=false){
 const panel=document.createElement(fold?'details':'section');panel.className='item-pop-panel';
 const heading=document.createElement(fold?'summary':'h3');heading.textContent=title;panel.appendChild(heading);parent.appendChild(panel);return panel;
}
function itemDetailChip(parent,text,className='') {const chip=document.createElement('span');chip.className='item-chip '+className;chip.textContent=text;parent.appendChild(chip);return chip;}
function openItemDetails(uid){
 const item=equipmentFind(uid);if(!item)return;markEquipmentSeen(uid);renderEquipment();itemDetailUid=uid;
 const area=document.getElementById('item-detail-content');area.replaceChildren();
 const hero=document.createElement('div');hero.className='item-pop-hero grade-'+item.grade;
 hero.style.setProperty('--item-accent',['#aab9cc','#51bfff','#b784ff','#ffca57','#ff9ee8'][item.grade-1]);
 hero.appendChild(equipmentIcon(item.slot,item.grade,item));const info=document.createElement('div');hero.appendChild(info);area.appendChild(hero);
 itemDetailChip(info,EQ_GRADES[item.grade-1],'item-grade');itemDetailChip(info,CHARACTERS[EQ_CHARS[Math.floor(item.slot/4)]].name);
 appendEqText(info,SERIES_NAMES[equipmentSeries(item)]+'の'+EQ_SLOTS[item.slot%4],'item-pop-name');
 const current=decodeEquipment(gameData.equipment.equipped[item.slot]),equipped=current?.uid===uid;
 if(equipped)itemDetailChip(info,'✓ 装備中');if(equipmentLocked(uid))itemDetailChip(info,'🔒 ロック中');
 appendEqText(info,'🛡 耐久 '+item.durability+' / '+EQ_MAX_DURABILITY[item.grade]+(item.durability===0?' · 破損':''),'item-durability-label');equipmentDurabilityGauge(info,item);
 const primary=document.createElement('div');primary.className='item-primary-actions';area.appendChild(primary);
 eqButton(primary,equipped?'✓ 装備中':'⚔ 装備する',!canEditTraining()||equipped||item.durability===0,()=>{equipItem(item.slot,uid);openItemDetails(uid);});
 eqButton(primary,equipmentLocked(uid)?'🔓 ロック解除':'🔒 ロック',!canEditTraining(),()=>toggleEquipmentLock(uid));
 if(item.durability===0)appendEqText(area,'修理すると装備効果が戻ります。','item-pop-warning');
 const effects=itemDetailPanel(area,'✨ この装備の効果');
 itemDetailChip(effects,equipmentDescription(item.slot%4,item.grade),'item-base-effect');
 const skills=document.createElement('div');skills.className='item-skill-grid';effects.appendChild(skills);
 item.skills.forEach(id=>{const a=EQ_AFFIXES[id],card=document.createElement('div');card.className='item-skill-card skill-tier-'+a.tier;appendEqText(card,['✦','◆','★'][a.tier]+' '+a.name,'item-skill-name');appendEqText(card,a.description(item.grade),'item-skill-effect');itemDetailChip(card,EQ_AFFIX_TIERS[a.tier]);skills.appendChild(card);});
 const changes=itemComparison(item).filter(d=>d.value!==0),gain=changes.filter(d=>d.key==='cooldown'?d.value<0:d.value>0).length;
 const comparison=itemDetailPanel(area,'↔ 装備すると '+(changes.length?'↑'+gain+'項目 / ↓'+(changes.length-gain)+'項目':'表示上の差なし'),true);
 appendEqText(comparison,'比較：'+(current?SERIES_NAMES[equipmentSeries(current)]+' / '+EQ_GRADES[current.grade-1]+' #'+current.uid:'未装備'),'item-muted');
 const diffs=document.createElement('div');diffs.className='item-diff-grid';comparison.appendChild(diffs);
 changes.forEach(d=>itemDetailChip(diffs,d.label+' '+(d.value>0?'+':'')+d.value+(d.unit==='ポイント'?'pt':d.unit),(d.key==='cooldown'?d.value<0:d.value>0)?'stat-gain':'stat-loss'));
 if(current)appendEqText(comparison,'現在の特殊スキル：'+equipmentAffixText(current),'item-muted');
 appendEqText(comparison,'表示は小数点以下を切り捨て。pt＝％補正の加算差。セット効果・装備上限を反映。育成・ゲーム側の速度上限は含みません。','item-muted');
 const series=itemDetailPanel(area,'🔗 '+SERIES_NAMES[equipmentSeries(item)]+'セット',true);
 const start=Math.floor(item.slot/4)*4,items=gameData.equipment.equipped.slice(start,start+4).map(decodeEquipment),before=seriesCounts(items)[equipmentSeries(item)];items[item.slot%4]=item;
 const after=seriesCounts(items)[equipmentSeries(item)];appendEqText(series,'同シリーズ：現在 '+before+'部位 → 装備後 '+after+'部位','item-set-count');
 const steps=document.createElement('div');steps.className='item-set-steps';series.appendChild(steps);
 [2,3,4].forEach(n=>itemDetailChip(steps,n+'部位'+(after>=n?' ✓':''),after>=n?'set-reached':''));
 appendEqText(series,SERIES_HELP[equipmentSeries(item)],'item-skill-effect');appendEqText(series,'数値は2→3→4部位の合計。グレード混在OK・破損品は対象外。','item-muted');
 const repair=itemDetailPanel(area,'🔧 修理 '+(repairGoldCost(item)?repairGoldCost(item)+'G':'不要'),true);
 const repairs=document.createElement('div');repairs.className='item-action-grid';repair.appendChild(repairs);
 eqButton(repairs,repairGoldCost(item)+'Gで全回復',!canEditTraining()||!repairGoldCost(item)||gameData.coins<repairGoldCost(item),()=>repairEquipmentGold(uid));
 eqButton(repairs,'同じ装備で合成',!canEditTraining()||item.durability>=EQ_MAX_DURABILITY[item.grade],()=>openEquipmentFusion(uid));
 appendEqText(repair,'所持金 '+gameData.coins+'G。合成は同キャラ・部位・グレード・シリーズ。素材は消費されます。','item-muted');
 const sale=itemDetailPanel(area,'🪙 売却・整理',true);
 if(equipmentProtected(uid))appendEqText(sale,'保護中：装備・ロック・保存セット・中断使用の登録を外すと売却できます。','item-pop-warning');
 const sales=document.createElement('div');sales.className='item-action-grid';sale.appendChild(sales);
 eqButton(sales,saleSelection.has(uid)?'選択から外す':'まとめ売却に選ぶ',!canEditTraining()||equipmentProtected(uid),()=>{toggleSaleItem(uid);openItemDetails(uid);});
 eqButton(sales,'売却 '+equipmentSaleValue(item)+'G',!canEditTraining()||equipmentProtected(uid),()=>{if(sellEquipment(uid))document.getElementById('item-detail-dialog').close();});
 addForgeItemActions(area,item);
 const help=itemDetailPanel(area,'ⓘ 装備のルール',true);appendEqText(help,'WAVE開始ごとに耐久−1。最後の耐久1はそのWAVE中有効。装備変更は新しい挑戦から適用されます。');appendEqText(help,'装備ID：'+uid,'item-muted');
 const dialog=document.getElementById('item-detail-dialog');if(!dialog.open)dialog.showModal();
}

function trainingNextGoal(id,route){
 const p=gameData.training[id],gate=TRAINING_GATES[p.levels[route]];if(!gate)return '最大レベル！';
 const play=p.bestWave>=gate.wave||p.uses>=gate.uses;
 return (play?'プレイ条件達成':`あと${Math.max(0,gate.uses-p.uses)}回使用 または WAVE${gate.wave}到達（現在${p.bestWave}）`)+' ／ '+(gameData.coins>=gate.cost?'コイン準備OK':`あと${gate.cost-gameData.coins}G`);
}
function canTrainAny(){return TRAINING_CHARACTERS.some(id=>['a','b','c'].some(r=>{const p=gameData.training[id],g=TRAINING_GATES[p.levels[r]];return g&&(p.bestWave>=g.wave||p.uses>=g.uses)&&gameData.coins>=g.cost;}));}
function refreshAdventureHome(){
 document.getElementById('btn-training').textContent='キャラクター育成'+(canTrainAny()?' ● 強化可能':'');
 const count=ACHIEVEMENTS.filter(a=>!isDeveloper&&!gameData.journey.claimed.includes(a.id)&&a.progress()>=a.goal).length;
 document.getElementById('btn-achievements').textContent='🏅 実績'+(count?' ● '+count+'件受取可能':'');
 const p=gameData.training[gameData.character];document.getElementById('home-next-goal').textContent=TRAINING_ROUTES[gameData.character].find(r=>r.id===p.route).name+'：'+trainingNextGoal(gameData.character,p.route);
}
function claimAchievement(id){
 if(isDeveloper||!canEditTraining())return false;const a=ACHIEVEMENTS.find(a=>a.id===id);
 if(!a||a.progress()<a.goal||gameData.journey.claimed.includes(id))return false;
 if(gameData.equipment.crystals+a.reward>1000000000)return false;
 gameData.journey.claimed.push(id);gameData.equipment.crystals+=a.reward;saveData();renderAchievements();return true;
}
function renderAchievements(){
 const area=document.getElementById('achievement-cards');area.replaceChildren();
 for(const a of ACHIEVEMENTS){const card=document.createElement('article');card.className='pop-card';appendEqText(card,'🏅 '+a.name);appendEqText(card,Math.min(a.goal,a.progress())+' / '+a.goal+'　💎 '+a.reward+'個');
 const claimed=gameData.journey.claimed.includes(a.id);eqButton(card,claimed?'受取済み':isDeveloper?'開発者は報酬対象外':'報酬を受け取る',claimed||isDeveloper||a.progress()<a.goal||!canEditTraining(),()=>claimAchievement(a.id));area.appendChild(card);}
}
let preflightPending=false;
async function confirmEquipmentReady(){
 const items=gameData.equipment.equipped.slice(EQ_CHARS.indexOf(gameData.character)*4,EQ_CHARS.indexOf(gameData.character)*4+4).map(decodeEquipment);
 const notes=items.flatMap((item,i)=>!item?[EQ_SLOTS[i]+'：未装備']:item.durability===0?[EQ_SLOTS[i]+'：破損（効果なし）']:item.durability<=5?[EQ_SLOTS[i]+'：残り耐久'+item.durability]:[]);
 if(!notes.length)return true;
 const dialog=document.getElementById('preflight-dialog'),area=document.getElementById('preflight-notes');area.replaceChildren();notes.forEach(n=>appendEqText(area,n));
 return new Promise(resolve=>{let done=false;const finish=ok=>{if(done)return;done=true;dialog.close();resolve(ok);};
 document.getElementById('preflight-go').onclick=()=>finish(true);document.getElementById('preflight-back').onclick=()=>finish(false);dialog.oncancel=e=>{e.preventDefault();finish(false);};dialog.onclose=()=>finish(false);dialog.showModal();});
}
let tutorialOrigin=null;
function tutorialTick(){
 const panel=document.getElementById('tutorial-hint');
 if(isDeveloper||gameMode==='test'||!waveEventActive||isGameOver||gameData.journey.tutorial>=2){panel.hidden=true;tutorialOrigin=null;return;}
 panel.hidden=false;
 if(!tutorialOrigin)tutorialOrigin={x:playerX,y:playerY};
 if(gameData.journey.tutorial===0&&Math.hypot(playerX-tutorialOrigin.x,playerY-tutorialOrigin.y)>35){gameData.journey.tutorial=1;saveData();}
 document.getElementById('tutorial-message').textContent=gameData.journey.tutorial===0?'① PCはマウス、スマホはドラッグで移動！ 攻撃は自動です。':'② PCは右クリック、スマホはスキルボタン！ 必殺技を使ってみよう。';
}
function completeTutorial(){gameData.journey.tutorial=2;document.getElementById('tutorial-hint').hidden=true;saveData();}
let rankingRequest=0;
const BOARD_KEYS=['normal','endless',...['balance','power','speed','tank'],...['normal','endless'].flatMap(m=>['balance','power','speed','tank'].map(c=>m+'_'+c))];
function defaultBoards(){return Array(42).fill(0);}
function repairedBoards(v){return Array.isArray(v)&&v.length===42&&v.every(n=>Number.isInteger(n)&&n>=0&&n<=1000000000)?v.slice():defaultBoards();}
function updateBoards(v,mode,character,wave=null){
 const b=repairedBoards(v);if(!['normal','endless'].includes(mode))return b;
 for(const k of [mode,character,mode+'_'+character]){const i=BOARD_KEYS.indexOf(k)*3;if(i<0)continue;if(wave===null)b[i+2]=Math.min(1000000000,b[i+2]+1);else{b[i]=Math.max(b[i],wave);b[i+1]=wave;}}
 return b;
}
function selectedBoardKey(){const m=document.getElementById('ranking-mode-filter').value,c=document.getElementById('ranking-character-filter').value;return m==='all'?(c==='all'?'':c):c==='all'?m:m+'_'+c;}
function previewRareSummon(){
 if(!isDeveloper||!auth?.currentUser||gachaBusy||!canEditTraining())return;
 void window.GameAudio?.unlock?.();
 const results=Array.from({length:10},(_,i)=>{const grade=3+i%3;return {uid:-(i+1),slot:i%16,grade,durability:EQ_MAX_DURABILITY[grade],skills:Array(EQ_SKILL_SLOTS[grade]).fill(i%3===2?10:1)};});
 startGachaPresentation(results,{preview:true});
}
function initAdventureUI(){
 document.getElementById('btn-achievements').addEventListener('click',()=>{renderAchievements();document.getElementById('achievements-dialog').showModal();});
 document.getElementById('toggle-sale-mode').addEventListener('click',()=>{if(!canEditTraining())return;saleSelectionMode=!saleSelectionMode;renderEquipment();});
 document.getElementById('equipment-dialog').addEventListener('close',()=>{saleSelectionMode=false;saleSelection.clear();});
 document.getElementById('sell-selected').addEventListener('click',sellSelectedEquipment);
 document.getElementById('select-sale-filter').addEventListener('click',()=>{if(!canEditTraining())return;equipmentFilteredItems().filter(i=>!equipmentProtected(i.uid)).forEach(i=>saleSelection.add(i.uid));renderEquipment();});
 document.getElementById('clear-sale-selection').addEventListener('click',()=>{saleSelection.clear();renderEquipment();});
 document.getElementById('tutorial-skip').addEventListener('click',completeTutorial);
 for(const id of ['ranking-mode-filter','ranking-character-filter'])document.getElementById(id).addEventListener('change',loadRanking);
 document.getElementById('dev-rare-summon').addEventListener('click',previewRareSummon);
}

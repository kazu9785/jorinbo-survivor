/* Series, saved loadouts and crafting. Existing equipment wire IDs remain unchanged. */
const SERIES_NAMES=['紅焔','氷晶','翠森','迅雷','聖光','常闇','星詠','竜王'];
const SERIES_HELP=['通常攻撃 +2/4/6%','被ダメージ軽減 +1/3/4ポイント','WAVE開始HP回復 +1/2/3','移動 +1/2/3%・連射 +1/3/4%','WAVE開始シールド +2/4/6','会心率 +1/3/4ポイント','スキル待ち時間 -1/2/3%・結晶ドロップ率 +1/2/3ポイント','対ボス通常攻撃 +3/6/9%・HP +1/2/3'];
function defaultForge(){return {dust:0,seen:[],series:[],presets:Array(12).fill('')};}
function unpackPreset(w){
 if(typeof w!=='string'||!w)return null;
 const parts=w.split('|');if(parts.length!==2||parts[0].length>216||!/^[A-Za-z0-9%_.!~*'()-]*$/.test(parts[0]))return null;
 const a=parts[1].split(':');if(a.length!==5||!['a','b','c'].includes(a[4]))return null;
 const ids=a.slice(0,4).map(Number);if(ids.some((n,i)=>!Number.isInteger(n)||n<0||n>999999999||String(n)!==a[i]))return null;
 try{const name=decodeURIComponent(parts[0]);if(name.length>24)return null;return {name,ids,route:a[4]};}catch(_){return null;}
}
function packForge(f){return f.dust+'#'+f.seen.join(',')+'#'+f.series.join(',')+'#'+f.presets.join(';');}
function unpackForge(value){
 const p=value.split('#');if(p.length!==4)return null;
 return {dust:Number(p[0]),seen:p[1]?p[1].split(',').map(Number):[],series:p[2]?p[2].split(','):[],presets:p[3].split(';')};
}
function repairForge(v){
 if(typeof v==='string')v=unpackForge(v);

 const f=defaultForge();if(!v||typeof v!=='object')return f;
 f.dust=Number.isInteger(v.dust)?Math.max(0,Math.min(1000000000,v.dust)):0;
 f.seen=[...new Set((Array.isArray(v.seen)?v.seen:[]).filter(n=>Number.isInteger(n)&&n>0&&n<1000000000))].slice(0,500);
 const used=new Set();f.series=(Array.isArray(v.series)?v.series:[]).filter(w=>{if(typeof w!=='string'||!/^([1-9][0-9]{0,8}):[0-7]$/.test(w))return false;const id=w.split(':')[0];if(used.has(id))return false;used.add(id);return true;}).slice(0,500);
 f.presets=f.presets.map((_,i)=>unpackPreset(v.presets?.[i])?v.presets[i]:'');return f;
}
function validForge(v){return !!v&&Object.keys(v).sort().join()==='dust,presets,seen,series'&&JSON.stringify(repairForge(v))===JSON.stringify({dust:v.dust,seen:v.seen,series:v.series,presets:v.presets});}
function pruneForge(){
 const ids=new Set(equipmentItems().map(i=>i.uid));
 gameData.forge.seen=gameData.forge.seen.filter(id=>ids.has(id));gameData.forge.series=gameData.forge.series.filter(w=>ids.has(Number(w.split(':')[0])));
}
function equipmentSeries(i){
 if(Number.isInteger(i.series))return Math.max(0,Math.min(i.grade===5?7:3,i.series));
 const wire=gameData.forge?.series.find(w=>w.startsWith(i.uid+':'));
 return wire?Number(wire.split(':')[1])%(i.grade===5?8:4):Math.abs(i.uid-1)%(i.grade===5?8:4);
}
function seriesCounts(items){const c=Array(8).fill(0);items.filter(i=>i&&i.durability>0).forEach(i=>c[equipmentSeries(i)]++);return c;}
function applySeriesStats(s,items){
 const c=seriesCounts(items),p=c.map(n=>Math.max(0,n-1));
 s.damage+=p[0]*.02;s.reduction+=p[1]*.015;s.heal+=p[2];s.speed+=p[3]*.01;s.fireRate+=p[3]*.015;
 s.shield+=p[4]*2;s.crit+=p[5]*.015;s.cooldown-=p[6]*.01;s.drop=p[6]*.01;s.boss+=p[7]*.03;s.hp+=p[7];
}
function seriesSummary(items){return seriesCounts(items).map((n,id)=>n?`${SERIES_NAMES[id]} ${n}/4部位${n>=2?' 発動中':'（2部位から）'}：${SERIES_HELP[id]}`:'').filter(Boolean).join('\n')||'シリーズ装備なし';}
function presetReservedIds(){return (gameData.forge?.presets||[]).flatMap(w=>unpackPreset(w)?.ids||[]).filter(Boolean);}
function forgeMessage(text){document.getElementById('forge-status').textContent=text;}
function loadoutTrainingHero() {
 return heroEquipmentCharacter()===equipmentViewedCharacter ? gameData.character : equipmentViewedCharacter;
}
function saveLoadout(index,name){
 if(!canEditTraining()||!Number.isInteger(index)||index<0||index>=12||Math.floor(index/3)!==EQ_CHARS.indexOf(equipmentViewedCharacter))return false;
 if(gameData.forge.presets[index]&&!confirm('この装備セットを上書きしますか？'))return false;
 const id=equipmentViewedCharacter,start=EQ_CHARS.indexOf(id)*4,ids=gameData.equipment.equipped.slice(start,start+4).map(w=>decodeEquipment(w)?.uid||0);
 gameData.forge.presets[index]=encodeURIComponent((name.trim()||'セット'+(index%3+1)).slice(0,24).replace(/[\uD800-\uDBFF]$/,''))+'|'+ids.join(':')+':'+gameData.training[loadoutTrainingHero()].route;
 saveData();renderEquipment();forgeMessage('装備と育成ルートを保存しました。セット内の装備は売却・分解・合成素材から保護されます。');return true;
}
function applyLoadout(index){
 if(!canEditTraining()||Math.floor(index/3)!==EQ_CHARS.indexOf(equipmentViewedCharacter))return false;
 const p=unpackPreset(gameData.forge.presets[index]);if(!p)return false;
 const start=Math.floor(index/3)*4,items=p.ids.map(id=>id?equipmentFind(id):null);
 if(items.some((item,s)=>p.ids[s]&&(!item||item.slot!==start+s||item.durability===0))){forgeMessage('装備が見つからないか破損しています。修理してから適用してください。');return false;}
 if(!confirm(p.name+' の装備と育成ルートを適用しますか？'))return false;
 items.forEach((i,s)=>gameData.equipment.equipped[start+s]=i?encodeEquipment(i):'none');
 const hero=loadoutTrainingHero(),progress=gameData.training[hero];
 if(heroOwned(hero) && progress.levels[p.route]>0) progress.route=p.route;
 saveData();renderEquipment();forgeMessage('セットを適用しました。新しい挑戦から有効です。');return true;
}
function renderForge(){
 const area=document.getElementById('loadout-presets');area.replaceChildren();const start=EQ_CHARS.indexOf(equipmentViewedCharacter)*3;
 for(let n=0;n<3;n++){const index=start+n,p=unpackPreset(gameData.forge.presets[index]),card=document.createElement('div');card.className='loadout-preset';
 const input=document.createElement('input');input.maxLength=24;input.value=p?.name||'';input.placeholder='セット'+(n+1)+'の名前';input.setAttribute('aria-label','装備セット'+(n+1)+'の名前');card.appendChild(input);
 eqButton(card,'現在の装備で保存',!canEditTraining(),()=>saveLoadout(index,input.value));eqButton(card,'適用',!canEditTraining()||!p,()=>applyLoadout(index));
 eqButton(card,'削除',!canEditTraining()||!p,()=>{if(!canEditTraining()||!confirm('保存したセットを削除しますか？装備そのものは残ります。'))return;gameData.forge.presets[index]='';saveData();renderEquipment();});area.appendChild(card);}
 const startSlot=EQ_CHARS.indexOf(equipmentViewedCharacter)*4;
 document.getElementById('series-active').textContent=seriesSummary(gameData.equipment.equipped.slice(startSlot,startSlot+4).map(decodeEquipment));
 document.getElementById('forge-dust').textContent=gameData.forge.dust;
}
function markEquipmentSeen(uid){if(!gameData.forge.seen.includes(uid)&&equipmentFind(uid)){gameData.forge.seen.push(uid);saveData();}}
function addEquipmentBadges(card,item){
 const labels=[];if(gameData.equipment.equipped.some(w=>decodeEquipment(w)?.uid===item.uid))labels.push('装備');if(equipmentLocked(item.uid))labels.push('🔒');if(!gameData.forge.seen.includes(item.uid))labels.push('NEW');
 if(labels.length){const badge=document.createElement('span');badge.className='equipment-badges';badge.textContent=labels.join(' ');card.appendChild(badge);}
}
function disassembleEquipment(uid){
 if(!canEditTraining()||equipmentProtected(uid))return false;const i=equipmentFind(uid);if(!i)return false;
 const dust=[0,1,3,8,25,80][i.grade];if(gameData.forge.dust+dust>1000000000)return false;
 if(!confirm(equipmentName(i)+'を分解して錬成素材'+dust+'個にしますか？元に戻せません。'))return false;
 gameData.equipment.items=gameData.equipment.items.filter(w=>decodeEquipment(w)?.uid!==uid);gameData.forge.dust+=dust;
 saveData();document.getElementById('item-detail-dialog').close();renderEquipment();return true;
}
function rerollEquipment(uid,slot){
 if(!canEditTraining()||equipmentProtected(uid))return false;const i=equipmentFind(uid);if(!i||!Number.isInteger(slot)||slot<0||slot>=i.skills.length)return false;
 const cost=i.grade*10;if(gameData.forge.dust<cost)return false;
 if(!confirm('錬成素材'+cost+'個で特殊スキル'+(slot+1)+'を再抽選します。元より弱くなる・同じスキルになる場合があります。確率は通常の同グレード抽選と共通です。'))return false;
 gameData.forge.dust-=cost;i.skills[slot]=rollEquipmentAffixes(i.grade)[0];equipmentReplace(i);saveData();renderEquipment();openItemDetails(uid);return true;
}
function addForgeItemActions(area,item){
 const panel=itemDetailPanel(area,'⚒ 分解・スキル再抽選',true);
 const cost=item.grade*10,protectedItem=equipmentProtected(item.uid);
 const chips=document.createElement('div');panel.appendChild(chips);itemDetailChip(chips,'素材 '+gameData.forge.dust+'個');itemDetailChip(chips,'再抽選 '+cost+'個 / 枠');
 if(protectedItem)appendEqText(panel,'保護中のため操作できません。詳しくは装備の使い方へ。','item-pop-warning');
 const actions=document.createElement('div');actions.className='item-action-grid';panel.appendChild(actions);
 eqButton(actions,'分解 → 素材 '+[0,1,3,8,25,80][item.grade]+'個',!canEditTraining()||protectedItem,()=>disassembleEquipment(item.uid));
 item.skills.forEach((id,n)=>eqButton(actions,'枠'+(n+1)+' '+EQ_AFFIXES[id].name+' ↻',!canEditTraining()||protectedItem||gameData.forge.dust<cost,()=>rerollEquipment(item.uid,n)));
 appendEqText(panel,'再抽選は1枠だけ。弱くなることもあります。分解は取り消せません。','item-muted');
 eqButton(panel,'🎲 再抽選の確率',false,()=>{renderEquipmentProbabilities();document.getElementById('equipment-probability-dialog').showModal();});
}

function autoEquipmentScore(items,goal){
 const s=equipmentStats(items);if(goal==='guard')return s.hp*2+s.reduction*150+s.evade*130+s.shield*2+s.heal*3;
 if(goal==='crystal')return s.drop*10000+s.speed*30+s.damage*4+s.fireRate*4;
 return s.damage*s.fireRate*(1+s.crit*(s.critPower-1))*(1+s.boss*.4)+s.skill*.25+(1-s.cooldown)*.3;
}
let autoEquipmentProposal=null;
function proposeEquipment(){
 if(!canEditTraining())return;
 const char=equipmentViewedCharacter,start=EQ_CHARS.indexOf(char)*4,goal=document.getElementById('auto-equipment-goal').value;
 const before=gameData.equipment.equipped.slice(start,start+4).map(decodeEquipment).map(i=>i?.durability>0?i:null),after=before.slice();
 const pool=equipmentItems().filter(i=>i.durability>0&&Math.floor(i.slot/4)===EQ_CHARS.indexOf(char));
 for(let round=0;round<3;round++)for(let slot=0;slot<4;slot++){
  let best=autoEquipmentScore(after,goal);for(const item of pool.filter(i=>i.slot===start+slot)){const candidate=after.slice();candidate[slot]=item;const score=autoEquipmentScore(candidate,goal);if(score>best||(!after[slot]&&score===best)){best=score;after[slot]=item;}}
 }
 autoEquipmentProposal={char,ids:after.map(i=>i?.uid||0)};
 const area=document.getElementById('auto-equipment-comparison');area.replaceChildren();
 after.forEach((i,n)=>appendEqText(area,EQ_SLOTS[n]+'：'+(before[n]?equipmentName(before[n]):'未装備')+' → '+(i?equipmentName(i):'未装備')));
 const a=equipmentStats(before),b=equipmentStats(after);
 COMPARE_FIELDS.forEach(([key,label,scale,unit])=>{const d=displayInteger((b[key]-a[key])*scale);if(d)appendEqText(area,label+' '+(d>0?'+':'')+d+unit);});
 appendEqText(area,seriesSummary(after));appendEqText(area,'目的に合う装備の候補です。能力差を見て決めよう！');
 document.getElementById('auto-equipment-dialog').showModal();
}
function applyEquipmentProposal(){
 const p=autoEquipmentProposal;if(!p||!canEditTraining())return;const start=EQ_CHARS.indexOf(p.char)*4,items=p.ids.map(id=>id?equipmentFind(id):null);
 if(items.some((i,n)=>p.ids[n]&&(!i||i.slot!==start+n||i.durability<=0))){document.getElementById('auto-equipment-dialog').close();forgeMessage('装備の状態が変わりました。もう一度候補を表示してください。');return;}
 items.forEach((i,n)=>gameData.equipment.equipped[start+n]=i?encodeEquipment(i):'none');saveData();renderEquipment();document.getElementById('auto-equipment-dialog').close();autoEquipmentProposal=null;
}
let stageRoute={kind:'normal',until:0},routeChoosing=false;
function routeMultipliers(){return stageRoute.until>=currentWave?(stageRoute.kind==='risk'?{hp:1.25,damage:1.2,coins:1.35,drops:1.2}:stageRoute.kind==='safe'?{hp:.9,damage:.9,coins:1,drops:1}:{hp:1,damage:1,coins:1,drops:1}):{hp:1,damage:1,coins:1,drops:1};}
function chooseStageRoute(next){
 const hud=document.getElementById('stage-route-hud');
 if(gameMode==='test'||currentWave<11||currentWave%10!==1||stageRoute.until>=currentWave){hud.textContent=stageRoute.until>=currentWave?(stageRoute.kind==='risk'?'強敵ルート':'安全ルート')+' ～WAVE'+stageRoute.until:'';next();return;}
 if(routeChoosing)return;routeChoosing=true;const dialog=document.getElementById('stage-route-dialog');document.body.style.cursor='default';
 let done=false;const choose=kind=>{if(done)return;done=true;stageRoute={kind,until:currentWave+9};routeChoosing=false;dialog.close();hud.textContent=(kind==='risk'?'強敵ルート':'安全ルート')+' ～WAVE'+stageRoute.until;next();};
 document.getElementById('route-safe').onclick=()=>choose('safe');document.getElementById('route-risk').onclick=()=>choose('risk');dialog.oncancel=e=>e.preventDefault();dialog.showModal();
}
function initForgeUI(){document.getElementById('auto-equipment').addEventListener('click',proposeEquipment);document.getElementById('apply-auto-equipment').addEventListener('click',applyEquipmentProposal);}

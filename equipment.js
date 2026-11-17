/* v1.2.0: individual equipment, durability, box, sale/fusion and published odds.
 * Compact item wire format: uid:slot:grade:durability:affix1:affix2:affix3.
 * All business logic uses decoded objects; Firestore validates bounded strings in bulk.
 */
const EQ_CHARS=['balance','power','speed','tank'];
const EQ_GRADES=['N','R','SR','SSR','UR'];
const EQ_SLOTS=['武器','頭','体','足'];
const EQ_COLORS=['#b8c4d6','#65e79a','#62baff','#ca8bff','#ffcf65'];
const EQ_IDS=Array.from({length:16},(_,s)=>Array.from({length:5},(_,g)=>`${s}-${g+1}`)).flat();
const EQ_GRADE_WEIGHTS=[7500,2000,450,49,1]; // / 10000 = 75,20,4.5,.49,.01 percent
const EQ_MAX_DURABILITY=[0,60,90,130,180,250];
const EQ_SKILL_SLOTS=[0,1,1,2,2,3];
const EQ_SELL_PRICE=[0,20,80,300,1500,10000];
const EQ_AFFIX_WEIGHTS=[null,[9900,99,1],[9800,198,2],[9500,495,5],[9000,990,10],[8500,1480,20]];
const EQ_AFFIX_POOLS=[[1,2,3,4,5,6],[7,8,9],[10,11,12]];
const EQ_AFFIX_TIERS=['通常','希少','神話'];
const EQ_BOX_LIMIT=500, EQ_PAGE_SIZE=24;
const EQ_AFFIXES={
 1:{name:'鋭刃',tier:0,description:g=>`通常攻撃＋${g*3}％`,apply:(s,g)=>s.damage+=g*.03},
 2:{name:'集中',tier:0,description:g=>`スキル威力＋${g*5}％`,apply:(s,g)=>s.skill+=g*.05},
 3:{name:'生命',tier:0,description:g=>`最大HP＋${g*2}`,apply:(s,g)=>s.hp+=g*2},
 4:{name:'速射',tier:0,description:g=>`連射速度＋${g*2.5}％`,apply:(s,g)=>s.fireRate+=g*.025},
 5:{name:'守護',tier:0,description:g=>`被ダメージ−${g*2}％`,apply:(s,g)=>s.reduction+=g*.02},
 6:{name:'疾風',tier:0,description:g=>`移動速度＋${g*2}％`,apply:(s,g)=>s.speed+=g*.02},
 7:{name:'竜殺し',tier:1,description:g=>`対ボス通常攻撃＋${g*12}％`,apply:(s,g)=>s.boss+=g*.12},
 8:{name:'再生',tier:1,description:g=>`WAVE開始時HPを${g}回復`,apply:(s,g)=>s.heal+=g},
 9:{name:'結界',tier:1,description:g=>`WAVE開始時シールド＋${g*3}`,apply:(s,g)=>s.shield+=g*3},
 10:{name:'覇王',tier:2,description:g=>`通常攻撃＋${g*30}％・会心率＋${g*5}％（会心2倍）`,apply:(s,g)=>{s.damage+=g*.3;s.crit+=g*.05;s.critPower=2;}},
 11:{name:'永劫',tier:2,description:g=>`スキル威力＋${g*40}％・待ち時間−${g*6}％`,apply:(s,g)=>{s.skill+=g*.4;s.cooldown-=g*.06;}},
 12:{name:'神盾',tier:2,description:g=>`最大HP＋${g*8}・被ダメージ−${g*5}％・回避率＋${g*3}％`,apply:(s,g)=>{s.hp+=g*8;s.reduction+=g*.05;s.evade+=g*.03;}}
};
let equipmentViewedCharacter='balance',equipmentRun=null,equipmentShield=0;
let equipmentPage=0,equipmentFusionBase=null;
function createDefaultEquipment(){return {version:2,crystals:0,nextId:1,items:[],equipped:Array(16).fill('none')};}
function encodeEquipment(i){return [i.uid,i.slot,i.grade,i.durability,...i.skills,...Array(3-i.skills.length).fill(0)].join(':');}
function decodeEquipment(value){
 if(typeof value!=='string'||!/^\d+(?::\d+){6}$/.test(value))return null;
 const [uid,slot,grade,durability,...skills]=value.split(':').map(Number);
 if(!Number.isSafeInteger(uid)||uid<1||uid>999999999||slot<0||slot>15||grade<1||grade>5||durability<0||durability>EQ_MAX_DURABILITY[grade])return null;
 const n=EQ_SKILL_SLOTS[grade];
 if(skills.slice(0,n).some(a=>!EQ_AFFIXES[a])||skills.slice(n).some(a=>a!==0))return null;
 const i={uid,slot,grade,durability,skills:skills.slice(0,n)};
 return encodeEquipment(i)===value?i:null;
}
function repairEquipment(v){
 const r=createDefaultEquipment();if(!v||typeof v!=='object')return r;
 if(Number.isSafeInteger(v.crystals))r.crystals=Math.max(0,Math.min(1000000000,v.crystals));
 if(v.version===2){
  const seen=new Set();
  for(const value of (Array.isArray(v.items)?v.items:[])){
   const i=decodeEquipment(value);if(!i||seen.has(i.uid)||r.items.length>=EQ_BOX_LIMIT)continue;
   seen.add(i.uid);r.items.push(value);r.nextId=Math.max(r.nextId,i.uid+1);
  }
  if(Number.isSafeInteger(v.nextId))r.nextId=Math.min(1000000000,Math.max(r.nextId,v.nextId));
  if(Array.isArray(v.equipped))r.equipped=r.equipped.map((_,s)=>{const i=decodeEquipment(v.equipped[s]);return i&&i.slot===s&&r.items.includes(v.equipped[s])?v.equipped[s]:'none';});
 }else if(Array.isArray(v.owned)){
  // Deterministic migration: each old design becomes one full-durability instance.
  // No reroll on login, so old saves cannot repeatedly fish for legendary skills.
  const oldToNew=new Map();
  for(const design of [...new Set(v.owned)].filter(id=>EQ_IDS.includes(id))){
   const [slot,grade]=design.split('-').map(Number),i={uid:r.nextId++,slot,grade,durability:EQ_MAX_DURABILITY[grade],skills:Array.from({length:EQ_SKILL_SLOTS[grade]},(_,n)=>(slot+n)%6+1)};
   const wire=encodeEquipment(i);r.items.push(wire);oldToNew.set(design,wire);
  }
  r.equipped=r.equipped.map((_,s)=>oldToNew.has(v.equipped?.[s])&&v.equipped[s].startsWith(s+'-')?oldToNew.get(v.equipped[s]):'none');
 }
 return r;
}
function validEquipmentLocal(v){return !!v&&Object.keys(v).sort().join()==='crystals,equipped,items,nextId,version'&&JSON.stringify(repairEquipment(v))===JSON.stringify({version:v.version,crystals:v.crystals,nextId:v.nextId,items:v.items,equipped:v.equipped});}
function equipmentItems(){return gameData.equipment.items.map(decodeEquipment).filter(Boolean);}
function equipmentFind(uid){return equipmentItems().find(i=>i.uid===uid)||null;}
function equipmentReplace(item){
 const d=gameData.equipment,index=d.items.findIndex(w=>decodeEquipment(w)?.uid===item.uid);if(index<0)return false;
 const old=d.items[index],wire=encodeEquipment(item);d.items[index]=wire;d.equipped=d.equipped.map(w=>w===old?wire:w);return true;
}
function applyDeveloperEquipment(){
 const d=gameData.equipment=repairEquipment(gameData.equipment);d.crystals=Math.max(d.crystals,100000);
 for(let slot=0;slot<16;slot++)for(let grade=1;grade<=5;grade++){
  let i=equipmentItems().find(x=>x.slot===slot&&x.grade===grade);
  if(!i&&d.items.length<EQ_BOX_LIMIT&&d.nextId<=999999999){i={uid:d.nextId++,slot,grade,durability:EQ_MAX_DURABILITY[grade],skills:Array(EQ_SKILL_SLOTS[grade]).fill(10+slot%3)};d.items.push(encodeEquipment(i));}
  if(i){i.durability=EQ_MAX_DURABILITY[grade];equipmentReplace(i);if(grade===5)d.equipped[slot]=encodeEquipment(i);}
 }
}
function equipmentCurrentIds(){return gameData.equipment.equipped.slice(EQ_CHARS.indexOf(gameData.character)*4,EQ_CHARS.indexOf(gameData.character)*4+4).map(w=>decodeEquipment(w)?.uid||null);}
function equipmentSnapshotIds(snapshot){
 const start=EQ_CHARS.indexOf(gameData.character)*4;
 return snapshot.map((id,s)=>{
  // v1.1 checkpoint design IDs, or v1.2 per-instance IDs.
  const i=typeof id==='number'?equipmentFind(id):typeof id==='string'&&EQ_IDS.includes(id)?equipmentItems().find(x=>`${x.slot}-${x.grade}`===id):null;
  return i&&i.slot===start+s?i.uid:null;
 });
}
function equipmentStartRun(snapshot){
 const ids=Array.isArray(snapshot)&&snapshot.length===4?equipmentSnapshotIds(snapshot):equipmentCurrentIds();
 equipmentRun={ids,active:ids.map(id=>{const i=equipmentFind(id);return i?.durability>0?i:null;})};equipmentShield=0;
}
function equipmentCheckpoint(){return equipmentRun?[...equipmentRun.ids]:equipmentCurrentIds();}
function equipmentActiveItems(){return equipmentRun?equipmentRun.active:equipmentCurrentIds().map(id=>{const i=equipmentFind(id);return i?.durability>0?i:null;});}
function equipmentGrades(){return equipmentActiveItems().map(i=>i?.grade||0);}
function equipmentStats(){
 const items=equipmentActiveItems(),[w,h,b,f]=items.map(i=>i?.grade||0);
 const s={damage:1+w*.08,hp:b*2,speed:1+f*.04,cooldown:1-h*.03,skill:1,crit:0,critPower:1.5,reduction:0,evade:0,fireRate:1,shield:0,heal:0,boss:0};
 items.filter(Boolean).forEach(i=>i.skills.forEach(a=>EQ_AFFIXES[a].apply(s,i.grade)));
 // Hard caps keep stacked rare effects playable; displayed in probability/effect help.
 s.cooldown=Math.max(.2,s.cooldown);s.reduction=Math.min(.75,s.reduction);s.evade=Math.min(.5,s.evade);s.crit=Math.min(.8,s.crit);
 return s;
}
function equipmentWaveStart(){
 if(!equipmentRun)equipmentStartRun();
 equipmentRun.active=equipmentRun.ids.map(id=>{const i=equipmentFind(id);return i?.durability>0?i:null;});
 let worn=false;
 if(gameMode!=='test')equipmentRun.active.filter(Boolean).forEach(i=>{equipmentReplace({...i,durability:i.durability-1});worn=true;});
 // The final durability point powers this entire wave. Broken items lose effects next wave.
 const s=equipmentStats();equipmentShield=s.shield;playerMaxHp=getPlayerMaxHp();
 playerCurrentHp=Math.min(playerMaxHp,playerCurrentHp+s.heal);updateHpDisplay();
 if(worn)saveData();
 const hud=document.getElementById('equipment-durability-hud');
 if(hud)hud.textContent=equipmentRun.ids.map((id,s)=>{const i=equipmentFind(id);return i?`${EQ_SLOTS[s]} ${i.durability}/${EQ_MAX_DURABILITY[i.grade]}`:'';}).filter(Boolean).join(' ｜ ')||'装備なし';
}
function equipmentBulletDamage(enemy,damage){const s=equipmentStats();return damage*(enemy.type==='boss'?1+s.boss:1)*(Math.random()<s.crit?s.critPower:1);}
function equipmentSkillMultiplier(){return equipmentStats().skill;}
function equipmentIncomingDamage(damage){
 const s=equipmentStats();if(s.evade&&Math.random()<s.evade){showDamageText(playerX,playerY,'回避');return 0;}
 const reduced=damage*(1-s.reduction),absorbed=Math.min(equipmentShield,reduced);equipmentShield-=absorbed;return reduced-absorbed;
}
function equipmentEnemyTier(type){if(type==='boss')return 4;if(type==='treasure')return 3;const r=Math.random();return r<.06?3:r<.25?2:1;}
function equipmentDrop(e){
 if(gameMode==='test')return false;
 const tier=e.strengthTier||(e.type==='boss'?4:e.type==='treasure'?3:1),chance=e.type==='treasure'?.65:[0,.08,.12,.18,.35][tier];
 if(Math.random()>=chance)return false;
 const count=e.type==='boss'?5:e.type==='treasure'?3:1;
 gameData.equipment.crystals=Math.min(1000000000,gameData.equipment.crystals+count);
 const el=document.createElement('div');el.className='crystal-drop world-transient';el.style.left=e.x+'px';el.style.top=e.y+'px';
 const img=document.createElement('img');img.src='summon_crystal.png';img.alt='召喚結晶';el.appendChild(img);
 const label=document.createElement('span');label.textContent='＋'+count;el.appendChild(label);worldLayer.appendChild(el);setTimeout(()=>el.remove(),1000);updateEquipmentBalance();return true;
}
function updateEquipmentBalance(){document.querySelectorAll('.crystal-balance').forEach(el=>el.textContent=gameData.equipment.crystals);}
function equipmentDescription(slot,g){return [`通常攻撃＋${g*8}％`,`スキル待ち時間−${g*3}％`,`最大HP＋${g*2}`,`移動速度＋${g*4}％`][slot];}
function equipmentName(i){return `${CHARACTERS[EQ_CHARS[Math.floor(i.slot/4)]].name} / ${EQ_SLOTS[i.slot%4]} / ${EQ_GRADES[i.grade-1]} #${i.uid}`;}
function equipmentAffixText(i){return i.skills.map(a=>`【${EQ_AFFIX_TIERS[EQ_AFFIXES[a].tier]}】${EQ_AFFIXES[a].name}：${EQ_AFFIXES[a].description(i.grade)}`).join('\n');}
function equipmentIcon(slot,g){const icon=document.createElement('div');icon.className='equipment-icon';icon.setAttribute('aria-hidden','true');icon.style.backgroundImage=`url('equipment_${EQ_GRADES[g-1].toLowerCase()}.png')`;icon.style.backgroundPosition=`${slot%4*100/3}% ${Math.floor(slot/4)*100/3}%`;return icon;}
function equipmentWeightedIndex(weights){let r=Math.random()*weights.reduce((a,b)=>a+b,0);for(let i=0;i<weights.length;i++){r-=weights[i];if(r<0)return i;}return weights.length-1;}
function rollEquipmentAffixes(g){return Array.from({length:EQ_SKILL_SLOTS[g]},()=>{const pool=EQ_AFFIX_POOLS[equipmentWeightedIndex(EQ_AFFIX_WEIGHTS[g])];return pool[Math.floor(Math.random()*pool.length)];});}
function equipmentMessage(text){document.getElementById('equipment-status').textContent=text;}
function equipmentRoll(count=1){
 if(gachaBusy||!canEditTraining()||![1,10].includes(count))return [];
 const d=gameData.equipment,cost=count*10;
 if(d.crystals<cost){equipmentMessage('召喚結晶が不足しています。');return [];}
 if(d.items.length+count>EQ_BOX_LIMIT){equipmentMessage(`ボックスがいっぱいです（最大${EQ_BOX_LIMIT}個）。先に売却か合成をしてください。結晶は消費していません。`);return [];}
 if(d.nextId+count-1>999999999){equipmentMessage('装備IDの上限に達しました。');return [];}
 d.crystals-=cost;const results=[];
 for(let n=0;n<count;n++){
  const grade=equipmentWeightedIndex(EQ_GRADE_WEIGHTS)+1,slot=Math.floor(Math.random()*16);
  const i={uid:d.nextId++,slot,grade,durability:EQ_MAX_DURABILITY[grade],skills:rollEquipmentAffixes(grade)};d.items.push(encodeEquipment(i));results.push(i);
 }
 saveData();equipmentPage=0;renderEquipment();equipmentMessage(`${count}個をボックスに追加しました。重複した装備も個別に保管します。`);
 const area=document.getElementById('equipment-results');area.replaceChildren();
 results.forEach(i=>{const card=document.createElement('article');card.className='equipment-result';card.appendChild(equipmentIcon(i.slot,i.grade));appendEqText(card,equipmentName(i));appendEqText(card,equipmentAffixText(i),'equipment-affixes');area.appendChild(card);});
 playSound('confirm');return results;
}
function equipmentReservedIds(){
 const c=typeof readCheckpoint==='function'?readCheckpoint():null;
 if(!Array.isArray(c?.equipment))return [];
 // Legacy checkpoints reference a design, so reserve its migrated instance too.
 return c.equipment.map(id=>typeof id==='number'?id:equipmentItems().find(i=>`${i.slot}-${i.grade}`===id)?.uid).filter(Boolean);
}
function equipmentProtected(uid){return gameData.equipment.equipped.some(w=>decodeEquipment(w)?.uid===uid)||equipmentReservedIds().includes(uid);}
function equipItem(slot,id){
 if(!canEditTraining()||!Number.isInteger(slot)||slot<0||slot>15)return false;
 const i=id==='none'?null:equipmentFind(id);
 if(id!=='none'&&(!i||i.slot!==slot||i.durability<=0))return false;
 gameData.equipment.equipped[slot]=i?encodeEquipment(i):'none';saveData();renderEquipment();return true;
}
function equipmentSaleValue(i){return Math.max(1,Math.floor(EQ_SELL_PRICE[i.grade]*(.25+.75*i.durability/EQ_MAX_DURABILITY[i.grade])));}
function sellEquipment(uid){
 if(!canEditTraining()||equipmentProtected(uid))return false;
 const i=equipmentFind(uid);if(!i)return false;const price=equipmentSaleValue(i);
 if(gameData.coins>Number.MAX_SAFE_INTEGER-price){equipmentMessage('ゴールドの上限に達するため売却できません。');return false;}
 if(!confirm(`${equipmentName(i)}\n耐久 ${i.durability}/${EQ_MAX_DURABILITY[i.grade]}\n${equipmentAffixText(i)}\n\n${price}Gで売却しますか？装備はなくなります。`))return false;
 gameData.equipment.items=gameData.equipment.items.filter(w=>decodeEquipment(w)?.uid!==uid);gameData.coins+=price;saveData();renderEquipment();equipmentMessage(`${price}Gで売却しました。`);return true;
}
function equipmentFusionCandidates(base){return equipmentItems().filter(i=>i.uid!==base.uid&&i.slot===base.slot&&i.grade===base.grade&&i.durability>0&&!equipmentProtected(i.uid));}
function fuseEquipment(baseUid,materialUid){
 if(!canEditTraining()||baseUid===materialUid||equipmentProtected(materialUid))return false;
 const base=equipmentFind(baseUid),material=equipmentFind(materialUid);
 if(!base||!material||base.slot!==material.slot||base.grade!==material.grade||material.durability<=0||base.durability>=EQ_MAX_DURABILITY[base.grade])return false;
 const restored=Math.min(EQ_MAX_DURABILITY[base.grade],base.durability+material.durability),overflow=Math.max(0,base.durability+material.durability-EQ_MAX_DURABILITY[base.grade]);
 if(!confirm(`残す：${equipmentName(base)}\n${equipmentAffixText(base)}\n\n消費：${equipmentName(material)}\n${equipmentAffixText(material)}\n\n耐久 ${base.durability}＋${material.durability} → ${restored}/${EQ_MAX_DURABILITY[base.grade]}${overflow?'（上限超過'+overflow+'は切り捨て）':''}\n残す装備の特殊スキルは変わりません。素材は消えます。合成しますか？`))return false;
 equipmentReplace({...base,durability:restored});gameData.equipment.items=gameData.equipment.items.filter(w=>decodeEquipment(w)?.uid!==materialUid);
 saveData();document.getElementById('equipment-fusion-dialog').close();renderEquipment();equipmentMessage(`合成完了：耐久を${restored}に回復しました。`);return true;
}
function appendEqText(parent,text,className=''){const p=document.createElement('p');p.textContent=text;if(className)p.className=className;parent.appendChild(p);return p;}
function eqButton(parent,label,disabled,action){const b=document.createElement('button');b.type='button';b.textContent=label;b.disabled=disabled;b.addEventListener('click',action);parent.appendChild(b);return b;}
function openEquipmentFusion(uid){
 if(!canEditTraining())return;const base=equipmentFind(uid);if(!base)return;
 equipmentFusionBase=uid;const area=document.getElementById('equipment-fusion-candidates');area.replaceChildren();
 document.getElementById('equipment-fusion-summary').textContent=`残す装備：${equipmentName(base)}\n耐久 ${base.durability}/${EQ_MAX_DURABILITY[base.grade]}\n${equipmentAffixText(base)}`;
 const candidates=equipmentFusionCandidates(base);
 if(!candidates.length)appendEqText(area,'素材がありません。同じキャラ・部位・グレードで、耐久が残っている未装備の品が必要です。中断データで使用中の装備は素材にできません。');
 candidates.forEach(i=>{const row=document.createElement('article');row.className='equipment-result';row.appendChild(equipmentIcon(i.slot,i.grade));appendEqText(row,equipmentName(i)+` / 耐久${i.durability}`);appendEqText(row,equipmentAffixText(i),'equipment-affixes');eqButton(row,`素材にする → 耐久${Math.min(EQ_MAX_DURABILITY[base.grade],base.durability+i.durability)}`,false,()=>fuseEquipment(uid,i.uid));area.appendChild(row);});
 document.getElementById('equipment-fusion-dialog').showModal();
}
function equipmentFilteredItems(){
 const val=id=>document.getElementById(id).value;
 const character=val('equipment-filter-character'),slot=val('equipment-filter-slot'),grade=val('equipment-filter-grade'),tier=val('equipment-filter-affix');
 const list=equipmentItems().filter(i=>(character==='all'||EQ_CHARS[Math.floor(i.slot/4)]===character)&&(slot==='all'||i.slot%4===Number(slot))&&(grade==='all'||i.grade===Number(grade))&&(tier==='all'||i.skills.some(a=>EQ_AFFIXES[a].tier===Number(tier))));
 const sort=val('equipment-sort');return list.sort((a,b)=>{
  if(sort==='new')return b.uid-a.uid;
  if(sort==='grade')return b.grade-a.grade||a.slot-b.slot||b.uid-a.uid;
  if(sort==='durability')return a.durability/EQ_MAX_DURABILITY[a.grade]-b.durability/EQ_MAX_DURABILITY[b.grade]||a.slot-b.slot||a.uid-b.uid;
  return a.slot%4-b.slot%4||Math.floor(a.slot/4)-Math.floor(b.slot/4)||b.grade-a.grade||b.uid-a.uid;
 });
}
function renderEquipment(){
 updateEquipmentBalance();const d=gameData.equipment,editable=canEditTraining();
 document.getElementById('equipment-box-summary').textContent=`ボックス ${d.items.length}/${EQ_BOX_LIMIT} ｜ 所持ゴールド ${gameData.coins}G`;
 const c=EQ_CHARS.indexOf(equipmentViewedCharacter),loadout=document.getElementById('equipment-loadout');loadout.replaceChildren();
 for(let s=0;s<4;s++){
  const card=document.createElement('article');card.className='equipment-loadout-slot';const i=decodeEquipment(d.equipped[c*4+s]);
  appendEqText(card,EQ_SLOTS[s]);if(i){card.appendChild(equipmentIcon(i.slot,i.grade));appendEqText(card,`${EQ_GRADES[i.grade-1]} #${i.uid} / 耐久${i.durability}/${EQ_MAX_DURABILITY[i.grade]}${i.durability===0?'（破損）':''}`);eqButton(card,'外す',!editable,()=>equipItem(c*4+s,'none'));}else appendEqText(card,'未装備');loadout.appendChild(card);
 }
 const items=equipmentFilteredItems(),pages=Math.max(1,Math.ceil(items.length/EQ_PAGE_SIZE));equipmentPage=Math.min(equipmentPage,pages-1);
 document.getElementById('equipment-page-label').textContent=`${items.length}個 / ${equipmentPage+1}ページ目（全${pages}ページ）`;
 document.getElementById('equipment-prev').disabled=equipmentPage===0;document.getElementById('equipment-next').disabled=equipmentPage>=pages-1;
 const area=document.getElementById('equipment-cards');area.replaceChildren();const reserved=equipmentReservedIds();
 for(const i of items.slice(equipmentPage*EQ_PAGE_SIZE,(equipmentPage+1)*EQ_PAGE_SIZE)){
  const wire=encodeEquipment(i),equipped=d.equipped.includes(wire),protectedItem=equipped||reserved.includes(i.uid);
  const card=document.createElement('article');card.className='equipment-box-card';card.style.borderColor=EQ_COLORS[i.grade-1];
  card.appendChild(equipmentIcon(i.slot,i.grade));appendEqText(card,equipmentName(i),'equipment-name');
  appendEqText(card,`耐久 ${i.durability}/${EQ_MAX_DURABILITY[i.grade]}${i.durability===0?' / 破損：修理まで効果なし':''}${equipped?' / 装備中':''}${reserved.includes(i.uid)?' / 中断データで使用中':''}`);
  appendEqText(card,equipmentDescription(i.slot%4,i.grade));appendEqText(card,equipmentAffixText(i),'equipment-affixes');
  const actions=document.createElement('div');actions.className='equipment-card-actions';
  eqButton(actions,equipped?'装備中':'装備する',!editable||equipped||i.durability===0,()=>equipItem(i.slot,i.uid));
  eqButton(actions,'合成で修理',!editable||i.durability>=EQ_MAX_DURABILITY[i.grade],()=>openEquipmentFusion(i.uid));
  eqButton(actions,`売却 ${equipmentSaleValue(i)}G`,!editable||protectedItem,()=>sellEquipment(i.uid));card.appendChild(actions);area.appendChild(card);
 }
 if(!items.length)appendEqText(area,'条件に合う装備はありません。召喚するか、絞り込み条件を変更してください。');
 document.getElementById('equipment-roll').disabled=gachaBusy||!editable||d.crystals<10||d.items.length>=EQ_BOX_LIMIT;
 document.getElementById('equipment-roll10').disabled=gachaBusy||!editable||d.crystals<100||d.items.length+10>EQ_BOX_LIMIT;
}
function equipmentPercent(x){return Number(x.toFixed(8)).toString()+'％';}
function renderEquipmentProbabilities(){
 const area=document.getElementById('equipment-probability-content');area.replaceChildren();
 renderPromotionProbabilities(area);
 const table=document.createElement('table');table.className='equipment-odds-table';
 const head=document.createElement('tr');['グレード','排出率','特定キャラ・部位1種','スキル枠','通常 / 希少 / 神話（1枠）','神話が1枠以上'].forEach(t=>{const th=document.createElement('th');th.textContent=t;head.appendChild(th);});table.appendChild(head);
 EQ_GRADES.forEach((name,index)=>{const g=index+1,w=EQ_AFFIX_WEIGHTS[g],p=w[2]/10000,row=document.createElement('tr');
  [name,equipmentPercent(EQ_GRADE_WEIGHTS[index]/100),equipmentPercent(EQ_GRADE_WEIGHTS[index]/1600),EQ_SKILL_SLOTS[g]+'枠',w.map(x=>equipmentPercent(x/100)).join(' / '),equipmentPercent((1-(1-p)**EQ_SKILL_SLOTS[g])*100)].forEach(t=>{const td=document.createElement('td');td.textContent=t;row.appendChild(td);});table.appendChild(row);});area.appendChild(table);
 appendEqText(area,'全キャラ・全部位から抽選します（キャラ各25％、部位各25％、組み合わせ各6.25％）。1回も10回も同じ独立抽選で、確定枠・天井はありません。URの1回あたり確率は0.01％です。1万回で必ず出る意味ではありません。');
 appendEqText(area,'特殊スキルは各枠で独立抽選。同じスキルが重複することもあり、効果は加算されます。グレード別に枠数と効果量が増えます。下の確率は「そのグレードの装備に付く、1枠あたりの個別スキル確率」です。');
 const effects=document.createElement('table');effects.className='equipment-odds-table';const h=document.createElement('tr');['スキル','分類','N','R','SR','SSR','UR','効果（g＝グレード番号1～5）'].forEach(t=>{const th=document.createElement('th');th.textContent=t;h.appendChild(th);});effects.appendChild(h);
 Object.entries(EQ_AFFIXES).forEach(([id,a])=>{const tr=document.createElement('tr');[a.name,EQ_AFFIX_TIERS[a.tier],...[1,2,3,4,5].map(g=>equipmentPercent(EQ_AFFIX_WEIGHTS[g][a.tier]/100/EQ_AFFIX_POOLS[a.tier].length)),a.description(1)+'（表示はN時。グレードに比例）'].forEach(t=>{const td=document.createElement('td');td.textContent=t;tr.appendChild(td);});effects.appendChild(tr);});area.appendChild(effects);
 appendEqText(area,'例：特定のUR装備1種を引く確率は0.000625％。さらに指定した1枠に「覇王」が付く確率は、0.000625％ × (0.2％ ÷ 3) ＝ 約0.000000416667％です。表示は小数点以下8桁で丸めています。');
 appendEqText(area,'合計効果の上限：被ダメージ軽減75％、回避50％、会心80％、装備によるスキル待ち時間短縮80％。移動・連射は従来のゲーム上限も適用。会心は通常弾のみ。');
 appendEqText(area,'結晶ドロップ：通常8％・精鋭12％・希少18％で1個、ボス35％で5個、宝物スライム65％で3個。既存敵の段階抽選：通常75％・精鋭19％・希少6％。追加敵は種族ごとに段階固定で、WAVEごとに解禁・出現比率が変化します。開発テストは結晶ドロップも耐久消費もありません。');
}
function initEquipmentUI(){
 const select=document.getElementById('equipment-character'),filter=document.getElementById('equipment-filter-character');
 EQ_CHARS.forEach(id=>{for(const target of [select,filter]){const o=document.createElement('option');o.value=id;o.textContent=CHARACTERS[id].name;target.appendChild(o);}});
 select.addEventListener('change',()=>{equipmentViewedCharacter=select.value;renderEquipment();});
 ['equipment-filter-character','equipment-filter-slot','equipment-filter-grade','equipment-filter-affix','equipment-sort'].forEach(id=>document.getElementById(id).addEventListener('change',()=>{equipmentPage=0;renderEquipment();}));
 document.getElementById('btn-equipment').addEventListener('click',()=>{if(!canEditTraining())return;equipmentViewedCharacter=gameData.character;select.value=equipmentViewedCharacter;equipmentPage=0;equipmentMessage('');document.getElementById('equipment-results').replaceChildren();renderEquipment();document.getElementById('equipment-dialog').showModal();});
 document.getElementById('equipment-roll').addEventListener('click',()=>summonEquipment(1));document.getElementById('equipment-roll10').addEventListener('click',()=>summonEquipment(10));
 document.getElementById('equipment-prev').addEventListener('click',()=>{equipmentPage=Math.max(0,equipmentPage-1);renderEquipment();});
 document.getElementById('equipment-next').addEventListener('click',()=>{equipmentPage++;renderEquipment();});
 document.getElementById('equipment-probabilities').addEventListener('click',()=>{renderEquipmentProbabilities();document.getElementById('equipment-probability-dialog').showModal();});
}

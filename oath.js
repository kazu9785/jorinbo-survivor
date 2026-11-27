// Keep roster order stable: existing saves and individual leaderboard columns depend on it.
const OATH_RECRUITS = {
    scout:   {name:'斥候', family:'speed', effectHue:-50, role:'索敵型', hp:10, damage:1.05, speed:1.32, range:780, detail:'遠くの敵を先に捕らえる長射程の貫通弾。'},
    medic:   {name:'野戦薬師', family:'power', effectHue:-110, role:'回復型', hp:13, damage:1.08, speed:1.02, every:6, heal:2, detail:'6回射撃するごとに薬草でHPを2回復。'},
    duelist: {name:'緋剣士', family:'balance', effectHue:150, role:'連撃型', hp:16, damage:1.5, speed:1.12, every:4, strike:2, detail:'4射ごとに威力2倍の緋色の一撃。'},
    tide:    {name:'潮術師', family:'power', effectHue:-85, role:'波紋型', hp:15, damage:1.58, speed:1, splash:95, splashPower:.56, detail:'水弾が弾け、周囲にも56％のダメージ。'},
    falcon:  {name:'隼射手', family:'speed', effectHue:-70, role:'貫通型', hp:14, damage:1.38, speed:1.38, pierce:3, range:820, detail:'遠くまで届く矢が敵を3体まで貫通。'},
    bastion: {name:'砦番', family:'tank', effectHue:8, role:'守備型', hp:23, damage:1.45, speed:.94, guard:.22, detail:'大盾で被ダメージを22％軽減。衝撃波で押し戻す。'},
    spark:   {name:'火花工兵', family:'balance', effectHue:165, role:'火花型', hp:17, damage:1.42, speed:1.08, every:4, pulse:110, power:1.4, detail:'4射ごとに着弾点から火花が広がる。'},
    frost:   {name:'霜詠み', family:'power', effectHue:-65, role:'氷環型', hp:21, damage:1.95, speed:1.07, splash:135, splashPower:.84, skill:1.3, detail:'広い氷の波紋。装備スキルの威力も30％増加。'},
    storm:   {name:'雷走り', family:'speed', effectHue:-65, role:'速射型', hp:19, damage:1.7, speed:1.5, cadence:1.3, pierce:3, detail:'射撃速度30％アップ。雷弾が3体を貫通。'},
    thorn:   {name:'茨守', family:'tank', effectHue:75, role:'再生型', hp:29, damage:1.72, speed:1.02, every:4, heal:3, guard:.26, detail:'被ダメージ26％減。4射ごとにHPを3回復。'},
    echo:    {name:'響刃', family:'balance', effectHue:54, role:'双撃型', hp:21, damage:1.74, speed:1.2, extra:1, detail:'音を重ねる二連刃。毎回の同時発射数が1つ増える。'},
    solar:   {name:'日輪騎士', family:'tank', effectHue:-22, role:'日輪型', hp:39, damage:2.35, speed:1.08, every:3, pulse:175, power:2.3, guard:.33, detail:'3射ごとに日輪が炸裂。被ダメージ33％減。'},
    lunar:   {name:'月読術師', family:'power', effectHue:-44, role:'月光型', hp:28, damage:2.65, speed:1.15, skill:1.65, cooldown:.72, splash:140, splashPower:1, detail:'スキル威力65％増・待ち時間28％短縮。月光弾は範囲攻撃。'},
    tempest: {name:'嵐狩り', family:'speed', effectHue:43, role:'暴風型', hp:26, damage:2.15, speed:1.58, extra:1, pierce:4, range:880, detail:'長射程の双矢が、それぞれ4体まで貫通。'},
    phoenix: {name:'不死鳥の継手', family:'power', effectHue:106, role:'再炎型', hp:39, damage:3.4, speed:1.28, every:3, pulse:200, power:3.2, heal:6, skill:1.85, detail:'3射ごとに炎が炸裂してHPを6回復。スキル威力85％増。'},
    void:    {name:'虚空の番人', family:'tank', effectHue:225, role:'虚壁型', hp:52, damage:3.05, speed:1.15, guard:.46, every:3, strike:3, extra:1, detail:'被ダメージ46％減。双発の衝撃波が3射ごとに3倍の威力に。'},
    astral:  {name:'星界の覇王', family:'balance', effectHue:170, role:'星界支配型', hp:65, damage:4.6, speed:1.6, guard:.5, extra:2, pierce:5, range:960, every:3, pulse:255, power:5, heal:9, skill:2.2, cooldown:.55, detail:'三連星が5体を貫通。3射ごとに星域を爆発させてHPを9回復。被ダメージ半減・スキル威力120％増。'}
};
for (const [id, recruit] of Object.entries(OATH_RECRUITS)) recruit.image = 'hero_' + id + '.png';

// Absolute weights out of 100,000 per slot, including equipment. Members within each tier are equally likely.
const OATH_TOTAL = 100000;
const OATH_TIERS = [
    {name:'銅章', color:'#e8c3a2', weight:2800, gold:100, members:['balance','power','speed','tank','scout','medic']},
    {name:'翠章', color:'#79e6a2', weight:1300, gold:250, members:['duelist','tide','falcon','bastion','spark']},
    {name:'蒼紋', color:'#76c7ff', weight:600, gold:600, members:['frost','storm','thorn','echo']},
    {name:'紫紋', color:'#d398ff', weight:240, gold:1500, members:['solar','lunar','tempest']},
    {name:'伝説', color:'#ffbf66', weight:55, gold:4000, members:['phoenix','void']},
    {name:'神話', color:'#ffe991', weight:5, gold:10000, members:['astral']}
];
const OATH_EQUIPMENT_WEIGHT = OATH_TOTAL - OATH_TIERS.reduce((sum,tier)=>sum+tier.weight,0);
const OATH_EQUIPMENT_SHARE = OATH_EQUIPMENT_WEIGHT / OATH_TOTAL;
const OATH_RARITY = new Map(OATH_TIERS.flatMap((tier,index)=>tier.members.map(id=>[id,index+1])));

function heroFamily(id=gameData.character) { return OATH_RECRUITS[id]?.family || id; }
function ownsTrainingFamily(id) { return gameData.roster.owned.some(member=>heroFamily(member)===id); }
function rollOathHero() {
    let ticket = Math.floor(Math.random()*OATH_TOTAL);
    if (ticket < OATH_EQUIPMENT_WEIGHT) return null;
    ticket -= OATH_EQUIPMENT_WEIGHT;
    for (const [index,tier] of OATH_TIERS.entries()) {
        if (ticket < tier.weight) {
            const id = tier.members[Math.floor(Math.random()*tier.members.length)];
            const duplicate = heroOwned(id);
            let gold = 0;
            if (duplicate) {
                gold = Math.min(tier.gold,Number.MAX_SAFE_INTEGER-gameData.coins);
                gameData.coins += gold;
            } else {
                gameData.roster.owned.push(id);
            }
            return {kind:'hero',id,grade:index+1,duplicate,gold};
        }
        ticket -= tier.weight;
    }
}
function oathResultName(item) { return item.kind==='hero' ? CHARACTERS[item.id].name : equipmentName(item); }
function oathResultIcon(item) { return item.kind==='hero' ? heroPortrait(CHARACTERS[item.id]) : equipmentIcon(item.slot,item.grade,item); }
function oathResultColor(item) { return item.kind==='hero' ? OATH_TIERS[item.grade-1].color : EQ_COLORS[item.grade-1]; }
function oathResultNote(item) {
    if (item.kind!=='hero') return equipmentAffixText(item);
    return item.duplicate ? '再会　＋'+item.gold.toLocaleString('ja-JP')+' G' : '新しい仲間！';
}
function oathShowHero(id) {
    const character=CHARACTERS[id], tier=OATH_TIERS[OATH_RARITY.get(id)-1];
    const dialog=document.getElementById('oath-hero-dialog');
    const detail=document.getElementById('oath-hero-detail');
    detail.replaceChildren(heroPortrait(character));
    appendEqText(detail,tier.name+' ／ '+character.role,'oath-rank');
    appendEqText(detail,character.detail);
    appendEqText(detail,'共通の装備・育成　'+CHARACTERS[heroFamily(id)].name+'系');
    document.getElementById('oath-hero-title').textContent=character.name;
    detail.style.setProperty('--rarity',tier.color);
    if (!dialog.open) dialog.showModal();
}
function oathDetails(item) {
    if (item.kind==='hero') oathShowHero(item.id);
    else openItemDetails(item.uid);
}
function paintOathChest(el,grade) {
    const index=grade-1;
    el.classList.add('oath-chest');
    el.style.backgroundPosition=(index%3*50)+'% '+(Math.floor(index/3)*100)+'%';
    el.style.setProperty('--rarity',OATH_TIERS[index].color);
    el.setAttribute('aria-label',OATH_TIERS[index].name+'の仲間の宝箱');
}
function renderOathOdds(root) {
    appendEqText(root,'星契召喚　装備95.0％ ／ 仲間5.0％','pop-note');
    const ranks=document.createElement('div');ranks.className='odds-grade-grid oath-odds';
    for (const [index,tier] of OATH_TIERS.entries()) {
        const card=document.createElement('details');card.className='odds-grade-card';
        card.style.setProperty('--rarity',tier.color);
        const head=document.createElement('summary'),chest=document.createElement('span');
        chest.className='odds-chest';paintOathChest(chest,index+1);head.append(chest);
        const chance=tier.weight/OATH_TOTAL*100;
        appendEqText(head,tier.name+'　'+tier.members.length+'体');
        appendEqText(head,equipmentPercent(chance),'odds-value');
        card.append(head);
        appendEqText(card,tier.members.map(id=>CHARACTERS[id].name).join('・'));
        appendEqText(card,'10万回あたりの期待数 '+tier.weight+'体 ／ 1体を指定 '+equipmentPercent(chance/tier.members.length));
        appendEqText(card,'再会時 ＋'+tier.gold.toLocaleString('ja-JP')+' G');
        ranks.append(card);
    }
    root.appendChild(ranks);
    appendEqText(root,'装備の排出率（召喚1回あたり）','pop-note');
}

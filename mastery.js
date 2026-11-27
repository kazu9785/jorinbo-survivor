// Values are percentages, HP, or world pixels as indicated. The effect text and
// combat use this same table so a level preview always matches the purchased bonus.
const MASTERY_STATS = {
    damage:['⚔️','通常弾の威力','％'], boss:['🐉','対ボスの通常弾威力','％'],
    range:['🎯','射程','px'], move:['👟','移動速度','％'], rate:['🏹','連射速度','％'],
    hp:['💚','最大HP',''], guard:['🛡️','被ダメージ軽減','％'], waveHeal:['🌿','WAVE開始時のHP回復',''],
    heal:['💊','固有射撃のHP回復',''], skill:['🔮','装備スキルの威力','％'],
    cooldown:['⌛','スキルの待ち時間短縮','％'], splash:['🌊','着弾時の範囲半径','px'],
    splashPower:['🌀','範囲攻撃の威力','％'], pulse:['💥','固有爆発の半径','px'],
    pulsePower:['🔥','固有爆発の威力','％'], strike:['⚡','強撃の威力','％'],
    push:['💨','盾弾で押す距離','px'], coins:['🪙','獲得コイン','％']
};
function masteryRoute(name,stat,step) {
    const [icon,label,unit]=MASTERY_STATS[stat];
    return {name,stat,step,icon,label,effect:level=>label+' ＋'+(step*level)+unit};
}
const PERSONAL_ROUTES = {
    scout:   [masteryRoute('見晴らしの眼','range',45),masteryRoute('風渡り','move',4),masteryRoute('遺物探し','coins',6)],
    medic:   [masteryRoute('薬草調合','heal',1),masteryRoute('野営の手当','waveHeal',2),masteryRoute('携帯薬杖','skill',8)],
    duelist: [masteryRoute('紅蓮の一閃','strike',9),masteryRoute('早太刀','rate',5),masteryRoute('決闘の誓い','boss',10)],
    tide:    [masteryRoute('広がる潮輪','splash',12),masteryRoute('砕け波','splashPower',10),masteryRoute('潮乗り','move',4)],
    falcon:  [masteryRoute('鷹の眼','range',55),masteryRoute('猛禽の狩り','boss',11),masteryRoute('羽矢','rate',5)],
    bastion: [masteryRoute('盾押し','push',7),masteryRoute('石壁の構え','guard',3),masteryRoute('城砦の心','hp',4)],
    spark:   [masteryRoute('導火線','pulse',17),masteryRoute('火薬調整','pulsePower',12),masteryRoute('早装填','rate',5)],
    frost:   [masteryRoute('氷冠','splash',15),masteryRoute('氷晶共鳴','skill',10),masteryRoute('霜の詠唱','cooldown',4)],
    storm:   [masteryRoute('稲妻の歩法','move',5),masteryRoute('雷鳴連射','rate',6),masteryRoute('落雷の標的','boss',11)],
    thorn:   [masteryRoute('茨の芽吹き','heal',2),masteryRoute('根の鎧','guard',3),masteryRoute('大樹の鼓動','hp',5)],
    echo:    [masteryRoute('重なる刃音','damage',5),masteryRoute('残響連舞','rate',5),masteryRoute('共鳴の間合い','range',40)],
    solar:   [masteryRoute('日輪の外縁','pulse',20),masteryRoute('陽炎炉','pulsePower',12),masteryRoute('暁の祈り','waveHeal',3)],
    lunar:   [masteryRoute('月満ちる刻','skill',12),masteryRoute('月読み','cooldown',5),masteryRoute('月暈','splash',18)],
    tempest: [masteryRoute('水平線の矢','range',60),masteryRoute('追い風','move',5),masteryRoute('嵐の討伐者','boss',12)],
    phoenix: [masteryRoute('再生の羽','heal',2),masteryRoute('紅炎の翼','pulse',22),masteryRoute('不死鳥の種火','pulsePower',13)],
    void:    [masteryRoute('虚無の障壁','guard',3),masteryRoute('重力崩壊','strike',12),masteryRoute('斥力場','push',9)],
    astral:  [masteryRoute('星域拡張','pulse',25),masteryRoute('超新星','pulsePower',15),masteryRoute('星律詠唱','cooldown',5)]
};
for (const routes of Object.values(PERSONAL_ROUTES)) {
    routes.forEach((route,i)=>{route.id=['a','b','c'][i];});
}
function personalTrainingBonus(stat) {
    if (!activeTraining?.level || activeTraining.legacyFamily) return 0;
    const route=PERSONAL_ROUTES[activeTraining.character]?.find(r=>r.id===activeTraining.route);
    return route?.stat===stat ? route.step*activeTraining.level : 0;
}

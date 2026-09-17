// ■■■ 緊急修復：カーソル表示 ■■■
document.body.style.cursor = 'default';

// ■■■ 要素の取得 ■■■
const authScreen = document.getElementById('auth-screen');
const homeScreen = document.getElementById('home-screen');
const rankingScreen = document.getElementById('ranking-screen');
const weaponShopScreen = document.getElementById('weapon-shop-screen');
const playerShopScreen = document.getElementById('player-shop-screen');
const skillShopScreen = document.getElementById('skill-shop-screen');
const waveShopScreen = document.getElementById('wave-shop-screen');

const gameScreen = document.getElementById('game-screen');
const gameOverScreen = document.getElementById('game-over-screen');
const gameClearScreen = document.getElementById('game-clear-screen');
const gameArea = document.getElementById('game-area');
const player = document.getElementById('player');

const totalCoinsDisplay = document.getElementById('total-coins');
const weaponShopCoinsDisplay = document.getElementById('weapon-shop-coins');
const playerShopCoinsDisplay = document.getElementById('player-shop-coins');
const skillShopCoinsDisplay = document.getElementById('skill-shop-coins');
const waveShopCoinsDisplay = document.getElementById('wave-shop-coins');
const gameCoinsDisplay = document.getElementById('game-coins');

const weaponShopItemsContainer = document.getElementById('weapon-shop-items');
const playerShopItemsContainer = document.getElementById('player-shop-items');
const skillItemsContainer = document.getElementById('skill-items-container');
const waveShopItemsContainer = document.getElementById('wave-shop-items');

const waveDisplay = document.getElementById('wave-display');
const nextWaveNum = document.getElementById('next-wave-num');
const timerText = document.getElementById('timer');
const hpDisplay = document.getElementById('hp-display');
const enemyCountText = document.getElementById('enemy-count');
const bossHud = document.getElementById('boss-hud');
const bossHpBar = document.getElementById('boss-hp-bar');
const bossAttackName = document.getElementById('boss-attack-name');
const waveModal = document.getElementById('wave-modal');
const waveTitle = document.getElementById('wave-title');
const usernameInput = document.getElementById('username-input');

const bombGaugeBar = document.getElementById('bomb-gauge-bar');
const gameSkillName = document.getElementById('game-skill-name');
const currentEquipName = document.getElementById('current-equip-name');

const resultWave = document.getElementById('result-wave');
const resultCoins = document.getElementById('result-coins');
const clearCoins = document.getElementById('clear-coins');

const authForm = document.getElementById('auth-form');
const loginUsername = document.getElementById('login-username');
const loginPassword = document.getElementById('login-password');
const authStatus = document.getElementById('auth-status');
const currentUserName = document.getElementById('current-user-name');
const rankingBody = document.getElementById('ranking-body');
const rankingStatus = document.getElementById('ranking-status');
const deleteAccountModal = document.getElementById('delete-account-modal');
const deleteAccountPassword = document.getElementById('delete-account-password');
const deleteAccountStatus = document.getElementById('delete-account-status');

// Buttons
const btnBattle = document.getElementById('btn-battle');
const btnWeapon = document.getElementById('btn-weapon');
const btnPlayer = document.getElementById('btn-player');
const btnSkillShop = document.getElementById('btn-skill-shop');
const btnBackWeapon = document.getElementById('btn-back-weapon');
const btnBackPlayer = document.getElementById('btn-back-player');
const btnBackSkill = document.getElementById('btn-back-skill');
const btnReset = document.getElementById('btn-reset');
const btnNextWave = document.getElementById('btn-next-wave');
const btnRetry = document.getElementById('btn-retry');
const btnReturnHome = document.getElementById('btn-return-home');
const btnClearHome = document.getElementById('btn-clear-home');
const btnLogin = document.getElementById('btn-login');
const btnRegister = document.getElementById('btn-register');
const btnLogout = document.getElementById('btn-logout');
const btnDeleteAccount = document.getElementById('btn-delete-account');
const btnCancelDeleteAccount = document.getElementById('btn-cancel-delete-account');
const btnConfirmDeleteAccount = document.getElementById('btn-confirm-delete-account');
const btnRanking = document.getElementById('btn-ranking');
const btnAuthRanking = document.getElementById('btn-auth-ranking');
const btnBackRanking = document.getElementById('btn-back-ranking');

// Audio (ダミー)
function playSound(el = "confirm", vol = 0.5) { window.GameAudio?.effect(el, vol); }

// ■■■ セーブデータ管理 ■■■
function getDefaultData() {
    return {
        coins: 0,
        endlessUnlocked: false,
        name: "HERO",
        character: "balance",
        upgrade: { damage: 1, fireRate: 1, count: 1, bulletSize: 1, speed: 1, maxHp: 1 },
        skills: {
            owned: ['sphere'], 
            equipped: 'sphere',
            levels: { sphere: 1, bomb: 1, energy: 1, satellite: 1 }
        }
    };
}

let gameData = getDefaultData();
let currentUsername = '';
let isDeveloper = false;
let pendingRegistrationName = '';
let rankingReturnScreen = 'auth';
let waveResultSaved = false;
let gameMode = 'normal';
let clearReturnTimer = null;
let startingRun = false;

// キャラクター選択はアカウント別にこのブラウザへ保存する。
const CHARACTERS = {
    balance: { name: '冒険者', role: 'バランス型', image: 'player_balance.png', hp: 10, damage: 1, speed: 1, detail: '基本HP10 ／ 攻撃・移動は標準' },
    power: { name: '魔導士', role: '攻撃型', image: 'player_power.png', hp: 8, damage: 1.4, speed: 0.9, detail: '基本HP8 ／ 通常弾の攻撃力＋40％ ／ 移動−10％' },
    speed: { name: 'レンジャー', role: 'スピード型', image: 'player_speed.png', hp: 8, damage: 0.9, speed: 1.3, detail: '基本HP8 ／ 移動＋30％ ／ 通常弾の攻撃力−10％' },
    tank: { name: '重装騎士', role: '耐久型', image: 'player_tank.png', hp: 16, damage: 1, speed: 0.8, detail: '基本HP16 ／ 移動−20％ ／ 攻撃は標準' }
};
function getSelectedCharacter() {
    return Object.hasOwn(CHARACTERS, gameData.character) ? CHARACTERS[gameData.character] : CHARACTERS.balance;
}
function getPlayerMaxHp() {
    return getSelectedCharacter().hp + ((gameData.upgrade.maxHp || 1) - 1) * 5 + (runUpgrades.maxHp || 0) * 5;
}
function updateCharacterDisplay() {
    const character = getSelectedCharacter();
    player.style.backgroundImage = `url('${character.image}')`;
    document.getElementById('selected-character-name').textContent = character.name + '（' + character.role + '）';
    document.getElementById('selected-character-image').src = character.image;
    document.getElementById('selected-character-image').alt = character.name;
}
function selectCharacter(id) {
    if (!Object.hasOwn(CHARACTERS, id) || homeScreen.classList.contains('hidden') || btnBattle.disabled) return;
    gameData.character = id;
    saveData();
    updateCharacterDisplay();
    renderCharacterCards();
}
function renderCharacterCards() {
    const container = document.getElementById('character-cards');
    container.replaceChildren();
    for (const [id, character] of Object.entries(CHARACTERS)) {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'character-card';
        const selected = gameData.character === id;
        button.classList.toggle('selected', selected);
        button.setAttribute('aria-pressed', String(selected));
        button.innerHTML = `<img src="${character.image}" alt=""><strong>${character.name}</strong><span>${character.role}</span><small>${character.detail}</small><b>${selected ? '選択中' : 'このキャラを選択'}</b>`;
        button.addEventListener('click', () => selectCharacter(id));
        container.appendChild(button);
    }
}
document.getElementById('btn-character').addEventListener('click', () => {
    if (homeScreen.classList.contains('hidden') || btnBattle.disabled) return;
    renderCharacterCards();
    document.getElementById('character-modal').classList.remove('hidden');
    document.getElementById('btn-close-character').focus();
});
function closeCharacterSelect() {
    document.getElementById('character-modal').classList.add('hidden');
    document.getElementById('btn-character').focus();
}
document.getElementById('btn-close-character').addEventListener('click', closeCharacterSelect);
document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && !document.getElementById('character-modal').classList.contains('hidden')) closeCharacterSelect();
});

// 3択強化はこの挑戦の間だけ保持。gameDataやFirebaseには保存しない。
let runUpgrades = {};
let rewardChoices = [];
let rewardPending = false;
let lastRewardWave = 0;
const RUN_REWARDS = [
    { id: 'damage', name: '火力アップ', detail: '通常弾の攻撃力 ＋20％' },
    { id: 'fireRate', name: '連射アップ', detail: '通常弾の連射速度 ＋10％' },
    { id: 'speed', name: '俊足', detail: '移動速度 ＋10％' },
    { id: 'maxHp', name: '生命力', detail: '最大HP ＋5、現在HPも5回復' },
    { id: 'count', name: '追加ショット', detail: '通常弾の同時発射数 ＋1' },
    { id: 'bulletSize', name: '大型弾', detail: '通常弾のサイズ ＋20％' }
];

function resetRunUpgrades() {
    runUpgrades = Object.fromEntries(RUN_REWARDS.map(reward => [reward.id, 0]));
    rewardChoices = [];
    rewardPending = false;
    lastRewardWave = 0;
    document.getElementById('reward-screen').classList.add('hidden');
    updateRunUpgradeSummary();
}

function updateRunUpgradeSummary() {
    const acquired = RUN_REWARDS.filter(reward => runUpgrades[reward.id] > 0)
        .map(reward => reward.name + ' ×' + runUpgrades[reward.id]);
    document.getElementById('run-upgrade-summary').textContent =
        '今回の挑戦の強化：' + (acquired.join(' ／ ') || 'なし');
}

function openWaveReward() {
    if ((gameMode === 'normal' && currentWave >= 20) || currentWave <= lastRewardWave || rewardPending) return;
    rewardPending = true;
    document.body.style.cursor = 'default';
    const pool = [...RUN_REWARDS];
    for (let i = pool.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    rewardChoices = pool.slice(0, 3).map(reward => reward.id);
    const cards = document.getElementById('reward-cards');
    cards.replaceChildren();
    document.getElementById('reward-wave').textContent = currentWave;
    pool.slice(0, 3).forEach(reward => {
        const button = document.createElement('button');
        button.classList.add('reward-card');
        const name = document.createElement('strong');
        name.textContent = reward.name;
        const detail = document.createElement('span');
        detail.textContent = reward.detail;
        const level = document.createElement('small');
        level.textContent = '獲得済み ' + (runUpgrades[reward.id] || 0) + '回';
        button.appendChild(name);
        button.appendChild(detail);
        button.appendChild(level);
        button.addEventListener('click', () => selectWaveReward(reward.id));
        cards.appendChild(button);
    });
    document.getElementById('reward-screen').classList.remove('hidden');
}

function selectWaveReward(id) {
    if (!rewardPending || !rewardChoices.includes(id) || currentWave <= lastRewardWave) return;
    rewardPending = false;
    lastRewardWave = currentWave;
    runUpgrades[id] = (runUpgrades[id] || 0) + 1;
    if (id === 'maxHp') {
        playerMaxHp = getPlayerMaxHp();
        playerCurrentHp = Math.min(playerMaxHp, playerCurrentHp + 5);
        updateHpDisplay();
    }
    rewardChoices = [];
    updateRunUpgradeSummary();
    document.getElementById('reward-screen').classList.add('hidden');
    openWaveShop();
}

// イベント設定：3WAVEごとに必ず1種類。倍率はこのWAVE内だけ有効。
const WAVE_EVENT_INTERVAL = 3;
const WAVE_EVENTS = {
    coin: { name: 'コインラッシュ', description: 'このWAVEの撃破報酬が2倍！', coins: 2 },
    rage: { name: '暴走WAVE', description: '敵速度1.3倍・ダメージ1.5倍！ 撃破報酬3倍', coins: 3 },
    treasure: { name: '宝物スライム', description: '金色スライムを15秒以内に倒してボーナス！', coins: 1 },
    barrage: { name: '弾幕地獄', description: '通常敵は約60％。上から来る弾幕の隙間を避けよう！', coins: 1 }
};
let currentWaveEvent = null;
let lastWaveEvent = null;
let waveEventActive = false;
let nextBarrageTime = 0;
let waveIntroTimer = null;

function prepareWaveEvent() {
    currentWaveEvent = null;
    if (currentWave % WAVE_EVENT_INTERVAL === 0) {
        const choices = Object.keys(WAVE_EVENTS).filter(key => key !== lastWaveEvent);
        currentWaveEvent = choices[Math.floor(Math.random() * choices.length)];
        lastWaveEvent = currentWaveEvent;
    }
    const event = WAVE_EVENTS[currentWaveEvent];
    document.getElementById('wave-event-title').textContent = event ? event.name : '';
    document.getElementById('wave-event-description').textContent = event ? event.description : '生き残れ…';
    const hud = document.getElementById('wave-event-hud');
    hud.textContent = event ? event.name + '：' + event.description : '';
    hud.classList.toggle('hidden', !event);
}

function stopWaveEvent() {
    stopTouchMovement();
    waveEventActive = false;
    clearTimeout(waveIntroTimer);
    // ボーナス敵は通常敵の残数に含めない。消えてもWAVE進行を止めない。
    for (let i = enemies.length - 1; i >= 0; i--) {
        if (enemies[i].type === 'treasure') {
            enemies[i].element.remove();
            enemies.splice(i, 1);
        }
    }
    enemyBullets.forEach(b => b.element.remove());
    enemyBullets = [];
}

function updateWaveEvent(now) {
    if (!waveEventActive || isGameOver) return;
    if (currentWaveEvent === 'treasure') {
        const treasure = enemies.find(e => e.type === 'treasure');
        if (treasure) {
            const remaining = Math.max(0, Math.ceil((treasure.expiresAt - now) / 1000));
            document.getElementById('wave-event-hud').textContent =
                '宝物スライム：残り' + remaining + '秒 ／ 撃破で' + treasure.coinDrop + 'G';
            if (remaining === 0) {
                treasure.element.remove();
                enemies.splice(enemies.indexOf(treasure), 1);
                document.getElementById('wave-event-hud').textContent = '宝物スライムは逃げ出した！';
            }
        }
    }
    if (currentWaveEvent !== 'barrage' || now < nextBarrageTime) return;
    nextBarrageTime = now + 1800;
    if (enemyBullets.length > 180) return;
    const width = gameArea.clientWidth || window.innerWidth;
    const lanes = 12;
    const gap = Math.floor(Math.random() * (lanes - 2));
    for (let i = 0; i < lanes; i++) {
        if (i >= gap && i < gap + 3) continue;
        const element = document.createElement('div');
        element.classList.add('enemy-bullet', 'event-bullet');
        const x = (i + 0.5) * width / lanes;
        element.style.left = x + 'px';
        element.style.top = '-20px';
        gameArea.appendChild(element);
        enemyBullets.push({
            element, x, y: -20, vx: 0, vy: 2.5,
            damage: 1, hitRadius: 16, createdAt: performance.now(), lifetime: 10000
        });
    }
}

function getSaveKey() {
    if (typeof auth !== 'undefined' && auth && auth.currentUser) {
        return `neonSurvivorData_${auth.currentUser.uid}${isDeveloper ? '_developer' : ''}`;
    }
    return 'neonSurvivorData';
}

function repairGameData(saved) {
    if (!saved || !saved.upgrade) return getDefaultData();

    const repaired = saved;
    repaired.endlessUnlocked = repaired.endlessUnlocked === true;
    if (!Object.hasOwn(CHARACTERS, repaired.character)) repaired.character = "balance";
    if(!repaired.upgrade.count) repaired.upgrade.count = 1;
    if(!repaired.upgrade.maxHp) repaired.upgrade.maxHp = 1;
    if(!repaired.upgrade.bulletSize) repaired.upgrade.bulletSize = 1;

    if(!repaired.skills) {
        repaired.skills = { owned: ['sphere'], equipped: 'sphere', levels: { sphere: 1, bomb: 1, energy: 1, satellite: 1 } };
    }
    if(!repaired.skills.levels.energy) repaired.skills.levels.energy = 1;
    if(!repaired.skills.levels.satellite) repaired.skills.levels.satellite = 1;
    return repaired;
}

// 上限なしの育成に対する、負荷を抑えた開発テスト用プリセット。
function applyDeveloperPreset() {
    if (!isDeveloper) return;
    gameData.coins = Math.max(gameData.coins, 1000000);
    gameData.endlessUnlocked = true;
    gameData.upgrade = { damage: 100, fireRate: 11, count: 10, bulletSize: 6, speed: 93, maxHp: 100 };
    gameData.skills.owned = ['sphere', 'bomb', 'energy', 'satellite'];
    gameData.skills.levels = { sphere: 20, bomb: 20, energy: 20, satellite: 20 };
    if (!gameData.skills.owned.includes(gameData.skills.equipped)) gameData.skills.equipped = 'sphere';
}

function loadData() {
    const saveKey = getSaveKey();
    let json = localStorage.getItem(saveKey);

    // 初回ログイン時だけ、以前のセーブデータをこのアカウントへ引き継ぐ
    if (!json && !isDeveloper && saveKey !== 'neonSurvivorData') {
        const oldJson = localStorage.getItem('neonSurvivorData');
        if (oldJson) {
            json = oldJson;
            localStorage.setItem(saveKey, oldJson);
        }
    }

    try {
        gameData = json ? repairGameData(JSON.parse(json)) : getDefaultData();
    } catch (e) {
        localStorage.removeItem(saveKey);
        gameData = getDefaultData();
    }

    if (isDeveloper) applyDeveloperPreset();
    if (currentUsername) gameData.name = currentUsername;
    updateCoinDisplays();
    if(usernameInput) usernameInput.value = gameData.name;
}

function saveData() {
    localStorage.setItem(getSaveKey(), JSON.stringify(gameData));
    updateCoinDisplays();
}

function updateCoinDisplays() {
    if(totalCoinsDisplay) totalCoinsDisplay.textContent = gameData.coins;
    if(weaponShopCoinsDisplay) weaponShopCoinsDisplay.textContent = gameData.coins;
    if(playerShopCoinsDisplay) playerShopCoinsDisplay.textContent = gameData.coins;
    if(skillShopCoinsDisplay) skillShopCoinsDisplay.textContent = gameData.coins;
    if(waveShopCoinsDisplay) waveShopCoinsDisplay.textContent = gameData.coins;
}

// ■■■ ログイン・共有ランキング ■■■
function setStatus(element, message, type = '') {
    if (!element) return;
    element.textContent = message;
    element.classList.remove('error', 'success');
    if (type) element.classList.add(type);
}

function normalizeUsername(name) {
    return name.trim().normalize('NFKC').toLowerCase();
}

function validateLoginInput() {
    const username = loginUsername.value.trim().normalize('NFKC');
    const password = loginPassword.value;

    if (username.length < 2 || username.length > 16) {
        throw new Error('名前は2～16文字で入力してください。');
    }
    if (/[\u0000-\u001f\u007f]/.test(username)) {
        throw new Error('名前に使用できない文字が含まれています。');
    }
    if (password.length < 6 || password.length > 64) {
        throw new Error('パスワードは6～64文字で入力してください。');
    }
    return { username, password };
}

async function usernameToInternalEmail(username) {
    const normalized = normalizeUsername(username);
    const bytes = new TextEncoder().encode(normalized);
    let hash = '';

    if (window.crypto && window.crypto.subtle) {
        const digest = await window.crypto.subtle.digest('SHA-256', bytes);
        hash = Array.from(new Uint8Array(digest), value => value.toString(16).padStart(2, '0')).join('');
    } else {
        // 古いブラウザ用の予備。通常は上のSHA-256が使われます。
        let hashA = 2166136261;
        let hashB = 3339675911;
        bytes.forEach(value => {
            hashA = Math.imul(hashA ^ value, 16777619);
            hashB = Math.imul(hashB ^ value, 2246822519);
        });
        hash = `${(hashA >>> 0).toString(16).padStart(8, '0')}${(hashB >>> 0).toString(16).padStart(8, '0')}`;
    }

    return `player-${hash.slice(0, 48)}@jorinbo.example.com`;
}

function getAuthErrorMessage(error) {
    const code = error && error.code ? error.code : '';
    const messages = {
        'auth/email-already-in-use': 'その名前はすでに使われています。',
        'auth/invalid-credential': '名前またはパスワードが違います。',
        'auth/user-not-found': '名前またはパスワードが違います。',
        'auth/wrong-password': '名前またはパスワードが違います。',
        'auth/requires-recent-login': '安全確認のため、いったんログアウトして再ログインしてからお試しください。',
        'auth/too-many-requests': '失敗回数が多いため一時停止中です。しばらく待ってください。',
        'auth/network-request-failed': '通信できませんでした。インターネット接続を確認してください。',
        'auth/operation-not-allowed': 'Firebaseでメール/パスワード認証を有効にしてください。',
        'permission-denied': 'Firestoreのルール設定を確認してください。',
        'firestore/permission-denied': 'Firestoreのルール設定を確認してください。'
    };
    return messages[code] || (error && error.message) || '処理に失敗しました。';
}

function setAuthButtonsDisabled(disabled) {
    btnLogin.disabled = disabled;
    btnRegister.disabled = disabled;
}

function showAuthScreen() {
    window.GameAudio?.scene("menu");
    document.getElementById('character-modal').classList.add('hidden');
    authScreen.classList.remove('hidden');
    homeScreen.classList.add('hidden');
    rankingScreen.classList.add('hidden');
    document.body.style.cursor = 'default';
}

function showHomeScreen() {
    window.GameAudio?.scene("menu");
    updateCharacterDisplay();
    document.getElementById('btn-endless').classList.toggle('hidden', !gameData.endlessUnlocked);
    authScreen.classList.add('hidden');
    rankingScreen.classList.add('hidden');
    homeScreen.classList.remove('hidden');
    document.body.style.cursor = 'default';
}

async function registerPlayer() {
    if (!isFirebaseConfigured || !auth || !db) {
        setStatus(authStatus, '先に firebase-config.js の設定を完了してください。', 'error');
        return;
    }

    try {
        const { username, password } = validateLoginInput();
        setAuthButtonsDisabled(true);
        setStatus(authStatus, '新しいアカウントを作成しています...');
        pendingRegistrationName = username;
        const email = await usernameToInternalEmail(username);
        await auth.createUserWithEmailAndPassword(email, password);
        setStatus(authStatus, '登録できました。ゲームを開始できます。', 'success');
        loginPassword.value = '';
    } catch (error) {
        pendingRegistrationName = '';
        setStatus(authStatus, getAuthErrorMessage(error), 'error');
    } finally {
        setAuthButtonsDisabled(false);
    }
}

async function loginPlayer() {
    if (!isFirebaseConfigured || !auth || !db) {
        setStatus(authStatus, '先に firebase-config.js の設定を完了してください。', 'error');
        return;
    }

    try {
        const { username, password } = validateLoginInput();
        setAuthButtonsDisabled(true);
        setStatus(authStatus, 'ログインしています...');
        pendingRegistrationName = '';
        const email = await usernameToInternalEmail(username);
        await auth.signInWithEmailAndPassword(email, password);
        loginPassword.value = '';
    } catch (error) {
        setStatus(authStatus, getAuthErrorMessage(error), 'error');
    } finally {
        setAuthButtonsDisabled(false);
    }
}

async function createPlayerDocument(user, username) {
    const playerRef = db.collection('players').doc(user.uid);
    await playerRef.set({
        username,
        usernameKey: normalizeUsername(username),
        highestWave: 0,
        latestWave: 0,
        attempts: 0,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    });
}

async function openRanking(fromScreen) {
    rankingReturnScreen = fromScreen;
    authScreen.classList.add('hidden');
    homeScreen.classList.add('hidden');
    rankingScreen.classList.remove('hidden');
    await loadRanking();
}

function appendRankingCell(row, text) {
    const cell = document.createElement('td');
    cell.textContent = text;
    row.appendChild(cell);
}

async function loadRanking() {
    rankingBody.innerHTML = '';
    if (!isFirebaseConfigured || !db) {
        setStatus(rankingStatus, 'firebase-config.js の設定後にランキングを表示できます。', 'error');
        return;
    }

    setStatus(rankingStatus, 'ランキングを読み込んでいます...');
    try {
        const snapshot = await db.collection('players').get();
        const players = [];
        snapshot.forEach(doc => {
            const data = doc.data();
            if (data.isDeveloper === true) return;
            players.push({
                uid: doc.id,
                username: data.username || 'NO NAME',
                highestWave: Number(data.highestWave) || 0,
                latestWave: Number(data.latestWave) || 0,
                attempts: Number(data.attempts) || 0
            });
        });

        players.sort((a, b) =>
            b.highestWave - a.highestWave ||
            b.latestWave - a.latestWave ||
            a.attempts - b.attempts ||
            a.username.localeCompare(b.username, 'ja')
        );

        players.forEach((playerData, index) => {
            const row = document.createElement('tr');
            if (auth && auth.currentUser && playerData.uid === auth.currentUser.uid) {
                row.classList.add('is-me');
            }
            appendRankingCell(row, index + 1);
            appendRankingCell(row, playerData.username);
            appendRankingCell(row, playerData.highestWave);
            appendRankingCell(row, playerData.latestWave);
            appendRankingCell(row, playerData.attempts);
            rankingBody.appendChild(row);
        });

        setStatus(rankingStatus, players.length ? `${players.length}人の記録` : 'まだ記録がありません。', 'success');
    } catch (error) {
        setStatus(rankingStatus, getAuthErrorMessage(error), 'error');
    }
}

async function registerAttempt() {
    if (isDeveloper && auth?.currentUser) return true;
    if (!auth || !auth.currentUser || !db) {
        alert('ログインしてから戦闘を開始してください。');
        return false;
    }

    try {
        await db.collection('players').doc(auth.currentUser.uid).update({
            attempts: firebase.firestore.FieldValue.increment(1),
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        return true;
    } catch (error) {
        alert(`挑戦回数を保存できませんでした。\n${getAuthErrorMessage(error)}`);
        return false;
    }
}

async function saveWaveResult(wave) {
    if (isDeveloper || waveResultSaved || !auth || !auth.currentUser || !db) return;
    waveResultSaved = true;
    const reachedWave = Math.max(1, Math.floor(Number(wave) || 1));
    const playerRef = db.collection('players').doc(auth.currentUser.uid);

    try {
        await db.runTransaction(async transaction => {
            const snapshot = await transaction.get(playerRef);
            if (!snapshot.exists) throw new Error('プレイヤーデータが見つかりません。');
            const data = snapshot.data();
            transaction.update(playerRef, {
                latestWave: reachedWave,
                highestWave: Math.max(Number(data.highestWave) || 0, reachedWave),
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
        });
    } catch (error) {
        waveResultSaved = false;
        console.error('WAVE記録の保存に失敗しました。', error);
    }
}

async function resetAllData() {
    if (!auth || !auth.currentUser || !db) throw new Error('ログイン情報を確認できません。');
    await db.collection('players').doc(auth.currentUser.uid).update({
        highestWave: 0,
        latestWave: 0,
        attempts: 0,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    localStorage.removeItem(getSaveKey());
    localStorage.removeItem('neonSurvivorData');
}

function openDeleteAccountModal() {
    if (!deleteAccountModal) return;
    deleteAccountPassword.value = '';
    setStatus(deleteAccountStatus, '');
    deleteAccountModal.classList.remove('hidden');
    setTimeout(() => deleteAccountPassword.focus(), 0);
}

function closeDeleteAccountModal() {
    if (!deleteAccountModal || btnConfirmDeleteAccount.disabled) return;
    deleteAccountModal.classList.add('hidden');
    deleteAccountPassword.value = '';
    setStatus(deleteAccountStatus, '');
}

async function deleteCurrentAccount() {
    if (!auth || !auth.currentUser || !db) {
        setStatus(deleteAccountStatus, 'ログイン情報を確認できません。', 'error');
        return;
    }

    const password = deleteAccountPassword.value;
    if (!password) {
        setStatus(deleteAccountStatus, '現在のパスワードを入力してください。', 'error');
        return;
    }

    const user = auth.currentUser;
    const username = currentUsername;
    const accountSaveKey = getSaveKey();
    const playerRef = db.collection('players').doc(user.uid);
    let playerDocumentDeleted = false;

    btnConfirmDeleteAccount.disabled = true;
    btnCancelDeleteAccount.disabled = true;
    setStatus(deleteAccountStatus, '本人確認後、アカウントを削除しています...');

    try {
        // アカウント削除は重要な操作なので、現在のパスワードでもう一度本人確認する
        const email = await usernameToInternalEmail(username);
        const credential = firebase.auth.EmailAuthProvider.credential(email, password);
        await user.reauthenticateWithCredential(credential);

        // ログイン中でないとFirestoreを削除できないため、ランキングを先に削除する
        await playerRef.delete();
        playerDocumentDeleted = true;
        await user.delete();

        localStorage.removeItem(accountSaveKey);
        localStorage.removeItem('neonSurvivorData');
        alert('アカウントとすべてのゲームデータを削除しました。');
        location.reload();
    } catch (error) {
        // ランキング削除後に認証アカウントの削除だけ失敗した場合は、
        // ログイン不能な状態を避けるため初期状態のプレイヤーデータを作り直す
        if (playerDocumentDeleted && auth.currentUser) {
            try {
                await createPlayerDocument(auth.currentUser, username);
            } catch (restoreError) {
                console.error('プレイヤーデータの復旧に失敗しました。', restoreError);
            }
        }
        setStatus(deleteAccountStatus, getAuthErrorMessage(error), 'error');
    } finally {
        btnConfirmDeleteAccount.disabled = false;
        btnCancelDeleteAccount.disabled = false;
        deleteAccountPassword.value = '';
    }
}

if (authForm) authForm.addEventListener('submit', event => {
    event.preventDefault();
    loginPlayer();
});
if (btnRegister) btnRegister.addEventListener('click', registerPlayer);
if (btnLogout) btnLogout.addEventListener('click', async () => {
    if (auth) await auth.signOut();
});
if (btnDeleteAccount) btnDeleteAccount.addEventListener('click', openDeleteAccountModal);
if (btnCancelDeleteAccount) btnCancelDeleteAccount.addEventListener('click', closeDeleteAccountModal);
if (btnConfirmDeleteAccount) btnConfirmDeleteAccount.addEventListener('click', deleteCurrentAccount);
if (deleteAccountPassword) deleteAccountPassword.addEventListener('keydown', event => {
    if (event.key === 'Enter') deleteCurrentAccount();
});
if (btnRanking) btnRanking.addEventListener('click', () => openRanking('home'));
if (btnAuthRanking) btnAuthRanking.addEventListener('click', () => openRanking('auth'));
if (btnBackRanking) btnBackRanking.addEventListener('click', () => {
    rankingScreen.classList.add('hidden');
    if (rankingReturnScreen === 'home' && auth && auth.currentUser) showHomeScreen();
    else showAuthScreen();
});

if (isFirebaseConfigured && auth && db) {
    auth.onAuthStateChanged(async user => {
        isDeveloper = false;
        if (!user) {
            currentUsername = '';
            showAuthScreen();
            return;
        }

        try {
            const playerRef = db.collection('players').doc(user.uid);
            let snapshot = await playerRef.get();
            if (!snapshot.exists && pendingRegistrationName) {
                await createPlayerDocument(user, pendingRegistrationName);
                snapshot = await playerRef.get();
            }
            if (!snapshot.exists) {
                throw new Error('ランキング用のプレイヤーデータが見つかりません。新規登録から作り直してください。');
            }

            isDeveloper = snapshot.data().isDeveloper === true;
            currentUsername = snapshot.data().username;
            pendingRegistrationName = '';
            if(currentUserName) currentUserName.textContent = currentUsername + (isDeveloper ? '（開発者・ランキング対象外）' : '');
            loadData();
            showHomeScreen();
            setStatus(authStatus, '');
        } catch (error) {
            setStatus(authStatus, getAuthErrorMessage(error), 'error');
            await auth.signOut();
        }
    });
} else {
    showAuthScreen();
    setAuthButtonsDisabled(true);
    setStatus(authStatus, 'Firebaseの初期設定が必要です。FIREBASE_SETUP.mdの手順を進めてください。', 'error');
}

// ■■■ ゲーム内変数 ■■■
let currentWave = 1;
let waveTimeLeft = 60;
let enemiesRemaining = 0;
let sessionCoins = 0;
let isBossPhase = false;
let bossMaxHp = 0;
let isGameOver = false;

let playerMaxHp = 10;
let playerCurrentHp = 10;
let lastDamageTime = 0;

let bombCooldown = 30000; 
let lastBombTime = -30000;

let playerX = window.innerWidth / 2;
let playerY = window.innerHeight / 2;
let mouseX = playerX;
let mouseY = playerY;

let animationFrameId = null;
let lastShotTime = 0;
let windowTimerInterval = null;

const bossImages = ['boss1.png', 'boss2.png', 'boss3.png', 'boss4.png'];
const BOSS_TYPES = [
    { id: 'fire', name: '炎竜', awakened: '獄炎竜', hp: 1, speed: 0.85, bulletSpeed: 1, damage: 1.35, interval: 1, phaseSpeed: 1.25, detail: '高火力・連続火炎弾', reward: 8 },
    { id: 'ice', name: '氷竜', awakened: '氷晶竜', hp: 1.15, speed: 0.65, bulletSpeed: 1.2, damage: 1, interval: 1.1, phaseSpeed: 1.15, detail: '移動は遅いが氷槍が速い', reward: 9 },
    { id: 'forest', name: '森竜', awakened: '古樹竜', hp: 1.4, speed: 0.55, bulletSpeed: 0.8, damage: 1, interval: 1.15, phaseSpeed: 1.15, detail: '高HP・曲がる種子弾', reward: 11 },
    { id: 'dark', name: '闇竜', awakened: '深淵竜', hp: 0.85, speed: 1.05, bulletSpeed: 1.1, damage: 1, interval: 0.95, phaseSpeed: 1.25, detail: '低HP・高速移動・らせん弾', reward: 8 }
];
function getBossType(boss) { return BOSS_TYPES[boss.bossImageIndex] || BOSS_TYPES[0]; }
function updateBossIdentity(boss) {
    const info = getBossType(boss);
    if (bossHud) bossHud.querySelector('.boss-name').textContent =
        (boss.bossPhase === 2 ? '第2形態：' + info.awakened : info.name) + ' ／ ' + info.detail;
}


let enemies = [];
let bullets = [];
let hearts = [];
let enemyBullets = [];
let involuteBullets = []; 
let bossAttackTimers = [];

updateCoinDisplays();
if(gameData.name && usernameInput) usernameInput.value = gameData.name;

function getArenaSize() {
    return { width: gameArea.clientWidth || window.innerWidth, height: gameArea.clientHeight || window.innerHeight };
}
function clampPlayerPosition() {
    const { width, height } = getArenaSize();
    const margin = Math.min(30, width / 2, height / 2);
    playerX = Math.max(margin, Math.min(width - margin, playerX));
    playerY = Math.max(margin, Math.min(height - margin, playerY));
    mouseX = Math.max(margin, Math.min(width - margin, mouseX));
    mouseY = Math.max(margin, Math.min(height - margin, mouseY));
}
let movementPointerId = null;
let lastTouchX = 0;
let lastTouchY = 0;
function stopTouchMovement() {
    if (movementPointerId !== null && gameArea.hasPointerCapture(movementPointerId)) gameArea.releasePointerCapture(movementPointerId);
    movementPointerId = null;
    mouseX = playerX;
    mouseY = playerY;
}
gameArea.addEventListener('pointerdown', e => {
    if (e.pointerType === 'mouse' || movementPointerId !== null || !waveEventActive || isGameOver) return;
    document.body.classList.add('touch-controls');
    movementPointerId = e.pointerId;
    lastTouchX = e.clientX;
    lastTouchY = e.clientY;
    mouseX = playerX;
    mouseY = playerY;
    gameArea.setPointerCapture(e.pointerId);
    e.preventDefault();
});
gameArea.addEventListener('pointermove', e => {
    if (!waveEventActive || isGameOver) return;
    if (e.pointerType === 'mouse') {
        const rect = gameArea.getBoundingClientRect();
        mouseX = e.clientX - rect.left;
        mouseY = e.clientY - rect.top;
    } else if (e.pointerId === movementPointerId) {
        // 相対移動なので指でキャラを隠さず、どこからでもドラッグできる。
        mouseX += e.clientX - lastTouchX;
        mouseY += e.clientY - lastTouchY;
        lastTouchX = e.clientX;
        lastTouchY = e.clientY;
        e.preventDefault();
    } else return;
    clampPlayerPosition();
});
['pointerup', 'pointercancel', 'lostpointercapture'].forEach(type => gameArea.addEventListener(type, e => {
    if (e.pointerId === movementPointerId) {
        movementPointerId = null;
        mouseX = playerX;
        mouseY = playerY;
    }
}));
window.addEventListener('blur', stopTouchMovement);
window.addEventListener('resize', () => { stopTouchMovement(); clampPlayerPosition(); });
document.getElementById('btn-touch-skill').addEventListener('click', () => attemptSkill());

// 戦闘中のSpaceは音量UIより先に処理し、ボタンの既定操作を止める。
// キャプチャ段階なら、音量パネル内で伝播を止めてもスキルを発動できる。
document.addEventListener('keydown', (e) => {
    if (isGameOver || !waveEventActive || e.code !== 'Space') return;
    e.preventDefault();
    if (!e.repeat) attemptSkill();
}, true);
// checkbox等のSpaceキーを離した際の既定操作も抑止する。
document.addEventListener('keyup', (e) => {
    if (!isGameOver && waveEventActive && e.code === 'Space') e.preventDefault();
}, true);

function attemptSkill() {
    if (!waveEventActive || isGameOver) return;
    const now = Date.now();
    if (now - lastBombTime >= bombCooldown) {
        if (gameData.skills.equipped === 'sphere') {
            triggerInvoluteSphere();
        } else if (gameData.skills.equipped === 'bomb') {
            triggerBomb();
        } else if (gameData.skills.equipped === 'energy') {
            triggerHighEnergyCircle();
        } else if (gameData.skills.equipped === 'satellite') {
            triggerSatellite();
        }
        lastBombTime = now;
    }
}

// ■■■ メニュー操作 ■■■
async function startNewRun(mode = 'normal') {
    if (startingRun || homeScreen.classList.contains('hidden')) return;
    if (isDeveloper) applyDeveloperPreset();
    if (mode === 'endless' && !gameData.endlessUnlocked) return;
    startingRun = true;
    const endlessButton = document.getElementById('btn-endless');
    endlessButton.disabled = true;
    btnBattle.disabled = true;
    const attemptSaved = await registerAttempt();
    btnBattle.disabled = false;
    endlessButton.disabled = false;
    startingRun = false;
    if (!attemptSaved) return;

    if(usernameInput) gameData.name = usernameInput.value;
    saveData();

    homeScreen.classList.add('hidden');
    gameScreen.classList.remove('hidden');
    gameOverScreen.classList.add('hidden');
    gameClearScreen.classList.add('hidden');
    document.body.style.cursor = 'none';

    gameMode = mode;
    currentWave = gameMode === 'endless' ? 21 : 1;
    sessionCoins = 0;
    resetRunUpgrades();
    lastWaveEvent = null;
    waveResultSaved = false;
    lastBombTime = -30000;
    if(gameCoinsDisplay) gameCoinsDisplay.textContent = 0;
    
    const skillNames = { sphere: "インボリュート", bomb: "ボム", energy: "ハイエナジー", satellite: "サテライト" };
    if(gameSkillName) gameSkillName.textContent = skillNames[gameData.skills.equipped] || "SKILL";

    updateCharacterDisplay();
    playerMaxHp = getPlayerMaxHp(); 
    playerCurrentHp = playerMaxHp;
    updateHpDisplay();

    startWaveSequence();
}
btnBattle.addEventListener('click', () => startNewRun('normal'));
document.getElementById('btn-endless').addEventListener('click', () => startNewRun('endless'));

btnWeapon.addEventListener('click', () => openWeaponShop());
btnPlayer.addEventListener('click', () => openPlayerShop());
btnSkillShop.addEventListener('click', () => openSkillShop());

btnBackWeapon.addEventListener('click', () => { weaponShopScreen.classList.add('hidden'); homeScreen.classList.remove('hidden'); });
btnBackPlayer.addEventListener('click', () => { playerShopScreen.classList.add('hidden'); homeScreen.classList.remove('hidden'); });
btnBackSkill.addEventListener('click', () => { skillShopScreen.classList.add('hidden'); homeScreen.classList.remove('hidden'); });

btnReset.addEventListener('click', async () => {
    if(!confirm("【警告】\n強化・コイン・最高WAVE・直近WAVE・挑戦回数を全て0に戻し、エンドレス解放もリセットしますか？")) return;

    btnReset.disabled = true;
    try {
        await resetAllData();
        alert('ゲームデータとランキング記録をリセットしました。');
        location.reload();
    } catch (error) {
        btnReset.disabled = false;
        alert(`リセットできませんでした。\n${getAuthErrorMessage(error)}`);
    }
});

btnRetry.addEventListener('click', async () => {
    btnRetry.disabled = true;
    const attemptSaved = await registerAttempt();
    btnRetry.disabled = false;
    if (!attemptSaved) return;

    if (isDeveloper) applyDeveloperPreset();
    gameOverScreen.classList.add('hidden');
    currentWave = gameMode === 'endless' ? 21 : 1;
    sessionCoins = 0;
    resetRunUpgrades();
    lastWaveEvent = null;
    waveResultSaved = false;
    lastBombTime = -30000;
    gameCoinsDisplay.textContent = 0;
    document.body.style.cursor = 'none';
    
    updateCharacterDisplay();
    playerMaxHp = getPlayerMaxHp(); 
    playerCurrentHp = playerMaxHp;
    updateHpDisplay();
    startWaveSequence();
});

btnReturnHome.addEventListener('click', () => location.reload());
function returnFromClear() {
    clearTimeout(clearReturnTimer);
    clearReturnTimer = null;
    gameClearScreen.classList.add('hidden');
    gameScreen.classList.add('hidden');
    waveShopScreen.classList.add('hidden');
    showHomeScreen();
}
btnClearHome.addEventListener('click', returnFromClear);

btnNextWave.addEventListener('click', () => {
    if (rewardPending || lastRewardWave !== currentWave || waveShopScreen.classList.contains('hidden')) return;
    waveShopScreen.classList.add('hidden');
    gameScreen.classList.remove('hidden');
    document.body.style.cursor = 'none';
    currentWave++;
    startWaveSequence();
});

// ■■■ ショップシステム ■■■
function renderWeaponItems(container) {
    container.innerHTML = '';
    createShopItem(container, "連射速度", "発射間隔短縮", "fireRate", "weapon");
    createShopItem(container, "攻撃力", "威力アップ", "damage", "weapon");
    createShopItem(container, "同時発射数", "弾数アップ", "count", "weapon");
    createShopItem(container, "弾サイズ", "巨大化", "bulletSize", "weapon");
}

function renderPlayerItems(container) {
    container.innerHTML = '';
    createShopItem(container, "移動速度", "スピードアップ", "speed", "player");
    createShopItem(container, "最大体力", "HP上限アップ", "maxHp", "player");
}

// ★スキルショップ
function renderSkillItems() {
    skillItemsContainer.innerHTML = '';
    const skillNames = { sphere: "インボリュート", bomb: "ボム", energy: "ハイエナジー", satellite: "サテライト" };
    currentEquipName.textContent = skillNames[gameData.skills.equipped];

    const skillList = [
        { id: 'sphere', name: 'インボリュート', cost: 0, desc: '回転する弾で広範囲攻撃' },
        { id: 'bomb', name: 'ボム', cost: 50, desc: '画面全体攻撃＆弾消し' },
        { id: 'energy', name: 'ハイエナジー', cost: 150, desc: '画面全体に広がる衝撃波' },
        { id: 'satellite', name: 'サテライト', cost: 300, desc: '宇宙からの自動狙撃' }
    ];

    skillList.forEach(skill => {
        const isOwned = gameData.skills.owned.includes(skill.id);
        const isEquipped = gameData.skills.equipped === skill.id;
        const level = gameData.skills.levels[skill.id] || 1;
        const upgradeCost = Math.floor(1 + (level * level * 2));

        const itemDiv = document.createElement('div');
        itemDiv.classList.add('shop-item');
        
        let html = `<h3>${skill.name}</h3><p>${skill.desc}</p>`;
        
        if (isOwned) {
            html += `<div class="lvl-display">Lv.${level}</div>`;
            if (isEquipped) {
                html += `<button class="equip-btn" disabled>装備中</button>`;
            } else {
                html += `<button class="equip-btn" id="equip-${skill.id}">装備する</button>`;
            }
            html += `<button class="buy-btn" id="upgrade-${skill.id}">強化 (${upgradeCost}G)</button>`;
            html += `<button class="item-reset-btn" id="reset-skill-${skill.id}">Lvリセット</button>`;
        } else {
            html += `<button class="buy-btn" id="buy-skill-${skill.id}">購入 (${skill.cost}G)</button>`;
        }
        
        itemDiv.innerHTML = html;
        skillItemsContainer.appendChild(itemDiv);

        if (!isOwned) {
            const buyBtn = itemDiv.querySelector(`#buy-skill-${skill.id}`);
            if (gameData.coins < skill.cost) buyBtn.disabled = true;
            buyBtn.addEventListener('click', () => {
                if (gameData.coins >= skill.cost) {
                    gameData.coins -= skill.cost;
                    gameData.skills.owned.push(skill.id);
                    saveData();
                    renderSkillItems();
                }
            });
        } else {
            if (!isEquipped) {
                const equipBtn = itemDiv.querySelector(`#equip-${skill.id}`);
                equipBtn.addEventListener('click', () => {
                    gameData.skills.equipped = skill.id;
                    saveData();
                    renderSkillItems();
                });
            }
            const upBtn = itemDiv.querySelector(`#upgrade-${skill.id}`);
            if (gameData.coins < upgradeCost) upBtn.disabled = true;
            upBtn.addEventListener('click', () => {
                if (gameData.coins >= upgradeCost) {
                    gameData.coins -= upgradeCost;
                    gameData.skills.levels[skill.id]++;
                    saveData();
                    renderSkillItems();
                }
            });
            const resetBtn = itemDiv.querySelector(`#reset-skill-${skill.id}`);
            if(level <= 1) {
                resetBtn.disabled = true;
                resetBtn.style.opacity = 0.3;
            }
            resetBtn.addEventListener('click', () => {
                if (level > 1) {
                    let refundAmount = 0;
                    for (let l = level - 1; l >= 1; l--) {
                        refundAmount += Math.floor(1 + (l * l * 2));
                    }
                    if(confirm(`${skill.name}をLv.1にリセットしますか？\n消費した ${refundAmount}G が戻ります。`)) {
                        gameData.coins += refundAmount;
                        gameData.skills.levels[skill.id] = 1;
                        saveData();
                        renderSkillItems();
                    }
                }
            });
        }
    });
}

function openWeaponShop() {
    homeScreen.classList.add('hidden');
    weaponShopScreen.classList.remove('hidden');
    renderWeaponItems(weaponShopItemsContainer);
}

function openPlayerShop() {
    homeScreen.classList.add('hidden');
    playerShopScreen.classList.remove('hidden');
    renderPlayerItems(playerShopItemsContainer);
}

function openSkillShop() {
    homeScreen.classList.add('hidden');
    skillShopScreen.classList.remove('hidden');
    renderSkillItems();
}

function openWaveShop() {
    gameScreen.classList.add('hidden');
    document.body.style.cursor = 'default';
    waveShopScreen.classList.remove('hidden');
    nextWaveNum.textContent = currentWave + 1;
    updateCoinDisplays();
    
    waveShopItemsContainer.innerHTML = '';
    createShopItem(waveShopItemsContainer, "連射速度", "発射間隔短縮", "fireRate", "wave");
    createShopItem(waveShopItemsContainer, "攻撃力", "威力アップ", "damage", "wave");
    createShopItem(waveShopItemsContainer, "同時発射数", "弾数アップ", "count", "wave");
    createShopItem(waveShopItemsContainer, "弾サイズ", "巨大化", "bulletSize", "wave");
    createShopItem(waveShopItemsContainer, "移動速度", "スピードアップ", "speed", "wave");
    createShopItem(waveShopItemsContainer, "最大体力", "HP上限アップ", "maxHp", "wave");
}

function createShopItem(container, name, desc, key, shopType) {
    const level = gameData.upgrade[key] || 1;
    const cost = Math.floor(1 + (level * level * 2));

    const itemDiv = document.createElement('div');
    itemDiv.classList.add('shop-item');
    itemDiv.innerHTML = `
        <h3>${name}</h3><p>${desc}</p><div class="lvl-display">Lv.${level}</div>
        <button class="buy-btn" id="buy-${key}-${shopType}">強化 (${cost}G)</button>
        <button class="item-reset-btn" id="reset-${key}-${shopType}">Lvリセット</button>
    `;
    container.appendChild(itemDiv);

    const buyBtn = itemDiv.querySelector(`#buy-${key}-${shopType}`);
    if (gameData.coins < cost) {
        buyBtn.disabled = true;
        buyBtn.textContent = "資金不足";
    }
    buyBtn.addEventListener('click', () => {
        if (gameData.coins >= cost) {
            gameData.coins -= cost;
            gameData.upgrade[key]++;
            playSound();
            saveData();
            
            if(shopType === 'weapon') renderWeaponItems(container);
            else if(shopType === 'player') renderPlayerItems(container);
            else openWaveShop();
            
            if(key === 'maxHp') {
                playerMaxHp = getPlayerMaxHp();
                playerCurrentHp = playerMaxHp; 
                updateHpDisplay();
            }
        }
    });

    const resetBtn = itemDiv.querySelector(`#reset-${key}-${shopType}`);
    if(level <= 1) {
        resetBtn.disabled = true;
        resetBtn.style.opacity = 0.3;
    }
    resetBtn.addEventListener('click', () => {
        if (level > 1) {
            let refundAmount = 0;
            for (let l = level - 1; l >= 1; l--) {
                let paidCost = Math.floor(1 + (l * l * 2));
                refundAmount += paidCost;
            }
            if(confirm(`${name}をLv.1にリセットしますか？\n消費した ${refundAmount}G が戻ります。`)) {
                gameData.coins += refundAmount;
                gameData.upgrade[key] = 1;
                saveData();
                playSound();
                
                if(shopType === 'weapon') renderWeaponItems(container);
                else if(shopType === 'player') renderPlayerItems(container);
                else openWaveShop();

                if(key === 'maxHp') {
                    playerMaxHp = getPlayerMaxHp();
                    if(playerCurrentHp > playerMaxHp) playerCurrentHp = playerMaxHp;
                    updateHpDisplay();
                }
            }
        }
    });
}

function getPlayerStats() {
    let dmg = gameData.upgrade.damage || 1;
    let rate = gameData.upgrade.fireRate || 1;
    let spd = gameData.upgrade.speed || 1;
    let cnt = gameData.upgrade.count || 1;
    let sizeLevel = gameData.upgrade.bulletSize || 1;
    let bSize = 10 + (sizeLevel - 1) * 4;

    return {
        shotInterval: Math.max(50, Math.max(100, 500 - (rate - 1) * 40) / (1 + (runUpgrades.fireRate || 0) * 0.1)),
        damage: dmg * (1 + (runUpgrades.damage || 0) * 0.2) * getSelectedCharacter().damage,
        moveSpeed: Math.min(1, (0.08 + (spd - 1) * 0.01) * (1 + (runUpgrades.speed || 0) * 0.1) * getSelectedCharacter().speed),
        bulletCount: cnt + (runUpgrades.count || 0),
        bulletSize: bSize * (1 + (runUpgrades.bulletSize || 0) * 0.2)
    };
}

// ■■■ ゲームループ関連 ■■■
function startWaveSequence() {
    window.GameAudio?.scene("battle");
    stopWaveEvent();
    isGameOver = true;
    prepareWaveEvent();
    isBossPhase = false;
    clearBossAttackTimers();
    if(bossHud) bossHud.classList.add('hidden');
    if(bossAttackName) bossAttackName.textContent = '攻撃準備中...';
    
    enemies.forEach(e => e.element.remove());
    bullets.forEach(b => b.element.remove());
    enemyBullets.forEach(b => b.element.remove());
    involuteBullets.forEach(b => b.element.remove());
    hearts.forEach(h => h.element.remove());
    enemies = [];
    bullets = [];
    enemyBullets = [];
    involuteBullets = [];
    hearts = [];
    
    waveDisplay.textContent = currentWave;
    waveTimeLeft = 30 + Math.floor(currentWave * 5);
    timerText.textContent = waveTimeLeft;

    waveModal.classList.remove('hidden');
    waveTitle.textContent = `WAVE ${currentWave}`;
    
    waveIntroTimer = setTimeout(() => {
        waveModal.classList.add('hidden');
        startBattle();
    }, 2000);
}

function startBattle() {
    const arena = getArenaSize();
    playerX = mouseX = arena.width / 2;
    playerY = mouseY = arena.height / 2;
    clampPlayerPosition();
    isGameOver = false;
    waveEventActive = true;
    nextBarrageTime = Date.now() + 2500;
    playSound("start");
    spawnWaveEnemies();
    if (currentWaveEvent === 'treasure') spawnEnemy('treasure');

    if (animationFrameId) cancelAnimationFrame(animationFrameId);
    gameLoop();
    
    clearInterval(windowTimerInterval);
    windowTimerInterval = setInterval(() => {
        if(isGameOver) return;
        waveTimeLeft--;
        timerText.textContent = waveTimeLeft;
        if (waveTimeLeft <= 0) gameOver("時間切れ");
    }, 1000);
}

function gameLoop() {
    if (isGameOver) return;

    const stats = getPlayerStats();

    if (!isNaN(mouseX) && !isNaN(mouseY)) {
        playerX += (mouseX - playerX) * stats.moveSpeed;
        playerY += (mouseY - playerY) * stats.moveSpeed;
    }
    clampPlayerPosition();
    player.style.left = playerX + 'px';
    player.style.top = playerY + 'px';

    const now = Date.now();
    updateWaveEvent(now);
    if (now - lastShotTime > stats.shotInterval) {
        fireBullet(stats.damage, stats.bulletCount, stats.bulletSize);
        lastShotTime = now;
    }

    updateBombGauge(now);
    updateBullets();
    if (!waveEventActive || isGameOver) return;
    updateInvoluteBullets();
    if (!waveEventActive || isGameOver) return;
    updateEnemyBullets();
    if (!waveEventActive || isGameOver) return;
    updateEnemies();
    updateHearts();
    animationFrameId = requestAnimationFrame(gameLoop);
}

function triggerInvoluteSphere() {
    playSound("skill");
    const level = gameData.skills.levels.sphere;
    const sphereCount = 6 + (level - 1) * 2;
    
    for (let i = 0; i < sphereCount; i++) {
        const el = document.createElement('div');
        el.classList.add('involute-bullet');
        gameArea.appendChild(el);
        let startAngle = (Math.PI * 2 / sphereCount) * i;
        involuteBullets.push({
            element: el, angle: startAngle, radius: 0, active: true
        });
    }
}

function triggerBomb() {
    playSound("skill");
    const effect = document.createElement('div');
    effect.classList.add('bomb-effect');
    gameArea.appendChild(effect);
    setTimeout(() => effect.remove(), 1000);

    const level = gameData.skills.levels.bomb;
    const damage = 100 + (level - 1) * 50;

    for (let i = enemies.length - 1; i >= 0; i--) {
        damageEnemy(enemies[i], damage);
    }
    enemyBullets.forEach(b => b.element.remove());
    enemyBullets = [];
}

// ★ハイエナジーサークル (画面全体)
function triggerHighEnergyCircle() {
    playSound("skill");
    const level = gameData.skills.levels.energy;
    // 画面全体を覆うほど大きな半径にする
    const maxDim = Math.max(getArenaSize().width, getArenaSize().height);
    const radius = maxDim; 
    const damage = 20 + (level - 1) * 10;

    const el = document.createElement('div');
    el.classList.add('energy-circle');
    el.style.width = (radius * 2) + 'px';
    el.style.height = (radius * 2) + 'px';
    el.style.left = playerX + 'px';
    el.style.top = playerY + 'px';
    gameArea.appendChild(el);

    setTimeout(() => el.remove(), 600);

    for (let i = enemies.length - 1; i >= 0; i--) {
        const e = enemies[i];
        // 画面内の敵すべてにヒット
        damageEnemy(e, damage);
    }
}

function triggerSatellite() {
    playSound("skill");
    const level = gameData.skills.levels.satellite;
    const beamCount = 2 + Math.floor(level / 2); 
    const damage = 30 + (level - 1) * 15;

    if (enemies.length > 0) {
        for (let i = 0; i < beamCount; i++) {
            if (enemies.length === 0) break;
            const target = enemies[Math.floor(Math.random() * enemies.length)];
            
            const el = document.createElement('div');
            el.classList.add('satellite-beam');
            el.style.left = (target.x + 30) + 'px';
            el.style.bottom = (getArenaSize().height - target.y) + 'px'; 
            
            gameArea.appendChild(el);
            setTimeout(() => el.remove(), 500);

            damageEnemy(target, damage);
        }
    }
}

function updateInvoluteBullets() {
    const expandSpeed = 5; 
    const rotationSpeed = 0.1;
    const maxRadius = 1000;

    for (let i = involuteBullets.length - 1; i >= 0; i--) {
        const b = involuteBullets[i];
        b.radius += expandSpeed;
        b.angle += rotationSpeed;
        const bx = playerX + Math.cos(b.angle) * b.radius;
        const by = playerY + Math.sin(b.angle) * b.radius;
        b.element.style.left = bx + 'px';
        b.element.style.top = by + 'px';

        if (b.radius > maxRadius) {
            b.element.remove();
            involuteBullets.splice(i, 1);
            continue;
        }

        for (let j = enemies.length - 1; j >= 0; j--) {
            const e = enemies[j];
            if (!e || !waveEventActive || isGameOver) break;
            const dx = bx - e.x;
            const dy = by - e.y;
            const dist = Math.sqrt(dx*dx + dy*dy);
            if (dist < 60) {
                damageEnemy(e, 5); 
                const hitEffect = document.createElement('div');
                hitEffect.style.position = 'absolute';
                hitEffect.style.left = e.x + 'px';
                hitEffect.style.top = e.y + 'px';
                hitEffect.style.width = '20px';
                hitEffect.style.height = '20px';
                hitEffect.style.background = '#fff';
                hitEffect.style.borderRadius = '50%';
                hitEffect.style.zIndex = '99';
                hitEffect.style.pointerEvents = 'none';
                gameArea.appendChild(hitEffect);
                setTimeout(() => hitEffect.remove(), 100);
            }
        }
    }
}

function updateBombGauge(now) {
    const button = document.getElementById('btn-touch-skill');
    const seconds = Math.max(0, Math.ceil((bombCooldown - (now - lastBombTime)) / 1000));
    button.disabled = isGameOver || !waveEventActive || seconds > 0;
    button.textContent = seconds > 0 ? 'あと ' + seconds + '秒' : 'スキル発動';
    const elapsed = now - lastBombTime;
    let percentage = (elapsed / bombCooldown) * 100;
    if (percentage > 100) percentage = 100;
    if (bombGaugeBar) {
        bombGaugeBar.style.width = `${percentage}%`;
        bombGaugeBar.style.background = percentage >= 100 ? '#ffff00' : 'linear-gradient(90deg, #00ffff, #0099ff)';
    }
}

function spawnWaveEnemies() {
    let count = 5 + Math.floor(currentWave * 3);
    if (currentWaveEvent === 'barrage') count = Math.max(3, Math.ceil(count * 0.6));
    if (count > 100) count = 100;
    enemiesRemaining = count;
    if(enemyCountText) enemyCountText.textContent = enemiesRemaining;
    
    for (let i = 0; i < count; i++) {
        const rand = Math.random();
        if (currentWave >= 2 && (i === 0 || rand < 0.15)) spawnEnemy('rusher');
        else if (rand < 0.2) spawnEnemy('golem');
        else if (rand < 0.4) spawnEnemy('shooter');
        else spawnEnemy('minion');
    }
}

function spawnEnemy(type) {
    const el = document.createElement('div');
    el.classList.add('enemy');
    
    const hpBar = document.createElement('div');
    hpBar.classList.add('mini-hp-bar');
    const hpFill = document.createElement('div');
    hpFill.classList.add('mini-hp-fill');
    hpBar.appendChild(hpFill);
    el.appendChild(hpBar);

    let ex, ey;
    if (Math.random() < 0.5) {
        ex = Math.random() < 0.5 ? -50 : getArenaSize().width + 50;
        ey = Math.random() * getArenaSize().height;
    } else {
        ex = Math.random() * getArenaSize().width;
        ey = Math.random() < 0.5 ? -50 : getArenaSize().height + 50;
    }

    let hp, speed, coinDrop, jumpOffset;
    let bossImageIndex = null;
    
    if (type === 'minion') {
        el.classList.add('enemy-minion');
        hp = 2 + Math.floor(currentWave * 1.5);
        speed = 1.5 + (currentWave * 0.1);
        coinDrop = Math.floor(Math.random() * 2); 
        jumpOffset = Math.floor(Math.random() * 60);
    } else if (type === 'shooter') {
        el.classList.add('enemy-shooter');
        hp = 3 + Math.floor(currentWave * 1.2);
        speed = 1.2;
        coinDrop = Math.floor(Math.random() * 3) + 1; 
        jumpOffset = 0;
    } else if (type === 'golem') {
        el.classList.add('enemy-golem');
        hp = 15 + (currentWave * 5);
        speed = 0.6;
        coinDrop = Math.floor(Math.random() * 4) + 1;
        jumpOffset = 0;
    } else if (type === 'rusher') {
        el.classList.add('enemy-rusher');
        hp = Math.max(1, Math.floor((2 + currentWave * 1.5) * 0.7));
        speed = 2.8 + currentWave * 0.12;
        coinDrop = 3;
        jumpOffset = 0;
    } else if (type === 'treasure') {
        el.classList.add('enemy-minion', 'enemy-treasure');
        hp = 5 + currentWave * 2;
        speed = 1.4;
        coinDrop = 30 + currentWave * 5;
        jumpOffset = 0;
        const width = gameArea.clientWidth || getArenaSize().width;
        const height = gameArea.clientHeight || getArenaSize().height;
        ex = width * 0.5;
        ey = height * 0.3;
    } else { // boss
        el.classList.add('enemy-boss');
        let imgIndex = Math.floor(Math.random() * bossImages.length);
        bossImageIndex = imgIndex;
        const info = BOSS_TYPES[imgIndex];
        el.style.backgroundImage = `url('${bossImages[imgIndex]}?v=dragons-1')`;
        hp = Math.round((50 + currentWave * 30) * info.hp);
        speed = info.speed;
        bossMaxHp = hp;
        updateBossHpBar(hp);
        coinDrop = info.reward;
        hpBar.style.display = 'none';
        jumpOffset = 0;
    }
    
    if (currentWaveEvent === 'rage') speed *= 1.3;
    el.style.left = ex + 'px';
    el.style.top = ey + 'px';
    
    if(gameArea) gameArea.appendChild(el);

    enemies.push({ 
        element: el, hpFill: hpFill,
        x: ex, y: ey, hp: hp, maxHp: hp, type: type, speed: speed, coinDrop: coinDrop,
        jumpTimer: jumpOffset,
        lastAttackTime: type === 'boss' ? Date.now() : 0,
        lastBossPattern: null,
        bossImageIndex: bossImageIndex,
        bossPhase: 1,
        phase2Type: null,
        transformingUntil: 0,
        expiresAt: type === 'treasure' ? Date.now() + 15000 : null
    });
    if (type === 'boss') updateBossIdentity(enemies[enemies.length - 1]);
}

function fireBullet(damage, count, size) {
    if (enemies.length === 0) return;
    let closest = null, minDist = Infinity;
    enemies.forEach(e => {
        const d = Math.sqrt((e.x - playerX)**2 + (e.y - playerY)**2);
        if (d < minDist) { minDist = d; closest = e; }
    });

    if (closest && minDist < 600) {
        const baseAngle = Math.atan2(closest.y - playerY, closest.x - playerX);
        for(let i=0; i<count; i++) {
            const el = document.createElement('div');
            el.classList.add('bullet');
            el.style.width = size + 'px';
            el.style.height = size + 'px';
            el.style.left = playerX + 'px';
            el.style.top = playerY + 'px';
            gameArea.appendChild(el);

            let offset = 0;
            if (count > 1) {
                const spread = 0.3; 
                offset = -spread/2 + (spread / (count-1)) * i;
            }

            const angle = baseAngle + offset;
            bullets.push({ 
                element: el, x: playerX, y: playerY, 
                vx: Math.cos(angle)*8, vy: Math.sin(angle)*8, damage: damage 
            });
        }
        playSound("shot");
    }
}

function enemyFireBullet(enemy) {
    const el = document.createElement('div');
    const speed = 30 + (currentWave * 1);
    el.classList.add('enemy-bullet');
    el.style.left = enemy.x + 'px';
    el.style.top = enemy.y + 'px';
    gameArea.appendChild(el);

    const angle = Math.atan2(playerY - enemy.y, playerX - enemy.x);
    const vx = Math.cos(angle) * 5;
    const vy = Math.sin(angle) * 5;

    enemyBullets.push({ element: el, x: enemy.x, y: enemy.y, vx: vx, vy: vy, damage: 2 });
}

function golemFireBullet(enemy) {
    const el = document.createElement('div');
    el.classList.add('enemy-bullet');
    el.style.width = '60px';
    el.style.height = '60px';
    el.style.backgroundColor = '#555';
    el.style.boxShadow = '0 0 10px #aaa';
    el.style.left = enemy.x + 'px';
    el.style.top = enemy.y + 'px';
    gameArea.appendChild(el);

    const angle = Math.atan2(playerY - enemy.y, playerX - enemy.x);
    const vx = Math.cos(angle) * 4;
    const vy = Math.sin(angle) * 4;

    enemyBullets.push({ element: el, x: enemy.x, y: enemy.y, vx: vx, vy: vy, damage: 4 });
}

// ■■■ ボスのランダム攻撃 ■■■
function getBossAttackStats(boss) {
    const info = getBossType(boss);
    return {
        speed: Math.min(6.2, 3.5 + currentWave * 0.13) * (boss?.bossPhase === 2 ? 1.15 : 1) * info.bulletSpeed,
        damage: Math.ceil(Math.min(6, 2 + Math.floor((currentWave - 1) / 4)) * info.damage)
    };
}

function isBossAlive(boss) {
    return !isGameOver && isBossPhase && enemies.includes(boss);
}

function clearBossAttackTimers() {
    bossAttackTimers.forEach(timerId => clearTimeout(timerId));
    bossAttackTimers = [];
}

function scheduleBossAttack(boss, callback, delay) {
    const phase = boss.bossPhase;
    const timerId = setTimeout(() => {
        bossAttackTimers = bossAttackTimers.filter(id => id !== timerId);
        if (isBossAlive(boss) && boss.bossPhase === phase && Date.now() >= boss.transformingUntil) callback();
    }, delay);
    bossAttackTimers.push(timerId);
}

function showBossAttackName(name) {
    if (!bossAttackName) return;
    bossAttackName.textContent = name;
    bossAttackName.classList.remove('is-changing');
    void bossAttackName.offsetWidth;
    bossAttackName.classList.add('is-changing');
}

function createBossBullet(boss, angle, speed, damage, options = {}) {
    if (!isBossAlive(boss) || Date.now() < boss.transformingUntil) return;

    const el = document.createElement('div');
    const size = options.size || 24;
    el.classList.add('boss-fire');
    if (options.className) el.classList.add(options.className);
    el.classList.add('boss-bullet-' + getBossType(boss).id);
    el.style.width = size + 'px';
    el.style.height = size + 'px';
    el.style.left = boss.x + 'px';
    el.style.top = boss.y + 'px';
    gameArea.appendChild(el);

    enemyBullets.push({
        element: el,
        x: boss.x,
        y: boss.y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        damage: damage,
        curve: options.curve || 0,
        hitRadius: size * 0.45,
        createdAt: performance.now(),
        lifetime: options.lifetime || 7000
    });
}

// 1. プレイヤー方向を中心に広げる扇状攻撃
function bossAttackFan(boss) {
    const stats = getBossAttackStats(boss);
    const baseAngle = Math.atan2(playerY - boss.y, playerX - boss.x);
    const count = Math.min(13, 7 + Math.floor(currentWave / 3));
    const spread = 1.45;

    for (let i = 0; i < count; i++) {
        const offset = count === 1 ? 0 : -spread / 2 + (spread / (count - 1)) * i;
        createBossBullet(boss, baseAngle + offset, stats.speed, stats.damage, {
            className: 'boss-fire-fan',
            size: 22
        });
    }
}

// 2. ボスを中心に360度へ放つ円形攻撃
function bossAttackCircle(boss) {
    const stats = getBossAttackStats(boss);
    const count = Math.min(24, 12 + Math.floor(currentWave / 2));
    const startAngle = Math.random() * Math.PI * 2;

    for (let i = 0; i < count; i++) {
        const angle = startAngle + (Math.PI * 2 / count) * i;
        createBossBullet(boss, angle, stats.speed * 0.78, stats.damage, {
            className: 'boss-fire-circle',
            size: 20
        });
    }
}

// 3. 時間差で角度を回しながら撃つ二重らせん攻撃
function bossAttackSpiral(boss) {
    const stats = getBossAttackStats(boss);
    const steps = Math.min(18, 10 + Math.floor(currentWave / 2));
    const stepDelay = Math.max(70, 115 - currentWave * 2);
    const startAngle = Math.random() * Math.PI * 2;

    for (let i = 0; i < steps; i++) {
        scheduleBossAttack(boss, () => {
            const angle = startAngle + i * 0.43;
            createBossBullet(boss, angle, stats.speed * 0.88, stats.damage, {
                className: 'boss-fire-spiral',
                size: 18,
                curve: 0.004
            });
            createBossBullet(boss, angle + Math.PI, stats.speed * 0.88, stats.damage, {
                className: 'boss-fire-spiral',
                size: 18,
                curve: -0.004
            });
        }, i * stepDelay);
    }
}

// 4. 発射するたびに向きが変わる回転十字攻撃
function bossAttackRotatingCross(boss) {
    const stats = getBossAttackStats(boss);
    const volleys = currentWave >= 10 ? 4 : 3;
    const startAngle = Math.random() * Math.PI * 2;

    for (let volley = 0; volley < volleys; volley++) {
        scheduleBossAttack(boss, () => {
            for (let arm = 0; arm < 4; arm++) {
                const angle = startAngle + volley * 0.24 + arm * (Math.PI / 2);
                createBossBullet(boss, angle, stats.speed * 0.95, stats.damage, {
                    className: 'boss-fire-cross',
                    size: 22
                });
            }
        }, volley * 180);
    }
}

// 5. プレイヤーの現在位置を狙い直す3方向×3連射
function bossAttackTripleAim(boss) {
    const stats = getBossAttackStats(boss);

    for (let volley = 0; volley < 3; volley++) {
        scheduleBossAttack(boss, () => {
            const baseAngle = Math.atan2(playerY - boss.y, playerX - boss.x);
            [-0.16, 0, 0.16].forEach(offset => {
                createBossBullet(boss, baseAngle + offset, stats.speed * 1.15, stats.damage, {
                    className: 'boss-fire-aim',
                    size: 19
                });
            });
        }, volley * 250);
    }
}

// 第2形態は同じボスの残りHPで戦う。大ダメージでも一度は変身する。
function beginBossSecondPhase(boss) {
    if (!isBossAlive(boss) || boss.bossPhase === 2) return;
    clearBossAttackTimers();
    enemyBullets.forEach(b => b.element.remove());
    enemyBullets = [];
    boss.bossPhase = 2;
    window.GameAudio?.scene("awakened");
    playSound("warning");
    boss.phase2Type = getBossType(boss).id;
    boss.transformingUntil = Date.now() + 1500;
    boss.lastAttackTime = boss.transformingUntil;
    boss.lastBossPattern = null;
    boss.speed *= getBossType(boss).phaseSpeed;
    // 読み込み成功時のみ切り替え、未配置なら元の姿を残す。
    const phaseImage = new Image();
    phaseImage.onload = () => {
        if (isBossAlive(boss)) boss.element.style.backgroundImage = `url('boss${boss.bossImageIndex + 1}_phase2.png?v=dragons-1')`;
    };
    phaseImage.src = `boss${boss.bossImageIndex + 1}_phase2.png?v=dragons-1`;
    boss.element.classList.add('boss-phase2', 'boss-phase2-' + boss.phase2Type, 'boss-transforming');
    if (bossHud) bossHud.classList.add('boss-hud-phase2');
    updateBossIdentity(boss);
    showBossAttackName('覚醒中…！');
}

function bossAttackDoubleCircle(boss) {
    const stats = getBossAttackStats(boss);
    const count = Math.min(24, 12 + Math.floor(currentWave / 2));
    const start = Math.random() * Math.PI * 2;
    for (let volley = 0; volley < 2; volley++) {
        scheduleBossAttack(boss, () => {
            for (let i = 0; i < count; i++) {
                createBossBullet(boss, start + (i + volley * 0.5) * Math.PI * 2 / count,
                    stats.speed * 0.78, stats.damage, { size: 18 });
            }
        }, volley * 450);
    }
}

function bossAttackAwakenedSpiral(boss) {
    const stats = getBossAttackStats(boss);
    const start = Math.random() * Math.PI * 2;
    const steps = Math.min(18, 10 + Math.floor(currentWave / 2));
    for (let i = 0; i < steps; i++) {
        scheduleBossAttack(boss, () => {
            for (let arm = 0; arm < 3; arm++) {
                createBossBullet(boss, start + i * 0.38 + arm * Math.PI * 2 / 3,
                    stats.speed * 0.85, stats.damage, { size: 16, curve: 0.003 });
            }
        }, i * 90);
    }
}

// 属性専用攻撃。時間差発射は既存のタイマー管理で中断できる。
function bossAttackFlameBreath(boss) {
    const stats = getBossAttackStats(boss);
    const angle = Math.atan2(playerY - boss.y, playerX - boss.x);
    const volleys = boss.bossPhase === 2 ? 5 : 3;
    for (let i = 0; i < volleys; i++) scheduleBossAttack(boss, () => {
        for (let j = -2; j <= 2; j++) createBossBullet(boss, angle + j * 0.15,
            stats.speed * (0.85 + i * 0.06), stats.damage, { size: 22 });
    }, i * 220);
}
function bossAttackIceLances(boss) {
    const stats = getBossAttackStats(boss);
    // 初弾の狙いを固定。弾の間に逃げ道を残す。
    const angle = Math.atan2(playerY - boss.y, playerX - boss.x);
    const volleys = boss.bossPhase === 2 ? 4 : 2;
    for (let i = 0; i < volleys; i++) scheduleBossAttack(boss, () => {
        [-0.42, 0, 0.42].forEach(offset => createBossBullet(boss, angle + offset,
            stats.speed * 1.2, stats.damage, { size: 16 }));
    }, i * 300);
}
function bossAttackVineSeeds(boss) {
    const stats = getBossAttackStats(boss);
    const count = boss.bossPhase === 2 ? 16 : 12;
    const angle = Math.random() * Math.PI * 2;
    const rounds = boss.bossPhase === 2 ? 2 : 1;
    for (let round = 0; round < rounds; round++) scheduleBossAttack(boss, () => {
        for (let i = 0; i < count; i++) createBossBullet(boss,
            angle + (i + round * 0.5) * Math.PI * 2 / count,
            stats.speed, stats.damage, { size: 18, curve: (i % 2 ? 1 : -1) * 0.008, lifetime: 5500 });
    }, round * 550);
}
function getBossPatterns(boss) {
    const phase2 = boss.bossPhase === 2;
    const circle = phase2 ? bossAttackDoubleCircle : bossAttackCircle;
    const spiral = phase2 ? bossAttackAwakenedSpiral : bossAttackSpiral;
    const pools = {
        fire: [
            ['breath', '連続火炎ブレス', bossAttackFlameBreath], ['fan', '爆炎扇状弾', bossAttackFan],
            ['circle', '火炎リング', circle], ['aim', '火炎3連射', bossAttackTripleAim], ['cross', '回転火炎弾', bossAttackRotatingCross]
        ],
        ice: [
            ['lances', '氷槍連射', bossAttackIceLances], ['cross', '回転氷晶', bossAttackRotatingCross],
            ['circle', '氷のリング', circle], ['fan', '氷片拡散', bossAttackFan], ['aim', '追撃氷弾', bossAttackTripleAim]
        ],
        forest: [
            ['seeds', '蔓の種子弾', bossAttackVineSeeds], ['circle', '種子リング', circle],
            ['fan', '葉刃拡散', bossAttackFan], ['spiral', '蔓のらせん', spiral], ['cross', '回転葉刃', bossAttackRotatingCross]
        ],
        dark: [
            ['spiral', '闇のらせん', spiral], ['aim', '影の追撃', bossAttackTripleAim],
            ['cross', '回転暗黒弾', bossAttackRotatingCross], ['circle', '暗黒リング', circle], ['fan', '闇刃拡散', bossAttackFan]
        ]
    };
    return pools[getBossType(boss).id].slice(0, currentWave >= 3 ? 5 : 4)
        .map(([id, name, run]) => ({ id, name: (phase2 ? '覚醒・' : '') + name, run }));
}
function bossFireAttack(boss) {
    if (!isBossAlive(boss) || Date.now() < boss.transformingUntil) return;
    const patterns = getBossPatterns(boss).filter(pattern => pattern.id !== boss.lastBossPattern);
    const selected = patterns[Math.floor(Math.random() * patterns.length)];
    boss.lastBossPattern = selected.id;
    showBossAttackName(selected.name);
    // 一発ごとではなく攻撃パターンの開始時に鳴らす。
    playSound('boss_' + selected.id, 0.65);
    if (boss.bossPhase === 2) playSound('boss_power', 0.3);
    selected.run(boss);
}

function updateBullets() {
    for (let i = bullets.length - 1; i >= 0; i--) {
        const b = bullets[i];
        b.x += b.vx; b.y += b.vy;
        b.element.style.left = b.x + 'px';
        b.element.style.top = b.y + 'px';

        if (b.x<0 || b.x>getArenaSize().width || b.y<0 || b.y>getArenaSize().height) {
            b.element.remove(); bullets.splice(i, 1); continue;
        }

        for (let j = enemies.length - 1; j >= 0; j--) {
            const e = enemies[j];
            const dist = Math.sqrt((b.x - e.x)**2 + (b.y - e.y)**2);
            let hitR = 30;
            if (e.type === 'boss') hitR = 70;
            if (e.type === 'golem') hitR = 40;

            if (dist < hitR) {
                damageEnemy(e, b.damage);
                b.element.remove(); bullets.splice(i, 1);
                break;
            }
        }
    }
}

function updateEnemyBullets() {
    const now = performance.now();
    for (let i = enemyBullets.length - 1; i >= 0; i--) {
        if (!waveEventActive || isGameOver) break;
        const b = enemyBullets[i];

        // curveが設定されたボス弾は、毎フレーム進行方向を少し回転させる
        if (b.curve) {
            const cos = Math.cos(b.curve);
            const sin = Math.sin(b.curve);
            const nextVx = b.vx * cos - b.vy * sin;
            const nextVy = b.vx * sin + b.vy * cos;
            b.vx = nextVx;
            b.vy = nextVy;
        }

        b.x += b.vx;
        b.y += b.vy;
        b.element.style.left = b.x + 'px';
        b.element.style.top = b.y + 'px';

        const expired = b.createdAt && now - b.createdAt > b.lifetime;
        if (expired || b.x < -80 || b.x > getArenaSize().width + 80 || b.y < -80 || b.y > getArenaSize().height + 80) {
            b.element.remove();
            enemyBullets.splice(i, 1);
            continue;
        }

        const dist = Math.sqrt((b.x - playerX)**2 + (b.y - playerY)**2);
        let bulletRadius = b.hitRadius || 20;
        if (!b.hitRadius && b.element.style.width === '60px') bulletRadius = 40;

        if (dist < bulletRadius) {
            takePlayerDamage(b.damage); 
            b.element.remove();
            enemyBullets.splice(i, 1);
        }
    }
}

function updateEnemies() {
    const now = Date.now();
    for (let i = enemies.length - 1; i >= 0; i--) {
        const e = enemies[i];
        if (!waveEventActive || isGameOver) break;
        if (e.type === 'treasure') {
            const angle = Math.atan2(e.y - playerY, e.x - playerX);
            const width = gameArea.clientWidth || getArenaSize().width;
            const height = gameArea.clientHeight || getArenaSize().height;
            e.x = Math.max(35, Math.min(width - 35, e.x + Math.cos(angle) * e.speed));
            e.y = Math.max(35, Math.min(height - 35, e.y + Math.sin(angle) * e.speed));
            e.element.style.left = e.x + 'px';
            e.element.style.top = e.y + 'px';
            continue;
        }
        
        let moveSpeed = e.speed;

        if (e.type === 'minion') {
            e.jumpTimer++;
            const cycle = e.jumpTimer % 60;
            if (cycle > 40) {
                moveSpeed = e.speed * 3.0; 
                e.element.style.transform = 'translate(-50%, -50%) scale(1.2)';
            } else {
                moveSpeed = 0;
                e.element.style.transform = 'translate(-50%, -50%) scale(0.9, 0.8)';
            }
        } 
        else if (e.type === 'shooter') {
            const dist = Math.sqrt((playerX - e.x)**2 + (playerY - e.y)**2);
            if (dist < 300) moveSpeed = 0;

            if (now - e.lastAttackTime > 2000) {
                enemyFireBullet(e);
                e.lastAttackTime = now;
            }
            e.element.style.transform = 'translate(-50%, -50%)';
        } 
        else if (e.type === 'golem') {
            const dist = Math.sqrt((playerX - e.x)**2 + (playerY - e.y)**2);
            if (dist < 400 && now - e.lastAttackTime > 3000) {
                golemFireBullet(e);
                e.lastAttackTime = now;
            }
            e.element.style.transform = 'translate(-50%, -50%)';
        }
        else if (e.type === 'rusher') {
            e.element.style.transform = 'translate(-50%, -50%)';
        }
        else { // boss
            if (now < e.transformingUntil) continue;
            e.element.classList.remove('boss-transforming');
            const bossAttackInterval = Math.max(2200, 3200 - currentWave * 50) * (e.bossPhase === 2 ? 0.8 : 1) * getBossType(e).interval;
            if (now - e.lastAttackTime > bossAttackInterval) {
                bossFireAttack(e);
                e.lastAttackTime = now;
            }
            e.element.style.transform = 'translate(-50%, -50%)';
        }

        const angle = Math.atan2(playerY - e.y, playerX - e.x);
        e.x += Math.cos(angle) * moveSpeed;
        e.y += Math.sin(angle) * moveSpeed;
        
        e.element.style.left = e.x + 'px';
        e.element.style.top = e.y + 'px';

        if (Math.sqrt((playerX - e.x)**2 + (playerY - e.y)**2) < (e.type === 'boss' ? 80 : 40)) {
            if (now - lastDamageTime > 1000) {
                takePlayerDamage((1 + Math.floor(currentWave/3)) * (e.type === 'rusher' ? 2 : 1)); 
                lastDamageTime = now;
            }
        }
    }
}

function takePlayerDamage(dmg) {
    if (isGameOver || !waveEventActive) return;
    if (currentWaveEvent === 'rage') dmg = Math.ceil(dmg * 1.5);
    playerCurrentHp -= dmg;
    updateHpDisplay();
    playSound("hurt");
    
    gameArea.classList.remove('screen-shake');
    void gameArea.offsetWidth;
    gameArea.classList.add('screen-shake');

    if (playerCurrentHp <= 0) {
        gameOver("体力ゼロ");
    }
}

function updateHpDisplay() {
    if(hpDisplay) hpDisplay.textContent = `${playerCurrentHp}/${playerMaxHp}`;
}

function damageEnemy(e, dmg) {
    if (!waveEventActive || isGameOver || !enemies.includes(e)) return;
    if (e.type === 'boss' && Date.now() < e.transformingUntil) return;
    e.hp -= dmg;
    if (e.type === 'boss' && e.bossPhase === 1 && e.hp <= e.maxHp * 0.5) {
        e.hp = e.maxHp * 0.5;
        beginBossSecondPhase(e);
    }
    showDamageText(e.x, e.y, dmg);
    playSound("hit");
    
    if (e.hpFill) {
        let p = (e.hp / e.maxHp) * 100;
        if(p < 0) p = 0;
        e.hpFill.style.width = `${p}%`;
    }

    if (e.type === 'boss') updateBossHpBar(e.hp);
    if (e.hp <= 0) killEnemy(e);
}

function killEnemy(e) {
    if (!enemies.includes(e)) return;
    playSound("coin");
    const reward = e.coinDrop * (WAVE_EVENTS[currentWaveEvent]?.coins || 1);
    
    sessionCoins += reward;
    if(gameCoinsDisplay) gameCoinsDisplay.textContent = sessionCoins;
    
    gameData.coins += reward;
    saveData();

    if (reward > 0) showCoinText(e.x, e.y, reward);

    if (e.type === 'boss' || Math.random() < 0.1) {
        spawnHeart(e.x, e.y);
    }

    e.element.remove();
    const idx = enemies.indexOf(e);
    if (idx > -1) enemies.splice(idx, 1);

    if (e.type === 'treasure') {
        document.getElementById('wave-event-hud').textContent = '宝物スライム撃破！ +' + reward + 'G';
        return;
    }
    if (e.type === 'boss') {
        waveClear();
    } else {
        enemiesRemaining--;
        if(enemyCountText) enemyCountText.textContent = enemiesRemaining;
        if (enemiesRemaining <= 0 && !isBossPhase) spawnBoss();
    }
}

function spawnHeart(x, y) {
    const el = document.createElement('div');
    el.classList.add('heart-item');
    el.style.left = x + 'px';
    el.style.top = y + 'px';
    gameArea.appendChild(el);
    hearts.push({ element: el, x: x, y: y });
}

function updateHearts() {
    for (let i = hearts.length - 1; i >= 0; i--) {
        const h = hearts[i];
        const dist = Math.sqrt((playerX - h.x)**2 + (playerY - h.y)**2);
        if (dist < 40) {
            playerCurrentHp = Math.min(playerCurrentHp + 3, playerMaxHp);
            updateHpDisplay();
            playSound("heal");
            showDamageText(playerX, playerY - 30, "♥");
            
            h.element.remove();
            hearts.splice(i, 1);
        }
    }
}

function spawnBoss() {
    window.GameAudio?.scene("boss");
    isBossPhase = true;
    if (bossHud) {
        bossHud.classList.remove('boss-hud-phase2');
        bossHud.querySelector('.boss-name').textContent = 'WARNING: GIANT BOSS';
    }
    if(bossHud) bossHud.classList.remove('hidden');
    if(bossAttackName) bossAttackName.textContent = '攻撃準備中...';
    playSound("warning");
    spawnEnemy('boss');
    if(enemyCountText) enemyCountText.textContent = "BOSS";
}

function waveClear() {
    if (rewardPending || currentWave <= lastRewardWave) return;
    stopWaveEvent();
    isGameOver = true;
    clearBossAttackTimers();
    if (gameMode === 'normal' && currentWave >= 20) {
        gameClear();
        return;
    }

    window.GameAudio?.scene("menu");
    playSound("clear");
    clearInterval(windowTimerInterval);
    cancelAnimationFrame(animationFrameId);
    openWaveReward();
}

function gameClear() {
    window.GameAudio?.scene("menu");
    stopWaveEvent();
    isGameOver = true;
    gameData.endlessUnlocked = true;
    saveData();
    saveWaveResult(20);
    clearBossAttackTimers();
    playSound("victory");
    clearInterval(windowTimerInterval);
    cancelAnimationFrame(animationFrameId);
    document.body.style.cursor = 'default';
    
    if(gameClearScreen) {
        gameClearScreen.classList.remove('hidden');
        if(clearCoins) clearCoins.textContent = sessionCoins;
        clearTimeout(clearReturnTimer);
        clearReturnTimer = setTimeout(returnFromClear, 4000);
    } else {
        alert("GAME CLEAR!! CONGRATULATIONS!!");
        location.reload();
    }
}

function gameOver(reason) {
    window.GameAudio?.scene("silent");
    playSound("over");
    stopWaveEvent();
    isGameOver = true;
    saveWaveResult(currentWave);
    clearBossAttackTimers();
    clearInterval(windowTimerInterval);
    cancelAnimationFrame(animationFrameId);
    document.body.style.cursor = 'default';

    if(gameOverScreen) {
        gameOverScreen.classList.remove('hidden');
        if(resultWave) resultWave.textContent = currentWave;
        if(resultCoins) resultCoins.textContent = sessionCoins;
    } else {
        alert(`GAME OVER\nREASON: ${reason}`);
        location.reload();
    }
}

function showDamageText(x, y, txt) {
    const el = document.createElement('div');
    el.classList.add('damage-text');
    el.textContent = txt;
    el.style.left = x + 'px'; el.style.top = y + 'px';
    gameArea.appendChild(el);
    setTimeout(() => el.remove(), 800);
}

function showCoinText(x, y, txt) {
    const el = document.createElement('div');
    el.classList.add('damage-text');
    el.style.color = '#ffd700'; el.textContent = `+${txt}G`;
    el.style.left = x + 'px'; el.style.top = (y-20) + 'px'; el.style.zIndex = 101;
    gameArea.appendChild(el);
    setTimeout(() => el.remove(), 800);
}

function updateBossHpBar(hp) {
    if(!bossHpBar) return;
    let p = (hp / bossMaxHp) * 100;
    if(p < 0) p = 0;
    bossHpBar.style.width = `${p}%`;
}



/* Original synthesized soundtrack. No external audio files or network required. */
(() => {
    'use strict';
    const KEY = 'jorinbo-audio-v1';
    let settings = { muted: false, music: 25, effects: 40 };
    try {
        const saved = JSON.parse(localStorage.getItem(KEY) || '{}');
        for (const key of ['music', 'effects']) if (Number.isFinite(saved[key])) settings[key] = Math.max(0, Math.min(100, saved[key]));
        if (typeof saved.muted === 'boolean') settings.muted = saved.muted;
    } catch (_) {}
    let ctx, musicGain, effectsGain, master, timer, next = 0, step = 0, mode = 'menu';
    const voices = new Set(), cooldown = new Map();
    let primed = false, audioChoiceMade = false;
    function audioStatus() {
        const el = document.getElementById('audio-status');
        const supported = !!(window.AudioContext || window.webkitAudioContext);
        const blocked = !ctx || ctx.state !== 'running';
        if (el) el.textContent = !supported ? 'このブラウザでは音声を利用できません。' : settings.muted ? 'ミュート中' : settings.music === 0 && settings.effects === 0 ? '音量が0です。スライダーで調整してください。' : blocked ? '音声が停止中です。再開ボタンをタップしてください。' : mode === 'silent' ? '一時停止・待機中' : '音声の再生準備ができています。';
        const recovery = document.getElementById('audio-recovery');
        if (recovery) recovery.classList.toggle('hidden', !supported || !audioChoiceMade || settings.muted || document.hidden || mode === 'silent' || !blocked);
    }
    const tracks = {
        menu: { bpm: 90, roots: [48, 53, 55, 50], melody: [0,7,12,7,3,7,10,7], type: 'sine' },
        battle: { bpm: 128, roots: [45, 41, 48, 43], melody: [12,7,10,7,15,12,10,7], type: 'triangle' },
        boss: { bpm: 146, roots: [38, 39, 41, 37], melody: [12,13,7,10,12,7,15,13], type: 'sawtooth' },
        awakened: { bpm: 168, roots: [38, 41, 39, 37], melody: [12,19,13,24,15,19,10,13], type: 'sawtooth' }
    };
    function volumes() {
        if (!ctx) return;
        master.gain.setTargetAtTime(settings.muted ? 0 : 0.6, ctx.currentTime, 0.025);
        musicGain.gain.setTargetAtTime(settings.music / 100, ctx.currentTime, 0.025);
        effectsGain.gain.setTargetAtTime(settings.effects / 100, ctx.currentTime, 0.025);
    }
    function tone(freq, duration, type, level, bus, when, endFreq) {
        if (!ctx || voices.size >= 48) return;
        const o = ctx.createOscillator(), g = ctx.createGain();
        o.type = type; o.frequency.setValueAtTime(freq, when);
        if (endFreq) o.frequency.exponentialRampToValueAtTime(endFreq, when + duration);
        g.gain.setValueAtTime(0, when);
        g.gain.linearRampToValueAtTime(level, when + 0.008);
        g.gain.exponentialRampToValueAtTime(0.0001, when + duration);
        o.connect(g); g.connect(bus); voices.add(o);
        o.onended = () => { voices.delete(o); o.disconnect(); g.disconnect(); };
        o.start(when); o.stop(when + duration + 0.015);
    }
    const frequency = note => 440 * Math.pow(2, (note - 69) / 12);
    function tick() {
        if (!ctx || ctx.state !== 'running' || document.hidden || settings.muted || mode === 'silent') return;
        const t = tracks[mode];
        if (next < ctx.currentTime) next = ctx.currentTime + 0.02;
        while (next < ctx.currentTime + 0.12) {
            const root = t.roots[Math.floor(step / 16) % 4], pos = step % 8;
            tone(frequency(root + t.melody[pos]), 0.17, t.type, mode === 'menu' ? 0.15 : 0.075, musicGain, next);
            if (step % 4 === 0) tone(frequency(root - 12), 0.32, 'triangle', 0.23, musicGain, next);
            if (mode !== 'menu') {
                if (step % 4 === 0) tone(120, 0.12, 'sine', 0.35, musicGain, next, 38);
                if (step % 4 === 2) tone(185, 0.055, 'triangle', 0.16, musicGain, next, 70);
                tone(4200, 0.018, 'square', 0.009, musicGain, next, 1600);
            }
            next += 60 / t.bpm / 2; step++;
        }
    }
    function stopVoices() {
        for (const o of voices) { try { o.stop(); o.disconnect(); } catch (_) {} }
        // 中断中はonendedが届かない場合もあるので、発音枠を確実に解放する。
        voices.clear();
    }
    async function unlock() {
        if (document.hidden || !audioChoiceMade || settings.muted) { audioStatus(); return; }
        try {
            if (!ctx || ctx.state === 'closed') {
                stopVoices();
                if (timer !== undefined) clearInterval(timer);
                cooldown.clear(); primed = false; next = 0;
                const Audio = window.AudioContext || window.webkitAudioContext;
                if (!Audio) return;
                ctx = new Audio(); master = ctx.createGain();
                musicGain = ctx.createGain(); effectsGain = ctx.createGain();
                const limiter = ctx.createDynamicsCompressor();
                musicGain.connect(master); effectsGain.connect(master); master.connect(limiter); limiter.connect(ctx.destination);
                volumes(); timer = setInterval(tick, 50);
                const created = ctx;
                ctx.onstatechange = () => {
                    if (ctx !== created) return;
                    if (ctx.state === 'running') { next = ctx.currentTime + 0.02; tick(); }
                    audioStatus();
                };
            }
            // タップ処理中に無音バッファを開始し、音声出力を準備する。
            if (!primed || ctx.state !== 'running') {
                if (ctx.createBuffer && ctx.createBufferSource) {
                    const source = ctx.createBufferSource();
                    source.buffer = ctx.createBuffer(1, 1, ctx.sampleRate || 44100);
                    source.connect(ctx.destination);
                    source.onended = () => source.disconnect();
                    source.start(0);
                }
                primed = true;
            }
            // iOSの画面復帰ではsuspended以外にinterruptedになる場合がある。
            audioStatus();
            if (ctx.state !== 'running' && ctx.state !== 'closed') await ctx.resume();
            tick();
        } catch (_) { /* 次のタップでもう一度試せる。 */ }
        audioStatus();
    }
    function scene(value) {
        if (!tracks[value] && value !== 'silent') return;
        if (ctx && ctx.state !== 'running' && !document.hidden) void unlock();
        if (mode === value) { tick(); audioStatus(); return; }
        mode = value; step = 0; next = ctx ? ctx.currentTime + 0.03 : 0;
        stopVoices(); tick(); audioStatus();
    }
    function effect(name, volume = 0.5) {
        if (!audioChoiceMade || !ctx || ctx.state !== 'running' || settings.muted || document.hidden) return;
        const now = ctx.currentTime;
        const limit = { shot: 0.10, hit: 0.09, coin: 0.10, hurt: 0.16 }[name] || 0.05;
        if (now - (cooldown.get(name) ?? -10) < limit) return;
        cooldown.set(name, now);
        const patterns = {
            gacha_promote: [[330,.18,'triangle',0,660],[660,.22,'sine',.12,1320],[990,.25,'sine',.22]],
            gacha_charge: [[165,.35,'sine',0,330],[247,.35,'triangle',.13,494],[330,.3,'sine',.28,660]],
            gacha_open: [[523,.16,'triangle',0],[659,.2,'triangle',.10],[784,.35,'sine',.2]],
            gacha_rare: [[523,.18,'triangle',0],[784,.22,'sine',.12],[1047,.45,'triangle',.25],[1319,.4,'sine',.35]],
            gacha_legend: [[392,.2,'triangle',0],[523,.2,'triangle',.12],[659,.2,'triangle',.24],[784,.25,'triangle',.36],[1047,.6,'sine',.5],[1319,.6,'sine',.5]],
            boss_fan: [[260,0.20,'sawtooth',0,85],[390,0.16,'triangle',0.035,130]],
            boss_circle: [[220,0.38,'sine',0,880],[330,0.34,'triangle',0.06,990]],
            boss_spiral: [[180,0.18,'triangle',0,600],[240,0.18,'triangle',0.10,800],[320,0.22,'triangle',0.20,1100]],
            boss_cross: [[310,0.13,'square',0,155],[415,0.13,'square',0.13,208],[520,0.18,'triangle',0.26,260]],
            boss_aim: [[700,0.09,'triangle',0,160],[700,0.09,'triangle',0.16,160],[880,0.12,'triangle',0.32,180]],
            boss_breath: [[90,0.42,'sawtooth',0,45],[135,0.32,'sawtooth',0.12,55]],
            boss_lances: [[1400,0.20,'sine',0,700],[1900,0.18,'sine',0.12,950],[2300,0.18,'triangle',0.24,1150]],
            boss_seeds: [[180,0.16,'triangle',0,95],[240,0.16,'triangle',0.13,110],[160,0.25,'triangle',0.26,65]],
            boss_power: [[55,0.42,'sine',0,35]],
            shot: [[760, 0.055, 'triangle', 0, 250]], hit: [[170, 0.035, 'triangle', 0, 80]],
            hurt: [[150, 0.20, 'sawtooth', 0, 45]], coin: [[1100, 0.07, 'sine', 0], [1500, 0.1, 'sine', 0.055]],
            heal: [[523,0.15,'sine',0],[659,0.15,'sine',0.09],[784,0.24,'sine',0.18]],
            warning: [[110,0.45,'sawtooth',0,220],[110,0.45,'sawtooth',0.5,330]],
            skill: [[110,0.5,'sawtooth',0,880],[880,0.4,'triangle',0.18,110]],
            clear: [[523,0.18,'triangle',0],[659,0.18,'triangle',0.12],[784,0.18,'triangle',0.24],[1047,0.5,'triangle',0.36]],
            victory: [[523,0.2,'triangle',0],[659,0.2,'triangle',0.15],[784,0.2,'triangle',0.3],[1047,0.65,'triangle',0.5],[1319,0.65,'sine',0.5]],
            over: [[392,0.3,'triangle',0],[330,0.3,'triangle',0.25],[262,0.6,'triangle',0.5]],
            start: [[330,0.12,'triangle',0],[660,0.25,'triangle',0.1]],
            confirm: [[660,0.1,'sine',0],[880,0.12,'sine',0.06]]
        };
        for (const [f,d,type,delay,end] of patterns[name] || patterns.confirm)
            tone(f,d,type,Math.min(1, Math.max(0, volume)) * (name === 'shot' || name === 'hit' ? 0.10 : 0.24),effectsGain,now+delay,end);
    }
    window.GameAudio = { scene, effect, unlock };
    // タッチ開始だけでなく、タップ完了時にもユーザー操作の中で再開を試す。
    // キャプチャで受け、子要素のstopPropagationの影響を受けない。
    for (const type of ['pointerdown', 'pointerup', 'touchend', 'click', 'keydown']) {
        document.addEventListener(type, unlock, { capture: true, passive: true });
    }
    function suspendForBackground() {
        stopVoices();
        if (!ctx || ctx.state === 'closed') return;
        const backgroundContext = ctx;
        backgroundContext.suspend().then(() => {
            // suspend完了より先にページへ戻った場合も復帰させる。
            if (!document.hidden && ctx === backgroundContext) void unlock();
        }).catch(() => {});
    }
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) suspendForBackground();
        else if (ctx) void unlock();
    });
    window.addEventListener('pagehide', suspendForBackground);
    window.addEventListener('pageshow', () => { if (ctx) void unlock(); });
    const panel = document.createElement('details');
    panel.id = 'audio-settings';
    panel.innerHTML = '<summary aria-label="音量設定">♫ 音量</summary><div class="audio-options"><label><input id="audio-muted" type="checkbox"> ミュート</label><label>BGM <input id="audio-music" type="range" min="0" max="100" aria-label="BGM音量"></label><label>効果音 <input id="audio-effects" type="range" min="0" max="100" aria-label="効果音音量"></label><small id="audio-status" role="status">音声を準備しています</small><button id="audio-resume" type="button">音声を開始・再開</button><small>音が出ないときは上のボタンをタップ</small></div>';
    document.body.appendChild(panel);
    for (const key of ['muted', 'music', 'effects']) {
        const input = document.getElementById('audio-' + key);
        if (key === 'muted') input.checked = settings[key]; else input.value = settings[key];
        input.addEventListener('input', () => {
            settings[key] = key === 'muted' ? input.checked : Number(input.value);
            void unlock(); volumes(); if (settings.muted) stopVoices(); audioStatus();
            try { localStorage.setItem(KEY, JSON.stringify(settings)); } catch (_) {}
        });
    }
    async function restartAudio() {
        // 状態がrunningでも出力が復帰しない端末向けに、手動操作で音声を作り直す。
        const previous = ctx;
        stopVoices();
        if (timer !== undefined) clearInterval(timer);
        timer = undefined; ctx = undefined; primed = false;
        if (previous && previous.state !== 'closed') previous.close?.().catch(() => {});
        await unlock();
        effect('confirm');
    }
    document.getElementById('audio-resume').addEventListener('click', restartAudio);
    const prompt = document.createElement('div');
    prompt.className = 'audio-start-modal';
    prompt.setAttribute('role', 'dialog');
    prompt.setAttribute('aria-modal', 'true');
    prompt.setAttribute('aria-labelledby', 'audio-choice-title');
    prompt.innerHTML = '<div class="audio-start-card"><h2 id="audio-choice-title">音をつけて遊ぶ？</h2><p>あとから「♫ 音量」で変更できます。</p><button id="audio-start-on" type="button">音ありで開始</button><button id="audio-start-off" type="button">音なしで開始</button><p>音が聞こえない場合は本体の音量・消音設定・Bluetoothの接続先も確認してね。</p></div>';
    document.body.appendChild(prompt);
    const recovery = document.createElement('button');
    recovery.id = 'audio-recovery'; recovery.type = 'button'; recovery.className = 'hidden';
    recovery.textContent = '音声が停止中です · タップして再開';
    document.body.appendChild(recovery);
    recovery.addEventListener('click', restartAudio);
    function chooseAudio(enabled) {
        audioChoiceMade = true;
        settings.muted = !enabled;
        if (enabled && settings.music === 0 && settings.effects === 0) { settings.music = 25; settings.effects = 40; }
        document.getElementById('audio-muted').checked = settings.muted;
        document.getElementById('audio-music').value = settings.music;
        document.getElementById('audio-effects').value = settings.effects;
        try { localStorage.setItem(KEY, JSON.stringify(settings)); } catch (_) {}
        prompt.remove();
        // ユーザーのタップ処理の中で直接開始する。
        if (enabled) void unlock();
        else { volumes(); stopVoices(); }
        audioStatus();
    }
    document.getElementById('audio-start-on').addEventListener('click', () => chooseAudio(true));
    document.getElementById('audio-start-off').addEventListener('click', () => chooseAudio(false));
    audioStatus();
    panel.addEventListener('pointerdown', e => e.stopPropagation());
    panel.addEventListener('pointerdown', unlock);
    panel.addEventListener('keydown', e => e.stopPropagation());
    panel.addEventListener('keydown', unlock);
})();

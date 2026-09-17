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
        for (const o of voices) { try { o.stop(); } catch (_) {} }
    }
    async function unlock() {
        try {
            if (!ctx) {
                const Audio = window.AudioContext || window.webkitAudioContext;
                if (!Audio) return;
                ctx = new Audio(); master = ctx.createGain();
                musicGain = ctx.createGain(); effectsGain = ctx.createGain();
                const limiter = ctx.createDynamicsCompressor();
                musicGain.connect(master); effectsGain.connect(master); master.connect(limiter); limiter.connect(ctx.destination);
                volumes(); timer = setInterval(tick, 50);
            }
            if (ctx.state === 'suspended') await ctx.resume();
            tick();
        } catch (_) { /* Audio unavailable: gameplay remains usable. */ }
    }
    function scene(value) {
        if (mode === value || (!tracks[value] && value !== 'silent')) return;
        mode = value; step = 0; next = ctx ? ctx.currentTime + 0.03 : 0;
        stopVoices(); tick();
    }
    function effect(name, volume = 0.5) {
        if (!ctx || ctx.state !== 'running' || settings.muted || document.hidden) return;
        const now = ctx.currentTime;
        const limit = { shot: 0.10, hit: 0.09, coin: 0.10, hurt: 0.16 }[name] || 0.05;
        if (now - (cooldown.get(name) ?? -10) < limit) return;
        cooldown.set(name, now);
        const patterns = {
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
    window.GameAudio = { scene, effect };
    document.addEventListener('pointerdown', unlock, { passive: true });
    document.addEventListener('keydown', unlock);
    document.addEventListener('visibilitychange', () => {
        if (!ctx) return;
        if (document.hidden) { stopVoices(); ctx.suspend().catch(() => {}); }
        else unlock();
    });
    window.addEventListener('pagehide', () => { stopVoices(); if (ctx) ctx.suspend().catch(() => {}); });
    window.addEventListener('pageshow', () => { if (ctx) unlock(); });
    const panel = document.createElement('details');
    panel.id = 'audio-settings';
    panel.innerHTML = '<summary aria-label="音量設定">♫ 音量</summary><div class="audio-options"><label><input id="audio-muted" type="checkbox"> ミュート</label><label>BGM <input id="audio-music" type="range" min="0" max="100" aria-label="BGM音量"></label><label>効果音 <input id="audio-effects" type="range" min="0" max="100" aria-label="効果音音量"></label><small>最初のクリック・タップで音が出ます</small></div>';
    document.body.appendChild(panel);
    for (const key of ['muted', 'music', 'effects']) {
        const input = document.getElementById('audio-' + key);
        if (key === 'muted') input.checked = settings[key]; else input.value = settings[key];
        input.addEventListener('input', () => {
            settings[key] = key === 'muted' ? input.checked : Number(input.value);
            volumes(); if (settings.muted) stopVoices();
            try { localStorage.setItem(KEY, JSON.stringify(settings)); } catch (_) {}
        });
    }
    panel.addEventListener('pointerdown', e => e.stopPropagation());
    panel.addEventListener('pointerdown', unlock);
    panel.addEventListener('keydown', e => e.stopPropagation());
    panel.addEventListener('keydown', unlock);
})();

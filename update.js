/* Manual update: keep authentication and saved data; never clear browser storage. */
(() => {
    'use strict';
    const buttons = [...document.querySelectorAll('[data-update-game]')];
    const dialog = document.getElementById('update-game-dialog');
    const status = document.getElementById('update-game-status');
    const close = document.getElementById('update-game-close');
    let busy = false;
    dialog.addEventListener('cancel', event => { if (busy) event.preventDefault(); });
    close.addEventListener('click', () => dialog.close());
    async function updateGame() {
        if (busy) return;
        if (!/^https?:$/.test(location.protocol)) {
            status.textContent = '公開したゲームのURL、またはVS Codeのローカルサーバーから開いてください。PC内のファイルは自動更新できません。';
            dialog.showModal();
            return;
        }
        busy = true;
        buttons.forEach(button => { button.disabled = true; });
        close.disabled = true;
        dialog.showModal();
        let navigating = false;
        try {
            status.textContent = 'セーブデータを確認しています…';
            if (typeof prepareGameUpdate !== 'function') throw new Error('ゲームの読み込みが終わってから、もう一度試してください。');
            await prepareGameUpdate();
            status.textContent = '公開されている最新版を確認しています…';
            const target = new URL(location.href);
            target.searchParams.set('_game_update', Date.now().toString(36) + Math.random().toString(36).slice(2, 8));
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 15000);
            let html;
            try {
                const response = await fetch(target.href, { cache: 'no-store', signal: controller.signal });
                if (!response.ok) throw new Error('更新ページを取得できませんでした（HTTP ' + response.status + '）。');
                html = await response.text();
            } finally { clearTimeout(timeout); }
            const page = new DOMParser().parseFromString(html, 'text/html');
            if (!page.querySelector('meta[name="app-version"]') || !page.getElementById('auth-screen')) {
                throw new Error('ゲームの更新ページを確認できませんでした。公開処理が終わってから試してください。');
            }
            status.textContent = '最新の画面を読み込みます…';
            location.replace(target.href);
            navigating = true;
        } catch (error) {
            status.textContent = error.name === 'AbortError'
                ? '通信がタイムアウトしました。通信状態を確認して、もう一度試してください。データは削除していません。'
                : '更新できませんでした。' + (error.message || '通信状態を確認してください。') + '\nデータは削除していません。';
        } finally {
            if (!navigating) {
                busy = false;
                buttons.forEach(button => { button.disabled = false; });
                close.disabled = false;
            }
        }
    }
    buttons.forEach(button => button.addEventListener('click', updateGame));
    if (new URL(location.href).searchParams.has('_game_update')) {
        const version = document.querySelector('meta[name="app-version"]')?.content || '';
        document.querySelectorAll('[data-update-status]').forEach(el => {
            el.textContent = '更新読み込み完了：Ver.' + version;
        });
        // Keep the token in the URL: ordinary reloads keep using the same fresh assets.
    }
})();

/* Installation only: game data and network requests are not cached here. */
(() => {
    'use strict';
    let pendingPrompt = null;
    let installedThisSession = false;
    const buttons = [...document.querySelectorAll('.install-game-button')];
    const guide = document.getElementById('install-guide');
    const message = document.getElementById('install-guide-text');
    const standalone = window.matchMedia('(display-mode: standalone)');
    function refresh() {
        const installed = installedThisSession || standalone.matches || navigator.standalone === true;
        buttons.forEach(button => { button.hidden = installed; });
    }
    function showGuide() {
        const ios = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
        message.textContent = location.protocol === 'file:'
            ? 'GitHub Pagesで公開したゲームのURLをスマホのSafariまたはChromeで開いてください。PC内のファイルからは追加できません。'
            : ios
                ? 'Safariでこのゲームを開き、共有メニュー →「ホーム画面に追加」→「追加」を選んでください。「Webアプリとして開く」がある場合はオンにします。チャット内のブラウザではSafariで開き直してください。'
                : 'Chromeなどのブラウザのメニューから「ホーム画面に追加」または「アプリをインストール」を選んでください。チャット内のブラウザではChromeなどで開き直してください。項目がない場合は対応ブラウザで試してください。';
        if (!guide.open) guide.showModal();
    }
    window.addEventListener('beforeinstallprompt', event => {
        event.preventDefault(); pendingPrompt = event; refresh();
    });
    window.addEventListener('appinstalled', () => {
        pendingPrompt = null; installedThisSession = true; refresh();
        if (guide.open) guide.close();
    });
    standalone.addEventListener?.('change', refresh);
    buttons.forEach(button => button.addEventListener('click', async () => {
        if (!pendingPrompt) { showGuide(); return; }
        const prompt = pendingPrompt;
        pendingPrompt = null;
        buttons.forEach(item => { item.disabled = true; });
        try { await prompt.prompt(); await prompt.userChoice; }
        catch (_) { showGuide(); }
        finally { buttons.forEach(item => { item.disabled = false; }); refresh(); }
    }));
    refresh();
})();

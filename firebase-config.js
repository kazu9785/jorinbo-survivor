// Firebaseコンソールの「プロジェクトの設定」→「マイアプリ」に表示される値へ置き換えてください。
// この設定値はWebアプリに公開される前提の識別情報です。パスワードや秘密鍵は絶対に書かないでください。
var firebaseConfig = {
    apiKey: "AIzaSyBZipURnVGn4aUGou0zAXWjLsqs8kJCQPY",
  authDomain: "jorinbo-survivor-ba261.firebaseapp.com",
  projectId: "jorinbo-survivor-ba261",
  storageBucket: "jorinbo-survivor-ba261.firebasestorage.app",
  messagingSenderId: "436048124484",
  appId: "1:436048124484:web:78315a2aa51db353493a11"
};

var isFirebaseConfigured = !Object.values(firebaseConfig).some(value =>
    typeof value !== 'string' || value.includes('PASTE_YOUR_')
);
var auth = null;
var db = null;

if (isFirebaseConfigured) {
    try {
        firebase.initializeApp(firebaseConfig);
        auth = firebase.auth();
        db = firebase.firestore();
    } catch (error) {
        isFirebaseConfigured = false;
        console.error('Firebaseの初期化に失敗しました。firebase-config.jsを確認してください。', error);
    }
}

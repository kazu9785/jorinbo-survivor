# Ver.2.1.0　キャラ別育成と戦闘モーション

## Ver.2.0.0 からの更新

1. Firebase コンソールで、このゲームの Firestore Database →「ルール」を開き、同梱の `firestore.rules` を貼り付けて公開します。
2. 更新用 ZIP を展開し、ファイルをすべて GitHub の `index.html` と同じ場所に追加・上書きします。フォルダは作りません。
3. 公開後にゲームの「最新版に更新」を押します。「キャラクター育成」に22体が並び、加入済み・未加入のグループを選べます。

完全版で新しくセットアップする場合は、ご自身の設定済み `firebase-config.js` を使用してください。更新用 ZIP はこのファイルを含みません。

## 育成

見習いを含む全22体に3ルートずつ。各ルートはLv.5までで、選択した1ルートが次の挑戦から有効です。最高到達WAVEまたは使用回数の条件を満たし、コインで強化します。未加入の仲間も効果を試し読みできます。

| レベル | 到達WAVE | または使用回数 | コイン |
| --- | ---: | ---: | ---: |
| 1 | 3 | 2 | 100 G |
| 2 | 6 | 5 | 300 G |
| 3 | 10 | 10 | 700 G |
| 4 | 15 | 20 | 1,500 G |
| 5 | 20 | 35 | 3,000 G |

Ver.2.0.0からの初回読み込みで加入済みの仲間に当時の系統のレベル・選択ルート・最高WAVE・使用回数を引き継ぎます。以後の育成と記録は個別です。新規加入はLv.0から。装備は同じ系統で共用します。中断再開や開発テストで使用回数は増えません。

## 戦闘

全22体に歩幅や腕の振りが異なる歩行8コマ、射撃の前後、被弾姿勢を追加。敵は移動方向に向き、停止中は向きを保ちます。黄金スライムは逃げる方を向きます。敵のHPバーは水平に保ち、当たり判定は表示方向・ボスの形態に合わせて切り替わります。軽量モードでは歩行コマの切り替えを減らします。

## 更新ファイル（アルファベット順）

- `adventure.js`
- `build_hit_masks.py`
- `collision.js`
- `firestore.rules`
- `forge.js`
- `heroes.js`
- `index.html`
- `mastery.js`
- `motion-art.js`
- `oath.js`
- `script.js`
- `stride_astral.webp`
- `stride_balance.webp`
- `stride_bastion.webp`
- `stride_duelist.webp`
- `stride_echo.webp`
- `stride_falcon.webp`
- `stride_frost.webp`
- `stride_lunar.webp`
- `stride_medic.webp`
- `stride_phoenix.webp`
- `stride_power.webp`
- `stride_rookie.webp`
- `stride_scout.webp`
- `stride_solar.webp`
- `stride_spark.webp`
- `stride_speed.webp`
- `stride_storm.webp`
- `stride_tank.webp`
- `stride_tempest.webp`
- `stride_thorn.webp`
- `stride_tide.webp`
- `stride_void.webp`
- `training.js`
- `turn_boss00.webp`
- `turn_boss01.webp`
- `turn_boss02.webp`
- `turn_boss03.webp`
- `turn_boss04.webp`
- `turn_enemy00.webp`
- `turn_enemy01.webp`
- `turn_enemy02.webp`
- `turn_enemy03.webp`
- `turn_enemy04.webp`
- `turn_enemy05.webp`
- `turn_enemy06.webp`
- `turn_enemy07.webp`
- `VERSION_UPDATE.md`

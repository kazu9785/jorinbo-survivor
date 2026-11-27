# Ver.2.0.0　星契召喚
見習いは最初から使えます。冒険者・魔導士・レンジャー・重装騎士を含む仲間21体が、装備と同じガチャから登場します。以前に購入した仲間は引き継ぎます。

## Ver.1.9.7から更新する

1. Firebase コンソールでゲームのプロジェクトを開き、「Firestore Database」→「ルール」で、このZIP内の `firestore.rules` の全文を貼り付けて公開します。
2. 更新用ZIPを展開し、中のファイルをすべてGitHubの `index.html` と同じ階層にアップロードしてコミットします。キャラ画像と宝箱画像も同じ階層です。
3. GitHub Pagesの反映後、ゲームの「最新版に更新」を押します。「星契召喚」が表示されたら更新完了です。

完全版から移す場合は、今使っている設定済みの `firebase-config.js` を使ってください。新規セットアップ用の完全版にはテンプレートが入っています。

## 召喚のしくみ

1回10結晶、10連100結晶。各枠は独立抽選です。装備は95％、仲間は5％。下表は装備を含む全10万枠あたりの抽選枠です。実際の回数は前後します。同じランクの各キャラは同確率です。

| ランク | 仲間 | 10万枠あたり | 再会時のゴールド |
| --- | ---: | ---: | ---: |
| 銅章 | 6体 | 2,800 | 100 G |
| 翠章 | 5体 | 1,300 | 250 G |
| 蒼紋 | 4体 | 600 | 600 G |
| 紫紋 | 3体 | 240 | 1,500 G |
| 伝説 | 2体 | 55 | 4,000 G |
| 神話 | 1体 | 5 | 10,000 G |

仲間はキャラ選択へ、装備はボックスへ入ります。仲間の宝箱には6種の専用イラストがあります。10連は左上から開封します。ボックスには引く回数分の空きが必要です。再会時のゴールドは所持上限まで加算します。

装備と育成は所属系統で共有します。見習いは独自の育成と冒険者系装備を使います。キャラクター別のランキングは各人を個別に集計します。

## 更新ファイル（アルファベット順）

- `adventure.js`
- `build_hit_masks.py`
- `collision.js`
- `equipment.js`
- `firestore.rules`
- `hero_astral.png`
- `hero_bastion.png`
- `hero_duelist.png`
- `hero_echo.png`
- `hero_falcon.png`
- `hero_frost.png`
- `hero_lunar.png`
- `hero_medic.png`
- `hero_phoenix.png`
- `hero_scout.png`
- `hero_solar.png`
- `hero_spark.png`
- `hero_storm.png`
- `hero_tempest.png`
- `hero_thorn.png`
- `hero_tide.png`
- `hero_void.png`
- `heroes.js`
- `index.html`
- `oath.js`
- `oath_astral.webp`
- `oath_bastion.webp`
- `oath_chests.webp`
- `oath_duelist.webp`
- `oath_echo.webp`
- `oath_falcon.webp`
- `oath_frost.webp`
- `oath_lunar.webp`
- `oath_medic.webp`
- `oath_phoenix.webp`
- `oath_scout.webp`
- `oath_solar.webp`
- `oath_spark.webp`
- `oath_storm.webp`
- `oath_tempest.webp`
- `oath_thorn.webp`
- `oath_tide.webp`
- `oath_void.webp`
- `presentation.js`
- `script.js`
- `style.css`
- `training.js`
- `VERSION_UPDATE.md`

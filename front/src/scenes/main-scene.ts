/**
 * @author       Digitsensitive <digit.sensitivee@gmail.com>
 * @copyright    2018 - 2019 digitsensitive
 * @description  Coin Runner: Game Scene
 * @license      Digitsensitive
 */

import { Coin } from "../objects/coin";
import { Player } from "../objects/player";

import { getGameApiClient } from "../gameApi"
import { CoinStatus } from './interface';

/* とりあえず部屋固定 */
const roomId = '1';

export class GameScene extends Phaser.Scene {
  private background: Phaser.GameObjects.Image;
  private coinsCollectedText: Phaser.GameObjects.Text;
  private collectedCoins: number;
  private player: Player;
  private otherPlayers: {[id: string]: Player};

  private playerId: string;
  private playerName: string;
  private playerIdText: Phaser.GameObjects.Text;
  private playerNameText: Phaser.GameObjects.Text;
  private connectedPlayersCountText: Phaser.GameObjects.Text;

  private initFinished: boolean = false;

  private nowSyncingOtherPlayers: boolean = false;
  private otherPlaerSyncFPS: number = 3;
  private currentFrameIndex: number = 0;
  private serverUnixTimes: {[key: string]: number};

  private coins: {[id: string]: Coin};
  private isSyncingCoin: boolean = false;
  private coinModels: {[id: string]: CoinStatus};

  constructor() {
    super({
      key: "GameScene"
    });
  }

  preload(): void {
    this.load.image(
      "background",
      "./assets/background.png"
    );
    this.load.image("player", "./assets/player.png");
    this.load.image("coin", "./assets/coin.png");
  }

  init(data): void {
    this.collectedCoins = 0;
    this.playerName = data.name;
    this.playerId = data.id;
    console.log(data);
    this.coins = {};
    this.otherPlayers = {};
    this.serverUnixTimes = {};
    this.coinModels = {};
  }

  async create(): Promise<void> {
    this.initFinished = false;

    // create background
    this.background = this.add.image(0, 0, "background");
    this.background.setOrigin(0, 0);

    const res = await getGameApiClient().cli.put('rooms/' + roomId, {
      status: 'init'
    });

    const roomData = res.data;

    for (const initialCoin of roomData.coins) {
      this.activateNewCoin(initialCoin);
    }

    // create objects
    this.player = new Player({
      scene: this,
      x: this.sys.canvas.width / 2,
      y: this.sys.canvas.height / 2,
      key: "player"
    });
    this.player.id = this.playerId;

    // create texts
    this.coinsCollectedText = this.add.text(
      this.sys.canvas.width / 2,
      this.sys.canvas.height - 50,
      this.collectedCoins + "",
      {
        fontFamily: "Connection",
        fontSize: 38,
        stroke: "#fff",
        strokeThickness: 6,
        fill: "#000000"
      }
    );

    // display player info
    this.playerIdText = this.add.text(
      0,
      28,
      'id: ' + this.playerId + "",
      {
        fontFamily: "Connection",
        fontSize: 20,
        stroke: "#fff",
        strokeThickness: 4,
        fill: "#000000"
      }
    );

    this.playerNameText = this.add.text(
      0,
      0,
      'player: ' + this.playerName + "",
      {
        fontFamily: "Connection",
        fontSize: 20,
        stroke: "#fff",
        strokeThickness: 4,
        fill: "#000000"
      }
    );
    this.connectedPlayersCountText = this.add.text(
      0,
      this.sys.canvas.height - 30,
      '接続数: ' + Object.keys(this.otherPlayers).length + "",
      {
        fontFamily: "Connection",
        fontSize: 20,
        stroke: "#fff",
        strokeThickness: 4,
        fill: "#000000"
      }
    );
    this.initFinished = true;
  }

  async update(): Promise<void> {
    if (!this.initFinished) {
      return;
    }
    // update objects
    this.player.update(this.currentFrameIndex);
    Object.keys(this.coins).forEach(id => {
      const coin = this.coins[id];
      coin.update();
      // do the collision check
        if (
          coin.visible && Phaser.Geom.Intersects.RectangleToRectangle(
            this.player.getBounds(),
            coin.getBounds()
          )
        ) {
          this.updateCoin(coin);
        }
    });

    await this.syncCoins();
    await this.syncOtherPlayers();
    this.currentFrameIndex++;
  }

  private updateCoin(coin: Coin): void {
    // ローカルで取得済みリストに追加して非表示にする
    if (this.coinModels[coin.id] === CoinStatus.ACTIVE) {
      this.coinModels[coin.id] = CoinStatus.LOCAL_GAINED;
      coin.visible = false;
    }
  }

  async syncOtherPlayers(): Promise<void> {
    if (this.nowSyncingOtherPlayers || (this.currentFrameIndex % this.otherPlaerSyncFPS) !== 0) {
      return;
    }

    this.nowSyncingOtherPlayers = true;
    const res = await getGameApiClient().cli.get('rooms/' + roomId + '/players')
    .catch(err => console.log(err));
    if (!res) {
      this.nowSyncingOtherPlayers = false;
      return;
    }
    const val = res.data;

    if (!this.serverUnixTimes['players']) {
      this.serverUnixTimes['players'] = val.serverUnixTime;
    }
    // 古いレスポンスが返ってきたら無視
    if (this.serverUnixTimes['players'] >= val.serverUnixTime) {
      this.nowSyncingOtherPlayers = false;
      return;
    }
    this.serverUnixTimes['players'] = val.serverUnixTime;

    for (const p of val.players) {
      if (p.id === this.player.id) {
        continue;
      }

      if (!this.otherPlayers[p.id]) {
        const o = new Player({
          scene: this,
          x: p.x,
          y: p.y,
          key: "player"
        });
        o.id = p.id;
        this.otherPlayers[p.id] = o;
      } else {
        const target = this.otherPlayers[p.id];
        target.x = p.x;
        target.y = p.y;
      }
    }
    // サーバ側のレスポンスに含まれなくなった他のプレイヤーのオブジェクトを削除
    for (const o of Object.keys(this.otherPlayers)) {
      const t = this.otherPlayers[o];
      let incluedRes = false;
      for (const p of val.players) {
        if (t.id === p.id) {
          incluedRes = true;
        }
      }
      if (!incluedRes) {
        t.destroy();
      }
    }
    this.connectedPlayersCountText.setText('接続数: ' + (Object.keys(this.otherPlayers).length + 1) +'');
    this.nowSyncingOtherPlayers = false;
  }

  private async syncCoins(): Promise<void> {
    if (this.isSyncingCoin) {
      return;
    }
    this.isSyncingCoin = true;

    // 取得したコインをサーバに送信する
    // サーバから正常応答が返ってくるまでは問い合わせリストから要素は削除しない
    Object.keys(this.coinModels).forEach(async id => {
      const coinStatus = this.coinModels[id];
      if (coinStatus === CoinStatus.LOCAL_GAINED) {
        const coin = this.coins[id];
        const res = await getGameApiClient().cli.put('rooms/' + roomId + '/coins/' + coin.id, {
          id: coin.id,
          x: coin.x,
          y: coin.y,
          gained: true
        }).catch(err => console.log(err));
        
        if (res) {
          const result = res.data;
          if (result.newCoin) {
            // コインを取得できた場合のみカウントを増やす
            this.collectedCoins++;
            this.coinsCollectedText.setText(this.collectedCoins + '');
          }
          this.coinModels[coin.id] = CoinStatus.PROCESSED;
        }
      }
    });
    
    // 他のコイン状況を取得
    const res = await getGameApiClient().cli.get('rooms/' + roomId + '/coins')
    .catch(err => {
      return;
    });
    if (!res) {
      this.isSyncingCoin = false;
      return;
    }
    const val = res.data;

    if (!this.serverUnixTimes['coins']) {
      this.serverUnixTimes['coins'] = val.serverUnixTime;
    }
    // 古いレスポンスが返ってきたら無視
    if (this.serverUnixTimes['coins'] >= val.serverUnixTime) {
      this.isSyncingCoin = false;
      return;
    }
    this.serverUnixTimes['coins'] = val.serverUnixTime;

    for (const remoteCoin of val.coins) {
      if (!this.coins[remoteCoin.id]) {
        this.activateNewCoin(remoteCoin);
      }
    }

    // NOTE: 処理済みのコインを開放
    Object.keys(this.coinModels).forEach(async id => {
      const coinStatus = this.coinModels[id];
      if (coinStatus === CoinStatus.PROCESSED) {
        const coin = this.coins[id];
        if (coin) coin.destroy();
        if (this.coinModels[id]) delete this.coinModels[id];
        if (this.coins[id]) delete this.coins[id];
      }
    });

    this.isSyncingCoin = false;
  }

  private activateNewCoin(newCoin: Coin): void {
    this.coinModels[newCoin.id] = CoinStatus.ACTIVE;
    this.coins[newCoin.id] = this.generateCoinObject(newCoin.id, newCoin.x, newCoin.y);
  }

  private generateCoinObject(id: string, x: number, y: number): Coin {
    const newCoin = new Coin({
      scene: this,
      x: x,
      y: y,
      key: 'coin'
    });
    newCoin.id = id;
    return newCoin;
  }
}

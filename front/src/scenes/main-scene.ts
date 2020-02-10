/**
 * @author       Digitsensitive <digit.sensitivee@gmail.com>
 * @copyright    2018 - 2019 digitsensitive
 * @description  Coin Runner: Game Scene
 * @license      Digitsensitive
 */

import { Coin } from "../objects/coin";
import { Player } from "../objects/player";

import { getGameApiClient } from "../gameApi"

/* とりあえず部屋固定 */
const roomId = '1';

export class GameScene extends Phaser.Scene {
  private background: Phaser.GameObjects.Image;
  private coins: Coin[];
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
  private nowSyncingCoin: boolean = false;
  private otherPlaerSyncFPS: number = 3;
  private currentFrameIndex: number = 0;

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
    this.coins = [];
    this.otherPlayers = {};
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

    for (const coin of roomData.coins) {
      const newCoin = new Coin({
        scene: this,
        x: coin.x,
        y: coin.y,
        key: 'coin'
      });
      newCoin.id = coin.id;
      this.coins.push(newCoin);
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

    // this.coin.update();
    this.coins.forEach(c => {
      c.update();
    // do the collision check
      if (
        Phaser.Geom.Intersects.RectangleToRectangle(
          this.player.getBounds(),
          c.getBounds()
        )
      ) {
        if (!this.nowSyncingCoin) {
          this.updateCoinStatus(c);
        }
      }
    })

    if (!this.nowSyncingOtherPlayers && (this.currentFrameIndex % this.otherPlaerSyncFPS) === 0) {
      this.startSyncOtherPlayers()
    }
    await this.updateAllCoinLocation();
    this.currentFrameIndex++;
  }

  async startSyncOtherPlayers(): Promise<void> {
    this.nowSyncingOtherPlayers = true;
    const res = await getGameApiClient().cli.get('rooms/' + roomId + '/players')
    .catch(err => console.log(err));
    if (!res) {
      this.nowSyncingOtherPlayers = false;
      return;
    }
    const players = res.data;
    for (const p of players.players) {
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
        // console.log(p.x, p.y);
        const target = this.otherPlayers[p.id];
        target.x = p.x;
        target.y = p.y;
      }
    }
    // サーバー側のレスポンスに含まれなくなった他のプレイヤーのオブジェクトを削除
    for (const o of Object.keys(this.otherPlayers)) {
      const t = this.otherPlayers[o];
      let incluedRes = false;
      for (const p of players.players) {
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

  private async updateCoinStatus(coin: Coin): Promise<void> {
    this.nowSyncingCoin = true;
    const res = await getGameApiClient().cli.put('rooms/' + roomId + '/coins/' + coin.id, {
      id: coin.id,
      x: coin.x,
      y: coin.y,
      gained: true
    }).catch(err => console.log(err));

    if (res) {
      const result = res.data;
      // コインを取得できた場合のみアップデートする
      if (result.newCoin) {
        this.collectedCoins++;
        this.coinsCollectedText.setText(this.collectedCoins + '');
        
        coin.id = result.newCoin.id;
        coin.changePosition(result.newCoin.x, result.newCoin.y);
      } else if (result.nextCoin){
        coin.id = result.nextCoin.id;
        coin.changePosition(result.nextCoin.x, result.nextCoin.y); 
      }
    }
    this.nowSyncingCoin = false;
  }

  private async updateAllCoinLocation(): Promise<void> {
    const res = await getGameApiClient().cli.get('rooms/' + roomId + '/coins').catch(err => console.log(err));
    if (!res) {
      return;
    }
    const coinLocation = res.data;

    // NOTE: ローカルにないコインをリモートの新しいコインで上書きする部分
    // NOTE: いい感じのアルゴリズムが思い浮かばなかったので力技でやっています
    const updatableLocalCoinObjects: Coin[] = [];
    for (const lc of this.coins) {
      let hasNotSameCoinId = false
      for (const sc of coinLocation.coins) {
        sc.needSync = true;
        if (sc.id === lc.id) {
          hasNotSameCoinId = true;
          sc.needSync = false;
        }
      }
      if (!hasNotSameCoinId) {
        updatableLocalCoinObjects.push(lc);
      }
    }

    const needSyncRemoteCoins = [];
    for (const sc of coinLocation.coins) {
      if (!sc.needSync) {
        continue;
      }
      needSyncRemoteCoins.push(sc);
    }

    for (let i = 0; i < updatableLocalCoinObjects.length; i++) {
      const local = updatableLocalCoinObjects[i];
      const remote = needSyncRemoteCoins[i];
      local.id = remote.id;
      local.x = remote.x;
      local.y = remote.y;
    }
  }
}

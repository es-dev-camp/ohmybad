/**
 * @author       Digitsensitive <digit.sensitivee@gmail.com>
 * @copyright    2018 - 2019 digitsensitive
 * @description  Coin Runner: Game Scene
 * @license      Digitsensitive
 */

import { Coin } from "../objects/coin";
import { Player } from "../objects/player";

export class GameScene extends Phaser.Scene {
  private background: Phaser.GameObjects.Image;
  private coin: Coin;
  private coinsCollectedText: Phaser.GameObjects.Text;
  private collectedCoins: number;
  private player: Player;

  private playerId: string;
  private playerName: string;
  private playerIdText: Phaser.GameObjects.Text;
  private playerNameText: Phaser.GameObjects.Text;

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
  }

  create(): void {
    // create background
    this.background = this.add.image(0, 0, "background");
    this.background.setOrigin(0, 0);

    // create objects
    this.coin = new Coin({
      scene: this,
      x: Phaser.Math.RND.integerInRange(100, 700),
      y: Phaser.Math.RND.integerInRange(100, 500),
      key: "coin"
    });
    this.player = new Player({
      scene: this,
      x: this.sys.canvas.width / 2,
      y: this.sys.canvas.height / 2,
      key: "player"
    });

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
  }

  update(): void {
    // update objects
    this.player.update();
    this.coin.update();

    // do the collision check
    if (
      Phaser.Geom.Intersects.RectangleToRectangle(
        this.player.getBounds(),
        this.coin.getBounds()
      )
    ) {
      this.updateCoinStatus();
    }
  }

  private updateCoinStatus(): void {
    this.collectedCoins++;
    this.coinsCollectedText.setText(this.collectedCoins + "");
    this.coin.changePosition();
  }
}

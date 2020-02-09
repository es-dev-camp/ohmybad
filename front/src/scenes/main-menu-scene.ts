/**
 * @author       Digitsensitive <digit.sensitivee@gmail.com>
 * @copyright    2018 - 2019 digitsensitive
 * @description  Flappy Bird: Main Menu Scene
 * @license      Digitsensitive
 */

import { getGameApiClient } from "../gameApi"

export class MainMenuScene extends Phaser.Scene {
  private startKey: Phaser.Input.Keyboard.Key;
  private titleBitmapText: Phaser.GameObjects.Text;
  private playBitmapText: Phaser.GameObjects.Text;
  private nowGameStarting: boolean;

  constructor() {
    super({
      key: "MainMenuScene"
    });
  }

  init(): void {
    this.startKey = this.input.keyboard.addKey(
      Phaser.Input.Keyboard.KeyCodes.S
    );
    this.startKey.isDown = false;
    this.nowGameStarting = false;
  }

  create(): void {

    this.titleBitmapText = this.add.text(
      this.sys.canvas.width / 2,
      this.sys.canvas.height - 50,
      "COIN RUNER",
      {
        fontFamily: "Connection",
        fontSize: 38,
        stroke: "#fff",
        strokeThickness: 6,
        fill: "#000000"
      }
    );

    this.titleBitmapText.x = this.getCenterXPositionOfBitmapText(
      this.titleBitmapText.width
    );

    this.playBitmapText = this.add.text(0, 300, "S: PLAY NEW GAME", {
      fontFamily: "Connection",
      fontSize: 38,
      stroke: "#fff",
      strokeThickness: 6,
      fill: "#000000"
    });

    this.playBitmapText.x = this.getCenterXPositionOfBitmapText(
      this.playBitmapText.width
    );
  }

  async update(): Promise<void> {
    if (this.nowGameStarting) {
      return;
    }

    if (this.startKey.isDown) {
      this.nowGameStarting = true;
      const res = await getGameApiClient().cli.post('players');
      const newPlayer = {
        id: res.data.id,
        name: res.data.name
      };
      // 次のsceneのinitに渡される
      this.scene.start("GameScene", newPlayer);
    }
  }

  private getCenterXPositionOfBitmapText(width: number): number {
    return this.sys.canvas.width / 2 - width / 2;
  }
}
/**
 * @author       Digitsensitive <digit.sensitivee@gmail.com>
 * @copyright    2018 - 2019 digitsensitive
 * @description  Coin Runner: Player
 * @license      Digitsensitive
 */

import { getGameApiClient } from "../gameApi"


export class Player extends Phaser.GameObjects.Image {
  private cursors: Phaser.Types.Input.Keyboard.CursorKeys;
  private walkingSpeed: number;
  public id: string;

  constructor(params) {
    super(params.scene, params.x, params.y, params.key);

    this.initVariables();
    this.initImage();
    this.initInput();

    this.scene.add.existing(this);
  }

  private initVariables(): void {
    this.walkingSpeed = 5;
  }

  private initImage(): void {
    this.setOrigin(0.5, 0.5);
  }

  private initInput(): void {
    this.cursors = this.scene.input.keyboard.createCursorKeys();
  }

  async update(): Promise<void> {
    this.handleInput();

    // ゲームサーバ側の値で現在地を補正
    const res = await getGameApiClient().cli.put('rooms/1/players/' + this.id, {
      id: this.id,
      x: this.x,
      y: this.y
    }).catch(err => console.log(err));
    if (res) {
      const serverValue = res.data;
      this.x = serverValue.x;
      this.y = serverValue.y;
    }
  }

  private handleInput(): void {
    if (this.cursors.right.isDown) {
      this.x += this.walkingSpeed;
      this.setFlipX(false);
    } else if (this.cursors.left.isDown) {
      this.x -= this.walkingSpeed;
      this.setFlipX(true);
    } else if (this.cursors.up.isDown) {
      this.y -= this.walkingSpeed;
    } else if (this.cursors.down.isDown) {
      this.y += this.walkingSpeed;
    }
  }
}

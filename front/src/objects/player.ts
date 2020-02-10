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
  private serverLocationX: number;
  private serverLocationY: number;

  constructor(params) {
    super(params.scene, params.x, params.y, params.key);

    this.initVariables();
    this.initImage();
    this.initInput();

    this.scene.add.existing(this);
  }

  private initVariables(): void {
    this.walkingSpeed = 5;
    this.serverLocationX = this.x;
    this.serverLocationY = this.y;
  }

  private initImage(): void {
    this.setOrigin(0.5, 0.5);
  }

  private initInput(): void {
    this.cursors = this.scene.input.keyboard.createCursorKeys();
  }

  async update(frameIndex: number): Promise<void> {
    const preLocation = {
      x: this.x,
      y: this.y
    };
    this.handleInput();

    // 直前の位置と違う、または、サーバ側と同期できていない場合は自分の位置送り続ける
    if (this.x !== preLocation.x || this.y !== preLocation.y
      || this.x !== this.serverLocationX || this.y !== this.serverLocationY) {
      // ゲームサーバ側の値で現在地を補正
      const res = await getGameApiClient().cli.put('rooms/1/players/' + this.id, {
        id: this.id,
        x: this.x,
        y: this.y,
        lastUpdatedIndex: frameIndex,
      }).catch(err => console.log(err));
      if (res) {
        this.serverLocationX = res.data.x;
        this.serverLocationY = res.data.y;
      }
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

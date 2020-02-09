/**
 * @author       Digitsensitive <digit.sensitivee@gmail.com>
 * @copyright    2018 - 2019 digitsensitive
 * @description  Coin Runner: Coin
 * @license      Digitsensitive
 */

export class Coin extends Phaser.GameObjects.Image {
  public id: string;

  constructor(params) {
    super(params.scene, params.x, params.y, params.key);
    this.initImage();

    this.scene.add.existing(this);
  }

  private initImage(): void {
    this.setOrigin(0.5, 0.5);
  }

  update(): void {}

  public changePosition(x: number, y: number): void {
    this.x = x;
    this.y = y;
  }
}

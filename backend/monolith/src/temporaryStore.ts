import { PlayerLocation } from './entity/room';

export class TemporaryStore {
  private static _instance: TemporaryStore;
  public playerLocations: {
    [roomId: string]: {
      [playerId: string]: PlayerLocation}
    } = {};

  private constructor() {
  }

  public static get instance(): TemporaryStore {
    if (!this._instance) {
      this._instance = new TemporaryStore();
    }

    return this._instance;
  }
}
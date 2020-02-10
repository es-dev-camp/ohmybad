export class Room {
  id: string;
  status: string;
}

export const roomSchema = {
  id: { type: 'string', required: false, example: '12345' },
  status: { type: 'string', required: true, example: 'start' },
};

export class PlayerLocation {
  id: string;
  x: number;
  y: number;
  lastUpdatedIndex: number;
}

export const playerLocationScheme = {
  id: { type: 'string', required: true, example: '12345' },
  x: { type: 'number', required: true, example: 123 },
  y: { type: 'number', required: true, example: 123 },
  lastUpdatedIndex: { type: 'number', required: true, example: 123 },
};

export class CoinLocation {
  id: string;
  x: number;
  y: number;
  gained: boolean;
  nextCoin?: CoinLocation;

  constructor(id: string, x: number, y: number) {
    this.id = id;
    this.x = x;
    this.y = y;
    this.gained = false;
  }
}

export const coinLocationScheme = {
  id: { type: 'string', required: true, example: '12345' },
  x: { type: 'number', required: true, example: 123 },
  y: { type: 'number', required: true, example: 123 },
  gained: { type: 'number', require: true, example: false },
};

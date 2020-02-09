export class Player {
  id: string;
  name: string;
  highScore: number;
}

export const playerSchema = {
  id: { type: 'string', required: false, example: '12345' },
  name: { type: 'string', required: true, example: 'Javier' },
  highScore: { type: 'number', required: false, example: 1 },
};

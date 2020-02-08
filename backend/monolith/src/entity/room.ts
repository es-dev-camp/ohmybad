export class Room {
  id: string;
  status: string;
}

export const roomSchema = {
  id: { type: 'string', required: false, example: '12345' },
  status: { type: 'string', required: true, example: 'start' },
};

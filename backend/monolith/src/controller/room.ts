import { BaseContext } from 'koa';
import { validate, ValidationError } from 'class-validator';
import { request, summary, body, responsesAll, tagsAll } from 'koa-swagger-decorator';
import { Room, roomSchema } from '../entity/room';
import { idGenerator } from '../util';

@responsesAll({ 200: { description: 'success'}, 400: { description: 'bad request'}, 401: { description: 'unauthorized, missing/wrong jwt token'}})
@tagsAll(['Room'])
export default class PlayerController {
  @request('post', '/rooms')
  @summary('Create a room')
  @body(roomSchema)
  public static async createRoom(ctx: BaseContext) {
    // get a user repository to perform operations with user
    // const userRepository: Repository<User> = getManager().getRepository(User);

    // build up entity user to be saved
    console.log(ctx.request.body);
    const newRoom: Room = new Room();

    // validate user entity
    const errors: ValidationError[] = await validate(newRoom); // errors is an array of validation errors

    if (errors.length > 0) {
      // return BAD REQUEST status code and errors array
      ctx.status = 400;
      ctx.body = errors;
    } else {
      const randomString = (choices: string, len: number): string => {
        const cl: number = choices.length;
        let result = '';
        for (let i = 0; i < len; i++) {
          result += choices[Math.floor(Math.random() * cl)];
        }
        return result;
      };

      const rand = randomString('0123456789', 50);
      newRoom.id = rand;
      // save the user contained in the POST body
      // const user = await userRepository.save(userToBeSaved);
      // return CREATED status code and updated user
      ctx.status = 201;
      ctx.body = newRoom;
    }
  }

  @request('put', '/rooms/{id}')
  @summary('Update a room')
  @body(roomSchema)
  public static async changeRoomStatus(ctx: BaseContext) {
    const maxCoinNum: number = 2;
    // get a user repository to perform operations with user
    // const userRepository: Repository<User> = getManager().getRepository(User);

    // build up entity user to be saved
    console.log(ctx.request.body);
    const roomObj: Room = new Room();

    roomObj.id = ctx.params.id || ''; // will always have a number, this will avoid errors
    roomObj.status = ctx.request.body.status;

    // validate user entity
    const errors: ValidationError[] = await validate(roomObj); // errors is an array of validation errors

    if (errors.length > 0) {
      // return BAD REQUEST status code and errors array
      ctx.status = 400;
      ctx.body = errors;
    } else {

      ctx.body = roomObj;
      if (roomObj.status === 'init') {
        const initialCoins: ICoin[] = [];
        for (let x = 0; x < maxCoinNum; x++) {
          initialCoins.push(crateNewCoin());
        }
        ctx.body = {
          ...ctx.body,
          coins: initialCoins
        };
      }

      // save the user contained in the POST body
      // const user = await userRepository.save(userToBeSaved);
      // return CREATED status code and updated user
      ctx.status = 201;
    }
  }
}


function crateNewCoin() {
  const xy: ICoin = {
    id: idGenerator(50),
    x: Math.floor(700 * Math.random()),
    y: Math.floor(500 * Math.random())
  };
  return xy;
}

interface ICoin {
  id: string;
  x: number;
  y: number;
}

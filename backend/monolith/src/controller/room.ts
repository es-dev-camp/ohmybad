import { BaseContext } from 'koa';
import { validate, ValidationError } from 'class-validator';
import { request, summary, body, responsesAll, tagsAll } from 'koa-swagger-decorator';
import {
  Room,
  roomSchema,
  PlayerLocation,
  playerLocationScheme,
  CoinLocation,
  coinLocationScheme
} from '../entity/room';
import { idGenerator } from '../util';
import { TemporaryStore } from '../temporaryStore';

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

  @request('get', '/rooms/{room_id}/players')
  @summary('Get player locations in a room')
  @body(playerLocationScheme)
  public static async getPlayerLocation(ctx: BaseContext) {
    const store = TemporaryStore.instance;

    // build up entity user to be saved
    console.log(ctx.request.body);
    const playerLocations: PlayerLocation[] = [];

    const roomId = ctx.params.room_id || '';

    if (store.playerLocations[roomId]) {
      for (const key of Object.keys(store.playerLocations[roomId])) {
        const p = store.playerLocations[roomId][key];
        playerLocations.push(p);
      }
    }
    ctx.body = {
      players: playerLocations
    };
    ctx.status = 201;
  }

  @request('put', '/rooms/{room_id}/players/{player_id}')
  @summary('Update a player location in a room')
  @body(playerLocationScheme)
  public static async updatePlayerLocation(ctx: BaseContext) {
    const store = TemporaryStore.instance;

    // build up entity user to be saved
    console.log(ctx.request.body);
    const playerLocation: PlayerLocation = new PlayerLocation();

    const roomId = ctx.params.room_id || '';
    const playerId = ctx.params.player_id || ''; // will always have a number, this will avoid errors

    playerLocation.id = playerId;
    playerLocation.x = ctx.request.body.x;
    playerLocation.y = ctx.request.body.y;

    // validate user entity
    const errors: ValidationError[] = await validate(playerLocation); // errors is an array of validation errors

    if (errors.length > 0) {
      // return BAD REQUEST status code and errors array
      ctx.status = 400;
      ctx.body = errors;
    } else {

      // 接続しているプレイヤーの位置情報をメモリに保持
      if (!store.playerLocations[roomId]) {
        store.playerLocations[roomId] = {};
      }
      if (!store.playerLocations[roomId][playerId]) {
        store.playerLocations[roomId][playerId] = playerLocation;
      }

      // 今は特に調停せずそのまま返す
      ctx.body = playerLocation;

      // save the user contained in the POST body
      // const user = await userRepository.save(userToBeSaved);
      // return CREATED status code and updated user
      ctx.status = 201;
    }
  }

  @request('put', '/rooms/{room_id}/coins/{coin_id}')
  @summary('Update a coin location in a room')
  @body(coinLocationScheme)
  public static async updateCoinLocation(ctx: BaseContext) {
    // get a user repository to perform operations with user
    // const userRepository: Repository<User> = getManager().getRepository(User);

    // build up entity user to be saved
    console.log(ctx.request.body);
    const coinLocation: CoinLocation = new CoinLocation();

    coinLocation.id = ctx.params.coin_id || ''; // will always have a number, this will avoid errors
    coinLocation.x = ctx.request.body.x;
    coinLocation.y = ctx.request.body.y;
    coinLocation.gained = ctx.request.body.gained;

    // validate user entity
    const errors: ValidationError[] = await validate(coinLocation); // errors is an array of validation errors

    if (errors.length > 0) {
      // return BAD REQUEST status code and errors array
      ctx.status = 400;
      ctx.body = errors;
    } else {

      ctx.body = coinLocation;
      if (coinLocation.gained) {
        const newCoin = crateNewCoin();
        ctx.body = {
          ...ctx.body,
          newCoin: {
            ...newCoin,
            gained: false
          }
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
